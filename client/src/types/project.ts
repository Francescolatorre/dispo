export interface Project {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  project_manager: string;
  documentation_links: string[];
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type NewProject = Omit<Project, 'id' | 'created_at' | 'updated_at'>;

export type UpdateProject = Omit<Project, 'id' | 'created_at' | 'updated_at'>;

export type ProjectStatus = 'active' | 'archived';

export const PROJECT_STATUSES: ProjectStatus[] = ['active', 'archived'];
