import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../Login';
import { render } from '../../../test/setup-test-providers';

describe('Login Component', () => {
  it('renders login form with required fields', () => {
    render(<Login />);
    
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<Login />);
    const user = userEvent.setup();
    
    // Try to submit without filling fields
    await user.click(screen.getByTestId('login-submit'));
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(<Login />);
    const user = userEvent.setup();
    
    // Enter invalid email
    await user.type(screen.getByTestId('email-input'), 'invalid-email');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('login-submit'));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    render(<Login />);
    const user = userEvent.setup();
    
    // Fill form with valid data
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    
    // Submit form
    await user.click(screen.getByTestId('login-submit'));
    
    // Check loading state
    expect(screen.getByTestId('login-loading')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit')).toBeDisabled();
  });

  it('handles successful login', async () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    render(<Login />);
    const user = userEvent.setup();
    
    // Fill form
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    
    // Submit form
    await user.click(screen.getByTestId('login-submit'));
    
    // Verify navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles login error', async () => {
    render(<Login />);
    const user = userEvent.setup();
    
    // Fill form with invalid credentials
    await user.type(screen.getByTestId('email-input'), 'wrong@example.com');
    await user.type(screen.getByTestId('password-input'), 'wrongpass');
    
    // Submit form
    await user.click(screen.getByTestId('login-submit'));
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument();
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});