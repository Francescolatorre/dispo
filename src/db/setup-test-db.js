import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

async function setupTestDb() {
  // First connect to postgres database to create test database
  const postgresPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Create test database if it doesn't exist
    await postgresPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'dispo_test'
      AND pid <> pg_backend_pid();
    `);
    
    await postgresPool.query('DROP DATABASE IF EXISTS dispo_test');
    await postgresPool.query('CREATE DATABASE dispo_test');
    
    await postgresPool.end();

    // Connect to test database
    const testPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: 'dispo_test',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });

    // Read and execute SQL setup file
    const sqlSetup = fs.readFileSync(path.join(__dirname, 'setup-test-db.sql'), 'utf8');
    
    // Split into individual statements
    const statements = sqlSetup
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await testPool.query(statement);
    }

    console.log('Test database setup complete');
    await testPool.end();
  } catch (error) {
    console.error('Error setting up test database:', error);
    await postgresPool.end();
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupTestDb();
}

export default setupTestDb;