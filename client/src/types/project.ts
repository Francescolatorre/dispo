export const PROJECT_STATUSES = ['active', 'archived'] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

export interface Project {
  id: number;
  name: string;
  project_number: string;
  start_date: string;
  end_date: string;
  location: string;
  fte_count: number;
  project_manager_id: number;
  documentation_links: string[];
  status: ProjectStatus;
  created_at?: string;
  updated_at?: string;
}

export type NewProject = Omit<Project, 'id' | 'project_number' | 'location' | 'fte_count' | 'created_at' | 'updated_at'> & {
  project_manager: string;
};
