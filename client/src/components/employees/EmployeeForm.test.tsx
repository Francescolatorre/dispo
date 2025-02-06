import { render, screen, fireEvent } from '@testing-library/react';
import { EmployeeForm } from './EmployeeForm';
import { vi, describe, it, expect } from 'vitest';
import { Employee, LEVEL_CODES } from '../../types/employee';

describe('EmployeeForm', () => {
  const mockEmployee: Employee = {
    id: 1,
    name: 'John Doe',
    employee_number: 'EMP-1234',
    entry_date: '2025-01-01',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    position: 'Software Developer',
    seniority_level: 'Mid',
    level_code: LEVEL_CODES.Mid,
    qualifications: ['TypeScript', 'React'],
    work_time_factor: 50,
    contract_end_date: '2025-12-31',
    status: 'active',
    part_time_factor: 100,
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
    expect(screen.getByLabelText(/arbeitszeitfaktor/i)).toHaveValue(100);
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
    fireEvent.change(screen.getByLabelText(/personalnummer/i), { target: { value: 'EMP-1234' } });
    fireEvent.change(screen.getByLabelText(/eintrittsdatum/i), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'jane.smith@example.com' } });
    fireEvent.change(screen.getByLabelText(/position/i), { target: { value: 'Developer' } });
    fireEvent.change(screen.getByLabelText(/arbeitszeitfaktor/i), { target: { value: '50' } });

    // Submit form
    fireEvent.click(screen.getByText(/speichern/i));

    expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Jane Smith',
      personalnummer: 'EMP-1234',
      eintrittsdatum: '2025-01-01',
      email: 'jane.smith@example.com',
      position: 'Developer',
      seniorität: 'Mid',
      arbeitszeitfaktor: '50',
    }));
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<EmployeeForm {...defaultProps} />);

    fireEvent.click(screen.getByText(/abbrechen/i));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('validates required fields and work time factor range', async () => {
    render(<EmployeeForm {...defaultProps} />);

    // Submit form without filling required fields
    fireEvent.click(screen.getByText(/speichern/i));

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText((content, element) => content.includes('Arbeitszeitfaktor muss zwischen 0 und 100 liegen'))).toBeInTheDocument();

    // Fill out form with invalid work time factor
    const workTimeFactorInput = screen.getByLabelText(/arbeitszeitfaktor/i);
    fireEvent.change(workTimeFactorInput, { target: { value: '101' } });

    // Submit form
    fireEvent.click(screen.getByText(/speichern/i));

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText((content, element) => content.includes('Arbeitszeitfaktor muss zwischen 0 und 100 liegen'))).toBeInTheDocument();
  });
});
