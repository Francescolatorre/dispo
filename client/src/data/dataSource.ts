/**
 * Chooses the data source at startup.
 *
 * `VITE_DATA_SOURCE`:
 * - `api`   – always the REST API (`HttpRepository`); errors surface in the UI if it is down.
 * - `local` – always the browser (`LocalRepository`, localStorage).
 * - `auto`  – default: probe `GET /api/health` with a short timeout; API if it answers
 *             `{status:'ok'}`, otherwise local.
 *
 * When the API is used and its database is empty, the demo seed is written once (fixed ids).
 */
import { todayISO } from '../domain/dates';
import type { ISODate } from '../domain/types';
import { DEFAULT_API_BASE_URL, HttpRepository } from './httpRepository';
import { LocalRepository } from './localRepository';
import type { Repository } from './repository';
import { seedIfEmpty } from './seeding';

export type DataSource = 'api' | 'local';
export type DataSourceSetting = DataSource | 'auto';

export interface ResolvedDataSource {
  source: DataSource;
  repository: Repository;
}

export const DEFAULT_PROBE_TIMEOUT_MS = 1500;

/** Parses `VITE_DATA_SOURCE`; anything unknown or empty means `auto`. */
export function parseDataSourceSetting(value: string | undefined): DataSourceSetting {
  const v = value?.trim().toLowerCase();
  return v === 'api' || v === 'local' ? v : 'auto';
}

export interface ProbeOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

/** True if `GET {baseUrl}/health` answers 2xx with `{status:'ok'}` within the timeout. */
export async function probeApi({
  baseUrl = DEFAULT_API_BASE_URL,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
  fetch: fetchImpl,
}: ProbeOptions = {}): Promise<boolean> {
  const doFetch = fetchImpl ?? globalThis.fetch;
  if (typeof doFetch !== 'function') return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await doFetch(`${baseUrl.replace(/\/+$/, '')}/health`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return false;
    // A SPA fallback (index.html with 200) must not count as a healthy API.
    const body: unknown = await response.json();
    return !!body && typeof body === 'object' && (body as { status?: unknown }).status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function selectDataSource(
  setting: DataSourceSetting,
  probe: () => Promise<boolean>,
): Promise<DataSource> {
  if (setting !== 'auto') return setting;
  return (await probe()) ? 'api' : 'local';
}

export interface ResolveOptions extends ProbeOptions {
  setting?: DataSourceSetting;
  /** Reference day for seeding (default: today). */
  today?: ISODate;
  createLocal?: () => Repository;
}

/** Selects the source, builds the repository and — for the API — seeds an empty database once. */
export async function resolveDataSource(options: ResolveOptions = {}): Promise<ResolvedDataSource> {
  const setting = options.setting ?? parseDataSourceSetting(import.meta.env.VITE_DATA_SOURCE);
  const source = await selectDataSource(setting, () => probeApi(options));
  if (source === 'local') {
    return { source, repository: options.createLocal?.() ?? new LocalRepository() };
  }
  const repository = new HttpRepository({ baseUrl: options.baseUrl, fetch: options.fetch });
  await seedIfEmpty(repository, options.today ?? todayISO());
  return { source, repository };
}

let defaultResolution: Promise<ResolvedDataSource> | null = null;

/**
 * App-wide data source, resolved once per page load (StrictMode double-invokes initialisers;
 * probing and seeding must not run twice).
 */
export function resolveDefaultDataSource(): Promise<ResolvedDataSource> {
  defaultResolution ??= resolveDataSource();
  // Allow a retry (e.g. after a reload of the provider) if resolution failed.
  defaultResolution.catch(() => {
    defaultResolution = null;
  });
  return defaultResolution;
}

/**
 * A `Repository` whose target is resolved asynchronously; every call waits for it.
 * Lets the provider work synchronously while the data source is still being chosen.
 */
export class DeferredRepository implements Repository {
  constructor(private readonly target: Promise<Repository>) {}

  private async call<K extends keyof Repository>(
    method: K,
    ...args: Parameters<Repository[K]>
  ): Promise<Awaited<ReturnType<Repository[K]>>> {
    const repo = await this.target;
    const fn = repo[method] as (...a: Parameters<Repository[K]>) => ReturnType<Repository[K]>;
    return fn.apply(repo, args) as Awaited<ReturnType<Repository[K]>>;
  }

  listEmployees: Repository['listEmployees'] = () => this.call('listEmployees');
  createEmployee: Repository['createEmployee'] = (input) => this.call('createEmployee', input);
  updateEmployee: Repository['updateEmployee'] = (id, patch) => this.call('updateEmployee', id, patch);
  deleteEmployee: Repository['deleteEmployee'] = (id) => this.call('deleteEmployee', id);

  listProjects: Repository['listProjects'] = () => this.call('listProjects');
  createProject: Repository['createProject'] = (input) => this.call('createProject', input);
  updateProject: Repository['updateProject'] = (id, patch) => this.call('updateProject', id, patch);
  deleteProject: Repository['deleteProject'] = (id) => this.call('deleteProject', id);

  listAssignments: Repository['listAssignments'] = (query) => this.call('listAssignments', query);
  createAssignment: Repository['createAssignment'] = (input) => this.call('createAssignment', input);
  updateAssignment: Repository['updateAssignment'] = (id, patch) => this.call('updateAssignment', id, patch);
  deleteAssignment: Repository['deleteAssignment'] = (id) => this.call('deleteAssignment', id);
}
