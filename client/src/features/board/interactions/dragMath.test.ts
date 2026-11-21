import { listWeeks } from '../../../domain/dates';
import type { ImpactEntry } from '../../../domain/planningActions';
import type { Assignment, Employee } from '../../../domain/types';
import { createGeometry } from '../layout';
import {
  computeDragTarget,
  DRAFT_ID,
  dragHint,
  exceedsThreshold,
  formatWeekRange,
  hypotheticalAssignments,
  isUnchanged,
  projectLoads,
  resultMessages,
  snapWeeks,
  weekNumber,
} from './dragMath';
import { historyCommand, isTypingTarget } from './useUndoShortcuts';

// 2026-11-09 is the Monday of KW 46; 8 visible weeks of 100 px (KW 46 … KW 53).
const weeks = listWeeks('2026-11-09', '2027-01-03');
const geom = createGeometry(weeks, 100);

const lukas: Employee = { id: 'e1', name: 'Lukas Müller', role: 'Backend', seniority: 'lead', capacity: 1, active: true };
const anna: Employee = { id: 'e2', name: 'Anna Schmidt', role: 'Frontend', seniority: 'senior', capacity: 1, active: true };
// KW 48 – KW 49 (Mon 23.11. – Fri 04.12.)
const a1: Assignment = { id: 'a1', employeeId: 'e1', projectId: 'p1', start: '2026-11-23', end: '2026-12-04', allocation: 60 };
const a2: Assignment = { id: 'a2', employeeId: 'e1', projectId: 'p2', start: '2026-11-30', end: '2026-12-18', allocation: 60 };

const base = { geometry: geom, assignment: a1, originEmployeeId: 'e1' };

describe('threshold and snapping', () => {
  it('a press stays a click below 4 px of travel', () => {
    expect(exceedsThreshold(2, 2)).toBe(false);
    expect(exceedsThreshold(3, 3)).toBe(true);
    expect(exceedsThreshold(0, -4)).toBe(true);
  });

  it('snaps a horizontal delta to the nearest whole week', () => {
    expect(snapWeeks(0, 100)).toBe(0);
    expect(snapWeeks(49, 100)).toBe(0);
    expect(snapWeeks(51, 100)).toBe(1);
    expect(snapWeeks(-151, 100)).toBe(-2);
    expect(Object.is(snapWeeks(-10, 100), -0)).toBe(false);
  });
});

describe('computeDragTarget', () => {
  it('move: shifts start and end by whole weeks and keeps the row', () => {
    expect(computeDragTarget({ ...base, mode: 'move', startX: 250, currentX: 360 })).toEqual({
      employeeId: 'e1',
      start: '2026-11-30',
      end: '2026-12-11',
      weeks: 1,
    });
    expect(computeDragTarget({ ...base, mode: 'move', startX: 250, currentX: 30 })).toMatchObject({
      start: '2026-11-09',
      end: '2026-11-20',
      weeks: -2,
    });
  });

  it('move: keeps mid-week days and changes the row under the pointer', () => {
    const midweek = { ...a1, start: '2026-11-25', end: '2026-12-02' };
    expect(
      computeDragTarget({ ...base, assignment: midweek, mode: 'move', hoverEmployeeId: 'e2', startX: 0, currentX: 100 }),
    ).toEqual({ employeeId: 'e2', start: '2026-12-02', end: '2026-12-09', weeks: 1 });
  });

  it('resize-end: snaps the end to the Friday before the nearest boundary, at least one week', () => {
    expect(computeDragTarget({ ...base, mode: 'resize-end', startX: 400, currentX: 480 })).toMatchObject({
      start: '2026-11-23',
      end: '2026-12-11', // boundary 5 (x 480 ≈ 500) → Friday of column 4 = KW 50
    });
    // dragged far left: minimum is the start's own week
    expect(computeDragTarget({ ...base, mode: 'resize-end', startX: 400, currentX: 0 })).toMatchObject({
      start: '2026-11-23',
      end: '2026-11-27',
    });
  });

  it('resize-start: snaps the start to a Monday, never after the end week', () => {
    expect(computeDragTarget({ ...base, mode: 'resize-start', startX: 200, currentX: 90 })).toMatchObject({
      start: '2026-11-16',
      end: '2026-12-04',
    });
    expect(computeDragTarget({ ...base, mode: 'resize-start', startX: 200, currentX: 790 })).toMatchObject({
      start: '2026-11-30', // Monday of the end's week
      end: '2026-12-04',
    });
  });

  it('create: whole weeks Mon–Fri between press and pointer, either direction', () => {
    const create = { geometry: geom, originEmployeeId: 'e2', mode: 'create' as const };
    expect(computeDragTarget({ ...create, startX: 310, currentX: 520 })).toEqual({
      employeeId: 'e2',
      start: '2026-11-30',
      end: '2026-12-18',
      weeks: 0,
    });
    expect(computeDragTarget({ ...create, startX: 520, currentX: 310 })).toMatchObject({ start: '2026-11-30', end: '2026-12-18' });
    expect(computeDragTarget({ ...create, startX: 10, currentX: 12 })).toMatchObject({ start: '2026-11-09', end: '2026-11-13' });
  });

  it('isUnchanged detects a drop on the original place', () => {
    expect(isUnchanged({ employeeId: 'e1', start: a1.start, end: a1.end, weeks: 0 }, a1)).toBe(true);
    expect(isUnchanged({ employeeId: 'e2', start: a1.start, end: a1.end, weeks: 0 }, a1)).toBe(false);
  });
});

