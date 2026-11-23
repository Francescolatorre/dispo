import { memo } from 'react';
import { Box, Flex, HStack, Text, Tooltip } from '@chakra-ui/react';
import type { WeekRef } from '../../domain/dates';
import { projectColorTokens } from '../../domain/projectColors';
import type { Employee, Project, WeekKey } from '../../domain/types';
import type { WeekLoad } from '../../domain/workload';
import { formatDate, formatPercent, SENIORITY_SHORT, STATUS_LABELS, stripLabels, stripValue } from './boardModel';
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { NAME_COLUMN_WIDTH, ROW_METRICS, type BarLayout, type BoardGeometry, type RowLayout, type RowMetrics } from './layout';

const INK = '21,24,32';

export interface BoardRowProps {
  employee: Employee;
  rowIndex: number;
  layout: RowLayout;
  loads: Record<WeekKey, WeekLoad> | undefined;
  /** While dragging: the loads before the drag, for "90 → 120" transition labels. */
  baseLoads?: Record<WeekKey, WeekLoad>;
  weeks: readonly WeekRef[];
  geometry: BoardGeometry;
  metrics?: RowMetrics;
  nameColumnWidth?: number;
  /** Compact density hides the meta line of the name block. */
  compact?: boolean;
  currentWeekIndex: number;
  /** x of today's line inside the track, or null when today is outside the range. */
  todayX: number | null;
  projectsById: ReadonlyMap<string, Project>;
  /** When set, bars of this project are highlighted and the others dimmed. */
  highlightProjectId: string;
  onAssignmentSelect?: (assignmentId: string) => void;
  /** Expanded rows show every lane instead of the "+N weitere" chip. */
  expanded?: boolean;
  onToggleExpanded?: (employeeId: string) => void;
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
  /** Project colour (palette key; slate for drag-to-create). */
  color: string;
  /** Some target week would exceed 100 %. */
  over: boolean;
  label: string;
}

const HANDLE_WIDTH = 12;

function cellLabel(employee: Employee, week: WeekRef, load: WeekLoad | undefined): string {
  if (!load) return `${employee.name}, KW ${week.week}`;
  const base = `${employee.name}, KW ${week.week}: ${formatPercent(load.utilization)} ausgelastet, ${STATUS_LABELS[load.status]}`;
  return load.status === 'luft' || load.status === 'ok' ? `${base}, ${Math.round(load.freePercent)} % frei` : base;
}

/** Utilization label at the top-left of a cell (mono, no "%" — the legend says "in %"). */
const StripLabel = ({ load, before, run }: { load: WeekLoad; before?: WeekLoad; run: boolean }) => {
  const over = load.status === 'over';
  const word = load.status === 'free' ? 'frei' : load.status === 'full' ? 'voll' : null;
  return (
    <HStack
      as="span"
      aria-hidden
      data-strip-label
      data-run-inner={run ? undefined : ''}
      spacing="3px"
      display="flex"
      pl="6px"
      h="var(--strip-h)"
      overflow="hidden"
      fontFamily="mono"
      fontSize="2xs"
      lineHeight="2xs"
      whiteSpace="nowrap"
      color={`load.${load.status}.fg`}
      fontWeight={over ? 700 : word ? 600 : 500}
      opacity={run ? 1 : 0}
      transition="opacity 150ms"
      pointerEvents="none"
    >
      {before && (
        <>
          <Text as="span" color={`load.${before.status}.fg`} fontWeight={500}>
            {stripValue(before)}
          </Text>
          <Text as="span" color="gray.400" fontWeight={500}>
            →
          </Text>
        </>
      )}
      {over && <AlertIcon boxSize="10px" />}
      <Text as="span">{word && !before ? word : stripValue(load)}</Text>
    </HStack>
  );
};

