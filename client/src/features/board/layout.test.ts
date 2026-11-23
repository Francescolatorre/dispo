import { listWeeks } from '../../domain/dates';
import type { Assignment } from '../../domain/types';
import {
  barSpan,
  createGeometry,
  dateToWeekIndex,
  dateToX,
  laneTop,
  layoutRow,
  packLanes,
  ROW_METRICS,
  ROW_METRICS_COMPACT,
  rowHeight,
  visualDayInterval,
  weekIndexToRange,
  weekIndexToX,
  xToDate,
  xToDayOffset,
  xToWeekBoundary,
  xToWeekIndex,
  yToLane,
} from './layout';

// 2026-11-23 is the Monday of ISO week 48. Four weeks: KW 48 … KW 51.
const weeks = listWeeks('2026-11-23', '2026-12-20');
const geom = createGeometry(weeks, 70); // 10 px per day keeps the numbers readable

const asg = (id: string, start: string, end: string, allocation = 50): Assignment => ({
  id,
  employeeId: 'emp-1',
  projectId: 'prj-1',
  start,
  end,
  allocation,
});

describe('createGeometry', () => {
  it('derives range and total width from the weeks', () => {
    expect(geom).toEqual({
      rangeStart: '2026-11-23',
      rangeEnd: '2026-12-20',
      weekCount: 4,
      columnWidth: 70,
      totalWidth: 280,
    });
  });

  it('rejects empty week lists and non-positive widths', () => {
    expect(() => createGeometry([], 70)).toThrow(RangeError);
    expect(() => createGeometry(weeks, 0)).toThrow(RangeError);
  });
});

describe('date ↔ x', () => {
  it('maps dates to day-precise x positions (7 days per column)', () => {
    expect(dateToX(geom, '2026-11-23')).toBe(0);
    expect(dateToX(geom, '2026-11-25')).toBe(20);
    expect(dateToX(geom, '2026-11-30')).toBe(70);
    expect(dateToX(geom, '2026-11-16')).toBe(-70);
    expect(weekIndexToX(geom, 3)).toBe(210);
  });

  it('inverts x to day offsets, dates and week indices', () => {
    expect(xToDayOffset(geom, 25)).toBe(2.5);
    expect(xToDate(geom, 25)).toBe('2026-11-25');
    expect(xToDate(geom, 69.9)).toBe('2026-11-29');
    expect(xToDate(geom, 70)).toBe('2026-11-30');
    expect(xToWeekIndex(geom, 0)).toBe(0);
    expect(xToWeekIndex(geom, 69)).toBe(0);
    expect(xToWeekIndex(geom, 70)).toBe(1);
  });

  it('clamps inverse lookups to the visible range', () => {
    expect(xToDate(geom, -50)).toBe('2026-11-23');
    expect(xToDate(geom, 10_000)).toBe('2026-12-20');
    expect(xToWeekIndex(geom, -1)).toBe(0);
    expect(xToWeekIndex(geom, 10_000)).toBe(3);
    expect(xToWeekBoundary(geom, 100)).toBe(1);
    expect(xToWeekBoundary(geom, 110)).toBe(2);
    expect(xToWeekBoundary(geom, 10_000)).toBe(4);
  });

  it('round-trips date → x → date for every visible day', () => {
    for (let d = 0; d < 28; d += 1) {
      const date = xToDate(geom, d * 10);
      expect(dateToX(geom, date)).toBe(d * 10);
    }
  });

  it('finds the week column of a date', () => {
    expect(dateToWeekIndex(geom, '2026-11-23')).toBe(0);
    expect(dateToWeekIndex(geom, '2026-11-29')).toBe(0);
    expect(dateToWeekIndex(geom, '2026-12-01')).toBe(1);
    expect(dateToWeekIndex(geom, '2026-11-22')).toBe(-1);
  });

  it('converts week columns to a Monday–Friday date range (order-insensitive)', () => {
    expect(weekIndexToRange(geom, 1, 2)).toEqual({ start: '2026-11-30', end: '2026-12-11' });
    expect(weekIndexToRange(geom, 2, 1)).toEqual({ start: '2026-11-30', end: '2026-12-11' });
    expect(weekIndexToRange(geom, 0, 0)).toEqual({ start: '2026-11-23', end: '2026-11-27' });
  });
});

