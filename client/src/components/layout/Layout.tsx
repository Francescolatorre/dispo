import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export const Layout = () => (
  <Flex minH="100vh" bg="gray.50">
    <Navigation />
    <Box as="main" flex={1} minW={0} p={6}>
      <Outlet />
    </Box>
  </Flex>
);
