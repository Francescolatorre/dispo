const {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ConflictError
} = require('../errors');

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should use default status code 500', () => {
      const error = new AppError('Server error');

      expect(error.statusCode).toBe(500);
    });

    it('should accept optional error code', () => {
      const error = new AppError('Test error', 400, 'TEST_CODE');

      expect(error.code).toBe('TEST_CODE');
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with fields', () => {
      const fields = {
        email: ['Invalid email'],
        password: ['Too short']
      };
      const error = new ValidationError('Validation failed', fields);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.fields).toEqual(fields);
    });

    it('should work without fields parameter', () => {
      const error = new ValidationError('Validation failed');

      expect(error.fields).toEqual({});
    });

    it('should be operational', () => {
      const error = new ValidationError('Test');

      expect(error.isOperational).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource name', () => {
      const error = new NotFoundError('User');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.resource).toBe('User');
    });

    it('should handle different resource names', () => {
      const error = new NotFoundError('Project');

      expect(error.message).toBe('Project not found');
      expect(error.resource).toBe('Project');
    });
  });

  describe('DatabaseError', () => {
    it('should create database error', () => {
      const error = new DatabaseError('Connection failed');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
    });

    it('should store original error', () => {
      const originalError = new Error('Original error');
      const error = new DatabaseError('Database failed', originalError);

      expect(error.originalError).toBe(originalError);
    });

    it('should work without original error', () => {
      const error = new DatabaseError('Database failed');

      expect(error.originalError).toBeNull();
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('should be operational', () => {
      const error = new ConflictError('Test');

      expect(error.isOperational).toBe(true);
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain instanceof relationships', () => {
      const validationError = new ValidationError('Test');
      const notFoundError = new NotFoundError('Resource');
      const databaseError = new DatabaseError('Test');
      const conflictError = new ConflictError('Test');

      expect(validationError instanceof Error).toBe(true);
      expect(validationError instanceof AppError).toBe(true);
      expect(validationError instanceof ValidationError).toBe(true);

      expect(notFoundError instanceof Error).toBe(true);
      expect(notFoundError instanceof AppError).toBe(true);

      expect(databaseError instanceof Error).toBe(true);
      expect(databaseError instanceof AppError).toBe(true);

      expect(conflictError instanceof Error).toBe(true);
      expect(conflictError instanceof AppError).toBe(true);
    });

    it('should have proper error names', () => {
      const appError = new AppError('Test');
      const validationError = new ValidationError('Test');

      expect(appError.name).toBe('Error');
      expect(validationError.name).toBe('Error');
    });
  });
});
