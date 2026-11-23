import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Switch,
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
import type { Employee, ISODate } from '../../domain/types';
import { usePlanning } from '../../state';
import { Avatar, EmptyState, Frame, ListSkeleton, LoadError, PageHeader } from '../shared/components';
import { formatCapacity, formatWeekKey, SENIORITY_LABELS } from '../shared/format';
import { BoardLinkIcon, PlusIcon, SearchIcon } from '../shared/icons';
import { PersonDrawer } from './PersonDrawer';
import {
  computeOutlook,
  DEFAULT_PEOPLE_FILTERS,
  filterEmployees,
  FREE_LOOKAHEAD_WEEKS,
  roleOptions,
  STRIP_WEEKS,
  type PeopleFilters,
  type PersonOutlook,
} from './peopleModel';
import { UtilizationStrip } from './UtilizationStrip';

export interface PeopleViewProps {
  /** Reference day (default: today); injectable for tests. */
  today?: ISODate;
}

/** `employee` is kept after closing so the drawer does not flicker during its exit animation. */
interface DrawerState {
  open: boolean;
  employee: Employee | null;
}

function Availability({ outlook, active }: { outlook: PersonOutlook; active: boolean }) {
  if (!active) {
    return (
      <Text fontSize="sm" color="gray.400">
        –
      </Text>
    );
  }
  const f = outlook.freeFrom;
  if (!f) {
    return (
      <Text fontSize="sm" color="gray.500">
        ausgebucht ({FREE_LOOKAHEAD_WEEKS} Wo.)
      </Text>
    );
  }
  return (
    <Text fontSize="sm" color={f.now ? 'load.free.fg' : 'gray.800'} fontWeight={f.now ? 500 : 400} whiteSpace="nowrap">
      {f.now ? 'frei ab sofort' : `frei ab ${formatWeekKey(f.weekKey)}`}
      <Text as="span" color="gray.500" fontFamily="mono" fontSize="xs">
        {' '}
        · {Math.round(f.freePercent)} %
      </Text>
    </Text>
  );
}

