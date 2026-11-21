'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { setupApi, employeeInput, seedPair } = require('./helpers');

const ctx = setupApi();

describe('employees', () => {
  it('creates with a generated UUID and lists sorted by name', async () => {
    const created = await ctx.api.post('/api/employees').send(employeeInput({ name: 'Zoe', capacity: 0.5 })).expect(201);
    assert.match(created.body.id, /^[0-9a-f-]{36}$/);
    assert.deepEqual(created.body, {
      id: created.body.id,
      name: 'Zoe',
      role: 'Frontend',
      seniority: 'senior',
      capacity: 0.5,
      active: true,
    });
    await ctx.api.post('/api/employees').send(employeeInput({ name: 'Anna' })).expect(201);
    const list = await ctx.api.get('/api/employees').expect(200);
    assert.deepEqual(list.body.map((e) => e.name), ['Anna', 'Zoe']);
    assert.equal(typeof list.body[1].capacity, 'number');
  });

  it('accepts a client-supplied id and defaults active to true', async () => {
    const input = employeeInput({ id: 'emp-1' });
    delete input.active;
    const res = await ctx.api.post('/api/employees').send(input).expect(201);
    assert.equal(res.body.id, 'emp-1');
    assert.equal(res.body.active, true);
  });

  it('rejects a duplicate client-supplied id with 409', async () => {
    await ctx.api.post('/api/employees').send(employeeInput({ id: 'emp-1' })).expect(201);
    const res = await ctx.api.post('/api/employees').send(employeeInput({ id: 'emp-1' })).expect(409);
    assert.equal(res.body.error.code, 'CONFLICT');
  });

  it('updates with patch semantics', async () => {
    const { body: emp } = await ctx.api.post('/api/employees').send(employeeInput()).expect(201);
    const res = await ctx.api.put(`/api/employees/${emp.id}`).send({ capacity: 0.8, active: false }).expect(200);
    assert.deepEqual(res.body, { ...emp, capacity: 0.8, active: false });
    const empty = await ctx.api.put(`/api/employees/${emp.id}`).send({}).expect(200);
    assert.deepEqual(empty.body, res.body);
  });

  it('returns 400 VALIDATION with details for bad input', async () => {
    const res = await ctx.api
      .post('/api/employees')
      .send({ name: '', seniority: 'guru', capacity: 1.5, active: 'yes', id: 'has space' })
      .expect(400);
    assert.equal(res.body.error.code, 'VALIDATION');
    const fields = res.body.error.details.map((d) => d.field).sort();
    assert.deepEqual(fields, ['active', 'capacity', 'id', 'name', 'role', 'seniority']);
    assert.equal(res.body.error.stack, undefined);

    await ctx.api.post('/api/employees').send(employeeInput({ capacity: 0.05 })).expect(400);
    const { body: emp } = await ctx.api.post('/api/employees').send(employeeInput()).expect(201);
    await ctx.api.put(`/api/employees/${emp.id}`).send({ name: null }).expect(400);
    await ctx.api.put(`/api/employees/${emp.id}`).send([1, 2]).expect(400);
  });

  it('returns 404 for unknown ids on PUT and DELETE', async () => {
    const put = await ctx.api.put('/api/employees/nope').send({ name: 'X' }).expect(404);
    assert.deepEqual(put.body, { error: { code: 'NOT_FOUND', message: 'employee "nope" not found' } });
    await ctx.api.delete('/api/employees/nope').expect(404);
  });

  it('deletes with 204 and cascades to assignments', async () => {
    const { emp, input } = await seedPair(ctx.api);
    await ctx.api.post('/api/assignments').send(input).expect(201);
    await ctx.api.delete(`/api/employees/${emp.id}`).expect(204);
    assert.deepEqual((await ctx.api.get('/api/employees').expect(200)).body, []);
    assert.deepEqual((await ctx.api.get('/api/assignments').expect(200)).body, []);
  });
});
