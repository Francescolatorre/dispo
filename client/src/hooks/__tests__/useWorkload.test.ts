import { renderHook } from '@testing-library/react';
import useWorkload, { validateWorkload, formatWorkload } from '../useWorkload';
import type { AssignmentWithRelations } from '../../types/assignment';

describe('useWorkload', () => {
  const mockAssignments: AssignmentWithRelations[] = [
    {
      id: 1,
      project_id: 1,
      employee_id: 1,
      role: 'Developer',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      allocation_percentage: 60,
      status: 'active',
      dr_status: 'DR2',
      position_status: 'P2',
      project_name: 'Project A',
      employee_name: 'John Doe',
    },
    {
      id: 2,
      project_id: 2,
      employee_id: 1,
      role: 'Consultant',
      start_date: '2024-03-01',
      end_date: '2024-08-31',
      allocation_percentage: 30,
      status: 'active',
      dr_status: 'DR2',
      position_status: 'P2',
      project_name: 'Project B',
      employee_name: 'John Doe',
    },
  ];

  it('should calculate total workload correctly', () => {
    const { result } = renderHook(() => useWorkload(mockAssignments));
    expect(result.current.value).toBe(90);
  });

  it('should detect warning state', () => {
    const { result } = renderHook(() => 
      useWorkload(mockAssignments, { warning: 80, error: 100 })
    );
    expect(result.current.isWarning).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('should detect error state', () => {
    const highWorkload = [
      ...mockAssignments,
      {
        ...mockAssignments[0],
        id: 3,
        allocation_percentage: 20,
      },
    ];
    const { result } = renderHook(() => useWorkload(highWorkload));
    expect(result.current.isError).toBe(true);
  });

  it('should generate appropriate messages', () => {
    const { result: warning } = renderHook(() => useWorkload(mockAssignments));
    expect(warning.current.message).toContain('High workload detected');

    const highWorkload = [
      ...mockAssignments,
      {
        ...mockAssignments[0],
        id: 3,
        allocation_percentage: 20,
      },
    ];
    const { result: error } = renderHook(() => useWorkload(highWorkload));
    expect(error.current.message).toContain('exceeds maximum capacity');
  });
});

describe('validateWorkload', () => {
  const baseAssignments: AssignmentWithRelations[] = [
    {
      id: 1,
      project_id: 1,
      employee_id: 1,
      role: 'Developer',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      allocation_percentage: 60,
      status: 'active',
      dr_status: 'DR2',
      position_status: 'P2',
      project_name: 'Project A',
      employee_name: 'John Doe',
    },
  ];

  it('should validate new allocation correctly', () => {
    const result = validateWorkload(baseAssignments, 30);
    expect(result.value).toBe(90);
    expect(result.isWarning).toBe(true);
    expect(result.isError).toBe(false);
  });

  it('should handle updating existing assignment', () => {
    const result = validateWorkload(baseAssignments, 50, {
      currentAssignmentId: 1,
    });
    expect(result.value).toBe(50);
    expect(result.isWarning).toBe(false);
    expect(result.isError).toBe(false);
  });

  it('should respect custom thresholds', () => {
    const result = validateWorkload(baseAssignments, 30, {
      thresholds: { warning: 70, error: 90 },
    });
    expect(result.isError).toBe(true);
  });

  it('should generate appropriate validation messages', () => {
    const warningResult = validateWorkload(baseAssignments, 30);
    expect(warningResult.message).toContain('high workload');

    const errorResult = validateWorkload(baseAssignments, 50);
    expect(errorResult.message).toContain('exceed maximum capacity');
  });
});

describe('formatWorkload', () => {
  it('should format whole numbers without decimals', () => {
    expect(formatWorkload(50)).toBe('50');
  });

  it('should format decimal numbers with one decimal place', () => {
    expect(formatWorkload(33.33)).toBe('33.3');
  });

  it('should handle zero', () => {
    expect(formatWorkload(0)).toBe('0');
  });
});