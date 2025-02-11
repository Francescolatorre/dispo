mport pool from '../config/database.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';
import { UserRepository } from '../repositories/user.repository.js';
import { EmployeeRepository } from '../repositories/employee.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { RequirementRepository } from '../repositories/requirement.repository.js';

/**
 * Manages test database operations with proper transaction handling and cleanup
 */
export class TestDatabaseManager {
  constructor() {
    // Initialize repositories in dependency order
    this.repositories = {
      user: new UserRepository(),
      employee: new EmployeeRepository(),
      project: new ProjectRepository(),
      requirement: new RequirementRepository()
    };
  }

  /**
   * Initialize test database
   * @returns {Promise<void>}
   */
  async setup() {
    logger.info('Setting up test database', {
      context: {
        operation: 'setup',
        service: 'TestDatabaseManager'
      }
    });

    const startTime = process.hrtime();

    try {
      // Drop existing schemas in reverse dependency order
      await this._dropSchemas();

      // Initialize schemas in dependency order
      await this._initializeSchemas();

      const duration = this._getDurationMs(startTime);
      metrics.observe('test_database_setup', {
        value: duration,
        operation: 'setup'
      });

      logger.info('Test database setup completed', {
        context: {
          duration,
          service: 'TestDatabaseManager'
        }
      });
    } catch (error) {
      logger.error('Test database setup failed', {
        error,
        context: {
          service: 'TestDatabaseManager',
          operation: 'setup'
        }
      });
      throw error;
    }
  }

  /**
   * Drop schemas in reverse dependency order
   * @returns {Promise<void>}
   */
  async _dropSchemas() {
    logger.info('Dropping existing schemas', {
      context: {
        operation: 'dropSchemas',
        service: 'TestDatabaseManager'
      }
    });

    // Drop in reverse order to handle dependencies
    await this.repositories.requirement.dropSchema();
    await this.repositories.project.dropSchema();
    await this.repositories.employee.dropSchema();
    await this.repositories.user.dropSchema();
  }

  /**
   * Initialize schemas in dependency order
   * @returns {Promise<void>}
   */
  async _initializeSchemas() {
    logger.info('Initializing schemas', {
      context: {
        operation: 'initializeSchemas',
        service: 'TestDatabaseManager'
      }
    });

    // Initialize in order to handle dependencies
    await this.repositories.user.initializeSchema();
    await this.repositories.employee.initializeSchema();
    await this.repositories.project.initializeSchema();
    await this.repositories.requirement.initializeSchema();
  }

  /**
   * Create a new transaction
   * @returns {Promise<import('pg').PoolClient>} Database client with active transaction
   */
  async createTransaction() {
    const startTime = process.hrtime();

    try {
      const client = await pool.connect();
      await client.query('BEGIN');

      const duration = this._getDurationMs(startTime);
      metrics.observe('test_transaction_duration', {
        value: duration,
        operation: 'create_transaction'
      });

      return client;
    } catch (error) {
      logger.error('Failed to create transaction', {
        error,
        context: {
          service: 'TestDatabaseManager',
          operation: 'createTransaction'
        }
      });
      throw error;
    }
  }

  /**
   * Clean test data with proper error handling
   * @returns {Promise<void>}
   */
  async cleanup() {
    logger.info('Cleaning test database', {
      context: {
        operation: 'cleanup',
        service: 'TestDatabaseManager'
      }
    });

    const startTime = process.hrtime();

    try {
      const client = await this.createTransaction();

      try {
        // Delete in correct order to handle foreign key constraints
        await this.repositories.requirement.dropSchema();
        await this.repositories.project.dropSchema();
        await this.repositories.employee.dropSchema();
        await this.repositories.user.dropSchema();

        await client.query('COMMIT');

        const duration = this._getDurationMs(startTime);
        metrics.observe('test_database_cleanup', {
          value: duration,
          operation: 'cleanup'
        });

        logger.info('Test database cleanup completed', {
          context: {
            duration,
            service: 'TestDatabaseManager'
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Test database cleanup failed', {
        error,
        context: {
          service: 'TestDatabaseManager',
          operation: 'cleanup'
        }
      });
      throw error;
    }
  }

  /**
   * Create test data factory for a specific repository
   * @param {string} type Repository type ('user', 'employee', 'project', 'requirement')
   * @param {import('pg').PoolClient} [client] Optional database client for transactions
   * @returns {Object} Test data factory
   */
  createDataFactory(type, client = null) {
    const repository = this.repositories[type];
    if (!repository) {
      throw new Error(`Unknown repository type: ${type}`);
    }

    if (client) {
      repository.client = client;
    }

    return repository;
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
}

// Export singleton instance for convenience
export const testDb = new TestDatabaseManager();