import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthContext, User, AuthContextType } from '../../contexts/AuthContext';

interface TestWrapperProps {
  children: React.ReactNode;
  initialAuth?: Partial<AuthContextType>;
}

// Extended auth state to include token
interface ExtendedAuthState extends Partial<AuthContextType> {
  token?: string | null;
}

// Extend RenderOptions to include authState
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authState?: ExtendedAuthState;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  initialAuth,
}) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    initialAuth?.isAuthenticated ?? false
  );
  const [user, setUser] = React.useState<User | null>(
    initialAuth?.user ?? null
  );

  const mockAuth: AuthContextType = {
    isAuthenticated,
    user,
    auth: {
      login: async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      },
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
    },
  };

  return (
    <ChakraProvider>
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          {children}
        </AuthContext.Provider>
      </BrowserRouter>
    </ChakraProvider>
  );
};

type TestWrapperComponent = React.FC<{ children: React.ReactNode }> & {
  renderWithProviders: (
    ui: React.ReactElement,
    options?: CustomRenderOptions
  ) => ReturnType<typeof render>;
};

export const createTestWrapper = (initialAuth?: ExtendedAuthState): TestWrapperComponent => {
  const Wrapper: TestWrapperComponent = ({ children }) => (
    <TestWrapper initialAuth={initialAuth}>{children}</TestWrapper>
  );

  Wrapper.renderWithProviders = (
    ui: React.ReactElement,
    options: CustomRenderOptions = {}
  ) => {
    const { authState, ...renderOptions } = options;
    const finalWrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper initialAuth={authState}>{children}</TestWrapper>
    );

    return render(ui, { wrapper: finalWrapper, ...renderOptions });
  };

  return Wrapper;
};

// Alias for backward compatibility
export const createTestEnvironment = createTestWrapper;

// Helper function to create a test environment with authenticated state
export const createAuthenticatedEnvironment = () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
  };

  return createTestWrapper({
    isAuthenticated: true,
    user: mockUser,
    token: 'test-token',
  });
};

// Helper function to create a test environment with unauthenticated state
export const createUnauthenticatedEnvironment = () => {
  return createTestWrapper({
    isAuthenticated: false,
    user: null,
    token: null,
  });
};