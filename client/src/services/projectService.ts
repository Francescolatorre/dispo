import axios from 'axios';
import type { Project } from '../types/project';

const API_BASE_URL = '/api';

class ProjectService {
  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    const response = await axios.get(`${API_BASE_URL}/projects`);
    return response.data;
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: number): Promise<Project> {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}`);
    return response.data;
  }

  /**
   * Create a new project
   */
  async createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const response = await axios.post(`${API_BASE_URL}/projects`, data);
    return response.data;
  }

  /**
   * Update a project
   */
  async updateProject(
    id: number,
    data: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Project> {
    const response = await axios.patch(`${API_BASE_URL}/projects/${id}`, data);
    return response.data;
  }

  /**
   * Delete a project
   */
  async deleteProject(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/projects/${id}`);
  }
}

export const projectService = new ProjectService();
