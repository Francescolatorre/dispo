import React from 'react';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import '../../../test/setup';
import { createTestEnvironment } from '../../../test/setup-test-providers';

// Mock assignments for testing
export const mockAssignments = [
  {
    id: 1,
    project_id: 1,
    project_name: 'Test Project',
    employee_id: 1,
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    role: 'Developer',
    allocation: 100,
  },
];

const { renderWithProviders: render } = createTestEnvironment();

export { screen, fireEvent, act, waitFor, render };