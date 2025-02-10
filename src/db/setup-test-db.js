const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function setupTestDb() {
  const testPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Drop existing tables if they exist
    await testPool.query('DROP TABLE IF EXISTS project_assignments CASCADE');
    await testPool.query('DROP TABLE IF EXISTS project_requirements CASCADE');
    await testPool.query('DROP TABLE IF EXISTS projects CASCADE');
    await testPool.query('DROP TABLE IF EXISTS employees CASCADE');
    await testPool.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('Dropped existing tables');

    // Create tables
    await testPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        employee_number VARCHAR(20) NOT NULL,
        entry_date DATE NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        position VARCHAR(100) NOT NULL,
        seniority_level VARCHAR(50) NOT NULL,
        level_code VARCHAR(10) NOT NULL,
        qualifications TEXT[] NOT NULL DEFAULT '{}',
        work_time_factor DECIMAL(3,2) NOT NULL CHECK (work_time_factor > 0 AND work_time_factor <= 1),
        contract_end_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        part_time_factor DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (part_time_factor BETWEEN 0.00 AND 100.00),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        project_number VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        location VARCHAR(100) NOT NULL,
        fte_count INTEGER NOT NULL,
        project_manager_id INTEGER NOT NULL REFERENCES employees(id),
        documentation_links TEXT[] NOT NULL DEFAULT '{}',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CHECK (end_date >= start_date)
      );

      CREATE TABLE IF NOT EXISTS project_requirements (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        role VARCHAR(100) NOT NULL,
        seniority_level VARCHAR(50) NOT NULL,
        required_qualifications TEXT[] NOT NULL DEFAULT '{}',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CHECK (end_date >= start_date)
      );

      CREATE TABLE IF NOT EXISTS project_assignments (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        requirement_id INTEGER REFERENCES project_requirements(id),
        allocation_percentage DECIMAL(5,2) NOT NULL CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
        role VARCHAR(255),
        dr_status VARCHAR(10),
        position_status VARCHAR(10),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        termination_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CHECK (end_date >= start_date)
      );

      -- Create sequence for test employee numbers
      CREATE SEQUENCE IF NOT EXISTS test_employee_number_seq;
    `);
    console.log('Created tables');

    // Create test helper functions
    await testPool.query(`
      CREATE OR REPLACE FUNCTION get_test_employee_number()
      RETURNS VARCHAR AS $$
      BEGIN
        RETURN 'EMP-TEST-' || nextval('test_employee_number_seq');
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Created helper functions');

    await testPool.end();
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Error setting up test database:', error);
    await testPool.end();
    process.exit(1);
  }
}

setupTestDb();