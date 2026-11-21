'use strict';

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const notFound = (entity, id) => new ApiError(404, 'NOT_FOUND', `${entity} "${id}" not found`);

/** details: [{ field, message }] */
const validationError = (details, message = 'Invalid request') =>
  new ApiError(400, 'VALIDATION', message, details);

/** Maps well-known Postgres errors to API errors; returns null for anything else. */
function fromPgError(err) {
  switch (err.code) {
    case '23503': {
      // foreign_key_violation, e.g. assignments_employee_id_fkey
      const field = /employee_id/.test(err.constraint || '') ? 'employeeId' : 'projectId';
      return validationError([{ field, message: 'references a non-existent record' }]);
    }
    case '23505':
      return new ApiError(409, 'CONFLICT', 'A record with this id already exists', [
        { field: 'id', message: 'already exists' },
      ]);
    case '23514': // check_violation (fallback - input is validated before it gets here)
      return validationError([{ field: err.constraint || null, message: 'constraint violated' }]);
    case '22P02': // invalid_text_representation
    case '22007': // invalid_datetime_format
    case '22008': // datetime_field_overflow
      return validationError([{ field: null, message: 'invalid value' }]);
    default:
      return null;
  }
}

// Express recognises error handlers by their 4-argument signature.
function errorHandler(err, req, res, _next) {
  let apiError = err instanceof ApiError ? err : fromPgError(err);
  if (!apiError && err.type === 'entity.parse.failed') {
    apiError = validationError([{ field: null, message: 'malformed JSON body' }], 'Malformed JSON');
  }
  if (!apiError && err.type === 'entity.too.large') {
    apiError = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
  }
  if (!apiError) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    apiError = new ApiError(500, 'INTERNAL', 'Internal server error');
  }
  const body = { error: { code: apiError.code, message: apiError.message } };
  if (apiError.details) body.error.details = apiError.details;
  res.status(apiError.status).json(body);
}

module.exports = { ApiError, notFound, validationError, errorHandler };
