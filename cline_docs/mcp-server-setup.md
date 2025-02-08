# MCP Server Setup Guide

## Current Issues
1. MCP server paths are pointing to incorrect locations
2. Database credentials mismatch between app and MCP config
3. MCP servers not properly configured for our project context

## Required Changes

### 1. PostgreSQL MCP Server
Current configuration:
```json
{
  "command": "node",
  "args": ["mcp/postgres-server/build/index.js"],
  "env": {
    "POSTGRES_USER": "${POSTGRES_USER}",
    "POSTGRES_HOST": "localhost",
    "POSTGRES_DB": "${POSTGRES_DB}",
    "POSTGRES_PASSWORD": "${POSTGRES_PASSWORD}",
    "POSTGRES_PORT": "5432"
  }
}
```

Required changes:
1. Update server path to point to our project's MCP server location
2. Ensure database credentials match our application's .env file
3. Set up proper connection handling and error reporting

### 2. GitHub MCP Server
Current configuration:
```json
{
  "command": "node",
  "args": ["mcp/github-server/build/index.js"],
  "env": {
    "GITHUB_TOKEN": "${GITHUB_TOKEN}"
  }
}
```

Required changes:
1. Update server path to point to our project's MCP server location
2. Configure GitHub token for our project's repository
3. Set up proper error handling and logging

## Implementation Steps

1. Set up MCP Server Directory
   - Create `mcp/` directory in project root
   - Initialize PostgreSQL and GitHub server packages
   - Configure build process for TypeScript compilation

2. Configure PostgreSQL Server
   - Set up connection pooling
   - Add query execution tools
   - Implement proper error handling
   - Add connection status monitoring

3. Configure GitHub Server
   - Set up authentication
   - Add repository access tools
   - Implement rate limiting
   - Add error handling

4. Update MCP Settings
   - Point to local server implementations
   - Configure environment variables
   - Set up proper logging

## Next Steps

1. Switch to code mode to implement MCP server setup
2. Create local MCP server implementations
3. Update configuration to use local servers
4. Test database connectivity and GitHub integration