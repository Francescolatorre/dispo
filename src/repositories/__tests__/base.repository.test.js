import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseRepository } from '../base.repository.js';
import { pool } from '../../config/database.js';
import { metrics } from '../../utils/metrics.js';
import { DatabaseError } from '../../errors/index.js';

// Mock database pool
vi.mock('../../config/database.js', () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
    totalCount: 10,
    idleCount: 5,
    waitingCount: 2
  }
}));

// Mock metrics
vi.mock('../../utils/metrics.js', () => ({
  metrics: {
    observe: vi.fn()
  }
}));

describe('BaseRepository', () => {
  let repository;
  let mockClient;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock client
    mockClient = {
      query: vi.fn(),
      release: vi.fn()
    };

    // Setup pool connect mock
    pool.connect.mockResolvedValue(mockClient);

    // Create repository instance
    repository = new BaseRepository();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('should execute query and track metrics', async () => {
      const query = 'SELECT * FROM users';
      const params = [1];
      const mockResult = { rows: [] };

      mockClient.query.mockResolvedValue(mockResult);

      const result = await repository.executeQuery(query, params, mockClient);

      expect(result).toBe(mockResult);
      expect(mockClient.query).toHaveBeenCalledWith(query, params);
      expect(metrics.observe).toHaveBeenCalledWith('query_duration', expect.any(Object));
      expect(metrics.observe).toHaveBeenCalledWith('query_count', { status: 'success' });
    });

    it('should handle query timeout', async () => {
      const query = 'SELECT * FROM users';
      mockClient.query.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 6000)));

      await expect(repository.executeQuery(query, [], mockClient))
        .rejects
        .toThrow('Query timeout');

      expect(metrics.observe).toHaveBeenCalledWith('query_duration', expect.objectContaining({
        status: 'error'
      }));
      expect(metrics.observe).toHaveBeenCalledWith('query_count', { status: 'error' });
    });

    it('should mask sensitive data in error logs', async () => {
      const query = 'INSERT INTO users (email, password) VALUES ($1, $2)';
      const params = ['test@example.com', 'secret123'];
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(repository.executeQuery(query, params, mockClient))
        .rejects
        .toThrow(DatabaseError);

      expect(metrics.observe).toHaveBeenCalledWith('query_count', { status: 'error' });
    });
  });

  describe('withTransaction', () => {
    it('should execute transaction with isolation level', async () => {
      const callback = vi.fn().mockResolvedValue('result');

      const result = await repository.withTransaction(callback, {
        isolationLevel: 'REPEATABLE READ'
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN ISOLATION LEVEL REPEATABLE READ');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toBe('result');

      // Verify metrics
      expect(metrics.observe).toHaveBeenCalledWith('transaction_count', {
        status: 'begin',
        isolation_level: 'repeatable_read'
      });
      expect(metrics.observe).toHaveBeenCalledWith('transaction_duration', expect.objectContaining({
        status: 'success',
        isolation_level: 'repeatable_read'
      }));
    });

    it('should handle transaction timeout', async () => {
      const callback = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 6000)));

      await expect(repository.withTransaction(callback, {
        timeout: 5000
      })).rejects.toThrow('Transaction timeout');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(metrics.observe).toHaveBeenCalledWith('transaction_count', {
        status: 'rollback',
        isolation_level: 'repeatable_read'
      });
    });

    it('should retry on deadlock', async () => {
      const deadlockError = new Error('deadlock detected');
      deadlockError.code = '40P01';

      const callback = vi.fn()
        .mockRejectedValueOnce(deadlockError)
        .mockResolvedValueOnce('success');

      const result = await repository.withTransaction(callback);

      expect(result).toBe('success');
      expect(callback).toHaveBeenCalledTimes(2);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should not retry on non-retryable errors', async () => {
      const error = new Error('non-retryable error');
      const callback = vi.fn().mockRejectedValue(error);

      await expect(repository.withTransaction(callback))
        .rejects
        .toThrow(error);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('connection pool metrics', () => {
    it('should track pool metrics when getting client', async () => {
      await repository._getClientWithRetry(3);

      expect(metrics.observe).toHaveBeenCalledWith('pool_wait_time', expect.any(Object));
      expect(metrics.observe).toHaveBeenCalledWith('pool_size', {
        value: 10,
        state: 'total'
      });
      expect(metrics.observe).toHaveBeenCalledWith('pool_size', {
        value: 5,
        state: 'idle'
      });
      expect(metrics.observe).toHaveBeenCalledWith('pool_size', {
        value: 2,
        state: 'waiting'
      });
    });

    it('should retry getting client on failure', async () => {
      pool.connect
        .mockRejectedValueOnce(new Error('connection failed'))
        .mockResolvedValueOnce(mockClient);

      const client = await repository._getClientWithRetry(2);

      expect(client).toBe(mockClient);
      expect(pool.connect).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const error = new Error('connection failed');
      pool.connect.mockRejectedValue(error);

      await expect(repository._getClientWithRetry(3))
        .rejects
        .toThrow(error);

      expect(pool.connect).toHaveBeenCalledTimes(3);
    });
  });
});