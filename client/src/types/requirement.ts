/**
 * Project requirement status
 */
export type RequirementStatus = 'open' | 'partially_filled' | 'filled' | 'needs_replacement';

/**
 * Priority level for requirements
 */
export type RequirementPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Coverage period for a requirement
 */
export interface CoveragePeriod {
  start_date: string;
  end_date: string;
  type: 'covered' | 'gap';
}

/**
 * Coverage analysis result
 */
export interface RequirementCoverage {
  req_start: string;
  req_end: string;
  periods: CoveragePeriod[];
}

/**
 * Project requirement model
 */
export interface Requirement {
  id: number;
  project_id: number;
  role: string;
  seniority_level: string;
  required_qualifications: string[];
  start_date: string;
  end_date: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  notes?: string;
  current_assignment_id?: number;
  created_at: string;
  updated_at: string;

  // Joined fields
  project_name?: string;
  current_employee_id?: number;
  current_employee_name?: string;
}

/**
 * Data for creating a new requirement
 */
export type NewRequirement = Omit<
  Requirement,
  'id' | 'status' | 'current_assignment_id' | 'created_at' | 'updated_at'
> & {
  status?: RequirementStatus;
};

/**
 * Data for updating a requirement
 */
export type UpdateRequirement = Partial<NewRequirement>;

/**
 * Employee match result for a requirement
 */
export interface EmployeeMatch {
  id: number;
  name: string;
  seniority_level: string;
  qualifications: string[];
  current_assignments: number;
  email: string;
  status: string;
}

/**
 * Requirement with additional project details
 */
export interface RequirementWithProject extends Requirement {
  project_name: string;
  project_start_date: string;
  project_end_date: string;
  project_status: string;
}

/**
 * Requirement list filters
 */
export interface RequirementFilters {
  status?: RequirementStatus[];
  priority?: RequirementPriority[];
  seniority_level?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

/**
 * Requirement statistics
 */
export interface RequirementStats {
  total: number;
  by_status: Record<RequirementStatus, number>;
  by_priority: Record<RequirementPriority, number>;
  coverage_percentage: number;
  upcoming_gaps: number;
}