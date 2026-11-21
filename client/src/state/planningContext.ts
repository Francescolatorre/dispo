import { createContext, useContext } from 'react';
import type { DataSource } from '../data/dataSource';
import type { Repository } from '../data/repository';
import type { PlanningActions } from '../domain/planningActions';
import type { PlanningData } from '../domain/types';

export interface PlanningContextValue extends PlanningData {
  loading: boolean;
  error: Error | null;
  /** The only write path. */
  actions: PlanningActions;
  canUndo: boolean;
  canRedo: boolean;
  /** Increments after every (re)load; useful as a memo dependency. */
  revision: number;
  reload: () => Promise<void>;
  repository: Repository;
  /** Active data source: `api` (server) or `local` (browser); `null` while it is being chosen. */
  dataSource: DataSource | null;
  /** Replaces all data with fresh demo data (local: reseed storage; api: delete all + reseed) and clears undo history. */
  resetDemoData: () => Promise<void>;
}

export const PlanningContext = createContext<PlanningContextValue | null>(null);

export function usePlanning(): PlanningContextValue {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error('usePlanning must be used inside <PlanningProvider>');
  return ctx;
}
