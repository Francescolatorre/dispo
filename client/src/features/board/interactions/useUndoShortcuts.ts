import { useEffect, useRef } from 'react';

/** True if the event comes from a text field, select or editable element (keep native undo there). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
}

/** Which history command a key event asks for: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y. */
export function historyCommand(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): 'undo' | 'redo' | null {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return null;
  const key = e.key.toLowerCase();
  if (key === 'z') return e.shiftKey ? 'redo' : 'undo';
  if (key === 'y' && !e.shiftKey) return 'redo';
  return null;
}

/** Global undo/redo shortcuts; ignored while typing and while `enabled` is false. */
export function useUndoShortcuts(onUndo: () => void, onRedo: () => void, enabled = true): void {
  const handlers = useRef({ onUndo, onRedo });
  useEffect(() => {
    handlers.current = { onUndo, onRedo };
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isTypingTarget(e.target)) return;
      const command = historyCommand(e);
      if (!command) return;
      e.preventDefault();
      if (command === 'undo') handlers.current.onUndo();
      else handlers.current.onRedo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
