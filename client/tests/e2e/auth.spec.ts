import { test, expect } from '@playwright/test';
import {
  loginUser,
  logoutUser,
  clearAuthState,
  verifyProtectedRoute,
  verifyPublicRoute,
} from './utils/auth.utils';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('successful login with valid credentials', async ({ page }) => {
    const result = await loginUser(page);
    expect(result).not.toBeNull();
    
    const { token, user } = result!;
    expect(token).toBeTruthy();
    expect(user).toBeTruthy();
    expect(JSON.parse(user!)).toHaveProperty('email', 'test@example.com');
    
    // Verify UI updates
    await expect(page.getByTestId('user-greeting')).toBeVisible();
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });

  test('failed login with invalid credentials', async ({ page }) => {
    await loginUser(page, {
      email: 'wrong@example.com',
      password: 'wrongpass',
      shouldSucceed: false,
    });

    // Verify error message
    await expect(page.getByRole('alert')).toBeVisible();
    
    // Verify we're still on login page
    expect(page.url()).toContain('/login');
  });

  test('successful logout', async ({ page }) => {
    // First login
    const loginResult = await loginUser(page);
    expect(loginResult).not.toBeNull();
    
    // Then logout
    const { token, user } = await logoutUser(page);
    
    // Verify auth state cleared
    expect(token).toBeNull();
    expect(user).toBeNull();
    
    // Verify UI updates
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('login-prompt')).toBeVisible();
  });

  test('auth state persistence after refresh', async ({ page }) => {
    // Login first
    const loginResult = await loginUser(page);
    expect(loginResult).not.toBeNull();
    
    // Refresh page
    await page.reload();
    
    // Verify still logged in
    await expect(page.getByTestId('user-greeting')).toBeVisible();
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });
});

test.describe('Navigation Protection', () => {
  test('redirects to login for protected routes when not authenticated', async ({ page }) => {
    await clearAuthState(page);
    
    // Try accessing protected routes
    const protectedRoutes = [
      '/employees/new',
      '/projects/new',
      '/assignments/new',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });

  test('allows access to public routes when not authenticated', async ({ page }) => {
    await clearAuthState(page);
    
    // Try accessing public routes
    const publicRoutes = ['/', '/login', '/projects', '/employees'];

    for (const route of publicRoutes) {
      await page.goto(route);
      expect(page.url()).toContain(route);
    }
  });

  test('returns to original route after login', async ({ page }) => {
    await clearAuthState(page);
    
    // Try accessing protected route
    const targetRoute = '/employees/new';
    await page.goto(targetRoute);
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Login
    const loginResult = await loginUser(page);
    expect(loginResult).not.toBeNull();
    
    // Should return to original route
    await expect(page).toHaveURL(targetRoute);
  });
});

test.describe('Navigation UI', () => {
  test('shows correct navigation items based on auth state', async ({ page }) => {
    // Before login
    await page.goto('/');
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('nav-projects')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByTestId('nav-employees')).toHaveAttribute('aria-disabled', 'true');
    
    // After login
    const loginResult = await loginUser(page);
    expect(loginResult).not.toBeNull();
    
    await expect(page.getByTestId('logout-button')).toBeVisible();
    await expect(page.getByTestId('nav-projects')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByTestId('nav-employees')).toHaveAttribute('aria-disabled', 'true');
  });

  test('highlights active route in navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('nav-dashboard')).toHaveClass(/nav-link-active/);
    
    await page.goto('/login');
    await expect(page.getByTestId('nav-login')).toHaveClass(/nav-link-active/);
  });
});