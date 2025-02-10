# Active Context

## Current Task
Correcting the architecture approach for database access:
1. Backend services use direct pg pool connection
2. MCP PostgreSQL server reserved for testing and development assistance

## Recent Changes
- Reverted employeeService.js to use direct pg pool connection
- Removed MCP tool usage from production code
- Verified all backend services are using direct database connections:
  * employeeService.js - Using pg pool ✓
  * requirementService.js - Using pg pool ✓
  * assignmentService.js - Using pg pool ✓
  * workloadService.js - Using pg pool ✓

## Next Steps
1. Document MCP PostgreSQL server usage patterns for:
   - Test data preparation
   - Test execution verification
   - Development assistance tasks
2. Update test files to use MCP tools for data verification
3. Create examples of MCP tool usage in tests

## Technical Details
Database Connection:
- Production: Uses node-postgres (pg) pool from config/database.js
- Testing: Uses MCP tools for data manipulation/verification
- Development: MCP tools available for queries and verification

MCP PostgreSQL server provides tools for testing/development:
- query: For executing SELECT queries
- get_table_info: For getting table schema information
- execute: For executing INSERT, UPDATE, DELETE statements
