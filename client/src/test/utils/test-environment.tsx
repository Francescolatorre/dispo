import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthContext, User, AuthContextType } from '../../contexts/AuthContext';
import { vi } from 'vitest';

// Extended auth state to include token
interface ExtendedAuthState extends Partial<AuthContextType> {
  token?: string | null;
  mockResponses?: {
    login?: {
      success: boolean;
      data?: { user: User; token: string };
      error?: string;
    };
    verify?: {
      success: boolean;
      data?: { user: User };
      error?: { message: string };
    };
  };
}

interface TestWrapperProps {
  children: React.ReactNode;
  initialAuth?: ExtendedAuthState;
  mockResponses?: ExtendedAuthState['mockResponses'];
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
  const [state, setState] = React.useState({
    isAuthenticated: initialAuth?.isAuthenticated ?? false,
    user: initialAuth?.user ?? null,
  });

  const updateAuthState = React.useCallback((newUser: User | null, isAuth: boolean, token?: string) => {
    if (isAuth && newUser && token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.clear();
    }
    setState({ isAuthenticated: isAuth, user: newUser });
  }, []);

  const mockAuth = React.useMemo<AuthContextType>(() => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    auth: {
      login: vi.fn(async (email: string, password: string) => {
        if (mockResponses?.login) {
          if (!mockResponses.login.success) {
            updateAuthState(null, false);
            throw new Error(mockResponses.login.error || 'Login failed');
          }
          const { user, token } = mockResponses.login.data!;
          updateAuthState(user, true, token);
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
          
          updateAuthState(mockUser, true, mockToken);
          return;
        } else {
          updateAuthState(null, false);
          throw new Error('Invalid credentials');
        }
      }),
      logout: vi.fn(async () => {
        updateAuthState(null, false);
      }),
      validateToken: vi.fn(async (token: string) => {
        if (mockResponses?.verify) {
          if (!mockResponses.verify.success) {
            updateAuthState(null, false);
            return false;
          }
          const mockUser = mockResponses.verify.data?.user || {
            id: '1',
            email: 'test@example.com',
            role: 'user',
          };
          updateAuthState(mockUser, true, token);
          return true;
        }

        // Default behavior
        if (token === 'mock-jwt-token') {
          const mockUser = {
            id: '1',
            email: 'test@example.com',
            role: 'user',
          };
          updateAuthState(mockUser, true, token);
          return true;
        }
        updateAuthState(null, false);
        return false;
      }),
    },
  }), [state.isAuthenticated, state.user, mockResponses, updateAuthState]);

  // Initialize auth state
  React.useEffect(() => {
    const initializeAuth = async () => {
      updateAuthState(null, false);
      if (initialAuth?.token) {
        if (initialAuth.isAuthenticated && initialAuth.user) {
          updateAuthState(initialAuth.user, true, initialAuth.token);
        } else {
          const isValid = await mockAuth.auth.validateToken(initialAuth.token);
          if (!isValid) {
            updateAuthState(null, false);
          }
        }
      }
    };

    initializeAuth().catch(console.error);
  }, [initialAuth, mockAuth.auth.validateToken, updateAuthState]);

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