import pool from '../../config/database.js';

export async function setupTestDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop existing tables and functions
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');

    // Create trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create users table with email uniqueness constraint
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT users_email_unique UNIQUE (email)
      )
    `);

    // Create trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export a function to clean the database
export async function cleanTestDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM users');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cleaning test database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run setup before tests
if (require.main === module) {
  setupTestDb()
    .then(() => console.log('Test database setup complete'))
    .catch(console.error)
    .finally(() => pool.end());
}