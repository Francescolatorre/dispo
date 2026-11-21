import { createContext, useContext } from 'react';
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
}

export const PlanningContext = createContext<PlanningContextValue | null>(null);

export function usePlanning(): PlanningContextValue {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error('usePlanning must be used inside <PlanningProvider>');
  return ctx;
}
