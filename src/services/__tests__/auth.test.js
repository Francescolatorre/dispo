import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../authService.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { AuthorizationError, ValidationError } from '../../errors/index.js';
import { testDb, createTestTransaction } from '../../routes/__tests__/setup.js';
import { logger } from '../../utils/logger.js';
import { metrics } from '../../utils/metrics.js';

// Mock logger and metrics
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('../../utils/metrics.js', () => ({
  metrics: {
    increment: vi.fn(),
    observe: vi.fn()
  }
}));

describe('AuthService', () => {
  let authService;
  let userRepository;
  let client;
  let testUser;
  let testCount = 0;

  const getUniqueEmail = () => `test${testCount}@example.com`;

  beforeAll(async () => {
    await testDb.setup();
  });

  beforeEach(async () => {
    client = await createTestTransaction();
    userRepository = new UserRepository(client);
    authService = new AuthService(userRepository);
    testCount++;

    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    testUser = await userRepository.createUser({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      role: 'user'
    });

    // Clear mock calls
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    await client.release();
  });

  describe('initialize', () => {
    it('should initialize schema', async () => {
      const newService = new AuthService();
      await newService.initialize();

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Initializing auth service',
        expect.any(Object)
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Auth service initialized',
        expect.any(Object)
      );
    });

    it('should handle initialization errors', async () => {
      const mockRepo = {
        initializeSchema: vi.fn().mockRejectedValue(new Error('Init failed'))
      };
      const service = new AuthService(mockRepo);

      await expect(service.initialize()).rejects.toThrow('Init failed');

      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to initialize auth service',
        expect.any(Object)
      );
    });
  });

  describe('login', () => {
    it('should authenticate valid credentials', async () => {
      const result = await authService.login('test@example.com', 'testpass123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(result.user.password).toBeUndefined();

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Login attempt',
        expect.any(Object)
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Login successful',
        expect.any(Object)
      );

      // Verify metrics
      expect(metrics.observe).toHaveBeenCalledWith(
        'auth_duration',
        expect.any(Object)
      );
    });

    it('should reject invalid password', async () => {
      await expect(authService.login('test@example.com', 'wrongpass'))
        .rejects
        .toThrow(AuthorizationError);

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith(
        'Login failed',
        expect.any(Object)
      );

      // Verify metrics
      expect(metrics.increment).toHaveBeenCalledWith(
        'auth_failures',
        expect.any(Object)
      );
    });

    it('should reject non-existent user', async () => {
      await expect(authService.login('nonexistent@example.com', 'testpass123'))
        .rejects
        .toThrow(AuthorizationError);

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith(
        'Login failed',
        expect.any(Object)
      );
    });

    it('should update last_login timestamp', async () => {
      await authService.login('test@example.com', 'testpass123');

      const user = await userRepository.findByEmail('test@example.com');
      expect(user.last_login).toBeDefined();
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const isValid = await authService.validateToken(token);

      expect(isValid).toBe(true);

      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith(
        'Token validated successfully',
        expect.any(Object)
      );
    });

    it('should reject expired token', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const isValid = await authService.validateToken(token);

      expect(isValid).toBe(false);

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Token validation failed',
        expect.any(Object)
      );
    });

    it('should reject invalid token', async () => {
      const isValid = await authService.validateToken('invalid.token.here');

      expect(isValid).toBe(false);

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Token validation failed',
        expect.any(Object)
      );
    });
  });

  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      const result = await authService.changePassword(
        testUser.id,
        'testpass123',
        'newpass123'
      );

      expect(result).toHaveProperty('id', testUser.id);
      expect(result.password).toBeUndefined();

      // Verify can login with new password
      const loginResult = await authService.login('test@example.com', 'newpass123');
      expect(loginResult).toHaveProperty('token');

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Password change attempt',
        expect.any(Object)
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Password changed successfully',
        expect.any(Object)
      );
    });

    it('should reject invalid current password', async () => {
      await expect(authService.changePassword(
        testUser.id,
        'wrongpass',
        'newpass123'
      )).rejects.toThrow(ValidationError);

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith(
        'Password change failed',
        expect.any(Object)
      );
    });

    it('should handle non-existent user', async () => {
      await expect(authService.changePassword(
        99999,
        'testpass123',
        'newpass123'
      )).rejects.toThrow(AuthorizationError);

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith(
        'Password change failed',
        expect.any(Object)
      );
    });
  });

  describe('findUserById', () => {
    it('should find existing user', async () => {
      const user = await authService.findUserById(testUser.id);

      expect(user).toHaveProperty('id', testUser.id);
      expect(user).toHaveProperty('email', testUser.email);
      expect(user.password).toBeUndefined();
    });

    it('should handle non-existent user', async () => {
      await expect(authService.findUserById(99999))
        .rejects
        .toThrow(AuthorizationError);
    });
  });
});