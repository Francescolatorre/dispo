'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupApi } = require('./helpers');
const { createApp } = require('../app');
const { createPool } = require('../db');
const { migrate } = require('../migrate');

const ctx = setupApi();

describe('app', () => {
  it('GET /api/health reports the database as ok', async () => {
    const res = await ctx.api.get('/api/health').expect(200);
    assert.deepEqual(res.body, { status: 'ok', db: 'ok' });
  });

  it('GET /api/health returns 503 when the database is unreachable', async () => {
    const pool = createPool('postgres://dispo:dispo@127.0.0.1:1/none');
    try {
      const res = await request(createApp({ pool })).get('/api/health').expect(503);
      assert.equal(res.body.db, 'unreachable');
    } finally {
      await pool.end();
    }
  });

  it('unknown /api routes return a JSON 404', async () => {
    const res = await ctx.api.get('/api/nope').expect(404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('malformed JSON returns 400 without leaking a stack trace', async () => {
    const res = await ctx.api
      .post('/api/employees')
      .set('Content-Type', 'application/json')
      .send('{"name": ')
      .expect(400);
    assert.equal(res.body.error.code, 'VALIDATION');
    assert.doesNotMatch(JSON.stringify(res.body), /at .*\.js/);
  });

  it('allows CORS from the Vite dev server only', async () => {
    const ok = await ctx.api.get('/api/employees').set('Origin', 'http://localhost:5173').expect(200);
    assert.equal(ok.headers['access-control-allow-origin'], 'http://localhost:5173');
    const other = await ctx.api.get('/api/employees').set('Origin', 'http://evil.example').expect(200);
    assert.equal(other.headers['access-control-allow-origin'], undefined);
  });

  it('migrations are idempotent', async () => {
    assert.deepEqual(await migrate(ctx.pool), []);
    const { rows } = await ctx.pool.query('SELECT name FROM schema_migrations ORDER BY name');
    assert.deepEqual(rows.map((r) => r.name), ['001_init.sql']);
  });
});
