/**
 * End-to-end check of HttpRepository + planningActions against a REAL running API.
 * Skipped unless DISPO_API_IT=1. Run (API + Postgres up, see README "Backend"):
 *
 *   DISPO_API_IT=1 npx vitest run src/data/httpRepository.integration.test.ts
 *
 * Base URL: DISPO_API_URL (default http://localhost:3001/api). The test only touches records
 * it creates itself (ids prefixed `it-<timestamp>-`) and removes them afterwards, so it is safe
 * to run against the dev database.
 */
import { addDays, addWeeks, startOfISOWeek, todayISO } from '../domain/dates';
import { createPlanningActions, snapshotFromRepository, type ActionResult } from '../domain/planningActions';
import { HttpRepository } from './httpRepository';
import { ConflictError, NotFoundError, ValidationError } from './repository';

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const enabled = env.DISPO_API_IT === '1';
const baseUrl = env.DISPO_API_URL ?? 'http://localhost:3001/api';

function expectOk<T>(r: ActionResult<T>): asserts r is Extract<ActionResult<T>, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r.errors)}`);
}

describe.skipIf(!enabled)('HttpRepository against the real API', () => {
  const repo = new HttpRepository({ baseUrl });
  const prefix = `it-${Date.now().toString(36)}`;
  const EMP_A = `${prefix}-emp-a`;
  const EMP_B = `${prefix}-emp-b`;
  const PRJ = `${prefix}-prj`;
  const monday = addWeeks(startOfISOWeek(todayISO()), 1);
  const friday = addDays(monday, 4);

  beforeAll(async () => {
    const person = { role: 'QA', seniority: 'mid' as const, capacity: 1, active: true };
    await repo.createEmployee({ id: EMP_A, name: `${prefix} Anna`, ...person });
    await repo.createEmployee({ id: EMP_B, name: `${prefix} Bert`, ...person });
    await repo.createProject({
      id: PRJ,
      name: `${prefix} Projekt`,
      color: 'teal',
      start: addWeeks(monday, -4),
      end: addWeeks(monday, 8),
      status: 'active',
    });
  });

  afterAll(async () => {
    for (const del of [() => repo.deleteProject(PRJ), () => repo.deleteEmployee(EMP_A), () => repo.deleteEmployee(EMP_B)]) {
      await del().catch((e: unknown) => {
        if (!(e instanceof NotFoundError)) throw e;
      });
    }
  });

  it('runs create → move → reassign → delete → undo/redo through planningActions', async () => {
    const actions = createPlanningActions(repo, () => snapshotFromRepository(repo));

    const created = await actions.createAssignment({
      employeeId: EMP_A,
      projectId: PRJ,
      start: monday,
      end: friday,
      allocation: 50,
      role: 'Tester',
    });
    expectOk(created);
    const id = created.result.id;
    expect(created.impact.map((i) => [i.before, i.after])).toEqual([[0, 50]]);

    expectOk(await actions.moveAssignment(id, { weeks: 2 }));
    expectOk(await actions.moveAssignment(id, { employeeId: EMP_B }));
    let [current] = await repo.listAssignments({ projectId: PRJ });
    expect(current).toMatchObject({ id, employeeId: EMP_B, start: addWeeks(monday, 2), end: addWeeks(friday, 2) });

    // server-side filters
    expect(await repo.listAssignments({ employeeId: EMP_A })).toEqual([]);
    expect(await repo.listAssignments({ projectId: PRJ, to: addDays(monday, 6) })).toEqual([]);
    expect(await repo.listAssignments({ projectId: PRJ, from: addWeeks(monday, 2), to: addWeeks(monday, 2) })).toHaveLength(1);

    expectOk(await actions.deleteAssignment(id));
    expect(await repo.listAssignments({ projectId: PRJ })).toEqual([]);

    // undo delete → same id again
    expect(await actions.undo()).toMatchObject({ ok: true, label: 'Einsatz löschen' });
    [current] = await repo.listAssignments({ projectId: PRJ });
    expect(current).toMatchObject({ id, employeeId: EMP_B, role: 'Tester' });

    // undo both moves → original
    await actions.undo();
    await actions.undo();
    [current] = await repo.listAssignments({ projectId: PRJ });
    expect(current).toEqual({ id, employeeId: EMP_A, projectId: PRJ, start: monday, end: friday, allocation: 50, role: 'Tester' });

    // redo the moves and the delete
    await actions.redo();
    await actions.redo();
    expect((await actions.redo()).ok).toBe(true);
    expect(await repo.listAssignments({ projectId: PRJ })).toEqual([]);
    await actions.undo();
    expect((await repo.listAssignments({ projectId: PRJ }))[0].id).toBe(id);
  });

  it('undoing an employee delete restores the employee and its assignments with original ids', async () => {
    const actions = createPlanningActions(repo, () => snapshotFromRepository(repo));
    const base = { employeeId: EMP_A, projectId: PRJ, allocation: 30 };
    await repo.createAssignment({ ...base, id: `${prefix}-asg-1`, start: monday, end: friday });
    await repo.createAssignment({ ...base, id: `${prefix}-asg-2`, start: addWeeks(monday, 3), end: addWeeks(friday, 3) });
    const before = await repo.listAssignments({ employeeId: EMP_A });
    expect(before.map((a) => a.id)).toEqual([`${prefix}-asg-1`, `${prefix}-asg-2`]);
    expectOk(await actions.deleteEmployee(EMP_A));
    expect(await repo.listAssignments({ employeeId: EMP_A })).toEqual([]);
    expect(await actions.undo()).toMatchObject({ ok: true });
    expect((await repo.listEmployees()).some((e) => e.id === EMP_A)).toBe(true);
    expect(await repo.listAssignments({ employeeId: EMP_A })).toEqual(before);
  });

  it('maps API errors to typed repository errors', async () => {
    await expect(
      repo.createEmployee({ id: EMP_A, name: 'dup', role: 'QA', seniority: 'mid', capacity: 1, active: true }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(repo.updateAssignment(`${prefix}-missing`, { allocation: 20 })).rejects.toBeInstanceOf(NotFoundError);
    const invalid = await repo
      .createAssignment({ employeeId: EMP_A, projectId: PRJ, start: monday, end: friday, allocation: 55 })
      .catch((e: unknown) => e);
    expect(invalid).toBeInstanceOf(ValidationError);
    expect((invalid as ValidationError).details.map((d) => d.field)).toContain('allocation');
  });

  it('clears a role with role:null and omits it afterwards', async () => {
    const a = await repo.createAssignment({
      employeeId: EMP_B,
      projectId: PRJ,
      start: monday,
      end: friday,
      allocation: 20,
      role: 'Review',
    });
    const cleared = await repo.updateAssignment(a.id, { role: null });
    expect('role' in cleared).toBe(false);
    await repo.deleteAssignment(a.id);
  });
});
