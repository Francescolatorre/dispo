'use strict';

const express = require('express');
const v = require('./validation');
const { notFound, validationError } = require('./errors');

/** Express 4 does not forward rejected promises to the error handler by itself. */
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

async function withTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Validates a request body against a resource definition.
 * partial=false (POST): required fields must be present, defaults applied, optional `id` allowed.
 * partial=true (PUT): patch semantics - omitted fields stay unchanged.
 */
function parseBody(def, body, { partial }) {
  if (!v.isPlainObject(body)) throw validationError([{ field: null, message: 'body must be a JSON object' }]);
  const details = [];
  const values = {};
  if (!partial && body.id !== undefined) {
    const err = v.id(body.id);
    if (err) details.push({ field: 'id', message: err });
    else values.id = body.id;
  }
  for (const [key, field] of Object.entries(def.fields)) {
    const value = body[key];
    if (value === undefined) {
      if (partial || field.optional) continue;
      if ('default' in field) values[key] = field.default;
      else details.push({ field: key, message: 'is required' });
    } else if (value === null) {
      if (field.nullable) values[key] = null;
      else details.push({ field: key, message: 'must not be null' });
    } else {
      const err = field.check(value);
      if (err) details.push({ field: key, message: err });
      else values[key] = value;
    }
  }
  if (details.length) throw validationError(details);
  return values;
}

function crossCheck(def, data) {
  const details = def.crossCheck ? def.crossCheck(data) : [];
  if (details.length) throw validationError(details);
}

function crudRouter(pool, def) {
  const router = express.Router();
  const fields = Object.entries(def.fields);
  const selectList = ['id', ...fields.map(([key, f]) => `${f.column} AS "${key}"`)].join(', ');

  /** Row (already camelCase via SQL aliases) -> API JSON; unset optional fields are omitted. */
  const toApi = (row) => {
    const out = { ...row };
    for (const [key, f] of fields) if (f.optional && out[key] === null) delete out[key];
    return out;
  };

  router.get(
    '/',
    wrap(async (req, res) => {
      const filter = def.listFilter ? def.listFilter(req.query) : { details: [], where: [], params: [] };
      if (filter.details.length) throw validationError(filter.details, 'Invalid query');
      const where = filter.where.length ? `WHERE ${filter.where.join(' AND ')}` : '';
      const { rows } = await pool.query(
        `SELECT ${selectList} FROM ${def.table} ${where} ORDER BY ${def.orderBy}`,
        filter.params,
      );
      res.json(rows.map(toApi));
    }),
  );

  router.post(
    '/',
    wrap(async (req, res) => {
      const values = parseBody(def, req.body, { partial: false });
      crossCheck(def, values);
      const keys = Object.keys(values);
      const columns = keys.map((k) => (k === 'id' ? 'id' : def.fields[k].column));
      const placeholders = keys.map((_, i) => `$${i + 1}`);
      const { rows } = await pool.query(
        `INSERT INTO ${def.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})
         RETURNING ${selectList}`,
        keys.map((k) => values[k]),
      );
      res.status(201).json(toApi(rows[0]));
    }),
  );

  router.put(
    '/:id',
    wrap(async (req, res) => {
      const { id } = req.params;
      const patch = parseBody(def, req.body, { partial: true });
      const row = await withTransaction(pool, async (client) => {
        const current = await client.query(`SELECT ${selectList} FROM ${def.table} WHERE id = $1 FOR UPDATE`, [id]);
        if (!current.rowCount) throw notFound(def.entity, id);
        crossCheck(def, { ...current.rows[0], ...patch });
        const keys = Object.keys(patch);
        if (!keys.length) return current.rows[0];
        const sets = keys.map((k, i) => `${def.fields[k].column} = $${i + 2}`);
        const { rows } = await client.query(
          `UPDATE ${def.table} SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING ${selectList}`,
          [id, ...keys.map((k) => patch[k])],
        );
        return rows[0];
      });
      res.json(toApi(row));
    }),
  );

  router.delete(
    '/:id',
    wrap(async (req, res) => {
      const { rowCount } = await pool.query(`DELETE FROM ${def.table} WHERE id = $1`, [req.params.id]);
      if (!rowCount) throw notFound(def.entity, req.params.id);
      res.status(204).end();
    }),
  );

  return router;
}

module.exports = { crudRouter, wrap };
