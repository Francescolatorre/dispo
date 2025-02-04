import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Box,
  Button,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import { Project } from '../../types/project';
import { projectService } from '../../services/projectService';

interface ProjectListProps {
  onEdit: (project: Project) => void;
}

export const ProjectList = ({ onEdit }: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Projektleiter</TableCell>
              <TableCell>Zeitraum</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Dokumentation</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.project_manager}</TableCell>
                <TableCell>
                  {new Date(project.start_date).toLocaleDateString()} -{' '}
                  {new Date(project.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.status === 'active' ? 'Aktiv' : 'Archiviert'}
                    color={project.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {project.documentation_links.map((link, index) => (
                    <Chip
                      key={index}
                      label={`Link ${index + 1}`}
                      component="a"
                      href={link}
                      target="_blank"
                      clickable
                      size="small"
                      style={{ margin: '2px' }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <Tooltip title="Bearbeiten">
                    <IconButton
                      onClick={() => onEdit(project)}
                      size="small"
                      aria-label="Bearbeiten"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {project.status === 'active' && (
                    <>
                      <Tooltip title="Archivieren">
                        <IconButton
                          onClick={() => handleArchive(project.id)}
                          size="small"
                          aria-label="Archivieren"
                        >
                          <ArchiveIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Löschen">
                        <IconButton
                          onClick={() => handleDelete(project.id)}
                          size="small"
                          color="error"
                          aria-label="Löschen"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
