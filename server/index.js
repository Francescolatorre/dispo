'use strict';

const { createApp } = require('./app');
const { createPool, loadEnv, DEFAULT_DATABASE_URL } = require('./db');

loadEnv();

const port = Number(process.env.PORT) || 3001;
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const pool = createPool(process.env.DATABASE_URL || DEFAULT_DATABASE_URL);

const server = createApp({ pool, corsOrigins }).listen(port, () => {
  process.stdout.write(`DispoMVP API listening on http://localhost:${port}/api\n`);
});

function shutdown() {
  server.close(() => pool.end().finally(() => process.exit(0)));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
