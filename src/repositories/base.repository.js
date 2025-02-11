import pool from '../config/database.js';
import { DatabaseError } from '../errors/index.js';
import { metrics } from '../utils/metrics.js';
import { logger } from '../utils/logger.js';

/**
 * Base repository class with common database operations
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.client = null;
  }

  /**
   * Initialize schema for this repository
   * @returns {Promise<void>}
   */
  async initializeSchema() {
    const schemaSQL = this.getSchemaSQL();
    if (!schemaSQL) {
      logger.warn('No schema SQL defined', {
        context: {
          repository: this.constructor.name,
          table: this.tableName
        }
      });
      return;
    }

    logger.info('Initializing schema', {
      context: {
        repository: this.constructor.name,
        table: this.tableName
      }
    });

    try {
      await this.executeQuery(schemaSQL);
      
      // Initialize any indexes or triggers
      const additionalSQL = this.getAdditionalSchemaSQL();
      if (additionalSQL) {
        await this.executeQuery(additionalSQL);
      }

      logger.info('Schema initialized successfully', {
        context: {
          repository: this.constructor.name,
          table: this.tableName
        }
      });
    } catch (error) {
      logger.error('Failed to initialize schema', {
        error,
        context: {
          repository: this.constructor.name,
          table: this.tableName
        }
      });
      throw error;
    }
  }

  /**
   * Drop schema for this repository
   * @returns {Promise<void>}
   */
  async dropSchema() {
    logger.info('Dropping schema', {
      context: {
        repository: this.constructor.name,
        table: this.tableName
      }
    });

    try {
      await this.executeQuery(`DROP TABLE IF EXISTS ${this.tableName} CASCADE`);

      logger.info('Schema dropped successfully', {
        context: {
          repository: this.constructor.name,
          table: this.tableName
        }
      });
    } catch (error) {
      logger.error('Failed to drop schema', {
        error,
        context: {
          repository: this.constructor.name,
          table: this.tableName
        }
      });
      throw error;
    }
  }

  /**
   * Get SQL for creating table and constraints
   * @returns {string|null} SQL string or null if not implemented
   */
  getSchemaSQL() {
    return null;
  }

  /**
   * Get additional SQL for indexes, triggers, etc.
   * @returns {string|null} SQL string or null if not needed
   */
  getAdditionalSchemaSQL() {
    return null;
  }

  /**
   * Execute a query with proper error handling and metrics
   * @param {string} sql SQL query
   * @param {Array} params Query parameters
   * @returns {Promise<import('pg').QueryResult>} Query result
   */
  async executeQuery(sql, params = []) {
    const startTime = process.hrtime();
    const client = this.client || pool;

    try {
      const result = await client.query(sql, params);
      const duration = this._getDurationMs(startTime);

      metrics.observe('query_duration', {
        value: duration,
        operation: this._getOperationType(sql),
        status: 'success'
      });

      metrics.observe('query_count', {
        status: 'success'
      });

      return result;
    } catch (error) {
      const duration = this._getDurationMs(startTime);

      metrics.observe('query_duration', {
        value: duration,
        operation: this._getOperationType(sql),
        status: 'error'
      });

      metrics.observe('query_count', {
        status: 'error'
      });

      throw new DatabaseError(error.message, {
        cause: error,
        context: {
          sql,
          params,
          duration,
          table: this.tableName
        }
      });
    }
  }

  /**
   * Execute operations within a transaction
   * @param {Function} operations Function containing operations to execute
   * @returns {Promise<any>} Result of operations
   */
  async withTransaction(operations) {
    const client = await pool.connect();
    this.client = client;

    try {
      await client.query('BEGIN');
      const result = await operations();
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      this.client = null;
      client.release();
    }
  }

  /**
   * Get duration in milliseconds
   * @param {[number, number]} startTime Start time from process.hrtime()
   * @returns {number} Duration in milliseconds
   */
  _getDurationMs(startTime) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return seconds * 1000 + nanoseconds / 1000000;
  }

  /**
   * Get operation type from SQL query
   * @param {string} sql SQL query
   * @returns {string} Operation type (SELECT, INSERT, UPDATE, DELETE)
   */
  _getOperationType(sql) {
    const firstWord = sql.trim().split(' ')[0].toUpperCase();
    return ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(firstWord)
      ? firstWord
      : 'OTHER';
  }
}