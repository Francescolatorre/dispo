import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestEnvironment } from '../test/setup/test-environment';
import { useAuth } from '../contexts/AuthContext';

const testEnv = createTestEnvironment();

interface User {
  id: string;
  email: string;
  role: string;
}

const TestHookComponent = () => {
  const { isAuthenticated, user, token, auth } = useAuth();
  return (
    <div data-testid="auth-test">
      <div data-testid="auth-state">
        {JSON.stringify({ isAuthenticated, user, token })}
      </div>
      <button onClick={() => auth.logout()} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

describe('Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start with unauthenticated state', async () => {
    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        user: null,
        token: null,
      },
    });

    const element = screen.getByTestId('auth-state');
    expect(JSON.parse(element.textContent || '')).toEqual({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  });

  it('should handle authentication state', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };
    const mockToken = 'test-token';

    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        user: mockUser,
        token: mockToken,
      },
    });

    const element = screen.getByTestId('auth-state');
    expect(JSON.parse(element.textContent || '')).toEqual({
      isAuthenticated: true,
      user: mockUser,
      token: mockToken,
    });
  });

  it('should clear authentication state on logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };
    const mockToken = 'test-token';

    testEnv.renderWithProviders(<TestHookComponent />, {
      authState: {
        user: mockUser,
        token: mockToken,
      },
    });

    // Verify initial state
    let element = screen.getByTestId('auth-state');
    expect(JSON.parse(element.textContent || '')).toEqual({
      isAuthenticated: true,
      user: mockUser,
      token: mockToken,
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
        token: null,
      });
    });
  });
});