import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestEnvironment } from '../../test/utils/test-environment';
import { useAuth } from '../AuthContext';

const testEnv = createTestEnvironment();

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const TestHookComponent = () => {
  const { isAuthenticated, user, auth } = useAuth();
  return (
    <div data-testid="auth-test">
      <div data-testid="auth-state">
        {JSON.stringify({ isAuthenticated, user })}
      </div>
      <button onClick={() => auth.logout()} data-testid="logout-button">
        Logout
      </button>
      <button 
        onClick={() => auth.login('test@example.com', 'password')} 
        data-testid="login-button"
      >
        Login
      </button>
      <button
        onClick={() => auth.login('invalid@example.com', 'wrong')}
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
      name: 'Test User',
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

    // Trigger login
    const loginButton = screen.getByTestId('login-button');
    await act(async () => {
      await userEvent.click(loginButton);
    });

    // Verify authenticated state
    await waitFor(() => {
      const element = screen.getByTestId('auth-state');
      expect(JSON.parse(element.textContent || '')).toEqual({
        isAuthenticated: true,
        user: mockUser,
      });
    });

    // Verify localStorage
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    expect(JSON.parse(localStorage.getItem('user') || '')).toEqual(mockUser);
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

    // Trigger invalid login
    const invalidLoginButton = screen.getByTestId('invalid-login-button');
    
    let error: Error | undefined;
    await act(async () => {
      try {
        await userEvent.click(invalidLoginButton);
      } catch (e) {
        error = e as Error;
      }
    });

    // Verify error
    expect(error).toBeDefined();
    expect(error?.message).toBe('Invalid credentials');

    // Verify state remains unauthenticated
    const element = screen.getByTestId('auth-state');
    expect(JSON.parse(element.textContent || '')).toEqual({
      isAuthenticated: false,
      user: null,
    });

    // Verify localStorage is empty
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should handle token validation on mount', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    };

    // Set up localStorage with valid token
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        isAuthenticated: false,
        user: null,
      },
    });

    // Verify authenticated state after mount
    await waitFor(() => {
      const element = screen.getByTestId('auth-state');
      expect(JSON.parse(element.textContent || '')).toEqual({
        isAuthenticated: true,
        user: mockUser,
      });
    });
  });

  it('should handle invalid token on mount', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    };

    // Set up localStorage with invalid token
    localStorage.setItem('token', 'invalid-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        isAuthenticated: false,
        user: null,
      },
    });

    // Verify unauthenticated state after mount
    await waitFor(() => {
      const element = screen.getByTestId('auth-state');
      expect(JSON.parse(element.textContent || '')).toEqual({
        isAuthenticated: false,
        user: null,
      });
    });

    // Verify localStorage is cleared
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should clear authentication state on logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    };

    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        isAuthenticated: true,
        user: mockUser,
      },
    });

    // Verify initial state
    let element = screen.getByTestId('auth-state');
    expect(JSON.parse(element.textContent || '')).toEqual({
      isAuthenticated: true,
      user: mockUser,
    });

    // Trigger logout
    const logoutButton = screen.getByTestId('logout-button');
    await act(async () => {
      await userEvent.click(logoutButton);
    });

    // Verify cleared state
    await waitFor(() => {
      element = screen.getByTestId('auth-state');
      expect(JSON.parse(element.textContent || '')).toEqual({
        isAuthenticated: false,
        user: null,
      });
    });

    // Verify localStorage is cleared
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});