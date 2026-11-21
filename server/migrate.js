'use strict';

/**
 * Minimal migration runner: applies server/migrations/*.sql in filename order, each in its
 * own transaction, and records applied files in `schema_migrations`. A session advisory
 * lock keeps concurrent runners from applying the same file twice.
 *
 * CLI: `node server/migrate.js` (uses DATABASE_URL) or `node server/migrate.js <url>`.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createPool, loadEnv, DEFAULT_DATABASE_URL } = require('./db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const LOCK_KEY = 4711_2026;

async function migrate(pool, { log = () => {} } = {}) {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
    const newlyApplied = [];
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`, { cause: err });
      }
      newlyApplied.push(file);
      log(`applied ${file}`);
    }
    return newlyApplied;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
    client.release();
  }
}

if (require.main === module) {
  loadEnv();
  const url = process.argv[2] || process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  const pool = createPool(url);
  migrate(pool, { log: (msg) => process.stdout.write(`${msg}\n`) })
    .then((files) => {
      process.stdout.write(files.length ? `done (${files.length} applied)\n` : 'up to date\n');
    })
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { migrate };
