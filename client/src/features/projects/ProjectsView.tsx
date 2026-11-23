import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { todayISO } from '../../domain/dates';
import { projectColorTokens } from '../../domain/projectColors';
import { PROJECT_STATUSES, type ISODate, type Project, type ProjectStatus } from '../../domain/types';
import { usePlanning } from '../../state';
import { EmptyState, Frame, ListSkeleton, LoadError, PageHeader } from '../shared/components';
import { formatDate, formatFte, PROJECT_STATUS_LABELS } from '../shared/format';
import { BoardLinkIcon, PlusIcon, SearchIcon } from '../shared/icons';
import { ProjectDrawer } from './ProjectDrawer';
import {
  computeProjectStats,
  DEFAULT_PROJECT_FILTERS,
  filterProjects,
  timelinePosition,
  timelineWindow,
  type ProjectFilters,
  type TimelineWindow,
} from './projectsModel';

export interface ProjectsViewProps {
  /** Reference day (default: today); injectable for tests. */
  today?: ISODate;
}

interface DrawerState {
  open: boolean;
  project: Project | null;
}

/** Neutral status tags (colour is reserved for workload and project identity). */
const STATUS_TAG: Record<ProjectStatus, { dot: string; dotBorder: string; text: string }> = {
  active: { dot: 'gray.700', dotBorder: 'gray.700', text: 'gray.800' },
  planned: { dot: 'transparent', dotBorder: 'gray.500', text: 'gray.700' },
  done: { dot: 'gray.300', dotBorder: 'gray.300', text: 'gray.500' },
};

function TimelineBar({ project, axis, today }: { project: Project; axis: TimelineWindow; today: ISODate }) {
  const bar = timelinePosition(axis, project.start, project.end);
  const marker = timelinePosition(axis, today, today);
  return (
    <Box position="relative" h="6px" w="180px" bg="gray.100" borderRadius="sm" aria-hidden data-testid="timeline-bar">
      <Box
        position="absolute"
        top={0}
        bottom={0}
        left={`${bar.left}%`}
        w={`${bar.width}%`}
        minW="3px"
        bg={projectColorTokens(project.color).edge}
        borderRadius="sm"
        opacity={project.status === 'done' ? 0.35 : 1}
      />
      <Box position="absolute" top="-4px" bottom="-4px" left={`${marker.left}%`} w="1px" bg="board.today" />
    </Box>
  );
}

