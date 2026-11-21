/**
 * Pure math of board interactions (no React, no DOM): snapping a pointer delta to weeks,
 * the target of a move/resize/create drag, the projected workload while dragging and the
 * German labels of the drag hint and the result toasts.
 */
import { addDays, addWeeks, listWeeks, weekRef, weekStartFromKey, type WeekRef } from '../../../domain/dates';
import type { ImpactEntry } from '../../../domain/planningActions';
import type { Assignment, Employee, ISODate, WeekKey } from '../../../domain/types';
import type { ValidationIssue } from '../../../domain/validation';
import { computeWeekLoad, type WeekLoad } from '../../../domain/workload';
import { DAYS_PER_WEEK, dateToWeekIndex, weekIndexToRange, xToWeekBoundary, xToWeekIndex, type BoardGeometry } from '../layout';

/** Pointer travel (px) before a press becomes a drag; below it a click stays a click. */
export const DRAG_THRESHOLD_PX = 4;

/** Allocation assumed for the live preview of a drag-to-create (and prefilled in the dialog). */
export const DEFAULT_CREATE_ALLOCATION = 50;

/** Id of the hypothetical assignment of a drag-to-create preview. */
export const DRAFT_ID = '__draft__';

export type DragMode = 'move' | 'resize-start' | 'resize-end' | 'create';

export interface DragTarget {
  employeeId: string;
  start: ISODate;
  end: ISODate;
  /** move only: whole weeks the assignment is shifted by. */
  weeks: number;
}

/** True once the pointer travelled at least `threshold` px from the press position. */
export function exceedsThreshold(dx: number, dy: number, threshold = DRAG_THRESHOLD_PX): boolean {
  return Math.hypot(dx, dy) >= threshold;
}

/** Horizontal pointer delta → whole weeks (rounded to the nearest column). */
export function snapWeeks(dx: number, columnWidth: number): number {
  const weeks = Math.round(dx / columnWidth);
  return weeks === 0 ? 0 : weeks; // avoid -0
}

export interface DragTargetInput {
  mode: DragMode;
  geometry: BoardGeometry;
  /** The dragged assignment (move/resize). */
  assignment?: Pick<Assignment, 'employeeId' | 'start' | 'end'>;
  /** Row the drag started in. */
  originEmployeeId: string;
  /** Row currently under the pointer (move only); falls back to the origin row. */
  hoverEmployeeId?: string | null;
  /** Pointer x at press / now, relative to the row track (x = 0 is the first visible Monday). */
  startX: number;
  currentX: number;
}

/**
 * Where the dragged bar would land.
 * - move: shift start and end by whole weeks (duration and weekdays kept), any row.
 * - resize-start: start snaps to the Monday of the nearest week boundary, ≤ the end's week.
 * - resize-end: end snaps to the Friday before the nearest week boundary, ≥ the start's week.
 * - create: whole weeks from the pressed column to the current column (Mon … Fri), own row.
 */
export function computeDragTarget(input: DragTargetInput): DragTarget {
  const { mode, geometry: geom, assignment, originEmployeeId, startX, currentX } = input;
  if (mode === 'create' || !assignment) {
    const range = weekIndexToRange(geom, xToWeekIndex(geom, startX), xToWeekIndex(geom, currentX));
    return { employeeId: originEmployeeId, ...range, weeks: 0 };
  }
  if (mode === 'move') {
    const weeks = snapWeeks(currentX - startX, geom.columnWidth);
    return {
      employeeId: input.hoverEmployeeId ?? originEmployeeId,
      start: addWeeks(assignment.start, weeks),
      end: addWeeks(assignment.end, weeks),
      weeks,
    };
  }
  const startWeek = dateToWeekIndex(geom, assignment.start);
  const endWeek = dateToWeekIndex(geom, assignment.end);
  const boundary = xToWeekBoundary(geom, currentX);
  if (mode === 'resize-start') {
    const b = Math.min(boundary, endWeek);
    return { employeeId: assignment.employeeId, start: addDays(geom.rangeStart, b * DAYS_PER_WEEK), end: assignment.end, weeks: 0 };
  }
  const b = Math.max(boundary, startWeek + 1, 1);
  return {
    employeeId: assignment.employeeId,
    start: assignment.start,
    end: addDays(geom.rangeStart, (b - 1) * DAYS_PER_WEEK + 4),
    weeks: 0,
  };
}

/** True if the target equals the assignment's current placement (nothing to apply). */
export function isUnchanged(target: DragTarget, assignment: Pick<Assignment, 'employeeId' | 'start' | 'end'>): boolean {
  return target.employeeId === assignment.employeeId && target.start === assignment.start && target.end === assignment.end;
}

/** The assignment list as it would look after the drag (pure, input untouched). */
export function hypotheticalAssignments(
  assignments: readonly Assignment[],
  target: DragTarget,
  draggedId: string | null,
  createAllocation = DEFAULT_CREATE_ALLOCATION,
): Assignment[] {
  if (draggedId === null) {
    return [
      ...assignments,
      { id: DRAFT_ID, employeeId: target.employeeId, projectId: DRAFT_ID, start: target.start, end: target.end, allocation: createAllocation },
    ];
  }
  return assignments.map((a) =>
    a.id === draggedId ? { ...a, employeeId: target.employeeId, start: target.start, end: target.end } : a,
  );
}

