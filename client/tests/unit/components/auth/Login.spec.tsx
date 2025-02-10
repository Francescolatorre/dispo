import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../../../../src/pages/Login';
import { render } from '../../../utils/test-utils';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { from: { pathname: '/dashboard' } } }),
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form correctly', () => {
    render(<Login />);

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-container')).toBeInTheDocument();
    expect(screen.getByTestId('login-title')).toHaveTextContent('Login');
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce(undefined);
    render(<Login />, {
      authState: {
        isAuthenticated: false,
        user: null,
        auth: {
          login: mockLogin,
          logout: vi.fn(),
        },
      },
    });

    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    const mockLogin = vi.fn().mockRejectedValueOnce(new Error(errorMessage));
    render(<Login />, {
      authState: {
        isAuthenticated: false,
        user: null,
        auth: {
          login: mockLogin,
          logout: vi.fn(),
        },
      },
    });

    await userEvent.type(screen.getByTestId('email-input'), 'wrong@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'wrongpass');
    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Login failed')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toHaveValue('');
    });
  });

  it('shows loading state during login', async () => {
    const mockLogin = vi.fn().mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<Login />, {
      authState: {
        isAuthenticated: false,
        user: null,
        auth: {
          login: mockLogin,
          logout: vi.fn(),
        },
      },
    });

    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.click(screen.getByTestId('login-button'));

    expect(screen.getByTestId('login-button')).toHaveAttribute('disabled');
    expect(screen.getByText('Logging in...')).toBeInTheDocument();
  });

  it('redirects to original location after login', async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce(undefined);
    render(<Login />, {
      authState: {
        isAuthenticated: false,
        user: null,
        auth: {
          login: mockLogin,
          logout: vi.fn(),
        },
      },
    });

    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
