# Testing Strategy

## Frontend Testing

### Unit and Integration Tests
- **Framework**: Vitest
- **Location**: `client/src/**/__tests__/*.test.tsx`
- **Key Features**:
  - Fast execution
  - Watch mode
  - Compatible with React Testing Library
  - Native TypeScript support
  - ESM support out of the box
  - Chai-like assertions
  - Jest-compatible API

### End-to-End Tests
- **Framework**: Playwright
- **Location**: `client/tests/*.spec.ts`
- **Key Features**:
  - Cross-browser testing
  - Real browser environment
  - Network interception
  - Authentication handling
  - Visual testing capabilities

## Test Element Selection Strategy

### Data Test IDs
- Use `data-testid` attribute for test element selection
- Format: `{component-name}-{element-type}`
- Examples:
  ```tsx
  // Container elements
  data-testid="login-container"
  data-testid="dashboard-container"

  // Form elements
  data-testid="login-form"
  data-testid="email-input"
  data-testid="password-input"
  data-testid="submit-button"

  // Section elements
  data-testid="overview-section"
  data-testid="getting-started-section"

  // List elements
  data-testid="overview-list"
  data-testid="getting-started-list"

  // Error messages
  data-testid="login-error"
  data-testid="email-error"
  ```

### Selection Priority
1. `data-testid` attributes (preferred)
2. Form labels (for form controls)
3. Button/link text (only if necessary)
4. ARIA roles (for accessibility testing)

### Benefits
- Resilient to UI changes
- Clear test intentions
- Consistent across codebase
- Easy to maintain
- Improves test stability

## Migration Plan

### Phase 1: Frontend Unit/Integration Tests
1. Move all Jest tests to Vitest
2. Update test file naming:
   - Unit/Integration tests: `*.test.tsx`
   - E2E tests: `*.spec.ts`
3. Update imports:
   ```typescript
   // Before
   import { jest } from '@jest/globals';
   
   // After
   import { vi } from 'vitest';
   ```
4. Replace Jest-specific types:
   ```typescript
   // Before
   jest.Mock
   
   // After
   import { Mock } from 'vitest';
   ```
5. Add data-testid attributes to components
6. Update tests to use data-testid selectors

### Phase 2: Backend Tests
For now, keep backend tests in Jest since:
1. Backend is Node.js/CommonJS
2. Jest has better support for Node.js environment
3. No immediate benefit from migration

## Test File Organization

```
client/
├── src/
│   └── components/
│       └── __tests__/          # Unit/Integration tests
├── tests/
│   ├── setup/                  # E2E test setup
│   └── *.spec.ts              # E2E test files
```

## Running Tests

```bash
# Frontend unit/integration tests
npm run test          # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Frontend E2E tests
npm run test:e2e     # Run E2E tests
```

## Best Practices

1. **Test Organization**
   - Keep unit tests close to components (`__tests__` directories)
   - Keep E2E tests separate in `tests` directory
   - Use consistent file naming

2. **Mocking**
   - Use Vitest's mocking for unit/integration tests
   - Use Playwright's network interception for E2E tests

3. **Test Types**
   - Unit tests for individual components
   - Integration tests for component interactions
   - E2E tests for critical user flows

4. **File Naming**
   - `*.test.tsx` - Unit/Integration tests
   - `*.spec.ts` - E2E tests

5. **Framework Usage**
   - Use Vitest for all frontend unit/integration tests
   - Use Playwright for all E2E tests
   - Keep Jest for backend tests until further evaluation

6. **Element Selection**
   - Always use data-testid for element selection
   - Follow consistent data-testid naming convention
   - Add data-testid to all testable elements
   - Update existing tests to use data-testid

## Benefits

1. **Consistency**: Single testing framework for frontend
2. **Modern Features**: Better ESM and TypeScript support
3. **Performance**: Faster test execution with Vitest
4. **Maintainability**: Clear separation between test types
5. **Developer Experience**: Consistent API across tests
6. **Test Stability**: Resilient element selection with data-testid