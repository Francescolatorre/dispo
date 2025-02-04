import { useState } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ProjectList } from '../components/projects/ProjectList';
import { ProjectForm } from '../components/projects/ProjectForm';
import { Project, NewProject } from '../types/project';
import { projectService } from '../services/projectService';

export const Projects = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();

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
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Neues Projekt
        </Button>
      </Box>

      <ProjectList onEdit={handleEdit} />

      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        project={selectedProject}
      />
    </Box>
  );
};
