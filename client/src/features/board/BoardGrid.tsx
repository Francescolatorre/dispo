import type { HTMLAttributes, Ref } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import type { WeekRef } from '../../domain/dates';
import type { Employee, ISODate, Project, WeekKey } from '../../domain/types';
import type { WeekLoad, WorkloadMatrix } from '../../domain/workload';
import { formatDate, formatDayMonth, monthSegments } from './boardModel';
import { BoardRow, NAME_COLUMN_WIDTH, type GhostBar } from './BoardRow';
import { dateToX, type BoardGeometry, type RowLayout } from './layout';

const MONTH_BAND_HEIGHT = 26;
const WEEK_ROW_HEIGHT = 40;

export interface BoardGridProps {
  employees: readonly Employee[];
  weeks: readonly WeekRef[];
  geometry: BoardGeometry;
  matrix: WorkloadMatrix;
  rowLayouts: ReadonlyMap<string, RowLayout>;
  projectsById: ReadonlyMap<string, Project>;
  today: ISODate;
  currentWeekKey: WeekKey;
  highlightProjectId: string;
  onAssignmentSelect?: (assignmentId: string) => void;
  /** Delegated pointer/keyboard handlers of the interactions (drag, keyboard edits). */
  interactionProps?: HTMLAttributes<HTMLDivElement>;
  contentRef?: Ref<HTMLDivElement>;
  /** While dragging: projected loads and changed weeks of the affected people. */
  projection?: {
    loads: Readonly<Record<string, Record<WeekKey, WeekLoad>>>;
    changed: Readonly<Record<string, ReadonlySet<WeekKey>>>;
  } | null;
  ghost?: (GhostBar & { employeeId: string }) | null;
  dragging?: { assignmentId: string; employeeId: string } | null;
}

const EMPTY_LOADS: Record<WeekKey, WeekLoad> = {};

/**
 * The scrollable grid. Horizontal and vertical scrolling happen inside this box only;
 * the header sticks to the top, the name column to the left.
 */
export function BoardGrid({
  employees,
  weeks,
  geometry,
  matrix,
  rowLayouts,
  projectsById,
  today,
  currentWeekKey,
  highlightProjectId,
  onAssignmentSelect,
  interactionProps,
  contentRef,
  projection,
  ghost,
  dragging,
}: BoardGridProps) {
  const { columnWidth, totalWidth } = geometry;
  const currentWeekIndex = weeks.findIndex((w) => w.key === currentWeekKey);
  const segments = monthSegments(weeks);
  const todayX = today >= geometry.rangeStart && today <= geometry.rangeEnd ? dateToX(geometry, today) + columnWidth / 14 : null;
  const contentWidth = NAME_COLUMN_WIDTH + totalWidth;

  return (
    <Box
      role="grid"
      aria-label="Planungsboard: Personen und Kalenderwochen"
      aria-rowcount={employees.length + 1}
      aria-colcount={weeks.length + 1}
      data-testid="planning-board"
      flex={1}
      minH={0}
      overflow="auto"
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      boxShadow="sm"
      sx={{ overscrollBehaviorX: 'contain' }}
    >
      <Box ref={contentRef} position="relative" w={`${contentWidth}px`} minW="full" {...interactionProps}>
        {/* Header */}
        <Flex
          role="row"
          aria-rowindex={1}
          position="sticky"
          top={0}
          zIndex={3}
          bg="white"
          borderBottomWidth="1px"
          borderColor="gray.300"
          boxShadow="0 1px 2px rgba(15, 23, 42, 0.04)"
        >
          <Flex
            role="columnheader"
            position="sticky"
            left={0}
            zIndex={4}
            flexShrink={0}
            w={`${NAME_COLUMN_WIDTH}px`}
            px={4}
            align="flex-end"
            pb={2}
            bg="white"
            borderRightWidth="1px"
            borderColor="board.lineStrong"
          >
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
              Person
            </Text>
          </Flex>
          <Box role="presentation" flexShrink={0} w={`${totalWidth}px`} position="relative">
            <Flex aria-hidden h={`${MONTH_BAND_HEIGHT}px`} borderBottomWidth="1px" borderColor="board.line">
              {segments.map((s) => {
                const width = s.weekCount * columnWidth;
                return (
                  <Flex
                    key={s.key}
                    w={`${width}px`}
                    flexShrink={0}
                    align="center"
                    px={2}
                    borderRightWidth="1px"
                    borderColor="board.lineStrong"
                    overflow="hidden"
                  >
                    <Text fontSize="xs" fontWeight="semibold" color="gray.700" whiteSpace="nowrap">
                      {width < 110 ? s.shortLabel : s.label}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
            <Flex role="presentation" h={`${WEEK_ROW_HEIGHT}px`}>
              {weeks.map((w, i) => {
                const current = i === currentWeekIndex;
                return (
                  <Flex
                    key={w.key}
                    role="columnheader"
                    aria-label={`KW ${w.week}, ${formatDate(w.start)} bis ${formatDate(w.end)}${current ? ', aktuelle Woche' : ''}`}
                    aria-current={current ? 'date' : undefined}
                    data-week-key={w.key}
                    w={`${columnWidth}px`}
                    flexShrink={0}
                    direction="column"
                    justify="center"
                    px={2}
                    bg={current ? 'board.currentWeek' : undefined}
                    borderRightWidth="1px"
                    borderColor="board.line"
                    borderBottomWidth={current ? '2px' : 0}
                    borderBottomColor="board.today"
                  >
                    <Text fontSize="xs" fontWeight="semibold" color={current ? 'blue.700' : 'gray.700'} lineHeight="short" whiteSpace="nowrap">
                      KW {w.week}
                    </Text>
                    <Text fontSize="11px" color={current ? 'blue.600' : 'gray.500'} lineHeight="short" whiteSpace="nowrap">
                      {formatDayMonth(w.start)}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Flex>

        {/* Body */}
        <Box role="rowgroup">
          {employees.map((e, i) => {
            const layout = rowLayouts.get(e.id);
            if (!layout) return null;
            return (
              <BoardRow
                key={e.id}
                employee={e}
                rowIndex={i + 2}
                layout={layout}
                loads={projection?.loads[e.id] ?? matrix[e.id] ?? EMPTY_LOADS}
                weeks={weeks}
                geometry={geometry}
                currentWeekIndex={currentWeekIndex}
                projectsById={projectsById}
                highlightProjectId={highlightProjectId}
                onAssignmentSelect={onAssignmentSelect}
                projectedWeeks={projection?.changed[e.id]}
                ghost={ghost?.employeeId === e.id ? ghost : undefined}
                draggingAssignmentId={dragging?.employeeId === e.id ? dragging.assignmentId : undefined}
              />
            );
          })}
        </Box>

        {todayX !== null && (
          <Box
            aria-hidden
            data-testid="today-marker"
            position="absolute"
            top={`${MONTH_BAND_HEIGHT}px`}
            bottom={0}
            left={`${NAME_COLUMN_WIDTH + todayX}px`}
            w="2px"
            ml="-1px"
            bg="board.today"
            opacity={0.7}
            pointerEvents="none"
            zIndex={1}
          >
            <Box position="absolute" top="-3px" left="-3px" boxSize="8px" borderRadius="full" bg="board.today" />
          </Box>
        )}
      </Box>
    </Box>
  );
}
