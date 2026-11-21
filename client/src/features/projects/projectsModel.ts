/** Pure view-model of the Projekte page: filters, staffing stats, timeline geometry. */
import { maxISODate, minISODate, overlapWorkdays, toDayNumber, weekRef } from '../../domain/dates';
import type { Assignment, ISODate, Project, ProjectStatus } from '../../domain/types';

export interface ProjectFilters {
  search: string;
  /** '' = all statuses. */
  status: ProjectStatus | '';
}

export const DEFAULT_PROJECT_FILTERS: ProjectFilters = { search: '', status: '' };

const STATUS_ORDER: Record<ProjectStatus, number> = { active: 0, planned: 1, done: 2 };

export function filterProjects(projects: readonly Project[], filters: ProjectFilters): Project[] {
  const q = filters.search.trim().toLowerCase();
  return projects
    .filter((p) => !filters.status || p.status === filters.status)
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.start.localeCompare(b.start) || a.name.localeCompare(b.name, 'de'));
}

export interface ProjectStats {
  /** Distinct people with at least one assignment on the project. */
  people: number;
  assignments: number;
  /** Staffed FTE in the week of `today` (Σ allocation × workdays / 5 / 100). */
  currentFte: number;
}

export function computeProjectStats(projects: readonly Project[], assignments: readonly Assignment[], today: ISODate): Record<string, ProjectStats> {
  const week = weekRef(today);
  const stats: Record<string, ProjectStats> = {};
  const people: Record<string, Set<string>> = {};
  for (const p of projects) {
    stats[p.id] = { people: 0, assignments: 0, currentFte: 0 };
    people[p.id] = new Set();
  }
  for (const a of assignments) {
    const s = stats[a.projectId];
    if (!s) continue;
    s.assignments += 1;
    people[a.projectId].add(a.employeeId);
    s.currentFte += (a.allocation * overlapWorkdays(a.start, a.end, week)) / 5 / 100;
  }
  for (const p of projects) {
    stats[p.id].people = people[p.id].size;
    stats[p.id].currentFte = Math.round(stats[p.id].currentFte * 100) / 100;
  }
  return stats;
}

export interface TimelineWindow {
  from: ISODate;
  to: ISODate;
}

/** Common time axis for all timeline bars: earliest start … latest end (always includes today). */
export function timelineWindow(projects: readonly Project[], today: ISODate): TimelineWindow {
  return projects.reduce<TimelineWindow>(
    (w, p) => ({ from: minISODate(w.from, p.start), to: maxISODate(w.to, p.end) }),
    { from: today, to: today },
  );
}

/** Position of [start, end] within `window` in percent (left, width), clamped to 0–100. */
export function timelinePosition(window: TimelineWindow, start: ISODate, end: ISODate): { left: number; width: number } {
  const from = toDayNumber(window.from);
  const total = Math.max(1, toDayNumber(window.to) - from + 1);
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  const left = clamp(((toDayNumber(start) - from) / total) * 100);
  const right = clamp(((toDayNumber(end) - from + 1) / total) * 100);
  return { left, width: Math.max(0, right - left) };
}
