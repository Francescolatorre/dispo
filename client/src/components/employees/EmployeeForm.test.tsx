import { vi, describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { EmployeeForm } from './EmployeeForm';
import { createMockEmployee, MOCK_EMPLOYEE_DATA } from '../../test/employee-test-utils';
import {
  render,
  fillFormFields,
  asyncAct,
  waitForCondition,
  createAsyncHandler,
  fireEvent,
  TEST_TIMEOUTS
} from '../../test/test-setup';

interface FormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  employee?: ReturnType<typeof createMockEmployee>;
}

describe('EmployeeForm', () => {
  const mockEmployee = createMockEmployee({ work_time_factor: 50 });

  const defaultProps: FormProps = {
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
    const mockSave = createAsyncHandler(TEST_TIMEOUTS.short);
    render(<EmployeeForm {...defaultProps} onSave={mockSave} />);

    // Fill out all required fields
    await fillFormFields([
      { label: /name/i, value: 'Jane Smith' },
      { label: /personalnummer/i, value: 'EMP-1234' },
      { label: /position/i, value: 'Developer' },
      { label: /e-mail/i, value: 'jane.smith@example.com' },
      { label: /arbeitszeitfaktor \(%\)/i, value: 50 }
    ]);

    // Add qualifications
    const qualificationsInput = screen.getByLabelText(/qualifikationen/i);
    await asyncAct(async () => {
      fireEvent.change(qualificationsInput, { target: { value: 'TypeScript' } });
      fireEvent.keyDown(qualificationsInput, { key: 'Enter' });
    });

    // Submit form
    await asyncAct(async () => {
      fireEvent.click(screen.getByRole('button', { name: /speichern/i }));
    });

    // Wait for save to complete
    await waitForCondition(
      () => mockSave.mock.calls.length > 0,
      TEST_TIMEOUTS.medium
    );

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Jane Smith',
      employee_number: 'EMP-1234',
      email: 'jane.smith@example.com',
      position: 'Developer',
      qualifications: ['TypeScript'],
      work_time_factor: 50,
      seniority_level: 'Junior',
      level_code: MOCK_EMPLOYEE_DATA.LEVEL_CODES.Junior
    }));
  });

  it('calls onClose when cancel button is clicked', async () => {
    render(<EmployeeForm {...defaultProps} />);

    await asyncAct(async () => {
      fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }));
    });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('validates required fields and work time factor range', async () => {
    render(<EmployeeForm {...defaultProps} />);

    // Submit form without filling required fields
    await asyncAct(async () => {
      fireEvent.click(screen.getByRole('button', { name: /speichern/i }));
    });

    // Wait for validation errors to appear
    await waitForCondition(
      () => screen.queryByRole('alert') !== null,
      TEST_TIMEOUTS.short
    );

    // Check for validation errors
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Name muss mindestens 2 Zeichen lang sein');
    expect(alert).toHaveTextContent('Mindestens eine Qualifikation ist erforderlich');
    expect(defaultProps.onSave).not.toHaveBeenCalled();

    // Fill out form with invalid work time factor
    await fillFormFields([
      { label: /arbeitszeitfaktor \(%\)/i, value: 101 }
    ]);

    // Submit form again
    await asyncAct(async () => {
      fireEvent.click(screen.getByRole('button', { name: /speichern/i }));
    });

    // Wait for validation error to update
    await waitForCondition(
      () => {
        const alert = screen.queryByRole('alert');
        return alert?.textContent?.includes('Arbeitszeitfaktor muss zwischen 0 und 100 liegen') ?? false;
      },
      TEST_TIMEOUTS.short
    );

    // Check for work time factor validation error
    const updatedAlert = screen.getByRole('alert');
    expect(updatedAlert).toHaveTextContent('Arbeitszeitfaktor muss zwischen 0 und 100 liegen');
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });
});
