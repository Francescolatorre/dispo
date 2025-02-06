import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Mock dayjs
vi.mock('dayjs', () => {
  return {
    default: (date: string | Date) => ({
      format: (fmt: string) => {
        if (fmt === 'MMM D, YYYY') {
          return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        }
        return new Date(date).toLocaleDateString();
      }
    })
  };
});

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => false
  };
});

vi.mock('@mui/lab', async () => {
  const actual = await vi.importActual('@mui/lab');
  return {
    ...actual,
    Timeline: vi.fn().mockImplementation(({ children }) => children),
    TimelineItem: vi.fn().mockImplementation(({ children }) => children),
    TimelineSeparator: vi.fn().mockImplementation(({ children }) => children),
    TimelineConnector: vi.fn().mockImplementation(() => null),
    TimelineContent: vi.fn().mockImplementation(({ children }) => children),
    TimelineDot: vi.fn().mockImplementation(({ children }) => children)
  };
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Update test utils to include LocalizationProvider
vi.mock('../test/utils', async () => {
  const actual = await vi.importActual<typeof import('../test/utils')>('../test/utils');
  const React = await vi.importActual('react');
  const { LocalizationProvider } = await vi.importActual('@mui/x-date-pickers');
  const { AdapterDayjs } = await vi.importActual('@mui/x-date-pickers/AdapterDayjs');

  return {
    ...actual,
    renderWithProviders: (ui: React.ReactElement) => {
      const { renderWithProviders } = actual;
      const React = require('react');
      const { LocalizationProvider } = require('@mui/x-date-pickers');
      const { AdapterDayjs } = require('@mui/x-date-pickers/AdapterDayjs');
      return renderWithProviders(
        React.createElement(LocalizationProvider, { dateAdapter: AdapterDayjs }, ui)
      );
    }
  };
});

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
