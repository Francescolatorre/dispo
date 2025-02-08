import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { configure } from '@testing-library/dom';
import React from 'react';

// Configure testing-library
configure({
  asyncUtilTimeout: 2000,
  computedStyleSupportsPseudoElements: true,
});

// Initialize JSDOM environment
if (typeof window === 'undefined') {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
}

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

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
vi.setSystemTime(mockDate);

// Mock Chakra UI components with proper theme support
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => vi.fn(),
    Menu: ({ children }: any) => React.createElement('div', { role: 'menu' }, children),
    MenuButton: React.forwardRef(({ children, as: Component = 'div', borderRadius, bg, color, _hover, ...props }: any, ref) => {
      const dataProps = {
        'data-testid': 'assignment-block',
        role: 'button',
        style: {
          ...props.style,
          borderRadius: borderRadius === 'md' ? '4px' : borderRadius,
          backgroundColor: bg === 'blue.500' ? '#3182ce' : bg,
          color,
        },
        ...props,
        ref,
      };
      return React.createElement(Component, dataProps, children);
    }),
    MenuList: ({ children }: any) => React.createElement('div', { role: 'menu' }, children),
    MenuItem: ({ children, onClick }: any) => React.createElement('button', { role: 'menuitem', onClick }, children),
    Box: React.forwardRef(({ children, as: Component = 'div', borderRadius, bg, color, _hover, position, left, width, ...props }: any, ref) => {
      const dataProps = {
        ...props,
        ref,
        style: {
          ...props.style,
          position,
          left,
          width,
          borderRadius: borderRadius === 'md' ? '4px' : borderRadius,
          backgroundColor: bg === 'blue.500' ? '#3182ce' : bg,
          color,
        },
      };
      return React.createElement(Component || 'div', dataProps, children);
    }),
    Text: ({ children, isTruncated, fontSize, px, ...props }: any) => {
      const style = {
        ...props.style,
        fontSize: fontSize === 'sm' ? '14px' : fontSize,
        paddingLeft: px ? `${px * 8}px` : undefined,
        paddingRight: px ? `${px * 8}px` : undefined,
        whiteSpace: isTruncated ? 'nowrap' : undefined,
        overflow: isTruncated ? 'hidden' : undefined,
        textOverflow: isTruncated ? 'ellipsis' : undefined,
      };
      return React.createElement('p', { ...props, style }, children);
    },
  };
});

// Mock local storage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key]),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock portal container
beforeEach(() => {
  const portalRoot = document.createElement('div');
  portalRoot.setAttribute('id', 'chakra-portal');
  document.body.appendChild(portalRoot);
});

afterEach(() => {
  const portalRoot = document.getElementById('chakra-portal');
  if (portalRoot) {
    document.body.removeChild(portalRoot);
  }
  vi.clearAllMocks();
});
