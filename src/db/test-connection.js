const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function testConnection() {
  // First try to connect to postgres database to create our database if needed
  const client = new Client({
    user: String(process.env.DB_USER),
    host: String(process.env.DB_HOST),
    database: 'postgres',
    password: String(process.env.DB_PASSWORD),
    port: Number(process.env.DB_PORT),
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server successfully.');

    // Check if our database exists
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    if (result.rows.length === 0) {
      console.log(`Database ${process.env.DB_NAME} does not exist. Creating it now...`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database ${process.env.DB_NAME} created successfully.`);
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists.`);
    }

    await client.end();

    // Now connect to our database and run the init script
    const appClient = new Client({
      user: String(process.env.DB_USER),
      host: String(process.env.DB_HOST),
      database: String(process.env.DB_NAME),
      password: String(process.env.DB_PASSWORD),
      port: Number(process.env.DB_PORT),
    });

    await appClient.connect();
    console.log(`Connected to ${process.env.DB_NAME} database successfully.`);

    // Drop all tables first
    await appClient.query(`
      DROP TABLE IF EXISTS project_assignments CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS employees CASCADE;
    `);
    console.log('Existing tables dropped successfully.');

    // Read and execute init.sql
    const fs = require('fs');
    const path = require('path');
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    await appClient.query(initSql);
    console.log('Database schema initialized successfully.');

    await appClient.end();
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
}

testConnection();
