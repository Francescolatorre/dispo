/**
 * Persistence boundary. REST-shaped and async so it can later be implemented by an HTTP
 * client against Express + Postgres (`GET/POST/PUT/DELETE /employees|projects|assignments`).
 * Plain JSON in and out, string ids. Repositories do NOT validate business rules — that is
 * the job of `planningActions`.
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

export interface Repository {
  listEmployees(): Promise<Employee[]>;
  createEmployee(input: EmployeeInput): Promise<Employee>;
  updateEmployee(id: string, patch: EmployeeUpdate): Promise<Employee>;
  /** Cascades: deletes the employee's assignments. */
  deleteEmployee(id: string): Promise<void>;

  listProjects(): Promise<Project[]>;
  createProject(input: ProjectInput): Promise<Project>;
  updateProject(id: string, patch: ProjectUpdate): Promise<Project>;
  /** Cascades: deletes the project's assignments. */
  deleteProject(id: string): Promise<void>;

  listAssignments(query?: AssignmentQuery): Promise<Assignment[]>;
  createAssignment(input: AssignmentInput): Promise<Assignment>;
  updateAssignment(id: string, patch: AssignmentUpdate): Promise<Assignment>;
  deleteAssignment(id: string): Promise<void>;
}

/** Thrown when an id does not exist (HTTP 404 equivalent). */
export class NotFoundError extends Error {
  constructor(
    public readonly entity: 'employee' | 'project' | 'assignment',
    public readonly id: string,
  ) {
    super(`${entity} "${id}" not found`);
    this.name = 'NotFoundError';
  }
}
