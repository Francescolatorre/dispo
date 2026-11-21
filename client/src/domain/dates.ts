/**
 * Calendar helpers on `YYYY-MM-DD` strings.
 *
 * Arithmetic runs on "epoch day numbers" computed with `Date.UTC`, so results never depend
 * on the machine's timezone or DST transitions. Conversion to/from a JS `Date` uses the
 * LOCAL calendar day (`getFullYear/getMonth/getDate`) — never `toISOString`, which would
 * shift the day for users east of UTC.
 */
import type { ISODate, WeekKey } from './types';

const MS_PER_DAY = 86_400_000;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEK_KEY_RE = /^(\d{4})-W(\d{2})$/;

export interface WeekRef {
  /** ISO week key, e.g. `2026-W48`. */
  key: WeekKey;
  /** ISO week-numbering year (may differ from the calendar year around New Year). */
  year: number;
  week: number;
  /** Monday. */
  start: ISODate;
  /** Sunday. */
  end: ISODate;
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/** True if `value` is a real calendar date in `YYYY-MM-DD` form. */
export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string') return false;
  const m = ISO_DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function assertISODate(value: string): void {
  if (!isISODate(value)) throw new RangeError(`Invalid ISO date: "${value}"`);
}

/** `YYYY-MM-DD` → days since 1970-01-01 (timezone-independent). */
export function toDayNumber(date: ISODate): number {
  assertISODate(date);
  const [y, m, d] = date.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** Days since 1970-01-01 → `YYYY-MM-DD`. */
export function fromDayNumber(day: number): ISODate {
  const dt = new Date(day * MS_PER_DAY);
  return `${pad(dt.getUTCFullYear(), 4)}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Parses into a local `Date` at local midnight of that calendar day. */
export function parseISODate(date: ISODate): Date {
  assertISODate(date);
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Formats the LOCAL calendar day of a `Date`. */
export function formatISODate(date: Date): ISODate {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's local calendar date. */
export function todayISO(now: Date = new Date()): ISODate {
  return formatISODate(now);
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromDayNumber(toDayNumber(date) + days);
}

export function addWeeks(date: ISODate, weeks: number): ISODate {
  return addDays(date, weeks * 7);
}

/** `b - a` in calendar days. */
export function diffInDays(a: ISODate, b: ISODate): number {
  return toDayNumber(b) - toDayNumber(a);
}

export function compareISODate(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export const minISODate = (a: ISODate, b: ISODate): ISODate => (a <= b ? a : b);
export const maxISODate = (a: ISODate, b: ISODate): ISODate => (a >= b ? a : b);

/** ISO weekday index: 0 = Monday … 6 = Sunday. */
export function isoWeekdayIndex(date: ISODate): number {
  // 1970-01-01 was a Thursday (index 3).
  return (((toDayNumber(date) + 3) % 7) + 7) % 7;
}

export function startOfISOWeek(date: ISODate): ISODate {
  return addDays(date, -isoWeekdayIndex(date));
}

export function endOfISOWeek(date: ISODate): ISODate {
  return addDays(startOfISOWeek(date), 6);
}

function isoWeekParts(date: ISODate): { year: number; week: number } {
  const day = toDayNumber(date);
  const thursday = day + 3 - isoWeekdayIndex(date);
  const year = new Date(thursday * MS_PER_DAY).getUTCFullYear();
  const jan1 = toDayNumber(`${pad(year, 4)}-01-01`);
  return { year, week: Math.floor((thursday - jan1) / 7) + 1 };
}

/** ISO week key, e.g. `2026-W48`. */
export function isoWeekKey(date: ISODate): WeekKey {
  const { year, week } = isoWeekParts(date);
  return `${pad(year, 4)}-W${pad(week)}`;
}

/** Number of ISO weeks (52 or 53) in an ISO week-numbering year. */
export function isoWeeksInYear(year: number): number {
  return isoWeekParts(`${pad(year, 4)}-12-28`).week;
}

/** Monday of the week identified by `key`. Throws on malformed or out-of-range keys. */
export function weekStartFromKey(key: WeekKey): ISODate {
  const m = WEEK_KEY_RE.exec(key);
  if (!m) throw new RangeError(`Invalid ISO week key: "${key}"`);
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > isoWeeksInYear(year)) throw new RangeError(`Invalid ISO week key: "${key}"`);
  const jan4 = `${pad(year, 4)}-01-04`;
  return addWeeks(startOfISOWeek(jan4), week - 1);
}

export function weekRef(date: ISODate): WeekRef {
  const start = startOfISOWeek(date);
  const { year, week } = isoWeekParts(start);
  return { key: `${pad(year, 4)}-W${pad(week)}`, year, week, start, end: addDays(start, 6) };
}

/** All ISO weeks touched by the inclusive range [from, to], in order. Empty if to < from. */
export function listWeeks(from: ISODate, to: ISODate): WeekRef[] {
  if (to < from) return [];
  const weeks: WeekRef[] = [];
  const last = startOfISOWeek(to);
  for (let start = startOfISOWeek(from); start <= last; start = addWeeks(start, 1)) {
    weeks.push(weekRef(start));
  }
  return weeks;
}

/** Number of Monday–Friday days in the inclusive range [start, end]. 0 if end < start. */
export function countWorkdays(start: ISODate, end: ISODate): number {
  const first = toDayNumber(start);
  const last = toDayNumber(end);
  if (last < first) return 0;
  const total = last - first + 1;
  const fullWeeks = Math.floor(total / 7);
  let count = fullWeeks * 5;
  const startIdx = isoWeekdayIndex(start);
  for (let i = 0; i < total % 7; i += 1) {
    if ((startIdx + i) % 7 < 5) count += 1;
  }
  return count;
}

/** True if the inclusive ranges [aStart, aEnd] and [bStart, bEnd] share at least one day. */
export function rangesOverlap(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Workdays (Mon–Fri) of `week` that fall within the inclusive range [start, end]: 0–5. */
export function overlapWorkdays(start: ISODate, end: ISODate, week: Pick<WeekRef, 'start' | 'end'>): number {
  if (!rangesOverlap(start, end, week.start, week.end)) return 0;
  return countWorkdays(maxISODate(start, week.start), minISODate(end, week.end));
}
