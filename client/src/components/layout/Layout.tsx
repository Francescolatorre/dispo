import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Navigation />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};
