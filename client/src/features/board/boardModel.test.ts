import { createSeed } from '../../data/seed';
import {
  computeInsights,
  defaultRangeStart,
  DEFAULT_FILTERS,
  filterEmployees,
  formatDate,
  formatDayMonth,
  formatPercent,
  hasActiveFilters,
  monthSegments,
  VISIBLE_WEEKS,
  visibleWeeks,
} from './boardModel';

const TODAY = '2026-11-25'; // Wednesday, KW 48
const seed = createSeed(TODAY);

describe('range', () => {
  it('starts two weeks before the current week and spans 17 weeks', () => {
    expect(defaultRangeStart(TODAY)).toBe('2026-11-09');
    const weeks = visibleWeeks(defaultRangeStart(TODAY));
    expect(weeks).toHaveLength(VISIBLE_WEEKS);
    expect(weeks[0].key).toBe('2026-W46');
    expect(weeks[16].key).toBe('2027-W09');
  });

  it('normalises a non-Monday range start', () => {
    expect(visibleWeeks('2026-11-12', 2).map((w) => w.start)).toEqual(['2026-11-09', '2026-11-16']);
  });
});

describe('monthSegments', () => {
  it('groups weeks by the month of their Thursday', () => {
    // KW 48 (23.–29.11.) belongs to November, KW 49 (30.11.–06.12., Thursday 03.12.) to December.
    const segments = monthSegments(visibleWeeks('2026-11-23', 3));
    expect(segments.map((s) => [s.label, s.startIndex, s.weekCount])).toEqual([
      ['November 2026', 0, 1],
      ['Dezember 2026', 1, 2],
    ]);
    expect(segments[1].shortLabel).toBe('Dez');
  });
});

describe('insights', () => {
  it('counts overbooked person-weeks and finds people with free capacity in the next 4 weeks', () => {
    const insights = computeInsights(seed.employees, seed.assignments, TODAY);
    expect(insights.from).toBe('2026-11-23');
    expect(insights.to).toBe('2026-12-20');
    expect(insights.overbookedPersonWeeks).toBe(2);
    expect([...insights.overbookedEmployeeIds]).toEqual(['emp-04']);
    expect(insights.freeEmployeeIds.has('emp-04')).toBe(false); // Jonas is overbooked
    expect(insights.freeEmployeeIds.has('emp-14')).toBe(false); // inactive people never count
    expect(insights.freeEmployeeIds.has('emp-08')).toBe(true); // Maximilian: 60 % / 40 % load
  });
});

describe('filterEmployees', () => {
  const insights = computeInsights(seed.employees, seed.assignments, TODAY);
  const ctx = { insights, rangeStart: '2026-11-09', rangeEnd: '2027-03-07' };
  const names = (patch: Partial<typeof DEFAULT_FILTERS>) =>
    filterEmployees(seed.employees, seed.assignments, { ...DEFAULT_FILTERS, ...patch }, ctx).map((e) => e.name);

  it('hides inactive people unless requested', () => {
    expect(names({})).toHaveLength(13);
    expect(names({ showInactive: true })).toHaveLength(14);
  });

  it('searches names case-insensitively', () => {
    expect(names({ search: '  MÜLL ' })).toEqual(['Lukas Müller']);
  });

  it('combines role and project filters', () => {
    expect(names({ role: 'QA' })).toEqual(['Laura Hoffmann', 'Tim Wolf']);
    expect(names({ projectId: 'prj-03' })).toEqual(['Jonas Fischer', 'Laura Hoffmann', 'Maximilian Schulz']);
    expect(names({ projectId: 'prj-03', role: 'QA' })).toEqual(['Laura Hoffmann']);
  });

  it('only counts project assignments within the visible range', () => {
    const later = { ...ctx, rangeStart: '2027-01-04', rangeEnd: '2027-04-25' };
    const result = filterEmployees(seed.employees, seed.assignments, { ...DEFAULT_FILTERS, projectId: 'prj-03' }, later);
    expect(result).toEqual([]);
  });

  it('filters by free capacity and overbooking', () => {
    expect(names({ onlyOverbooked: true })).toEqual(['Jonas Fischer']);
    expect(new Set(names({ onlyFree: true }))).toEqual(
      new Set(seed.employees.filter((e) => insights.freeEmployeeIds.has(e.id)).map((e) => e.name)),
    );
  });

  it('knows when filters are active (showInactive is a view option, not a filter)', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, showInactive: true })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: ' ' })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, role: 'PM' })).toBe(true);
  });
});

describe('formatting', () => {
  it('formats dates and percentages in German style', () => {
    expect(formatDayMonth('2026-11-24')).toBe('24.11.');
    expect(formatDate('2026-11-24')).toBe('24.11.2026');
    expect(formatPercent(87.5)).toBe('88 %');
    expect(formatPercent(Infinity)).toBe('∞ %');
  });
});
