import { memo } from 'react';
import { Badge, Box, Flex, HStack, Text, Tooltip } from '@chakra-ui/react';
import type { WeekRef } from '../../domain/dates';
import type { Employee, Project, WeekKey } from '../../domain/types';
import type { WeekLoad } from '../../domain/workload';
import { formatDate, formatPercent, SENIORITY_LABELS, STATUS_LABELS } from './boardModel';
import { projectColor } from '../../domain/projectColors';
import { AlertIcon } from './icons';
import { ROW_METRICS, type BarLayout, type BoardGeometry, type RowLayout } from './layout';

export const NAME_COLUMN_WIDTH = 240;

export interface BoardRowProps {
  employee: Employee;
  rowIndex: number;
  layout: RowLayout;
  loads: Record<WeekKey, WeekLoad> | undefined;
  weeks: readonly WeekRef[];
  geometry: BoardGeometry;
  currentWeekIndex: number;
  projectsById: ReadonlyMap<string, Project>;
  /** When set, bars of other projects are dimmed. */
  highlightProjectId: string;
  onAssignmentSelect?: (assignmentId: string) => void;
  /** While dragging: weeks whose (projected) utilization differs from the current state. */
  projectedWeeks?: ReadonlySet<WeekKey>;
  /** While dragging: where the dragged/created bar would land in this row. */
  ghost?: GhostBar;
  /** While dragging: the assignment being dragged (drawn faded at its old place). */
  draggingAssignmentId?: string;
}

export interface GhostBar {
  x: number;
  width: number;
  y: number;
  /** Chakra colour scheme of the project (gray for drag-to-create). */
  color: string;
  /** Some target week would exceed 100 %. */
  over: boolean;
  label: string;
}

const HANDLE_WIDTH = 8;

function cellLabel(employee: Employee, week: WeekRef, load: WeekLoad | undefined): string {
  if (!load) return `${employee.name}, KW ${week.week}`;
  const base = `${employee.name}, KW ${week.week}: ${formatPercent(load.utilization)} ausgelastet, ${STATUS_LABELS[load.status]}`;
  return load.status === 'luft' || load.status === 'ok' ? `${base}, ${Math.round(load.freePercent)} % frei` : base;
}

const HeatLabel = ({ load }: { load: WeekLoad | undefined }) => {
  if (!load) return null;
  if (load.status === 'free') {
    return (
      <Text as="span" fontSize="11px" fontWeight="semibold" color="load.free.fg" aria-hidden>
        frei
      </Text>
    );
  }
  const over = load.status === 'over';
  return (
    <HStack as="span" spacing="2px" aria-hidden color={`load.${load.status}.fg`}>
      {over && <AlertIcon boxSize="11px" />}
      <Text as="span" fontSize="11px" fontWeight={over || load.status === 'full' ? 'bold' : 'medium'} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatPercent(load.utilization)}
      </Text>
    </HStack>
  );
};

interface BarProps {
  /** Positioned relative to the row track (the hosting gridcell is not positioned). */
  bar: BarLayout;
  project: Project | undefined;
  employee: Employee;
  dimmed: boolean;
  dragging: boolean;
  onSelect?: (assignmentId: string) => void;
}

/** Invisible grab zone at a bar end; `touch-action: none` so touch drags resize instead of scrolling. */
const ResizeHandle = ({ side }: { side: 'start' | 'end' }) => (
  <Box
    as="span"
    aria-hidden
    data-resize-handle={side}
    position="absolute"
    top={0}
    bottom={0}
    {...(side === 'start' ? { left: 0 } : { right: 0 })}
    w={`${HANDLE_WIDTH}px`}
    cursor="ew-resize"
    zIndex={1}
    sx={{ touchAction: 'none' }}
    _hover={{ bg: 'blackAlpha.200' }}
  />
);

const AssignmentBar = ({ bar, project, employee, dimmed, dragging, onSelect }: BarProps) => {
  const a = bar.assignment;
  const name = project?.name ?? 'Unbekanntes Projekt';
  const color = projectColor(project?.color);
  const label = `${name} · ${a.allocation} %`;
  const period = `${formatDate(a.start)} – ${formatDate(a.end)}`;
  const aria = `${employee.name}: ${name}, ${a.allocation} %, ${formatDate(a.start)} bis ${formatDate(a.end)}${a.role ? `, Rolle ${a.role}` : ''}`;
  return (
    <Tooltip
      hasArrow
      openDelay={300}
      placement="top"
      closeOnPointerDown
      isDisabled={dragging}
      label={
        <Box py={0.5}>
          <Text fontWeight="semibold">{name}</Text>
          <Text>{period}</Text>
          <Text>
            Allokation {a.allocation} %{a.role ? ` · Rolle: ${a.role}` : ''}
          </Text>
        </Box>
      }
    >
      <Box
        as="button"
        type="button"
        data-assignment-id={a.id}
        data-employee-id={a.employeeId}
        data-project-id={a.projectId}
        aria-label={aria}
        onClick={() => onSelect?.(a.id)}
        position="absolute"
        zIndex={1}
        left={`${bar.x + 1}px`}
        top={`${bar.y}px`}
        w={`${Math.max(bar.width - 2, 4)}px`}
        h={`${bar.height}px`}
        display="flex"
        alignItems="center"
        px={2}
        textAlign="left"
        bg={`${color}.100`}
        color={`${color}.900`}
        borderLeftWidth={bar.clippedStart ? 0 : '3px'}
        borderLeftColor={`${color}.500`}
        borderLeftRadius={bar.clippedStart ? 0 : 'md'}
        borderRightRadius={bar.clippedEnd ? 0 : 'md'}
        boxShadow="0 1px 0 rgba(15, 23, 42, 0.06)"
        opacity={dragging ? 0.35 : dimmed ? 0.28 : 1}
        cursor={dragging ? 'grabbing' : 'grab'}
        userSelect="none"
        transition="background 120ms, opacity 160ms"
        sx={{ touchAction: 'none' }}
        _hover={{ bg: `${color}.200` }}
        _focusVisible={{ outline: '2px solid', outlineColor: 'blue.500', outlineOffset: '1px', zIndex: 2 }}
      >
        {!bar.clippedStart && <ResizeHandle side="start" />}
        <Text as="span" fontSize="xs" fontWeight="medium" noOfLines={1} wordBreak="break-all">
          {label}
        </Text>
        {!bar.clippedEnd && <ResizeHandle side="end" />}
      </Box>
    </Tooltip>
  );
};

