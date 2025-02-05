import { render, screen, fireEvent } from '@testing-library/react';
import { EmployeeForm } from './EmployeeForm';
import { vi, describe, it, expect } from 'vitest';

describe('EmployeeForm', () => {
  const mockEmployee = {
    id: 1,
    name: 'John Doe',
    seniority_level: 'Mid',
    level_code: 'MID',
    qualifications: ['TypeScript', 'React'],
    work_time_factor: 1.0,
    contract_end_date: '2025-12-31',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  it('renders empty form for new employee', () => {
    render(<EmployeeForm {...defaultProps} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/seniorität/i)).toHaveTextContent('Junior');
    expect(screen.getByLabelText(/arbeitszeitfaktor/i)).toHaveValue(1);
  });

  it('renders form with employee data for editing', () => {
    render(<EmployeeForm {...defaultProps} employee={mockEmployee} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue(mockEmployee.name);
    expect(screen.getByLabelText(/seniorität/i)).toHaveTextContent(mockEmployee.seniority_level);
    expect(screen.getByLabelText(/arbeitszeitfaktor/i)).toHaveValue(mockEmployee.work_time_factor);
  });

  it('calls onSave with form data when submitted', async () => {
    render(<EmployeeForm {...defaultProps} />);

    // Fill out form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Jane Smith' },
    });
    const select = screen.getByLabelText(/seniorität/i);
    fireEvent.mouseDown(select);
    const option = screen.getByText('Mid');
    fireEvent.click(option);
    fireEvent.change(screen.getByLabelText(/arbeitszeitfaktor/i), {
      target: { value: '0.8' },
    });

    // Submit form
    fireEvent.click(screen.getByText(/speichern/i));

    expect(defaultProps.onSave).toHaveBeenCalledWith({
      name: 'Jane Smith',
      seniority_level: 'Mid',
      level_code: 'MID',
      qualifications: [],
      work_time_factor: 0.8,
      contract_end_date: null,
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<EmployeeForm {...defaultProps} />);

    fireEvent.click(screen.getByText(/abbrechen/i));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('validates required fields and work time factor range', async () => {
    render(<EmployeeForm {...defaultProps} />);

    // Clear name field
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: '' },
    });

    // Submit form
    fireEvent.click(screen.getByText(/speichern/i));

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/name/i)).toBeInvalid();

    // Test work time factor validation
    const workTimeFactorInput = screen.getByLabelText(/arbeitszeitfaktor/i);

    // Test invalid values
    fireEvent.change(workTimeFactorInput, { target: { value: '0.05' } });
    fireEvent.click(screen.getByText(/speichern/i));
    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Arbeitszeitfaktor muss zwischen 0 und 1 liegen')).toBeInTheDocument();

    fireEvent.change(workTimeFactorInput, { target: { value: '1.1' } });
    fireEvent.click(screen.getByText(/speichern/i));
    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Arbeitszeitfaktor muss zwischen 0 und 1 liegen')).toBeInTheDocument();

    // Test valid values
    fireEvent.change(workTimeFactorInput, { target: { value: '0.1' } });
    expect(screen.queryByText('Arbeitszeitfaktor muss zwischen 0 und 1 liegen')).not.toBeInTheDocument();

    fireEvent.change(workTimeFactorInput, { target: { value: '0.5' } });
    expect(screen.queryByText('Arbeitszeitfaktor muss zwischen 0 und 1 liegen')).not.toBeInTheDocument();

    fireEvent.change(workTimeFactorInput, { target: { value: '1.0' } });
    expect(screen.queryByText('Arbeitszeitfaktor muss zwischen 0 und 1 liegen')).not.toBeInTheDocument();
  });
});
