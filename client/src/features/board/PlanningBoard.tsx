import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertIcon, Box, Button, Flex, Text } from '@chakra-ui/react';
import { addDays, addWeeks, isoWeekKey, startOfISOWeek, todayISO } from '../../domain/dates';
import { projectColor } from '../../domain/projectColors';
import type { Assignment, ISODate, Project } from '../../domain/types';
import { computeWorkloadMatrix } from '../../domain/workload';
import { usePlanning } from '../../state';
import {
  computeInsights,
  defaultRangeStart,
  DEFAULT_FILTERS,
  filterEmployees,
  visibleWeeks,
  type BoardFilters,
} from './boardModel';
import { BoardGrid } from './BoardGrid';
import { BoardInsights } from './BoardInsights';
import { BoardToolbar } from './BoardToolbar';
import { AssignmentDrawer, type EditorState } from './interactions/AssignmentDrawer';
import { DragHintBubble } from './interactions/DragHintBubble';
import { dragHint, hypotheticalAssignments, isUnchanged, projectLoads } from './interactions/dragMath';
import { useActionFeedback } from './interactions/useActionFeedback';
import { useGridDrag, type DragCommit } from './interactions/useGridDrag';
import { useUndoShortcuts } from './interactions/useUndoShortcuts';
import {
  barSpan,
  createGeometry,
  DEFAULT_COLUMN_WIDTH,
  laneTop,
  layoutRow,
  NAME_COLUMN_WIDTHS,
  rowMetricsFor,
  type ColumnWidth,
  type Density,
  type RowLayout,
} from './layout';

export interface PlanningBoardProps {
  /** Reference day (default: today). Injected by tests. */
  today?: ISODate;
  /** Called when a project bar is clicked/activated (in addition to opening the edit drawer). */
  onAssignmentSelect?: (assignmentId: string) => void;
}

/**
 * Planning board: people × ISO weeks with workload heat cells and project bars.
 * Interactions: drag to move/resize/create (live projected utilization), edit drawer,
 * keyboard edits on focused bars, undo/redo. All writes go through `planningActions`.
 */
