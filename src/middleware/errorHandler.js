const { AppError } = require('../utils/errors');

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle PostgreSQL errors
  if (err.code && typeof err.code === 'string') {
    switch (err.code) {
      case '23503': // Foreign key violation
        statusCode = 400;
        code = 'FOREIGN_KEY_VIOLATION';
        message = 'Referenced record not found';
        break;
      case '23505': // Unique violation
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'Record already exists';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        code = 'MISSING_REQUIRED_FIELD';
        message = 'Required field is missing';
        break;
    }
  }

  // Log error for debugging (in production, use proper logging service)
  if (statusCode >= 500) {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      url: req.url,
      method: req.method
    });
  }

  // Build error response
  const response = {
    error: {
      message,
      code
    }
  };

  // Include additional fields for operational errors
  if (err.isOperational) {
    if (err.fields) {
      response.error.fields = err.fields;
    }
    if (err.resource) {
      response.error.resource = err.resource;
    }
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  asyncHandler
};
