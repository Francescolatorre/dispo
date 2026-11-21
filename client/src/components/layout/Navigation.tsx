import { Box, Flex, Link, Text, VStack } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { usePlanning } from '../../state';

const navItems = [
  { to: '/', label: 'Planung' },
  { to: '/people', label: 'Personen' },
  { to: '/projects', label: 'Projekte' },
] as const;

const SOURCE_LABEL = { api: 'Server', local: 'Lokal (Browser)' } as const;
const SOURCE_HINT = {
  api: 'Daten werden über die API in Postgres gespeichert',
  local: 'Daten liegen nur in diesem Browser (localStorage)',
} as const;

/** Unobtrusive footer hint showing the active data source (API vs. browser storage). */
const DataSourceIndicator = () => {
  const { dataSource } = usePlanning();
  if (!dataSource) return null;
  return (
    <Flex data-testid="data-source" align="center" gap={2} px={3} fontSize="xs" color="gray.500" title={SOURCE_HINT[dataSource]}>
      <Box as="span" w={2} h={2} borderRadius="full" bg={dataSource === 'api' ? 'green.400' : 'gray.400'} aria-hidden />
      Datenquelle: {SOURCE_LABEL[dataSource]}
    </Flex>
  );
};

export const Navigation = () => (
  <Flex
    as="nav"
    aria-label="Hauptnavigation"
    direction="column"
    w="48"
    flexShrink={0}
    h="100vh"
    position="sticky"
    top={0}
    bg="white"
    borderRightWidth="1px"
    borderColor="gray.200"
    py={5}
    px={3}
  >
    <Text fontWeight="bold" px={3} mb={6}>
      DispoMVP
    </Text>
    <VStack as="ul" listStyleType="none" spacing={1} align="stretch" m={0} p={0}>
      {navItems.map((item) => (
        <Box as="li" key={item.to}>
          <Link
            as={NavLink}
            to={item.to}
            end={item.to === '/'}
            display="block"
            px={3}
            py={2}
            borderRadius="md"
            fontSize="sm"
            fontWeight="medium"
            color="gray.700"
            _hover={{ bg: 'gray.100', textDecoration: 'none' }}
            _activeLink={{ bg: 'blue.500', color: 'white' }}
          >
            {item.label}
          </Link>
        </Box>
      ))}
    </VStack>
    <Box mt="auto" pt={4}>
      <DataSourceIndicator />
    </Box>
  </Flex>
);
