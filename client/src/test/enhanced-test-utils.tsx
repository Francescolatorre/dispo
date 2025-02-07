import React from 'react';
import { render as rtlRender, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../styles/theme';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialEntries?: string[];
}

export function render(
  ui: React.ReactElement,
  {
    route = '/',
    initialEntries = [route],
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Async utilities
export async function waitForStateUpdate(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

export async function waitForAsyncOperation(timeout = 100): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 10)); // Initial state update
    await new Promise(resolve => setTimeout(resolve, timeout)); // Wait for async operation
  });
}

export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 300,
  interval = 20
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

export const asyncAct = async (callback: () => Promise<void>): Promise<void> => {
  await act(async () => {
    await callback();
    await waitForStateUpdate();
  });
};

export const createAsyncHandler = (delay = 100) => {
  return vi.fn().mockImplementation(() =>
    new Promise(resolve => setTimeout(resolve, delay))
  );
};

// Mock service responses
interface MockServiceConfig {
  success?: boolean;
  delay?: number;
  data?: unknown;
  error?: Error;
}

export function createMockService(config: MockServiceConfig = {}) {
  const {
    success = true,
    delay = 0,
    data = {},
    error = new Error('Mock service error')
  } = config;

  return vi.fn().mockImplementation(() => 
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (success) {
          resolve(data);
        } else {
          reject(error);
        }
      }, delay);
    })
  );
}

// Form testing utilities
export const fillFormField = async (
  element: HTMLElement,
  value: string | number
): Promise<void> => {
  await act(async () => {
    element.focus();
    if (element instanceof HTMLSelectElement) {
      element.value = value.toString();
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      const input = element as HTMLInputElement;
      input.value = value.toString();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    element.blur();
  });
};

// Type-safe event utilities
type EventType = 'change' | 'click' | 'submit' | 'focus' | 'blur';

export const createTypedEvent = <T extends EventType>(
  type: T,
  values: Partial<Event> = {}
): Event => {
  const event = new Event(type, { bubbles: true, ...values });
  return event;
};

// Error boundary test utility
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// MUI Component Mocks
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Alert: ({ children, severity, ...props }: any) => {
      return React.createElement('div', {
        role: 'alert',
        'data-severity': severity,
        'aria-label': 'alert',
        ...props
      }, React.createElement('div', {}, children));
    }
  };
});

// Re-export everything from testing-library/react
export * from '@testing-library/react';