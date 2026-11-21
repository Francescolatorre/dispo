/** German display helpers shared by the master-data pages (Personen, Projekte). */
import type { ISODate, ProjectStatus, Seniority, WeekKey } from '../../domain/types';
import type { ValidationIssue } from '../../domain/validation';

export const SENIORITY_LABELS: Record<Seniority, string> = {
  junior: 'Junior',
  mid: 'Professional',
  senior: 'Senior',
  lead: 'Lead',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Geplant',
  active: 'Aktiv',
  done: 'Abgeschlossen',
};

/** `2026-11-24` → `24.11.2026` */
export function formatDate(date: ISODate): string {
  const [y, m, d] = date.split('-');
  return `${d}.${m}.${y}`;
}

/** `2026-W09` → `KW 9` */
export function formatWeekKey(key: WeekKey): string {
  const week = Number(key.split('-W')[1]);
  return Number.isFinite(week) ? `KW ${week}` : key;
}

/** `0.8` → `80 %` */
export function formatCapacity(capacity: number): string {
  return `${Math.round(capacity * 100)} %`;
}

/** `1.75` → `1,8` (one decimal, German separator). */
export function formatFte(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

const MAX_LISTED_WEEKS = 6;

/** Short, planner-friendly wording for a validation issue. */
export function describeIssue(issue: ValidationIssue): string {
  if (issue.code === 'OVERBOOKED' && issue.weeks && issue.weeks.length > 0) {
    const shown = issue.weeks.slice(0, MAX_LISTED_WEEKS).map(formatWeekKey).join(', ');
    const rest = issue.weeks.length - MAX_LISTED_WEEKS;
    return `Überbucht in ${shown}${rest > 0 ? ` und ${rest} weiteren Wochen` : ''} (über 100 % ausgelastet).`;
  }
  return issue.message;
}
