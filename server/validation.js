'use strict';

/** Field checks: each returns an error message, or null when the value is valid. */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ID_RE = /^[A-Za-z0-9_.:-]{1,100}$/;

function isIsoDate(value) {
  if (typeof value !== 'string') return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

const date = (v) => (isIsoDate(v) ? null : 'must be a valid date YYYY-MM-DD');
const nonEmptyString = (v) =>
  typeof v === 'string' && v.trim().length > 0 ? null : 'must be a non-empty string';
const string = (v) => (typeof v === 'string' ? null : 'must be a string');
const boolean = (v) => (typeof v === 'boolean' ? null : 'must be a boolean');
const oneOf = (values) => (v) => (values.includes(v) ? null : `must be one of ${values.join(', ')}`);
const capacity = (v) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0.1 && v <= 1 && Math.abs(v * 100 - Math.round(v * 100)) < 1e-9
    ? null
    : 'must be a number between 0.1 and 1.0 (max. 2 decimals)';
const allocation = (v) =>
  Number.isInteger(v) && v >= 10 && v <= 100 && v % 10 === 0
    ? null
    : 'must be an integer between 10 and 100 in steps of 10';
const id = (v) =>
  typeof v === 'string' && ID_RE.test(v) ? null : 'must be 1-100 characters of A-Z a-z 0-9 _ . : -';

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

module.exports = { isIsoDate, isPlainObject, date, nonEmptyString, string, boolean, oneOf, capacity, allocation, id };
