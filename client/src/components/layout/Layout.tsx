import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export const Layout = () => (
  <Flex minH="100vh" bg="canvas">
    <Navigation />
    <Box as="main" flex={1} minW={0} px={{ base: 4, md: 6 }} pt={4} pb={6}>
      <Outlet />
    </Box>
  </Flex>
);
