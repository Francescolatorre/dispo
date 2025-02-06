const { Pool } = require('pg');
const format = require('pg-format');
require('dotenv').config();

// Test database configuration
const testConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'dispo_test'
};

// Create a new pool for test database
const pool = new Pool(testConfig);

// Helper functions for tests
async function setupTestDb() {
  try {
    // Create test database if it doesn't exist
    const client = await new Pool({
      ...testConfig,
      database: process.env.DB_NAME || 'postgres'
    }).connect();
    
    await client.query('DROP DATABASE IF EXISTS dispo_test');
    await client.query('CREATE DATABASE dispo_test');
    await client.end();

    // Initialize schema
    const initSql = require('fs').readFileSync(require('path').join(__dirname, '../init.sql'), 'utf8');
    await pool.query(initSql);

    // Run our new migration
    const migrationSql = require('fs').readFileSync(require('path').join(__dirname, '../migrations/001_add_project_requirements.sql'), 'utf8');
    await pool.query(migrationSql);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

async function teardownTestDb() {
  try {
    await pool.end();
    
    // Connect to default database to drop test database
    const client = await new Pool({
      ...testConfig,
      database: process.env.DB_NAME || 'postgres'
    }).connect();
    
    await client.query('DROP DATABASE IF EXISTS dispo_test');
    await client.end();
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
}

// Helper to run a migration file
async function runMigration(filepath) {
  const sql = require('fs').readFileSync(filepath, 'utf8');
  return pool.query(sql);
}

// Helper to insert test data
async function insertTestData(table, data) {
  if (!data || !data.length) return;
  
  const columns = Object.keys(data[0]);
  const values = data.map(obj => columns.map(col => obj[col]));
  
  const sql = format(
    'INSERT INTO %I (%I) VALUES %L RETURNING *',
    table,
    columns,
    values
  );
  
  return pool.query(sql);
}

module.exports = {
  pool,
  setupTestDb,
  teardownTestDb,
  runMigration,
  insertTestData
};