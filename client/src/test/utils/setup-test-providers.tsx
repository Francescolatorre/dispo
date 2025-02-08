import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '../styles/chakraTheme';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, screen, fireEvent, act, waitFor } from '@testing-library/react';

// Create a test query client with specific test settings
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Suppress react-query errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (/React Query error/.test(args[0])) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

interface ProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialEntries?: string[];
  route?: string;
}

export const TestProviders: React.FC<ProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
  initialEntries = ['/'],
  route = '/',
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
};

// Helper to wrap components with all necessary providers
export const withTestProviders = (
  Component: React.ComponentType<any>,
  props: any = {},
  providerProps: Omit<ProvidersProps, 'children'> = {}
) => {
  return (
    <TestProviders {...providerProps}>
      <Component {...props} />
    </TestProviders>
  );
};

// Custom render function that includes all providers
export const render = (ui: React.ReactElement, options = {}) => {
  const queryClient = createTestQueryClient();
  const rendered = rtlRender(
    <TestProviders queryClient={queryClient} {...options}>
      {ui}
    </TestProviders>
  );
  return {
    queryClient,
    ...rendered,
  };
};

// Re-export testing utilities
export { screen, fireEvent, act, waitFor };