/**
 * Pointer-Events drag for the planning board (mouse, pen and touch), without a DnD library.
 *
 * - One delegated `pointerdown` on the grid content decides the mode from the pressed element:
 *   a resize handle (`data-resize-handle="start|end"`), a bar (`data-assignment-id`) or the empty
 *   track of a row (`data-track="<employeeId>"`).
 * - The drag state lives in a ref; React state (`preview`) is updated at most once per
 *   animation frame. Nothing is written until the pointer is released.
 * - A press only becomes a drag after `DRAG_THRESHOLD_PX` of travel, so a click stays a click;
 *   the click that follows a real drag is swallowed.
 * - Esc cancels a running drag.
 */
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { Assignment } from '../../../domain/types';
import type { BoardGeometry } from '../layout';
import { computeDragTarget, exceedsThreshold, type DragMode, type DragTarget } from './dragMath';

export interface DragPreview {
  mode: DragMode;
  /** null for drag-to-create. */
  assignmentId: string | null;
  originEmployeeId: string;
  /** Snapped target; the object identity only changes when the snapped values change. */
  target: DragTarget;
  clientX: number;
  clientY: number;
}

export interface DragCommit {
  mode: DragMode;
  assignment?: Assignment;
  target: DragTarget;
}

export interface UseGridDragOptions {
  geometry: BoardGeometry;
  getAssignment: (id: string) => Assignment | undefined;
  /** Called once on release of a real drag (not for clicks or cancelled drags). */
  onCommit: (commit: DragCommit) => void;
  disabled?: boolean;
}

interface DragState {
  pointerId: number;
  mode: DragMode;
  assignment?: Assignment;
  originEmployeeId: string;
  container: HTMLElement;
  track: HTMLElement;
  captureEl: Element;
  startClientX: number;
  startClientY: number;
  /** Press position relative to the track (content coordinates, survives scrolling). */
  startX: number;
  lastClientX: number;
  lastClientY: number;
  active: boolean;
}

/** Employee id of the board row under `clientY`, if any. */
export function rowUnderPointer(container: ParentNode, clientY: number): string | null {
  for (const row of container.querySelectorAll<HTMLElement>('[role="row"][data-employee-id]')) {
    const rect = row.getBoundingClientRect();
    if (rect.height > 0 && clientY >= rect.top && clientY < rect.bottom) return row.getAttribute('data-employee-id');
  }
  return null;
}

const sameTarget = (a: DragTarget | undefined, b: DragTarget) =>
  !!a && a.employeeId === b.employeeId && a.start === b.start && a.end === b.end && a.weeks === b.weeks;

const nextFrame = (cb: () => void): (() => void) => {
  if (typeof window.requestAnimationFrame === 'function') {
    const id = window.requestAnimationFrame(cb);
    return () => window.cancelAnimationFrame(id);
  }
  const id = window.setTimeout(cb, 16);
  return () => window.clearTimeout(id);
};

