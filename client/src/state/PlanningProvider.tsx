import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LocalRepository } from '../data/localRepository';
import type { Repository } from '../data/repository';
import { createPlanningActions, snapshotFromRepository } from '../domain/planningActions';
import type { PlanningData } from '../domain/types';
import { PlanningContext, type PlanningContextValue } from './planningContext';

export interface PlanningProviderProps {
  /** Data source (default: a `LocalRepository` backed by localStorage). */
  repository?: Repository;
  children: ReactNode;
}

const EMPTY: PlanningData = { employees: [], projects: [], assignments: [] };

/**
 * Loads planning data from a `Repository` and exposes it plus the `planningActions`
 * (the only write path). After every write/undo/redo the data is re-read from the repository.
 */
export function PlanningProvider({ repository, children }: PlanningProviderProps) {
  const [repo] = useState<Repository>(() => repository ?? new LocalRepository());
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

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

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
    }),
    [data, loading, error, actions, revision, reload, repo],
  );

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}
