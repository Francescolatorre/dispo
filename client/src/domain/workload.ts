/**
 * Pure workload engine.
 *
 * Units:
 * - `allocation` / `load` are percent of a FULL-TIME week (absolute, FTE %).
 * - `utilization` is relative to the person's own capacity: load / (capacity × 100) × 100.
 *   A 0.8 part-timer with 80 % load is at 100 % utilization.
 * - `freePercent` is the allocation (absolute FTE %) that can still be added before the
 *   person reaches 100 % utilization: capacity × 100 − load, floored at 0.
 */
import { listWeeks, overlapWorkdays, type WeekRef } from './dates';
import type { Assignment, Employee, ISODate, WeekKey } from './types';

export type WorkloadStatus = 'free' | 'ok' | 'warning' | 'over';

export const WORKLOAD_THRESHOLDS = { ok: 80, warning: 100 } as const;

export interface WeekLoad {
  employeeId: string;
  weekKey: WeekKey;
  weekStart: ISODate;
  /** Σ allocation × overlapping workdays / 5 (FTE %). */
  load: number;
  /** Load relative to the employee's capacity (%). */
  utilization: number;
  /** Allocation (FTE %) still available before 100 % utilization; never negative. */
  freePercent: number;
  status: WorkloadStatus;
  /** Assignments that contribute to this week. */
  assignmentIds: string[];
}

/** employeeId → weekKey → WeekLoad */
export type WorkloadMatrix = Record<string, Record<WeekKey, WeekLoad>>;

/** Rounds away float noise (e.g. 80 / 0.8 = 100.00000000000001). */
const round2 = (n: number) => Math.round(n * 100) / 100;

export function workloadStatus(utilization: number): WorkloadStatus {
  if (utilization <= 0) return 'free';
  if (utilization <= WORKLOAD_THRESHOLDS.ok) return 'ok';
  if (utilization <= WORKLOAD_THRESHOLDS.warning) return 'warning';
  return 'over';
}

export function computeWeekLoad(
  employee: Pick<Employee, 'id' | 'capacity'>,
  assignments: readonly Assignment[],
  week: Pick<WeekRef, 'key' | 'start' | 'end'>,
): WeekLoad {
  let load = 0;
  const assignmentIds: string[] = [];
  for (const a of assignments) {
    if (a.employeeId !== employee.id) continue;
    const days = overlapWorkdays(a.start, a.end, week);
    if (days === 0) continue;
    load += (a.allocation * days) / 5;
    assignmentIds.push(a.id);
  }
  load = round2(load);
  const capacityPercent = employee.capacity * 100;
  const utilization = capacityPercent > 0 ? round2((load / capacityPercent) * 100) : load > 0 ? Infinity : 0;
  return {
    employeeId: employee.id,
    weekKey: week.key,
    weekStart: week.start,
    load,
    utilization,
    freePercent: Math.max(0, round2(capacityPercent - load)),
    status: workloadStatus(utilization),
    assignmentIds,
  };
}

export function computeWorkloadMatrix(
  employees: readonly Employee[],
  assignments: readonly Assignment[],
  weeks: readonly WeekRef[],
): WorkloadMatrix {
  const byEmployee = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const list = byEmployee.get(a.employeeId);
    if (list) list.push(a);
    else byEmployee.set(a.employeeId, [a]);
  }
  const matrix: WorkloadMatrix = {};
  for (const e of employees) {
    const own = byEmployee.get(e.id) ?? [];
    const row: Record<WeekKey, WeekLoad> = {};
    for (const w of weeks) row[w.key] = computeWeekLoad(e, own, w);
    matrix[e.id] = row;
  }
  return matrix;
}

export interface FreeCapacityQuery {
  from: ISODate;
  to: ISODate;
  /** Minimum free allocation (FTE %) required in EVERY week of the range. Default 0. */
  minFreePercent?: number;
  /** Case-insensitive exact role match. */
  role?: string;
  /** Include inactive employees (default false). */
  includeInactive?: boolean;
}

export interface FreeCapacityResult {
  employee: Employee;
  /** Lowest free allocation (FTE %) across the weeks of the range. */
  minFreePercent: number;
  /** Average free allocation (FTE %) across the weeks of the range. */
  avgFreePercent: number;
  weeks: WeekLoad[];
}

/**
 * Employees that have at least `minFreePercent` free in every ISO week touched by
 * [from, to], sorted by `minFreePercent` descending, then name.
 */
export function findFreeCapacity(
  employees: readonly Employee[],
  assignments: readonly Assignment[],
  query: FreeCapacityQuery,
): FreeCapacityResult[] {
  const weeks = listWeeks(query.from, query.to);
  if (weeks.length === 0) return [];
  const minRequired = query.minFreePercent ?? 0;
  const role = query.role?.trim().toLowerCase();
  const candidates = employees.filter(
    (e) => (query.includeInactive || e.active) && (!role || e.role.toLowerCase() === role),
  );
  const matrix = computeWorkloadMatrix(candidates, assignments, weeks);

  const results: FreeCapacityResult[] = [];
  for (const employee of candidates) {
    const loads = weeks.map((w) => matrix[employee.id][w.key]);
    const free = loads.map((l) => l.freePercent);
    const min = Math.min(...free);
    if (min < minRequired) continue;
    results.push({
      employee,
      minFreePercent: min,
      avgFreePercent: round2(free.reduce((s, f) => s + f, 0) / free.length),
      weeks: loads,
    });
  }
  return results.sort((a, b) => b.minFreePercent - a.minFreePercent || a.employee.name.localeCompare(b.employee.name));
}
