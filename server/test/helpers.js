'use strict';

/**
 * Shared integration-test setup: real Postgres (TEST_DATABASE_URL, default: the dispo_test
 * database of the docker-compose container), migrations applied once per file, all tables
 * truncated before every test. Test files run sequentially (--test-concurrency=1).
 */
const { before, beforeEach, after } = require('node:test');
const request = require('supertest');
const { createApp } = require('../app');
const { createPool, loadEnv, DEFAULT_TEST_DATABASE_URL } = require('../db');
const { migrate } = require('../migrate');

// Run in a timezone with DST so a Date-based date parser would visibly shift days.
process.env.TZ = 'Europe/Berlin';
loadEnv();

function setupApi() {
  const ctx = { pool: null, api: null };
  before(async () => {
    ctx.pool = createPool(process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL);
    await migrate(ctx.pool);
    ctx.api = request(createApp({ pool: ctx.pool }));
  });
  beforeEach(async () => {
    await ctx.pool.query('TRUNCATE assignments, projects, employees');
  });
  after(async () => {
    await ctx.pool?.end();
  });
  return ctx;
}

const employeeInput = (over = {}) => ({
  name: 'Anna Schmidt',
  role: 'Frontend',
  seniority: 'senior',
  capacity: 1,
  active: true,
  ...over,
});

const projectInput = (over = {}) => ({
  name: 'Apollo',
  color: 'blue',
  start: '2026-01-05',
  end: '2026-12-31',
  status: 'active',
  ...over,
});

/** Creates an employee and a project and returns a valid assignment input for them. */
async function seedPair(api, over = {}) {
  const emp = (await api.post('/api/employees').send(employeeInput()).expect(201)).body;
  const prj = (await api.post('/api/projects').send(projectInput()).expect(201)).body;
  return {
    emp,
    prj,
    input: { employeeId: emp.id, projectId: prj.id, start: '2026-03-02', end: '2026-03-27', allocation: 50, ...over },
  };
}

module.exports = { setupApi, employeeInput, projectInput, seedPair };
