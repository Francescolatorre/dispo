/** Pure view-model of the Personen page: filters, role options, utilization outlook. */
import { addDays, addWeeks, listWeeks, startOfISOWeek } from '../../domain/dates';
import { ROLES, type Assignment, type Employee, type ISODate } from '../../domain/types';
import { computeWorkloadMatrix, type WeekLoad } from '../../domain/workload';

/** Weeks shown in the utilization strip (current week + 7). */
export const STRIP_WEEKS = 8;
/** How far "frei ab KW x" looks ahead. */
export const FREE_LOOKAHEAD_WEEKS = 26;
/** A week counts as "frei" when at least this much (FTE %) is still available. */
export const MIN_FREE_PERCENT = 20;

export interface PeopleFilters {
  search: string;
  role: string;
  showInactive: boolean;
}

export const DEFAULT_PEOPLE_FILTERS: PeopleFilters = { search: '', role: '', showInactive: false };

export function filterEmployees(employees: readonly Employee[], filters: PeopleFilters): Employee[] {
  const q = filters.search.trim().toLowerCase();
  return employees
    .filter((e) => filters.showInactive || e.active)
    .filter((e) => !filters.role || e.role === filters.role)
    .filter((e) => !q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'de'));
}

/** Suggested roles plus every role in use, sorted. */
export function roleOptions(employees: readonly Employee[]): string[] {
  const roles = new Set<string>(ROLES);
  for (const e of employees) if (e.role.trim()) roles.add(e.role);
  return [...roles].sort((a, b) => a.localeCompare(b, 'de'));
}

export interface FreeFrom {
  weekKey: string;
  weekStart: ISODate;
  freePercent: number;
  /** True if already free in the current week. */
  now: boolean;
}

export interface PersonOutlook {
  /** Current week + the following weeks (STRIP_WEEKS). */
  strip: WeekLoad[];
  /** First week (within FREE_LOOKAHEAD_WEEKS) with ≥ MIN_FREE_PERCENT free; null = booked out. */
  freeFrom: FreeFrom | null;
}

export function computeOutlook(
  employees: readonly Employee[],
  assignments: readonly Assignment[],
  today: ISODate,
): Record<string, PersonOutlook> {
  const from = startOfISOWeek(today);
  const weeks = listWeeks(from, addDays(addWeeks(from, FREE_LOOKAHEAD_WEEKS), -1));
  const matrix = computeWorkloadMatrix(employees, assignments, weeks);
  const out: Record<string, PersonOutlook> = {};
  for (const e of employees) {
    const loads = weeks.map((w) => matrix[e.id][w.key]);
    const index = loads.findIndex((l) => l.freePercent >= MIN_FREE_PERCENT);
    const hit = index >= 0 ? loads[index] : undefined;
    out[e.id] = {
      strip: loads.slice(0, STRIP_WEEKS),
      freeFrom: hit ? { weekKey: hit.weekKey, weekStart: hit.weekStart, freePercent: hit.freePercent, now: index === 0 } : null,
    };
  }
  return out;
}

export function countAssignments(assignments: readonly Assignment[], employeeId: string): number {
  return assignments.filter((a) => a.employeeId === employeeId).length;
}