describe('projection', () => {
  const target = { employeeId: 'e1', start: '2026-11-30', end: '2026-12-11', weeks: 1 };

  it('hypotheticalAssignments replaces the dragged one or adds a draft, without mutating', () => {
    const list = [a1, a2];
    const moved = hypotheticalAssignments(list, target, 'a1');
    expect(moved.find((a) => a.id === 'a1')).toMatchObject({ start: '2026-11-30', end: '2026-12-11' });
    expect(list[0].start).toBe('2026-11-23');
    const created = hypotheticalAssignments(list, { ...target, employeeId: 'e2' }, null, 40);
    expect(created).toHaveLength(3);
    expect(created[2]).toMatchObject({ id: DRAFT_ID, employeeId: 'e2', allocation: 40 });
  });

  it('projectLoads computes the affected rows and flags changed weeks', () => {
    const after = hypotheticalAssignments([a1, a2], target, 'a1');
    const p = projectLoads([lukas, anna], [a1, a2], after, ['e1', 'e1'], weeks);
    expect(Object.keys(p.loads)).toEqual(['e1']);
    expect(p.loads.e1['2026-W48'].utilization).toBe(0);
    expect(p.loads.e1['2026-W49'].utilization).toBe(120);
    expect(p.loads.e1['2026-W50'].utilization).toBe(120);
    expect([...p.changed.e1].sort()).toEqual(['2026-W48', '2026-W50']);
  });

  it('dragHint names weeks, person and peak, and flags overbooking', () => {
    const after = hypotheticalAssignments([a1, a2], target, 'a1');
    expect(dragHint(target, lukas, after)).toEqual({ text: 'KW 49–KW 50 · Lukas Müller · 120 % in KW 49', over: true, peak: 120 });
    const calm = dragHint({ ...target, employeeId: 'e2' }, anna, hypotheticalAssignments([a1], { ...target, employeeId: 'e2' }, 'a1'));
    expect(calm).toMatchObject({ text: 'KW 49–KW 50 · Anna Schmidt · 60 % in KW 49', over: false });
  });
});

describe('labels', () => {
  it('formats week ranges and numbers', () => {
    expect(formatWeekRange('2026-11-30', '2026-12-04')).toBe('KW 49');
    expect(formatWeekRange('2026-12-28', '2027-01-08')).toBe('KW 53–KW 1');
    expect(weekNumber('2027-W01')).toBe(1);
  });

  it('resultMessages lists overbooked weeks first, then other warnings', () => {
    const impact: ImpactEntry[] = [
      { employeeId: 'e1', weekKey: '2026-W50', weekStart: '2026-12-07', before: 60, after: 120, beforeStatus: 'ok', afterStatus: 'over' },
      { employeeId: 'e1', weekKey: '2026-W48', weekStart: '2026-11-23', before: 60, after: 0, beforeStatus: 'ok', afterStatus: 'free' },
    ];
    expect(
      resultMessages(
        impact,
        [
          { code: 'OVERBOOKED', message: 'Lukas Müller ist überbucht', weeks: ['2026-W50'] },
          { code: 'OUTSIDE_PROJECT', message: 'Außerhalb der Projektlaufzeit' },
        ],
        [lukas],
      ),
    ).toEqual(['KW 50: Lukas Müller 120 % – überbucht', 'Außerhalb der Projektlaufzeit']);
  });

  it('resultMessages fills overbooked weeks that did not change from the before state', () => {
    // a1 + a2 overlap in KW 49 (120 %); a move that keeps KW 49 covered does not change it.
    const warning = { code: 'OVERBOOKED' as const, message: 'raw', weeks: ['2026-W49', '2026-W50'] };
    const impact: ImpactEntry[] = [
      { employeeId: 'e1', weekKey: '2026-W50', weekStart: '2026-12-07', before: 60, after: 120, beforeStatus: 'ok', afterStatus: 'over' },
    ];
    expect(resultMessages(impact, [warning], [lukas], { employeeId: 'e1', assignmentsBefore: [a1, a2] })).toEqual([
      'KW 49: Lukas Müller 120 % – überbucht',
      'KW 50: Lukas Müller 120 % – überbucht',
    ]);
    expect(resultMessages([], [warning], [lukas])).toEqual(['raw']);
  });
});

describe('undo shortcuts', () => {
  const key = (k: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>> = {}) => ({
    key: k,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  });

  it('maps Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y', () => {
    expect(historyCommand(key('z', { ctrlKey: true }))).toBe('undo');
    expect(historyCommand(key('z', { metaKey: true }))).toBe('undo');
    expect(historyCommand(key('Z', { ctrlKey: true, shiftKey: true }))).toBe('redo');
    expect(historyCommand(key('y', { ctrlKey: true }))).toBe('redo');
    expect(historyCommand(key('z'))).toBeNull();
    expect(historyCommand(key('z', { ctrlKey: true, altKey: true }))).toBeNull();
  });

  it('recognises typing targets', () => {
    expect(isTypingTarget(document.createElement('input'))).toBe(true);
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true);
    expect(isTypingTarget(document.createElement('button'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
