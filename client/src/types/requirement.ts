export interface Requirement {
  id: number;
  project_id: number;
  role: string;
  seniority_level: string;
  required_qualifications: string[];
  start_date: string;
  end_date: string;
  status: 'open' | 'partially_filled' | 'filled' | 'needs_replacement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  current_assignment_id?: number;
}

export interface NewRequirement extends Omit<Requirement, 'id' | 'current_assignment_id'> {
  project_id: number;
}

export interface RequirementUpdate extends Partial<Omit<Requirement, 'id' | 'project_id'>> {
  id: number;
}

export interface CoverageAnalysis {
  requirement_id: number;
  total_positions: number;
  filled_positions: number;
  coverage_percentage: number;
  status: Requirement['status'];
  assignments: {
    id: number;
    employee_id: number;
    start_date: string;
    end_date: string;
    allocation_percentage: number;
  }[];
}