import { useCallback, useEffect, useRef, type HTMLAttributes, type ReactNode, type Ref, type UIEvent } from 'react';
import { Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import type { WeekRef } from '../../domain/dates';
import type { Employee, ISODate, Project, WeekKey } from '../../domain/types';
import type { WeekLoad, WorkloadMatrix } from '../../domain/workload';
import { formatDate, formatDayMonth, monthSegments } from './boardModel';
import { BoardRow, type GhostBar } from './BoardRow';
import { dateToX, NAME_COLUMN_WIDTH, ROW_METRICS, type BoardGeometry, type RowLayout, type RowMetrics } from './layout';

const MONTH_BAND_HEIGHT = 24;
const WEEK_ROW_HEIGHT = 32;
export const BOARD_HEADER_HEIGHT = MONTH_BAND_HEIGHT + WEEK_ROW_HEIGHT;
const FOOTER_HEIGHT = 32;

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
  metrics?: RowMetrics;
  nameColumnWidth?: number;
  compact?: boolean;
  /** Persons counted in the corner cell (defaults to the rendered rows). */
  personCount?: number;
  expandedRows?: ReadonlySet<string>;
  onToggleExpanded?: (employeeId: string) => void;
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
  /** Structural skeleton rows instead of people (header stays real). */
  loading?: boolean;
  /** Rendered inside the frame below the header when there are no rows. */
  empty?: ReactNode;
  /** 32 px footer inside the frame (legend, person count). */
  footer?: ReactNode;
  /** Changing this value scrolls the current week into view (2nd visible column). */
  scrollToTodayToken?: number;
}

const EMPTY_LOADS: Record<WeekKey, WeekLoad> = {};

/** Sets scroll state attributes on the scroller without re-rendering React. */
function markScroll(el: HTMLElement) {
  const max = el.scrollWidth - el.clientWidth;
  el.toggleAttribute('data-scrolled-y', el.scrollTop > 0);
  el.toggleAttribute('data-scrolled-x', el.scrollLeft > 0);
  el.parentElement?.toggleAttribute('data-more-right', el.scrollLeft < max - 1);
}

