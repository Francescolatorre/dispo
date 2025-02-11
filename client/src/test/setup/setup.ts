import '@testing-library/jest-dom';
import { vi, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveAuthToken(): void;
    toBeAuthenticated(): void;
  }
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.history
const historyMock = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
};

Object.defineProperty(window, 'history', {
  value: historyMock,
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.ResizeObserver = ResizeObserverMock;

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock Chakra UI toast
vi.mock('@chakra-ui/react', async () => {
  const actual = (await vi.importActual('@chakra-ui/react')) as any;
  return {
    ...actual,
    useToast: () => vi.fn().mockImplementation((options) => options),
  };
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  
  // Reset fetch mock
  (global.fetch as any).mockReset();
  
  // Reset history mock
  Object.values(historyMock).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockReset();
    }
  });
});

// Clean up after each test
afterEach(() => {
  localStorage.clear();
});

// Add custom matchers
expect.extend({
  toHaveAuthToken(received) {
    const token = localStorage.getItem('token');
    const pass = token !== null;
    
    return {
      message: () =>
        pass
          ? `Expected localStorage not to have token, but found "${token}"`
          : 'Expected localStorage to have token, but found none',
      pass,
    };
  },
  
  toBeAuthenticated(received) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const pass = token !== null && user !== null;
    
    return {
      message: () =>
        pass
          ? `Expected not to be authenticated, but found token and user`
          : 'Expected to be authenticated, but missing token or user',
      pass,
    };
  },
});
