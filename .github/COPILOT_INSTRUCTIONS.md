# Copilot Instructions for DispoMVP

This guide provides comprehensive instructions for AI-assisted development in the DispoMVP project. Follow these patterns and practices to maintain consistency and quality across the codebase.

## Project Architecture

### Overview
- Full-stack JavaScript/TypeScript application
- Frontend: React + TypeScript + Vite + Chakra UI
- Backend: Node.js + Express + PostgreSQL
- Testing: Jest (backend), Vitest (frontend), Playwright (E2E)

### Directory Structure
```
/client/                 # Frontend React application
  /src/
    /components/         # Reusable UI components
    /contexts/          # React context providers
    /hooks/            # Custom React hooks
    /pages/            # Route components
    /services/         # API client services
    /types/            # TypeScript type definitions
/src/                   # Backend Node.js application
  /config/             # Configuration files
  /db/                 # Database migrations and setup
  /middleware/         # Express middleware
  /routes/             # API route handlers
  /services/           # Business logic services
  /utils/              # Utility functions
```

## Code Organization & Patterns

### Frontend Patterns

#### Component Structure
```typescript
// Preferred component structure
import { FC } from 'react';
import { Box } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

interface ComponentProps {
  // Props interface at top
  prop1: string;
  prop2?: number;
}

export const Component: FC<ComponentProps> = ({ prop1, prop2 = 0 }) => {
  // Hooks at the top
  const { user } = useAuth();
  
  // Event handlers next
  const handleClick = () => {
    // Implementation
  };
  
  // JSX last
  return (
    <Box>
      {/* Implementation */}
    </Box>
  );
};
```

#### Context Usage
- Use contexts for global state management
- Create custom hooks for context access
- Example:
```typescript
// Bad - direct context usage
const context = useContext(AuthContext);

// Good - custom hook usage
const { user, login, logout } = useAuth();
```

### Backend Patterns

#### Service Layer Pattern
```javascript
// services/employeeService.js
class EmployeeService {
  async findById(id) {
    try {
      // Implementation
    } catch (error) {
      throw new Error(`Failed to find employee: ${error.message}`);
    }
  }
}
```

#### Route Handler Pattern
```javascript
// routes/employees.js
router.get('/:id', validateEmployee, async (req, res, next) => {
  try {
    const result = await employeeService.findById(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
```

## Error Handling

### Frontend Error Handling
```typescript
// Preferred error handling pattern
try {
  await api.post('/endpoint');
} catch (error) {
  if (error instanceof ApiError) {
    // Handle specific API errors
    toast.error(error.message);
  } else {
    // Handle unexpected errors
    toast.error('An unexpected error occurred');
    console.error(error);
  }
}
```

### Backend Error Handling
```javascript
// Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

// Error middleware
app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Internal server error';
  
  res.status(status).json({ error: message });
});
```

## Testing Requirements

### Frontend Testing
- Unit tests for components using Vitest
- Integration tests for pages
- E2E tests using Playwright
- Test file naming: `*.test.tsx` or `*.spec.tsx`

```typescript
// Component test example
describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop1="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

### Backend Testing
- Unit tests for services
- Integration tests for routes
- Test database setup required
- Test file naming: `*.test.js`

```javascript
// Service test example
describe('EmployeeService', () => {
  beforeEach(async () => {
    await setupTestDb();
  });
  
  it('finds employee by id', async () => {
    const result = await employeeService.findById(1);
    expect(result).toBeDefined();
  });
});
```

## Security Considerations

### Authentication
- JWT-based authentication
- Token refresh mechanism
- Protected routes using AuthContext

### API Security
- Input validation using middleware
- SQL injection prevention using parameterized queries
- XSS prevention using Chakra UI's built-in protections

### Data Validation
```typescript
// Frontend validation
const validateEmployee = (data: EmployeeInput): ValidationResult => {
  const errors: ValidationErrors = {};
  
  if (!data.name) {
    errors.name = 'Name is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Backend validation middleware
const validateEmployee = (req, res, next) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      error: 'Name and email are required'
    });
  }
  
  next();
};
```

## Performance Guidelines

### Frontend Performance
- Lazy loading for routes
- Memoization for expensive computations
- Virtual scrolling for large lists
- Image optimization

```typescript
// Lazy loading example
const ProjectPage = lazy(() => import('./pages/ProjectPage'));

// Memoization example
const expensiveComputation = useMemo(() => {
  return data.reduce((acc, item) => acc + item.value, 0);
}, [data]);
```

### Backend Performance
- Query optimization
- Proper indexing
- Caching where appropriate
- Connection pooling

```javascript
// Query optimization example
const findEmployees = async (filters) => {
  const query = db('employees')
    .select('*')
    .where(filters)
    .orderBy('name')
    .limit(100);
    
  return query;
};
```

## Documentation Standards

### Component Documentation
```typescript
/**
 * Displays employee information in a card format
 * 
 * @param {Employee} employee - Employee data to display
 * @param {boolean} [showActions=false] - Whether to show action buttons
 * @returns {JSX.Element} Employee card component
 * 
 * @example
 * <EmployeeCard 
 *   employee={employeeData}
 *   showActions={true}
 * />
 */
export const EmployeeCard: FC<EmployeeCardProps> = ...
```

### API Documentation
```javascript
/**
 * Creates a new employee in the system
 * 
 * @param {Object} employee - Employee data
 * @param {string} employee.name - Employee's full name
 * @param {string} employee.email - Employee's email address
 * @param {string} [employee.department] - Employee's department
 * 
 * @returns {Promise<Employee>} Created employee record
 * @throws {ValidationError} If employee data is invalid
 * @throws {DatabaseError} If database operation fails
 */
async createEmployee(employee) {
  // Implementation
}
```

## Legacy Code Patterns

### Current Patterns to Maintain
- Service-based architecture
- Context-based state management
- Middleware validation approach

### Suggested Modern Improvements
- Migration to TypeScript for backend
- Implementation of React Query for data fetching
- Adoption of OpenAPI/Swagger for API documentation

## Critical Business Logic

### Employee Assignment
- Validate employee availability
- Check project requirements
- Update workload calculations

### Workload Calculation
- Consider employee capacity
- Account for part-time schedules
- Handle overlapping assignments

## Integration Points

### External Services
- Authentication service
- Database service
- API integrations

### Internal Communication
- Frontend-Backend API contracts
- Event handling patterns
- State management flow

## Troubleshooting Guidelines

### Common Issues
1. Authentication token expiration
2. Database connection issues
3. State management inconsistencies

### Debugging Approaches
1. Check browser console for frontend errors
2. Verify API responses in Network tab
3. Review server logs for backend issues

## Project-Specific Constraints

### Business Rules
- Employee assignments must not exceed capacity
- Projects require minimum skill requirements
- Time tracking in 15-minute intervals

### Technical Constraints
- Node.js LTS version
- React 18+
- TypeScript 5+
- PostgreSQL 14+

## Areas Requiring Extra Attention

### Performance-Critical Sections
- Timeline rendering
- Workload calculations
- Large dataset operations

### Security-Sensitive Areas
- Authentication flows
- Permission checks
- Data validation

### Complex Algorithms
- Resource allocation
- Schedule optimization
- Conflict resolution

Remember to maintain consistent patterns while suggesting improvements that align with the project's evolution. When in doubt, prefer type safety and explicit error handling over convenience.