export function useGridDrag(options: UseGridDragOptions) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const [preview, setPreview] = useState<DragPreview | null>(null);
  const drag = useRef<DragState | null>(null);
  const cancelFrame = useRef<(() => void) | null>(null);
  const suppressClick = useRef(false);
  /** Pointer whose drag was cancelled with Esc while still pressed. */
  const cancelledPointer = useRef<number | null>(null);

  /** The click event follows pointerup in the same task; clear the flag right after it. */
  const swallowNextClick = useCallback(() => {
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  }, []);

  const compute = useCallback((s: DragState): DragTarget => {
    const rect = s.track.getBoundingClientRect();
    return computeDragTarget({
      mode: s.mode,
      geometry: optionsRef.current.geometry,
      assignment: s.assignment,
      originEmployeeId: s.originEmployeeId,
      hoverEmployeeId: s.mode === 'move' ? rowUnderPointer(s.container, s.lastClientY) : null,
      startX: s.startX,
      currentX: s.lastClientX - rect.left,
    });
  }, []);

  const end = useCallback((s: DragState) => {
    drag.current = null;
    cancelFrame.current?.();
    cancelFrame.current = null;
    try {
      if (s.captureEl.hasPointerCapture?.(s.pointerId)) s.captureEl.releasePointerCapture(s.pointerId);
    } catch {
      // capture already gone (element re-rendered) — nothing to release
    }
    // Swallow the click that the browser fires right after releasing a drag.
    if (s.active) swallowNextClick();
    setPreview(null);
  }, [swallowNextClick]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = drag.current;
      if (!s || e.pointerId !== s.pointerId) return;
      s.lastClientX = e.clientX;
      s.lastClientY = e.clientY;
      if (!s.active) {
        if (!exceedsThreshold(e.clientX - s.startClientX, e.clientY - s.startClientY)) return;
        s.active = true;
      }
      if (cancelFrame.current) return;
      cancelFrame.current = nextFrame(() => {
        cancelFrame.current = null;
        const current = drag.current;
        if (!current?.active) return;
        const target = compute(current);
        setPreview((prev) => ({
          mode: current.mode,
          assignmentId: current.assignment?.id ?? null,
          originEmployeeId: current.originEmployeeId,
          target: prev && sameTarget(prev.target, target) ? prev.target : target,
          clientX: current.lastClientX,
          clientY: current.lastClientY,
        }));
      });
    };
    const onUp = (e: PointerEvent) => {
      const s = drag.current;
      if (!s && cancelledPointer.current === e.pointerId) {
        cancelledPointer.current = null;
        swallowNextClick();
        return;
      }
      if (!s || e.pointerId !== s.pointerId) return;
      s.lastClientX = e.clientX;
      s.lastClientY = e.clientY;
      const target = s.active ? compute(s) : null;
      end(s);
      if (target) optionsRef.current.onCommit({ mode: s.mode, assignment: s.assignment, target });
    };
    const onCancel = (e: PointerEvent) => {
      const s = drag.current;
      if (s && e.pointerId === s.pointerId) end(s);
    };
    const onKey = (e: KeyboardEvent) => {
      const s = drag.current;
      if (!s || e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      end(s);
      // The button is still pressed: swallow the click that its release will produce.
      cancelledPointer.current = s.pointerId;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey, true);
      cancelFrame.current?.();
    };
  }, [compute, end, swallowNextClick]);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const opts = optionsRef.current;
    if (opts.disabled || drag.current || e.button !== 0 || e.isPrimary === false) return;
    const el = e.target as Element;
    const track = el.closest<HTMLElement>('[data-track]');
    if (!track || !e.currentTarget.contains(track)) return;
    const handle = el.closest<HTMLElement>('[data-resize-handle]');
    const bar = el.closest<HTMLElement>('[data-assignment-id]');
    let mode: DragMode = 'create';
    let assignment: Assignment | undefined;
    if (bar) {
      assignment = opts.getAssignment(bar.getAttribute('data-assignment-id') ?? '');
      if (!assignment) return;
      mode = handle ? (handle.getAttribute('data-resize-handle') === 'start' ? 'resize-start' : 'resize-end') : 'move';
    }
    // Empty-track drags must not select text; bar presses keep their default (focus).
    if (mode === 'create' || handle) e.preventDefault();
    const captureEl = bar ?? track;
    try {
      captureEl.setPointerCapture?.(e.pointerId);
    } catch {
      // not supported (e.g. jsdom) — window listeners still track the pointer
    }
    const rect = track.getBoundingClientRect();
    drag.current = {
      pointerId: e.pointerId,
      mode,
      assignment,
      originEmployeeId: track.getAttribute('data-track') ?? assignment?.employeeId ?? '',
      container: e.currentTarget,
      track,
      captureEl,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: e.clientX - rect.left,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      active: false,
    };
  }, []);

  const onClickCapture = useCallback((e: ReactMouseEvent) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return { preview, isDragging: preview !== null, bind: { onPointerDown, onClickCapture } };
}