/**
 * The board frame: one scroller (header sticks to the top, names to the left), edge fade and
 * a footer slot. Horizontal and vertical scrolling happen inside the scroller only.
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
  metrics = ROW_METRICS,
  nameColumnWidth = NAME_COLUMN_WIDTH,
  compact = false,
  personCount,
  expandedRows,
  onToggleExpanded,
  onAssignmentSelect,
  interactionProps,
  contentRef,
  projection,
  ghost,
  dragging,
  loading = false,
  empty,
  footer,
  scrollToTodayToken = 0,
}: BoardGridProps) {
  const { columnWidth, totalWidth } = geometry;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const currentWeekIndex = weeks.findIndex((w) => w.key === currentWeekKey);
  const segments = monthSegments(weeks);
  const dayWidth = columnWidth / 7;
  const todayX = today >= geometry.rangeStart && today <= geometry.rangeEnd ? dateToX(geometry, today) + dayWidth / 2 : null;
  const contentWidth = nameColumnWidth + totalWidth;
  const count = personCount ?? employees.length;

  // Current week as the 2nd visible column — on mount, range/zoom change and "Heute".
  const rangeStart = geometry.rangeStart;
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = currentWeekIndex > 0 ? (currentWeekIndex - 1) * columnWidth : 0;
    markScroll(el);
  }, [rangeStart, columnWidth, currentWeekIndex, scrollToTodayToken]);

  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => markScroll(e.currentTarget), []);

  return (
    <Flex
      direction="column"
      flex={1}
      minH={0}
      position="relative"
      bg="white"
      borderWidth="1px"
      borderColor="line"
      borderRadius="lg"
      boxShadow="sm"
      overflow="hidden"
      sx={{
        '&[data-more-right] > [data-edge-fade]': { opacity: 1 },
      }}
    >
      <Box
        ref={scrollerRef}
        role="grid"
        aria-label="Planungsboard: Personen und Kalenderwochen"
        aria-rowcount={employees.length + 1}
        aria-colcount={weeks.length + 1}
        aria-busy={loading || undefined}
        data-testid="planning-board"
        flex={1}
        minH={0}
        overflow="auto"
        onScroll={onScroll}
        sx={{
          overscrollBehaviorX: 'contain',
          scrollbarGutter: 'stable',
          '&[data-scrolled-y] [data-board-header]': { boxShadow: 'sm' },
          '&[data-scrolled-x] [role=rowheader], &[data-scrolled-x] [data-corner]': {
            boxShadow: '4px 0 6px -4px rgba(21,24,32,0.14)',
          },
        }}
      >
        <Box ref={contentRef} position="relative" w={`${contentWidth}px`} minW="full" {...interactionProps}>
          {/* Header */}
          <Flex
            role="row"
            aria-rowindex={1}
            data-board-header
            position="sticky"
            top={0}
            zIndex={3}
            bg="white"
            borderBottomWidth="1px"
            borderColor="line.strong"
            transition="box-shadow 150ms"
          >
            <Flex
              role="columnheader"
              data-corner
              position="sticky"
              left={0}
              zIndex={4}
              flexShrink={0}
              w={`${nameColumnWidth}px`}
              pl={3}
              pr={2}
              pb="7px"
              align="flex-end"
              justify="space-between"
              bg="white"
              borderRightWidth="1px"
              borderColor="line.strong"
              transition="box-shadow 150ms"
            >
              <Text fontSize="xs" lineHeight="xs" fontWeight={500} color="gray.500">
                {loading ? 'Personen' : `${count} ${count === 1 ? 'Person' : 'Personen'}`}
              </Text>
              <Text fontFamily="mono" fontSize="2xs" lineHeight="2xs" color="gray.400" aria-hidden>
                KW
              </Text>
            </Flex>
            <Box role="presentation" flexShrink={0} w={`${totalWidth}px`} position="relative">
              <Flex aria-hidden h={`${MONTH_BAND_HEIGHT}px`}>
                {segments.map((s, i) => {
                  const width = s.weekCount * columnWidth;
                  const [name] = s.label.split(' ');
                  const withYear = i === 0 || s.key.endsWith('-1');
                  return (
                    <Box
                      key={s.key}
                      w={`${width}px`}
                      flexShrink={0}
                      borderRightWidth="1px"
                      borderColor="line.strong"
                      position="relative"
                    >
                      <Text
                        position="sticky"
                        left={`${nameColumnWidth + 8}px`}
                        display="inline-block"
                        px={2}
                        lineHeight={`${MONTH_BAND_HEIGHT}px`}
                        fontSize="xs"
                        fontWeight={600}
                        color="gray.700"
                        whiteSpace="nowrap"
                      >
                        {width < 100 ? s.shortLabel : withYear ? s.label : name}
                      </Text>
                    </Box>
                  );
                })}
              </Flex>
              <Flex role="presentation" h={`${WEEK_ROW_HEIGHT}px`}>
                {weeks.map((w, i) => {
                  const current = i === currentWeekIndex;
                  const past = currentWeekIndex >= 0 ? i < currentWeekIndex : weeks[0].start < today;
                  const narrow = columnWidth < 80;
                  const changed = projection ? Object.values(projection.changed).some((set) => set.has(w.key)) : false;
                  return (
                    <Flex
                      key={w.key}
                      role="columnheader"
                      aria-label={`KW ${w.week}, ${formatDate(w.start)} bis ${formatDate(w.end)}${current ? ', aktuelle Woche' : ''}`}
                      aria-current={current ? 'date' : undefined}
                      data-week-key={w.key}
                      w={`${columnWidth}px`}
                      flexShrink={0}
                      direction={narrow ? 'column' : 'row'}
                      align={narrow ? 'flex-start' : 'center'}
                      justify={narrow ? 'center' : 'flex-start'}
                      gap={narrow ? 0 : 1.5}
                      px="6px"
                      position="relative"
                      bg={current ? 'board.currentWeekHead' : undefined}
                      borderTopWidth="1px"
                      borderTopColor="board.line"
                      borderRightWidth="1px"
                      borderRightColor="board.line"
                      boxShadow={
                        current
                          ? 'inset 0 -2px 0 var(--chakra-colors-accent-500)'
                          : changed
                            ? 'inset 0 -1px 0 var(--chakra-colors-accent-500)'
                            : undefined
                      }
                    >
                      <Text
                        fontFamily="mono"
                        fontSize="xs"
                        lineHeight={narrow ? '14px' : 'xs'}
                        fontWeight={current ? 600 : 500}
                        color={current ? 'accent.700' : past ? 'gray.400' : 'gray.700'}
                        whiteSpace="nowrap"
                      >
                        <Text as="span" srOnly>
                          KW{' '}
                        </Text>
                        {w.week}
                      </Text>
                      <Text
                        fontSize="2xs"
                        lineHeight="2xs"
                        color={current ? 'accent.700' : past ? 'gray.400' : 'gray.500'}
                        whiteSpace="nowrap"
                      >
                        {formatDayMonth(w.start)}
                      </Text>
                    </Flex>
                  );
                })}
              </Flex>
              {todayX !== null && (
                <Box
                  aria-hidden
                  data-testid="today-marker"
                  position="absolute"
                  bottom={0}
                  left={`${todayX - 4}px`}
                  w={0}
                  h={0}
                  borderLeft="4px solid transparent"
                  borderRight="4px solid transparent"
                  borderBottom="5px solid"
                  borderBottomColor="board.today"
                  pointerEvents="none"
                />
              )}
            </Box>
          </Flex>

          {/* Body */}
          <Box role="rowgroup" position="relative">
            {loading
              ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} index={i} nameColumnWidth={nameColumnWidth} totalWidth={totalWidth} metrics={metrics} />)
              : employees.map((e, i) => {
                  const layout = rowLayouts.get(e.id);
                  if (!layout) return null;
                  const projected = projection?.loads[e.id];
                  return (
                    <BoardRow
                      key={e.id}
                      employee={e}
                      rowIndex={i + 2}
                      layout={layout}
                      loads={projected ?? matrix[e.id] ?? EMPTY_LOADS}
                      baseLoads={projected ? matrix[e.id] : undefined}
                      weeks={weeks}
                      geometry={geometry}
                      metrics={metrics}
                      nameColumnWidth={nameColumnWidth}
                      compact={compact}
                      currentWeekIndex={currentWeekIndex}
                      todayX={todayX}
                      projectsById={projectsById}
                      highlightProjectId={highlightProjectId}
                      onAssignmentSelect={onAssignmentSelect}
                      expanded={expandedRows?.has(e.id) ?? false}
                      onToggleExpanded={onToggleExpanded}
                      projectedWeeks={projection?.changed[e.id]}
                      ghost={ghost?.employeeId === e.id ? ghost : undefined}
                      draggingAssignmentId={dragging?.employeeId === e.id ? dragging.assignmentId : undefined}
                    />
                  );
                })}
            {!loading && employees.length > 0 && currentWeekIndex !== 0 && (
              <Box
                aria-hidden
                data-testid="past-veil"
                position="absolute"
                top={0}
                bottom={0}
                left={`${nameColumnWidth}px`}
                w={`${(currentWeekIndex < 0 ? (weeks[0].start < today ? weeks.length : 0) : currentWeekIndex) * columnWidth}px`}
                bg="board.pastVeil"
                pointerEvents="none"
                // Over the heat, below the bars: a veiled half-label looked broken.
                zIndex={0}
              />
            )}
          </Box>
          {!loading && employees.length === 0 && empty && (
            <Box position="sticky" left={0} display="inline-block" maxW="520px">
              {empty}
            </Box>
          )}
        </Box>
      </Box>
      <Box
        aria-hidden
        data-edge-fade
        position="absolute"
        top={0}
        right="8px"
        bottom={footer ? `${FOOTER_HEIGHT + 8}px` : '8px'}
        w="24px"
        bgGradient="linear(to-l, white, rgba(255,255,255,0))"
        opacity={0}
        transition="opacity 150ms"
        pointerEvents="none"
        zIndex={5}
      />
      {footer && (
        <Flex
          as="footer"
          flexShrink={0}
          h={`${FOOTER_HEIGHT}px`}
          px={3}
          align="center"
          gap={4}
          borderTopWidth="1px"
          borderColor="line"
          bg="white"
          overflowX="auto"
          overflowY="hidden"
        >
          {footer}
        </Flex>
      )}
    </Flex>
  );
}

