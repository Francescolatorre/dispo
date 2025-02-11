import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger.js';

describe('logger', () => {
  let consoleErrorSpy;
  let consoleWarnSpy;
  let consoleInfoSpy;
  let consoleDebugSpy;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('error logging', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error');
      const context = { userId: 123, email: 'test@example.com' };

      logger.error('Error occurred', { error, context });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred')
      );

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData).toEqual(expect.objectContaining({
        level: 'error',
        message: 'Error occurred',
        error: expect.objectContaining({
          message: 'Test error',
          name: 'Error'
        }),
        context: expect.objectContaining({
          userId: 123,
          email: 't***@example.com',
          timestamp: expect.any(String)
        })
      }));
    });

    it('should mask sensitive data in error context', () => {
      const context = {
        email: 'user@example.com',
        password: 'secret123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      };

      logger.error('Authentication failed', { context });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(expect.objectContaining({
        email: 'u***@example.com',
        password: '********',
        token: expect.stringMatching(/^eyJ.*9$/),
        timestamp: expect.any(String)
      }));
    });
  });

  describe('development mode logging', () => {
    it('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      
      logger.error('Error occurred', { error });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.error).toHaveProperty('stack');
    });

    it('should exclude stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      
      logger.error('Error occurred', { error });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.error).not.toHaveProperty('stack');
    });
  });

  describe('warning logging', () => {
    it('should log warnings with context', () => {
      const context = { operation: 'test', duration: 1000 };
      
      logger.warn('Operation slow', context);

      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData).toEqual(expect.objectContaining({
        level: 'warn',
        message: 'Operation slow',
        context: expect.objectContaining({
          operation: 'test',
          duration: 1000,
          timestamp: expect.any(String)
        })
      }));
    });
  });

  describe('info logging', () => {
    it('should log info messages with context', () => {
      const context = { userId: 123, action: 'login' };
      
      logger.info('User logged in', context);

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(loggedData).toEqual(expect.objectContaining({
        level: 'info',
        message: 'User logged in',
        context: expect.objectContaining({
          userId: 123,
          action: 'login',
          timestamp: expect.any(String)
        })
      }));
    });
  });

  describe('debug logging', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      const context = { query: 'SELECT * FROM users' };
      
      logger.debug('Executing query', context);

      expect(consoleDebugSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleDebugSpy.mock.calls[0][0]);
      expect(loggedData).toEqual(expect.objectContaining({
        level: 'debug',
        message: 'Executing query',
        context: expect.objectContaining({
          query: 'SELECT * FROM users',
          timestamp: expect.any(String)
        })
      }));
    });

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      
      logger.debug('Debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask email addresses', () => {
      const email = 'user.name@example.com';
      expect(logger.maskSensitiveData(email, 'email')).toBe('u***@example.com');
    });

    it('should mask passwords', () => {
      const password = 'supersecret123';
      expect(logger.maskSensitiveData(password, 'password')).toBe('********');
    });

    it('should mask tokens', () => {
      const token = '1234567890abcdef';
      const masked = logger.maskSensitiveData(token, 'token');
      expect(masked).toMatch(/^1234.*cdef$/);
    });

    it('should handle null or undefined values', () => {
      expect(logger.maskSensitiveData(null)).toBeNull();
      expect(logger.maskSensitiveData(undefined)).toBeUndefined();
    });
  });
});