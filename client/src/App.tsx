import React from 'react';
import {
  ChakraProvider,
  Box,
  Flex,
  VStack,
} from '@chakra-ui/react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Navigation } from './components/layout/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Employees } from './pages/Employees';
import { Reports } from './pages/Reports';
import TimelineDemo from './pages/TimelineDemo';

interface AppProps {
  withRouter?: boolean;
}

const App: React.FC<AppProps> = ({ withRouter = true }) => {
  const content = (
    <Flex minH="100vh">
      <Navigation />
      <Box flex={1} p={8} bg="gray.50">
        <VStack spacing={8} align="stretch">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/timeline-demo" element={<TimelineDemo />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </VStack>
      </Box>
    </Flex>
  );

  if (!withRouter) {
    return <ChakraProvider>{content}</ChakraProvider>;
  }

  return (
    <ChakraProvider>
      <Router>
        {content}
      </Router>
    </ChakraProvider>
  );
};

export default App;
