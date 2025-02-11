# User Schema Definition

## Overview

This document defines the JSON Schema for user validation across the application. This schema will be used for both API input validation and service-layer data validation.

## Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "maxLength": 255,
      "description": "User's email address",
      "errorMessage": {
        "format": "Must be a valid email address",
        "maxLength": "Email cannot exceed 255 characters"
      }
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "maxLength": 100,
      "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d\\w\\W]*$",
      "description": "User's password (hashed before storage)",
      "errorMessage": {
        "minLength": "Password must be at least 8 characters long",
        "pattern": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      }
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "pattern": "^[\\p{L}\\s'-]+$",
      "description": "User's full name",
      "errorMessage": {
        "minLength": "Name is required",
        "maxLength": "Name cannot exceed 100 characters",
        "pattern": "Name can only contain letters, spaces, hyphens, and apostrophes"
      }
    },
    "role": {
      "type": "string",
      "enum": ["user", "admin"],
      "default": "user",
      "description": "User's role in the system",
      "errorMessage": {
        "enum": "Role must be either 'user' or 'admin'"
      }
    }
  },
  "required": ["email", "password", "name"],
  "additionalProperties": false
}
```

## Usage Examples

### Valid User Data

```json
{
  "email": "john.doe@example.com",
  "password": "Password123",
  "name": "John Doe",
  "role": "user"
}
```

### Invalid Examples

1. Missing required field:
```json
{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

2. Invalid email format:
```json
{
  "email": "not-an-email",
  "password": "Password123",
  "name": "John Doe"
}
```

3. Weak password:
```json
{
  "email": "john.doe@example.com",
  "password": "password",
  "name": "John Doe"
}
```

## Integration Points

### 1. Middleware Validation

```javascript
app.post('/api/users', 
  validateRequest('user'),
  userController.createUser
);
```

### 2. Service Layer Validation

```javascript
class UserService {
  async createUser(userData) {
    await validationService.validate('user', userData);
    // Proceed with user creation
  }
}
```

## Error Responses

When validation fails, the API will return a 400 Bad Request with detailed error information:

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "value": "invalid-email"
      },
      {
        "field": "password",
        "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "value": "[REDACTED]"
      }
    ]
  }
}
```

## Security Considerations

1. Password Requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

2. Input Sanitization:
   - All string inputs are length-limited
   - Name field restricted to valid characters
   - Email format validation

3. Data Protection:
   - Password values redacted in error messages
   - Additional properties not allowed
   - Role values restricted to predefined set

## Next Steps

1. Implement the schema in JSON format
2. Add to validation service
3. Update user-related endpoints
4. Add validation tests
5. Document API changes