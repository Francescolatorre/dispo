import axios from 'axios';
import {
  Requirement,
  NewRequirement,
  UpdateRequirement,
  RequirementCoverage,
  EmployeeMatch,
  RequirementStats,
  RequirementFilters
} from '../types/requirement';

const API_BASE = '/api/requirements';

/**
 * Service for managing project requirements
 */
class RequirementService {
  /**
   * Get all requirements for a project
   */
  async getProjectRequirements(projectId: number): Promise<Requirement[]> {
    const response = await axios.get(`${API_BASE}/project/${projectId}`);
    return response.data;
  }

  /**
   * Get a single requirement by ID
   */
  async getRequirementById(id: number): Promise<Requirement> {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  }

  /**
   * Create a new requirement
   */
  async createRequirement(data: NewRequirement): Promise<Requirement> {
    const response = await axios.post(API_BASE, data);
    return response.data;
  }

  /**
   * Update a requirement
   */
  async updateRequirement(id: number, data: UpdateRequirement): Promise<Requirement> {
    const response = await axios.put(`${API_BASE}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a requirement
   */
  async deleteRequirement(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/${id}`);
  }

  /**
   * Get coverage analysis for a requirement
   */
  async getRequirementCoverage(id: number): Promise<RequirementCoverage> {
    const response = await axios.get(`${API_BASE}/${id}/coverage`);
    return response.data;
  }

  /**
   * Find matching employees for a requirement
   */
  async findMatchingEmployees(id: number): Promise<EmployeeMatch[]> {
    const response = await axios.get(`${API_BASE}/${id}/matching-employees`);
    return response.data;
  }

  /**
   * Get filtered and paginated requirements
   */
  async getFilteredRequirements(
    projectId: number,
    filters: RequirementFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ requirements: Requirement[]; total: number }> {
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
   * Get requirement statistics
   */
  async getRequirementStats(projectId: number): Promise<RequirementStats> {
    const response = await axios.get(`${API_BASE}/project/${projectId}/stats`);
    return response.data;
  }

  /**
   * Bulk update requirements
   */
  async bulkUpdateRequirements(
    ids: number[],
    data: Partial<UpdateRequirement>
  ): Promise<Requirement[]> {
    const response = await axios.put(`${API_BASE}/bulk-update`, {
      ids,
      data
    });
    return response.data;
  }

  /**
   * Clone a requirement
   */
  async cloneRequirement(
    id: number,
    modifications?: Partial<NewRequirement>
  ): Promise<Requirement> {
    const response = await axios.post(`${API_BASE}/${id}/clone`, modifications);
    return response.data;
  }

  /**
   * Export requirements to CSV
   */
  async exportRequirements(projectId: number, filters?: RequirementFilters): Promise<Blob> {
    const response = await axios.get(`${API_BASE}/project/${projectId}/export`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Import requirements from CSV
   */
  async importRequirements(projectId: number, file: File): Promise<{
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

  /**
   * Validate a requirement
   */
  async validateRequirement(data: NewRequirement | UpdateRequirement): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const response = await axios.post(`${API_BASE}/validate`, data);
    return response.data;
  }
}

export default new RequirementService();