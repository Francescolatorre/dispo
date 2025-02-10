# System Patterns

## Code Style and Standards

### Module System
- Use ES modules (import/export) consistently across the codebase
- Always use `.js` extension in import paths
- Examples:
  ```javascript
  // ✓ Correct
  import express from 'express';
  import { pool } from '../config/database.js';
  export { validateProject };
  export default router;

  // ✗ Incorrect
  const express = require('express');
  const pool = require('../config/database');
  module.exports = validateProject;
  module.exports = router;
  ```

### Error Handling
- Use try/catch blocks for async operations
- Log errors with console.error
- Return consistent error responses
- Include meaningful error messages

### Route Structure
- Group related endpoints
- Use middleware for validation
- Consistent error response format
- Clear route naming

### Database Queries
- Use parameterized queries
- Handle connection errors
- Consistent response format
- Clear error messages

### Testing
- Test files alongside source code
- Use descriptive test names
- Mock external dependencies
- Test error cases

### File Organization
- Group related functionality
- Clear file naming
- Consistent directory structure
- Separate concerns

### Documentation
- Clear comments for complex logic
- JSDoc for public functions
- README files for setup
- API documentation

### Security
- Input validation
- Rate limiting where needed
- Secure password handling
- JWT for authentication

### Performance
- Efficient database queries
- Proper indexing
- Caching when beneficial
- Resource cleanup

### Middleware
- Validation middleware
- Error handling middleware
- Authentication middleware
- Logging middleware
