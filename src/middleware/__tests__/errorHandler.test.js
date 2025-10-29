const { errorHandler, asyncHandler } = require('../errorHandler');
const { AppError, ValidationError, NotFoundError, DatabaseError } = require('../../utils/errors');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      url: '/test',
      method: 'GET'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    console.error = jest.fn(); // Mock console.error
  });

  describe('operational errors', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Test error',
          code: 'TEST_ERROR'
        }
      });
    });

    it('should include validation fields for ValidationError', () => {
      const error = new ValidationError('Validation failed', {
        email: ['Invalid email format'],
        password: ['Too short']
      });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields: {
            email: ['Invalid email format'],
            password: ['Too short']
          }
        }
      });
    });

    it('should include resource for NotFoundError', () => {
      const error = new NotFoundError('User');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
          resource: 'User'
        }
      });
    });
  });

  describe('PostgreSQL errors', () => {
    it('should handle foreign key violation (23503)', () => {
      const error = new Error('Foreign key violation');
      error.code = '23503';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Referenced record not found',
          code: 'FOREIGN_KEY_VIOLATION'
        }
      });
    });

    it('should handle unique violation (23505)', () => {
      const error = new Error('Unique violation');
      error.code = '23505';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Record already exists',
          code: 'DUPLICATE_ENTRY'
        }
      });
    });

    it('should handle not null violation (23502)', () => {
      const error = new Error('Not null violation');
      error.code = '23502';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Required field is missing',
          code: 'MISSING_REQUIRED_FIELD'
        }
      });
    });
  });

  describe('generic errors', () => {
    it('should handle generic error with default status 500', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Something went wrong',
          code: 'INTERNAL_ERROR'
        }
      });
    });

    it('should log server errors (500+)', () => {
      const error = new Error('Server error');
      error.statusCode = 500;

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith('Error:', expect.objectContaining({
        message: 'Server error'
      }));
    });

    it('should not log client errors (4xx)', () => {
      const error = new AppError('Client error', 400);

      errorHandler(error, req, res, next);

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('stack traces', () => {
    it('should include stack trace in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at test.js:1:1';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String)
          })
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at test.js:1:1';

      errorHandler(error, req, res, next);

      const callArg = res.json.mock.calls[0][0];
      expect(callArg.error.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('asyncHandler', () => {
  it('should call next with error if promise rejects', async () => {
    const error = new Error('Async error');
    const asyncFn = jest.fn().mockRejectedValue(error);
    const wrappedFn = asyncHandler(asyncFn);

    const req = {};
    const res = {};
    const next = jest.fn();

    await wrappedFn(req, res, next);

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should not call next if promise resolves', async () => {
    const asyncFn = jest.fn().mockResolvedValue(undefined);
    const wrappedFn = asyncHandler(asyncFn);

    const req = {};
    const res = {};
    const next = jest.fn();

    await wrappedFn(req, res, next);

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should pass through req, res, next to wrapped function', async () => {
    const req = { test: 'req' };
    const res = { test: 'res' };
    const next = jest.fn();
    const asyncFn = jest.fn().mockResolvedValue(undefined);
    const wrappedFn = asyncHandler(asyncFn);

    await wrappedFn(req, res, next);

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
  });
});
