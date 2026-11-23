import { listWeeks, weekRef } from './dates';
import type { Assignment, Employee } from './types';
import { computeWeekLoad, computeWorkloadMatrix, findFreeCapacity, workloadStatus } from './workload';

const W47 = weekRef('2026-11-16'); // Mon 16 – Sun 22 Nov 2026

const emp = (id: string, over: Partial<Employee> = {}): Employee => ({
  id,
  name: id,
  role: 'Backend',
  seniority: 'mid',
  capacity: 1,
  active: true,
  ...over,
});

let seq = 0;
const asg = (employeeId: string, start: string, end: string, allocation: number): Assignment => ({
  id: `a${(seq += 1)}`,
  employeeId,
  projectId: 'p1',
  start,
  end,
  allocation,
});

describe('workloadStatus', () => {
  it.each([
    [0, 'free'],
    [10, 'luft'],
    [50, 'luft'],
    [50.01, 'ok'],
    [80, 'ok'],
    [99.49, 'ok'],
    [99.5, 'full'],
    [100, 'full'],
    [100.01, 'over'],
    [150, 'over'],
  ])('%s %% → %s', (u, s) => expect(workloadStatus(u)).toBe(s));
});

describe('computeWeekLoad', () => {
  it('is free without assignments', () => {
    const l = computeWeekLoad(emp('e1'), [], W47);
    expect(l).toMatchObject({ load: 0, utilization: 0, freePercent: 100, status: 'free', assignmentIds: [] });
    expect(l.weekKey).toBe('2026-W47');
    expect(l.weekStart).toBe('2026-11-16');
  });

  it('sums full-week assignments', () => {
    const a = [asg('e1', '2026-11-01', '2026-12-31', 50), asg('e1', '2026-11-16', '2026-11-20', 20)];
    expect(computeWeekLoad(emp('e1'), a, W47)).toMatchObject({ load: 70, utilization: 70, freePercent: 30, status: 'ok' });
  });

  it('ignores other employees and non-overlapping assignments', () => {
    const a = [asg('e2', '2026-11-16', '2026-11-20', 100), asg('e1', '2026-11-23', '2026-11-27', 100)];
    expect(computeWeekLoad(emp('e1'), a, W47).load).toBe(0);
  });

  it('weights partial weeks by workdays (Wed–Fri = 3/5)', () => {
    const a = [asg('e1', '2026-11-18', '2026-12-31', 100)];
    expect(computeWeekLoad(emp('e1'), a, W47)).toMatchObject({ load: 60, utilization: 60, status: 'ok' });
  });

  it('weekend-only overlap contributes nothing', () => {
    const a = [asg('e1', '2026-11-21', '2026-11-22', 100)];
    const l = computeWeekLoad(emp('e1'), a, W47);
    expect(l.load).toBe(0);
    expect(l.assignmentIds).toEqual([]);
  });

  it('part-time 0.8 at 80 % allocation is exactly 100 % utilization (full, not over)', () => {
    const l = computeWeekLoad(emp('e1', { capacity: 0.8 }), [asg('e1', '2026-11-16', '2026-11-20', 80)], W47);
    expect(l).toMatchObject({ load: 80, utilization: 100, freePercent: 0, status: 'full' });
  });

  it('exactly 100 % on a full-timer is full (voll), not a warning', () => {
    const a = [asg('e1', '2026-11-16', '2026-11-20', 60), asg('e1', '2026-11-16', '2026-11-20', 40)];
    expect(computeWeekLoad(emp('e1'), a, W47)).toMatchObject({ utilization: 100, status: 'full' });
  });

  it('above 100 % is over and has no free capacity', () => {
    const a = [asg('e1', '2026-11-16', '2026-11-20', 60), asg('e1', '2026-11-16', '2026-11-20', 50)];
    expect(computeWeekLoad(emp('e1'), a, W47)).toMatchObject({ load: 110, utilization: 110, freePercent: 0, status: 'over' });
  });

  it('scales utilization by capacity for part-timers', () => {
    const half = emp('e1', { capacity: 0.5 });
    expect(computeWeekLoad(half, [asg('e1', '2026-11-16', '2026-11-20', 30)], W47)).toMatchObject({
      load: 30,
      utilization: 60,
      freePercent: 20,
      status: 'ok',
    });
    const sixty = emp('e1', { capacity: 0.6 });
    expect(computeWeekLoad(sixty, [asg('e1', '2026-11-16', '2026-11-20', 50)], W47)).toMatchObject({
      utilization: 83.33,
      status: 'ok',
    });
    expect(computeWeekLoad(sixty, [asg('e1', '2026-11-16', '2026-11-20', 70)], W47).status).toBe('over');
  });

  it('a part-week at 100 % on a 0.6 part-timer is 100 % (3 days of 5)', () => {
    const l = computeWeekLoad(emp('e1', { capacity: 0.6 }), [asg('e1', '2026-11-18', '2026-11-20', 100)], W47);
    expect(l).toMatchObject({ load: 60, utilization: 100, status: 'full' });
  });

  it('lists contributing assignment ids', () => {
    const a1 = asg('e1', '2026-11-16', '2026-11-16', 50);
    const a2 = asg('e1', '2026-11-20', '2026-11-30', 50);
    expect(computeWeekLoad(emp('e1'), [a1, a2], W47).assignmentIds).toEqual([a1.id, a2.id]);
    expect(computeWeekLoad(emp('e1'), [a1, a2], W47).load).toBe(20);
  });
});

