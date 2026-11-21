/**
 * Persistence boundary. REST-shaped and async; implemented by `LocalRepository` (browser
 * storage) and `HttpRepository` (Express + Postgres API, `GET/POST/PUT/DELETE
 * /api/employees|projects|assignments`). Plain JSON in and out, string ids. Repositories do NOT
 * validate business rules — that is the job of `planningActions`.
 *
 * Create methods accept an optional client-supplied `id` (seed data, undo of a delete); an id
 * that already exists is rejected with `ConflictError`. Without an id the repository generates one.
 */
import type {
  Assignment,
  AssignmentInput,
  AssignmentUpdate,
  Employee,
  EmployeeInput,
  EmployeeUpdate,
  ISODate,
  Project,
  ProjectInput,
  ProjectUpdate,
} from '../domain/types';

export interface AssignmentQuery {
  /** Only assignments overlapping [from, to] (inclusive; either bound optional). */
  from?: ISODate;
  to?: ISODate;
  employeeId?: string;
  projectId?: string;
}

/** Create input with an optional client-supplied id. */
export type WithOptionalId<T> = T & { id?: string };

export interface Repository {
  listEmployees(): Promise<Employee[]>;
  createEmployee(input: WithOptionalId<EmployeeInput>): Promise<Employee>;
  updateEmployee(id: string, patch: EmployeeUpdate): Promise<Employee>;
  /** Cascades: deletes the employee's assignments. */
  deleteEmployee(id: string): Promise<void>;

  listProjects(): Promise<Project[]>;
  createProject(input: WithOptionalId<ProjectInput>): Promise<Project>;
  updateProject(id: string, patch: ProjectUpdate): Promise<Project>;
  /** Cascades: deletes the project's assignments. */
  deleteProject(id: string): Promise<void>;

  listAssignments(query?: AssignmentQuery): Promise<Assignment[]>;
  createAssignment(input: WithOptionalId<AssignmentInput>): Promise<Assignment>;
  updateAssignment(id: string, patch: AssignmentUpdate): Promise<Assignment>;
  deleteAssignment(id: string): Promise<void>;
}

export type EntityName = 'employee' | 'project' | 'assignment';

/** Thrown when an id does not exist (HTTP 404 equivalent). */
export class NotFoundError extends Error {
  constructor(
    public readonly entity: EntityName,
    public readonly id: string,
  ) {
    super(`${entity} "${id}" not found`);
    this.name = 'NotFoundError';
  }
}

/** Thrown when creating an entity with an id that already exists (HTTP 409 equivalent). */
export class ConflictError extends Error {
  constructor(
    public readonly entity: EntityName,
    public readonly id: string,
  ) {
    super(`${entity} "${id}" already exists`);
    this.name = 'ConflictError';
  }
}

export interface ValidationErrorDetail {
  field: string | null;
  message: string;
}

/** Structurally invalid input rejected by the data source (HTTP 400 equivalent). */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details: ValidationErrorDetail[] = [],
  ) {
    super(details.length > 0 ? `${message}: ${details.map((d) => `${d.field ?? '(body)'} ${d.message}`).join('; ')}` : message);
    this.name = 'ValidationError';
  }
}

/** The data source could not be reached or answered unexpectedly (network, 5xx, non-JSON). */
export class DataSourceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DataSourceError';
  }
}
