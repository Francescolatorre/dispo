import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestEnvironment } from '../../test/utils/test-environment';
import { useAuth } from '../AuthContext';

const testEnv = createTestEnvironment();

interface User {
  id: string;
  email: string;
  role: string;
}

const TestHookComponent = () => {
  const { isAuthenticated, user, auth } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await auth.login('test@example.com', 'password');
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
  };

  const handleInvalidLogin = async () => {
    try {
      setError(null);
      await auth.login('invalid@example.com', 'wrong');
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
  };

  return (
    <div data-testid="auth-test">
      <div data-testid="auth-state">
        {JSON.stringify({ isAuthenticated, user })}
      </div>
      <div data-testid="error-state">
        {error}
      </div>
      <button onClick={() => auth.logout()} data-testid="logout-button">
        Logout
      </button>
      <button 
        onClick={handleLogin} 
        data-testid="login-button"
      >
        Login
      </button>
      <button
        onClick={handleInvalidLogin}
        data-testid="invalid-login-button"
      >
        Invalid Login
      </button>
    </div>
  );
};

describe('Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should start with unauthenticated state', async () => {
    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        isAuthenticated: false,
        user: null,
      },
    });

    const element = screen.getByTestId('auth-state');
    expect(JSON.parse(element.textContent || '')).toEqual({
      isAuthenticated: false,
      user: null,
    });
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };

    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        isAuthenticated: false,
        user: null,
        mockResponses: {
          login: {
            success: true,
            data: {
              user: mockUser,
              token: 'mock-jwt-token',
            },
          },
        },
      },
    });

    // Verify initial state
    expect(JSON.parse(screen.getByTestId('auth-state').textContent || '')).toEqual({
      isAuthenticated: false,
      user: null,
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();

    // Trigger login
    const loginButton = screen.getByTestId('login-button');
    await userEvent.click(loginButton);

    // Wait for state and storage updates
    await waitFor(() => {
      // Verify state update
      const state = JSON.parse(screen.getByTestId('auth-state').textContent || '');
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);

      // Verify storage update
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '');
      expect(token).toBe('mock-jwt-token');
      expect(storedUser).toEqual(mockUser);
    }, { timeout: 2000 });
  });

  it('should handle login with invalid credentials', async () => {
    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        isAuthenticated: false,
        user: null,
        mockResponses: {
          login: {
            success: false,
            error: 'Invalid credentials',
          },
        },
      },
    });

    // Verify initial state
    expect(JSON.parse(screen.getByTestId('auth-state').textContent || '')).toEqual({
      isAuthenticated: false,
      user: null,
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();

    // Trigger invalid login
    const invalidLoginButton = screen.getByTestId('invalid-login-button');
    await userEvent.click(invalidLoginButton);

    // Wait for error state and verify storage remains empty
    await waitFor(() => {
      // Verify error state
      const errorElement = screen.getByTestId('error-state');
      expect(errorElement.textContent).toBe('Invalid credentials');

      // Verify state remains unauthenticated
      const state = JSON.parse(screen.getByTestId('auth-state').textContent || '');
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();

      // Verify storage remains empty
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  it('should handle token validation on mount', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };

    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        isAuthenticated: false,
        user: null,
        token: 'mock-jwt-token',
        mockResponses: {
          verify: {
            success: true,
            data: {
              user: mockUser,
            },
          },
        },
      },
    });

    // Wait for state and storage updates
    await waitFor(() => {
      // Verify state update
      const state = JSON.parse(screen.getByTestId('auth-state').textContent || '');
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);

      // Verify storage update
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '');
      expect(token).toBe('mock-jwt-token');
      expect(storedUser).toEqual(mockUser);
    });
  });

  it('should handle invalid token on mount', async () => {
    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        isAuthenticated: false,
        user: null,
        token: 'invalid-token',
        mockResponses: {
          verify: {
            success: false,
            error: {
              message: 'Invalid token',
            },
          },
        },
      },
    });

    // Wait for state and storage updates
    await waitFor(() => {
      // Verify state update
      const state = JSON.parse(screen.getByTestId('auth-state').textContent || '');
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();

      // Verify storage is cleared
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  it('should clear authentication state on logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };

    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        isAuthenticated: true,
        user: mockUser,
      },
    });

    // Verify initial state
    const initialState = JSON.parse(screen.getByTestId('auth-state').textContent || '');
    expect(initialState.isAuthenticated).toBe(true);
    expect(initialState.user).toEqual(mockUser);

    // Trigger logout
    const logoutButton = screen.getByTestId('logout-button');
    await userEvent.click(logoutButton);

    // Wait for state and storage updates
    await waitFor(() => {
      // Verify state update
      const state = JSON.parse(screen.getByTestId('auth-state').textContent || '');
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();

      // Verify storage is cleared
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});