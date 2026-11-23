/**
 * Pure view-model helpers of the board: visible range, filters, insights, German labels.
 * All date and workload math is delegated to `domain/dates` and `domain/workload`.
 */
import { addDays, addWeeks, listWeeks, rangesOverlap, startOfISOWeek, type WeekRef } from '../../domain/dates';
import type { Assignment, Employee, ISODate, Seniority } from '../../domain/types';
import { computeWorkloadMatrix, findFreeCapacity, type WorkloadStatus } from '../../domain/workload';

/** Default range: 2 weeks back to 14 weeks ahead of the current week (17 columns). */
export const WEEKS_BACK = 2;
export const WEEKS_AHEAD = 14;
export const VISIBLE_WEEKS = WEEKS_BACK + 1 + WEEKS_AHEAD;
/** ‹ / › move the range by this many weeks. */
export const NAV_STEP_WEEKS = 4;
/** Look-ahead of the insights and the "free capacity" filter: current week + 3. */
export const INSIGHT_WEEKS = 4;
/** "Nur mit freier Kapazität": at least this much (FTE %) free in every insight week. */
export const MIN_FREE_PERCENT = 20;

/** Monday of the first visible week for the default range around `today`. */
export function defaultRangeStart(today: ISODate): ISODate {
  return addWeeks(startOfISOWeek(today), -WEEKS_BACK);
}

export function visibleWeeks(rangeStart: ISODate, count = VISIBLE_WEEKS): WeekRef[] {
  const start = startOfISOWeek(rangeStart);
  return listWeeks(start, addDays(addWeeks(start, count), -1));
}

export interface BoardFilters {
  search: string;
  role: string;
  projectId: string;
  onlyFree: boolean;
  onlyOverbooked: boolean;
  showInactive: boolean;
}

export const DEFAULT_FILTERS: BoardFilters = {
  search: '',
  role: '',
  projectId: '',
  onlyFree: false,
  onlyOverbooked: false,
  showInactive: false,
};

export function hasActiveFilters(f: BoardFilters): boolean {
  return Boolean(f.search.trim() || f.role || f.projectId || f.onlyFree || f.onlyOverbooked);
}

export interface Insights {
  /** Inclusive horizon (Monday of the current week … Sunday 3 weeks later). */
  from: ISODate;
  to: ISODate;
  /** Number of (active person × week) cells with status "over" in the horizon. */
  overbookedPersonWeeks: number;
  overbookedEmployeeIds: ReadonlySet<string>;
  /** Active people with ≥ MIN_FREE_PERCENT free in every week of the horizon. */
  freeEmployeeIds: ReadonlySet<string>;
}

export function computeInsights(employees: readonly Employee[], assignments: readonly Assignment[], today: ISODate): Insights {
  const from = startOfISOWeek(today);
  const to = addDays(addWeeks(from, INSIGHT_WEEKS), -1);
  const active = employees.filter((e) => e.active);
  const weeks = listWeeks(from, to);
  const matrix = computeWorkloadMatrix(active, assignments, weeks);
  let overbookedPersonWeeks = 0;
  const overbookedEmployeeIds = new Set<string>();
  for (const e of active) {
    for (const w of weeks) {
      if (matrix[e.id][w.key].status === 'over') {
        overbookedPersonWeeks += 1;
        overbookedEmployeeIds.add(e.id);
      }
    }
  }
  const freeEmployeeIds = new Set(
    findFreeCapacity(employees, assignments, { from, to, minFreePercent: MIN_FREE_PERCENT }).map((r) => r.employee.id),
  );
  return { from, to, overbookedPersonWeeks, overbookedEmployeeIds, freeEmployeeIds };
}

export interface FilterContext {
  insights: Pick<Insights, 'freeEmployeeIds' | 'overbookedEmployeeIds'>;
  /** Visible range — the project filter keeps people with an assignment on the project in it. */
  rangeStart: ISODate;
  rangeEnd: ISODate;
}

export function filterEmployees(
  employees: readonly Employee[],
  assignments: readonly Assignment[],
  filters: BoardFilters,
  ctx: FilterContext,
): Employee[] {
  const query = filters.search.trim().toLocaleLowerCase('de');
  let onProject: Set<string> | null = null;
  if (filters.projectId) {
    onProject = new Set(
      assignments
        .filter((a) => a.projectId === filters.projectId && rangesOverlap(a.start, a.end, ctx.rangeStart, ctx.rangeEnd))
        .map((a) => a.employeeId),
    );
  }
  return employees.filter(
    (e) =>
      (filters.showInactive || e.active) &&
      (!query || e.name.toLocaleLowerCase('de').includes(query)) &&
      (!filters.role || e.role === filters.role) &&
      (!onProject || onProject.has(e.id)) &&
      (!filters.onlyFree || ctx.insights.freeEmployeeIds.has(e.id)) &&
      (!filters.onlyOverbooked || ctx.insights.overbookedEmployeeIds.has(e.id)),
  );
}

// ---------------------------------------------------------------------------------------------
// Labels (German)

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const;

export const SENIORITY_LABELS: Record<Seniority, string> = {
  junior: 'Junior',
  mid: 'Professional',
  senior: 'Senior',
  lead: 'Lead',
};

export const STATUS_LABELS: Record<WorkloadStatus, string> = {
  free: 'frei',
  luft: 'mit Luft',
  ok: 'im Rahmen',
  full: 'voll',
  over: 'überbucht',
};

/** `2026-11-24` → `24.11.` */
export function formatDayMonth(date: ISODate): string {
  const [, m, d] = date.split('-');
  return `${d}.${m}.`;
}

/** `2026-11-24` → `24.11.2026` */
export function formatDate(date: ISODate): string {
  const [y, m, d] = date.split('-');
  return `${d}.${m}.${y}`;
}

export function monthName(monthIndex: number): string {
  return MONTHS[monthIndex];
}

/** Rounded percentage for display; `∞` for a zero-capacity edge case. */
export function formatPercent(value: number): string {
  return Number.isFinite(value) ? `${Math.round(value)} %` : '∞ %';
}

export interface MonthSegment {
  key: string;
  label: string;
  /** Short label for narrow segments, e.g. `Nov`. */
  shortLabel: string;
  startIndex: number;
  weekCount: number;
}

/** Groups consecutive weeks by the month of their Thursday (ISO convention). */
export function monthSegments(weeks: readonly WeekRef[]): MonthSegment[] {
  const segments: MonthSegment[] = [];
  weeks.forEach((w, i) => {
    const thursday = addDays(w.start, 3);
    const [y, m] = thursday.split('-').map(Number);
    const key = `${y}-${m}`;
    const last = segments[segments.length - 1];
    if (last && last.key === key) {
      last.weekCount += 1;
    } else {
      const name = monthName(m - 1);
      segments.push({ key, label: `${name} ${y}`, shortLabel: name.slice(0, 3), startIndex: i, weekCount: 1 });
    }
  });
  return segments;
}
