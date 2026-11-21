import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
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
  Tr,
} from '@chakra-ui/react';
import { todayISO } from '../../domain/dates';
import type { Employee, ISODate } from '../../domain/types';
import { usePlanning } from '../../state';
import { EmptyState, ListSkeleton, LoadError, PageHeader } from '../shared/components';
import { formatCapacity, formatWeekKey, SENIORITY_LABELS } from '../shared/format';
import { PlusIcon, SearchIcon } from '../shared/icons';
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
    <Text fontSize="sm" color={f.now ? 'green.700' : 'gray.700'} whiteSpace="nowrap">
      {f.now ? 'frei ab sofort' : `frei ab ${formatWeekKey(f.weekKey)}`}
      <Text as="span" color="gray.500">
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
    <Button leftIcon={<PlusIcon boxSize={3.5} />} size="sm" onClick={openCreate} aria-label="Person anlegen">
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
      <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg">
        <EmptyState
          title="Noch keine Personen"
          text="Lege die erste Person an, um sie im Board einplanen zu können."
          action={addButton}
        />
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
              placeholder="Name oder Rolle suchen"
              aria-label="Person suchen"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </InputGroup>
          <Select
            size="sm"
            w="auto"
            minW="150px"
            bg="white"
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
          <FormControl display="flex" alignItems="center" w="auto">
            <Switch
              id="people-show-inactive"
              size="sm"
              colorScheme="gray"
              isChecked={filters.showInactive}
              onChange={(e) => setFilters((f) => ({ ...f, showInactive: e.target.checked }))}
            />
            <FormLabel htmlFor="people-show-inactive" mb={0} ml={2} fontSize="sm" fontWeight="normal">
              Inaktive zeigen
            </FormLabel>
          </FormControl>
          <HStack spacing={3} ml="auto">
            <Text fontSize="sm" color="gray.500" data-testid="people-count" aria-live="polite">
              {visible.length} von {totalCount} Personen
            </Text>
            {filtered && (
              <Button size="sm" variant="ghost" colorScheme="gray" onClick={() => setFilters((f) => ({ ...DEFAULT_PEOPLE_FILTERS, showInactive: f.showInactive }))}>
                Filter zurücksetzen
              </Button>
            )}
          </HStack>
        </Flex>

        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflowX="auto">
          {visible.length === 0 ? (
            <EmptyState
              title="Keine Personen gefunden"
              text="Passe Suche oder Rollenfilter an."
              action={
                <Button size="sm" variant="outline" colorScheme="gray" onClick={() => setFilters(DEFAULT_PEOPLE_FILTERS)}>
                  Filter zurücksetzen
                </Button>
              }
            />
          ) : (
            <Table size="sm" aria-label="Personen">
              <Thead>
                <Tr>
                  <Th py={3} color="gray.500">Person</Th>
                  <Th py={3} color="gray.500" isNumeric>Kapazität</Th>
                  <Th py={3} color="gray.500">
                    Auslastung {stripWeeks.length > 0 && `${formatWeekKey(stripWeeks[0].weekKey)} – ${formatWeekKey(stripWeeks[stripWeeks.length - 1].weekKey)}`}
                    <Text as="span" srOnly>
                      {' '}
                      (nächste {STRIP_WEEKS} Wochen)
                    </Text>
                  </Th>
                  <Th py={3} color="gray.500">Verfügbar</Th>
                  <Th py={3} color="gray.500">Status</Th>
                  <Th py={3} color="gray.500" isNumeric>Einsätze</Th>
                </Tr>
              </Thead>
              <Tbody>
                {visible.map((e) => (
                  <Tr
                    key={e.id}
                    data-employee-id={e.id}
                    cursor="pointer"
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => setDrawer({ open: true, employee: e })}
                    opacity={e.active ? 1 : 0.6}
                  >
                    <Td py={2.5} borderColor="gray.100">
                      <Button
                        variant="link"
                        colorScheme="gray"
                        color="gray.800"
                        fontWeight="semibold"
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
                    </Td>
                    <Td py={2.5} borderColor="gray.100" isNumeric>
                      {e.capacity < 1 ? (
                        <Badge colorScheme="purple" variant="subtle" fontSize="11px">
                          {formatCapacity(e.capacity)}
                        </Badge>
                      ) : (
                        <Text as="span" fontSize="sm" color="gray.600">
                          {formatCapacity(e.capacity)}
                        </Text>
                      )}
                    </Td>
                    <Td py={2.5} borderColor="gray.100">
                      {outlook[e.id] && <UtilizationStrip loads={outlook[e.id].strip} name={e.name} />}
                    </Td>
                    <Td py={2.5} borderColor="gray.100">
                      {outlook[e.id] && <Availability outlook={outlook[e.id]} active={e.active} />}
                    </Td>
                    <Td py={2.5} borderColor="gray.100">
                      {e.active ? (
                        <Text fontSize="sm" color="gray.600">Aktiv</Text>
                      ) : (
                        <Badge variant="outline" colorScheme="gray" fontSize="10px">
                          inaktiv
                        </Badge>
                      )}
                    </Td>
                    <Td py={2.5} borderColor="gray.100" isNumeric>
                      <Text as="span" fontSize="sm" color="gray.600">
                        {assignmentCounts.get(e.id) ?? 0}
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
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
