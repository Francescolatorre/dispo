# Critical Areas for Copilot Attention

This document outlines specific areas of the codebase that require extra attention when using Copilot for code generation or modification.

## Performance-Critical Sections

### 1. Database Connection Management
```javascript
// CRITICAL: Always use connection pooling
// DO NOT create new pool instances
import pool from '../config/database.js';

// CRITICAL: Always release connections
const client = await pool.connect();
try {
  // ... operations
} finally {
  client.release();
}
```

### 2. Transaction Handling
```javascript
// CRITICAL: Use transactions for multi-operation sequences
// CRITICAL: Ensure proper rollback on errors
async function criticalOperation() {
  return this.withTransaction(async (client) => {
    const result1 = await operation1(client);
    const result2 = await operation2(client);
    return finalResult;
  }); // Transaction automatically handled
}
```

### 3. Query Performance
```javascript
// CRITICAL: Use parameterized queries
// CRITICAL: Avoid N+1 query problems
// CRITICAL: Consider indexing implications

// GOOD: Single efficient query
const result = await this.findByIds(userIds);

// BAD: N+1 query problem
for (const userId of userIds) {
  await this.findById(userId);
}
```

## Security-Sensitive Areas

### 1. Authentication
```javascript
// CRITICAL: Token validation
// CRITICAL: Password hashing
// CRITICAL: Session management

class AuthService {
  // CRITICAL: Use strong hashing
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // CRITICAL: Secure token generation
  generateToken(user) {
    return jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}
```

### 2. Input Validation
```javascript
// CRITICAL: Validate all user input
// CRITICAL: Sanitize SQL inputs
// CRITICAL: Prevent injection attacks

// GOOD: Parameterized query with validation
async function updateUser(userId, data) {
  validateUserInput(data); // Must be called
  const query = {
    text: 'UPDATE users SET name = $1 WHERE id = $2',
    values: [data.name, userId]
  };
  return pool.query(query);
}
```

### 3. Authorization
```javascript
// CRITICAL: Role-based access control
// CRITICAL: Permission checking
// CRITICAL: Resource ownership validation

async function updateResource(userId, resourceId, data) {
  // CRITICAL: Always check permissions first
  await this.checkPermission(userId, resourceId);
  return this.repository.update(resourceId, data);
}
```

## Cross-Component Dependencies

### 1. Service Dependencies
```javascript
// CRITICAL: Maintain service boundaries
// CRITICAL: Proper dependency injection
class UserService {
  constructor(
    userRepository,    // Required
    authService,       // Required
    emailService = null // Optional
  ) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.emailService = emailService;
  }
}
```

### 2. Transaction Boundaries
```javascript
// CRITICAL: Maintain transaction integrity across services
// CRITICAL: Proper error propagation

async function complexOperation() {
  return this.withTransaction(async (client) => {
    // All operations must use the same client
    const result1 = await service1.operation(client);
    const result2 = await service2.operation(client);
    return finalResult;
  });
}
```

## Error Handling Requirements

### 1. Error Propagation
```javascript
// CRITICAL: Maintain error chain
// CRITICAL: Proper error classification
try {
  await operation();
} catch (error) {
  // CRITICAL: Add context, preserve original error
  throw new ServiceError('Operation failed', error);
}
```

### 2. Error Recovery
```javascript
// CRITICAL: Proper cleanup on errors
// CRITICAL: System state consistency
async function criticalOperation() {
  const resources = [];
  try {
    // Acquire resources
  } catch (error) {
    // CRITICAL: Clean up any acquired resources
    await cleanup(resources);
    throw error;
  }
}
```

## Testing Requirements

### 1. Test Isolation
```javascript
// CRITICAL: Proper test isolation
// CRITICAL: Transaction handling in tests
describe('CriticalFeature', () => {
  beforeEach(async () => {
    await pool.query('BEGIN');
  });

  afterEach(async () => {
    await pool.query('ROLLBACK');
  });
});
```

### 2. Security Testing
```javascript
// CRITICAL: Test security measures
it('should prevent unauthorized access', async () => {
  const unauthorizedUser = await createTestUser('user');
  await expect(
    service.accessResource(unauthorizedUser.id)
  ).rejects.toThrow(AuthorizationError);
});
```

## Monitoring and Logging

### 1. Performance Monitoring
```javascript
// CRITICAL: Track critical operations
// CRITICAL: Monitor resource usage
async function monitoredOperation() {
  const start = process.hrtime();
  try {
    return await operation();
  } finally {
    const [seconds, nanoseconds] = process.hrtime(start);
    logOperationDuration('operation', seconds, nanoseconds);
  }
}
```

### 2. Security Logging
```javascript
// CRITICAL: Log security events
// CRITICAL: Protect sensitive data
async function securitySensitiveOperation(userId, data) {
  try {
    const result = await operation(userId, data);
    logSecurityEvent('operation_success', { userId });
    return result;
  } catch (error) {
    logSecurityEvent('operation_failure', { 
      userId,
      error: error.message // Don't log full error details
    });
    throw error;
  }
}
```

## Maintenance Considerations

### 1. Schema Changes
```javascript
// CRITICAL: Maintain backward compatibility
// CRITICAL: Update all affected repositories
class UserRepository {
  // CRITICAL: Support both old and new schemas during migration
  async findUser(id) {
    const user = await this.findById(id);
    return this.mapToCurrentSchema(user);
  }
}
```

### 2. API Changes
```javascript
// CRITICAL: Maintain API contracts
// CRITICAL: Version breaking changes
class UserService {
  // CRITICAL: Deprecate old methods properly
  /** @deprecated Use findUserById instead */
  async getUser(id) {
    return this.findUserById(id);
  }
}