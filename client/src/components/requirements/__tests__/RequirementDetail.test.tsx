import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from '../../../test/utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RequirementDetail from '../RequirementDetail';
import requirementService from '../../../services/requirementService';
import { Requirement, EmployeeMatch } from '../../../types/requirement';

// Mock the requirement service
vi.mock('../../../services/requirementService');

const mockRequirement: Requirement = {
  id: 1,
  project_id: 1,
  role: 'Frontend Developer',
  seniority_level: 'Senior',
  required_qualifications: ['React', 'TypeScript'],
  start_date: '2024-03-01',
  end_date: '2024-12-31',
  status: 'open',
  priority: 'high',
  created_at: '2024-02-06T12:00:00Z',
  updated_at: '2024-02-06T12:00:00Z'
};

const mockCoverage = {
  req_start: '2024-03-01',
  req_end: '2024-12-31',
  periods: [
    {
      start_date: '2024-03-01',
      end_date: '2024-05-31',
      type: 'covered'
    },
    {
      start_date: '2024-06-01',
      end_date: '2024-12-31',
      type: 'gap'
    }
  ]
};

const mockMatchingEmployees: EmployeeMatch[] = [
  {
    id: 1,
    name: 'John Doe',
    seniority_level: 'Senior',
    qualifications: ['React', 'TypeScript'],
    current_assignments: 1,
    email: 'john@example.com',
    status: 'active'
  },
  {
    id: 2,
    name: 'Jane Smith',
    seniority_level: 'Senior',
    qualifications: ['React', 'JavaScript'],
    current_assignments: 0,
    email: 'jane@example.com',
    status: 'active'
  }
];

describe('RequirementDetail', () => {
  const mockOnAssign = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (requirementService.getRequirementCoverage as any).mockResolvedValue(mockCoverage);
    (requirementService.findMatchingEmployees as any).mockResolvedValue(mockMatchingEmployees);
  });

  it('renders requirement details', async () => {
    await act(async () => {
      renderWithProviders(
        <RequirementDetail
          requirement={mockRequirement}
          onAssign={mockOnAssign}
          onEdit={mockOnEdit}
        />
      );
    });

    // Check basic requirement info
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Frontend Developer');
    expect(screen.getByRole('heading', { name: 'Seniority Level' })).toBeInTheDocument();
    expect(screen.getByText(mockRequirement.seniority_level, { selector: '.MuiTypography-body1' })).toBeInTheDocument();
    expect(screen.getByText(mockRequirement.priority, { selector: '.MuiChip-label' })).toBeInTheDocument();

    // Check qualifications
    mockRequirement.required_qualifications.forEach(qual => {
      expect(screen.getByText(qual, { selector: '.MuiChip-label' })).toBeInTheDocument();
    });

    // Check dates
    const periodElement = screen.getByRole('heading', { name: 'Period' }).parentElement;
    expect(periodElement).toHaveTextContent(/Mar 1, 2024/);
    expect(periodElement).toHaveTextContent(/Dec 31, 2024/);
  });

  it('displays coverage timeline', async () => {
    await act(async () => {
      renderWithProviders(
        <RequirementDetail
          requirement={mockRequirement}
          onAssign={mockOnAssign}
          onEdit={mockOnEdit}
        />
      );
    });

    // Check coverage periods
    expect(screen.getByText('Covered Period')).toBeInTheDocument();
    expect(screen.getByText('Coverage Gap')).toBeInTheDocument();

    // Check period dates
    expect(screen.getByText(/May 31, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Jun 1, 2024/)).toBeInTheDocument();
  });

  it('displays matching employees', async () => {
    await act(async () => {
      renderWithProviders(
        <RequirementDetail
          requirement={mockRequirement}
          onAssign={mockOnAssign}
          onEdit={mockOnEdit}
        />
      );
    });

    // Check employee details
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Check assignment counts
    expect(screen.getByText('Current Assignments: 1')).toBeInTheDocument();
    expect(screen.getByText('Current Assignments: 0')).toBeInTheDocument();
  });

  it('handles edit action', async () => {
    await act(async () => {
      renderWithProviders(
        <RequirementDetail
          requirement={mockRequirement}
          onAssign={mockOnAssign}
          onEdit={mockOnEdit}
        />
      );
    });

    fireEvent.click(screen.getByText('Edit Requirement'));
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('handles assign action', async () => {
    await act(async () => {
      renderWithProviders(
        <RequirementDetail
          requirement={mockRequirement}
          onAssign={mockOnAssign}
          onEdit={mockOnEdit}
        />
      );
    });

    // Click first assign button
    const assignButton = screen.getAllByText('Assign')[0];
    await act(async () => {
      fireEvent.click(assignButton);
    });
    expect(mockOnAssign).toHaveBeenCalledWith(mockMatchingEmployees[0]);
  });
it('handles loading state', () => {
  // Mock service calls to never resolve during this test
  (requirementService.getRequirementCoverage as any).mockImplementation(
    () => new Promise(() => {})
  );
  (requirementService.findMatchingEmployees as any).mockImplementation(
    () => new Promise(() => {})
  );

  renderWithProviders(
    <RequirementDetail
      requirement={mockRequirement}
      onAssign={mockOnAssign}
      onEdit={mockOnEdit}
    />
  );

  // Loading state should be visible immediately
  expect(screen.getByText('Loading requirement details...')).toBeInTheDocument();
});

it('handles error state', async () => {
  const error = new Error('Failed to load requirement details');
  (requirementService.getRequirementCoverage as any).mockRejectedValue(error);

  await act(async () => {
    renderWithProviders(
      <RequirementDetail
        requirement={mockRequirement}
        onAssign={mockOnAssign}
        onEdit={mockOnEdit}
      />
    );
  });

  expect(screen.getByText('Failed to load requirement details')).toBeInTheDocument();
});
  it('shows no matching employees message', async () => {
    (requirementService.findMatchingEmployees as any).mockResolvedValue([]);

    await act(async () => {
      renderWithProviders(
        <RequirementDetail
          requirement={mockRequirement}
          onAssign={mockOnAssign}
          onEdit={mockOnEdit}
        />
      );
    });

    expect(screen.getByText('No matching employees found')).toBeInTheDocument();
  });
});