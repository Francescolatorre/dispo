import { SeniorityLevel, LevelCode } from '../constants/employeeLevels';

export interface Employee {
  id: number;
  name: string;
  employee_number: string;
  entry_date: string;
  email: string;
  phone?: string;
  position: string;
  seniority_level: SeniorityLevel;
  level_code: LevelCode;
  qualifications: string[];
  work_time_factor: number;
  contract_end_date?: string;
  status: 'active' | 'inactive';
  part_time_factor: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeeDto {
  name: string;
  employee_number: string;
  entry_date: string;
  email: string;
  phone?: string;
  position: string;
  seniority_level: SeniorityLevel;
  level_code: LevelCode;
  qualifications: string[];
  work_time_factor: number;
  contract_end_date?: string;
  part_time_factor: number;
}

export interface UpdateEmployeeDto {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  seniority_level?: SeniorityLevel;
  level_code?: LevelCode;
  qualifications?: string[];
  work_time_factor?: number;
  contract_end_date?: string;
  status?: 'active' | 'inactive';
  part_time_factor?: number;
}
