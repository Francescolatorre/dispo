# Service Layer Updates - Phase 3 Implementation Plan

## Overview

This document outlines the implementation plan for Phase 3 of our database architecture improvements, focusing on service layer updates, validation integration, and error handling standardization.

## Current Status

- ✅ Phase 1: Core Infrastructure complete
- ✅ Phase 2: Repository Implementation complete
- 🔄 Phase 3: Service Layer Updates in progress

## Implementation Steps

### 1. Dependencies Setup

```bash
npm install --save ajv ajv-formats ajv-errors
```

Required for:
- JSON Schema validation
- Extended format validations
- Custom error messages

### 2. Schema Implementation

1. Create schema directory structure:
```
src/
  schemas/
    user.json        # User validation schema
    employee.json    # Employee validation schema
    project.json     # Project validation schema
    common/
      address.json   # Reusable address schema
      contact.json   # Reusable contact schema
```

2. Convert documented schemas to JSON files
3. Add schema tests for validation rules

### 3. Service Updates

#### AuthService Updates
- Integrate schema validation
- Add business rule validation
- Improve error handling
- Add validation tests

Example:
```javascript
class AuthService {
  async createUser(userData) {
    // Schema validation
    await validationService.validate('user', userData);
    
    // Business rule validation
    await this.validateBusinessRules(userData);
    
    // Proceed with creation
    return this.userRepository.createUser(userData);
  }
}
```

#### EmployeeService Updates
- Add employee schema validation
- Implement work time validation
- Add seniority level validation
- Update tests

#### ProjectService Updates
- Add project schema validation
- Implement date range validation
- Add resource allocation validation
- Update tests

### 4. Middleware Updates

1. Create validation middleware factory
```javascript
const createValidationMiddleware = (schemaName) => {
  return async (req, res, next) => {
    try {
      await validationService.validate(schemaName, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

2. Update route handlers:
```javascript
router.post('/users',
  validateRequest('user'),
  authController.createUser
);
```

### 5. Error Handler Updates

1. Standardize error responses
```javascript
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: {
        type: error.name,
        message: error.message,
        details: error.details
      }
    });
  }
  next(error);
});
```

2. Add error logging
3. Implement error monitoring

### 6. Testing Strategy

1. Schema Validation Tests
```javascript
describe('User Schema Validation', () => {
  it('should validate valid user data', async () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User'
    };
    await expect(validateSchema('user', validUser))
      .resolves.toBeTruthy();
  });
});
```

2. Service Layer Tests
   - Test validation integration
   - Test business rules
   - Test error handling

3. Integration Tests
   - Test API endpoints
   - Test error responses
   - Test validation middleware

## Success Criteria

1. **Validation Coverage**
   - All service methods validate input
   - All API endpoints use validation middleware
   - Custom business rules implemented

2. **Error Handling**
   - Consistent error format
   - Proper error status codes
   - Detailed validation messages

3. **Test Coverage**
   - Schema validation tests
   - Service layer tests
   - Integration tests

4. **Performance**
   - Validation < 50ms
   - Error handling < 10ms
   - No memory leaks

## Rollout Plan

1. **Phase 1: Core Updates**
   - Implement validation service
   - Add base schemas
   - Update error handling

2. **Phase 2: Service Migration**
   - Update AuthService
   - Update EmployeeService
   - Update ProjectService

3. **Phase 3: Testing**
   - Add validation tests
   - Update service tests
   - Add integration tests

4. **Phase 4: Monitoring**
   - Add performance monitoring
   - Add error tracking
   - Add validation metrics

## Risk Mitigation

1. **Backward Compatibility**
   - Keep existing validation temporarily
   - Gradual migration
   - Feature flags if needed

2. **Performance Impact**
   - Schema caching
   - Optimized validation
   - Performance monitoring

3. **Error Handling**
   - Graceful degradation
   - Detailed logging
   - Error tracking

## Next Steps

1. Review and approve implementation plan
2. Create validation service
3. Implement base schemas
4. Begin service updates
5. Add test coverage