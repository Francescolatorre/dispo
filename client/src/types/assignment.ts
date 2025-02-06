/**
 * Assignment status
 */
export type AssignmentStatus = 'active' | 'completed' | 'terminated';

/**
 * Development responsibility status
 */
export type DRStatus = 'primary' | 'secondary' | 'backup';

/**
 * Position status in project
 */
export type PositionStatus = 'confirmed' | 'tentative' | 'proposed';

/**
 * Project assignment model
 */
export interface Assignment {
  id: number;
  project_id: number;
  employee_id: number;
  requirement_id: number;
  role: string;
  start_date: string;
  end_date: string;
  status: AssignmentStatus;
  allocation_percentage: number;
  dr_status?: DRStatus;
  position_status?: PositionStatus;
  termination_reason?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  project_name?: string;
  employee_name?: string;
  employee_seniority_level?: string;
  requirement_role?: string;
}

/**
 * Data for creating a new assignment
 */
export type NewAssignment = Omit<
  Assignment,
  'id' | 'status' | 'created_at' | 'updated_at'
> & {
  status?: AssignmentStatus;
};

/**
 * Data for updating an assignment
 */
export type UpdateAssignment = Partial<NewAssignment>;

/**
 * Assignment termination request
 */
export interface TerminationRequest {
  reason: string;
  end_date?: string;
}

/**
 * Employee availability period
 */
export interface AvailabilityPeriod {
  start_date: string;
  end_date: string;
  allocation_percentage: number;
  assignments: Assignment[];
}

/**
 * Employee availability check result
 */
export interface AvailabilityResult {
  available_percentage: number;
  conflicting_assignments: Assignment[];
  available_periods: AvailabilityPeriod[];
}

/**
 * Assignment history entry
 */
export interface AssignmentHistory {
  assignment: Assignment;
  changes: {
    field: string;
    old_value: any;
    new_value: any;
    changed_at: string;
    changed_by: string;
  }[];
}

/**
 * Assignment with requirement details
 */
export interface AssignmentWithRequirement extends Assignment {
  requirement: {
    role: string;
    seniority_level: string;
    start_date: string;
    end_date: string;
    status: string;
  };
}

/**
 * Assignment list filters
 */
export interface AssignmentFilters {
  status?: AssignmentStatus[];
  date_range?: {
    start: string;
    end: string;
  };
  allocation_range?: {
    min: number;
    max: number;
  };
  search?: string;
}

/**
 * Assignment statistics
 */
export interface AssignmentStats {
  total: number;
  by_status: Record<AssignmentStatus, number>;
  average_allocation: number;
  total_allocation_percentage: number;
  termination_rate: number;
}

/**
 * Assignment conflict
 */
export interface AssignmentConflict {
  type: 'overlap' | 'over_allocation' | 'requirement_mismatch';
  message: string;
  conflicting_assignments?: Assignment[];
  details?: {
    total_allocation: number;
    period_start: string;
    period_end: string;
  };
}

/**
 * Assignment validation result
 */
export interface AssignmentValidation {
  valid: boolean;
  conflicts: AssignmentConflict[];
}