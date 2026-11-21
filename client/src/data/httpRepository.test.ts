import type { Assignment, Employee, Project } from '../domain/types';
import { HttpRepository } from './httpRepository';
import { ConflictError, DataSourceError, NotFoundError, ValidationError } from './repository';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

const apiError = (status: number, code: string, message: string, details?: unknown) =>
  json(status, { error: { code, message, ...(details ? { details } : {}) } });

/** A fetch mock that records calls and answers with the queued responses. */
function setup(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    const next = responses.shift();
    if (!next) throw new Error('unexpected fetch');
    if (next instanceof Error) throw next;
    return next;
  });
  const repo = new HttpRepository({ baseUrl: '/api/', fetch: fetchMock as unknown as typeof fetch });
  const call = (i = 0) => {
    const [url, init] = fetchMock.mock.calls[i];
    return { url: String(url), method: init?.method, body: init?.body ? JSON.parse(String(init.body)) : undefined, init };
  };
  return { repo, fetchMock, call };
}

const employee: Employee = { id: 'emp-01', name: 'Anna', role: 'Frontend', seniority: 'senior', capacity: 1, active: true };
const project: Project = { id: 'prj-01', name: 'Web', color: 'blue', start: '2026-11-02', end: '2026-12-18', status: 'active' };
const assignment: Assignment = {
  id: 'asg-01',
  employeeId: 'emp-01',
  projectId: 'prj-01',
  start: '2026-11-16',
  end: '2026-11-20',
  allocation: 50,
};

