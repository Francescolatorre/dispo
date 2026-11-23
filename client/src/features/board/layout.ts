/**
 * Pure geometry of the planning board (no React, no DOM).
 *
 * Coordinate system
 * - x = 0 is the left edge of the first visible week column (Monday 00:00).
 * - Every week column is `columnWidth` px wide and represents 7 calendar days, so one day
 *   is `columnWidth / 7` px. Positions are computed with day precision.
 *
 * Bar rule ("workweek snapping", applied consistently by `barSpan` and `packLanes`)
 * - Weekends belong to the workweek visually: an assignment that ENDS on Fri/Sat/Sun is drawn
 *   to the end of that week's column; one that STARTS on Sat/Sun is drawn from the following
 *   Monday. A typical Mon–Fri assignment therefore fills whole columns, while mid-week
 *   starts/ends (e.g. "until Wednesday") keep their day-precise position (3/7 of the column).
 *
 * Inverse functions (`xToDayOffset`, `xToDate`, `xToWeekIndex`, `weekIndexToRange`) are
 * exported for pointer interactions (drag move/resize snapping to weeks, milestone 4).
 */
import { addDays, isoWeekdayIndex, toDayNumber, type WeekRef } from '../../domain/dates';
import type { Assignment, ISODate } from '../../domain/types';

export const DAYS_PER_WEEK = 7;

/** Zoom levels S / M / L (px per week column; 8 px aligned). Default: M. */
export const COLUMN_WIDTHS = [56, 88, 128] as const;
export type ColumnWidth = (typeof COLUMN_WIDTHS)[number];
export const DEFAULT_COLUMN_WIDTH: ColumnWidth = 88;

/** Vertical metrics of a person row. */
export interface RowMetrics {
  /** Strip at the top of each row that shows the utilization of the week. */
  headerStrip: number;
  barHeight: number;
  /** Gap between lanes; lane pitch = barHeight + laneGap (never below 24, WCAG 2.5.8). */
  laneGap: number;
  paddingBottom: number;
  /** Rows never get smaller than this (keeps empty rows clickable as drop/create target). */
  minHeight: number;
  /** Lanes shown before the last visible lane turns into a "+N weitere" chip. */
  maxLanes: number;
}

/** Density "Komfort": rows of 48 / 72 / 96 px for 1 / 2 / 3 lanes. */
export const ROW_METRICS: RowMetrics = {
  headerStrip: 20,
  barHeight: 20,
  laneGap: 4,
  paddingBottom: 8,
  minHeight: 48,
  maxLanes: 3,
};

/** Density "Kompakt": rows of 40 / 64 px for 1 / 2 lanes. */
export const ROW_METRICS_COMPACT: RowMetrics = {
  headerStrip: 16,
  barHeight: 20,
  laneGap: 4,
  paddingBottom: 4,
  minHeight: 40,
  maxLanes: 2,
};

export type Density = 'comfort' | 'compact';

/** Width of the sticky name column per density (Komfort / Kompakt). */
export const NAME_COLUMN_WIDTHS: Record<Density, number> = { comfort: 224, compact: 176 };
export const NAME_COLUMN_WIDTH = NAME_COLUMN_WIDTHS.comfort;

export const rowMetricsFor = (density: Density): RowMetrics => (density === 'compact' ? ROW_METRICS_COMPACT : ROW_METRICS);

export interface BoardGeometry {
  /** Monday of the first visible week. */
  rangeStart: ISODate;
  /** Sunday of the last visible week. */
  rangeEnd: ISODate;
  weekCount: number;
  columnWidth: number;
  /** weekCount × columnWidth. */
  totalWidth: number;
}

export function createGeometry(weeks: readonly Pick<WeekRef, 'start' | 'end'>[], columnWidth: number): BoardGeometry {
  if (weeks.length === 0) throw new RangeError('createGeometry needs at least one week');
  if (!(columnWidth > 0)) throw new RangeError('columnWidth must be positive');
  return {
    rangeStart: weeks[0].start,
    rangeEnd: weeks[weeks.length - 1].end,
    weekCount: weeks.length,
    columnWidth,
    totalWidth: weeks.length * columnWidth,
  };
}

