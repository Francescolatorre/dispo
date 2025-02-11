# Database Implementation Plan

## Phase 1: Core Infrastructure (Week 1)

### 1. Create Base Repository
```javascript
// src/repositories/BaseRepository.js
export class BaseRepository {
  constructor(client = null) {
    this.client = client;
  }

  async withTransaction(callback) {
    const client = this.client || await pool.connect();
    let isNewTransaction = !this.client;

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
}
```

### 2. Implement Error Classes
```javascript
// src/errors/index.js
export class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
    this.code = originalError?.code;
    this.statusCode = 500;
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        type: this.name,
        statusCode: this.statusCode
      }
    };
  }
}

export class AuthenticationError extends DatabaseError {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

export class UniqueConstraintError extends DatabaseError {
  constructor(field, value, originalError) {
    super(`Duplicate value for ${field}: ${value}`, originalError);
    this.name = 'UniqueConstraintError';
    this.field = field;
    this.value = value;
    this.statusCode = 409;
  }
}
```

### 3. Update Test Infrastructure
```javascript
// src/test/setup.js
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

  private static async setupSchema(client) {
    // Schema setup code...
  }
}
```

## Phase 2: Repository Implementation (Week 1-2)

### 1. User Repository
```javascript
// src/repositories/UserRepository.js
export class UserRepository extends BaseRepository {
  async createUser(email, password, name, role = 'user', client = this.client) {
    return this.withTransaction(async (txClient) => {
      try {
        const result = await txClient.query(
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
    });
  }

  async updateLastLogin(userId) {
    return this.withTransaction(async (client) => {
      try {
        const result = await client.query(
          'UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING *',
          [userId]
        );
        if (!result.rows[0]) {
          throw new NotFoundError('User', userId);
        }
        return result.rows[0];
      } catch (error) {
        throw new DatabaseError('Failed to update last login', error);
      }
    });
  }
}
```

## Phase 3: Service Layer Updates (Week 2)

### 1. Auth Service Refactor
```javascript
// src/services/AuthService.js
export class AuthService {
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

      await this.userRepository.updateLastLogin(user.id);
      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw new AuthenticationError('Invalid credentials');
      }
      throw error;
    }
  }
}
```

## Phase 4: Monitoring Setup (Week 2-3)

### 1. Connection Pool Metrics
```javascript
// src/monitoring/database.js
export class DatabaseMetrics {
  static collectPoolMetrics() {
    const metrics = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      timestamp: new Date()
    };
    return metrics;
  }

  static async queryTiming(query, params) {
    const start = process.hrtime();
    try {
      return await query(params);
    } finally {
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      // Log or store query timing
    }
  }
}
```

## Phase 5: Migration Tools (Week 3)

### 1. Migration Scripts
```bash
# package.json scripts
{
  "scripts": {
    "migrate": "node scripts/migrate.js",
    "migrate:rollback": "node scripts/migrate.js rollback",
    "migrate:status": "node scripts/migrate.js status"
  }
}
```

### 2. Schema Validation
```javascript
// scripts/validate-schema.js
async function validateSchema() {
  const client = await pool.connect();
  try {
    // Validate table structure
    const tables = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public'
    `);
    
    // Validate constraints
    const constraints = await client.query(`
      SELECT constraint_name, table_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
    `);
    
    // Compare with expected schema
  } finally {
    client.release();
  }
}
```

## Success Criteria

### Performance Metrics
- Test execution time reduced by 50%
- Query execution time under 100ms for 95% of queries
- Connection pool utilization under 80%

### Error Handling
- All database errors properly categorized
- Consistent error response format
- Proper error context preservation

### Code Quality
- 100% repository pattern adoption
- No direct pool usage in services
- Complete test coverage
- Proper transaction management

## Next Steps

1. Review and approve implementation plan
2. Set up monitoring infrastructure
3. Begin Phase 1 implementation
4. Schedule team training on new patterns

## Questions for Discussion

1. Should we implement query logging for development environments?
2. Do we need additional error types for specific use cases?
3. Should we consider implementing a query builder?