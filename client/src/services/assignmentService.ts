import axios from 'axios';
import {
  Assignment,
  NewAssignment,
  UpdateAssignment,
  AssignmentHistory,
  AvailabilityResult,
  AssignmentStats,
  AssignmentFilters,
  TerminationRequest,
  AssignmentValidation
} from '../types/assignment';

const API_BASE = '/api/assignments';

/**
 * Service for managing project assignments
 */
class AssignmentService {
  /**
   * Get all assignments for a project
   */
  async getProjectAssignments(projectId: number): Promise<Assignment[]> {
    const response = await axios.get(`${API_BASE}/project/${projectId}`);
    return response.data;
  }

  /**
   * Get all assignments for an employee
   */
  async getEmployeeAssignments(employeeId: number): Promise<Assignment[]> {
    const response = await axios.get(`${API_BASE}/employee/${employeeId}`);
    return response.data;
  }

  /**
   * Get a single assignment by ID
   */
  async getAssignmentById(id: number): Promise<Assignment> {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  }

  /**
   * Create a new assignment
   */
  async createAssignment(data: NewAssignment): Promise<Assignment> {
    const response = await axios.post(API_BASE, data);
    return response.data;
  }

  /**
   * Update an assignment
   */
  async updateAssignment(id: number, data: UpdateAssignment): Promise<Assignment> {
    const response = await axios.put(`${API_BASE}/${id}`, data);
    return response.data;
  }

  /**
   * Terminate an assignment
   */
  async terminateAssignment(id: number, data: TerminationRequest): Promise<Assignment> {
    const response = await axios.post(`${API_BASE}/${id}/terminate`, data);
    return response.data;
  }

  /**
   * Get assignment history for a requirement
   */
  async getRequirementHistory(requirementId: number): Promise<AssignmentHistory[]> {
    const response = await axios.get(`${API_BASE}/requirement/${requirementId}/history`);
    return response.data;
  }

  /**
   * Check employee availability
   */
  async checkEmployeeAvailability(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityResult> {
    const response = await axios.get(`${API_BASE}/check-availability/${employeeId}`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  }

  /**
   * Get filtered and paginated assignments
   */
  async getFilteredAssignments(
    projectId: number,
    filters: AssignmentFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ assignments: Assignment[]; total: number }> {
    const response = await axios.get(`${API_BASE}/project/${projectId}/filter`, {
      params: {
        ...filters,
        page,
        pageSize
      }
    });
    return response.data;
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(projectId: number): Promise<AssignmentStats> {
    const response = await axios.get(`${API_BASE}/project/${projectId}/stats`);
    return response.data;
  }

  /**
   * Validate an assignment
   */
  async validateAssignment(
    data: NewAssignment | UpdateAssignment
  ): Promise<AssignmentValidation> {
    const response = await axios.post(`${API_BASE}/validate`, data);
    return response.data;
  }

  /**
   * Bulk update assignments
   */
  async bulkUpdateAssignments(
    ids: number[],
    data: Partial<UpdateAssignment>
  ): Promise<Assignment[]> {
    const response = await axios.put(`${API_BASE}/bulk-update`, {
      ids,
      data
    });
    return response.data;
  }

  /**
   * Export assignments to CSV
   */
  async exportAssignments(projectId: number, filters?: AssignmentFilters): Promise<Blob> {
    const response = await axios.get(`${API_BASE}/project/${projectId}/export`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Import assignments from CSV
   */
  async importAssignments(projectId: number, file: File): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${API_BASE}/project/${projectId}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }
}

export default new AssignmentService();