const dayWidth = (geom: BoardGeometry) => geom.columnWidth / DAYS_PER_WEEK;

/** Days between the range start and `date` (may be negative or beyond the range). */
export function dayOffset(geom: BoardGeometry, date: ISODate): number {
  return toDayNumber(date) - toDayNumber(geom.rangeStart);
}

/** x of the START (00:00) of `date`. Not clamped. */
export function dateToX(geom: BoardGeometry, date: ISODate): number {
  return dayOffset(geom, date) * dayWidth(geom);
}

/** x of the left edge of week column `index`. */
export function weekIndexToX(geom: BoardGeometry, index: number): number {
  return index * geom.columnWidth;
}

/** Fractional day offset at `x` (inverse of `dateToX`). Not clamped. */
export function xToDayOffset(geom: BoardGeometry, x: number): number {
  return x / dayWidth(geom);
}

/** Calendar day under `x`, clamped to the visible range. */
export function xToDate(geom: BoardGeometry, x: number): ISODate {
  const maxDay = geom.weekCount * DAYS_PER_WEEK - 1;
  const day = Math.min(maxDay, Math.max(0, Math.floor(xToDayOffset(geom, x))));
  return addDays(geom.rangeStart, day);
}

/** Week column under `x`, clamped to [0, weekCount − 1]. */
export function xToWeekIndex(geom: BoardGeometry, x: number): number {
  return Math.min(geom.weekCount - 1, Math.max(0, Math.floor(x / geom.columnWidth)));
}

/** Week column nearest to `x` boundaries — useful for snapping a resize handle (0…weekCount). */
export function xToWeekBoundary(geom: BoardGeometry, x: number): number {
  return Math.min(geom.weekCount, Math.max(0, Math.round(x / geom.columnWidth)));
}

/** Week column that contains `date` (unclamped; negative/≥weekCount when outside). */
export function dateToWeekIndex(geom: BoardGeometry, date: ISODate): number {
  return Math.floor(dayOffset(geom, date) / DAYS_PER_WEEK);
}

/**
 * Date range for whole week columns [startIndex, endIndex] (inclusive):
 * Monday of the first to Friday of the last — the canonical result of a week-snapped drag.
 */
export function weekIndexToRange(
  geom: BoardGeometry,
  startIndex: number,
  endIndex: number,
): { start: ISODate; end: ISODate } {
  const [a, b] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
  return {
    start: addDays(geom.rangeStart, a * DAYS_PER_WEEK),
    end: addDays(geom.rangeStart, b * DAYS_PER_WEEK + 4),
  };
}

/**
 * Visual day interval [startDay, endDay) of an inclusive date range, relative to the range
 * start, after workweek snapping (see module doc). Not clamped.
 */
export function visualDayInterval(geom: BoardGeometry, start: ISODate, end: ISODate): { startDay: number; endDay: number } {
  const startWeekday = isoWeekdayIndex(start);
  const endWeekday = isoWeekdayIndex(end);
  let startDay = dayOffset(geom, start);
  if (startWeekday >= 5) startDay += DAYS_PER_WEEK - startWeekday; // Sat/Sun → next Monday
  let endDay = dayOffset(geom, end) + 1; // exclusive
  if (endWeekday >= 4) endDay += DAYS_PER_WEEK - 1 - endWeekday; // Fri/Sat → end of Sunday
  return { startDay, endDay: Math.max(endDay, startDay) };
}

export interface BarSpan {
  x: number;
  width: number;
  /** The assignment starts before the visible range. */
  clippedStart: boolean;
  /** The assignment ends after the visible range. */
  clippedEnd: boolean;
}

/** Horizontal span of a bar, clipped to the visible range; `null` if nothing is visible. */
export function barSpan(geom: BoardGeometry, start: ISODate, end: ISODate): BarSpan | null {
  const { startDay, endDay } = visualDayInterval(geom, start, end);
  const lastDay = geom.weekCount * DAYS_PER_WEEK;
  const from = Math.max(0, startDay);
  const to = Math.min(lastDay, endDay);
  if (to <= from) return null;
  const w = dayWidth(geom);
  return { x: from * w, width: (to - from) * w, clippedStart: startDay < 0, clippedEnd: endDay > lastDay };
}

