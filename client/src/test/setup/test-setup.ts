import { expect, afterEach, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers as any);

// Mock storage implementation
class StorageMock implements Storage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    const value = this.store.get(key);
    return value !== undefined ? value : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  get length(): number {
    return this.store.size;
  }
}

// Create storage instance
const storageMock = new StorageMock();

// Store original console.error
const originalError = console.error;

// Setup test environment
beforeAll(() => {
  // Delete existing localStorage if it exists
  if ('localStorage' in window) {
    delete (window as any).localStorage;
  }

  // Define localStorage
  Object.defineProperty(window, 'localStorage', {
    value: storageMock,
    writable: false,
    configurable: true,
    enumerable: true,
  });

  // Mock fetch
  global.fetch = vi.fn();

  // Mock IntersectionObserver
  class IntersectionObserverMock {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
  });

  // Mock ResizeObserver
  class ResizeObserverMock {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Suppress console errors
  console.error = (...args: any[]) => {
    if (
      /Warning: ReactDOM.render is no longer supported in React 18/.test(args[0]) ||
      /Warning: useLayoutEffect does nothing on the server/.test(args[0]) ||
      /Warning: The current testing environment is not configured to support act/.test(args[0]) ||
      /React Query error/.test(args[0])
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// Clear storage before each test
beforeEach(() => {
  storageMock.clear();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  storageMock.clear();
});

// Restore console.error after all tests
afterAll(() => {
  console.error = originalError;
});