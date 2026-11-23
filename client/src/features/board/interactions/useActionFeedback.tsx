/**
 * Toast feedback for board writes: every applied change gets a toast with a "Rückgängig"
 * button (calls `planningActions.undo`) plus its consequences (overbooking, warnings).
 */
import { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { historyLabelText, type ActionResult } from '../../../domain/planningActions';
import type { Assignment } from '../../../domain/types';
import { usePlanning } from '../../../state';
import { ActionToast, type Tone } from './ActionToast';
import { resultMessages } from './dragMath';

export function useActionFeedback() {
  const toast = useToast();
  const { actions, employees, assignments } = usePlanning();

  const show = useCallback(
    (title: string, messages: readonly string[], tone: Tone, onUndo?: () => void, duration = 6000) => {
      toast({
        position: 'bottom',
        duration,
        render: ({ onClose }) => (
          <ActionToast
            title={title}
            messages={messages}
            tone={tone}
            onClose={onClose}
            onUndo={
              onUndo
                ? () => {
                    onClose();
                    onUndo();
                  }
                : undefined
            }
          />
        ),
      });
    },
    [toast],
  );

  const undo = useCallback(async () => {
    const r = await actions.undo();
    if (r.ok) show(`Rückgängig gemacht: ${r.label ? historyLabelText(r.label) : 'Änderung'}`, [], 'info', undefined, 2500);
    else if (r.label) show('Rückgängig fehlgeschlagen', [r.error ?? ''], 'error');
    return r;
  }, [actions, show]);

  const redo = useCallback(async () => {
    const r = await actions.redo();
    if (r.ok) show(`Wiederhergestellt: ${r.label ? historyLabelText(r.label) : 'Änderung'}`, [], 'info', undefined, 2500);
    else if (r.label) show('Wiederherstellen fehlgeschlagen', [r.error ?? ''], 'error');
    return r;
  }, [actions, show]);

  /**
   * Toast for the result of a write. Returns true if the write was applied.
   * Must be the `report` of the render before the write: its `assignments` are the "before" state.
   */
  const report = useCallback(
    (result: ActionResult<Assignment>, title: string): boolean => {
      if (!result.ok) {
        show('Änderung nicht möglich', result.errors.map((e) => e.message), 'error');
        return false;
      }
      const messages = resultMessages(result.impact, result.warnings, employees, {
        employeeId: result.result.employeeId,
        assignmentsBefore: assignments,
      });
      const over = result.impact.some((i) => i.afterStatus === 'over') || result.warnings.some((w) => w.code === 'OVERBOOKED');
      show(title, messages, over ? 'warning' : 'success', () => void undo());
      return true;
    },
    [employees, assignments, show, undo],
  );

  return { report, undo, redo };
}
