import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider, theme as chakraTheme } from '@chakra-ui/react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Create MUI theme with proper configuration
const muiTheme = createTheme({
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 1
      }
    }
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  }
});

// Test wrapper with providers
export const renderWithProviders = (
  component: ReactElement,
  { route = '/', ...renderOptions }: { route?: string } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={muiTheme}>
        <MemoryRouter initialEntries={[route]}>
          <ChakraProvider theme={chakraTheme}>
            {children}
          </ChakraProvider>
        </MemoryRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
};

// Common test utilities
export const createMockEvent = (type: string, data = {}) => {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, data);
  return event;
};

// Mock toast
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

// Mock handlers
export const createMockHandlers = () => ({
  onClick: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onClose: vi.fn(),
});

// Timeline specific utilities
export const createDragEvent = (type: string, coords: { x: number; y: number }) => {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, {
    clientX: coords.x,
    clientY: coords.y,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      setData: vi.fn(),
      getData: vi.fn(),
      dropEffect: 'none',
    },
  });
  return event;
};

export const simulateDrag = (element: Element, { start, end }: { start: { x: number; y: number }, end: { x: number; y: number }}) => {
  const mouseDown = createDragEvent('mousedown', start);
  const mouseMove = createDragEvent('mousemove', end);
  const mouseUp = createDragEvent('mouseup', end);

  element.dispatchEvent(mouseDown);
  document.dispatchEvent(mouseMove);
  document.dispatchEvent(mouseUp);
};

// Test IDs
export const testIds = {
  loadingSpinner: 'loading-spinner',
  errorMessage: 'error-message',
  emptyState: 'empty-state',
  timelineGrid: 'timeline-grid',
  assignmentBlock: 'assignment-block',
  todayMarker: 'today-marker',
  warningIcon: 'warning-icon',
  tooltip: 'tooltip',
} as const;

// Common test data
export const testData = {
  dates: {
    today: new Date('2024-01-15'),
    startOfYear: new Date('2024-01-01'),
    endOfYear: new Date('2024-12-31'),
  },
  users: [
    { id: 1, name: 'Test User 1' },
    { id: 2, name: 'Test User 2' },
  ],
  projects: [
    { id: 1, name: 'Test Project 1' },
    { id: 2, name: 'Test Project 2' },
  ],
};

// Test error messages
export const errorMessages = {
  required: 'This field is required',
  invalid: 'Invalid input',
  networkError: 'Network error occurred',
  unauthorized: 'Unauthorized access',
  invalidDateRange: 'Invalid date range',
} as const;

// Common test queries
export const queries = {
  byTestId: (id: string) => `[data-testid="${id}"]`,
  byRole: (role: string) => `[role="${role}"]`,
  byAriaLabel: (label: string) => `[aria-label="${label}"]`,
} as const;

// Test viewport sizes
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

// Common test timeouts
export const timeouts = {
  animation: 300,
  transition: 150,
  api: 1000,
} as const;

// Mock date utilities
export const mockDateNow = (date: Date) => {
  const originalNow = Date.now;
  Date.now = vi.fn(() => date.getTime());
  return () => {
    Date.now = originalNow;
  };
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';