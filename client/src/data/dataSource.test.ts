import {
  DeferredRepository,
  parseDataSourceSetting,
  probeApi,
  resolveDataSource,
  selectDataSource,
} from './dataSource';
import { HttpRepository } from './httpRepository';
import { LocalRepository } from './localRepository';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('parseDataSourceSetting', () => {
  it.each([
    ['api', 'api'],
    [' API ', 'api'],
    ['local', 'local'],
    ['auto', 'auto'],
    ['', 'auto'],
    [undefined, 'auto'],
    ['server', 'auto'],
  ])('%j → %s', (input, expected) => {
    expect(parseDataSourceSetting(input)).toBe(expected);
  });
});

describe('probeApi', () => {
  it('is true for a healthy API', async () => {
    const fetch = vi.fn(async () => json(200, { status: 'ok', db: 'ok' }));
    expect(await probeApi({ fetch, baseUrl: '/api/' })).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/health', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('is false for 503 (database down), network errors and non-JSON answers', async () => {
    expect(await probeApi({ fetch: vi.fn(async () => json(503, { status: 'error', db: 'unreachable' })) })).toBe(false);
    expect(await probeApi({ fetch: vi.fn(async () => Promise.reject(new TypeError('fetch failed'))) })).toBe(false);
    const html = new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
    expect(await probeApi({ fetch: vi.fn(async () => html) })).toBe(false);
    expect(await probeApi({ fetch: vi.fn(async () => json(200, { status: 'nope' })) })).toBe(false);
  });

  it('gives up after the timeout', async () => {
    const hanging = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    const started = Date.now();
    expect(await probeApi({ fetch: hanging, timeoutMs: 30 })).toBe(false);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe('selectDataSource', () => {
  it('honours explicit settings without probing', async () => {
    const probe = vi.fn(async () => true);
    expect(await selectDataSource('local', probe)).toBe('local');
    expect(await selectDataSource('api', async () => false)).toBe('api');
    expect(probe).not.toHaveBeenCalled();
  });

  it('auto: api if the probe succeeds, else local', async () => {
    expect(await selectDataSource('auto', async () => true)).toBe('api');
    expect(await selectDataSource('auto', async () => false)).toBe('local');
  });
});

describe('resolveDataSource', () => {
  it('auto + unreachable API → LocalRepository', async () => {
    const local = new LocalRepository({ storage: null });
    const r = await resolveDataSource({
      setting: 'auto',
      fetch: vi.fn(async () => Promise.reject(new TypeError('offline'))),
      createLocal: () => local,
    });
    expect(r).toEqual({ source: 'local', repository: local });
  });

  it('defaults to VITE_DATA_SOURCE (local in tests, see .env.test)', async () => {
    const fetch = vi.fn();
    const r = await resolveDataSource({ fetch, createLocal: () => new LocalRepository({ storage: null }) });
    expect(r.source).toBe('local');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('auto + healthy API with an empty database → HttpRepository and seeds once with fixed ids', async () => {
    const posted: Array<{ url: string; body: { id?: string } }> = [];
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/health')) return json(200, { status: 'ok', db: 'ok' });
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body));
        posted.push({ url, body });
        return json(201, body);
      }
      return json(200, []);
    });
    const r = await resolveDataSource({ setting: 'auto', fetch, today: '2026-11-21' });
    expect(r.source).toBe('api');
    expect(r.repository).toBeInstanceOf(HttpRepository);
    expect(posted.filter((p) => p.url === '/api/employees')).toHaveLength(14);
    expect(posted.filter((p) => p.url === '/api/projects')).toHaveLength(7);
    expect(posted.filter((p) => p.url === '/api/assignments')).toHaveLength(30);
    expect(posted.find((p) => p.url === '/api/employees')?.body.id).toBe('emp-01');
    // Assignments are only posted after all employees and projects exist.
    const firstAssignment = posted.findIndex((p) => p.url === '/api/assignments');
    expect(posted.slice(firstAssignment).every((p) => p.url === '/api/assignments')).toBe(true);
  });

  it('api with existing data → no seeding', async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') throw new Error('must not seed');
      return String(input).endsWith('/employees') ? json(200, [{ id: 'e1' }]) : json(200, []);
    });
    const r = await resolveDataSource({ setting: 'api', fetch });
    expect(r.source).toBe('api');
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/health'))).toBe(false);
  });

  it('api forced but unreachable → rejects with the German network error', async () => {
    const fetch = vi.fn(async () => Promise.reject(new TypeError('fetch failed')));
    await expect(resolveDataSource({ setting: 'api', fetch })).rejects.toThrow(/Server nicht erreichbar/);
  });
});

describe('DeferredRepository', () => {
  it('forwards every call once the target resolves', async () => {
    let resolveTarget!: (r: LocalRepository) => void;
    const deferred = new DeferredRepository(new Promise((r) => (resolveTarget = r)));
    const pending = deferred.listEmployees();
    const target = new LocalRepository({ storage: null, today: '2026-11-21' });
    resolveTarget(target);
    expect(await pending).toHaveLength(14);
    const created = await deferred.createProject({
      id: 'prj-x',
      name: 'X',
      color: 'red',
      start: '2026-11-02',
      end: '2026-11-30',
      status: 'planned',
    });
    expect(created.id).toBe('prj-x');
    expect((await target.listProjects()).some((p) => p.id === 'prj-x')).toBe(true);
    await deferred.deleteProject('prj-x');
    expect(await deferred.listAssignments({ employeeId: 'emp-02' })).toEqual(
      await target.listAssignments({ employeeId: 'emp-02' }),
    );
  });

  it('rejects calls when resolution failed', async () => {
    const deferred = new DeferredRepository(Promise.reject(new Error('kaputt')));
    await expect(deferred.listProjects()).rejects.toThrow('kaputt');
  });
});
