export interface Employee {
  id: number;
  name: string;
  seniority_level: string;
  level_code: string;
  qualifications: string[];
  work_time_factor: number;
  contract_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const LEVEL_CODES = {
  Junior: 'JR',
  Mid: 'MID',
  Senior: 'SR',
  Lead: 'LD'
} as const;

export type NewEmployee = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;

export type UpdateEmployee = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;

export const SENIORITY_LEVELS = [
  'Junior',
  'Mid',
  'Senior',
  'Lead'
] as const;

export type SeniorityLevel = typeof SENIORITY_LEVELS[number];
