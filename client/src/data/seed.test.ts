import { addWeeks, diffInDays, listWeeks, startOfISOWeek, weekRef } from '../domain/dates';
import { validateAssignment } from '../domain/validation';
import { computeWeekLoad, computeWorkloadMatrix } from '../domain/workload';
import { createSeed } from './seed';

const TODAY = '2026-11-21'; // Saturday of 2026-W47
const week0 = startOfISOWeek(TODAY);
const week = (n: number) => weekRef(addWeeks(week0, n));

describe('createSeed', () => {
  const seed = createSeed(TODAY);
  const byName = (name: string) => {
    const e = seed.employees.find((x) => x.name === name);
    if (!e) throw new Error(`missing ${name}`);
    return e;
  };
  const load = (name: string, n: number) => computeWeekLoad(byName(name), seed.assignments, week(n));

  it('is deterministic', () => {
    expect(createSeed(TODAY)).toEqual(seed);
  });

  it('has the expected size and variety', () => {
    expect(seed.employees).toHaveLength(14);
    expect(seed.projects).toHaveLength(7);
    expect(seed.assignments).toHaveLength(30);
    expect(seed.employees.filter((e) => e.capacity < 1).map((e) => e.capacity).sort()).toEqual([0.5, 0.6, 0.8]);
    expect(seed.employees.filter((e) => !e.active)).toHaveLength(1);
    expect(new Set(seed.employees.map((e) => e.role))).toEqual(
      new Set(['Frontend', 'Backend', 'Design', 'PM', 'QA', 'DevOps']),
    );
    expect(new Set(seed.employees.map((e) => e.seniority))).toEqual(new Set(['junior', 'mid', 'senior', 'lead']));
    expect(new Set(seed.projects.map((p) => p.color)).size).toBe(7);
    expect(new Set(seed.assignments.map((a) => a.id)).size).toBe(30);
  });

  it('places everything relative to the current week (-4 … +16)', () => {
    const starts = seed.projects.map((p) => p.start).sort();
    const ends = seed.projects.map((p) => p.end).sort();
    expect(starts[0]).toBe(addWeeks(week0, -4));
    expect(ends[ends.length - 1] >= addWeeks(week0, 16)).toBe(true);
  });

  it('only contains valid assignments (no blocking errors)', () => {
    for (const a of seed.assignments) {
      expect(validateAssignment(a, seed, a.id).errors).toEqual([]);
    }
  });

  it('has exactly two overbooked person-weeks, both for Jonas in weeks 0 and +1', () => {
    const weeks = listWeeks(addWeeks(week0, -4), addWeeks(week0, 16));
    const m = computeWorkloadMatrix(seed.employees, seed.assignments, weeks);
    const over = Object.values(m)
      .flatMap((row) => Object.values(row))
      .filter((c) => c.status === 'over')
      .map((c) => [c.employeeId, c.weekKey]);
    const jonas = byName('Jonas Fischer').id;
    expect(over).toEqual([
      [jonas, week(0).key],
      [jonas, week(1).key],
    ]);
  });

  it('has one person at exactly 100 % (warning, not over)', () => {
    expect(load('Lukas Müller', 0)).toMatchObject({ utilization: 100, status: 'warning' });
    expect(load('Lukas Müller', 3)).toMatchObject({ utilization: 100, status: 'warning' });
  });

  it('has people with free capacity next month', () => {
    for (const n of [4, 5]) {
      expect(load('Felix Becker', n).status).toBe('free');
      expect(load('Paul Richter', n).status).toBe('free');
    }
    // Felix's last assignment ends mid-week: a partial week.
    expect(load('Felix Becker', 3).load).toBe(30);
  });

  it('has a project ending soon', () => {
    const audit = seed.projects.find((p) => p.name === 'Security-Audit');
    expect(audit).toBeDefined();
    const days = diffInDays(TODAY, audit!.end);
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(14);
  });

  it('moves with the reference date', () => {
    const later = createSeed('2027-01-01'); // 2026-W53
    expect(later.projects[0].start).toBe(addWeeks('2026-12-28', -4));
    expect(later.assignments[0].start).toBe(addWeeks('2026-12-28', -4));
  });
});
