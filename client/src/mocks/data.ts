import type { Project } from '../types/project';
import type { Employee } from '../types/employee';
import type { AssignmentWithRelations } from '../types/assignment';
import { isWithinInterval, parseISO, areIntervalsOverlapping, eachDayOfInterval } from 'date-fns';

export const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Digital Transformation',
    project_number: 'DT-2024-001',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    location: 'Berlin',
    fte_count: 5,
    project_manager_id: 1,
    documentation_links: ['https://wiki.example.com/dt-2024'],
    status: 'active',
  },
  {
    id: 2,
    name: 'Cloud Migration',
    project_number: 'CM-2024-002',
    start_date: '2024-03-01',
    end_date: '2024-08-31',
    location: 'Hamburg',
    fte_count: 3,
    project_manager_id: 2,
    documentation_links: ['https://wiki.example.com/cm-2024'],
    status: 'active',
  },
];

export const mockEmployees: Employee[] = [
  {
    id: 1,
    name: 'John Doe',
    employee_number: 'EMP001',
    entry_date: '2020-01-01',
    email: 'john.doe@example.com',
    position: 'Senior Developer',
    seniority_level: 'Senior',
    level_code: 'L4',
    qualifications: ['Java', 'Spring', 'React'],
    work_time_factor: 1.0,
    part_time_factor: 100,
    status: 'active',
  },
  {
    id: 2,
    name: 'Jane Smith',
    employee_number: 'EMP002',
    entry_date: '2021-03-15',
    email: 'jane.smith@example.com',
    position: 'Project Manager',
    seniority_level: 'Senior',
    level_code: 'L4',
    qualifications: ['Project Management', 'Agile', 'Scrum'],
    work_time_factor: 1.0,
    part_time_factor: 80,
    status: 'active',
  },
  {
    id: 3,
    name: 'Bob Wilson',
    employee_number: 'EMP003',
    entry_date: '2022-06-01',
    email: 'bob.wilson@example.com',
    position: 'Developer',
    seniority_level: 'Mid',
    level_code: 'L3',
    qualifications: ['JavaScript', 'React', 'Node.js'],
    work_time_factor: 1.0,
    part_time_factor: 100,
    status: 'active',
  },
];

export const mockAssignments: AssignmentWithRelations[] = [
  {
    id: 1,
    project_id: 1,
    employee_id: 1,
    role: 'Technical Lead',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    allocation_percentage: 60,
    dr_status: 'DR2',
    position_status: 'P2',
    status: 'active',
    project_name: 'Digital Transformation',
    employee_name: 'John Doe',
  },
  {
    id: 2,
    project_id: 2,
    employee_id: 1,
    role: 'Senior Developer',
    start_date: '2024-03-01',
    end_date: '2024-08-31',
    allocation_percentage: 40,
    dr_status: 'DR2',
    position_status: 'P2',
    status: 'active',
    project_name: 'Cloud Migration',
    employee_name: 'John Doe',
  },
  {
    id: 3,
    project_id: 1,
    employee_id: 2,
    role: 'Project Manager',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    allocation_percentage: 50,
    dr_status: 'DR2',
    position_status: 'P2',
    status: 'active',
    project_name: 'Digital Transformation',
    employee_name: 'Jane Smith',
  },
  {
    id: 4,
    project_id: 1,
    employee_id: 3,
    role: 'Developer',
    start_date: '2024-02-01',
    end_date: '2024-07-31',
    allocation_percentage: 100,
    dr_status: 'DR2',
    position_status: 'P2',
    status: 'active',
    project_name: 'Digital Transformation',
    employee_name: 'Bob Wilson',
  },
];

// Helper function to find assignments by project
export const getProjectAssignments = (projectId: number) => {
  return mockAssignments.filter(a => a.project_id === projectId);
};

// Helper function to find assignments by employee
export const getEmployeeAssignments = (employeeId: number) => {
  return mockAssignments.filter(a => a.employee_id === employeeId);
};

// Helper function to calculate workload for a specific date
const calculateWorkloadForDate = (
  employeeId: number,
  date: Date,
  excludeAssignmentId?: number
) => {
  const activeAssignments = mockAssignments.filter(a =>
    a.employee_id === employeeId &&
    a.status === 'active' &&
    (excludeAssignmentId === undefined || a.id !== excludeAssignmentId) &&
    isWithinInterval(date, {
      start: parseISO(a.start_date),
      end: parseISO(a.end_date)
    })
  );

  return activeAssignments.reduce(
    (sum, a) => sum + a.allocation_percentage,
    0
  );
};

// Helper function to calculate workload for a specific date range
export const calculateWorkloadForRange = (
  employeeId: number,
  startDate: string,
  endDate: string,
  excludeAssignmentId?: number
) => {
  const employee = mockEmployees.find(e => e.id === employeeId);
  if (!employee) return 0;

  const dateRange = {
    start: parseISO(startDate),
    end: parseISO(endDate)
  };

  // Get all dates in the range
  const dates = eachDayOfInterval(dateRange);

  // Calculate workload for each date and find the maximum
  const maxWorkload = Math.max(
    ...dates.map(date => calculateWorkloadForDate(employeeId, date, excludeAssignmentId))
  );

  return maxWorkload;
};

// Helper function to calculate workload for a specific date
export const calculateWorkload = (
  employeeId: number,
  date: string,
  excludeAssignmentId?: number
) => {
  return calculateWorkloadForRange(employeeId, date, date, excludeAssignmentId);
};