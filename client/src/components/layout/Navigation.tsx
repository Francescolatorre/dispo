import React from 'react';
import {
  Box,
  VStack,
  Link,
  Text,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  ViewIcon,
  TimeIcon,
  CalendarIcon,
  StarIcon,
  SettingsIcon,
} from '@chakra-ui/icons';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => (
  <Tooltip label={label} placement="right" hasArrow>
    <Link
      as={RouterLink}
      to={to}
      _hover={{ textDecoration: 'none' }}
      w="full"
      data-testid={`nav-${label.toLowerCase()}`}
    >
      <Box
        py={3}
        px={4}
        bg={isActive ? 'blue.500' : 'transparent'}
        color={isActive ? 'white' : 'gray.600'}
        _hover={{
          bg: isActive ? 'blue.600' : 'gray.100',
        }}
        borderRadius="md"
      >
        <Icon as={icon} boxSize={5} />
        <Text
          display={{ base: 'none', lg: 'block' }}
          ml={{ lg: 3 }}
          fontSize="sm"
        >
          {label}
        </Text>
      </Box>
    </Link>
  </Tooltip>
);

export const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: ViewIcon, label: 'Dashboard' },
    { to: '/projects', icon: StarIcon, label: 'Projects' },
    { to: '/employees', icon: SettingsIcon, label: 'Employees' },
    { to: '/reports', icon: TimeIcon, label: 'Reports' },
    { to: '/timeline-demo', icon: CalendarIcon, label: 'Timeline Demo' },
  ];

  return (
    <Box
      as="nav"
      data-testid="main-navigation"
      h="100vh"
      w={{ base: '16', lg: '64' }}
      py={5}
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      position="sticky"
      top={0}
    >
      <VStack spacing={2} align="stretch" px={2}>
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.to}
          />
        ))}
      </VStack>
    </Box>
  );
};

export default Navigation;