/** One person: sticky name cell, per-week heat cells, project bars in lanes. */
export const BoardRow = memo(function BoardRow({
  employee,
  rowIndex,
  layout,
  loads,
  weeks,
  geometry,
  currentWeekIndex,
  projectsById,
  highlightProjectId,
  onAssignmentSelect,
  projectedWeeks,
  ghost,
  draggingAssignmentId,
}: BoardRowProps) {
  const { columnWidth } = geometry;
  const barsByWeek = new Map<number, BarLayout[]>();
  for (const bar of layout.bars) {
    const list = barsByWeek.get(bar.firstWeekIndex);
    if (list) list.push(bar);
    else barsByWeek.set(bar.firstWeekIndex, [bar]);
  }

  return (
    <Flex
      role="row"
      aria-rowindex={rowIndex}
      data-employee-id={employee.id}
      h={`${layout.height}px`}
      borderBottomWidth="1px"
      borderColor="board.lineStrong"
      _hover={{ '& > [role=rowheader]': { bg: 'gray.50' } }}
    >
      <Flex
        role="rowheader"
        position="sticky"
        left={0}
        zIndex={2}
        flexShrink={0}
        w={`${NAME_COLUMN_WIDTH}px`}
        px={4}
        direction="column"
        justify="center"
        bg="white"
        borderRightWidth="1px"
        borderColor="board.lineStrong"
        opacity={employee.active ? 1 : 0.6}
        transition="background 120ms"
      >
        <HStack spacing={2} minW={0}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.800" noOfLines={1}>
            {employee.name}
          </Text>
          {employee.capacity < 1 && (
            <Badge
              flexShrink={0}
              variant="subtle"
              colorScheme="purple"
              fontSize="10px"
              title={`Teilzeit: ${Math.round(employee.capacity * 100)} % Kapazität`}
            >
              {Math.round(employee.capacity * 100)} %
            </Badge>
          )}
          {!employee.active && (
            <Badge flexShrink={0} variant="outline" colorScheme="gray" fontSize="10px">
              inaktiv
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" color="gray.500" noOfLines={1}>
          {employee.role} · {SENIORITY_LABELS[employee.seniority]}
        </Text>
      </Flex>

      <Box
        role="presentation"
        data-track={employee.id}
        position="relative"
        flexShrink={0}
        w={`${geometry.totalWidth}px`}
        h="full"
        display="flex"
        cursor="crosshair"
      >
        {weeks.map((week, i) => {
          const load = loads?.[week.key];
          const status = load?.status ?? 'free';
          const projected = projectedWeeks?.has(week.key) ?? false;
          return (
            <Box
              key={week.key}
              role="gridcell"
              aria-label={cellLabel(employee, week, load)}
              data-employee-id={employee.id}
              data-week-key={week.key}
              data-status={status}
              data-projected={projected || undefined}
              flexShrink={0}
              w={`${columnWidth}px`}
              h="full"
              bg={`load.${status}.bg`}
              borderRightWidth="1px"
              borderColor="board.line"
              boxShadow={
                projected
                  ? `inset 0 0 0 2px var(--chakra-colors-${status === 'over' ? 'red-400' : 'blue-300'})`
                  : i === currentWeekIndex
                    ? 'inset 2px 0 0 var(--chakra-colors-blue-200), inset -2px 0 0 var(--chakra-colors-blue-200)'
                    : undefined
              }
              display="flex"
              justifyContent="flex-end"
              alignItems="flex-start"
              pt="3px"
              pr="6px"
            >
              <HeatLabel load={load} />
              {barsByWeek.get(i)?.map((bar) => (
                <AssignmentBar
                  key={bar.assignment.id}
                  bar={bar}
                  employee={employee}
                  project={projectsById.get(bar.assignment.projectId)}
                  dimmed={Boolean(highlightProjectId) && bar.assignment.projectId !== highlightProjectId}
                  dragging={bar.assignment.id === draggingAssignmentId}
                  onSelect={onAssignmentSelect}
                />
              ))}
            </Box>
          );
        })}
        {ghost && (
          <Box
            aria-hidden
            data-testid="drag-ghost"
            data-over={ghost.over || undefined}
            position="absolute"
            zIndex={3}
            pointerEvents="none"
            left={`${ghost.x + 1}px`}
            top={`${ghost.y}px`}
            w={`${Math.max(ghost.width - 2, 4)}px`}
            h={`${ROW_METRICS.barHeight}px`}
            display="flex"
            alignItems="center"
            px={2}
            borderRadius="md"
            borderWidth="2px"
            borderStyle="dashed"
            borderColor={ghost.over ? 'red.500' : `${ghost.color}.500`}
            bg={ghost.over ? 'red.50' : `${ghost.color}.50`}
            color={ghost.over ? 'red.800' : `${ghost.color}.900`}
            opacity={0.92}
            boxShadow="md"
          >
            <Text as="span" fontSize="xs" fontWeight="semibold" noOfLines={1} wordBreak="break-all">
              {ghost.label}
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
});
