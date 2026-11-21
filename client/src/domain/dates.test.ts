import {
  addDays,
  addWeeks,
  countWorkdays,
  diffInDays,
  endOfISOWeek,
  formatISODate,
  isISODate,
  isoWeekKey,
  isoWeeksInYear,
  isoWeekdayIndex,
  listWeeks,
  overlapWorkdays,
  parseISODate,
  startOfISOWeek,
  todayISO,
  weekRef,
  weekStartFromKey,
} from './dates';

// Run with a DST-observing timezone so DST weeks are meaningful (Node re-reads TZ on assignment).
const originalTZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'Europe/Berlin';
});
afterAll(() => {
  process.env.TZ = originalTZ;
});

describe('isISODate', () => {
  it.each(['2026-11-21', '2024-02-29', '2026-12-31'])('accepts %s', (d) => expect(isISODate(d)).toBe(true));
  it.each(['2026-02-29', '2026-13-01', '2026-1-1', '21.11.2026', '', '2026-11-21T00:00:00Z', 20261121])(
    'rejects %s',
    (d) => expect(isISODate(d)).toBe(false),
  );
});

describe('parse / format', () => {
  it('round-trips local calendar days, including DST switch days', () => {
    for (const d of ['2026-03-29', '2026-10-25', '2026-01-01', '2026-12-31', '2026-11-21']) {
      expect(formatISODate(parseISODate(d))).toBe(d);
    }
  });

  it('parses to local midnight', () => {
    const dt = parseISODate('2026-03-29');
    expect([dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours()]).toEqual([2026, 2, 29, 0]);
  });

  it('formats the local day even late in the evening (no UTC shift)', () => {
    expect(formatISODate(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31');
    expect(todayISO(new Date(2027, 0, 1, 0, 15))).toBe('2027-01-01');
  });

  it('throws on invalid input', () => {
    expect(() => parseISODate('2026-02-30')).toThrow(RangeError);
  });
});

describe('day arithmetic', () => {
  it('adds days across DST transitions without drifting', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addWeeks('2026-03-23', 1)).toBe('2026-03-30');
    expect(addWeeks('2026-10-19', 1)).toBe('2026-10-26');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addWeeks('2026-12-28', -1)).toBe('2026-12-21');
    expect(diffInDays('2026-12-28', '2027-01-04')).toBe(7);
  });
});

describe('ISO weeks', () => {
  it('computes weekday index (Mon = 0 … Sun = 6)', () => {
    expect(isoWeekdayIndex('2026-11-16')).toBe(0);
    expect(isoWeekdayIndex('2026-11-21')).toBe(5);
    expect(isoWeekdayIndex('2026-11-22')).toBe(6);
  });

  it('finds Monday and Sunday of a week', () => {
    expect(startOfISOWeek('2026-11-21')).toBe('2026-11-16');
    expect(startOfISOWeek('2026-11-16')).toBe('2026-11-16');
    expect(endOfISOWeek('2026-11-21')).toBe('2026-11-22');
    expect(startOfISOWeek('2027-01-01')).toBe('2026-12-28');
  });

  it('builds week keys', () => {
    expect(isoWeekKey('2026-11-21')).toBe('2026-W47');
    expect(isoWeekKey('2026-01-01')).toBe('2026-W01');
    expect(isoWeekKey('2025-12-29')).toBe('2026-W01');
    expect(isoWeekKey('2024-12-30')).toBe('2025-W01');
    expect(isoWeekKey('2021-01-03')).toBe('2020-W53');
  });

  it('handles 2026, a 53-week year, at the year boundary', () => {
    expect(isoWeeksInYear(2026)).toBe(53);
    expect(isoWeeksInYear(2025)).toBe(52);
    expect(isoWeeksInYear(2027)).toBe(52);
    expect(isoWeekKey('2026-12-28')).toBe('2026-W53');
    expect(isoWeekKey('2026-12-31')).toBe('2026-W53');
    expect(isoWeekKey('2027-01-03')).toBe('2026-W53');
    expect(isoWeekKey('2027-01-04')).toBe('2027-W01');
  });

  it('resolves week keys back to Mondays', () => {
    expect(weekStartFromKey('2026-W47')).toBe('2026-11-16');
    expect(weekStartFromKey('2026-W53')).toBe('2026-12-28');
    expect(weekStartFromKey('2026-W01')).toBe('2025-12-29');
    expect(weekStartFromKey('2027-W01')).toBe('2027-01-04');
    expect(() => weekStartFromKey('2025-W53')).toThrow(RangeError);
    expect(() => weekStartFromKey('2026-48')).toThrow(RangeError);
  });

  it('describes a week', () => {
    expect(weekRef('2027-01-02')).toEqual({ key: '2026-W53', year: 2026, week: 53, start: '2026-12-28', end: '2027-01-03' });
  });

  it('lists the weeks in a range, including partially covered edge weeks', () => {
    expect(listWeeks('2026-12-23', '2027-01-05').map((w) => w.key)).toEqual(['2026-W52', '2026-W53', '2027-W01']);
    expect(listWeeks('2026-11-16', '2026-11-16').map((w) => w.key)).toEqual(['2026-W47']);
    expect(listWeeks('2026-11-20', '2026-11-10')).toEqual([]);
  });

  it('lists DST weeks with exact 7-day spacing', () => {
    const weeks = listWeeks('2026-03-20', '2026-04-02');
    expect(weeks.map((w) => [w.key, w.start, w.end])).toEqual([
      ['2026-W12', '2026-03-16', '2026-03-22'],
      ['2026-W13', '2026-03-23', '2026-03-29'],
      ['2026-W14', '2026-03-30', '2026-04-05'],
    ]);
    expect(listWeeks('2026-10-19', '2026-10-26').map((w) => w.start)).toEqual(['2026-10-19', '2026-10-26']);
  });
});

describe('workdays', () => {
  it('counts Monday–Friday days in a range', () => {
    expect(countWorkdays('2026-11-16', '2026-11-22')).toBe(5);
    expect(countWorkdays('2026-11-18', '2026-11-24')).toBe(5);
    expect(countWorkdays('2026-11-21', '2026-11-22')).toBe(0);
    expect(countWorkdays('2026-11-20', '2026-11-20')).toBe(1);
    expect(countWorkdays('2026-12-28', '2027-01-10')).toBe(10);
    expect(countWorkdays('2026-03-23', '2026-03-29')).toBe(5);
    expect(countWorkdays('2026-11-22', '2026-11-16')).toBe(0);
  });

  it('counts overlap between a range and a week', () => {
    const w47 = weekRef('2026-11-16');
    expect(overlapWorkdays('2026-11-18', '2026-12-31', w47)).toBe(3);
    expect(overlapWorkdays('2026-11-01', '2026-11-17', w47)).toBe(2);
    expect(overlapWorkdays('2026-11-01', '2026-12-31', w47)).toBe(5);
    expect(overlapWorkdays('2026-11-21', '2026-11-30', w47)).toBe(0);
    expect(overlapWorkdays('2026-12-01', '2026-12-31', w47)).toBe(0);
    expect(overlapWorkdays('2026-12-30', '2027-01-15', weekRef('2026-12-28'))).toBe(3);
  });
});
