import { Project, NewProject, UpdateProject } from '../types/project';

class ProjectService {
  private baseUrl = '/api/projects';

  async getAll(): Promise<Project[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error('Failed to load projects');
    }
    return response.json();
  }

  async getById(id: number): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to load project');
    }
    return response.json();
  }

  async create(project: NewProject): Promise<Project> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    if (!response.ok) {
      throw new Error('Failed to create project');
    }
    return response.json();
  }

  async update(id: number, project: UpdateProject): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    if (!response.ok) {
      throw new Error('Failed to update project');
    }
    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  }

  async archive(id: number): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/${id}/archive`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to archive project');
    }
    return response.json();
  }

  async getArchived(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/archived`);
    if (!response.ok) {
      throw new Error('Failed to load archived projects');
    }
    return response.json();
  }
}

export const projectService = new ProjectService();
