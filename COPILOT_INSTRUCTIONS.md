# Copilot Instructions

## Architecture Overview

This codebase follows a layered architecture with strict separation of concerns:

```
Routes → Services → Repositories → Database
```

## Key Architectural Principles

1. **Repository Pattern**
   - All database access MUST go through repositories
   - Direct database queries outside repositories are FORBIDDEN
   - Each repository method MUST handle its own transactions

2. **Error Handling**
   - Use custom error classes from `src/errors/`
   - Map database errors to domain errors
   - Maintain error chain for debugging

3. **Transaction Management**
   - Use `withTransaction` helper for database operations
   - Ensure proper client release
   - Handle rollbacks on errors

## Code Organization

```
src/
├── repositories/        # Database access layer
├── services/           # Business logic layer
├── routes/            # HTTP endpoints
├── errors/            # Custom error classes
├── middleware/        # Express middleware
└── utils/            # Shared utilities
```

## Coding Standards

### 1. Repository Layer

✅ DO:
```javascript
class UserRepository {
  async findByEmail(email, client = this.client) {
    const result = await (client || pool).query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }
}
```

❌ DON'T:
```javascript
// Don't access database directly from services
class AuthService {
  async findUser(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }
}
```

### 2. Error Handling

✅ DO:
```javascript
try {
  const user = await this.userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError('User', email);
  }
} catch (error) {
  if (error instanceof DatabaseError) {
    throw new ServiceError('Failed to find user', error);
  }
  throw error;
}
```

❌ DON'T:
```javascript
// Don't swallow errors or use generic error messages
try {
  await someOperation();
} catch (error) {
  console.error(error);
  throw new Error('Something went wrong');
}
```

### 3. Transaction Handling

✅ DO:
```javascript
async createUser(email, password) {
  return this.withTransaction(async (client) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.create({ email, password: hashedPassword }, client);
  });
}
```

❌ DON'T:
```javascript
// Don't manage transactions manually
async createUser(email, password) {
  const client = await pool.connect();
  await client.query('BEGIN');
  try {
    // ... operations
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## Testing Guidelines

### 1. Test Structure

✅ DO:
```javascript
describe('UserService', () => {
  let userService;
  let userRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    userService = new UserService(userRepository);
  });

  it('should create user', async () => {
    const user = await userService.createUser('test@example.com', 'password');
    expect(user).toHaveProperty('id');
  });
});
```

❌ DON'T:
```javascript
// Don't test repositories directly in service tests
it('should create user', async () => {
  const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2)',
    ['test@example.com', 'password']
  );
  expect(result.rows[0]).toBeDefined();
});
```

### 2. Test Isolation

✅ DO:
```javascript
beforeEach(async () => {
  await pool.query('BEGIN');
});

afterEach(async () => {
  await pool.query('ROLLBACK');
});
```

❌ DON'T:
```javascript
// Don't clean up by deleting data
afterEach(async () => {
  await pool.query('DELETE FROM users');
});
```

## Performance Considerations

1. **Connection Pooling**
   - Use the provided pool instance
   - Don't create new pools
   - Release clients properly

2. **Query Optimization**
   - Use parameterized queries
   - Add appropriate indexes
   - Avoid N+1 queries

3. **Resource Management**
   - Use transactions appropriately
   - Release resources in finally blocks
   - Handle cleanup properly

## Security Guidelines

1. **Input Validation**
   - Validate all input at service layer
   - Use parameterized queries
   - Escape special characters

2. **Authentication**
   - Use provided auth middleware
   - Validate tokens properly
   - Handle session expiry

3. **Authorization**
   - Check permissions in services
   - Use role-based access control
   - Document access requirements

## Documentation Requirements

1. **Code Comments**
   - Document complex business logic
   - Explain non-obvious decisions
   - Include example usage

2. **Type Definitions**
   - Document parameter types
   - Define return types
   - Include error types

3. **API Documentation**
   - Document endpoints
   - Include request/response examples
   - List error responses

## Monitoring and Logging

1. **Error Tracking**
   - Log errors with context
   - Include stack traces
   - Use appropriate log levels

2. **Performance Monitoring**
   - Track query execution times
   - Monitor connection pool
   - Log slow operations

3. **Audit Logging**
   - Log security events
   - Track data changes
   - Include user context

## Maintenance Guidelines

1. **Code Updates**
   - Follow existing patterns
   - Update tests
   - Document changes

2. **Schema Changes**
   - Update repositories
   - Add migrations
   - Update documentation

3. **Dependency Updates**
   - Test thoroughly
   - Update types
   - Document breaking changes