import { Box } from '@chakra-ui/react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Box display="flex">
      <Navigation />
      <Box
        as="main"
        role="main"
        flexGrow={1}
        p={4}
        width="100%"
        boxSizing="border-box"
      >
        {children}
      </Box>
    </Box>
  );
};