export interface Projection {
  /** employeeId → weekKey → projected load, only for the affected people. */
  loads: Record<string, Record<WeekKey, WeekLoad>>;
  /** employeeId → weeks whose utilization differs from the current state. */
  changed: Record<string, ReadonlySet<WeekKey>>;
}

/**
 * Projected workload of `employeeIds` for `weeks` under `after`, compared with `before`.
 * Only the affected people are computed, so this is cheap enough for every animation frame.
 */
export function projectLoads(
  employees: readonly Employee[],
  before: readonly Assignment[],
  after: readonly Assignment[],
  employeeIds: readonly string[],
  weeks: readonly Pick<WeekRef, 'key' | 'start' | 'end'>[],
): Projection {
  const loads: Projection['loads'] = {};
  const changed: Record<string, Set<WeekKey>> = {};
  for (const id of new Set(employeeIds)) {
    const employee = employees.find((e) => e.id === id);
    if (!employee) continue;
    const ownBefore = before.filter((a) => a.employeeId === id);
    const ownAfter = after.filter((a) => a.employeeId === id);
    const row: Record<WeekKey, WeekLoad> = {};
    const diff = new Set<WeekKey>();
    for (const w of weeks) {
      const next = computeWeekLoad(employee, ownAfter, w);
      row[w.key] = next;
      if (computeWeekLoad(employee, ownBefore, w).utilization !== next.utilization) diff.add(w.key);
    }
    loads[id] = row;
    changed[id] = diff;
  }
  return { loads, changed };
}

/** Week number of an ISO week key (`2026-W50` → 50). */
export function weekNumber(key: WeekKey): number {
  return Number(key.slice(key.indexOf('W') + 1));
}

/** `KW 49–KW 52`, or `KW 49` for a single week. */
export function formatWeekRange(start: ISODate, end: ISODate): string {
  const weeks = listWeeks(start, end);
  if (weeks.length === 0) return '';
  const first = weeks[0].week;
  return weeks.length === 1 ? `KW ${first}` : `KW ${first}–KW ${weeks[weeks.length - 1].week}`;
}

export interface DragHint {
  text: string;
  /** Some week of the target range would exceed 100 %. */
  over: boolean;
  peak: number;
}

/**
 * Text of the floating hint, e.g. `KW 49–KW 52 · Lukas Müller · 120 % in KW 50`:
 * target weeks, target person and the peak utilization of that person within the target weeks.
 */
export function dragHint(
  target: DragTarget,
  employee: Pick<Employee, 'id' | 'name' | 'capacity'> | undefined,
  after: readonly Assignment[],
): DragHint {
  const range = formatWeekRange(target.start, target.end);
  if (!employee) return { text: range, over: false, peak: 0 };
  const own = after.filter((a) => a.employeeId === employee.id);
  let peak: WeekLoad | null = null;
  for (const w of listWeeks(target.start, target.end)) {
    const load = computeWeekLoad(employee, own, w);
    if (!peak || load.utilization > peak.utilization) peak = load;
  }
  const peakText = peak ? ` · ${Math.round(peak.utilization)} % in KW ${weekNumber(peak.weekKey)}` : '';
  const util = peak?.utilization ?? 0;
  return { text: `${range} · ${employee.name}${peakText}`, over: util > 100, peak: util };
}

/**
 * Human-readable consequences of an applied write for a toast:
 * `KW 50: Lukas Müller 120 % – überbucht` per overbooked week, then other warnings verbatim.
 */
export function resultMessages(
  impact: readonly ImpactEntry[],
  warnings: readonly ValidationIssue[],
  employees: readonly Employee[],
  /**
   * Overbooked weeks whose utilization did NOT change are not in `impact`; their value is
   * taken from the state before the write (identical, since unchanged).
   */
  unchanged?: { employeeId: string; assignmentsBefore: readonly Assignment[] },
): string[] {
  const byId = new Map(employees.map((e) => [e.id, e]));
  const lines = new Map<string, { weekStart: ISODate; text: string }>();
  const add = (employeeId: string, weekKey: WeekKey, weekStart: ISODate, utilization: number) => {
    const name = byId.get(employeeId)?.name ?? employeeId;
    lines.set(`${employeeId}|${weekKey}`, {
      weekStart,
      text: `KW ${weekNumber(weekKey)}: ${name} ${Math.round(utilization)} % – überbucht`,
    });
  };
  for (const i of impact) if (i.afterStatus === 'over') add(i.employeeId, i.weekKey, i.weekStart, i.after);
  const employee = unchanged ? byId.get(unchanged.employeeId) : undefined;
  if (unchanged && employee) {
    for (const key of warnings.flatMap((w) => (w.code === 'OVERBOOKED' ? (w.weeks ?? []) : []))) {
      if (lines.has(`${employee.id}|${key}`)) continue;
      const week = weekRef(weekStartFromKey(key));
      add(employee.id, key, week.start, computeWeekLoad(employee, unchanged.assignmentsBefore, week).utilization);
    }
  }
  const over = [...lines.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart)).map((l) => l.text);
  // Overbooking is described per week above; keep the raw warning text only as a fallback.
  const rest = warnings.filter((w) => w.code !== 'OVERBOOKED' || over.length === 0).map((w) => w.message);
  return [...over, ...rest];
}
