# Database Implementation: Phase 1 - Core Infrastructure

## Overview

This document outlines the first phase of our database architecture improvements, focusing on establishing the core infrastructure components that will serve as the foundation for subsequent phases.

## 1. Base Repository Implementation

### Location: `src/repositories/base.js`

```javascript
import pool from '../config/database.js';
import { DatabaseError } from '../errors/index.js';

export class BaseRepository {
  constructor(client = null) {
    this.client = client;
  }

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
}
```

## 2. Error Handling Infrastructure

### Location: `src/errors/index.js`

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

  toJSON() {
    return {
      error: {
        ...super.toJSON().error,
        field: this.field
      }
    };
  }
}

export class AuthenticationError extends BaseError {
  constructor(message) {
    super(message);
    this.statusCode = 401;
  }
}

export class NotFoundError extends BaseError {
  constructor(entity, identifier) {
    super(`${entity} with identifier ${identifier} not found`);
    this.entity = entity;
    this.identifier = identifier;
    this.statusCode = 404;
  }
}

export class UniqueConstraintError extends DatabaseError {
  constructor(field, value, originalError) {
    super(`Duplicate value for ${field}: ${value}`, originalError);
    this.field = field;
    this.value = value;
    this.statusCode = 409;
  }
}
```

## 3. Test Infrastructure

### Location: `src/test/setup.js`

```javascript
import pool from '../config/database.js';

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

  static async cleanup(client) {
    await client.query('ROLLBACK');
    client.release();
  }

  static async setupSchema(client) {
    // Create trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT users_email_unique UNIQUE (email)
      )
    `);

    // Create trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }
}
```

## Implementation Steps

1. Create the necessary directories:
```bash
mkdir -p src/repositories src/errors src/test
```

2. Implement the base files as shown above

3. Update test configuration to use the new test infrastructure:
```javascript
// In test setup files
beforeAll(async () => {
  client = await TestDatabase.initialize();
});

beforeEach(async () => {
  await TestDatabase.createSavepoint(client, 'test');
});

afterEach(async () => {
  await TestDatabase.rollbackToSavepoint(client, 'test');
});

afterAll(async () => {
  await TestDatabase.cleanup(client);
});
```

## Success Criteria

1. **Error Handling**
   - All database errors properly categorized
   - Consistent error response format
   - Error context preserved

2. **Test Infrastructure**
   - Tests run with proper isolation
   - Faster test execution with savepoints
   - Consistent database state

3. **Base Repository**
   - Transaction management working
   - Query performance logging functional
   - Error handling integrated

## Next Steps

1. Review and implement this core infrastructure
2. Begin implementing specific repositories (UserRepository)
3. Update existing tests to use new infrastructure
4. Add monitoring for query performance

## Migration Notes

- These changes are foundational and don't affect the database schema
- Can be implemented without downtime
- Existing code can be gradually migrated to use new patterns