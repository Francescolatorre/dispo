import { testDb } from '../../test/TestDatabaseManager.js';
import { logger } from '../../utils/logger.js';
import { metrics } from '../../utils/metrics.js';

/**
 * Set up test database with proper error handling
 * @returns {Promise<void>}
 */
export async function setupTestDb() {
  const startTime = process.hrtime();

  logger.info('Setting up test database', {
    context: {
      operation: 'setupTestDb',
      service: 'TestSetup'
    }
  });

  try {
    await testDb.setup();

    const duration = getDurationMs(startTime);
    metrics.observe('test_setup_duration', {
      value: duration,
      operation: 'setup'
    });

    logger.info('Test database setup completed', {
      context: {
        duration,
        service: 'TestSetup'
      }
    });
  } catch (error) {
    const duration = getDurationMs(startTime);
    metrics.observe('test_setup_duration', {
      value: duration,
      operation: 'setup',
      status: 'error'
    });

    logger.error('Test database setup failed', {
      error,
      context: {
        duration,
        service: 'TestSetup'
      }
    });
    throw error;
  }
}

/**
 * Clean test database with proper error handling
 * @returns {Promise<void>}
 */
export async function cleanTestDb() {
  const startTime = process.hrtime();

  logger.info('Cleaning test database', {
    context: {
      operation: 'cleanTestDb',
      service: 'TestSetup'
    }
  });

  try {
    await testDb.cleanup();

    const duration = getDurationMs(startTime);
    metrics.observe('test_cleanup_duration', {
      value: duration,
      operation: 'cleanup'
    });

    logger.info('Test database cleanup completed', {
      context: {
        duration,
        service: 'TestSetup'
      }
    });
  } catch (error) {
    const duration = getDurationMs(startTime);
    metrics.observe('test_cleanup_duration', {
      value: duration,
      operation: 'cleanup',
      status: 'error'
    });

    logger.error('Test database cleanup failed', {
      error,
      context: {
        duration,
        service: 'TestSetup'
      }
    });
    throw error;
  }
}

/**
 * Create a test transaction
 * @returns {Promise<import('pg').PoolClient>} Database client with active transaction
 */
export async function createTestTransaction() {
  const startTime = process.hrtime();

  logger.info('Creating test transaction', {
    context: {
      operation: 'createTestTransaction',
      service: 'TestSetup'
    }
  });

  try {
    const client = await testDb.createTransaction();

    const duration = getDurationMs(startTime);
    metrics.observe('test_transaction_duration', {
      value: duration,
      operation: 'create'
    });

    return client;
  } catch (error) {
    const duration = getDurationMs(startTime);
    metrics.observe('test_transaction_duration', {
      value: duration,
      operation: 'create',
      status: 'error'
    });

    logger.error('Failed to create test transaction', {
      error,
      context: {
        duration,
        service: 'TestSetup'
      }
    });
    throw error;
  }
}

/**
 * Create test data factory
 * @param {string} type Repository type
 * @param {import('pg').PoolClient} [client] Optional database client for transactions
 * @returns {Object} Test data factory
 */
export function createTestDataFactory(type, client = null) {
  return testDb.createDataFactory(type, client);
}

/**
 * Get duration in milliseconds
 * @param {[number, number]} startTime Start time from process.hrtime()
 * @returns {number} Duration in milliseconds
 */
function getDurationMs(startTime) {
  const [seconds, nanoseconds] = process.hrtime(startTime);
  return seconds * 1000 + nanoseconds / 1000000;
}

// Export singleton instance for convenience
export { testDb };