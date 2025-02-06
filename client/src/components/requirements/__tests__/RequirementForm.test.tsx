import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RequirementForm from '../RequirementForm';
import requirementService from '../../../services/requirementService';
import { Requirement } from '../../../types/requirement';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

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
const renderFormWithProviders = (ui: React.ReactElement) => {
  return renderWithProviders(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {ui}
    </LocalizationProvider>
  );
};


describe('RequirementForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (requirementService.validateRequirement as any).mockResolvedValue({
      valid: true,
      errors: []
    });
  });

  it('renders empty form in create mode', () => {
    renderFormWithProviders(
      <RequirementForm
        projectId={1}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('textbox', { name: /role/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /seniority level/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /priority/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /start date/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /end date/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /required qualifications/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument();
  });

  it('renders form with requirement data in edit mode', () => {
    renderFormWithProviders(
      <RequirementForm
        projectId={1}
        requirement={mockRequirement}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Senior')).toBeInTheDocument();
    expect(screen.getByDisplayValue('high')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderFormWithProviders(
      <RequirementForm
        projectId={1}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Try to submit without required fields
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Role is required')).toBeInTheDocument();
      expect(screen.getByText('Start date is required')).toBeInTheDocument();
      expect(screen.getByText('End date is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates date range', async () => {
    renderFormWithProviders(
      <RequirementForm
        projectId={1}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in role
    fireEvent.change(screen.getByRole('textbox', { name: /role/i }), {
      target: { value: 'Test Role' }
    });

    // Set invalid date range (end before start)
    const startDateInput = screen.getByRole('textbox', { name: /start date/i });
    const endDateInput = screen.getByRole('textbox', { name: /end date/i });

    fireEvent.change(startDateInput, { target: { value: '2024-12-31' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles form submission successfully', async () => {
    renderFormWithProviders(
      <RequirementForm
        projectId={1}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in form
    fireEvent.change(screen.getByRole('textbox', { name: /role/i }), {
      target: { value: 'Test Role' }
    });
const senioritySelect = screen.getByRole('combobox', { name: /seniority level/i });
fireEvent.mouseDown(senioritySelect);
fireEvent.click(screen.getByRole('option', { name: /senior/i }));

const prioritySelect = screen.getByRole('combobox', { name: /priority/i });
fireEvent.mouseDown(prioritySelect);
fireEvent.click(screen.getByRole('option', { name: /high/i }));

const startDateInput = screen.getByRole('textbox', { name: /start date/i });
const endDateInput = screen.getByRole('textbox', { name: /end date/i });

fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });

// Add qualifications
const qualificationsInput = screen.getByRole('combobox', { name: /required qualifications/i });
fireEvent.change(qualificationsInput, { target: { value: 'React' } });
fireEvent.keyDown(qualificationsInput, { key: 'Enter' });
fireEvent.change(qualificationsInput, { target: { value: 'TypeScript' } });
fireEvent.keyDown(qualificationsInput, { key: 'Enter' });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 1,
          role: 'Test Role',
          seniority_level: 'Senior',
          priority: 'high',
          required_qualifications: ['React', 'TypeScript'],
          start_date: '2024-03-01',
          end_date: '2024-12-31'
        })
      );
    });
  });

  it('handles backend validation errors', async () => {
    (requirementService.validateRequirement as any).mockResolvedValue({
      valid: false,
      errors: ['Invalid date range for project timeline']
    });

    renderWithProviders(
      <RequirementForm
        projectId={1}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in minimum required fields
    fireEvent.change(screen.getByRole('textbox', { name: /role/i }), {
      target: { value: 'Test Role' }
    });

    const startDateInput = screen.getByRole('textbox', { name: /start date/i });
    const endDateInput = screen.getByRole('textbox', { name: /end date/i });

    fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid date range for project timeline')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles cancel action', () => {
    renderFormWithProviders(
      <RequirementForm
        projectId={1}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});