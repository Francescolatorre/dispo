import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import { ProjectForm } from './ProjectForm';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProjectForm', () => {
  const mockProject = {
    id: 1,
    name: 'Test Project',
    start_date: '2025-01-01T00:00:00.000Z',
    end_date: '2025-12-31T00:00:00.000Z',
    project_manager: 'John Doe',
    documentation_links: ['https://docs.example.com'],
    status: 'active' as const,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty form for new project', () => {
    renderWithProviders(<ProjectForm {...defaultProps} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/projektleiter/i)).toHaveValue('');
    expect(screen.getByLabelText(/status/i)).toHaveTextContent('Aktiv');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders form with project data for editing', () => {
    renderWithProviders(<ProjectForm {...defaultProps} project={mockProject} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue(mockProject.name);
    expect(screen.getByLabelText(/projektleiter/i)).toHaveValue(mockProject.project_manager);
    expect(screen.getByLabelText(/start-datum/i)).toHaveValue('2025-01-01');
    expect(screen.getByLabelText(/end-datum/i)).toHaveValue('2025-12-31');
    expect(screen.getByText('Link 1')).toBeInTheDocument();
  });

  it('handles documentation link addition and removal', () => {
    renderWithProviders(<ProjectForm {...defaultProps} />);
    
    // Add a link
    const linkInput = screen.getByLabelText(/dokumentation link/i);
    fireEvent.change(linkInput, {
      target: { value: 'https://example.com' },
    });
    fireEvent.click(screen.getByTestId('AddIcon'));
    
    expect(screen.getByText('Link 1')).toBeInTheDocument();
    
    // Remove the link
    fireEvent.click(screen.getByTestId('DeleteIcon'));
    expect(screen.queryByText('Link 1')).not.toBeInTheDocument();
  });

  it('prevents adding duplicate links', () => {
    renderWithProviders(<ProjectForm {...defaultProps} />);
    
    const linkInput = screen.getByLabelText(/dokumentation link/i);
    const addButton = screen.getByTestId('AddIcon');
    
    // Add first link
    fireEvent.change(linkInput, {
      target: { value: 'https://example.com' },
    });
    fireEvent.click(addButton);
    
    // Try to add the same link again
    fireEvent.change(linkInput, {
      target: { value: 'https://example.com' },
    });
    fireEvent.click(addButton);
    
    // Should only have one link
    expect(screen.getAllByText('Link 1')).toHaveLength(1);
  });

  it('calls onSave with form data when submitted', async () => {
    renderWithProviders(<ProjectForm {...defaultProps} />);

    // Fill out form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'New Project' },
    });
    fireEvent.change(screen.getByLabelText(/projektleiter/i), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText(/start-datum/i), {
      target: { value: '2025-02-01' },
    });
    fireEvent.change(screen.getByLabelText(/end-datum/i), {
      target: { value: '2025-12-31' },
    });

    // Submit form
    fireEvent.click(screen.getByText(/speichern/i));

    expect(defaultProps.onSave).toHaveBeenCalledWith({
      name: 'New Project',
      project_manager: 'Jane Smith',
      start_date: '2025-02-01',
      end_date: '2025-12-31',
      documentation_links: [],
      status: 'active',
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithProviders(<ProjectForm {...defaultProps} />);

    fireEvent.click(screen.getByText(/abbrechen/i));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    renderWithProviders(<ProjectForm {...defaultProps} />);

    // Submit form without filling required fields
    fireEvent.click(screen.getByText(/speichern/i));

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/name/i)).toBeInvalid();
    expect(screen.getByLabelText(/projektleiter/i)).toBeInvalid();
  });

  it('validates end date is after start date', () => {
    renderWithProviders(<ProjectForm {...defaultProps} />);

    // Set end date before start date
    fireEvent.change(screen.getByLabelText(/start-datum/i), {
      target: { value: '2025-12-31' },
    });
    fireEvent.change(screen.getByLabelText(/end-datum/i), {
      target: { value: '2025-01-01' },
    });

    // Submit form
    fireEvent.click(screen.getByText(/speichern/i));

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    // After submitting with invalid dates, the end date field should show an error
    const endDateField = screen.getByLabelText(/end-datum/i).closest('.MuiFormControl-root');
    expect(endDateField).toHaveClass('Mui-error');
    expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
  });
});