export function PeopleView({ today: todayProp }: PeopleViewProps) {
  const { employees, assignments, loading, error, reload } = usePlanning();
  const today = todayProp ?? todayISO();
  const [filters, setFilters] = useState<PeopleFilters>(DEFAULT_PEOPLE_FILTERS);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, employee: null });

  const roles = useMemo(() => roleOptions(employees), [employees]);
  const visible = useMemo(() => filterEmployees(employees, filters), [employees, filters]);
  const outlook = useMemo(() => computeOutlook(employees, assignments, today), [employees, assignments, today]);
  const assignmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assignments) counts.set(a.employeeId, (counts.get(a.employeeId) ?? 0) + 1);
    return counts;
  }, [assignments]);
  const stripWeeks = Object.values(outlook)[0]?.strip ?? [];
  const totalCount = filters.showInactive ? employees.length : employees.filter((e) => e.active).length;
  const filtered = Boolean(filters.search.trim() || filters.role);

  const openCreate = () => setDrawer({ open: true, employee: null });
  const addButton = (
    <Button leftIcon={<PlusIcon boxSize="14px" />} onClick={openCreate} aria-label="Person anlegen">
      Person
    </Button>
  );

  let content;
  if (error) {
    content = <LoadError error={error} onRetry={() => void reload()} />;
  } else if (loading) {
    content = <ListSkeleton label="Personen werden geladen" />;
  } else if (employees.length === 0) {
    content = (
      <Frame>
        <EmptyState
          title="Noch keine Personen"
          text="Lege die erste Person an, um sie im Board einplanen zu können."
          action={addButton}
        />
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
              placeholder="Name oder Rolle suchen"
              aria-label="Person suchen"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </InputGroup>
          <Select
            w="auto"
            minW="150px"
            aria-label="Rolle filtern"
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="">Alle Rollen</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <FormControl display="flex" alignItems="center" w="auto" ml={2}>
            <Switch
              id="people-show-inactive"
              size="sm"
              colorScheme="gray"
              isChecked={filters.showInactive}
              onChange={(e) => setFilters((f) => ({ ...f, showInactive: e.target.checked }))}
            />
            <FormLabel htmlFor="people-show-inactive" mb={0} ml={2} fontSize="sm" fontWeight={400} color="gray.700">
              Inaktive zeigen
            </FormLabel>
          </FormControl>
          <HStack spacing={3} ml="auto">
            <Text fontSize="xs" color="gray.500" data-testid="people-count" aria-live="polite">
              {visible.length} von {totalCount} Personen
            </Text>
            {filtered && (
              <Button variant="ghost" color="accent.600" onClick={() => setFilters((f) => ({ ...DEFAULT_PEOPLE_FILTERS, showInactive: f.showInactive }))}>
                Filter zurücksetzen
              </Button>
            )}
          </HStack>
        </Flex>

        <Frame overflowX="auto">
          {visible.length === 0 ? (
            <EmptyState
              title="Keine Personen gefunden"
              text="Passe Suche oder Rollenfilter an."
              action={
                <Button variant="outline" onClick={() => setFilters(DEFAULT_PEOPLE_FILTERS)}>
                  Filter zurücksetzen
                </Button>
              }
            />
          ) : (
            <Table size="md" aria-label="Personen">
              <Thead position="sticky" top={0} zIndex={1}>
                <Tr>
                  <Th>Person</Th>
                  <Th isNumeric>Kapazität</Th>
                  <Th>
                    Auslastung {stripWeeks.length > 0 && `${formatWeekKey(stripWeeks[0].weekKey)} – ${formatWeekKey(stripWeeks[stripWeeks.length - 1].weekKey)}`}
                    <Text as="span" srOnly>
                      {' '}
                      (nächste {STRIP_WEEKS} Wochen)
                    </Text>
                  </Th>
                  <Th>Verfügbar</Th>
                  <Th>Status</Th>
                  <Th isNumeric>Einsätze</Th>
                  <Th w="56px">
                    <Text as="span" srOnly>
                      Aktionen
                    </Text>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {visible.map((e) => (
                  <Tr
                    key={e.id}
                    data-employee-id={e.id}
                    cursor="pointer"
                    transition="background 100ms"
                    _hover={{ bg: 'rgba(21,24,32,0.03)' }}
                    bg={drawer.open && drawer.employee?.id === e.id ? 'accent.50' : undefined}
                    onClick={() => setDrawer({ open: true, employee: e })}
                  >
                    <Td py={1.5}>
                      <HStack spacing={2.5}>
                        <Avatar name={e.name} muted={!e.active} />
                        <Box minW={0}>
                          <Button
                            variant="link"
                            color={e.active ? 'gray.900' : 'gray.500'}
                            fontWeight={600}
                            fontSize="sm"
                            aria-label={`${e.name} bearbeiten`}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setDrawer({ open: true, employee: e });
                            }}
                          >
                            {e.name}
                          </Button>
                          <Text fontSize="xs" color="gray.500">
                            {e.role} · {SENIORITY_LABELS[e.seniority]}
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td isNumeric>
                      <Text as="span" fontFamily="mono" fontSize="sm" color={e.capacity < 1 ? 'gray.900' : 'gray.500'}>
                        {formatCapacity(e.capacity)}
                      </Text>
                    </Td>
                    <Td>{outlook[e.id] && <UtilizationStrip loads={outlook[e.id].strip} name={e.name} />}</Td>
                    <Td>{outlook[e.id] && <Availability outlook={outlook[e.id]} active={e.active} />}</Td>
                    <Td>
                      <HStack spacing={1.5}>
                        <Box
                          boxSize="6px"
                          borderRadius="full"
                          bg={e.active ? 'gray.700' : 'transparent'}
                          borderWidth="1px"
                          borderColor={e.active ? 'gray.700' : 'gray.400'}
                        />
                        <Text fontSize="sm" color={e.active ? 'gray.700' : 'gray.500'}>
                          {e.active ? 'Aktiv' : 'inaktiv'}
                        </Text>
                      </HStack>
                    </Td>
                    <Td isNumeric>
                      <Text as="span" fontFamily="mono" fontSize="sm" color="gray.600">
                        {assignmentCounts.get(e.id) ?? 0}
                      </Text>
                    </Td>
                    <Td py={0} pr={2}>
                      {e.active && (
                        <Tooltip label="Im Board zeigen" openDelay={400}>
                          <IconButton
                            as={RouterLink}
                            to={`/?q=${encodeURIComponent(e.name)}`}
                            aria-label={`${e.name} im Board zeigen`}
                            icon={<BoardLinkIcon boxSize="16px" />}
                            variant="ghost"
                            color="gray.500"
                            onClick={(ev) => ev.stopPropagation()}
                          />
                        </Tooltip>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Frame>
      </>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Personen"
        subtitle="Wer arbeitet wie viel?"
        action={!loading && !error && employees.length > 0 ? addButton : undefined}
      />
      {content}
      <PersonDrawer
        isOpen={drawer.open}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
        employee={drawer.employee}
        roles={roles}
      />
    </Box>
  );
}
