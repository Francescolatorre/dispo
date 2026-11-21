/**
 * `Repository` against the DispoMVP REST API (`server/`, see docs/api.md).
 *
 * JSON in and out; HTTP errors are mapped to the typed repository errors:
 * 404 → `NotFoundError`, 400 → `ValidationError` (with field details), 409 → `ConflictError`,
 * network failures / 5xx / non-JSON answers → `DataSourceError` with a German message.
 */
import type {
  Assignment,
  AssignmentInput,
  AssignmentUpdate,
  Employee,
  EmployeeInput,
  EmployeeUpdate,
  Project,
  ProjectInput,
  ProjectUpdate,
} from '../domain/types';
import {
  ConflictError,
  DataSourceError,
  NotFoundError,
  ValidationError,
  type AssignmentQuery,
  type EntityName,
  type Repository,
  type ValidationErrorDetail,
  type WithOptionalId,
} from './repository';

export const DEFAULT_API_BASE_URL = '/api';

export interface HttpRepositoryOptions {
  /** API root without trailing slash, e.g. `/api` (default, via Vite proxy) or `http://localhost:3001/api`. */
  baseUrl?: string;
  /** Injectable fetch (tests); defaults to the global `fetch` at call time. */
  fetch?: typeof fetch;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

const COLLECTION: Record<EntityName, string> = {
  employee: 'employees',
  project: 'projects',
  assignment: 'assignments',
};

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: ValidationErrorDetail[] };
}

export class HttpRepository implements Repository {
  readonly baseUrl: string;
  private readonly fetchImpl?: typeof fetch;

  constructor(options: HttpRepositoryOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');
    this.fetchImpl = options.fetch;
  }

  // ---- employees -------------------------------------------------------------------------

  listEmployees(): Promise<Employee[]> {
    return this.request<Employee[]>('GET', 'employees');
  }

  createEmployee(input: WithOptionalId<EmployeeInput>): Promise<Employee> {
    return this.create<Employee>('employee', input);
  }

  updateEmployee(id: string, patch: EmployeeUpdate): Promise<Employee> {
    return this.request<Employee>('PUT', 'employees', { id, entity: 'employee', body: patch });
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.request('DELETE', 'employees', { id, entity: 'employee' });
  }

  // ---- projects --------------------------------------------------------------------------

  listProjects(): Promise<Project[]> {
    return this.request<Project[]>('GET', 'projects');
  }

  createProject(input: WithOptionalId<ProjectInput>): Promise<Project> {
    return this.create<Project>('project', input);
  }

  updateProject(id: string, patch: ProjectUpdate): Promise<Project> {
    return this.request<Project>('PUT', 'projects', { id, entity: 'project', body: patch });
  }

  async deleteProject(id: string): Promise<void> {
    await this.request('DELETE', 'projects', { id, entity: 'project' });
  }

  // ---- assignments -----------------------------------------------------------------------

  listAssignments(query: AssignmentQuery = {}): Promise<Assignment[]> {
    const params = new URLSearchParams();
    for (const key of ['from', 'to', 'employeeId', 'projectId'] as const) {
      const value = query[key];
      if (value !== undefined && value !== '') params.set(key, value);
    }
    return this.request<Assignment[]>('GET', 'assignments', { search: params.toString() });
  }

  createAssignment(input: WithOptionalId<AssignmentInput>): Promise<Assignment> {
    return this.create<Assignment>('assignment', input);
  }

  updateAssignment(id: string, patch: AssignmentUpdate): Promise<Assignment> {
    return this.request<Assignment>('PUT', 'assignments', { id, entity: 'assignment', body: patch });
  }

  async deleteAssignment(id: string): Promise<void> {
    await this.request('DELETE', 'assignments', { id, entity: 'assignment' });
  }

  // ---- internals -------------------------------------------------------------------------

  private create<T>(entity: EntityName, input: { id?: string }): Promise<T> {
    return this.request<T>('POST', COLLECTION[entity], { entity, body: input, conflictId: input.id });
  }

  private async request<T = void>(
    method: Method,
    collection: string,
    opts: { id?: string; entity?: EntityName; body?: unknown; search?: string; conflictId?: string } = {},
  ): Promise<T> {
    let url = `${this.baseUrl}/${collection}`;
    if (opts.id !== undefined) url += `/${encodeURIComponent(opts.id)}`;
    if (opts.search) url += `?${opts.search}`;

    const init: RequestInit = { method, headers: { Accept: 'application/json' } };
    if (opts.body !== undefined) {
      init.headers = { ...init.headers, 'Content-Type': 'application/json' };
      init.body = JSON.stringify(opts.body);
    }

    const doFetch = this.fetchImpl ?? globalThis.fetch;
    let response: Response;
    try {
      response = await doFetch(url, init);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      throw new DataSourceError(
        `Server nicht erreichbar (${method} ${url}): ${reason}. Läuft die API (npm run dev im Projektverzeichnis)?`,
      );
    }

    if (response.status === 204) return undefined as T;

    const body = await readJson(response);
    if (response.ok) {
      if (body === undefined) {
        throw new DataSourceError(
          `Unerwartete Antwort vom Server (${method} ${url}): kein JSON.`,
          response.status,
        );
      }
      return body as T;
    }

    const error = (body as ApiErrorBody | undefined)?.error;
    const message = error?.message ?? response.statusText ?? 'Fehler';
    switch (response.status) {
      case 400:
        throw new ValidationError(message, error?.details ?? []);
      case 404:
        if (opts.entity && opts.id !== undefined) throw new NotFoundError(opts.entity, opts.id);
        break;
      case 409:
        if (opts.entity) throw new ConflictError(opts.entity, opts.conflictId ?? '');
        break;
    }
    throw new DataSourceError(
      `Serverfehler ${response.status} (${method} ${url}): ${message}`,
      response.status,
      error?.code,
    );
  }
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