export interface LaneItem {
  id: string;
  start: ISODate;
  end: ISODate;
}

/**
 * Greedy interval partitioning: items sorted by start (then end, then id) go into the first
 * lane whose last item has ended. Two items share a lane only if their VISUAL intervals do not
 * overlap (touching is fine), so stacked bars never cover each other. Deterministic.
 */
export function packLanes(geom: BoardGeometry, items: readonly LaneItem[]): { lanes: Map<string, number>; laneCount: number } {
  const sorted = items
    .map((item) => ({ item, ...visualDayInterval(geom, item.start, item.end) }))
    .sort((a, b) => a.startDay - b.startDay || a.endDay - b.endDay || a.item.id.localeCompare(b.item.id));
  const laneEnds: number[] = [];
  const lanes = new Map<string, number>();
  for (const { item, startDay, endDay } of sorted) {
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= startDay);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(endDay);
    } else {
      laneEnds[lane] = endDay;
    }
    lanes.set(item.id, lane);
  }
  return { lanes, laneCount: laneEnds.length };
}

/** y of the top edge of a bar in `lane`, relative to the row. */
export function laneTop(lane: number, metrics: RowMetrics = ROW_METRICS): number {
  return metrics.headerStrip + lane * (metrics.barHeight + metrics.laneGap);
}

/** Lane under a y coordinate relative to the row (clamped at 0). */
export function yToLane(y: number, metrics: RowMetrics = ROW_METRICS): number {
  return Math.max(0, Math.floor((y - metrics.headerStrip) / (metrics.barHeight + metrics.laneGap)));
}

/** Row height for `laneCount` lanes (at least one lane is always reserved). */
export function rowHeight(laneCount: number, metrics: RowMetrics = ROW_METRICS): number {
  const lanes = Math.max(1, laneCount);
  const content = metrics.headerStrip + lanes * metrics.barHeight + (lanes - 1) * metrics.laneGap + metrics.paddingBottom;
  return Math.max(metrics.minHeight, content);
}

export interface BarLayout extends BarSpan {
  assignment: Assignment;
  lane: number;
  y: number;
  height: number;
  /** Week column in which the visible part of the bar starts. */
  firstWeekIndex: number;
}

export interface RowLayout {
  /** Bars that are drawn (lanes beyond the visible ones are left out). */
  bars: BarLayout[];
  laneCount: number;
  height: number;
  /** Bars left out because the row is collapsed to `maxLanes` (0 when everything is shown). */
  hiddenCount: number;
  /** Lane that holds the "+N weitere" chip, or -1. */
  overflowLane: number;
}

/**
 * Full layout of one person row: only assignments visible in the range are laid out
 * (lanes are packed among those), ordered by lane then x. With more than `maxLanes` lanes
 * the row shows `maxLanes − 1` lanes plus a "+N weitere" lane unless `expanded`.
 */
export function layoutRow(
  geom: BoardGeometry,
  assignments: readonly Assignment[],
  metrics: RowMetrics = ROW_METRICS,
  expanded = false,
): RowLayout {
  const visible = assignments
    .map((assignment) => ({ assignment, span: barSpan(geom, assignment.start, assignment.end) }))
    .filter((v): v is { assignment: Assignment; span: BarSpan } => v.span !== null);
  const { lanes, laneCount } = packLanes(geom, visible.map((v) => v.assignment));
  const collapsed = !expanded && laneCount > metrics.maxLanes;
  const shownLanes = collapsed ? metrics.maxLanes - 1 : laneCount;
  const all = visible
    .map(({ assignment, span }) => {
      const lane = lanes.get(assignment.id) ?? 0;
      return {
        ...span,
        assignment,
        lane,
        y: laneTop(lane, metrics),
        height: metrics.barHeight,
        firstWeekIndex: Math.floor(span.x / geom.columnWidth),
      };
    })
    .sort((a, b) => a.lane - b.lane || a.x - b.x);
  const bars = all.filter((b) => b.lane < shownLanes);
  return {
    bars,
    laneCount,
    height: rowHeight(collapsed ? metrics.maxLanes : laneCount, metrics),
    hiddenCount: all.length - bars.length,
    overflowLane: collapsed ? metrics.maxLanes - 1 : -1,
  };
}
