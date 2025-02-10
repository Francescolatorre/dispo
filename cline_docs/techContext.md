# Technical Context

## Development Environment
- Operating System: Windows 11
- Default Terminal: PowerShell
- IDE: Visual Studio Code
- Working Directory: c:/DEVELOPMENT/projects/DispoMVP

## Frontend Technologies
- React with TypeScript
- Material-UI for components
- Vite for build tooling
- Vitest for testing
- React Testing Library

## Backend Technologies
- Node.js
- Express
- PostgreSQL
- Vitest for testing (migrated from Jest for consistency)

## Testing Setup
- Frontend: Vitest + React Testing Library
- Backend: Vitest
- E2E: Playwright

## Development Workflow
- Local development using PowerShell as default terminal
- npm for package management
- Git for version control
  * All new files must be immediately staged using 'git add [filename]' after creation
  * Git Configuration:
    - core.autocrlf=true for Windows environments
    - .gitignore must include system-generated files (nul)
    - Use explicit file paths with git add to avoid system file issues
    - Verify successful staging after git add commands
  * Best Practices:
    - Stage files individually to catch potential issues early
    - Check git status after staging to confirm success
    - Handle line endings consistently across the team

## Important Paths
- Frontend: /client
- Backend: /src
- Database: /src/db
- Documentation: /cline_docs
- Meta Models: /meta/schemas

## Environment Variables
- See .env.example for required configuration
