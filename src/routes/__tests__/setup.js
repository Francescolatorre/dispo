import { beforeEach, afterAll } from '@jest/globals';
import { pool } from '../../config/database.js';

// Clean up database before each test
beforeEach(async () => {
  await pool.query('DELETE FROM users');
});

// Clean up database and close connection after all tests
afterAll(async () => {
  await pool.query('DELETE FROM users');
  await pool.end();
});