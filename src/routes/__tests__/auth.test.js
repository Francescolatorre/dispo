import request from 'supertest';
import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../../server.js';
import { testDb, createTestTransaction, createTestDataFactory } from './setup.js';
import { logger } from '../../utils/logger.js';
import { UserRepository } from '../../repositories/user.repository.js';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('Auth Routes', () => {
  let testUser;
  let userRepository;
  let client;
  let testCount = 0;

  const getUniqueEmail = () => `test${testCount}@example.com`;

  beforeAll(async () => {
    await testDb.setup();
  });

  beforeEach(async () => {
    // Start transaction
    client = await createTestTransaction();
    userRepository = new UserRepository(client);
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
    // Rollback transaction
    await client.query('ROLLBACK');
    await client.release();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('name', 'Test User');

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Login attempt',
        expect.objectContaining({
          context: expect.objectContaining({
            email: 'test@example.com'
          })
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Login successful',
        expect.objectContaining({
          context: expect.objectContaining({
            email: 'test@example.com'
          })
        })
      );
    });

    it('should update last_login on successful login', async () => {
      const beforeLogin = await userRepository.findByEmail('test@example.com');
      const oldLastLogin = beforeLogin.last_login;

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      const afterLogin = await userRepository.findByEmail('test@example.com');
      const newLastLogin = afterLogin.last_login;

      expect(new Date(newLastLogin).getTime()).toBeGreaterThan(
        new Date(oldLastLogin || 0).getTime()
      );
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Login failed',
        expect.objectContaining({
          context: expect.objectContaining({
            reason: 'invalid_credentials'
          })
        })
      );
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Login failed',
        expect.objectContaining({
          context: expect.objectContaining({
            reason: 'invalid_credentials'
          })
        })
      );
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify valid token', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          context: expect.objectContaining({
            reason: 'invalid_token'
          })
        })
      );
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid token and current password', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'testpass123',
          newPassword: 'newpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password updated successfully');

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
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpass',
          newPassword: 'newpass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid current password');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Password change failed',
        expect.objectContaining({
          context: expect.objectContaining({
            reason: 'invalid_current_password'
          })
        })
      );
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'testpass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'email must be a valid email address');
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'password must be at least 8 characters');
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      // Make multiple requests in quick succession
      const requests = Array(11).fill().map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'testpass123'
          })
      );

      const responses = await Promise.all(requests);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body).toHaveProperty('error', 'Too many login attempts, please try again later');
    });
  });

  describe('Token Management', () => {
    it('should handle expired tokens', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Token expired');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          context: expect.objectContaining({
            reason: 'invalid_token'
          })
        })
      );
    });

    it('should handle malformed tokens', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          context: expect.objectContaining({
            reason: 'invalid_token'
          })
        })
      );
    });
  });
});