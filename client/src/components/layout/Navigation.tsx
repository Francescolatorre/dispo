import { Box, Link, Text, VStack } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Planung' },
  { to: '/people', label: 'Personen' },
  { to: '/projects', label: 'Projekte' },
] as const;

export const Navigation = () => (
  <Box
    as="nav"
    aria-label="Hauptnavigation"
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
  </Box>
);