interface BarProps {
  /** Positioned relative to the row track (the hosting gridcell is not positioned). */
  bar: BarLayout;
  project: Project | undefined;
  employee: Employee;
  /** Sticky offset of the label (keeps the name visible while scrolling). */
  stickyLeft: number;
  highlight: 'on' | 'off' | null;
  dragging: boolean;
  onSelect?: (assignmentId: string) => void;
}

/** Grab zone at a bar end (12 px hit area, 6 px inside the bar); `touch-action: none` so touch drags resize. */
const ResizeHandle = ({ side }: { side: 'start' | 'end' }) => (
  <Box
    as="span"
    aria-hidden
    data-resize-handle={side}
    position="absolute"
    top={0}
    bottom={0}
    {...(side === 'start' ? { left: '-6px' } : { right: '-6px' })}
    w={`${HANDLE_WIDTH}px`}
    cursor="ew-resize"
    zIndex={1}
    display="flex"
    alignItems="center"
    justifyContent="center"
    sx={{ touchAction: 'none', '&:hover > span': { opacity: 1 } }}
  >
    <Box as="span" w="2px" h="10px" borderRadius="full" bg="gray.400" opacity={0} transition="opacity 100ms" />
  </Box>
);

function initials(name: string): string {
  const parts = name.split(/[\s-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

const AssignmentBar = ({ bar, project, employee, stickyLeft, highlight, dragging, onSelect }: BarProps) => {
  const a = bar.assignment;
  const name = project?.name ?? 'Unbekanntes Projekt';
  const tokens = projectColorTokens(project?.color);
  const period = `${formatDate(a.start)} – ${formatDate(a.end)}`;
  const aria = `${employee.name}: ${name}, ${a.allocation} %, ${formatDate(a.start)} bis ${formatDate(a.end)}${a.role ? `, Rolle ${a.role}` : ''}`;
  const width = Math.max(bar.width - 2, 8);
  const lit = highlight === 'on';
  const hairline = `rgba(${INK},0.12)`;
  return (
    <Tooltip
      openDelay={400}
      placement="top"
      closeOnPointerDown
      isDisabled={dragging}
      label={
        <Box>
          <Text fontWeight={600}>{name}</Text>
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
        w={`${width}px`}
        h={`${bar.height}px`}
        display="flex"
        alignItems="center"
        gap={1}
        pl={bar.clippedStart ? '3px' : '6px'}
        pr="4px"
        textAlign="left"
        bg={lit ? tokens.tint : 'white'}
        color={lit ? tokens.fg : 'gray.800'}
        borderWidth="1px"
        borderStyle={dragging ? 'dashed' : 'solid'}
        borderColor={dragging ? tokens.edge : hairline}
        borderLeftWidth={bar.clippedStart ? '1px' : '3px'}
        borderLeftColor={bar.clippedStart ? hairline : tokens.edge}
        borderLeftRadius={bar.clippedStart ? 0 : 'sm'}
        borderRightRadius={bar.clippedEnd ? 0 : 'sm'}
        opacity={dragging ? 0.4 : highlight === 'off' ? 0.35 : 1}
        cursor={dragging ? 'grabbing' : 'grab'}
        userSelect="none"
        transition="background 100ms, opacity 150ms"
        sx={{ touchAction: 'none' }}
        _hover={{ bg: lit ? tokens.tint : '#EDEEF1' }}
        _focusVisible={{ outline: '2px solid', outlineColor: 'accent.500', outlineOffset: '-2px', zIndex: 2 }}
      >
        {!bar.clippedStart && <ResizeHandle side="start" />}
        {bar.clippedStart && <ChevronLeftIcon boxSize="10px" color="gray.400" flexShrink={0} />}
        {width >= 24 && (
          <Text
            as="span"
            position="sticky"
            left={`${stickyLeft}px`}
            flex="0 1 auto"
            minW={0}
            fontSize="xs"
            lineHeight="xs"
            fontWeight={width < 56 ? 600 : 500}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {width < 56 ? initials(name) : name}
          </Text>
        )}
        {width >= 120 && (
          <Text as="span" flexShrink={0} ml="auto" pl={1} fontFamily="mono" fontSize="2xs" lineHeight="2xs" color={lit ? tokens.fg : 'gray.500'}>
            {a.allocation} %
          </Text>
        )}
        {bar.clippedEnd && <ChevronRightIcon boxSize="10px" color="gray.400" flexShrink={0} ml={width >= 120 ? 0 : "auto"} />}
        {!bar.clippedEnd && <ResizeHandle side="end" />}
      </Box>
    </Tooltip>
  );
};

/** One person: sticky name cell, per-week heat cells with strip labels, project bars in lanes. */
export const BoardRow = memo(function BoardRow({
  employee,
  rowIndex,
  layout,
  loads,
  baseLoads,
  weeks,
  geometry,
  metrics = ROW_METRICS,
  nameColumnWidth = NAME_COLUMN_WIDTH,
  compact = false,
  currentWeekIndex,
  todayX,
  projectsById,
  highlightProjectId,
  onAssignmentSelect,
  expanded = false,
  onToggleExpanded,
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
  const weekLoads = weeks.map((w) => loads?.[w.key]);
  const runStarts = stripLabels(weekLoads, currentWeekIndex);
  const capacity = employee.capacity < 1 ? ` · ${Math.round(employee.capacity * 100)} % Kap.` : '';
  const meta = `${employee.role} · ${SENIORITY_SHORT[employee.seniority]}${capacity}`;
  const ghostTokens = ghost ? projectColorTokens(ghost.color) : null;
  const canCollapse = expanded && layout.laneCount > metrics.maxLanes;
  const pitch = metrics.barHeight + metrics.laneGap;

  return (
    <Flex
      role="row"
      aria-rowindex={rowIndex}
      data-employee-id={employee.id}
      h={`${layout.height}px`}
      borderBottomWidth="1px"
      borderColor="line"
      sx={{
        '--strip-h': `${metrics.headerStrip}px`,
        '&:hover [data-run-inner], &:focus-within [data-run-inner]': { opacity: 1 },
        '&:hover > [role=rowheader]': { bg: '#F1F2F4' },
      }}
    >
      <Flex
        role="rowheader"
        position="sticky"
        left={0}
        zIndex={2}
        flexShrink={0}
        w={`${nameColumnWidth}px`}
        pl={3}
        pr={2}
        pt={compact ? '8px' : '6px'}
        gap={2}
        align="flex-start"
        bg="white"
        borderRightWidth="1px"
        borderColor="line.strong"
        transition="background 100ms, box-shadow 150ms"
        title={compact ? `${employee.name} · ${meta}` : undefined}
      >
        <Flex
          aria-hidden
          flexShrink={0}
          boxSize="24px"
          mt={compact ? '-3px' : 0}
          borderRadius="full"
          bg="gray.100"
          color="gray.700"
          fontSize="2xs"
          fontWeight={600}
          align="center"
          justify="center"
        >
          {initials(employee.name)}
        </Flex>
        <Box minW={0} flex={1}>
          <HStack spacing={1.5} minW={0}>
            <Text
              fontSize="sm"
              lineHeight="sm"
              fontWeight={600}
              color={employee.active ? 'gray.800' : 'gray.500'}
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              title={employee.name}
            >
              {employee.name}
            </Text>
            {!employee.active && (
              <Text
                as="span"
                flexShrink={0}
                fontSize="2xs"
                lineHeight="14px"
                fontWeight={500}
                color="gray.500"
                borderWidth="1px"
                borderColor="gray.300"
                borderRadius="sm"
                px={1}
              >
                inaktiv
              </Text>
            )}
          </HStack>
          <Text
            fontSize="xs"
            lineHeight="xs"
            color="gray.500"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            srOnly={compact || undefined}
          >
            {meta}
          </Text>
          {canCollapse && (
            <Box
              as="button"
              type="button"
              mt={1}
              fontSize="2xs"
              color="accent.600"
              fontWeight={500}
              onClick={() => onToggleExpanded?.(employee.id)}
              _hover={{ textDecoration: 'underline' }}
            >
              Einklappen
            </Box>
          )}
        </Box>
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
          const load = weekLoads[i];
          const status = load?.status ?? 'free';
          const projected = projectedWeeks?.has(week.key) ?? false;
          const before = projected ? baseLoads?.[week.key] : undefined;
          const current = i === currentWeekIndex;
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
              borderColor={current || i === currentWeekIndex - 1 ? 'accent.100' : 'board.line'}
              boxShadow={status === 'over' ? 'inset 0 3px 0 var(--chakra-colors-load-over-strong)' : undefined}
              outline={projected ? '1px dashed' : undefined}
              outlineColor={projected ? 'accent.500' : undefined}
              outlineOffset="-1px"
              transition="background 150ms"
            >
              {load && <StripLabel load={load} before={before} run={runStarts[i] || projected} />}
              {barsByWeek.get(i)?.map((bar) => (
                <AssignmentBar
                  key={bar.assignment.id}
                  bar={bar}
                  employee={employee}
                  project={projectsById.get(bar.assignment.projectId)}
                  stickyLeft={nameColumnWidth + 8}
                  highlight={highlightProjectId ? (bar.assignment.projectId === highlightProjectId ? 'on' : 'off') : null}
                  dragging={bar.assignment.id === draggingAssignmentId}
                  onSelect={onAssignmentSelect}
                />
              ))}
            </Box>
          );
        })}
        {todayX !== null && (
          <Box
            aria-hidden
            position="absolute"
            top={`${metrics.headerStrip}px`}
            bottom={0}
            left={`${todayX}px`}
            w="1px"
            bg="board.today"
            opacity={0.6}
            pointerEvents="none"
            zIndex={0}
          />
        )}
        {layout.overflowLane >= 0 && (
          <Box
            position="absolute"
            left={0}
            right={0}
            top={`${metrics.headerStrip + layout.overflowLane * pitch}px`}
            h={`${metrics.barHeight}px`}
            pointerEvents="none"
          >
            <Box
              as="button"
              type="button"
              data-overflow-chip
              onClick={() => onToggleExpanded?.(employee.id)}
              position="sticky"
              left={`${nameColumnWidth + 8}px`}
              pointerEvents="auto"
              h="full"
              px={2}
              fontSize="xs"
              fontWeight={500}
              color="gray.700"
              bg="gray.100"
              borderRadius="sm"
              whiteSpace="nowrap"
              _hover={{ bg: 'gray.200' }}
              _focusVisible={{ outline: '2px solid', outlineColor: 'accent.500', outlineOffset: '-2px' }}
            >
              +{layout.hiddenCount} weitere
            </Box>
          </Box>
        )}
        {ghost && ghostTokens && (
          <Box
            aria-hidden
            data-testid="drag-ghost"
            data-over={ghost.over || undefined}
            position="absolute"
            zIndex={3}
            pointerEvents="none"
            left={`${ghost.x + 1}px`}
            top={`${ghost.y}px`}
            w={`${Math.max(ghost.width - 2, 8)}px`}
            h={`${metrics.barHeight}px`}
            display="flex"
            alignItems="center"
            gap={1}
            pl="6px"
            pr="4px"
            borderRadius="sm"
            bg="white"
            bgImage={`linear-gradient(rgba(${INK},0.06), rgba(${INK},0.06))`}
            borderWidth="1px"
            borderColor={ghost.over ? 'load.over.strong' : 'accent.500'}
            borderLeftWidth="3px"
            borderLeftColor={ghostTokens.edge}
            color="gray.900"
            boxShadow="md"
            transition="left 100ms cubic-bezier(0.2, 0, 0, 1), width 100ms cubic-bezier(0.2, 0, 0, 1)"
          >
            {ghost.over && <AlertIcon boxSize="10px" color="load.over.fg" flexShrink={0} />}
            <Text as="span" fontSize="xs" fontWeight={600} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              {ghost.label}
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
});