export function PlanningBoard({ today: todayProp, onAssignmentSelect }: PlanningBoardProps) {
  const { employees, projects, assignments, loading, error, reload, actions, canUndo, canRedo } = usePlanning();
  const { report, undo, redo } = useActionFeedback();
  const [today] = useState<ISODate>(() => todayProp ?? todayISO());
  const homeStart = useMemo(() => defaultRangeStart(today), [today]);
  const [rangeStart, setRangeStart] = useState<ISODate>(homeStart);
  const [columnWidth, setColumnWidth] = useState<ColumnWidth>(DEFAULT_COLUMN_WIDTH);
  const [density] = useState<Density>('comfort');
  const [expandedRows, setExpandedRows] = useState<ReadonlySet<string>>(() => new Set());
  const [todayToken, setTodayToken] = useState(0);
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);

  const weeks = useMemo(() => visibleWeeks(rangeStart), [rangeStart]);
  const geometry = useMemo(() => createGeometry(weeks, columnWidth), [weeks, columnWidth]);
  const rangeEnd = geometry.rangeEnd;

  // Workload of every person for the visible weeks — recomputed only when data or range change.
  const matrix = useMemo(() => computeWorkloadMatrix(employees, assignments, weeks), [employees, assignments, weeks]);
  const insights = useMemo(() => computeInsights(employees, assignments, today), [employees, assignments, today]);

  const assignmentsById = useMemo(() => new Map<string, Assignment>(assignments.map((a) => [a.id, a])), [assignments]);
  const assignmentsByEmployee = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of assignments) {
      const list = map.get(a.employeeId);
      if (list) list.push(a);
      else map.set(a.employeeId, [a]);
    }
    return map;
  }, [assignments]);

  const metrics = rowMetricsFor(density);
  const rowLayouts = useMemo(() => {
    const map = new Map<string, RowLayout>();
    for (const e of employees) map.set(e.id, layoutRow(geometry, assignmentsByEmployee.get(e.id) ?? [], metrics, expandedRows.has(e.id)));
    return map;
  }, [employees, assignmentsByEmployee, geometry, metrics, expandedRows]);
  const toggleExpanded = useCallback(
    (id: string) =>
      setExpandedRows((rows) => {
        const next = new Set(rows);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    [],
  );

  const projectsById = useMemo(() => new Map<string, Project>(projects.map((p) => [p.id, p])), [projects]);
  const sortedProjects = useMemo(() => [...projects].sort((a, b) => a.name.localeCompare(b.name, 'de')), [projects]);
  const roles = useMemo(() => [...new Set(employees.map((e) => e.role))].sort((a, b) => a.localeCompare(b, 'de')), [employees]);

  const visibleEmployees = useMemo(
    () => filterEmployees(employees, assignments, filters, { insights, rangeStart, rangeEnd }),
    [employees, assignments, filters, insights, rangeStart, rangeEnd],
  );
  const totalCount = useMemo(
    () => employees.filter((e) => filters.showInactive || e.active).length,
    [employees, filters.showInactive],
  );

  const patchFilters = useCallback((patch: Partial<BoardFilters>) => setFilters((f) => ({ ...f, ...patch })), []);
  const resetFilters = useCallback(() => setFilters((f) => ({ ...DEFAULT_FILTERS, showInactive: f.showInactive })), []);
  const shift = useCallback((n: number) => setRangeStart((s) => addWeeks(s, n)), []);
  const goToday = useCallback(() => {
    setRangeStart(homeStart);
    setTodayToken((t) => t + 1);
  }, [homeStart]);
  const toggleOverbooked = useCallback(
    () => setFilters((f) => ({ ...f, onlyOverbooked: !f.onlyOverbooked, onlyFree: false })),
    [],
  );
  const toggleFree = useCallback(() => setFilters((f) => ({ ...f, onlyFree: !f.onlyFree, onlyOverbooked: false })), []);

  // ---- editor ---------------------------------------------------------------------------

  const openEditor = useCallback((state: EditorState) => {
    setEditorKey((k) => k + 1);
    setEditor(state);
  }, []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const assignmentsRef = useRef(assignmentsById);
  const selectRef = useRef(onAssignmentSelect);
  useEffect(() => {
    assignmentsRef.current = assignmentsById;
    selectRef.current = onAssignmentSelect;
  });
  // Stable identity keeps the memoized rows from re-rendering on every data change.
  const selectAssignment = useCallback(
    (id: string) => {
      selectRef.current?.(id);
      const assignment = assignmentsRef.current.get(id);
      if (assignment) openEditor({ mode: 'edit', assignment });
    },
    [openEditor],
  );

  const openCreate = useCallback(() => {
    const start = startOfISOWeek(today);
    openEditor({ mode: 'create', initial: { start, end: addDays(addWeeks(start, 3), 4) } });
  }, [openEditor, today]);

  // ---- drag -----------------------------------------------------------------------------

  const commitDrag = useCallback(
    async ({ mode, assignment, target }: DragCommit) => {
      if (mode === 'create') {
        openEditor({ mode: 'create', initial: { employeeId: target.employeeId, start: target.start, end: target.end } });
        return;
      }
      if (!assignment || isUnchanged(target, assignment)) return;
      if (mode === 'move') {
        const result = await actions.moveAssignment(assignment.id, { weeks: target.weeks, employeeId: target.employeeId });
        report(result, 'Einsatz verschoben');
      } else {
        const result = await actions.updateAssignment(assignment.id, { start: target.start, end: target.end });
        report(result, 'Einsatz geändert');
      }
    },
    [actions, openEditor, report],
  );

  const { preview, bind } = useGridDrag({
    geometry,
    getAssignment: (id) => assignmentsById.get(id),
    onCommit: (c) => void commitDrag(c),
    disabled: editor !== null,
  });

  const previewTarget = preview?.target;
  const previewId = preview?.assignmentId ?? null;
  const previewOrigin = preview?.originEmployeeId;

  // Projected utilization of the affected rows + hint — pure, only recomputed when the snapped target changes.
  const projection = useMemo(() => {
    if (!previewTarget || !previewOrigin) return null;
    const after = hypotheticalAssignments(assignments, previewTarget, previewId);
    const ids = [previewOrigin, previewTarget.employeeId];
    const employee = employees.find((e) => e.id === previewTarget.employeeId);
    return { ...projectLoads(employees, assignments, after, ids, weeks), hint: dragHint(previewTarget, employee, after) };
  }, [previewTarget, previewId, previewOrigin, assignments, employees, weeks]);

  const ghost = useMemo(() => {
    if (!previewTarget || !projection) return null;
    const span = barSpan(geometry, previewTarget.start, previewTarget.end);
    if (!span) return null;
    const dragged = previewId ? assignmentsById.get(previewId) : undefined;
    const project = dragged ? projectsById.get(dragged.projectId) : undefined;
    const sameRow = dragged && dragged.employeeId === previewTarget.employeeId;
    const y = sameRow
      ? (rowLayouts.get(dragged.employeeId)?.bars.find((b) => b.assignment.id === dragged.id)?.y ?? laneTop(0, metrics))
      : laneTop(0, metrics);
    return {
      employeeId: previewTarget.employeeId,
      x: span.x,
      width: span.width,
      y,
      color: projectColor(project?.color),
      over: projection.hint.over,
      label: dragged ? `${project?.name ?? 'Einsatz'} · ${dragged.allocation} %` : 'Neuer Einsatz',
    };
  }, [previewTarget, previewId, projection, geometry, assignmentsById, projectsById, rowLayouts, metrics]);

  const dragging = useMemo(
    () => (previewId && previewOrigin ? { assignmentId: previewId, employeeId: previewOrigin } : null),
    [previewId, previewOrigin],
  );

  // ---- keyboard -------------------------------------------------------------------------

  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    const bar = [...(contentRef.current?.querySelectorAll<HTMLElement>('[data-assignment-id]') ?? [])].find(
      (el) => el.getAttribute('data-assignment-id') === id,
    );
    bar?.focus();
  }, [assignments]);

  const onBarKeyDown = useCallback(
    async (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const el = e.target as HTMLElement;
      const id = el.getAttribute('data-assignment-id');
      if (!id || e.ctrlKey || e.metaKey || e.altKey) return;
      const a = assignmentsById.get(id);
      if (!a) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const dir = e.key === 'ArrowLeft' ? -1 : 1;
        const end = addWeeks(a.end, dir);
        if (e.shiftKey && end < a.start) return; // min. duration reached
        // The bar may move to another cell (remount): re-focus it after the reload.
        pendingFocus.current = id;
        const result = e.shiftKey
          ? await actions.updateAssignment(id, { end })
          : await actions.moveAssignment(id, { weeks: dir });
        if (!report(result, e.shiftKey ? 'Einsatz geändert' : 'Einsatz verschoben')) pendingFocus.current = null;
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        report(await actions.deleteAssignment(id), 'Einsatz gelöscht');
      }
    },
    [actions, assignmentsById, report],
  );

  const interactionProps = useMemo(
    () => ({ ...bind, onKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => void onBarKeyDown(e) }),
    [bind, onBarKeyDown],
  );

  const onUndo = useCallback(() => void undo(), [undo]);
  const onRedo = useCallback(() => void redo(), [redo]);
  useUndoShortcuts(onUndo, onRedo, editor === null && !loading);

  if (error) {
    return (
      <Alert status="error" borderRadius="lg" data-testid="board-error">
        <AlertIcon />
        <AlertDescription flex={1}>Planungsdaten konnten nicht geladen werden: {error.message}</AlertDescription>
        <Button size="sm" colorScheme="red" variant="outline" onClick={() => void reload()}>
          Erneut versuchen
        </Button>
      </Alert>
    );
  }

  return (
    <Flex direction="column" gap={4} flex={1} minH={0}>
      <BoardInsights
        insights={insights}
        onlyOverbooked={filters.onlyOverbooked}
        onlyFree={filters.onlyFree}
        onToggleOverbooked={toggleOverbooked}
        onToggleFree={toggleFree}
      />
      <BoardToolbar
        weeks={weeks}
        isCurrentRange={rangeStart === homeStart}
        onShift={shift}
        onToday={goToday}
        columnWidth={columnWidth}
        onColumnWidthChange={setColumnWidth}
        filters={filters}
        onFiltersChange={patchFilters}
        onResetFilters={resetFilters}
        roles={roles}
        projects={sortedProjects}
        visibleCount={visibleEmployees.length}
        totalCount={totalCount}
        onCreate={openCreate}
        history={{
          canUndo,
          canRedo,
          undoLabel: actions.undoLabel(),
          redoLabel: actions.redoLabel(),
          onUndo,
          onRedo,
        }}
      />
      <BoardGrid
        employees={visibleEmployees}
        personCount={visibleEmployees.length}
        weeks={weeks}
        geometry={geometry}
        matrix={matrix}
        rowLayouts={rowLayouts}
        projectsById={projectsById}
        today={today}
        currentWeekKey={isoWeekKey(today)}
        highlightProjectId={filters.projectId}
        metrics={metrics}
        nameColumnWidth={NAME_COLUMN_WIDTHS[density]}
        compact={density === 'compact'}
        expandedRows={expandedRows}
        onToggleExpanded={toggleExpanded}
        onAssignmentSelect={selectAssignment}
        interactionProps={interactionProps}
        contentRef={contentRef}
        projection={projection}
        ghost={ghost}
        dragging={dragging}
        loading={loading}
        scrollToTodayToken={todayToken}
        empty={
          employees.length === 0 ? (
            <EmptyState title="Noch keine Personen angelegt" text="Lege unter „Personen“ dein Team an, um mit der Planung zu beginnen." />
          ) : (
            <EmptyState
              title="Keine Personen passen zu den Filtern"
              text="Passe Suche oder Filter an, um wieder Personen zu sehen."
              action={
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Filter zurücksetzen
                </Button>
              }
            />
          )
        }
      />
      {preview && projection && <DragHintBubble hint={projection.hint} clientX={preview.clientX} clientY={preview.clientY} />}
      {editor && <AssignmentDrawer key={editorKey} editor={editor} onClose={closeEditor} />}
    </Flex>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Box data-testid="board-empty" px={6} py={10}>
      <Text fontSize="md" fontWeight={600} color="gray.900">
        {title}
      </Text>
      <Text fontSize="sm" color="gray.500" mt={1} mb={action ? 4 : 0}>
        {text}
      </Text>
      {action}
    </Box>
  );
}
