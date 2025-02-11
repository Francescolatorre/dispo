import { describe, it, expect, beforeEach } from 'vitest';
import { metrics } from '../metrics.js';

describe('metrics', () => {
  beforeEach(() => {
    // Reset metrics by getting fresh instances
    metrics.getMetrics();
  });

  describe('transaction metrics', () => {
    it('should track transaction duration', () => {
      metrics.observe('transaction_duration', {
        value: 100,
        operation: 'create',
        status: 'commit',
        isolation_level: 'repeatable_read'
      });

      const result = metrics.getMetrics('transaction_duration');
      expect(result.type).toBe('histogram');
      expect(result.values['operation=create,status=commit,isolation_level=repeatable_read'])
        .toContain(100);
    });

    it('should count transactions', () => {
      metrics.observe('transaction_count', {
        status: 'commit',
        isolation_level: 'repeatable_read'
      });

      const result = metrics.getMetrics('transaction_count');
      expect(result.type).toBe('counter');
      expect(result.values['status=commit,isolation_level=repeatable_read'])
        .toBe(1);
    });

    it('should track multiple transactions', () => {
      // Successful transaction
      metrics.observe('transaction_duration', {
        value: 100,
        operation: 'create',
        status: 'commit',
        isolation_level: 'repeatable_read'
      });
      metrics.observe('transaction_count', {
        status: 'commit',
        isolation_level: 'repeatable_read'
      });

      // Failed transaction
      metrics.observe('transaction_duration', {
        value: 50,
        operation: 'create',
        status: 'rollback',
        isolation_level: 'repeatable_read'
      });
      metrics.observe('transaction_count', {
        status: 'rollback',
        isolation_level: 'repeatable_read'
      });

      const durations = metrics.getMetrics('transaction_duration');
      const counts = metrics.getMetrics('transaction_count');

      expect(durations.values['operation=create,status=commit,isolation_level=repeatable_read'])
        .toContain(100);
      expect(durations.values['operation=create,status=rollback,isolation_level=repeatable_read'])
        .toContain(50);
      expect(counts.values['status=commit,isolation_level=repeatable_read']).toBe(1);
      expect(counts.values['status=rollback,isolation_level=repeatable_read']).toBe(1);
    });
  });

  describe('query metrics', () => {
    it('should track query duration', () => {
      metrics.observe('query_duration', {
        value: 50,
        operation: 'select',
        status: 'success'
      });

      const result = metrics.getMetrics('query_duration');
      expect(result.type).toBe('histogram');
      expect(result.values['operation=select,status=success'])
        .toContain(50);
    });

    it('should count queries', () => {
      metrics.observe('query_count', {
        status: 'success'
      });

      const result = metrics.getMetrics('query_count');
      expect(result.type).toBe('counter');
      expect(result.values['status=success']).toBe(1);
    });
  });

  describe('connection pool metrics', () => {
    it('should track pool size', () => {
      metrics.observe('pool_size', {
        value: 5,
        state: 'active'
      });

      const result = metrics.getMetrics('pool_size');
      expect(result.type).toBe('histogram');
      expect(result.values['state=active']).toContain(5);
    });

    it('should track pool wait time', () => {
      metrics.observe('pool_wait_time', {
        value: 25
      });

      const result = metrics.getMetrics('pool_wait_time');
      expect(result.type).toBe('histogram');
      expect(result.values['']).toContain(25);
    });
  });

  describe('error handling', () => {
    it('should throw error for unknown metric', () => {
      expect(() => metrics.observe('unknown_metric', { value: 1 }))
        .toThrow('Unknown metric: unknown_metric');
    });

    it('should throw error for unknown metric in getMetrics', () => {
      expect(() => metrics.getMetrics('unknown_metric'))
        .toThrow('Unknown metric: unknown_metric');
    });
  });

  describe('getAllMetrics', () => {
    it('should return all metrics when no specific metric is requested', () => {
      metrics.observe('transaction_duration', {
        value: 100,
        operation: 'create',
        status: 'commit'
      });
      metrics.observe('query_count', {
        status: 'success'
      });

      const allMetrics = metrics.getMetrics();
      expect(allMetrics).toHaveProperty('transaction_duration');
      expect(allMetrics).toHaveProperty('query_count');
      expect(allMetrics.transaction_duration.type).toBe('histogram');
      expect(allMetrics.query_count.type).toBe('counter');
    });
  });
});