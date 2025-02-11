import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, AuthContextType } from '../../src/contexts/AuthContext';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Create a fresh query client for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0
    },
  },
});

interface TestWrapperProps {
  children: React.ReactNode;
  authState?: Partial<AuthContextType>;
}

export function render(
  ui: React.ReactElement,
  {
    authState = {
      isAuthenticated: false,
      user: null,
      auth: {
        login: vi.fn(),
        logout: vi.fn(),
      },
    },
    ...renderOptions
  } = {}
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <AuthContext.Provider value={authState as AuthContextType}>
            <BrowserRouter>{children}</BrowserRouter>
          </AuthContext.Provider>
        </ChakraProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export everything
export * from '@testing-library/react';