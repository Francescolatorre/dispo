import type { AssignmentInput, PlanningData } from './types';
import { validateAssignment, validateEmployee, validateProject } from './validation';

const data: PlanningData = {
  employees: [
    { id: 'e1', name: 'Anna', role: 'Frontend', seniority: 'mid', capacity: 1, active: true },
    { id: 'e2', name: 'Ben', role: 'Backend', seniority: 'senior', capacity: 0.5, active: false },
  ],
  projects: [{ id: 'p1', name: 'Website-Relaunch', color: 'blue', start: '2026-11-02', end: '2026-12-31', status: 'active' }],
  assignments: [
    { id: 'a1', employeeId: 'e1', projectId: 'p1', start: '2026-11-16', end: '2026-11-27', allocation: 60 },
  ],
};

const input = (over: Partial<AssignmentInput> = {}): AssignmentInput => ({
  employeeId: 'e1',
  projectId: 'p1',
  start: '2026-11-30',
  end: '2026-12-11',
  allocation: 50,
  ...over,
});

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe('validateAssignment – blocking errors', () => {
  it('accepts a clean assignment', () => {
    expect(validateAssignment(input(), data)).toEqual({ errors: [], warnings: [] });
  });

  it('rejects end before start', () => {
    expect(codes(validateAssignment(input({ start: '2026-12-10', end: '2026-12-01' }), data).errors)).toEqual([
      'END_BEFORE_START',
    ]);
  });

  it('accepts a single-day assignment (end == start)', () => {
    expect(validateAssignment(input({ start: '2026-12-01', end: '2026-12-01' }), data).errors).toEqual([]);
  });

  it('rejects invalid dates', () => {
    expect(codes(validateAssignment(input({ start: '2026-02-30' }), data).errors)).toEqual(['INVALID_DATE']);
  });

  it.each([0, 5, 110, -10, Number.NaN])('rejects allocation %s as out of range', (allocation) => {
    expect(codes(validateAssignment(input({ allocation }), data).errors)).toEqual(['ALLOCATION_RANGE']);
  });

  it.each([15, 55, 99])('rejects allocation %s as off-step', (allocation) => {
    expect(codes(validateAssignment(input({ allocation }), data).errors)).toEqual(['ALLOCATION_STEP']);
  });

  it.each([10, 100])('accepts boundary allocation %s', (allocation) => {
    expect(validateAssignment(input({ allocation }), data).errors).toEqual([]);
  });

  it('rejects unknown employee and project', () => {
    expect(codes(validateAssignment(input({ employeeId: 'x', projectId: 'y' }), data).errors)).toEqual([
      'UNKNOWN_EMPLOYEE',
      'UNKNOWN_PROJECT',
    ]);
  });
});

describe('validateAssignment – warnings', () => {
  it('warns about overbooking and lists the affected weeks', () => {
    const r = validateAssignment(input({ start: '2026-11-16', end: '2026-12-04', allocation: 50 }), data);
    expect(r.errors).toEqual([]);
    const over = r.warnings.find((w) => w.code === 'OVERBOOKED');
    expect(over?.weeks).toEqual(['2026-W47', '2026-W48']);
  });

  it('does not warn at exactly 100 %', () => {
    const r = validateAssignment(input({ start: '2026-11-16', end: '2026-11-27', allocation: 40 }), data);
    expect(r.warnings).toEqual([]);
  });

  it('replaces the edited assignment instead of double-counting it (excludeId)', () => {
    const r = validateAssignment(
      { employeeId: 'e1', projectId: 'p1', start: '2026-11-16', end: '2026-11-27', allocation: 100 },
      data,
      'a1',
    );
    expect(r.warnings).toEqual([]);
  });

  it('warns when outside the project dates', () => {
    expect(codes(validateAssignment(input({ end: '2027-01-15' }), data).warnings)).toEqual(['OUTSIDE_PROJECT']);
  });

  it('warns for inactive employees (and checks part-time capacity)', () => {
    const r = validateAssignment(input({ employeeId: 'e2', allocation: 60 }), data);
    expect(codes(r.warnings)).toEqual(['INACTIVE_EMPLOYEE', 'OVERBOOKED']);
  });
});

describe('validateEmployee / validateProject', () => {
  it('validates employees', () => {
    expect(validateEmployee({ name: 'A', role: 'QA', seniority: 'junior', capacity: 0.1, active: true }).errors).toEqual([]);
    expect(
      codes(validateEmployee({ name: ' ', role: '', seniority: 'guru' as never, capacity: 1.2, active: true }).errors),
    ).toEqual(['REQUIRED', 'REQUIRED', 'INVALID_VALUE', 'CAPACITY_RANGE']);
    expect(codes(validateEmployee({ name: 'A', role: 'QA', seniority: 'mid', capacity: 0, active: true }).errors)).toEqual([
      'CAPACITY_RANGE',
    ]);
  });

  it('validates projects', () => {
    expect(
      validateProject({ name: 'P', color: 'teal', start: '2026-01-01', end: '2026-02-01', status: 'planned' }).errors,
    ).toEqual([]);
    expect(
      codes(validateProject({ name: '', color: 'teal', start: '2026-02-01', end: '2026-01-01', status: 'x' as never }).errors),
    ).toEqual(['REQUIRED', 'INVALID_VALUE', 'END_BEFORE_START']);
  });
});
