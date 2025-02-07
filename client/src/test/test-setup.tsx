import React from 'react';
import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import { TestProviders, createTestQueryClient } from './setup-test-providers';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import type { RenderOptions } from '@testing-library/react';
import {
  waitForStateUpdate,
  waitForAsyncOperation,
  waitForCondition,
  asyncAct,
  createAsyncHandler
} from './enhanced-test-utils';

// Re-export async utilities
export {
  waitForStateUpdate,
  waitForAsyncOperation,
  waitForCondition,
  asyncAct,
  createAsyncHandler
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialEntries?: string[];
  queryClient?: ReturnType<typeof createTestQueryClient>;
}

// Enhanced render function with all providers
export function render(
  ui: React.ReactElement,
  {
    route = '/',
    initialEntries = [route],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders
      queryClient={queryClient}
      route={route}
      initialEntries={initialEntries}
    >
      {children}
    </TestProviders>
  );

  return {
    queryClient,
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

// Common test utilities
export const createMockHandler = () => vi.fn();

export const createMockPromise = <T,>(
  result: T,
  delay = 0
): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), delay);
  });
};

// Form testing utilities
export const fillFormFields = async (
  fields: Array<{ label: string | RegExp; value: string | number }>
) => {
  await asyncAct(async () => {
    for (const { label, value } of fields) {
      const input = screen.getByLabelText(label);
      if (input instanceof HTMLSelectElement) {
        fireEvent.change(input, { target: { value } });
      } else {
        fireEvent.change(input, { target: { value } });
      }
      await waitForStateUpdate();
    }
  });
};

// Re-export everything from testing-library/react
export * from '@testing-library/react';
// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Set default test timeout and configure test environment
vi.setConfig({ testTimeout: 30000 });

// Configure shorter timeouts for async operations
export const TEST_TIMEOUTS = {
  short: 100,
  medium: 500,
  long: 2000,
};

// Configure testing-library
import { configure } from '@testing-library/react';
configure({
  asyncUtilTimeout: 2000,
  eventWrapper: async (cb) => {
    try {
      await cb();
      // Add small delay after events to allow state updates
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      throw error;
    }
  },
});
vi.setConfig({ testTimeout: 10000 });