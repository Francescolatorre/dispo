// @ts-check
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const envFile = join(rootDir, '..', '.env.test');

// Check for required environment file
if (!existsSync(envFile)) {
  console.error('Error: .env.test file not found');
  console.error('Please create .env.test file with required test environment variables');
  process.exit(1);
}

// Load and verify environment variables
dotenv.config({ path: envFile });

const requiredVars = [
  'TEST_PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  process.exit(1);
}

// Verify test database connection
async function verifyConnection() {
  try {
    const pool = new pg.Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await pool.query('SELECT NOW()');
    await pool.end();
    
    console.log('Test environment verification successful');
  } catch (error) {
    console.error('Error: Failed to connect to test database');
    console.error(error.message);
    process.exit(1);
  }
}

verifyConnection();