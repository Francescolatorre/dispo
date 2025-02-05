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
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
}

export const ProjectList = ({ projects, onEdit, onDelete, onArchive }: ProjectListProps) => {

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
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No projects found</TableCell>
              </TableRow>
            ) : projects.map((project) => (
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
                          onClick={() => onArchive(project.id)}
                          size="small"
                          aria-label="Archivieren"
                        >
                          <ArchiveIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Löschen">
                        <IconButton
                          onClick={() => onDelete(project.id)}
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
