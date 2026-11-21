'use strict';

/**
 * Resource definitions (API field <-> DB column, per-field checks) for the three entities.
 * The generic CRUD router in crud.js turns each definition into
 * GET / POST / PUT /:id / DELETE /:id, mirroring client/src/data/repository.ts.
 *
 * Only structural rules live here. Workload / overbooking is deliberately NOT validated:
 * the client shows warnings and the planner decides (product decision).
 */
const v = require('./validation');

const SENIORITIES = ['junior', 'mid', 'senior', 'lead'];
const PROJECT_STATUSES = ['planned', 'active', 'done'];

const startBeforeEnd = (data) =>
  data.start && data.end && data.end < data.start
    ? [{ field: 'end', message: 'must be on or after start' }]
    : [];

const employees = {
  entity: 'employee',
  table: 'employees',
  orderBy: 'name, id',
  fields: {
    name: { column: 'name', check: v.nonEmptyString },
    role: { column: 'role', check: v.string },
    seniority: { column: 'seniority', check: v.oneOf(SENIORITIES) },
    capacity: { column: 'capacity', check: v.capacity },
    active: { column: 'active', check: v.boolean, default: true },
  },
};

const projects = {
  entity: 'project',
  table: 'projects',
  orderBy: 'start_date, name, id',
  crossCheck: startBeforeEnd,
  fields: {
    name: { column: 'name', check: v.nonEmptyString },
    color: { column: 'color', check: v.nonEmptyString },
    start: { column: 'start_date', check: v.date },
    end: { column: 'end_date', check: v.date },
    status: { column: 'status', check: v.oneOf(PROJECT_STATUSES) },
  },
};

const assignments = {
  entity: 'assignment',
  table: 'assignments',
  orderBy: 'start_date, id',
  crossCheck: startBeforeEnd,
  fields: {
    employeeId: { column: 'employee_id', check: v.id },
    projectId: { column: 'project_id', check: v.id },
    start: { column: 'start_date', check: v.date },
    end: { column: 'end_date', check: v.date },
    allocation: { column: 'allocation', check: v.allocation },
    // Optional; `null` clears it on update, omitted from responses when unset.
    role: { column: 'role', check: v.string, optional: true, nullable: true },
  },
  /** GET /assignments?from&to&employeeId&projectId - from/to select overlapping (inclusive). */
  listFilter(query) {
    const details = [];
    const where = [];
    const params = [];
    const single = (key) => {
      const value = query[key];
      if (value === undefined) return undefined;
      if (typeof value !== 'string') {
        details.push({ field: key, message: 'must be given once' });
        return undefined;
      }
      return value;
    };
    const from = single('from');
    const to = single('to');
    const employeeId = single('employeeId');
    const projectId = single('projectId');
    if (from !== undefined && !v.isIsoDate(from)) details.push({ field: 'from', message: v.date(from) });
    if (to !== undefined && !v.isIsoDate(to)) details.push({ field: 'to', message: v.date(to) });
    if (!details.length && from && to && to < from) details.push({ field: 'to', message: 'must be on or after from' });

    if (from !== undefined) where.push(`end_date >= $${params.push(from)}`);
    if (to !== undefined) where.push(`start_date <= $${params.push(to)}`);
    if (employeeId !== undefined) where.push(`employee_id = $${params.push(employeeId)}`);
    if (projectId !== undefined) where.push(`project_id = $${params.push(projectId)}`);
    return { details, where, params };
  },
};

module.exports = { employees, projects, assignments, SENIORITIES, PROJECT_STATUSES };
