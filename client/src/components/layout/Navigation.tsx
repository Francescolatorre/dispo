import type { ReactNode } from 'react';
import {
  Box,
  Flex,
  Link,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  Tooltip,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { BoardIcon, FolderIcon, UsersIcon } from '../../features/board/icons';
import { usePlanning } from '../../state';

const navItems = [
  { to: '/', label: 'Planung', icon: BoardIcon },
  { to: '/people', label: 'Personen', icon: UsersIcon },
  { to: '/projects', label: 'Projekte', icon: FolderIcon },
] as const;

const SOURCE = {
  local: { label: 'Lokale Daten', sub: 'Nur in diesem Browser', detail: 'Daten liegen im localStorage dieses Browsers.' },
  api: { label: 'Server', sub: 'verbunden · Postgres', detail: 'Daten werden über die API in Postgres gespeichert.' },
} as const;

/** Brand mark: three lanes in an ink square, the middle one in accent. */
const BrandMark = () => (
  <Box as="svg" viewBox="0 0 24 24" boxSize="24px" flexShrink={0} aria-hidden>
    <rect width="24" height="24" rx="6" fill="#151820" />
    <rect x="5" y="6.5" width="11" height="2.5" rx="1.25" fill="#fff" />
    <rect x="8" y="10.75" width="11" height="2.5" rx="1.25" fill="#6F92EE" />
    <rect x="5" y="15" width="8" height="2.5" rx="1.25" fill="#fff" />
  </Box>
);

/** Data-source status at the bottom of the sidebar; opens a popover with details and the data summary. */
const DataSourceIndicator = ({ collapsed }: { collapsed: boolean }) => {
  const { dataSource, employees, projects, assignments, loading } = usePlanning();
  if (!dataSource) return null;
  const s = SOURCE[dataSource];
  return (
    <Popover placement="right-end" gutter={12}>
      <PopoverTrigger>
        <Box
          as="button"
          type="button"
          data-testid="data-source"
          aria-label={`Datenquelle: ${s.label}`}
          display="flex"
          alignItems="center"
          gap={2.5}
          w="full"
          px={collapsed ? 0 : 2.5}
          py={1.5}
          justifyContent={collapsed ? 'center' : 'flex-start'}
          borderRadius="md"
          textAlign="left"
          _hover={{ bg: 'rgba(21,24,32,0.06)' }}
          _focusVisible={{ boxShadow: 'outline' }}
        >
          <Box
            as="span"
            flexShrink={0}
            boxSize="8px"
            borderRadius="full"
            aria-hidden
            bg={dataSource === 'api' ? 'accent.500' : 'transparent'}
            borderWidth={dataSource === 'api' ? 0 : '1.5px'}
            borderColor="gray.400"
          />
          {!collapsed && (
            <Box minW={0}>
              <Text fontSize="xs" lineHeight="xs" fontWeight={500} color="gray.800">
                {s.label}
              </Text>
              <Text fontSize="2xs" lineHeight="2xs" color="gray.500">
                {s.sub}
              </Text>
            </Box>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent w="260px" borderColor="line" boxShadow="md" borderRadius="lg" _focusVisible={{ boxShadow: 'md' }}>
        <PopoverBody px={4} py={3}>
          <Text fontSize="sm" fontWeight={600} color="gray.900">
            Datenquelle: {s.label}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={0.5}>
            {s.detail}
          </Text>
          {!loading && (
            <Text data-testid="planning-summary" fontSize="xs" color="gray.700" mt={2}>
              {employees.length} Personen · {projects.length} Projekte · {assignments.length} Einsätze
            </Text>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export interface NavigationProps {
  /** Optional extra status lines under the data-source indicator (e.g. "KI-Werkzeuge aktiv"). */
  footer?: ReactNode;
}

export const Navigation = ({ footer }: NavigationProps) => {
  // Below 1280 px the sidebar collapses to a 56 px icon rail.
  const collapsed = useBreakpointValue({ base: true, xl: false }, { ssr: false }) ?? false;
  return (
    <Flex
      as="nav"
      aria-label="Hauptnavigation"
      direction="column"
      w={collapsed ? '56px' : '216px'}
      flexShrink={0}
      h="100vh"
      position="sticky"
      top={0}
      bg="canvas"
      px={collapsed ? 2 : 3}
      pb={3}
    >
      <Flex h="56px" align="center" gap={2.5} px={collapsed ? 1 : 1.5} flexShrink={0}>
        <BrandMark />
        {!collapsed && (
          <>
            <Text fontSize="15px" fontWeight={600} color="gray.900" letterSpacing="-0.01em">
              Dispo
            </Text>
            <Text as="span" fontSize="10px" fontWeight={600} color="gray.600" bg="gray.200" px={1} borderRadius="sm" lineHeight="16px">
              MVP
            </Text>
          </>
        )}
      </Flex>
      <VStack as="ul" listStyleType="none" spacing={0.5} align="stretch" m={0} p={0} mt={2}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Box as="li" key={item.to}>
              <Tooltip label={item.label} placement="right" isDisabled={!collapsed} openDelay={300}>
                <Link
                  as={NavLink}
                  to={item.to}
                  end={item.to === '/'}
                  display="flex"
                  alignItems="center"
                  justifyContent={collapsed ? 'center' : 'flex-start'}
                  gap={2.5}
                  h="32px"
                  px={collapsed ? 0 : 2.5}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight={500}
                  color="gray.700"
                  transition="background 100ms"
                  sx={{ '& > svg': { color: 'gray.500' } }}
                  _hover={{ bg: 'rgba(21,24,32,0.06)', textDecoration: 'none' }}
                  _focusVisible={{ boxShadow: 'outline' }}
                  _activeLink={{
                    bg: 'white',
                    boxShadow: 'xs',
                    color: 'gray.900',
                    fontWeight: 600,
                    '& > svg': { color: 'accent.500' },
                  }}
                >
                  <Icon boxSize="16px" />
                  <Text as="span" srOnly={collapsed || undefined}>
                    {item.label}
                  </Text>
                </Link>
              </Tooltip>
            </Box>
          );
        })}
      </VStack>
      <Box mt="auto" pt={4}>
        <DataSourceIndicator collapsed={collapsed} />
        {footer}
        {!collapsed && (
          <Text fontSize="2xs" color="gray.400" px={2.5} mt={1.5}>
            v0.1 · MVP
          </Text>
        )}
      </Box>
    </Flex>
  );
};
