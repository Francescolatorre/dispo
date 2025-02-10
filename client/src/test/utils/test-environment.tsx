import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthContext, User, AuthContextType } from '../../contexts/AuthContext';
import { vi } from 'vitest';

interface TestWrapperProps {
  children: React.ReactNode;
  initialAuth?: Partial<AuthContextType>;
  mockResponses?: {
    login?: {
      success: boolean;
      data?: { user: User; token: string };
      error?: string;
    };
  };
}

// Extended auth state to include token
interface ExtendedAuthState extends Partial<AuthContextType> {
  token?: string | null;
  mockResponses?: TestWrapperProps['mockResponses'];
}

// Extend RenderOptions to include authState
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authState?: ExtendedAuthState;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  initialAuth,
  mockResponses,
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
      login: vi.fn(async (email: string, password: string) => {
        // Use mock responses if provided, otherwise use default behavior
        if (mockResponses?.login) {
          if (!mockResponses.login.success) {
            throw new Error(mockResponses.login.error || 'Login failed');
          }
          const { user, token } = mockResponses.login.data!;
          setUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          return;
        }

        // Default mock behavior
        if (email === 'test@example.com' && password === 'password') {
          const mockUser = {
            id: '1',
            email: 'test@example.com',
            role: 'user',
          };
          const mockToken = 'mock-jwt-token';
          
          setUser(mockUser);
          setIsAuthenticated(true);
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(mockUser));
        } else {
          throw new Error('Invalid credentials');
        }
      }),
      logout: vi.fn(async () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }),
      validateToken: vi.fn(async (token: string) => {
        // Mock token validation
        return token === 'mock-jwt-token';
      }),
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
    <TestWrapper 
      initialAuth={initialAuth}
      mockResponses={initialAuth?.mockResponses}
    >
      {children}
    </TestWrapper>
  );

  Wrapper.renderWithProviders = (
    ui: React.ReactElement,
    options: CustomRenderOptions = {}
  ) => {
    const { authState, ...renderOptions } = options;
    const finalWrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper 
        initialAuth={authState}
        mockResponses={authState?.mockResponses}
      >
        {children}
      </TestWrapper>
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
    token: 'mock-jwt-token',
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