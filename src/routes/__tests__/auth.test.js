import request from 'supertest';
import { beforeEach, afterAll, describe, it, expect, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../../config/database.js';
import app from '../../server.js';

describe('Auth Routes', () => {
  let testUser;

  // Clean up database before each test
  beforeEach(async () => {
    await pool.query('DELETE FROM users');
  });

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, role, last_login) VALUES ($1, $2, $3, NOW()) RETURNING *',
      ['test@example.com', hashedPassword, 'user']
    );
    testUser = result.rows[0];
  });

  afterAll(async () => {
    // Clean up test user
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    // Close database connection
    await pool.end();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should update last_login on successful login', async () => {
      const beforeLogin = await pool.query(
        'SELECT last_login FROM users WHERE id = $1',
        [testUser.id]
      );
      const oldLastLogin = beforeLogin.rows[0].last_login;

      await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      const afterLogin = await pool.query(
        'SELECT last_login FROM users WHERE id = $1',
        [testUser.id]
      );
      const newLastLogin = afterLogin.rows[0].last_login;

      expect(new Date(newLastLogin)).toBeGreaterThan(new Date(oldLastLogin));
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify valid token', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token provided');
    });
  });

  describe('POST /auth/reset-password-request', () => {
    it('should handle reset request for existing user', async () => {
      const response = await request(app)
        .post('/auth/reset-password-request')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'If the email exists, a reset link will be sent');
    });

    it('should handle reset request for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/reset-password-request')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(200);
      // Should return same message to prevent email enumeration
      expect(response.body).toHaveProperty('message', 'If the email exists, a reset link will be sent');
    });
  });

  describe('POST /auth/logout', () => {
    it('should handle logout request', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'testpass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid email format');
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Password must be at least 8 characters');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Simulate database error
      const mockError = new Error('Database connection failed');
      jest.spyOn(pool, 'query').mockRejectedValueOnce(mockError);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal server error');
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests in quick succession
      const requests = Array(6).fill().map(() => 
        request(app)
          .post('/auth/login')
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
        { expiresIn: '0s' }
      );

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Token expired');
    });

    it('should handle malformed tokens', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });
  });
});