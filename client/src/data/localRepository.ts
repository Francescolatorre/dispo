/**
 * In-memory `Repository` persisted to (an injectable) localStorage under a versioned key.
 * On first use — or when the stored payload is missing/corrupt — it seeds demo data.
 */
import { rangesOverlap, todayISO } from '../domain/dates';
import type {
  Assignment,
  AssignmentInput,
  AssignmentUpdate,
  Employee,
  EmployeeInput,
  EmployeeUpdate,
  ISODate,
  PlanningData,
  Project,
  ProjectInput,
  ProjectUpdate,
} from '../domain/types';
import {
  ConflictError,
  NotFoundError,
  type AssignmentQuery,
  type EntityName,
  type Repository,
  type WithOptionalId,
} from './repository';
import { createSeed } from './seed';

export const STORAGE_KEY = 'dispo.v1';

/** The subset of the Web Storage API we need (lets tests pass a fake or `null`). */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface LocalRepositoryOptions {
  /** Defaults to `window.localStorage` when available; `null` = memory only. */
  storage?: StorageLike | null;
  key?: string;
  /** Reference day for the seed (default: today). */
  today?: ISODate;
  /** Custom seed (default: `createSeed`). */
  seed?: (today: ISODate) => PlanningData;
  /** Id generator (default: prefix + timestamp + counter). */
  generateId?: (prefix: 'emp' | 'prj' | 'asg') => string;
}

interface StoredPayload extends PlanningData {
  version: 1;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isPlanningData(value: unknown): value is StoredPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<StoredPayload>;
  return v.version === 1 && Array.isArray(v.employees) && Array.isArray(v.projects) && Array.isArray(v.assignments);
}

