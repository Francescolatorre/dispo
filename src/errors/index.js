/**
 * Base error class for standardized error handling across the application
 */
export class BaseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        type: this.name,
        statusCode: this.statusCode || 500
      }
    };
  }
}

/**
 * Database-specific error class for handling database operation failures
 */
export class DatabaseError extends BaseError {
  constructor(message, originalError) {
    super(message);
    this.originalError = originalError;
    this.code = originalError?.code;
    this.statusCode = 500;
  }
}

/**
 * Validation error class for handling invalid input data
 */
export class ValidationError extends BaseError {
  constructor(message, field) {
    super(message);
    this.field = field;
    this.statusCode = 400;
  }
}

/**
 * Not found error class for handling resource not found scenarios
 */
export class NotFoundError extends BaseError {
  constructor(resource, identifier) {
    super(`${resource} not found with identifier: ${identifier}`);
    this.resource = resource;
    this.identifier = identifier;
    this.statusCode = 404;
  }
}

/**
 * Conflict error class for handling resource conflicts
 */
export class ConflictError extends BaseError {
  constructor(message) {
    super(message);
    this.statusCode = 409;
  }
}

/**
 * Authorization error class for handling permission-related errors
 */
export class AuthorizationError extends BaseError {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.statusCode = 401;
  }
}