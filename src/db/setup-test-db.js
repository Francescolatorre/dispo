import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { testDb } from '../test/TestDatabaseManager.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: join(__dirname, '../../.env.test') });

/**
 * Set up test database with required tables and functions
 */
export async function setupTestDb() {
  try {
    // Initialize database through repository layer
    await testDb.setup();
    console.log('Test database setup complete');
  } catch (error) {
    logger.error('Failed to set up test database', {
      error,
      context: {
        service: 'setupTestDb',
        operation: 'setup'
      }
    });
    throw error;
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestDb().catch(error => {
    console.error('Failed to set up test database:', error);
    process.exit(1);
  });
}