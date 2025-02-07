import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployeeList } from './EmployeeList';
import { employeeService } from '../../services/employeeService';
import { vi } from 'vitest';

// Mock the employeeService
vi.mock('../../services/employeeService', () => ({
  employeeService: {
    getAll: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockEmployees = [
  {
    id: 1,
    name: 'John Doe',
    seniority_level: 'Senior',
    qualifications: ['JavaScript', 'React', 'Node.js'],
    work_time_factor: 1.0,
    contract_end_date: '2025-12-31',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
  },
];

describe('EmployeeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders employee list with data', async () => {
    (employeeService.getAll as any).mockResolvedValue(mockEmployees);
    render(<EmployeeList onEdit={() => {}} />);

    // Check if employee data is displayed
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Senior')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('1.00')).toBeInTheDocument();
    expect(screen.getByText('31.12.2025')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = vi.fn();
    (employeeService.getAll as any).mockResolvedValue(mockEmployees);
    render(<EmployeeList onEdit={mockOnEdit} />);

    // Wait for data to load
    await screen.findByText('John Doe');

    // Click edit button
    const editButton = screen.getByLabelText('Bearbeiten');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockEmployees[0]);
  });

  it('calls delete service when delete button is clicked and confirmed', async () => {
    // Mock window.confirm
    const mockConfirm = vi.spyOn(window, 'confirm');
    mockConfirm.mockImplementation(() => true);

    (employeeService.getAll as any).mockResolvedValue(mockEmployees);
    render(<EmployeeList onEdit={() => {}} />);

    // Wait for data to load
    await screen.findByText('John Doe');

    // Click delete button
    const deleteButton = screen.getByLabelText('Löschen');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    expect(employeeService.delete).toHaveBeenCalledWith(1);
  });

  it('shows error message when loading fails', async () => {
    (employeeService.getAll as any).mockRejectedValue(new Error('Failed to load'));
    render(<EmployeeList onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Error loading employees: Failed to load')).toBeInTheDocument();
    });
  });
});
