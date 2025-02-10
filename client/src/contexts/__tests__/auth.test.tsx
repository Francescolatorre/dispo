import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/utils/setup-test-providers';
import { useAuth } from '../AuthContext';

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
    </div>
  );
};

describe('Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start with unauthenticated state', async () => {
    render(<TestHookComponent />);

    const element = screen.getByTestId('auth-state');
    expect(JSON.parse(element.textContent || '')).toEqual({
      isAuthenticated: false,
      user: null,
    });
  });

  it('should handle authentication state', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };

    // Set up initial auth state
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(<TestHookComponent />);

    const element = screen.getByTestId('auth-state');
    expect(JSON.parse(element.textContent || '')).toEqual({
      isAuthenticated: true,
      user: mockUser,
    });
  });

  it('should clear authentication state on logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };

    // Set up initial auth state
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(<TestHookComponent />);

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

  it('should handle login errors', async () => {
    render(<TestHookComponent />);
    const { auth } = useAuth();

    let loginSucceeded = false;
    try {
      await auth.login('wrong@example.com', 'wrongpass');
      loginSucceeded = true;
    } catch (error) {
      expect(error).toBeDefined();
    }
    expect(loginSucceeded).toBeFalsy();

    // Verify state remains unauthenticated
    const element = screen.getByTestId('auth-state');
    expect(JSON.parse(element.textContent || '')).toEqual({
      isAuthenticated: false,
      user: null,
    });
  });
});