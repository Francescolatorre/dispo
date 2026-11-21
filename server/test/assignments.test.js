'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { setupApi, employeeInput, projectInput, seedPair } = require('./helpers');

const ctx = setupApi();

describe('assignments', () => {
  it('creates without role (role omitted in JSON) and with role', async () => {
    const { input } = await seedPair(ctx.api);
    const res = await ctx.api.post('/api/assignments').send(input).expect(201);
    assert.match(res.body.id, /^[0-9a-f-]{36}$/);
    assert.deepEqual(res.body, { id: res.body.id, ...input });
    assert.equal('role' in res.body, false);

    const withRole = await ctx.api.post('/api/assignments').send({ ...input, role: 'Tech Lead' }).expect(201);
    assert.equal(withRole.body.role, 'Tech Lead');
  });

  it('accepts a client-supplied id (undo re-creates with the same id)', async () => {
    const { input } = await seedPair(ctx.api);
    const first = await ctx.api.post('/api/assignments').send({ ...input, id: 'asg-1' }).expect(201);
    await ctx.api.delete('/api/assignments/asg-1').expect(204);
    const again = await ctx.api.post('/api/assignments').send({ ...input, id: 'asg-1' }).expect(201);
    assert.deepEqual(again.body, first.body);
  });

  it('updates with patch semantics; role null clears, omitted keeps', async () => {
    const { input } = await seedPair(ctx.api);
    const { body: asg } = await ctx.api.post('/api/assignments').send({ ...input, role: 'QA' }).expect(201);

    const moved = await ctx.api.put(`/api/assignments/${asg.id}`).send({ start: '2026-04-06', end: '2026-04-30' }).expect(200);
    assert.deepEqual(moved.body, { ...asg, start: '2026-04-06', end: '2026-04-30' });

    const resized = await ctx.api.put(`/api/assignments/${asg.id}`).send({ allocation: 100 }).expect(200);
    assert.equal(resized.body.role, 'QA');
    assert.equal(resized.body.allocation, 100);

    const cleared = await ctx.api.put(`/api/assignments/${asg.id}`).send({ role: null }).expect(200);
    assert.equal('role' in cleared.body, false);
  });

  it('can move an assignment to another employee and rejects unknown FKs with 400', async () => {
    const { input } = await seedPair(ctx.api);
    const { body: asg } = await ctx.api.post('/api/assignments').send(input).expect(201);
    const { body: other } = await ctx.api.post('/api/employees').send(employeeInput({ name: 'Ben' })).expect(201);
    const res = await ctx.api.put(`/api/assignments/${asg.id}`).send({ employeeId: other.id }).expect(200);
    assert.equal(res.body.employeeId, other.id);

    const badEmp = await ctx.api.put(`/api/assignments/${asg.id}`).send({ employeeId: 'ghost' }).expect(400);
    assert.deepEqual(badEmp.body.error.details, [{ field: 'employeeId', message: 'references a non-existent record' }]);
    const badPrj = await ctx.api.post('/api/assignments').send({ ...input, projectId: 'ghost' }).expect(400);
    assert.equal(badPrj.body.error.details[0].field, 'projectId');
  });

  it('validates allocation range/step, dates and end >= start', async () => {
    const { input, emp } = await seedPair(ctx.api);
    for (const over of [
      { allocation: 0 },
      { allocation: 5 },
      { allocation: 55 },
      { allocation: 110 },
      { allocation: '50' },
      { start: '2026-13-01' },
      { start: '2026-03-10', end: '2026-03-09' },
      { role: 42 },
      { employeeId: undefined },
    ]) {
      const res = await ctx.api.post('/api/assignments').send({ ...input, ...over }).expect(400);
      assert.equal(res.body.error.code, 'VALIDATION', JSON.stringify(over));
    }
    const { body: asg } = await ctx.api.post('/api/assignments').send(input).expect(201);
    await ctx.api.put(`/api/assignments/${asg.id}`).send({ end: '2026-03-01' }).expect(400);
    await ctx.api.put(`/api/assignments/${asg.id}`).send({ allocation: 15 }).expect(400);
    // single-day assignment is allowed
    await ctx.api.post('/api/assignments').send({ ...input, employeeId: emp.id, start: '2026-03-02', end: '2026-03-02' }).expect(201);
  });

  it('does not block overbooking (workload is a client-side warning)', async () => {
    const { input } = await seedPair(ctx.api);
    await ctx.api.post('/api/assignments').send({ ...input, allocation: 100 }).expect(201);
    await ctx.api.post('/api/assignments').send({ ...input, allocation: 100 }).expect(201);
  });

  it('filters by overlapping range (inclusive) and by employee/project', async () => {
    const { emp, prj, input } = await seedPair(ctx.api);
    const { body: emp2 } = await ctx.api.post('/api/employees').send(employeeInput({ name: 'Ben' })).expect(201);
    const { body: prj2 } = await ctx.api.post('/api/projects').send(projectInput({ name: 'Zeus' })).expect(201);
    const mk = (id, start, end, over = {}) =>
      ctx.api.post('/api/assignments').send({ ...input, id, start, end, ...over }).expect(201);
    await mk('a-jan', '2026-01-05', '2026-01-30');
    await mk('a-feb', '2026-02-02', '2026-02-27', { employeeId: emp2.id });
    await mk('a-mar', '2026-03-02', '2026-03-27', { projectId: prj2.id });
    await mk('a-long', '2026-01-01', '2026-12-31');

    const ids = async (qs) => (await ctx.api.get(`/api/assignments${qs}`).expect(200)).body.map((a) => a.id).sort();

    assert.deepEqual(await ids(''), ['a-feb', 'a-jan', 'a-long', 'a-mar']);
    // inclusive bounds: an assignment ending exactly on `from` / starting exactly on `to` overlaps
    assert.deepEqual(await ids('?from=2026-01-30&to=2026-02-02'), ['a-feb', 'a-jan', 'a-long']);
    assert.deepEqual(await ids('?from=2026-01-31&to=2026-02-01'), ['a-long']);
    assert.deepEqual(await ids('?from=2026-03-01'), ['a-long', 'a-mar']);
    assert.deepEqual(await ids('?to=2026-01-04'), ['a-long']);
    assert.deepEqual(await ids(`?employeeId=${emp2.id}`), ['a-feb']);
    assert.deepEqual(await ids(`?projectId=${prj2.id}`), ['a-mar']);
    assert.deepEqual(await ids(`?employeeId=${emp.id}&projectId=${prj.id}&from=2026-01-10&to=2026-01-20`), ['a-jan', 'a-long']);
    assert.deepEqual(await ids('?employeeId=unknown'), []);
  });

  it('rejects malformed list queries with 400', async () => {
    for (const qs of ['?from=2026-02-30', '?to=yesterday', '?from=2026-02-01&to=2026-01-01', '?from=2026-01-01&from=2026-02-01']) {
      const res = await ctx.api.get(`/api/assignments${qs}`).expect(400);
      assert.equal(res.body.error.code, 'VALIDATION', qs);
    }
  });

  it('returns 404 for unknown ids on PUT and DELETE', async () => {
    const res = await ctx.api.put('/api/assignments/nope').send({ allocation: 50 }).expect(404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    await ctx.api.delete('/api/assignments/nope').expect(404);
  });
});
