import React, { ReactElement, ReactNode, useState } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  role: string;
}

interface TestEnvironmentOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  authState?: {
    user: User | null;
    token: string | null;
    isAuthenticated?: boolean;
  };
}

interface TestWrapperProps {
  children: ReactNode;
  queryClient: QueryClient;
  authState?: TestEnvironmentOptions['authState'];
}

export type TestEnvironment = {
  renderWithProviders: (
    ui: ReactElement,
    options?: TestEnvironmentOptions
  ) => RenderResult;
  queryClient: QueryClient;
};

const TestWrapper = ({ children, queryClient, authState }: TestWrapperProps): ReactElement => {
  const [user, setUser] = useState(authState?.user || null);
  const [token, setToken] = useState(authState?.token || null);

  const authContextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!(user && token),
    auth: {
      login: (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      },
    },
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContextValue}>
          <ChakraProvider>{children}</ChakraProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export const createTestEnvironment = (): TestEnvironment => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const renderWithProviders = (
    ui: ReactElement,
    options: TestEnvironmentOptions = {}
  ): RenderResult => {
    const {
      initialRoute = '/',
      authState,
      ...renderOptions
    } = options;

    window.history.pushState({}, 'Test page', initialRoute);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestWrapper
        queryClient={queryClient}
        authState={authState}
      >
        {children}
      </TestWrapper>
    );

    return render(ui, { wrapper, ...renderOptions });
  };

  return {
    renderWithProviders,
    queryClient,
  };
};

// Re-export testing library utilities
export * from '@testing-library/react';
export * from '@testing-library/user-event';