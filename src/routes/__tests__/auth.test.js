import request from 'supertest';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../../config/database.js';
import app from '../../server.js';
import { setupTestDb, cleanTestDb } from './setup.js';

// Set up test environment
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

describe('Auth Routes', () => {
  let testUser;
  let testCount = 0;

  const getUniqueEmail = () => `test${testCount}@example.com`;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
    testCount++;

    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
      ['test@example.com', hashedPassword, 'Test User', 'user']
    );
    testUser = result.rows[0];
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
    });

    it('should update last_login on successful login', async () => {
      const beforeLogin = await pool.query(
        'SELECT last_login FROM users WHERE id = $1',
        [testUser.id]
      );
      const oldLastLogin = beforeLogin.rows[0].last_login;

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      const afterLogin = await pool.query(
        'SELECT last_login FROM users WHERE id = $1',
        [testUser.id]
      );
      const newLastLogin = afterLogin.rows[0].last_login;

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
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
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
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token provided');
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

      // Verify updated_at was updated
      const result = await pool.query(
        'SELECT updated_at FROM users WHERE id = $1',
        [testUser.id]
      );
      expect(result.rows[0].updated_at).toBeDefined();
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

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid current password');
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
      expect(response.body).toHaveProperty('message', 'Invalid email format');
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Password must be at least 8 characters');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Drop the users table to simulate a database error
      await pool.query('DROP TABLE IF EXISTS users');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal server error');

      // Recreate the users table for subsequent tests
      await setupTestDb();
    });

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
      expect(lastResponse.body).toHaveProperty('message', 'Too many requests');
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
      expect(response.body).toHaveProperty('message', 'Token expired');
    });

    it('should handle malformed tokens', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });
  });
});