describe('computeWorkloadMatrix', () => {
  it('returns one cell per employee and week', () => {
    const weeks = listWeeks('2026-11-16', '2026-12-06'); // W47..W49
    const employees = [emp('e1'), emp('e2', { capacity: 0.5 })];
    const assignments = [asg('e1', '2026-11-23', '2026-11-29', 100), asg('e2', '2026-11-16', '2026-12-06', 50)];
    const m = computeWorkloadMatrix(employees, assignments, weeks);
    expect(Object.keys(m)).toEqual(['e1', 'e2']);
    expect(Object.keys(m.e1)).toEqual(['2026-W47', '2026-W48', '2026-W49']);
    expect(m.e1['2026-W47'].status).toBe('free');
    expect(m.e1['2026-W48'].utilization).toBe(100);
    expect(m.e2['2026-W49']).toMatchObject({ load: 50, utilization: 100, status: 'full' });
  });

  it('handles weeks across the 2026/2027 year boundary (W53)', () => {
    const weeks = listWeeks('2026-12-21', '2027-01-10');
    const m = computeWorkloadMatrix([emp('e1')], [asg('e1', '2026-12-30', '2027-01-06', 50)], weeks);
    expect(m.e1['2026-W52'].load).toBe(0);
    expect(m.e1['2026-W53'].load).toBe(30); // Wed–Fri
    expect(m.e1['2027-W01'].load).toBe(30); // Mon–Wed
  });
});

describe('findFreeCapacity', () => {
  const employees = [
    emp('anna', { name: 'Anna', role: 'Frontend' }),
    emp('ben', { name: 'Ben', role: 'Backend' }),
    emp('cara', { name: 'Cara', role: 'Backend', capacity: 0.5 }),
    emp('dora', { name: 'Dora', role: 'Backend', active: false }),
  ];
  const assignments = [
    asg('anna', '2026-11-16', '2026-11-27', 100), // full in W47/W48
    asg('ben', '2026-11-16', '2026-11-20', 80), // 20 free in W47, 100 in W48
    asg('cara', '2026-11-23', '2026-11-27', 20), // 50 free in W47, 30 in W48
  ];
  const range = { from: '2026-11-16', to: '2026-11-29' };

  it('returns active employees with their minimum free % over the range, best first', () => {
    const r = findFreeCapacity(employees, assignments, range);
    expect(r.map((x) => [x.employee.id, x.minFreePercent])).toEqual([
      ['cara', 30],
      ['ben', 20],
      ['anna', 0],
    ]);
    expect(r.find((x) => x.employee.id === 'ben')?.avgFreePercent).toBe(60);
    expect(r[0].weeks).toHaveLength(2);
  });

  it('filters by minimum free percent', () => {
    expect(findFreeCapacity(employees, assignments, { ...range, minFreePercent: 25 }).map((x) => x.employee.id)).toEqual([
      'cara',
    ]);
    expect(findFreeCapacity(employees, assignments, { ...range, minFreePercent: 50 })).toEqual([]);
  });

  it('filters by role (case-insensitive)', () => {
    expect(findFreeCapacity(employees, assignments, { ...range, role: 'frontend' }).map((x) => x.employee.id)).toEqual([
      'anna',
    ]);
  });

  it('excludes inactive employees unless asked', () => {
    expect(findFreeCapacity(employees, assignments, range).some((x) => x.employee.id === 'dora')).toBe(false);
    expect(
      findFreeCapacity(employees, assignments, { ...range, includeInactive: true }).some((x) => x.employee.id === 'dora'),
    ).toBe(true);
  });

  it('returns nothing for an empty range', () => {
    expect(findFreeCapacity(employees, assignments, { from: '2026-12-01', to: '2026-11-01' })).toEqual([]);
  });
});
