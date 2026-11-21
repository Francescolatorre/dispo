import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertIcon, Box, Button, Flex, Skeleton, Stack, Text } from '@chakra-ui/react';
import { addWeeks, isoWeekKey, todayISO } from '../../domain/dates';
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
import { createGeometry, layoutRow, type ColumnWidth, type RowLayout } from './layout';

export interface PlanningBoardProps {
  /** Reference day (default: today). Injected by tests. */
  today?: ISODate;
  /** Called when a project bar is clicked/activated (edit drawer in milestone 4). */
  onAssignmentSelect?: (assignmentId: string) => void;
}

const BoardSkeleton = () => (
  <Stack spacing={2} data-testid="board-loading" aria-busy="true" aria-label="Lade Planungsdaten">
    <Skeleton h="66px" borderRadius="lg" />
    {Array.from({ length: 8 }, (_, i) => (
      <Skeleton key={i} h="52px" borderRadius="md" />
    ))}
  </Stack>
);

/**
 * Planning board: people × ISO weeks with workload heat cells and project bars.
 * Read-only in this milestone; `onAssignmentSelect` and the `data-*` attributes are the
 * hooks for drag/edit interactions.
 */
export function PlanningBoard({ today: todayProp, onAssignmentSelect }: PlanningBoardProps) {
  const { employees, projects, assignments, loading, error, reload } = usePlanning();
  const [today] = useState<ISODate>(() => todayProp ?? todayISO());
  const homeStart = useMemo(() => defaultRangeStart(today), [today]);
  const [rangeStart, setRangeStart] = useState<ISODate>(homeStart);
  const [columnWidth, setColumnWidth] = useState<ColumnWidth>(96);
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);

  const weeks = useMemo(() => visibleWeeks(rangeStart), [rangeStart]);
  const geometry = useMemo(() => createGeometry(weeks, columnWidth), [weeks, columnWidth]);
  const rangeEnd = geometry.rangeEnd;

  // Workload of every person for the visible weeks — recomputed only when data or range change.
  const matrix = useMemo(() => computeWorkloadMatrix(employees, assignments, weeks), [employees, assignments, weeks]);
  const insights = useMemo(() => computeInsights(employees, assignments, today), [employees, assignments, today]);

  const assignmentsByEmployee = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of assignments) {
      const list = map.get(a.employeeId);
      if (list) list.push(a);
      else map.set(a.employeeId, [a]);
    }
    return map;
  }, [assignments]);

  const rowLayouts = useMemo(() => {
    const map = new Map<string, RowLayout>();
    for (const e of employees) map.set(e.id, layoutRow(geometry, assignmentsByEmployee.get(e.id) ?? []));
    return map;
  }, [employees, assignmentsByEmployee, geometry]);

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
  const goToday = useCallback(() => setRangeStart(homeStart), [homeStart]);
  const toggleOverbooked = useCallback(
    () => setFilters((f) => ({ ...f, onlyOverbooked: !f.onlyOverbooked, onlyFree: false })),
    [],
  );
  const toggleFree = useCallback(() => setFilters((f) => ({ ...f, onlyFree: !f.onlyFree, onlyOverbooked: false })), []);

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

  if (loading) return <BoardSkeleton />;

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
      />
      {employees.length === 0 ? (
        <EmptyState title="Noch keine Personen angelegt" text="Lege unter „Personen“ dein Team an, um mit der Planung zu beginnen." />
      ) : visibleEmployees.length === 0 ? (
        <EmptyState
          title="Keine Personen passen zu den Filtern"
          text="Passe Suche oder Filter an, um wieder Personen zu sehen."
          action={
            <Button size="sm" onClick={resetFilters}>
              Filter zurücksetzen
            </Button>
          }
        />
      ) : (
        <BoardGrid
          employees={visibleEmployees}
          weeks={weeks}
          geometry={geometry}
          matrix={matrix}
          rowLayouts={rowLayouts}
          projectsById={projectsById}
          today={today}
          currentWeekKey={isoWeekKey(today)}
          highlightProjectId={filters.projectId}
          onAssignmentSelect={onAssignmentSelect}
        />
      )}
    </Flex>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Box
      data-testid="board-empty"
      bg="white"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="gray.300"
      borderRadius="lg"
      py={14}
      px={6}
      textAlign="center"
    >
      <Text fontWeight="semibold" color="gray.800">
        {title}
      </Text>
      <Text fontSize="sm" color="gray.500" mt={1} mb={action ? 4 : 0}>
        {text}
      </Text>
      {action}
    </Box>
  );
}
