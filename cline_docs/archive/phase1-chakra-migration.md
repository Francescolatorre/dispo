# Phase 1: Chakra UI Migration Implementation Steps

## 1. Theme Setup
Create `client/src/styles/chakraTheme.ts`:
```typescript
import { extendTheme } from '@chakra-ui/react';

// Map MUI palette to Chakra colors
const colors = {
  primary: {
    main: '#007bff',
    light: '#3395ff',
    dark: '#0056b3',
  },
  secondary: {
    main: '#6c757d',
    light: '#868e96',
    dark: '#495057',
  },
  error: {
    main: '#dc3545',
    light: '#e4606d',
    dark: '#bd2130',
  },
  warning: {
    main: '#ffc107',
    light: '#ffcd39',
    dark: '#d39e00',
  },
  success: {
    main: '#28a745',
    light: '#48c774',
    dark: '#1e7e34',
  },
};

export const theme = extendTheme({
  colors,
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
      },
    },
    Alert: {
      defaultProps: {
        variant: 'subtle',
      },
    },
  },
});
```

## 2. Test Infrastructure Updates

Update `client/src/test/setup-test-providers.tsx`:
```typescript
// Remove MUI imports
// Add Chakra theme import
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '../styles/chakraTheme';

// Update TestProviders to use only ChakraProvider
export const TestProviders: React.FC<ProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
  initialEntries = ['/'],
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
};
```

Update `client/src/test/setup.ts`:
```typescript
// Remove MUI mocks
// Update Chakra component mocks with proper theme support
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => vi.fn(),
    Tooltip: ({ children, label, ...props }) => {
      const tooltipContent = React.createElement('div', {
        key: 'tooltip-content',
        role: 'tooltip',
        'aria-label': typeof label === 'string' ? label : undefined,
        ...props
      }, label);
      
      return React.createElement(React.Fragment, null, [
        React.cloneElement(children, { key: 'tooltip-trigger' }),
        tooltipContent
      ]);
    },
    // Add other component mocks as needed
  };
});
```

## 3. Component Migration Order

1. Start with Typography components:
   - Dashboard.tsx
   - Reports.tsx
   - ProjectTimeline.tsx

2. Move to Box/Layout components:
   - ProjectForm.tsx
   - EmployeeForm.tsx
   - ProjectList.tsx

3. Update Button components:
   - Projects.tsx
   - Employees.tsx

## 4. Testing Strategy

1. Run tests after each component migration
2. Update snapshots as needed
3. Verify visual appearance
4. Check accessibility

## 5. Validation Steps

For each migrated component:
1. Run component tests
2. Check visual appearance
3. Verify accessibility
4. Update documentation

## Next Steps

After completing Phase 1:
1. Review bundle size impact
2. Document any styling differences
3. Update component documentation
4. Plan Phase 2 implementation