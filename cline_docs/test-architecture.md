# Test Architecture Revision

## Current Issues

### Direct Database Access
- TestDatabaseManager currently executes SQL scripts directly
- This bypasses our repository layer encapsulation
- Violates our architectural principle of database access through repositories

### Problems with Current Approach
1. Breaks Encapsulation
   - Direct SQL execution in TestDatabaseManager
   - Bypasses repository layer validation
   - Makes testing inconsistent with production code

2. Maintenance Issues
   - Schema changes need to be synchronized in multiple places
   - SQL scripts may get out of sync with repository logic
   - Harder to track database state

## Revised Architecture

### 1. Repository-Based Setup
```javascript
// Each repository handles its own setup
class BaseRepository {
  async initializeSchema() {
    // Create tables and indexes
    // Set up constraints
    // Initialize triggers
  }
}
```

### 2. TestDatabaseManager Responsibilities
- Coordinate repository initialization
- Manage test transactions
- Handle cleanup
- Provide test data factories

### 3. Implementation Pattern
```javascript
// TestDatabaseManager coordinates setup
class TestDatabaseManager {
  async setup() {
    // Initialize repositories in correct order
    await userRepository.initializeSchema();
    await employeeRepository.initializeSchema();
    await projectRepository.initializeSchema();
    // etc.
  }
}
```

## Benefits

### 1. Encapsulation
- All database access through repositories
- Consistent patterns between test and production
- Better separation of concerns

### 2. Maintainability
- Schema changes in one place
- Repository owns its data structure
- Easier to track changes

### 3. Testing
- More reliable tests
- Consistent data setup
- Better error handling

## Implementation Steps

### 1. Update BaseRepository
1. Add schema initialization methods
2. Handle table creation
3. Manage constraints and triggers

### 2. Update Individual Repositories
1. Implement specific schema needs
2. Handle unique constraints
3. Set up indexes

### 3. Revise TestDatabaseManager
1. Remove direct SQL execution
2. Coordinate repository initialization
3. Manage test lifecycle

### 4. Update Test Setup
1. Use repository methods
2. Maintain test data factories
3. Handle cleanup properly

## Migration Plan

### Phase 1: Repository Updates
1. Add schema management to repositories
2. Move SQL definitions into repositories
3. Add initialization methods

### Phase 2: TestDatabaseManager Revision
1. Remove direct SQL execution
2. Update setup process
3. Improve error handling

### Phase 3: Test Updates
1. Update existing tests
2. Verify data consistency
3. Improve cleanup

## Success Criteria

### 1. Encapsulation
- No direct SQL in TestDatabaseManager
- All database access through repositories
- Consistent patterns throughout

### 2. Reliability
- Tests run consistently
- Clean setup and teardown
- Proper error handling

### 3. Maintainability
- Schema changes in one place
- Clear ownership of database structures
- Easy to track changes

## Next Steps
1. Switch to Code mode
2. Update BaseRepository
3. Implement repository changes
4. Revise TestDatabaseManager