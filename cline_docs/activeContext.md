# Active Context

## Current Task
Implementing MCP PostgreSQL server usage patterns for testing:
1. Backend services use direct pg pool connection
2. MCP PostgreSQL server reserved for testing and development assistance

## Recent Changes
- Reverted employeeService.js to use direct pg pool connection
- Verified all backend services are using direct database connections:
  * employeeService.js - Using pg pool ✓
  * requirementService.js - Using pg pool ✓
  * assignmentService.js - Using pg pool ✓
  * workloadService.js - Using pg pool ✓
- Created auth.mcp.test.js as example of MCP tool usage in tests:
  * Test data setup using execute tool
  * Test verification using query tool
  * Schema validation using get_table_info tool

## Next Steps
1. Create additional test examples for:
   - Employee service tests
   - Project service tests
   - Assignment service tests
2. Document MCP test patterns:
   - Data setup best practices
   - Verification strategies
   - Schema validation approaches
3. Update test documentation with MCP usage guidelines

## Technical Details
Database Connection:
- Production: Uses node-postgres (pg) pool from config/database.js
- Testing: Uses MCP tools for data manipulation/verification
- Development: MCP tools available for queries and verification

MCP PostgreSQL server provides tools for testing/development:
- query: For executing SELECT queries
- get_table_info: For getting table schema information
- execute: For executing INSERT, UPDATE, DELETE statements

Example MCP Test Patterns:
1. Data Setup:
   ```js
   await use_mcp_tool('postgres', 'execute', {
     query: 'INSERT INTO users ...',
     params: [...]
   });
   ```

2. Data Verification:
   ```js
   const result = await use_mcp_tool('postgres', 'query', {
     query: 'SELECT * FROM users ...',
     params: [...]
   });
   ```

3. Schema Validation:
   ```js
   const tableInfo = await use_mcp_tool('postgres', 'get_table_info', {
     table: 'users'
   });
