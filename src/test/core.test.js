import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { BaseRepository } from '../repositories/base.repository.js';
import { TestDatabase } from './database.js';
import { DatabaseError, ValidationError, NotFoundError } from '../errors/index.js';
import pool from '../config/database.js';

describe('Core Infrastructure Tests', () => {
  let testClient;
  let testRepo;

  beforeAll(async () => {
    testClient = await TestDatabase.initialize();
    testRepo = new BaseRepository('test_table');
  });

  afterAll(async () => {
    await TestDatabase.cleanup(testClient);
  });

  describe('Error Handling', () => {
    test('should properly wrap database errors', async () => {
      try {
        await testRepo.executeQuery('SELECT * FROM nonexistent_table');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.message).toBe('Query execution failed');
        expect(error.statusCode).toBe(500);
      }
    });

    test('should handle validation errors', () => {
      const error = new ValidationError('Invalid input', 'email');
      expect(error.statusCode).toBe(400);
      expect(error.field).toBe('email');
      expect(error.toJSON()).toEqual({
        error: {
          message: 'Invalid input',
          type: 'ValidationError',
          statusCode: 400
        }
      });
    });

    test('should handle not found errors', () => {
      const error = new NotFoundError('User', '123');
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe('User');
      expect(error.identifier).toBe('123');
    });
  });

  describe('Transaction Management', () => {
    test('should handle nested transactions', async () => {
      const result = await testRepo.withTransaction(async (client) => {
        await client.query('CREATE TEMPORARY TABLE test_table (id SERIAL, value TEXT)');
        
        // Outer transaction
        await client.query("INSERT INTO test_table (value) VALUES ('outer')");
        
        // Nested transaction
        const nestedResult = await testRepo.withTransaction(async (nestedClient) => {
          await nestedClient.query("INSERT INTO test_table (value) VALUES ('nested')");
          return 'nested complete';
        }, client);
        
        expect(nestedResult).toBe('nested complete');
        
        const { rows } = await client.query('SELECT * FROM test_table');
        expect(rows).toHaveLength(2);
        
        return rows;
      });
      
      expect(result).toHaveLength(2);
      expect(result.map(r => r.value)).toContain('outer');
      expect(result.map(r => r.value)).toContain('nested');
    });

    test('should rollback failed transactions', async () => {
      try {
        await testRepo.withTransaction(async (client) => {
          await client.query('CREATE TEMPORARY TABLE test_rollback (id SERIAL, value TEXT)');
          await client.query("INSERT INTO test_rollback (value) VALUES ('before error')");
          throw new Error('Simulated error');
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Simulated error');
        
        // Verify rollback
        const result = await pool.query('SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = $1)', ['test_rollback']);
        expect(result.rows[0].exists).toBe(false);
      }
    });
  });

  describe('Test Database Infrastructure', () => {
    test('should handle savepoints', async () => {
      await TestDatabase.query(testClient, 'CREATE TEMPORARY TABLE savepoint_test (id SERIAL, value TEXT)');
      
      // Create initial record
      await TestDatabase.query(testClient, "INSERT INTO savepoint_test (value) VALUES ('initial')");
      
      // Create savepoint
      await TestDatabase.createSavepoint(testClient, 'test_save');
      
      // Add more records
      await TestDatabase.query(testClient, "INSERT INTO savepoint_test (value) VALUES ('after_savepoint')");
      
      // Rollback to savepoint
      await TestDatabase.rollbackToSavepoint(testClient, 'test_save');
      
      // Verify only initial record exists
      const result = await TestDatabase.query(testClient, 'SELECT * FROM savepoint_test');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].value).toBe('initial');
    });

    test('should clear tables', async () => {
      // Create test tables
      await TestDatabase.query(testClient, 'CREATE TEMPORARY TABLE clear_test_1 (id SERIAL, value TEXT)');
      await TestDatabase.query(testClient, 'CREATE TEMPORARY TABLE clear_test_2 (id SERIAL, value TEXT)');
      
      // Insert data
      await TestDatabase.query(testClient, "INSERT INTO clear_test_1 (value) VALUES ('test')");
      await TestDatabase.query(testClient, "INSERT INTO clear_test_2 (value) VALUES ('test')");
      
      // Clear tables
      await TestDatabase.clearTables(testClient, ['clear_test_1', 'clear_test_2']);
      
      // Verify tables are empty
      const result1 = await TestDatabase.query(testClient, 'SELECT COUNT(*) FROM clear_test_1');
      const result2 = await TestDatabase.query(testClient, 'SELECT COUNT(*) FROM clear_test_2');
      
      expect(result1.rows[0].count).toBe('0');
      expect(result2.rows[0].count).toBe('0');
    });
  });
});