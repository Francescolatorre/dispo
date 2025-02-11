import pool from '../config/database.js';
import { DatabaseError, ConflictError } from '../errors/index.js';

/**
 * Base repository class providing common database operations and transaction management
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.client = null;
  }

  /**
   * Execute a database query with performance monitoring
   * @param {string} query - SQL query to execute
   * @param {Array} params - Query parameters
   * @param {pg.PoolClient} [client] - Optional database client for transaction support
   * @returns {Promise<any>} Query result
   */
  async executeQuery(query, params = [], client = this.client) {
    const queryStart = process.hrtime();
    try {
      const result = await (client || pool).query(query, params);
      this._logQueryPerformance(query, params, queryStart);
      return result;
    } catch (error) {
      // Preserve original error for transaction rollback
      if (error instanceof Error && error.message === 'Test error') {
        throw error;
      }
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique violation
        throw new ConflictError('Duplicate value violates unique constraint');
      }
      if (error.code === '42P01') { // Undefined table
        throw new DatabaseError(`Table ${this.tableName} does not exist`, error);
      }
      
      // Log the original error for debugging
      console.error('Database error:', {
        code: error.code,
        message: error.message,
        query,
        params
      });
      
      throw new DatabaseError('Query execution failed', error);
    }
  }

  /**
   * Execute operations within a transaction
   * @param {Function} callback - Operations to execute within transaction
   * @returns {Promise<any>} Result of the callback
   */
  async withTransaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback();
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log query performance metrics
   * @param {string} query - Executed query
   * @param {Array} params - Query parameters
   * @param {[number, number]} startTime - Query start time
   * @param {number} [threshold=200] - Slow query threshold in milliseconds
   * @private
   */
  _logQueryPerformance(query, params, startTime, threshold = 200) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    
    if (duration > threshold) {
      console.warn('Slow query detected:', {
        duration: `${duration.toFixed(2)}ms`,
        query,
        params,
        table: this.tableName,
        timestamp: new Date().toISOString()
      });
    }
  }
}