import { memo } from 'react';
import { Badge, Box, Flex, HStack, Text, Tooltip } from '@chakra-ui/react';
import type { WeekRef } from '../../domain/dates';
import type { Employee, Project, WeekKey } from '../../domain/types';
import type { WeekLoad } from '../../domain/workload';
import { formatDate, formatPercent, SENIORITY_LABELS, STATUS_LABELS } from './boardModel';
import { AlertIcon } from './icons';
import type { BarLayout, BoardGeometry, RowLayout } from './layout';

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
}

function cellLabel(employee: Employee, week: WeekRef, load: WeekLoad | undefined): string {
  if (!load) return `${employee.name}, KW ${week.week}`;
  const base = `${employee.name}, KW ${week.week}: ${formatPercent(load.utilization)} ausgelastet, ${STATUS_LABELS[load.status]}`;
  return load.status === 'ok' || load.status === 'warning' ? `${base}, ${Math.round(load.freePercent)} % frei` : base;
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
      <Text as="span" fontSize="11px" fontWeight={over || load.status === 'warning' ? 'bold' : 'medium'} sx={{ fontVariantNumeric: 'tabular-nums' }}>
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
  onSelect?: (assignmentId: string) => void;
}

const AssignmentBar = ({ bar, project, employee, dimmed, onSelect }: BarProps) => {
  const a = bar.assignment;
  const name = project?.name ?? 'Unbekanntes Projekt';
  const color = project?.color ?? 'gray';
  const label = `${name} · ${a.allocation} %`;
  const period = `${formatDate(a.start)} – ${formatDate(a.end)}`;
  const aria = `${employee.name}: ${name}, ${a.allocation} %, ${formatDate(a.start)} bis ${formatDate(a.end)}${a.role ? `, Rolle ${a.role}` : ''}`;
  return (
    <Tooltip
      hasArrow
      openDelay={300}
      placement="top"
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
        opacity={dimmed ? 0.28 : 1}
        cursor="pointer"
        transition="background 120ms, opacity 160ms"
        _hover={{ bg: `${color}.200` }}
        _focusVisible={{ outline: '2px solid', outlineColor: 'blue.500', outlineOffset: '1px', zIndex: 2 }}
      >
        <Text as="span" fontSize="xs" fontWeight="medium" noOfLines={1} wordBreak="break-all">
          {label}
        </Text>
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

      <Box role="presentation" position="relative" flexShrink={0} w={`${geometry.totalWidth}px`} h="full" display="flex">
        {weeks.map((week, i) => {
          const load = loads?.[week.key];
          const status = load?.status ?? 'free';
          return (
            <Box
              key={week.key}
              role="gridcell"
              aria-label={cellLabel(employee, week, load)}
              data-employee-id={employee.id}
              data-week-key={week.key}
              data-status={status}
              flexShrink={0}
              w={`${columnWidth}px`}
              h="full"
              bg={`load.${status}.bg`}
              borderRightWidth="1px"
              borderColor="board.line"
              boxShadow={i === currentWeekIndex ? 'inset 2px 0 0 var(--chakra-colors-blue-200), inset -2px 0 0 var(--chakra-colors-blue-200)' : undefined}
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
                  onSelect={onAssignmentSelect}
                />
              ))}
            </Box>
          );
        })}
      </Box>
    </Flex>
  );
});
