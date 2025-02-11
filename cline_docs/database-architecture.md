# Database Architecture: Repository Pattern Implementation

## Overview

We are implementing the repository pattern to properly encapsulate database access and improve our application's architecture. This document combines our comprehensive strategy for implementing the repository pattern, including error handling, test transactions, and migration approach.

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

## New Architecture

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

## Implementation Components

### 1. Repository Layer

```javascript
class BaseRepository {
  constructor(client = null) {
    this.client = client;
  }

  async withTransaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

class UserRepository extends BaseRepository {
  async createUser(email, password, name, role, client = this.client) {
    try {
      const result = await (client || pool).query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, password, name, role]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        throw new UniqueConstraintError('email', email, error);
      }
      throw new DatabaseError('Failed to create user', error);
    }
  }

  async findByEmail(email) {
    try {
      const result = await (this.client || pool).query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      if (!result.rows[0]) {
        throw new NotFoundError('User', email);
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to find user', error);
    }
  }
}
```

### 2. Error Handling

```javascript
class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
    this.code = originalError.code;
  }
}

class UniqueConstraintError extends DatabaseError {
  constructor(field, value, originalError) {
    super(`Duplicate value for ${field}: ${value}`, originalError);
    this.name = 'UniqueConstraintError';
    this.field = field;
    this.value = value;
  }
}

class NotFoundError extends DatabaseError {
  constructor(entity, id) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.entity = entity;
    this.id = id;
  }
}

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}
```

### 3. Service Layer

```javascript
class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async login(email, password) {
    try {
      const user = await this.userRepository.findByEmail(email);
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new AuthenticationError('Invalid credentials');
      }

      const updatedUser = await this.userRepository.updateLastLogin(user.id);
      const { password: _, ...userData } = updatedUser;
      const token = this.generateToken(userData);

      return { user: userData, token };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new AuthenticationError('Invalid credentials');
      }
      throw error;
    }
  }
}
```

### 4. Test Transaction Handling

```javascript
describe('AuthService', () => {
  let client;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query('BEGIN');
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    client.release();
  });

  it('should handle login correctly', async () => {
    const userRepository = new UserRepository(client);
    const authService = new AuthService(userRepository);
    // Test implementation
  });
});
```

## Migration Strategy

### Phase 1: Infrastructure Setup (Week 1)
1. Create repository structure
2. Implement error classes
3. Create transaction utilities

### Phase 2: Repository Implementation (Week 2)
1. Create base repository
2. Implement user repository
3. Add repository tests

### Phase 3: Service Layer Updates (Week 2-3)
1. Update auth service
2. Add service tests
3. Implement error handling

### Phase 4: Route Layer Updates (Week 3)
1. Update route handlers
2. Add route tests
3. Implement error responses

### Phase 5: Database Access Cleanup (Week 4)
1. Remove direct pool usage
2. Update test utilities
3. Add monitoring

## Implementation Guidelines

### 1. Error Handling
- Use custom error classes
- Include relevant context
- Preserve original errors
- Proper error propagation

### 2. Transaction Management
- Proper transaction boundaries
- Resource cleanup
- Error recovery
- Connection pooling

### 3. Testing Strategy
- Transaction support
- Test isolation
- Comprehensive coverage
- Performance validation

### 4. Code Organization
- Clear directory structure
- Consistent naming
- Proper layering
- Documentation

## Monitoring and Validation

### 1. Performance Metrics
- Response times
- Query execution times
- Connection pool usage
- Resource utilization

### 2. Error Tracking
- Error rates by type
- Stack traces
- Context information
- Recovery patterns

### 3. Success Criteria
- No direct database access
- Consistent error handling
- Complete test coverage
- Improved maintainability

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

1. Review and approve architecture
2. Set up repository structure
3. Begin implementation
4. Update documentation