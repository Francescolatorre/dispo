# CI/CD Workflow Configuration

This directory contains GitHub Actions workflow files that need to be manually added to the repository.

## Why Manual Setup?

These workflow files couldn't be pushed automatically due to GitHub App permissions restrictions. The workflows require the `workflows` permission to be created or modified.

## Installation Instructions

To enable CI/CD testing in your repository:

1. Create the `.github/workflows/` directory in your repository root:
   ```bash
   mkdir -p .github/workflows
   ```

2. Copy the workflow files:
   ```bash
   cp docs/ci-workflows/backend-tests.yml .github/workflows/
   cp docs/ci-workflows/frontend-tests.yml .github/workflows/
   ```

3. Commit and push:
   ```bash
   git add .github/workflows/
   git commit -m "ci: add automated test workflows"
   git push
   ```

## Workflow Descriptions

### backend-tests.yml
- **Triggers**: On push and pull requests to all branches
- **Services**: PostgreSQL 14 database container
- **Steps**:
  - Setup Node.js 18
  - Install dependencies
  - Run ESLint
  - Run tests with coverage
  - Upload coverage to Codecov
  - Check 50% coverage threshold

### frontend-tests.yml
- **Triggers**: On push and pull requests to all branches
- **Steps**:
  - Setup Node.js 18
  - Install client dependencies
  - Run ESLint
  - Run Vitest tests with coverage
  - Upload coverage to Codecov
  - Check 50% coverage threshold

## Environment Variables

The backend tests require these environment variables (configured in the workflow):
- `DATABASE_URL`: PostgreSQL connection string
- `DB_HOST`: localhost
- `DB_PORT`: 5432
- `DB_NAME`: dispomvp_test
- `DB_USER`: postgres
- `DB_PASSWORD`: postgres

## Testing Locally

You can test the workflows locally before pushing:

```bash
# Backend tests
npm run test:coverage

# Frontend tests
cd client && npm test -- --coverage --run
```

## Troubleshooting

If workflows fail:
1. Check that all dependencies are listed in package.json
2. Verify database migrations are up to date
3. Ensure test scripts match those in package.json
4. Review the workflow logs on GitHub Actions tab
