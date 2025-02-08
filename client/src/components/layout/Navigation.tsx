import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Link,
  Button,
  useColorModeValue,
  Text,
  HStack,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Projects', path: '/projects', disabled: true },
  { label: 'Employees', path: '/employees', disabled: true },
  { label: 'Timeline', path: '/timeline', disabled: true },
];

export const Navigation: React.FC = () => {
  const { isAuthenticated, auth } = useAuth();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box
      as="nav"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      py={4}
      px={8}
      data-testid="main-navigation"
    >
      <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
        <HStack spacing={8}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              as={RouterLink}
              to={item.disabled ? '#' : item.path}
              color={isActive(item.path) ? 'blue.500' : 'gray.600'}
              fontWeight={isActive(item.path) ? 'semibold' : 'normal'}
              opacity={item.disabled ? 0.5 : 1}
              cursor={item.disabled ? 'not-allowed' : 'pointer'}
              _hover={{
                textDecoration: 'none',
                color: item.disabled ? 'gray.600' : 'blue.500',
              }}
              data-testid={`nav-${item.label.toLowerCase()}`}
              aria-disabled={item.disabled}
              className={isActive(item.path) ? 'nav-link-active' : 'nav-link'}
            >
              <Text>{item.label}</Text>
              {item.disabled && (
                <Text fontSize="xs" color="gray.500">
                  (Coming Soon)
                </Text>
              )}
            </Link>
          ))}
        </HStack>
        <Box>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              onClick={() => auth.logout()}
              colorScheme="blue"
              data-testid="logout-button"
            >
              Logout
            </Button>
          ) : (
            <Button
              as={RouterLink}
              to="/login"
              variant="solid"
              colorScheme="blue"
              data-testid="login-button"
            >
              Login
            </Button>
          )}
        </Box>
      </Flex>
    </Box>
  );
};