describe('HttpRepository – requests', () => {
  it('lists employees, projects and assignments', async () => {
    const { repo, call } = setup(json(200, [employee]), json(200, [project]), json(200, [assignment]));
    expect(await repo.listEmployees()).toEqual([employee]);
    expect(await repo.listProjects()).toEqual([project]);
    expect(await repo.listAssignments()).toEqual([assignment]);
    expect([call(0), call(1), call(2)].map((c) => [c.method, c.url])).toEqual([
      ['GET', '/api/employees'],
      ['GET', '/api/projects'],
      ['GET', '/api/assignments'],
    ]);
    expect(call(0).init?.body).toBeUndefined();
  });

  it('passes assignment query params (and skips empty ones)', async () => {
    const { repo, call } = setup(json(200, []));
    await repo.listAssignments({ from: '2026-11-01', to: '2026-11-30', employeeId: 'emp 1', projectId: undefined });
    expect(call().url).toBe('/api/assignments?from=2026-11-01&to=2026-11-30&employeeId=emp+1');
  });

  it('creates with POST, with and without a client-supplied id', async () => {
    const { repo, call } = setup(json(201, employee), json(201, project), json(201, assignment));
    const { id: _id, ...employeeInput } = employee;
    void _id;
    expect(await repo.createEmployee(employeeInput)).toEqual(employee);
    expect(await repo.createProject(project)).toEqual(project);
    expect(await repo.createAssignment({ ...assignment, role: undefined })).toEqual(assignment);
    expect(call(0)).toMatchObject({ method: 'POST', url: '/api/employees', body: employeeInput });
    expect(call(0).body).not.toHaveProperty('id');
    expect(call(0).init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(call(1)).toMatchObject({ method: 'POST', url: '/api/projects', body: project });
    expect(call(2)).toMatchObject({ method: 'POST', url: '/api/assignments', body: assignment });
    expect(call(2).body).not.toHaveProperty('role');
  });

  it('updates with PUT (patch body, role:null kept, id url-encoded)', async () => {
    const { repo, call } = setup(json(200, employee), json(200, project), json(200, assignment));
    await repo.updateEmployee('emp-01', { capacity: 0.5 });
    await repo.updateProject('prj/01', { status: 'done' });
    await repo.updateAssignment('asg-01', { allocation: 20, role: null });
    expect(call(0)).toMatchObject({ method: 'PUT', url: '/api/employees/emp-01', body: { capacity: 0.5 } });
    expect(call(1)).toMatchObject({ method: 'PUT', url: '/api/projects/prj%2F01', body: { status: 'done' } });
    expect(call(2)).toMatchObject({ method: 'PUT', url: '/api/assignments/asg-01', body: { allocation: 20, role: null } });
  });

  it('deletes with DELETE and resolves on 204', async () => {
    const noContent = () => new Response(null, { status: 204 });
    const { repo, call } = setup(noContent(), noContent(), noContent());
    await expect(repo.deleteEmployee('emp-01')).resolves.toBeUndefined();
    await expect(repo.deleteProject('prj-01')).resolves.toBeUndefined();
    await expect(repo.deleteAssignment('asg-01')).resolves.toBeUndefined();
    expect([call(0), call(1), call(2)].map((c) => [c.method, c.url])).toEqual([
      ['DELETE', '/api/employees/emp-01'],
      ['DELETE', '/api/projects/prj-01'],
      ['DELETE', '/api/assignments/asg-01'],
    ]);
  });

  it('uses the global fetch by default and defaults the base url to /api', async () => {
    const globalFetch = vi.fn(async () => json(200, []));
    vi.stubGlobal('fetch', globalFetch);
    try {
      await new HttpRepository().listProjects();
      expect(globalFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({ method: 'GET' }));
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('HttpRepository – error mapping', () => {
  it('maps 404 on an id route to NotFoundError', async () => {
    const { repo } = setup(
      apiError(404, 'NOT_FOUND', 'employee "x" not found'),
      apiError(404, 'NOT_FOUND', 'project "y" not found'),
      apiError(404, 'NOT_FOUND', 'assignment "z" not found'),
    );
    const e1 = await repo.updateEmployee('x', { name: 'A' }).catch((e: unknown) => e);
    expect(e1).toBeInstanceOf(NotFoundError);
    expect(e1).toMatchObject({ entity: 'employee', id: 'x' });
    await expect(repo.deleteProject('y')).rejects.toMatchObject({ name: 'NotFoundError', entity: 'project', id: 'y' });
    await expect(repo.deleteAssignment('z')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('maps 400 to ValidationError with details', async () => {
    const details = [
      { field: 'allocation', message: 'must be a multiple of 10 between 10 and 100' },
      { field: 'end', message: 'must be on or after start' },
    ];
    const { repo } = setup(apiError(400, 'VALIDATION', 'Invalid request', details));
    const err = await repo.createAssignment({ ...assignment, allocation: 55 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).details).toEqual(details);
    expect((err as ValidationError).message).toContain('allocation must be a multiple of 10');
  });

  it('maps 409 to ConflictError with the requested id', async () => {
    const { repo } = setup(apiError(409, 'CONFLICT', 'A record with this id already exists'));
    const err = await repo.createProject(project).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ConflictError);
    expect(err).toMatchObject({ entity: 'project', id: 'prj-01' });
  });

  it('maps network failures to a German DataSourceError', async () => {
    const { repo } = setup(new TypeError('fetch failed'));
    const err = await repo.listEmployees().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DataSourceError);
    expect((err as Error).message).toMatch(/^Server nicht erreichbar \(GET \/api\/employees\): fetch failed/);
  });

  it('maps 5xx and unknown errors to DataSourceError with status and code', async () => {
    const { repo } = setup(apiError(500, 'INTERNAL', 'Internal server error'), apiError(404, 'NOT_FOUND', 'Route not found'));
    const err = await repo.listEmployees().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DataSourceError);
    expect(err).toMatchObject({ status: 500, code: 'INTERNAL' });
    expect((err as Error).message).toContain('Serverfehler 500');
    // 404 without an id (unknown route) is not an entity NotFoundError
    await expect(repo.listProjects()).rejects.toBeInstanceOf(DataSourceError);
  });

  it('rejects non-JSON success answers (e.g. an SPA index.html fallback)', async () => {
    const { repo } = setup(new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html' } }));
    await expect(repo.listEmployees()).rejects.toThrow(/kein JSON/);
  });

  it('handles error responses without a JSON body', async () => {
    const { repo } = setup(new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' }));
    await expect(repo.listEmployees()).rejects.toMatchObject({ name: 'DataSourceError', status: 502 });
  });
});
