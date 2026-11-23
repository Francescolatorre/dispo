/**
 * Registers the planning WebMCP tools while the planning data is available.
 * Renders nothing. No-op when the browser has no WebMCP (`document.modelContext`).
 *
 * Mount inside <PlanningProvider> (and inside <ChakraProvider> for the toasts).
 */
import { useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import { todayISO } from '../../domain/dates';
import { snapshotFromRepository } from '../../domain/planningActions';
import { usePlanning, type PlanningContextValue } from '../../state';
import { useUndoToast } from '../shared/useUndoToast';
import { getModelContext, registerTools, type ModelContextLike, type RegistrationResult } from './modelContext';
import { createPlanningTools, type ToolWriteEvent } from './tools';

const DONE_TITLES: Record<string, string> = {
  'Einsatz anlegen': 'Einsatz angelegt',
  'Einsatz ändern': 'Einsatz geändert',
  'Einsatz verschieben': 'Einsatz verschoben',
  'Einsatz löschen': 'Einsatz gelöscht',
  'Projekt anlegen': 'Projekt angelegt',
};

export const AGENT_SUFFIX = ' – durch KI-Assistent';

export interface WebMCPBridgeProps {
  /** Override detection (tests). Default: `getModelContext()`. */
  modelContext?: ModelContextLike | null;
  /** Reference day for default ranges (tests). Default: today. */
  today?: () => string;
  /** Called after each registration attempt. */
  onRegistered?: (result: RegistrationResult) => void;
}

export function WebMCPBridge({ modelContext, today = todayISO, onRegistered }: WebMCPBridgeProps) {
  const planning = usePlanning();
  const showUndoToast = useUndoToast();
  const toast = useToast();

  // Tools are registered once; they read everything through refs so they always see current state.
  const planningRef = useRef<PlanningContextValue>(planning);
  const feedbackRef = useRef<(e: ToolWriteEvent) => void>(() => {});
  const optionsRef = useRef({ today, onRegistered });
  useEffect(() => {
    planningRef.current = planning;
    optionsRef.current = { today, onRegistered };
    feedbackRef.current = (e) => {
      if (e.kind === 'undo') {
        toast({ status: 'info', position: 'bottom', duration: 4000, title: `Rückgängig: ${e.label}${AGENT_SUFFIX}` });
        return;
      }
      showUndoToast({
        title: (DONE_TITLES[e.label] ?? e.label) + AGENT_SUFFIX,
        description: e.summary,
        undoLabel: e.label,
      });
    };
  });

  const ready = !planning.loading && planning.error === null;

  useEffect(() => {
    if (!ready) return undefined;
    const mc = modelContext === undefined ? getModelContext() : (modelContext ?? undefined);
    if (!mc) return undefined;

    const controller = new AbortController();
    const tools = createPlanningTools(
      async () => {
        const p = planningRef.current;
        // Re-read from the repository: a tool may run right after a write, before React re-rendered.
        const snapshot = await snapshotFromRepository(p.repository);
        return { ...snapshot, actions: p.actions, today: optionsRef.current.today() };
      },
      { onWrite: (e) => feedbackRef.current(e) },
    );
    void registerTools(tools, controller.signal, mc).then((result) => {
      if (controller.signal.aborted) return;
      if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
        console.info(`[WebMCP] ${result.registered.length} Werkzeuge registriert:`, result.registered.join(', '));
        if (result.failed.length > 0) console.warn('[WebMCP] Registrierung fehlgeschlagen:', result.failed);
      }
      optionsRef.current.onRegistered?.(result);
    });
    return () => controller.abort();
  }, [ready, modelContext]);

  return null;
}
