import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/layout/Navigation';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChakraProvider>
          <Router>
            <div className="App">
              <Navigation />
              <main>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Dashboard />} />

                  {/* Placeholder routes - will be implemented in later phases */}
                  <Route path="/projects" element={
                    <Navigate to="/" replace />
                  } />
                  <Route path="/employees" element={
                    <Navigate to="/" replace />
                  } />
                  <Route path="/timeline" element={
                    <Navigate to="/" replace />
                  } />

                  {/* Catch all route */}
                  <Route path="*" element={
                    <Navigate to="/" replace />
                  } />
                </Routes>
              </main>
            </div>
          </Router>
        </ChakraProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
