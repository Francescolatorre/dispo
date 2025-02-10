import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { AuthService } from '../authService.js';
import pool from '../../config/database.js';

describe('AuthService', () => {
  let authService;
  let testCount = 0;
  
  beforeEach(async () => {
    authService = new AuthService();
    // Clean up users table before each test
    await pool.query('DELETE FROM users');
    // Increment test counter for unique emails
    testCount++;
  });

  const getUniqueEmail = () => `test${testCount}@example.com`;

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const name = 'Test User';
      const role = 'user';

      const user = await authService.createUser(email, password, name, role);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(email);
      expect(user.name).toBe(name);
      expect(user.role).toBe(role);

      // Verify password is hashed
      const result = await pool.query(
        'SELECT password FROM users WHERE email = $1',
        [email]
      );

      expect(result.rows[0].password).not.toBe(password);
      expect(result.rows[0].password).toMatch(/^\$2b\$\d+\$/); // bcrypt hash pattern
    });

    it('should set default role to user', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const name = 'Test User';

      const user = await authService.createUser(email, password, name);
      expect(user.role).toBe('user');
    });

    it('should not allow duplicate emails', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const name = 'Test User';

      await authService.createUser(email, password, name);

      await expect(
        authService.createUser(email, 'different-password', 'Another User')
      ).rejects.toThrow();
    });

    it('should set timestamps on creation', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const name = 'Test User';

      const user = await authService.createUser(email, password, name);

      const result = await pool.query(
        'SELECT created_at, updated_at FROM users WHERE id = $1',
        [user.id]
      );

      expect(result.rows[0].created_at).toBeDefined();
      expect(result.rows[0].updated_at).toBeDefined();
    });
  });

  describe('login', () => {
    it('should return user data and token for valid credentials', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const name = 'Test User';

      await authService.createUser(email, password, name);

      const result = await authService.login(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(email);
      expect(result.user.name).toBe(name);
      expect(result.user.role).toBe('user');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should update last_login timestamp', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const name = 'Test User';

      const user = await authService.createUser(email, password, name);
      await authService.login(email, password);

      const result = await pool.query(
        'SELECT last_login FROM users WHERE id = $1',
        [user.id]
      );

      expect(result.rows[0].last_login).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      await expect(
        authService.login('wrong@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const email = getUniqueEmail();
      const name = 'Test User';
      await authService.createUser(email, 'correct-password', name);

      await expect(
        authService.login(email, 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const name = 'Test User';

      await authService.createUser(email, password, name);
      const { token } = await authService.login(email, password);

      const isValid = await authService.validateToken(token);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', async () => {
      const isValid = await authService.validateToken('invalid-token');
      expect(isValid).toBe(false);
    });

    it('should return false for expired token', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const name = 'Test User';

      const user = await authService.createUser(email, password, name);
      
      // Create an expired token
      const expiredToken = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const isValid = await authService.validateToken(expiredToken);
      expect(isValid).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      const email = getUniqueEmail();
      const currentPassword = 'current-password';
      const newPassword = 'new-password';
      const name = 'Test User';

      const user = await authService.createUser(email, currentPassword, name);

      await authService.changePassword(user.id, currentPassword, newPassword);

      // Verify old password no longer works
      await expect(
        authService.login(email, currentPassword)
      ).rejects.toThrow('Invalid credentials');

      // Verify new password works
      const loginResult = await authService.login(email, newPassword);
      expect(loginResult.user.email).toBe(email);
    });

    it('should update updated_at timestamp on password change', async () => {
      const email = getUniqueEmail();
      const currentPassword = 'current-password';
      const newPassword = 'new-password';
      const name = 'Test User';

      const user = await authService.createUser(email, currentPassword, name);

      // Get initial updated_at
      const before = await pool.query(
        'SELECT updated_at FROM users WHERE id = $1',
        [user.id]
      );
      const initialUpdatedAt = new Date(before.rows[0].updated_at).getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      await authService.changePassword(user.id, currentPassword, newPassword);

      // Get new updated_at
      const after = await pool.query(
        'SELECT updated_at FROM users WHERE id = $1',
        [user.id]
      );
      const newUpdatedAt = new Date(after.rows[0].updated_at).getTime();

      expect(newUpdatedAt).toBeGreaterThan(initialUpdatedAt);
    });

    it('should throw error when current password is incorrect', async () => {
      const email = getUniqueEmail();
      const password = 'current-password';
      const name = 'Test User';

      const user = await authService.createUser(email, password, name);

      await expect(
        authService.changePassword(user.id, 'wrong-password', 'new-password')
      ).rejects.toThrow('Invalid current password');
    });

    it('should throw error when user does not exist', async () => {
      await expect(
        authService.changePassword(999, 'password', 'new-password')
      ).rejects.toThrow('User not found');
    });
  });
});