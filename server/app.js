'use strict';

const express = require('express');
const cors = require('cors');
const resources = require('./resources');
const { crudRouter } = require('./crud');
const { ApiError, errorHandler } = require('./errors');

/**
 * @param {{ pool: import('pg').Pool, corsOrigins?: string[] }} options
 */
function createApp({ pool, corsOrigins = ['http://localhost:5173'] }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'ok' });
    } catch {
      res.status(503).json({ status: 'error', db: 'unreachable' });
    }
  });
  api.use('/employees', crudRouter(pool, resources.employees));
  api.use('/projects', crudRouter(pool, resources.projects));
  api.use('/assignments', crudRouter(pool, resources.assignments));
  api.use((req, _res, next) => next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`)));

  app.use('/api', api);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