describe('visualDayInterval (workweek snapping)', () => {
  it('draws Mon–Fri as the full column', () => {
    expect(visualDayInterval(geom, '2026-11-23', '2026-11-27')).toEqual({ startDay: 0, endDay: 7 });
  });

  it('keeps mid-week starts and ends day-precise', () => {
    expect(visualDayInterval(geom, '2026-11-25', '2026-12-02')).toEqual({ startDay: 2, endDay: 10 });
  });

  it('extends Sat/Sun ends to the end of the week and moves Sat/Sun starts to Monday', () => {
    expect(visualDayInterval(geom, '2026-11-23', '2026-11-28')).toEqual({ startDay: 0, endDay: 7 });
    expect(visualDayInterval(geom, '2026-11-23', '2026-11-29')).toEqual({ startDay: 0, endDay: 7 });
    expect(visualDayInterval(geom, '2026-11-28', '2026-12-04')).toEqual({ startDay: 7, endDay: 14 });
    expect(visualDayInterval(geom, '2026-11-29', '2026-12-04')).toEqual({ startDay: 7, endDay: 14 });
  });

  it('collapses a weekend-only range to zero width', () => {
    const { startDay, endDay } = visualDayInterval(geom, '2026-11-28', '2026-11-29');
    expect(endDay - startDay).toBe(0);
  });
});

describe('barSpan', () => {
  it('positions a one-week Mon–Fri bar over exactly one column', () => {
    expect(barSpan(geom, '2026-11-30', '2026-12-04')).toEqual({ x: 70, width: 70, clippedStart: false, clippedEnd: false });
  });

  it('ends a bar that stops on Wednesday at 3/7 of the column', () => {
    expect(barSpan(geom, '2026-11-23', '2026-12-02')).toEqual({ x: 0, width: 100, clippedStart: false, clippedEnd: false });
  });

  it('clips bars that extend beyond the visible range and flags the clipped sides', () => {
    expect(barSpan(geom, '2026-11-02', '2026-11-27')).toEqual({ x: 0, width: 70, clippedStart: true, clippedEnd: false });
    expect(barSpan(geom, '2026-12-14', '2027-01-29')).toEqual({ x: 210, width: 70, clippedStart: false, clippedEnd: true });
    expect(barSpan(geom, '2026-01-01', '2027-12-31')).toEqual({ x: 0, width: 280, clippedStart: true, clippedEnd: true });
  });

  it('returns null for bars completely outside the range or with no visible width', () => {
    expect(barSpan(geom, '2026-11-02', '2026-11-20')).toBeNull();
    expect(barSpan(geom, '2026-12-21', '2026-12-25')).toBeNull();
    expect(barSpan(geom, '2026-11-28', '2026-11-29')).toBeNull();
  });

  it('scales with the column width (zoom)', () => {
    const wide = createGeometry(weeks, 140);
    expect(barSpan(wide, '2026-11-30', '2026-12-04')).toEqual({ x: 140, width: 140, clippedStart: false, clippedEnd: false });
  });
});

