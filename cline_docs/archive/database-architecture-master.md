# Database Architecture Master Plan

## Overview

This document combines our comprehensive database architecture strategy, incorporating the repository pattern implementation, improvements based on architectural review, and detailed implementation plans.

## Current Architecture Issues

1. **Database Access**
   - Direct database access throughout the codebase
   - No clear separation between data access and business logic
   - Mixed concerns in service layer

2. **Testing**
   - Lack of proper transaction handling
   - Tests can interfere with each other
   - Inconsistent database cleanup
   - Test failures can leave database in inconsistent state

3. **Error Handling**
   - Inconsistent error handling
   - Mixed error responsibilities
   - Poor error context

## Architecture Design

```
+----------------+     +----------------+     +----------------+     +----------------+
|   Routes       | --> |   Services    | --> | Repositories   | --> |   Database    |
+----------------+     +----------------+     +----------------+     +----------------+
        |                     |                      |                      |
        |                     |                      |                      |
        +                     +                      +                      +
    HTTP Layer           Business Logic         Data Access           PostgreSQL
    Validation          Error Handling       Transaction Mgmt       
    Auth Check          Orchestration        Error Mapping
```

## Key Improvements

### 1. Transaction Management Enhancement

#### Current Issue
- The `BaseRepository` creates new client connections unnecessarily
- Potential connection leaks and overhead

#### Solution
```javascript
async withTransaction(callback, externalClient = null) {
  const client = externalClient || this.client || await pool.connect();
  const isNewTransaction = !externalClient && !this.client;

  try {
    if (isNewTransaction) await client.query('BEGIN');
    const result = await callback(client);
    if (isNewTransaction) await client.query('COMMIT');
    return result;
  } catch (error) {
    if (isNewTransaction) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (isNewTransaction) client.release();
  }
}
```

### 2. Error Handling Standardization

#### Solution
```javascript
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

export class DatabaseError extends BaseError {
  constructor(message, originalError) {
    super(message);
    this.originalError = originalError;
    this.code = originalError?.code;
    this.statusCode = 500;
  }
}

export class ValidationError extends BaseError {
  constructor(message, field) {
    super(message);
    this.field = field;
    this.statusCode = 400;
  }
}
```

### 3. Test Optimization

#### Solution
```javascript
export class TestDatabase {
  static async initialize() {
    const client = await pool.connect();
    await client.query('BEGIN');
    await this.setupSchema(client);
    return client;
  }

  static async createSavepoint(client, name) {
    await client.query(`SAVEPOINT ${name}`);
  }

  static async rollbackToSavepoint(client, name) {
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
  }
}
```

### 4. Query Performance Monitoring

```javascript
async executeQuery(query, params = [], client = this.client) {
  const queryStart = process.hrtime();
  try {
    const result = await (client || pool).query(query, params);
    this._logQueryPerformance(query, params, queryStart);
    return result;
  } catch (error) {
    throw new DatabaseError('Query execution failed', error);
  }
}

_logQueryPerformance(query, params, startTime, threshold = 200) {
  const [seconds, nanoseconds] = process.hrtime(startTime);
  const duration = seconds * 1000 + nanoseconds / 1e6;
  
  if (duration > threshold) {
    console.warn('Slow query detected:', {
      duration: `${duration.toFixed(2)}ms`,
      query,
      params,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

1. Create directory structure:
```bash
mkdir -p src/repositories src/errors src/test
```

2. Implement base components:
   - BaseRepository with transaction management
   - Error classes hierarchy
   - Test database infrastructure

3. Success Criteria:
   - Error handling implemented
   - Test infrastructure working
   - Transaction management functional

### Phase 2: Repository Implementation (Week 1-2)

1. Implement UserRepository:
   - CRUD operations
   - Transaction support
   - Error mapping

2. Update existing services to use repositories:
   - AuthService
   - User management

3. Success Criteria:
   - No direct pool usage
   - Proper error handling
   - Complete test coverage

### Phase 3: Service Layer Updates (Week 2)

1. Refactor services:
   - Use repositories
   - Implement error handling
   - Add validation

2. Success Criteria:
   - Clean service layer
   - Consistent error handling
   - Proper validation

### Phase 4: Monitoring Setup (Week 2-3)

1. Implement monitoring:
   - Query performance tracking
   - Connection pool metrics
   - Error rate monitoring

2. Success Criteria:
   - Performance metrics available
   - Resource utilization tracked
   - Error patterns visible

### Phase 5: Migration Tools (Week 3)

1. Setup migration infrastructure:
   - Rollback capabilities
   - Schema validation
   - Migration testing

2. Success Criteria:
   - Safe schema changes
   - Automated validation
   - Reliable rollbacks

## Success Metrics

### Performance
- Test execution time reduced by 50%
- Query execution time under 100ms for 95% of queries
- Connection pool utilization under 80%

### Reliability
- Zero connection leaks
- Successful migration rollbacks
- Consistent error handling

### Code Quality
- 100% repository pattern adoption
- No direct pool usage
- Complete test coverage
- Proper transaction management

## Benefits

1. **Separation of Concerns**
   - Clear layer responsibilities
   - Improved maintainability
   - Better testability

2. **Data Access Control**
   - Centralized database access
   - Consistent patterns
   - Better security

3. **Error Management**
   - Structured error handling
   - Clear error hierarchy
   - Better debugging

4. **Testing Improvements**
   - Proper test isolation
   - Transaction support
   - Easier mocking

## Next Steps

1. Begin Phase 1 implementation
2. Set up monitoring infrastructure
3. Update team documentation
4. Schedule code review sessions