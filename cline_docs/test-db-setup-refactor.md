# Test Database Setup Refactoring Plan

## Current Issues
- Direct database access in setup-test-db.js
- Bypasses repository layer
- Violates encapsulation principle
- Duplicates schema definitions

## Architectural Changes Needed

### 1. Repository-Based Setup
```typescript
// Each repository handles its own schema
interface IRepository {
  initializeSchema(): Promise<void>;
  dropSchema(): Promise<void>;
}

class BaseRepository implements IRepository {
  async initializeSchema() {
    // Create tables and constraints
  }

  async dropSchema() {
    // Drop tables in correct order
  }
}
```

### 2. Schema Management
- Move schema definitions to repositories
- Each repository owns its table structure
- Handle dependencies between tables
- Manage constraints and triggers

### 3. Test Database Manager
```typescript
class TestDatabaseManager {
  private repositories: {
    user: UserRepository;
    employee: EmployeeRepository;
    project: ProjectRepository;
    requirement: RequirementRepository;
  };

  async setup() {
    // Initialize schemas in correct order
    await this.dropSchemas();
    await this.initializeSchemas();
  }

  private async dropSchemas() {
    // Drop in reverse dependency order
    await this.repositories.requirement.dropSchema();
    await this.repositories.project.dropSchema();
    await this.repositories.employee.dropSchema();
    await this.repositories.user.dropSchema();
  }

  private async initializeSchemas() {
    // Create in dependency order
    await this.repositories.user.initializeSchema();
    await this.repositories.employee.initializeSchema();
    await this.repositories.project.initializeSchema();
    await this.repositories.requirement.initializeSchema();
  }
}
```

## Implementation Steps

### 1. Update BaseRepository
- Add schema management methods
- Handle table creation/deletion
- Manage constraints
- Support transactions

### 2. Update Individual Repositories
- Move schema definitions from setup-test-db.js
- Implement initializeSchema
- Implement dropSchema
- Handle dependencies

### 3. Update TestDatabaseManager
- Remove direct SQL execution
- Use repository methods
- Handle initialization order
- Manage cleanup

### 4. Update Test Setup
- Use TestDatabaseManager
- Remove direct database access
- Improve error handling
- Add logging

## Benefits

### 1. Encapsulation
- Schema management in repositories
- Consistent database access
- Clear ownership
- Better maintainability

### 2. Testing
- Reliable setup/teardown
- Consistent patterns
- Better error handling
- Clear dependencies

### 3. Maintenance
- Single source of truth
- Easy schema updates
- Clear dependencies
- Better traceability

## Migration Plan

### Phase 1: Repository Updates
1. Add schema methods to BaseRepository
2. Move schema definitions to repositories
3. Implement initialization logic
4. Add proper error handling

### Phase 2: Test Infrastructure
1. Update TestDatabaseManager
2. Remove direct SQL
3. Use repository methods
4. Add logging

### Phase 3: Verification
1. Run all tests
2. Verify schema creation
3. Check cleanup
4. Monitor performance

## Success Criteria

### 1. Architecture
- No direct SQL in setup
- Clean encapsulation
- Clear dependencies
- Proper logging

### 2. Testing
- All tests passing
- Clean setup/teardown
- Error handling
- Performance metrics

### 3. Maintenance
- Easy schema updates
- Clear patterns
- Good documentation
- Simple debugging

## Next Steps
1. Switch to Code mode
2. Update BaseRepository
3. Implement schema methods
4. Update test infrastructure