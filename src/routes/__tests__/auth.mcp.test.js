const request = require('supertest');
const { beforeEach, afterAll, describe, it, expect } = require('@jest/globals');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../../server.js');
const { use_mcp_tool } = require('../../utils/mcp.js');

describe('Auth Routes (MCP Example)', () => {
  let testUser;

  // Clean up database before each test using MCP
  beforeEach(async () => {
    await use_mcp_tool('postgres', 'execute', {
      query: 'DELETE FROM users'
    });
  });

  beforeAll(async () => {
    // Create test user using MCP
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const result = await use_mcp_tool('postgres', 'execute', {
      query: 'INSERT INTO users (email, password, role, last_login) VALUES ($1, $2, $3, NOW()) RETURNING *',
      params: ['test@example.com', hashedPassword, 'user']
    });
    testUser = result[0];
  });

  afterAll(async () => {
    // Clean up test user using MCP
    await use_mcp_tool('postgres', 'execute', {
      query: 'DELETE FROM users WHERE email = $1',
      params: ['test@example.com']
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and update last_login', async () => {
      // Get initial last_login using MCP
      const beforeLogin = await use_mcp_tool('postgres', 'query', {
        query: 'SELECT last_login FROM users WHERE id = $1',
        params: [testUser.id]
      });
      const oldLastLogin = beforeLogin[0].last_login;

      // Perform login
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

      // Verify last_login was updated using MCP
      const afterLogin = await use_mcp_tool('postgres', 'query', {
        query: 'SELECT last_login FROM users WHERE id = $1',
        params: [testUser.id]
      });
      const newLastLogin = afterLogin[0].last_login;

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

      // Verify last_login was not updated using MCP
      const result = await use_mcp_tool('postgres', 'query', {
        query: 'SELECT last_login FROM users WHERE id = $1',
        params: [testUser.id]
      });
      expect(new Date(result[0].last_login)).toBeLessThan(new Date());
    });
  });

  describe('Database Schema Verification', () => {
    it('should have correct users table schema', async () => {
      const tableInfo = await use_mcp_tool('postgres', 'get_table_info', {
        table: 'users'
      });

      // Verify required columns exist with correct types
      const columns = tableInfo.reduce((acc, col) => {
        acc[col.column_name] = col;
        return acc;
      }, {});

      expect(columns).toHaveProperty('id');
      expect(columns.id.data_type).toBe('integer');
      expect(columns.id.is_nullable).toBe('NO');

      expect(columns).toHaveProperty('email');
      expect(columns.email.data_type).toBe('character varying');
      expect(columns.email.is_nullable).toBe('NO');

      expect(columns).toHaveProperty('password');
      expect(columns.password.data_type).toBe('character varying');
      expect(columns.password.is_nullable).toBe('NO');

      expect(columns).toHaveProperty('last_login');
      expect(columns.last_login.data_type).toBe('timestamp with time zone');
    });
  });
});