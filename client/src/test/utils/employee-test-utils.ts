import { Employee } from '../types/employee';
import { LEVEL_CODES, SeniorityLevel, getLevelCode } from '../constants/employeeLevels';

export const createMockEmployee = (overrides?: Partial<Employee>): Employee => ({
  id: 1,
  name: 'John Doe',
  employee_number: 'EMP-1234',
  entry_date: '2025-01-01',
  email: 'john.doe@example.com',
  phone: '123-456-7890',
  position: 'Software Developer',
  seniority_level: 'Mid' as SeniorityLevel,
  level_code: getLevelCode('Mid'),
  qualifications: ['TypeScript', 'React'],
  work_time_factor: 100,
  contract_end_date: '2025-12-31',
  status: 'active',
  part_time_factor: 100,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  ...overrides
});

export const MOCK_EMPLOYEE_DATA = {
  LEVEL_CODES,
  SENIORITY_LEVELS: ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'] as SeniorityLevel[],
  getLevelCode
};