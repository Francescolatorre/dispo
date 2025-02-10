export interface Assignment {
  id: number;
  project_id: number;
  employee_id: number;
  requirement_id: number;
  role: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'terminated';
  allocation_percentage: number;
  dr_status?: string;
  position_status?: string;
  termination_reason?: string;
}

export interface NewAssignment extends Omit<Assignment, 'id' | 'status'> {
  project_id: number;
  employee_id: number;
  requirement_id: number;
}

export interface AssignmentUpdate extends Partial<Omit<Assignment, 'id' | 'project_id' | 'employee_id' | 'requirement_id'>> {
  id: number;
}

export interface AssignmentTermination {
  id: number;
  termination_reason: string;
  termination_date?: string;
}

export interface EmployeeAvailability {
  employee_id: number;
  available_percentage: number;
  current_assignments: {
    project_id: number;
    project_name: string;
    allocation_percentage: number;
    start_date: string;
    end_date: string;
  }[];
  conflicts: {
    project_id: number;
    project_name: string;
    conflict_start_date: string;
    conflict_end_date: string;
    overlap_percentage: number;
  }[];
}