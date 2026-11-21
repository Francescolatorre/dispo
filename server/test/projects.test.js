'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { setupApi, projectInput, seedPair } = require('./helpers');

const ctx = setupApi();

describe('projects', () => {
  it('creates, lists (by start date) and returns dates as YYYY-MM-DD', async () => {
    const late = await ctx.api.post('/api/projects').send(projectInput({ name: 'Late', start: '2026-06-01' })).expect(201);
    assert.deepEqual(late.body, {
      id: late.body.id,
      name: 'Late',
      color: 'blue',
      start: '2026-06-01',
      end: '2026-12-31',
      status: 'active',
    });
    await ctx.api.post('/api/projects').send(projectInput({ id: 'prj-1', name: 'Early', start: '2026-01-05' })).expect(201);
    const list = await ctx.api.get('/api/projects').expect(200);
    assert.deepEqual(list.body.map((p) => p.id), ['prj-1', late.body.id]);
  });

  it('round-trips dates around the DST switch and year boundaries without shifting', async () => {
    for (const [start, end] of [
      ['2026-03-29', '2026-03-29'], // CET -> CEST switch
      ['2026-10-25', '2026-10-25'], // CEST -> CET switch
      ['2025-12-31', '2026-01-01'],
      ['2028-02-29', '2028-02-29'],
    ]) {
      const { body } = await ctx.api.post('/api/projects').send(projectInput({ start, end })).expect(201);
      assert.equal(body.start, start);
      assert.equal(body.end, end);
      const { body: list } = await ctx.api.get('/api/projects').expect(200);
      const found = list.find((p) => p.id === body.id);
      assert.equal(found.start, start);
      assert.equal(found.end, end);
    }
  });

  it('updates with patch semantics and validates end >= start against stored values', async () => {
    const { body: prj } = await ctx.api.post('/api/projects').send(projectInput()).expect(201);
    const res = await ctx.api.put(`/api/projects/${prj.id}`).send({ status: 'done', color: 'teal' }).expect(200);
    assert.deepEqual(res.body, { ...prj, status: 'done', color: 'teal' });

    const bad = await ctx.api.put(`/api/projects/${prj.id}`).send({ end: '2026-01-01' }).expect(400);
    assert.deepEqual(bad.body.error.details, [{ field: 'end', message: 'must be on or after start' }]);
  });

  it('rejects invalid dates, end < start and unknown status', async () => {
    for (const over of [
      { start: '2026-02-30' },
      { start: '2026-3-1' },
      { end: '2026-01-31T00:00:00Z' },
      { start: '2026-05-01', end: '2026-04-30' },
      { status: 'archived' },
      { color: '' },
    ]) {
      const res = await ctx.api.post('/api/projects').send(projectInput(over)).expect(400);
      assert.equal(res.body.error.code, 'VALIDATION', JSON.stringify(over));
    }
  });

  it('returns 404 for unknown ids and cascades assignments on delete', async () => {
    await ctx.api.put('/api/projects/nope').send({ name: 'X' }).expect(404);
    await ctx.api.delete('/api/projects/nope').expect(404);

    const { prj, input } = await seedPair(ctx.api);
    await ctx.api.post('/api/assignments').send(input).expect(201);
    await ctx.api.delete(`/api/projects/${prj.id}`).expect(204);
    assert.deepEqual((await ctx.api.get('/api/assignments').expect(200)).body, []);
    assert.equal((await ctx.api.get('/api/employees').expect(200)).body.length, 1);
  });
});
