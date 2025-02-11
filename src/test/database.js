import pool from '../config/database.js';
import { DatabaseError } from '../errors/index.js';

/**
 * Test database management class providing transaction and savepoint support for tests
 */
export class TestDatabase {
  /**
   * Initialize test database and begin transaction
   * @returns {Promise<import('pg').PoolClient>} Database client
   */
  static async initialize() {
    try {
      const client = await pool.connect();
      await client.query('BEGIN');
      return client;
    } catch (error) {
      throw new DatabaseError('Failed to initialize test database', error);
    }
  }

  /**
   * Create a savepoint
   * @param {import('pg').PoolClient} client - Database client
   * @param {string} name - Savepoint name
   * @returns {Promise<void>}
   */
  static async createSavepoint(client, name) {
    try {
      await client.query(`SAVEPOINT ${name}`);
    } catch (error) {
      throw new DatabaseError(`Failed to create savepoint ${name}`, error);
    }
  }

  /**
   * Rollback to a savepoint
   * @param {import('pg').PoolClient} client - Database client
   * @param {string} name - Savepoint name
   * @returns {Promise<void>}
   */
  static async rollbackToSavepoint(client, name) {
    try {
      await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    } catch (error) {
      throw new DatabaseError(`Failed to rollback to savepoint ${name}`, error);
    }
  }

  /**
   * Release savepoint
   * @param {import('pg').PoolClient} client - Database client
   * @param {string} name - Savepoint name
   * @returns {Promise<void>}
   */
  static async releaseSavepoint(client, name) {
    try {
      await client.query(`RELEASE SAVEPOINT ${name}`);
    } catch (error) {
      throw new DatabaseError(`Failed to release savepoint ${name}`, error);
    }
  }

  /**
   * Commit transaction and release client
   * @param {import('pg').PoolClient} client - Database client
   * @returns {Promise<void>}
   */
  static async cleanup(client) {
    try {
      await client.query('COMMIT');
    } catch (error) {
      throw new DatabaseError('Failed to commit test transaction', error);
    } finally {
      client.release();
    }
  }

  /**
   * Rollback transaction and release client
   * @param {import('pg').PoolClient} client - Database client
   * @returns {Promise<void>}
   */
  static async rollback(client) {
    try {
      await client.query('ROLLBACK');
    } catch (error) {
      throw new DatabaseError('Failed to rollback test transaction', error);
    } finally {
      client.release();
    }
  }

  /**
   * Execute query within the test transaction
   * @param {import('pg').PoolClient} client - Database client
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<import('pg').QueryResult>}
   */
  static async query(client, query, params = []) {
    try {
      return await client.query(query, params);
    } catch (error) {
      throw new DatabaseError('Test query execution failed', error);
    }
  }

  /**
   * Clear all test data from specified tables
   * @param {import('pg').PoolClient} client - Database client
   * @param {string[]} tables - Table names to clear
   * @returns {Promise<void>}
   */
  static async clearTables(client, tables) {
    try {
      for (const table of tables) {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      }
    } catch (error) {
      throw new DatabaseError('Failed to clear test tables', error);
    }
  }
}