export function ProjectsView({ today: todayProp }: ProjectsViewProps) {
  const { projects, assignments, loading, error, reload } = usePlanning();
  const today = todayProp ?? todayISO();
  const [filters, setFilters] = useState<ProjectFilters>(DEFAULT_PROJECT_FILTERS);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, project: null });

  const visible = useMemo(() => filterProjects(projects, filters), [projects, filters]);
  const stats = useMemo(() => computeProjectStats(projects, assignments, today), [projects, assignments, today]);
  const axis = useMemo(() => timelineWindow(projects, today), [projects, today]);
  const filtered = Boolean(filters.search.trim() || filters.status);

  const open = (project: Project | null) => setDrawer({ open: true, project });
  const addButton = (
    <Button leftIcon={<PlusIcon boxSize="14px" />} onClick={() => open(null)} aria-label="Projekt anlegen">
      Projekt
    </Button>
  );

  let content;
  if (error) {
    content = <LoadError error={error} onRetry={() => void reload()} />;
  } else if (loading) {
    content = <ListSkeleton label="Projekte werden geladen" />;
  } else if (projects.length === 0) {
    content = (
      <Frame>
        <EmptyState title="Noch keine Projekte" text="Lege das erste Projekt an, um Personen darauf einzuplanen." action={addButton} />
      </Frame>
    );
  } else {
    content = (
      <>
        <Flex gap={2} align="center" wrap="wrap" mb={3}>
          <InputGroup w={{ base: 'full', md: '240px' }}>
            <InputLeftElement pointerEvents="none" color="gray.500" h="32px">
              <SearchIcon boxSize="14px" />
            </InputLeftElement>
            <Input
              type="search"
              bg="white"
              placeholder="Projekt suchen"
              aria-label="Projekt suchen"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </InputGroup>
          <Select
            w="auto"
            minW="160px"
            aria-label="Status filtern"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as ProjectFilters['status'] }))}
          >
            <option value="">Alle Status</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <HStack spacing={3} ml="auto">
            <Text fontSize="xs" color="gray.500" data-testid="projects-count" aria-live="polite">
              {visible.length} von {projects.length} Projekten
            </Text>
            {filtered && (
              <Button variant="ghost" color="accent.600" onClick={() => setFilters(DEFAULT_PROJECT_FILTERS)}>
                Filter zurücksetzen
              </Button>
            )}
          </HStack>
        </Flex>

        <Frame overflowX="auto">
          {visible.length === 0 ? (
            <EmptyState
              title="Keine Projekte gefunden"
              text="Passe Suche oder Statusfilter an."
              action={
                <Button variant="outline" onClick={() => setFilters(DEFAULT_PROJECT_FILTERS)}>
                  Filter zurücksetzen
                </Button>
              }
            />
          ) : (
            <Table size="md" aria-label="Projekte">
              <Thead position="sticky" top={0} zIndex={1}>
                <Tr>
                  <Th>Projekt</Th>
                  <Th>Status</Th>
                  <Th>Laufzeit</Th>
                  <Th>
                    Zeitachse
                    <Text as="span" srOnly>
                      {' '}
                      ({formatDate(axis.from)} – {formatDate(axis.to)}, Linie = heute)
                    </Text>
                  </Th>
                  <Th isNumeric>Personen</Th>
                  <Th isNumeric title="Eingeplante Vollzeitäquivalente in der aktuellen Woche">
                    FTE diese Woche
                  </Th>
                  <Th w="56px">
                    <Text as="span" srOnly>
                      Aktionen
                    </Text>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {visible.map((p) => {
                  const s = stats[p.id];
                  const tag = STATUS_TAG[p.status];
                  return (
                    <Tr
                      key={p.id}
                      data-project-id={p.id}
                      cursor="pointer"
                      transition="background 100ms"
                      _hover={{ bg: 'rgba(21,24,32,0.03)' }}
                      bg={drawer.open && drawer.project?.id === p.id ? 'accent.50' : undefined}
                      onClick={() => open(p)}
                    >
                      <Td>
                        <HStack spacing={2.5}>
                          <Box
                            w="10px"
                            h="10px"
                            borderRadius="full"
                            bg={projectColorTokens(p.color).edge}
                            flexShrink={0}
                            aria-hidden
                            data-testid="color-dot"
                            data-color={p.color}
                          />
                          <Button
                            variant="link"
                            color={p.status === 'done' ? 'gray.500' : 'gray.900'}
                            fontWeight={600}
                            fontSize="sm"
                            aria-label={`${p.name} bearbeiten`}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              open(p);
                            }}
                          >
                            {p.name}
                          </Button>
                        </HStack>
                      </Td>
                      <Td>
                        <HStack spacing={1.5}>
                          <Box boxSize="6px" borderRadius="full" bg={tag.dot} borderWidth="1px" borderColor={tag.dotBorder} />
                          <Text fontSize="sm" color={tag.text}>
                            {PROJECT_STATUS_LABELS[p.status]}
                          </Text>
                        </HStack>
                      </Td>
                      <Td whiteSpace="nowrap">
                        <Text fontSize="xs" fontFamily="mono" color="gray.700">
                          {formatDate(p.start)} – {formatDate(p.end)}
                        </Text>
                      </Td>
                      <Td>
                        <TimelineBar project={p} axis={axis} today={today} />
                      </Td>
                      <Td isNumeric>
                        <Text as="span" fontFamily="mono" fontSize="sm" color="gray.700">
                          {s.people}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text as="span" fontFamily="mono" fontSize="sm" color={s.currentFte > 0 ? 'gray.700' : 'gray.400'} data-testid="current-fte">
                          {formatFte(s.currentFte)}
                        </Text>
                      </Td>
                      <Td py={0} pr={2}>
                        <Tooltip label="Im Board zeigen" openDelay={400}>
                          <IconButton
                            as={RouterLink}
                            to={`/?project=${encodeURIComponent(p.id)}`}
                            aria-label={`${p.name} im Board zeigen`}
                            icon={<BoardLinkIcon boxSize="16px" />}
                            variant="ghost"
                            color="gray.500"
                            onClick={(ev) => ev.stopPropagation()}
                          />
                        </Tooltip>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </Frame>
      </>
    );
  }

  return (
    <Box>
      <PageHeader title="Projekte" subtitle="Was läuft wann – und wie stark besetzt?" action={!loading && !error && projects.length > 0 ? addButton : undefined} />
      {content}
      <ProjectDrawer
        isOpen={drawer.open}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
        project={drawer.project}
        today={today}
      />
    </Box>
  );
}
