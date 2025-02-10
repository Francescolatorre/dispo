/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';

declare module 'vitest' {
  interface Assertion extends jest.Matchers<void, any>, jest.Matchers<void, any> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void, any>, jest.Matchers<void, any> {}
}

// Augment window with missing properties
interface Window {
  localStorage: Storage;
  matchMedia: (query: string) => MediaQueryList;
}

export {};