/**
 * Metrics utility for monitoring system performance and behavior
 */

class Histogram {
  constructor({ name, help, labelNames = [] }) {
    this.name = name;
    this.help = help;
    this.labelNames = labelNames;
    this.buckets = new Map();
  }

  observe(value, labels = {}) {
    const key = this._getKey(labels);
    if (!this.buckets.has(key)) {
      this.buckets.set(key, []);
    }
    this.buckets.get(key).push(value);
  }

  _getKey(labels) {
    return this.labelNames
      .map(label => `${label}=${labels[label] || ''}`)
      .join(',');
  }

  reset() {
    this.buckets.clear();
  }

  getValues() {
    return Object.fromEntries(this.buckets);
  }
}

class Counter {
  constructor({ name, help, labelNames = [] }) {
    this.name = name;
    this.help = help;
    this.labelNames = labelNames;
    this.counts = new Map();
  }

  increment(labels = {}) {
    const key = this._getKey(labels);
    const currentCount = this.counts.get(key) || 0;
    this.counts.set(key, currentCount + 1);
  }

  _getKey(labels) {
    return this.labelNames
      .map(label => `${label}=${labels[label] || ''}`)
      .join(',');
  }

  reset() {
    this.counts.clear();
  }

  getValues() {
    return Object.fromEntries(this.counts);
  }
}

// Transaction metrics
const transactionDuration = new Histogram({
  name: 'transaction_duration_ms',
  help: 'Transaction duration in milliseconds',
  labelNames: ['operation', 'status', 'isolation_level']
});

const transactionCount = new Counter({
  name: 'transaction_total',
  help: 'Total number of transactions',
  labelNames: ['status', 'isolation_level']
});

// Query metrics
const queryDuration = new Histogram({
  name: 'query_duration_ms',
  help: 'Query duration in milliseconds',
  labelNames: ['operation', 'status']
});

const queryCount = new Counter({
  name: 'query_total',
  help: 'Total number of queries',
  labelNames: ['status']
});

// Connection pool metrics
const poolSize = new Histogram({
  name: 'pool_size',
  help: 'Connection pool size',
  labelNames: ['state']
});

const poolWaitTime = new Histogram({
  name: 'pool_wait_time_ms',
  help: 'Time spent waiting for connection',
  labelNames: []
});

// Test database metrics
const testDatabaseSetup = new Histogram({
  name: 'test_database_setup',
  help: 'Test database setup duration in milliseconds',
  labelNames: ['operation', 'status']
});

const testDatabaseCleanup = new Histogram({
  name: 'test_database_cleanup',
  help: 'Test database cleanup duration in milliseconds',
  labelNames: ['operation', 'status']
});

const testTransactionDuration = new Histogram({
  name: 'test_transaction_duration',
  help: 'Test transaction duration in milliseconds',
  labelNames: ['operation', 'status']
});

/**
 * Record a metric observation
 * @param {string} metric Metric name
 * @param {Object} data Metric data
 */
const observe = (metric, data) => {
  const metrics = {
    transaction_duration: transactionDuration,
    transaction_count: transactionCount,
    query_duration: queryDuration,
    query_count: queryCount,
    pool_size: poolSize,
    pool_wait_time: poolWaitTime,
    test_database_setup: testDatabaseSetup,
    test_database_cleanup: testDatabaseCleanup,
    test_transaction_duration: testTransactionDuration
  };

  const metricObj = metrics[metric];
  if (!metricObj) {
    throw new Error(`Unknown metric: ${metric}`);
  }

  if (metricObj instanceof Histogram) {
    const { value, ...labels } = data;
    metricObj.observe(value, labels);
  } else if (metricObj instanceof Counter) {
    metricObj.increment(data);
  }
};

/**
 * Get current metric values
 * @param {string} metric Metric name
 * @returns {Object} Metric values
 */
const getMetrics = (metric) => {
  const metrics = {
    transaction_duration: () => ({
      type: 'histogram',
      values: transactionDuration.getValues()
    }),
    transaction_count: () => ({
      type: 'counter',
      values: transactionCount.getValues()
    }),
    query_duration: () => ({
      type: 'histogram',
      values: queryDuration.getValues()
    }),
    query_count: () => ({
      type: 'counter',
      values: queryCount.getValues()
    }),
    pool_size: () => ({
      type: 'histogram',
      values: poolSize.getValues()
    }),
    pool_wait_time: () => ({
      type: 'histogram',
      values: poolWaitTime.getValues()
    }),
    test_database_setup: () => ({
      type: 'histogram',
      values: testDatabaseSetup.getValues()
    }),
    test_database_cleanup: () => ({
      type: 'histogram',
      values: testDatabaseCleanup.getValues()
    }),
    test_transaction_duration: () => ({
      type: 'histogram',
      values: testTransactionDuration.getValues()
    })
  };

  if (metric) {
    const metricFn = metrics[metric];
    if (!metricFn) {
      throw new Error(`Unknown metric: ${metric}`);
    }
    const result = metricFn();

    // Reset after getting values
    if (metric.endsWith('_duration') || metric === 'pool_size' || metric === 'pool_wait_time') {
      const histogramMetric = {
        transaction_duration: transactionDuration,
        query_duration: queryDuration,
        pool_size: poolSize,
        pool_wait_time: poolWaitTime,
        test_database_setup: testDatabaseSetup,
        test_database_cleanup: testDatabaseCleanup,
        test_transaction_duration: testTransactionDuration
      }[metric];
      histogramMetric.reset();
    } else {
      const counterMetric = {
        transaction_count: transactionCount,
        query_count: queryCount
      }[metric];
      counterMetric.reset();
    }

    return result;
  }

  // Get all metrics
  const allMetrics = Object.entries(metrics).reduce((acc, [key, fn]) => {
    acc[key] = fn();
    return acc;
  }, {});

  // Reset all metrics
  transactionDuration.reset();
  transactionCount.reset();
  queryDuration.reset();
  queryCount.reset();
  poolSize.reset();
  poolWaitTime.reset();
  testDatabaseSetup.reset();
  testDatabaseCleanup.reset();
  testTransactionDuration.reset();

  return allMetrics;
};

export const metrics = {
  observe,
  getMetrics
};