import { startOfDay, addDays, addMonths, differenceInDays } from 'date-fns';
import { vi } from 'vitest';
import type { AssignmentWithRelations } from '../../../types/assignment';

// Common test dates
export const testDates = {
  today: startOfDay(new Date('2024-01-15')),
  startOfYear: startOfDay(new Date('2024-01-01')),
  endOfYear: startOfDay(new Date('2024-12-31')),
};

// Generate test date ranges
export const generateDateRange = (params: {
  months: number;
  startDate?: Date;
}): { start: Date; end: Date } => {
  const start = params.startDate || testDates.startOfYear;
  return {
    start,
    end: addMonths(start, params.months),
  };
};

// Calculate expected width
export const calculateExpectedWidth = (
  startDate: Date,
  endDate: Date,
  columnWidth: number
): number => {
  const days = differenceInDays(endDate, startDate) + 1; // Include both start and end dates
  return days * columnWidth;
};

// Mock assignments for testing
export const mockAssignments: AssignmentWithRelations[] = [
  {
    id: 1,
    project_id: 1,
    employee_id: 1,
    role: 'Developer',
    start_date: '2024-01-01',
    end_date: '2024-03-31',
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
    start_date: '2024-02-01',
    end_date: '2024-04-30',
    allocation_percentage: 40,
    status: 'active',
    dr_status: 'DR2',
    position_status: 'P2',
    project_name: 'Project B',
    employee_name: 'John Doe',
  },
];

// Generate test assignments
interface GenerateAssignmentsParams {
  count: number;
  startDate: Date;
  durationDays: number;
  employeeId?: number;
  projectId?: number;
}

export const generateTestAssignments = ({
  count,
  startDate,
  durationDays,
  employeeId = 1,
  projectId = 1,
}: GenerateAssignmentsParams): AssignmentWithRelations[] => {
  const assignments: AssignmentWithRelations[] = [];

  for (let i = 0; i < count; i++) {
    const start = addDays(startDate, i * 7); // Spread assignments weekly
    const end = addDays(start, durationDays);

    assignments.push({
      id: i + 1,
      project_id: projectId,
      employee_id: employeeId,
      role: 'Developer',
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      allocation_percentage: 50,
      status: 'active',
      dr_status: 'DR2',
      position_status: 'P2',
      project_name: `Project ${i + 1}`,
      employee_name: 'Test Employee',
    });
  }

  return assignments;
};

// Mock event handlers
export const createMockHandlers = () => ({
  onAssignmentUpdate: vi.fn(),
  onAssignmentEdit: vi.fn(),
  onAssignmentDelete: vi.fn(),
});

// Common test props
export const defaultTimelineProps = {
  startDate: testDates.startOfYear,
  endDate: testDates.endOfYear,
  scale: 'day' as const,
  assignments: mockAssignments,
  ...createMockHandlers(),
};

// Mock mouse events
export const createMouseEvent = (type: string, coords: { clientX: number; clientY: number }) => {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: coords.clientX,
    clientY: coords.clientY,
  });
};

// Mock drag events
export const simulateDrag = (element: HTMLElement, startCoords: { x: number; y: number }, endCoords: { x: number; y: number }) => {
  const mouseDown = createMouseEvent('mousedown', { clientX: startCoords.x, clientY: startCoords.y });
  const mouseMove = createMouseEvent('mousemove', { clientX: endCoords.x, clientY: endCoords.y });
  const mouseUp = createMouseEvent('mouseup', { clientX: endCoords.x, clientY: endCoords.y });

  element.dispatchEvent(mouseDown);
  document.dispatchEvent(mouseMove);
  document.dispatchEvent(mouseUp);
};