describe('packLanes', () => {
  it('puts non-overlapping (also touching) items into one lane', () => {
    const { lanes, laneCount } = packLanes(geom, [
      asg('a', '2026-11-23', '2026-11-27'),
      asg('b', '2026-11-30', '2026-12-04'), // starts the Monday after a's Friday → touches
      asg('c', '2026-12-07', '2026-12-18'),
    ]);
    expect(laneCount).toBe(1);
    expect([...lanes.values()]).toEqual([0, 0, 0]);
  });

  it('stacks overlapping items into separate lanes and reuses freed lanes', () => {
    const { lanes, laneCount } = packLanes(geom, [
      asg('long', '2026-11-23', '2026-12-18'),
      asg('first', '2026-11-23', '2026-11-27'),
      asg('second', '2026-11-30', '2026-12-04'),
      asg('overlap', '2026-11-25', '2026-12-01'),
    ]);
    expect(laneCount).toBe(3);
    expect(lanes.get('first')).toBe(0); // shortest of the items starting first
    expect(lanes.get('long')).toBe(1);
    expect(lanes.get('overlap')).toBe(2);
    expect(lanes.get('second')).toBe(0); // lane 0 is free again after "first"
  });

  it('is deterministic regardless of input order', () => {
    const items = [asg('x', '2026-11-23', '2026-12-04'), asg('y', '2026-11-23', '2026-12-04'), asg('z', '2026-11-30', '2026-12-11')];
    const a = packLanes(geom, items);
    const b = packLanes(geom, [...items].reverse());
    expect([...a.lanes.entries()].sort()).toEqual([...b.lanes.entries()].sort());
    expect(a.laneCount).toBe(3);
  });

  it('handles empty input', () => {
    expect(packLanes(geom, [])).toEqual({ lanes: new Map(), laneCount: 0 });
  });
});

describe('row metrics', () => {
  it('reserves at least one lane and honours the minimum height', () => {
    expect(rowHeight(0)).toBe(rowHeight(1));
    expect(rowHeight(1)).toBe(48);
    expect(rowHeight(2)).toBe(72);
    expect(rowHeight(3)).toBe(96);
  });

  it('grows by bar height + gap per extra lane', () => {
    expect(rowHeight(3) - rowHeight(2)).toBe(ROW_METRICS.barHeight + ROW_METRICS.laneGap);
  });

  it('maps lanes to y and back', () => {
    expect(laneTop(0)).toBe(ROW_METRICS.headerStrip);
    expect(laneTop(2)).toBe(ROW_METRICS.headerStrip + 2 * 24);
    expect(yToLane(laneTop(2) + 5)).toBe(2);
    expect(yToLane(0)).toBe(0);
  });
});

describe('layoutRow', () => {
  it('lays out only visible bars with lanes, y and first week index', () => {
    const row = layoutRow(geom, [
      asg('past', '2026-10-05', '2026-10-30'),
      asg('a', '2026-11-23', '2026-12-11'),
      asg('b', '2026-12-02', '2026-12-18'),
    ]);
    expect(row.bars.map((b) => b.assignment.id)).toEqual(['a', 'b']);
    expect(row.laneCount).toBe(2);
    expect(row.height).toBe(rowHeight(2));
    const b = row.bars[1];
    expect(b).toMatchObject({ lane: 1, y: laneTop(1), x: 90, width: 190, firstWeekIndex: 1, height: ROW_METRICS.barHeight });
  });

  it('collapses more than maxLanes lanes into a "+N weitere" lane unless expanded', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map((id) => asg(id, '2026-11-23', '2026-12-11'));
    const row = layoutRow(geom, items);
    expect(row.laneCount).toBe(5);
    expect(row.bars.map((b) => b.lane)).toEqual([0, 1]);
    expect(row).toMatchObject({ hiddenCount: 3, overflowLane: 2, height: rowHeight(3) });
    const open = layoutRow(geom, items, ROW_METRICS, true);
    expect(open).toMatchObject({ hiddenCount: 0, overflowLane: -1, height: rowHeight(5) });
    expect(open.bars).toHaveLength(5);
    const compact = layoutRow(geom, items, ROW_METRICS_COMPACT);
    expect(compact).toMatchObject({ hiddenCount: 4, overflowLane: 1, height: 64 });
  });

  it('returns a single-lane height for an empty row', () => {
    expect(layoutRow(geom, [])).toEqual({ bars: [], laneCount: 0, height: rowHeight(0), hiddenCount: 0, overflowLane: -1 });
  });
});
