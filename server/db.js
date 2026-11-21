'use strict';

const pg = require('pg');

// DATE (oid 1082): keep the raw 'YYYY-MM-DD' string. The default parser builds a
// local-midnight JS Date, which JSON-serialises as UTC and shifts the day.
pg.types.setTypeParser(1082, (value) => value);
// NUMERIC (oid 1700): only used for employees.capacity (numeric(3,2)) -> JS number.
pg.types.setTypeParser(1700, (value) => Number.parseFloat(value));

const DEFAULT_DATABASE_URL = 'postgres://dispo:dispo@localhost:5433/dispo';
const DEFAULT_TEST_DATABASE_URL = 'postgres://dispo:dispo@localhost:5433/dispo_test';

/** Loads `.env` from the working directory if present (Node >= 20.12 built-in). */
function loadEnv() {
  try {
    process.loadEnvFile();
  } catch {
    // no .env file - rely on the real environment / defaults
  }
}

function createPool(connectionString) {
  return new pg.Pool({ connectionString, max: 10 });
}

module.exports = { createPool, loadEnv, DEFAULT_DATABASE_URL, DEFAULT_TEST_DATABASE_URL };
