/**
 * Demo-data helpers that work against any `Repository` (used for the server; the
 * `LocalRepository` seeds itself).
 */
import { todayISO } from '../domain/dates';
import type { ISODate, PlanningData } from '../domain/types';
import { LocalRepository } from './localRepository';
import { ConflictError, type Repository } from './repository';
import { createSeed } from './seed';

/** Creates every entity of `data` with its fixed id. Already existing ids are skipped (idempotent). */
export async function seedRepository(repo: Repository, data: PlanningData): Promise<void> {
  const ignoreConflict = (e: unknown) => {
    if (!(e instanceof ConflictError)) throw e;
  };
  // Employees and projects first: assignments reference them.
  await Promise.all([
    ...data.employees.map((e) => repo.createEmployee(e).catch(ignoreConflict)),
    ...data.projects.map((p) => repo.createProject(p).catch(ignoreConflict)),
  ]);
  await Promise.all(data.assignments.map((a) => repo.createAssignment(a).catch(ignoreConflict)));
}

/** True if the repository holds neither employees nor projects. */
export async function isEmpty(repo: Repository): Promise<boolean> {
  const [employees, projects] = await Promise.all([repo.listEmployees(), repo.listProjects()]);
  return employees.length === 0 && projects.length === 0;
}

/** Seeds the demo data once: only if the repository is empty. Returns whether it seeded. */
export async function seedIfEmpty(repo: Repository, today: ISODate = todayISO()): Promise<boolean> {
  if (!(await isEmpty(repo))) return false;
  await seedRepository(repo, createSeed(today));
  return true;
}

/** Deletes everything (deleting employees and projects cascades to their assignments). */
export async function clearRepository(repo: Repository): Promise<void> {
  const [employees, projects] = await Promise.all([repo.listEmployees(), repo.listProjects()]);
  await Promise.all(projects.map((p) => repo.deleteProject(p.id)));
  await Promise.all(employees.map((e) => repo.deleteEmployee(e.id)));
}

/** Replaces all data with fresh demo data relative to `today`. */
export async function resetDemoData(repo: Repository, today: ISODate = todayISO()): Promise<void> {
  if (repo instanceof LocalRepository) {
    await repo.reset(today);
    return;
  }
  await clearRepository(repo);
  await seedRepository(repo, createSeed(today));
}
