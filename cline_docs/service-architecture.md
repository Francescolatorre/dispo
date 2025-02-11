# Service Architecture Master Plan

## Overview

This document outlines our comprehensive service architecture, including database access patterns, validation strategies, error handling, and implementation plans.

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

## Core Components

### 1. Repository Layer

#### Base Repository
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

#### Query Performance Monitoring
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
```

### 2. Validation System

#### Schema-Based Validation
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "maxLength": 255,
      "description": "User's email address",
      "errorMessage": {
        "format": "Must be a valid email address",
        "maxLength": "Email cannot exceed 255 characters"
      }
    }
  }
}
```

#### Validation Middleware
```javascript
const validateRequest = (schemaName) => async (req, res, next) => {
  try {
    await validationService.validate(schemaName, req.body);
    next();
  } catch (error) {
    next(error);
  }
};
```

### 3. Error Handling

#### Error Hierarchy
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
```

#### Error Types
- ValidationError (400)
- AuthorizationError (401)
- NotFoundError (404)
- ConflictError (409)
- DatabaseError (500)

## Implementation Plan

### Phase 1: Core Infrastructure ✅

1. Directory Structure
```
src/
  repositories/     # Data access layer
  services/        # Business logic
  schemas/         # Validation schemas
  errors/          # Error classes
  middleware/      # Request processing
  routes/          # API endpoints
```

2. Base Components
- BaseRepository with transactions
- Error hierarchy
- Test infrastructure

### Phase 2: Repository Implementation ✅

1. User Repository
- CRUD operations
- Transaction support
- Error mapping

2. Service Integration
- AuthService using repository
- Transaction management
- Error handling

### Phase 3: Service Layer Updates 🔄

1. Schema Implementation
```
src/schemas/
  user.json        # User validation
  employee.json    # Employee validation
  project.json     # Project validation
  common/
    address.json   # Reusable schemas
    contact.json
```

2. Validation Service
```javascript
class ValidationService {
  async validate(schemaName, data) {
    const schema = await this.loadSchema(schemaName);
    const valid = ajv.validate(schema, data);
    if (!valid) {
      throw new ValidationError(
        'Validation failed',
        ajv.errors
      );
    }
  }
}
```

3. Service Updates
- Schema validation integration
- Business rule implementation
- Error standardization

### Phase 4: Monitoring Setup

1. Performance Tracking
- Query execution time
- Validation performance
- Error rates

2. Connection Pool Metrics
- Pool utilization
- Connection lifecycle
- Wait times

## Schema Definitions

### User Schema
```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "maxLength": 255
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d\\w\\W]*$"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "role": {
      "type": "string",
      "enum": ["user", "admin"]
    }
  },
  "required": ["email", "password", "name"]
}
```

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

1. Review service architecture document
2. Begin Phase 3 implementation
3. Set up monitoring infrastructure
4. Schedule code review sessions

## Migration Strategy

1. **Gradual Migration**
   - Update one service at a time
   - Keep backward compatibility
   - Validate each step

2. **Testing Approach**
   - Unit tests for schemas
   - Integration tests for services
   - End-to-end validation

3. **Rollback Plan**
   - Feature flags for new validation
   - Dual-running period
   - Monitoring for issues