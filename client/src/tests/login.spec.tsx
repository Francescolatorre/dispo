import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestEnvironment } from '../test/setup/test-environment';
import { Login } from '../pages/Login';

const testEnv = createTestEnvironment();
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    mockToast.mockReset();
    global.fetch = vi.fn();
  });

  it('should render login form', () => {
    testEnv.renderWithProviders(<Login />);

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };
    const mockToken = 'test-token';

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken, user: mockUser }),
    });

    testEnv.renderWithProviders(<Login />);

    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  it('should handle login failure', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    testEnv.renderWithProviders(<Login />);

    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'wrongpassword');
    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Login failed',
        description: 'Login failed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });
  });

  it('should handle network error', async () => {
    const errorMessage = 'Network error';
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    testEnv.renderWithProviders(<Login />);

    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Login failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });
  });
});