function SkeletonRow({ index, nameColumnWidth, totalWidth, metrics }: { index: number; nameColumnWidth: number; totalWidth: number; metrics: RowMetrics }) {
  const widths = [62, 44, 70, 36, 55, 48, 66, 40];
  return (
    <Flex role="row" h={`${metrics.headerStrip + metrics.barHeight + metrics.paddingBottom + metrics.laneGap * 2}px`} borderBottomWidth="1px" borderColor="line">
      <Flex
        role="rowheader"
        position="sticky"
        left={0}
        w={`${nameColumnWidth}px`}
        flexShrink={0}
        gap={2}
        pl={3}
        pt="8px"
        bg="white"
        borderRightWidth="1px"
        borderColor="line.strong"
      >
        <Skeleton boxSize="24px" borderRadius="full" startColor="gray.100" endColor="gray.200" />
        <Box>
          <Skeleton h="10px" w="120px" mt="3px" borderRadius="sm" startColor="gray.100" endColor="gray.200" />
          <Skeleton h="8px" w="80px" mt="8px" borderRadius="sm" startColor="gray.100" endColor="gray.200" />
        </Box>
      </Flex>
      <Box position="relative" w={`${totalWidth}px`} flexShrink={0}>
        <Box position="absolute" left="6px" top="6px" h="8px" w="18px" borderRadius="sm" bg="gray.100" />
        <Skeleton
          position="absolute"
          left="8px"
          top={`${metrics.headerStrip + 2}px`}
          h={`${metrics.barHeight}px`}
          w={`${widths[index % widths.length]}%`}
          borderRadius="sm"
          startColor="gray.100"
          endColor="gray.200"
        />
      </Box>
    </Flex>
  );
}
