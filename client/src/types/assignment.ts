export interface Assignment {
  id: number;
  project_id: number;
  employee_id: number;
  role: string;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
  status: 'active' | 'completed' | 'cancelled';
  dr_status: string;
  position_status: string;
}

export interface AssignmentWithRelations extends Assignment {
  project_name: string;
  employee_name: string;
}

export interface CreateAssignmentDto {
  project_id: number;
  employee_id: number;
  role: string;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
  status?: 'active' | 'completed' | 'cancelled';
  dr_status?: string;
  position_status?: string;
}

export interface UpdateAssignmentDto {
  role?: string;
  start_date?: string;
  end_date?: string;
  allocation_percentage?: number;
  status?: 'active' | 'completed' | 'cancelled';
  dr_status?: string;
  position_status?: string;
}

export interface AssignmentValidationDto {
  // Frontend fields (camelCase)
  projectId?: number;
  employeeId?: number;
  role?: string;
  startDate?: string;
  endDate?: string;
  allocationPercentage?: number;
  status?: 'active' | 'completed' | 'cancelled';
  drStatus?: string;
  positionStatus?: string;
}

export interface AssignmentValidation {
  isValid: boolean;
  errors: {
    [key: string]: string[];
  };
  warning?: boolean;
  message?: string;
}

export interface AssignmentFilters {
  projectId?: number;
  employeeId?: number;
  status?: 'active' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  role?: string;
  drStatus?: string;
  positionStatus?: string;
}