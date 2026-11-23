import { LocalRepository } from '../data/localRepository';
import { addDays, addWeeks, startOfISOWeek, weekRef } from './dates';
import { createPlanningActions, historyLabelText, snapshotFromRepository, type ActionResult } from './planningActions';
import type { AssignmentInput } from './types';

const TODAY = '2026-11-21';
const W0 = startOfISOWeek(TODAY); // 2026-11-16
const mon = (n: number) => addWeeks(W0, n);
const fri = (n: number) => addDays(mon(n), 4);

// Seed ids (see data/seed.ts)
const FELIX = 'emp-06'; // free from week +4
const LUKAS = 'emp-02'; // exactly 100 % in weeks 0..+3
const NIKLAS = 'emp-14'; // inactive
const WEBSITE = 'prj-01'; // weeks -4..+6
const DATENPLATTFORM = 'prj-04';

function setup(onChange?: () => void) {
  let n = 0;
  const repo = new LocalRepository({ storage: null, today: TODAY, generateId: (p) => `${p}-t${(n += 1)}` });
  const actions = createPlanningActions(repo, () => snapshotFromRepository(repo), { onChange });
  return { repo, actions };
}

function expectOk<T>(r: ActionResult<T>): asserts r is Extract<ActionResult<T>, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r.errors)}`);
}

const felixInput = (over: Partial<AssignmentInput> = {}): AssignmentInput => ({
  employeeId: FELIX,
  projectId: WEBSITE,
  start: mon(4),
  end: fri(5),
  allocation: 50,
  ...over,
});

describe('createAssignment', () => {
  it('creates, reports impact before/after and notifies', async () => {
    const onChange = vi.fn();
    const { repo, actions } = setup(onChange);
    const r = await actions.createAssignment(felixInput());
    expectOk(r);
    expect(r.dryRun).toBe(false);
    expect(r.result.id).toMatch(/^asg-t/);
    expect(r.warnings).toEqual([]);
    expect(r.impact.map((i) => [i.weekKey, i.before, i.after, i.afterStatus])).toEqual([
      [weekRef(mon(4)).key, 0, 50, 'luft'],
      [weekRef(mon(5)).key, 0, 50, 'luft'],
    ]);
    expect(await repo.listAssignments({ employeeId: FELIX, from: mon(4) })).toHaveLength(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(actions.canUndo()).toBe(true);
    expect(actions.undoLabel()).toBe('Einsatz anlegen');
  });

  it('rejects blocking errors without writing', async () => {
    const onChange = vi.fn();
    const { repo, actions } = setup(onChange);
    const before = (await repo.listAssignments()).length;
    const r = await actions.createAssignment(felixInput({ allocation: 55, end: addDays(mon(4), -1) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.code)).toEqual(['END_BEFORE_START', 'ALLOCATION_STEP']);
    expect(await repo.listAssignments()).toHaveLength(before);
    expect(onChange).not.toHaveBeenCalled();
    expect(actions.canUndo()).toBe(false);
  });

  it('allows overbooking but warns with the affected weeks', async () => {
    const { actions } = setup();
    const r = await actions.createAssignment({
      employeeId: LUKAS,
      projectId: DATENPLATTFORM,
      start: mon(0),
      end: fri(1),
      allocation: 20,
    });
    expectOk(r);
    const over = r.warnings.find((w) => w.code === 'OVERBOOKED');
    expect(over?.weeks).toEqual([weekRef(mon(0)).key, weekRef(mon(1)).key]);
    expect(r.impact.every((i) => i.before === 100 && i.after === 120 && i.afterStatus === 'over')).toBe(true);
  });

  it('warns for inactive employees and dates outside the project', async () => {
    const { actions } = setup();
    const r = await actions.createAssignment(felixInput({ employeeId: NIKLAS, end: fri(8) }));
    expectOk(r);
    expect(r.warnings.map((w) => w.code)).toEqual(['INACTIVE_EMPLOYEE', 'OUTSIDE_PROJECT']);
  });

  it('dryRun returns the same shape without writing or history', async () => {
    const onChange = vi.fn();
    const { repo, actions } = setup(onChange);
    const before = await repo.listAssignments();
    const r = await actions.createAssignment(felixInput(), { dryRun: true });
    expectOk(r);
    expect(r.dryRun).toBe(true);
    expect(r.result.id).toBe('dry-run');
    expect(r.impact).toHaveLength(2);
    expect(await repo.listAssignments()).toEqual(before);
    expect(actions.canUndo()).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('update / move / delete assignment', () => {
  it('changes allocation with impact limited to changed weeks', async () => {
    const { repo, actions } = setup();
    const [lukasMobile] = await repo.listAssignments({ employeeId: LUKAS, projectId: 'prj-02' }); // 40 %, -2..+3
    const r = await actions.updateAssignment(lukasMobile.id, { allocation: 20 });
    expectOk(r);
    expect(r.result.allocation).toBe(20);
    expect(r.impact).toHaveLength(6);
    expect(r.impact.find((i) => i.weekKey === weekRef(mon(0)).key)).toMatchObject({ before: 100, after: 80, afterStatus: 'ok' });
  });

  it('moves by weeks and to another person; impact covers both people', async () => {
    const { repo, actions } = setup();
    const created = await actions.createAssignment(felixInput({ start: mon(4), end: fri(4) }));
    expectOk(created);
    const r = await actions.moveAssignment(created.result.id, { weeks: 2, employeeId: 'emp-10' });
    expectOk(r);
    expect(r.result).toMatchObject({ start: mon(6), end: fri(6), employeeId: 'emp-10' });
    const stored = (await repo.listAssignments()).find((a) => a.id === created.result.id);
    expect(stored).toMatchObject({ start: mon(6), employeeId: 'emp-10' });
    expect(r.impact.map((i) => [i.employeeId, i.weekKey, i.before, i.after])).toEqual([
      [FELIX, weekRef(mon(4)).key, 50, 0],
      ['emp-10', weekRef(mon(6)).key, 50, 100],
    ]);
  });

  it('resizes (start/end) and validates the merged result', async () => {
    const { actions } = setup();
    const created = await actions.createAssignment(felixInput());
    expectOk(created);
    const bad = await actions.updateAssignment(created.result.id, { end: addDays(mon(4), -3) });
    expect(bad.ok).toBe(false);
    const ok = await actions.updateAssignment(created.result.id, { end: fri(6) });
    expectOk(ok);
    expect(ok.impact.map((i) => i.weekKey)).toEqual([weekRef(mon(6)).key]);
  });

  it('returns NOT_FOUND for unknown ids', async () => {
    const { actions } = setup();
    const r = await actions.updateAssignment('nope', { allocation: 10 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0].code).toBe('NOT_FOUND');
    expect((await actions.deleteAssignment('nope')).ok).toBe(false);
  });

  it('deletes with negative impact and supports dryRun', async () => {
    const { repo, actions } = setup();
    const [lukasMobile] = await repo.listAssignments({ employeeId: LUKAS, projectId: 'prj-02' });
    const dry = await actions.deleteAssignment(lukasMobile.id, { dryRun: true });
    expectOk(dry);
    expect((await repo.listAssignments()).some((a) => a.id === lukasMobile.id)).toBe(true);
    const r = await actions.deleteAssignment(lukasMobile.id);
    expectOk(r);
    expect(r.result.id).toBe(lukasMobile.id);
    expect(r.impact.find((i) => i.weekKey === weekRef(mon(0)).key)).toMatchObject({ before: 100, after: 60 });
    expect((await repo.listAssignments()).some((a) => a.id === lukasMobile.id)).toBe(false);
  });
});

describe('undo / redo', () => {
  it('undoes and redoes create, update and delete', async () => {
    const { repo, actions } = setup();
    const initial = await repo.listAssignments();

    const c = await actions.createAssignment(felixInput({ role: 'Pairing' }));
    expectOk(c);
    const u = await actions.updateAssignment(c.result.id, { allocation: 80, role: null });
    expectOk(u);
    const d = await actions.deleteAssignment(c.result.id);
    expectOk(d);
    expect(await repo.listAssignments()).toEqual(initial);

    // undo delete → re-created with its ORIGINAL id
    expect(await actions.undo()).toEqual({ ok: true, label: 'Einsatz löschen' });
    let felix = await repo.listAssignments({ employeeId: FELIX, from: mon(4) });
    expect(felix).toHaveLength(1);
    expect(felix[0]).toMatchObject({ id: c.result.id, allocation: 80 });
    expect(felix[0].role).toBeUndefined();

    // undo update → allocation and role restored on the re-created assignment
    await actions.undo();
    felix = await repo.listAssignments({ employeeId: FELIX, from: mon(4) });
    expect(felix[0]).toMatchObject({ allocation: 50, role: 'Pairing' });

    // undo create → back to initial
    await actions.undo();
    expect(await repo.listAssignments()).toEqual(initial);
    expect(actions.canUndo()).toBe(false);
    expect((await actions.undo()).ok).toBe(false);

    // redo all three
    expect(actions.canRedo()).toBe(true);
    expect(actions.redoLabel()).toBe('Einsatz anlegen');
    await actions.redo();
    await actions.redo();
    felix = await repo.listAssignments({ employeeId: FELIX, from: mon(4) });
    expect(felix).toHaveLength(1);
    expect(felix[0]).toMatchObject({ id: c.result.id, allocation: 80 });
    await actions.redo();
    expect(await repo.listAssignments()).toEqual(initial);
    expect(actions.canRedo()).toBe(false);
  });

  it('a new write clears the redo stack', async () => {
    const { actions } = setup();
    await actions.createAssignment(felixInput());
    await actions.undo();
    expect(actions.canRedo()).toBe(true);
    await actions.createAssignment(felixInput({ allocation: 20 }));
    expect(actions.canRedo()).toBe(false);
  });

  it('undoing an employee delete restores the employee and its assignments', async () => {
    const { repo, actions } = setup();
    const before = await repo.listAssignments({ employeeId: LUKAS });
    const r = await actions.deleteEmployee(LUKAS);
    expectOk(r);
    expect(await repo.listAssignments({ employeeId: LUKAS })).toEqual([]);

    await actions.undo();
    const lukas = (await repo.listEmployees()).find((e) => e.name === 'Lukas Müller');
    expect(lukas?.id).toBe(LUKAS);
    // employee and cascaded assignments come back with their original ids and data
    expect(await repo.listAssignments({ employeeId: LUKAS })).toEqual(before);

    // redo deletes the re-created employee including cascade
    await actions.redo();
    expect((await repo.listEmployees()).some((e) => e.name === 'Lukas Müller')).toBe(false);
  });

  it('undoing a project delete restores the project and its assignments', async () => {
    const { repo, actions } = setup();
    const countBefore = (await repo.listAssignments()).length;
    const r = await actions.deleteProject(WEBSITE);
    expectOk(r);
    expect(r.impact.length).toBeGreaterThan(0);
    expect(r.impact.every((i) => i.after < i.before)).toBe(true);
    await actions.undo();
    expect(await repo.listAssignments()).toHaveLength(countBefore);
    expect((await repo.listProjects()).find((p) => p.name === 'Website-Relaunch')?.id).toBe(WEBSITE);
    expect((await repo.listAssignments({ projectId: WEBSITE })).length).toBeGreaterThan(0);
  });

  it('keeps ids across delete → undo → update → undo → redo chains', async () => {
    const { repo, actions } = setup();
    const target = (await repo.listAssignments({ employeeId: LUKAS }))[0];
    expectOk(await actions.deleteEmployee(LUKAS));
    await actions.undo(); // employee + assignments back with original ids
    expectOk(await actions.updateAssignment(target.id, { allocation: 10 }));
    expectOk(await actions.deleteAssignment(target.id));
    await actions.undo(); // assignment back (allocation 10)
    await actions.undo(); // allocation restored
    expect((await repo.listAssignments()).find((a) => a.id === target.id)).toEqual(target);
    await actions.redo();
    expect((await repo.listAssignments()).find((a) => a.id === target.id)?.allocation).toBe(10);
  });

  it('respects the history limit', async () => {
    let n = 0;
    const repo = new LocalRepository({ storage: null, today: TODAY, generateId: (p) => `${p}-h${(n += 1)}` });
    const actions = createPlanningActions(repo, () => snapshotFromRepository(repo), { historyLimit: 2 });
    for (const allocation of [10, 20, 30]) await actions.createAssignment(felixInput({ allocation }));
    await actions.undo();
    await actions.undo();
    expect(actions.canUndo()).toBe(false);
  });

  it('serializes concurrent writes', async () => {
    const { repo, actions } = setup();
    await Promise.all([
      actions.createAssignment(felixInput({ allocation: 60 })),
      actions.createAssignment(felixInput({ allocation: 60 })),
    ]);
    expect(await repo.listAssignments({ employeeId: FELIX, from: mon(4) })).toHaveLength(2);
    await actions.undo();
    await actions.undo();
    expect(await repo.listAssignments({ employeeId: FELIX, from: mon(4) })).toHaveLength(0);
  });
});

describe('employee and project CRUD', () => {
  it('creates, validates and undoes employees', async () => {
    const { repo, actions } = setup();
    const bad = await actions.createEmployee({ name: '', role: 'QA', seniority: 'mid', capacity: 2, active: true });
    expect(bad.ok).toBe(false);
    const r = await actions.createEmployee({ name: 'Mia Braun', role: 'QA', seniority: 'mid', capacity: 0.8, active: true });
    expectOk(r);
    expect(await repo.listEmployees()).toHaveLength(15);
    await actions.undo();
    expect(await repo.listEmployees()).toHaveLength(14);
  });

  it('reducing capacity reports impact and overbooking warnings', async () => {
    const { repo, actions } = setup();
    const r = await actions.updateEmployee(LUKAS, { capacity: 0.8 });
    expectOk(r);
    expect(r.warnings.find((w) => w.code === 'OVERBOOKED')?.weeks).toContain(weekRef(mon(0)).key);
    expect(r.impact.find((i) => i.weekKey === weekRef(mon(0)).key)).toMatchObject({ before: 100, after: 125 });
    await actions.undo();
    expect((await repo.listEmployees()).find((e) => e.id === LUKAS)?.capacity).toBe(1);
  });

  it('updates projects with outside-dates warning and undo', async () => {
    const { repo, actions } = setup();
    const r = await actions.updateProject(WEBSITE, { end: fri(2) });
    expectOk(r);
    expect(r.warnings.map((w) => w.code)).toEqual(['OUTSIDE_PROJECT']);
    await actions.undo();
    expect((await repo.listProjects()).find((p) => p.id === WEBSITE)?.end).toBe(fri(6));
    const bad = await actions.updateProject(WEBSITE, { end: '2000-01-01' });
    expect(bad.ok).toBe(false);
  });

  it('creates projects and supports dryRun', async () => {
    const { repo, actions } = setup();
    const input = { name: 'Barrierefreiheit', color: 'cyan', start: mon(2), end: fri(8), status: 'planned' as const };
    const dry = await actions.createProject(input, { dryRun: true });
    expectOk(dry);
    expect(await repo.listProjects()).toHaveLength(7);
    const r = await actions.createProject(input);
    expectOk(r);
    expect(await repo.listProjects()).toHaveLength(8);
  });
});

describe('historyLabelText', () => {
  it('turns history labels into past-tense display text', () => {
    expect(historyLabelText('Einsatz verschieben')).toBe('Einsatz verschoben');
    expect(historyLabelText('Einsatz anlegen')).toBe('Einsatz angelegt');
    expect(historyLabelText('Projekt ändern')).toBe('Projekt geändert');
    expect(historyLabelText('Person löschen')).toBe('Person gelöscht');
    expect(historyLabelText('Sonstiges')).toBe('Sonstiges');
  });
});
