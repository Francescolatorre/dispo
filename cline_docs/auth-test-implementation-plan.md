# Auth Testing Implementation Plan - Updated

## Repository Layer (Day 1)

### UserRepository Test Structure

```javascript
// src/repositories/__tests__/user.repository.test.js

describe('UserRepository', () => {
  let userRepository;
  let client;
  let testCount = 0;

  const getUniqueEmail = () => `test${testCount}@example.com`;

  beforeEach(async () => {
    client = await createTestTransaction();
    userRepository = new UserRepository(client);
    testCount++;
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    await client.release();
  });

  describe('CRUD Operations', () => {
    describe('createUser', () => {
      it('should create user with valid data', async () => {
        // Test basic user creation
      });

      it('should handle duplicate email', async () => {
        // Test unique constraint
      });

      it('should set default role if not provided', async () => {
        // Test default values
      });
    });

    describe('findByEmail', () => {
      it('should find existing user', async () => {
        // Test successful retrieval
      });

      it('should throw NotFoundError for non-existent email', async () => {
        // Test error case
      });
    });

    describe('findById', () => {
      it('should find existing user', async () => {
        // Test successful retrieval
      });

      it('should throw NotFoundError for non-existent ID', async () => {
        // Test error case
      });

      it('should not return password hash', async () => {
        // Test data security
      });
    });

    describe('updateUser', () => {
      it('should update allowed fields', async () => {
        // Test field updates
      });

      it('should ignore non-allowed fields', async () => {
        // Test field filtering
      });

      it('should throw NotFoundError for non-existent user', async () => {
        // Test error case
      });
    });

    describe('deleteUser', () => {
      it('should delete existing user', async () => {
        // Test deletion
      });

      it('should throw NotFoundError for non-existent user', async () => {
        // Test error case
      });
    });

    describe('listUsers', () => {
      it('should return paginated results', async () => {
        // Test pagination
      });

      it('should handle empty result set', async () => {
        // Test edge case
      });

      it('should calculate hasMore correctly', async () => {
        // Test pagination flag
      });
    });
  });

  describe('Transaction Handling', () => {
    it('should rollback on error', async () => {
      // Test transaction rollback
    });

    it('should maintain isolation', async () => {
      // Test transaction isolation
    });
  });

  describe('Special Operations', () => {
    describe('updateLastLogin', () => {
      it('should update timestamp', async () => {
        // Test timestamp update
      });

      it('should throw NotFoundError for non-existent user', async () => {
        // Test error case
      });
    });
  });
});
```

## Service Layer (Day 2)

### AuthService Test Structure

```javascript
// src/services/__tests__/auth.service.test.js

describe('AuthService', () => {
  let authService;
  let userRepository;
  let client;

  beforeEach(async () => {
    client = await createTestTransaction();
    userRepository = new UserRepository(client);
    authService = new AuthService(userRepository);
  });

  describe('Authentication', () => {
    it('should authenticate valid credentials', async () => {
      // Test login success
    });

    it('should reject invalid password', async () => {
      // Test login failure
    });

    it('should update last login timestamp', async () => {
      // Test login side effect
    });
  });

  describe('Token Management', () => {
    it('should generate valid token', async () => {
      // Test token generation
    });

    it('should validate token', async () => {
      // Test token validation
    });

    it('should handle expired tokens', async () => {
      // Test token expiration
    });
  });

  describe('Password Management', () => {
    it('should validate password change', async () => {
      // Test password update
    });

    it('should reject invalid current password', async () => {
      // Test validation
    });
  });
});
```

## Route Layer (Day 3)

### Auth Routes Test Structure

```javascript
// src/routes/__tests__/auth.test.js

describe('Auth Routes', () => {
  let testUser;
  let userRepository;
  let client;

  beforeEach(async () => {
    client = await createTestTransaction();
    userRepository = new UserRepository(client);
    // Create test user
  });

  describe('POST /login', () => {
    it('should login with valid credentials', async () => {
      // Test login endpoint
    });

    it('should handle rate limiting', async () => {
      // Test rate limiter
    });
  });

  describe('GET /verify', () => {
    it('should verify valid token', async () => {
      // Test token verification
    });

    it('should reject expired token', async () => {
      // Test token expiration
    });
  });

  describe('POST /change-password', () => {
    it('should change password with valid data', async () => {
      // Test password change
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });
  });
});
```

## Implementation Steps

### Day 1: Repository Layer
1. Create user.repository.test.js
2. Implement CRUD tests
3. Add transaction tests
4. Verify error handling

### Day 2: Service Layer
1. Create auth.service.test.js
2. Implement authentication tests
3. Add token management tests
4. Test password handling

### Day 3: Route Layer
1. Update auth.test.js
2. Add missing test cases
3. Improve error testing
4. Test rate limiting

## Success Criteria

### Repository Layer
- All CRUD operations tested
- Transaction handling verified
- Error cases covered
- Data validation confirmed

### Service Layer
- Authentication flow tested
- Token management verified
- Password handling secured
- Error handling confirmed

### Route Layer
- All endpoints tested
- Rate limiting verified
- Error responses checked
- Authentication enforced

## Next Steps
1. Begin with repository tests
2. Verify each layer before moving to next
3. Document any issues found
4. Update implementation as needed