import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
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
  Tr,
} from '@chakra-ui/react';
import { todayISO } from '../../domain/dates';
import { PROJECT_STATUSES, type ISODate, type Project, type ProjectStatus } from '../../domain/types';
import { usePlanning } from '../../state';
import { EmptyState, ListSkeleton, LoadError, PageHeader } from '../shared/components';
import { formatDate, formatFte, PROJECT_STATUS_LABELS } from '../shared/format';
import { PlusIcon, SearchIcon } from '../shared/icons';
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

const STATUS_BADGE: Record<ProjectStatus, { scheme: string; variant: string }> = {
  active: { scheme: 'blue', variant: 'subtle' },
  planned: { scheme: 'gray', variant: 'outline' },
  done: { scheme: 'gray', variant: 'subtle' },
};

function TimelineBar({ project, axis, today }: { project: Project; axis: TimelineWindow; today: ISODate }) {
  const bar = timelinePosition(axis, project.start, project.end);
  const marker = timelinePosition(axis, today, today);
  return (
    <Box position="relative" h="8px" w="180px" bg="gray.100" borderRadius="full" aria-hidden data-testid="timeline-bar">
      <Box
        position="absolute"
        top={0}
        bottom={0}
        left={`${bar.left}%`}
        w={`${bar.width}%`}
        minW="3px"
        bg={`${project.color}.300`}
        borderRadius="full"
        opacity={project.status === 'done' ? 0.5 : 1}
      />
      <Box position="absolute" top="-3px" bottom="-3px" left={`${marker.left}%`} w="2px" bg="blue.500" borderRadius="full" />
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
    <Button leftIcon={<PlusIcon boxSize={3.5} />} size="sm" onClick={() => open(null)} aria-label="Projekt anlegen">
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
      <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg">
        <EmptyState title="Noch keine Projekte" text="Lege das erste Projekt an, um Personen darauf einzuplanen." action={addButton} />
      </Box>
    );
  } else {
    content = (
      <>
        <Flex gap={3} align="center" wrap="wrap" mb={4}>
          <InputGroup size="sm" w={{ base: 'full', md: '240px' }}>
            <InputLeftElement pointerEvents="none" color="gray.400">
              <SearchIcon boxSize={3.5} />
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
            size="sm"
            w="auto"
            minW="160px"
            bg="white"
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
            <Text fontSize="sm" color="gray.500" data-testid="projects-count" aria-live="polite">
              {visible.length} von {projects.length} Projekten
            </Text>
            {filtered && (
              <Button size="sm" variant="ghost" colorScheme="gray" onClick={() => setFilters(DEFAULT_PROJECT_FILTERS)}>
                Filter zurücksetzen
              </Button>
            )}
          </HStack>
        </Flex>

        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflowX="auto">
          {visible.length === 0 ? (
            <EmptyState
              title="Keine Projekte gefunden"
              text="Passe Suche oder Statusfilter an."
              action={
                <Button size="sm" variant="outline" colorScheme="gray" onClick={() => setFilters(DEFAULT_PROJECT_FILTERS)}>
                  Filter zurücksetzen
                </Button>
              }
            />
          ) : (
            <Table size="sm" aria-label="Projekte">
              <Thead>
                <Tr>
                  <Th py={3} color="gray.500">Projekt</Th>
                  <Th py={3} color="gray.500">Status</Th>
                  <Th py={3} color="gray.500">Laufzeit</Th>
                  <Th py={3} color="gray.500">
                    Zeitachse
                    <Text as="span" srOnly>
                      {' '}
                      ({formatDate(axis.from)} – {formatDate(axis.to)}, Linie = heute)
                    </Text>
                  </Th>
                  <Th py={3} color="gray.500" isNumeric>Personen</Th>
                  <Th py={3} color="gray.500" isNumeric title="Eingeplante Vollzeitäquivalente in der aktuellen Woche">
                    FTE diese Woche
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {visible.map((p) => {
                  const s = stats[p.id];
                  return (
                    <Tr key={p.id} data-project-id={p.id} cursor="pointer" _hover={{ bg: 'gray.50' }} onClick={() => open(p)}>
                      <Td py={3} borderColor="gray.100">
                        <HStack spacing={2.5}>
                          <Box w="10px" h="10px" borderRadius="full" bg={`${p.color}.400`} flexShrink={0} aria-hidden data-testid="color-dot" data-color={p.color} />
                          <Button
                            variant="link"
                            colorScheme="gray"
                            color="gray.800"
                            fontWeight="semibold"
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
                      <Td py={3} borderColor="gray.100">
                        <Badge colorScheme={STATUS_BADGE[p.status].scheme} variant={STATUS_BADGE[p.status].variant} fontSize="10px">
                          {PROJECT_STATUS_LABELS[p.status]}
                        </Badge>
                      </Td>
                      <Td py={3} borderColor="gray.100" whiteSpace="nowrap">
                        <Text fontSize="sm" color="gray.700">
                          {formatDate(p.start)} – {formatDate(p.end)}
                        </Text>
                      </Td>
                      <Td py={3} borderColor="gray.100">
                        <TimelineBar project={p} axis={axis} today={today} />
                      </Td>
                      <Td py={3} borderColor="gray.100" isNumeric>
                        <Text as="span" fontSize="sm" color="gray.700">
                          {s.people}
                        </Text>
                      </Td>
                      <Td py={3} borderColor="gray.100" isNumeric>
                        <Text as="span" fontSize="sm" color={s.currentFte > 0 ? 'gray.700' : 'gray.400'} data-testid="current-fte">
                          {formatFte(s.currentFte)}
                        </Text>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </Box>
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
