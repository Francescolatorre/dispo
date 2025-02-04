import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<T = any>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

expect.extend(matchers as any);

// Mock fetch globally
global.fetch = vi.fn();

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
