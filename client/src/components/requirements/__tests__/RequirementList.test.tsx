import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RequirementList from '../RequirementList';
import requirementService from '../../../services/requirementService';
import { Requirement } from '../../../types/requirement';

// Mock the requirement service
vi.mock('../../../services/requirementService');

const mockRequirements: Requirement[] = [
  {
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
  },
  {
    id: 2,
    project_id: 1,
    role: 'Backend Developer',
    seniority_level: 'Mid',
    required_qualifications: ['Node.js', 'PostgreSQL'],
    start_date: '2024-03-01',
    end_date: '2024-12-31',
    status: 'filled',
    priority: 'medium',
    current_assignment_id: 1,
    current_employee_name: 'John Doe',
    created_at: '2024-02-06T12:00:00Z',
    updated_at: '2024-02-06T12:00:00Z'
  }
];

const mockStats = {
  total: 2,
  by_status: {
    open: 1,
    partially_filled: 0,
    filled: 1,
    needs_replacement: 0
  },
  by_priority: {
    low: 0,
    medium: 1,
    high: 1,
    critical: 0
  },
  coverage_percentage: 50,
  upcoming_gaps: 1
};

describe('RequirementList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnAssign = vi.fn();
  const mockOnViewTimeline = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (requirementService.getFilteredRequirements as any).mockResolvedValue({
      requirements: mockRequirements,
      total: mockRequirements.length
    });
    (requirementService.getRequirementStats as any).mockResolvedValue(mockStats);
  });

  it('renders requirements and stats', async () => {
    renderWithProviders(
      <RequirementList
        projectId={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
        onViewTimeline={mockOnViewTimeline}
      />
    );

    // Wait for requirements to load
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Developer')).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText('Total Requirements')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('handles requirement actions', async () => {
    renderWithProviders(
      <RequirementList
        projectId={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
        onViewTimeline={mockOnViewTimeline}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledWith(mockRequirements[0]);

    // Find and click assign button
    const assignButtons = screen.getAllByRole('button', { name: /assign/i });
    fireEvent.click(assignButtons[0]);
    expect(mockOnAssign).toHaveBeenCalledWith(mockRequirements[0]);

    // Find and click timeline button
    const timelineButtons = screen.getAllByRole('button', { name: /timeline/i });
    fireEvent.click(timelineButtons[0]);
    expect(mockOnViewTimeline).toHaveBeenCalledWith(mockRequirements[0]);

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledWith(mockRequirements[0]);
  });

  it('handles filtering', async () => {
    renderWithProviders(
      <RequirementList
        projectId={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
        onViewTimeline={mockOnViewTimeline}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    // Test status filter
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    fireEvent.mouseDown(statusSelect);
    const openOption = screen.getByRole('option', { name: /open/i });
    fireEvent.click(openOption);

    await waitFor(() => {
      expect(requirementService.getFilteredRequirements).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: ['open'] }),
        expect.any(Number),
        expect.any(Number)
      );
    });

    // Test priority filter
    const prioritySelect = screen.getByRole('combobox', { name: /priority/i });
    fireEvent.mouseDown(prioritySelect);
    const highOption = screen.getByRole('option', { name: /high/i });
    fireEvent.click(highOption);

    await waitFor(() => {
      expect(requirementService.getFilteredRequirements).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ priority: ['high'] }),
        expect.any(Number),
        expect.any(Number)
      );
    });

    // Test search
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    fireEvent.change(searchInput, { target: { value: 'Frontend' } });

    await waitFor(() => {
      expect(requirementService.getFilteredRequirements).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ search: 'Frontend' }),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  it('handles error state', async () => {
    const error = new Error('Failed to load requirements');
    (requirementService.getFilteredRequirements as any).mockRejectedValue(error);

    renderWithProviders(
      <RequirementList
        projectId={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
        onViewTimeline={mockOnViewTimeline}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load requirements')).toBeInTheDocument();
    });
  });
});