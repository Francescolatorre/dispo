import { useEffect, useState } from 'react';
import type { ActionResult } from '../../domain/planningActions';
import type { ValidationIssue } from '../../domain/validation';

export interface DryRunState {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

const EMPTY: DryRunState = { errors: [], warnings: [] };
const DEBOUNCE_MS = 120;

/**
 * Runs `request` (a planningActions call with `{ dryRun: true }`) whenever it changes,
 * debounced, and returns its live errors/warnings. Stale responses are discarded.
 * Pass `null` to disable (e.g. while the drawer is closed).
 */
export function useDryRun<T>(request: (() => Promise<ActionResult<T>>) | null): DryRunState {
  const [state, setState] = useState<DryRunState>(EMPTY);

  useEffect(() => {
    if (!request) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      request().then(
        (result) => {
          if (!cancelled) setState({ errors: result.ok ? [] : result.errors, warnings: result.warnings });
        },
        () => {
          if (!cancelled) setState(EMPTY);
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [request]);

  return state;
}
