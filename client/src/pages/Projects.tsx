import { useState, useEffect } from 'react';
import { Box, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import TimelineIcon from '@mui/icons-material/Timeline';
import { ProjectList } from '../components/projects/ProjectList';
import ProjectTimeline from '../components/projects/ProjectTimeline';
import { ProjectForm } from '../components/projects/ProjectForm';
import { Project, NewProject } from '../types/project';
import { projectService } from '../services/projectService';
import { employeeService } from '../services/employeeService';

export const Projects = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      
      // Fetch project manager names
      const projectsWithManagers = await Promise.all(
        data.map(async (project) => {
          try {
            const manager = await employeeService.getById(project.project_manager_id);
            return {
              ...project,
              project_manager_name: manager.name
            };
          } catch (err) {
            console.error(`Failed to load manager for project ${project.id}:`, err);
            return project;
          }
        })
      );
      
      setProjects(projectsWithManagers);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedProject(undefined);
    setFormOpen(true);
  };

  const handleSave = async (project: NewProject) => {
    try {
      if (selectedProject) {
        await projectService.update(selectedProject.id, project);
      } else {
        await projectService.create(project);
      }
      setFormOpen(false);
      await loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await projectService.delete(id);
      await loadProjects();
    } catch (err) {
      setError('Failed to delete project');
      console.error('Error deleting project:', err);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await projectService.archive(id);
      await loadProjects();
    } catch (err) {
      setError('Failed to archive project');
      console.error('Error archiving project:', err);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newValue) => newValue && setViewMode(newValue)}
          aria-label="view mode"
        >
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
          <ToggleButton value="timeline" aria-label="timeline view">
            <TimelineIcon />
          </ToggleButton>
        </ToggleButtonGroup>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Neues Projekt
        </Button>
      </Box>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : viewMode === 'list' ? (
        <ProjectList
          projects={projects}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      ) : (
        <ProjectTimeline projects={projects} />
      )}

      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        project={selectedProject}
      />
    </Box>
  );
};
