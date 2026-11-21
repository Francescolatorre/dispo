import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DeferredRepository,
  resolveDefaultDataSource,
  type DataSource,
  type ResolvedDataSource,
} from '../data/dataSource';
import { HttpRepository } from '../data/httpRepository';
import type { Repository } from '../data/repository';
import { resetDemoData as resetRepositoryDemoData } from '../data/seeding';
import { createPlanningActions, snapshotFromRepository } from '../domain/planningActions';
import type { PlanningData } from '../domain/types';
import { PlanningContext, type PlanningContextValue } from './planningContext';

export interface PlanningProviderProps {
  /** Explicit data source (tests, embedding). Skips the automatic selection. */
  repository?: Repository;
  /** Label for an explicit `repository` (default: `api` for an `HttpRepository`, else `local`). */
  dataSource?: DataSource;
  /** Chooses the data source when no `repository` is given (default: `VITE_DATA_SOURCE`, see data/dataSource.ts). */
  resolveDataSource?: () => Promise<ResolvedDataSource>;
  children: ReactNode;
}

const EMPTY: PlanningData = { employees: [], projects: [], assignments: [] };

const sourceOf = (repo: Repository): DataSource => (repo instanceof HttpRepository ? 'api' : 'local');

/**
 * Loads planning data from a `Repository` and exposes it plus the `planningActions`
 * (the only write path). After every write/undo/redo the data is re-read from the repository.
 * Without an explicit `repository` the data source (API or browser) is chosen asynchronously;
 * until then `dataSource` is `null` and every repository call waits for the choice.
 */
export function PlanningProvider({
  repository,
  dataSource,
  resolveDataSource = resolveDefaultDataSource,
  children,
}: PlanningProviderProps) {
  const [resolution] = useState<Promise<ResolvedDataSource>>(() =>
    repository
      ? Promise.resolve({ repository, source: dataSource ?? sourceOf(repository) })
      : resolveDataSource(),
  );
  const [repo] = useState<Repository>(
    () => repository ?? new DeferredRepository(resolution.then((r) => r.repository)),
  );
  const [source, setSource] = useState<DataSource | null>(() =>
    repository ? (dataSource ?? sourceOf(repository)) : null,
  );
  const [data, setData] = useState<PlanningData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Bumped after every write so consumers re-read canUndo()/canRedo().
  const [revision, setRevision] = useState(0);
  const dataRef = useRef<PlanningData>(EMPTY);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    try {
      const snapshot = await snapshotFromRepository(repo);
      dataRef.current = snapshot;
      if (!mounted.current) return;
      setData(snapshot);
      setError(null);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRevision((r) => r + 1);
      }
    }
  }, [repo]);

  // Actions validate against the latest snapshot; until the first load finishes they read the repo directly.
  const actions = useMemo(
    () =>
      createPlanningActions(repo, () => (dataRef.current === EMPTY ? snapshotFromRepository(repo) : dataRef.current), {
        onChange: reload,
      }),
    [repo, reload],
  );

  const resetDemoData = useCallback(async () => {
    const { repository: target } = await resolution;
    await resetRepositoryDemoData(target);
    actions.clearHistory();
    await reload();
  }, [resolution, actions, reload]);

  useEffect(() => {
    mounted.current = true;
    resolution.then(
      (r) => {
        if (mounted.current) setSource(r.source);
      },
      () => {
        // Surfaced by reload() through the DeferredRepository.
      },
    );
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [resolution, reload]);

  const value = useMemo<PlanningContextValue>(
    () => ({
      ...data,
      loading,
      error,
      actions,
      canUndo: actions.canUndo(),
      canRedo: actions.canRedo(),
      revision,
      reload,
      repository: repo,
      dataSource: source,
      resetDemoData,
    }),
    [data, loading, error, actions, revision, reload, repo, source, resetDemoData],
  );

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}
