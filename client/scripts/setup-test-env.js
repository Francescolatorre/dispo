// @ts-check
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const envFile = join(rootDir, '..', '.env.test');

// Create test environment variables if they don't exist
if (!existsSync(envFile)) {
  const testEnvContent = `
# Server Configuration
PORT=3001
NODE_ENV=test

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dispo_test
DB_USER=postgres
DB_PASSWORD=postgres

# Test Configuration
TEST_PORT=3001

# JWT Configuration
JWT_SECRET=test-secret-key

# Client Configuration
VITE_API_URL=http://localhost:3001/api
`.trim();

  try {
    writeFileSync(envFile, testEnvContent);
    console.log('.env.test file created successfully');
  } catch (error) {
    console.error('Error creating .env.test file:', error.message);
    process.exit(1);
  }
}

// Create test results directory if it doesn't exist
const testResultsDir = join(rootDir, 'test-results');
if (!existsSync(testResultsDir)) {
  try {
    mkdirSync(testResultsDir, { recursive: true });
    console.log('Test results directory created successfully');
  } catch (error) {
    console.error('Error creating test results directory:', error.message);
    process.exit(1);
  }
}

// Create test database setup
const setupTestDb = async () => {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: 'postgres', // Connect to default db to create test db
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    // Create test database if it doesn't exist
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'dispo_test'"
    );

    if (result.rows.length === 0) {
      await pool.query('CREATE DATABASE dispo_test');
      console.log('Test database created successfully');
    }

    await pool.end();
    console.log('Test environment setup completed successfully');
  } catch (error) {
    console.error('Error setting up test database:', error.message);
    process.exit(1);
  }
};

setupTestDb();