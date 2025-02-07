import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Project } from '../types/project';
import type { AssignmentWithRelations } from '../types/assignment';
import { projectService } from '../services/projectService';
import { assignmentService } from '../services/assignmentService';

interface ProjectContextValue {
  project: Project | undefined;
  assignments: AssignmentWithRelations[];
  isLoading: boolean;
  error: Error | null;
  refreshData: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

interface ProjectProviderProps {
  projectId: number;
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  projectId,
  children,
}) => {
  const queryClient = useQueryClient();

  // Fetch project data
  const {
    data: project,
    isLoading: isProjectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProjectById(projectId),
  });

  // Fetch project assignments
  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    error: assignmentsError,
  } = useQuery({
    queryKey: ['project', projectId, 'assignments'],
    queryFn: () => assignmentService.getProjectAssignments(projectId),
    enabled: !!project, // Only fetch assignments if project exists
  });

  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['project', projectId, 'assignments'] }),
    ]);
  }, [projectId, queryClient]);

  const value: ProjectContextValue = {
    project,
    assignments,
    isLoading: isProjectLoading || isAssignmentsLoading,
    error: projectError || assignmentsError || null,
    refreshData,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;