/** Drops keys whose value is `undefined` so a patch never erases fields by accident. */
function definedOnly<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export class LocalRepository implements Repository {
  private data: PlanningData;
  private readonly storage: StorageLike | null;
  private readonly key: string;
  private readonly seedFn: (today: ISODate) => PlanningData;
  private readonly today?: ISODate;
  private readonly generateId: (prefix: 'emp' | 'prj' | 'asg') => string;

  constructor(options: LocalRepositoryOptions = {}) {
    this.storage = options.storage === undefined ? defaultStorage() : options.storage;
    this.key = options.key ?? STORAGE_KEY;
    this.seedFn = options.seed ?? createSeed;
    this.today = options.today;
    let counter = 0;
    const session = Date.now().toString(36);
    this.generateId = options.generateId ?? ((prefix) => `${prefix}-${session}-${(counter += 1)}`);
    this.data = this.load() ?? this.seedData();
    this.persist();
  }

  /** Discards all data and reseeds. */
  async reset(today?: ISODate): Promise<void> {
    this.data = this.seedFn(today ?? this.today ?? todayISO());
    this.persist();
  }

  // ---- employees -------------------------------------------------------------------------

  async listEmployees(): Promise<Employee[]> {
    return this.data.employees.map((e) => ({ ...e }));
  }

  async createEmployee(input: WithOptionalId<EmployeeInput>): Promise<Employee> {
    const employee: Employee = { ...input, id: this.takeId('employee', this.data.employees, input.id) };
    this.data.employees.push(employee);
    this.persist();
    return { ...employee };
  }

  async updateEmployee(id: string, patch: EmployeeUpdate): Promise<Employee> {
    const idx = this.data.employees.findIndex((e) => e.id === id);
    if (idx < 0) throw new NotFoundError('employee', id);
    const updated = { ...this.data.employees[idx], ...definedOnly(patch), id };
    this.data.employees[idx] = updated;
    this.persist();
    return { ...updated };
  }

  async deleteEmployee(id: string): Promise<void> {
    if (!this.data.employees.some((e) => e.id === id)) throw new NotFoundError('employee', id);
    this.data.employees = this.data.employees.filter((e) => e.id !== id);
    this.data.assignments = this.data.assignments.filter((a) => a.employeeId !== id);
    this.persist();
  }

  // ---- projects --------------------------------------------------------------------------

  async listProjects(): Promise<Project[]> {
    return this.data.projects.map((p) => ({ ...p }));
  }

  async createProject(input: WithOptionalId<ProjectInput>): Promise<Project> {
    const project: Project = { ...input, id: this.takeId('project', this.data.projects, input.id) };
    this.data.projects.push(project);
    this.persist();
    return { ...project };
  }

  async updateProject(id: string, patch: ProjectUpdate): Promise<Project> {
    const idx = this.data.projects.findIndex((p) => p.id === id);
    if (idx < 0) throw new NotFoundError('project', id);
    const updated = { ...this.data.projects[idx], ...definedOnly(patch), id };
    this.data.projects[idx] = updated;
    this.persist();
    return { ...updated };
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.data.projects.some((p) => p.id === id)) throw new NotFoundError('project', id);
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    this.data.assignments = this.data.assignments.filter((a) => a.projectId !== id);
    this.persist();
  }

  // ---- assignments -----------------------------------------------------------------------

  async listAssignments(query: AssignmentQuery = {}): Promise<Assignment[]> {
    const { from, to, employeeId, projectId } = query;
    return this.data.assignments
      .filter(
        (a) =>
          (!employeeId || a.employeeId === employeeId) &&
          (!projectId || a.projectId === projectId) &&
          rangesOverlap(a.start, a.end, from ?? '0000-01-01', to ?? '9999-12-31'),
      )
      .map((a) => ({ ...a }));
  }

  async createAssignment(input: WithOptionalId<AssignmentInput>): Promise<Assignment> {
    const id = this.takeId('assignment', this.data.assignments, input.id);
    const assignment: Assignment = { ...definedOnly(input), id } as Assignment;
    this.data.assignments.push(assignment);
    this.persist();
    return { ...assignment };
  }

  async updateAssignment(id: string, patch: AssignmentUpdate): Promise<Assignment> {
    const idx = this.data.assignments.findIndex((a) => a.id === id);
    if (idx < 0) throw new NotFoundError('assignment', id);
    const { role, ...rest } = patch;
    const updated: Assignment = { ...this.data.assignments[idx], ...definedOnly(rest), id };
    if (role === null) delete updated.role;
    else if (role !== undefined) updated.role = role;
    this.data.assignments[idx] = updated;
    this.persist();
    return { ...updated };
  }

  async deleteAssignment(id: string): Promise<void> {
    if (!this.data.assignments.some((a) => a.id === id)) throw new NotFoundError('assignment', id);
    this.data.assignments = this.data.assignments.filter((a) => a.id !== id);
    this.persist();
  }

  // ---- internals -------------------------------------------------------------------------

  /** Returns the client-supplied id (rejecting duplicates) or a freshly generated one. */
  private takeId(entity: EntityName, existing: ReadonlyArray<{ id: string }>, requested: string | undefined): string {
    if (requested === undefined) {
      const prefix = entity === 'employee' ? 'emp' : entity === 'project' ? 'prj' : 'asg';
      let id = this.generateId(prefix);
      // Generated ids could collide with client-supplied ones; draw again in that (rare) case.
      while (existing.some((x) => x.id === id)) id = this.generateId(prefix);
      return id;
    }
    if (existing.some((x) => x.id === requested)) throw new ConflictError(entity, requested);
    return requested;
  }

  private seedData(): PlanningData {
    return this.seedFn(this.today ?? todayISO());
  }

  private load(): PlanningData | null {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isPlanningData(parsed)) return null;
      return { employees: parsed.employees, projects: parsed.projects, assignments: parsed.assignments };
    } catch {
      return null;
    }
  }

  private persist(): void {
    if (!this.storage) return;
    const payload: StoredPayload = { version: 1, ...this.data };
    try {
      this.storage.setItem(this.key, JSON.stringify(payload));
    } catch {
      // Quota exceeded or storage disabled: keep working in memory.
    }
  }
}
