# Validation Strategy

## Overview

This document outlines our approach to standardizing validation across the application, focusing on consistent error handling, reusable validation logic, and type safety.

## Current Issues

1. **Inconsistent Validation**
   - Direct response handling in middleware
   - No standardized validation schema
   - No field-specific error messages
   - Validation logic duplicated between middleware and services

2. **Limited Type Safety**
   - Basic type checking only
   - No schema-based validation
   - No runtime type guarantees

3. **Error Handling**
   - Inconsistent error formats
   - Mixed validation and business logic
   - No centralized error mapping

## Proposed Solution

### 1. JSON Schema Validation

```javascript
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "role": {
      "type": "string",
      "enum": ["user", "admin"]
    }
  },
  "required": ["name", "email"]
}
```

### 2. Validation Service

The ValidationService will:
- Load and cache JSON schemas
- Provide schema validation methods
- Map validation errors to our error types
- Support custom validation rules
- Enable validation reuse

### 3. Middleware Integration

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

### 4. Service Layer Integration

```javascript
class UserService {
  async createUser(userData) {
    await validationService.validate('user', userData);
    // Proceed with business logic
  }
}
```

## Implementation Plan

### Phase 1: Core Infrastructure

1. Install dependencies
   - ajv (JSON Schema validator)
   - ajv-formats (additional formats)
   - ajv-errors (custom error messages)

2. Create validation service
   - Schema loading and caching
   - Validation methods
   - Error mapping
   - Custom validators

3. Define base schemas
   - User schema
   - Employee schema
   - Project schema
   - Assignment schema

### Phase 2: Middleware Updates

1. Create validation middleware factory
2. Update existing middleware
3. Add error handling middleware
4. Add request sanitization

### Phase 3: Service Integration

1. Update services to use validation
2. Add business rule validation
3. Implement custom validators
4. Add validation tests

## Schema Organization

```
src/
  schemas/
    user.schema.json
    employee.schema.json
    project.schema.json
    assignment.schema.json
    common/
      address.schema.json
      contact.schema.json
```

## Error Handling

```javascript
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "value": "invalid-email"
      }
    ]
  }
}
```

## Benefits

1. **Consistency**
   - Standardized validation across application
   - Consistent error messages
   - Reusable validation logic

2. **Type Safety**
   - Runtime type checking
   - Schema-based validation
   - Custom validation rules

3. **Developer Experience**
   - Clear validation errors
   - Self-documenting schemas
   - Easy to extend

4. **Maintainability**
   - Centralized validation logic
   - Easy to update schemas
   - Reduced code duplication

## Next Steps

1. Review and approve validation strategy
2. Create JSON schemas for core entities
3. Implement validation service
4. Update middleware and services
5. Add validation tests

## Success Criteria

1. All input validation uses schema validation
2. No direct response handling in middleware
3. Consistent error messages across application
4. Complete test coverage for validation
5. Documentation for all schemas