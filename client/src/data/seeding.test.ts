import type { PlanningData } from '../domain/types';
import { LocalRepository } from './localRepository';
import type { Repository } from './repository';
import { createSeed } from './seed';
import { clearRepository, isEmpty, resetDemoData, seedIfEmpty, seedRepository } from './seeding';

const TODAY = '2026-11-21';
const EMPTY: PlanningData = { employees: [], projects: [], assignments: [] };

/** A LocalRepository that starts empty — stands in for a fresh server database. */
const emptyRepo = () => new LocalRepository({ storage: null, seed: () => structuredClone(EMPTY) });

/** Hides the LocalRepository class so `resetDemoData` takes the generic (server) path. */
const asGeneric = (repo: Repository): Repository => {
  const generic = {} as Repository;
  for (const key of Object.getOwnPropertyNames(LocalRepository.prototype)) {
    if (key === 'constructor') continue;
    const value = (repo as unknown as Record<string, unknown>)[key];
    if (typeof value === 'function') (generic as unknown as Record<string, unknown>)[key] = value.bind(repo);
  }
  return generic;
};

describe('seeding', () => {
  it('seeds an empty repository once with the fixed seed ids', async () => {
    const repo = emptyRepo();
    expect(await isEmpty(repo)).toBe(true);
    expect(await seedIfEmpty(repo, TODAY)).toBe(true);
    const seed = createSeed(TODAY);
    expect((await repo.listEmployees()).map((e) => e.id).sort()).toEqual(seed.employees.map((e) => e.id).sort());
    expect((await repo.listAssignments()).map((a) => a.id).sort()).toEqual(seed.assignments.map((a) => a.id).sort());
    expect(await seedIfEmpty(repo, TODAY)).toBe(false);
    expect(await repo.listAssignments()).toHaveLength(seed.assignments.length);
  });

  it('seedRepository is idempotent (existing ids are skipped)', async () => {
    const repo = emptyRepo();
    const seed = createSeed(TODAY);
    await seedRepository(repo, seed);
    await expect(seedRepository(repo, seed)).resolves.toBeUndefined();
    expect(await repo.listEmployees()).toHaveLength(seed.employees.length);
  });

  it('clearRepository removes everything', async () => {
    const repo = new LocalRepository({ storage: null, today: TODAY });
    await clearRepository(repo);
    expect(await isEmpty(repo)).toBe(true);
    expect(await repo.listAssignments()).toEqual([]);
  });

  it('resetDemoData (generic path) deletes all data and reseeds', async () => {
    const local = new LocalRepository({ storage: null, today: TODAY });
    await local.createEmployee({ id: 'extra', name: 'Extra', role: 'QA', seniority: 'mid', capacity: 1, active: true });
    await local.deleteAssignment('asg-01');
    await resetDemoData(asGeneric(local), TODAY);
    const seed = createSeed(TODAY);
    expect((await local.listEmployees()).some((e) => e.id === 'extra')).toBe(false);
    expect(await local.listAssignments()).toHaveLength(seed.assignments.length);
    expect((await local.listAssignments()).some((a) => a.id === 'asg-01')).toBe(true);
  });

  it('resetDemoData uses LocalRepository.reset for the browser source', async () => {
    const local = new LocalRepository({ storage: null, today: TODAY });
    const spy = vi.spyOn(local, 'reset');
    await resetDemoData(local, TODAY);
    expect(spy).toHaveBeenCalledWith(TODAY);
  });
});
