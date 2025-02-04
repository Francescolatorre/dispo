import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Project, NewProject, PROJECT_STATUSES } from '../../types/project';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (project: NewProject) => Promise<void>;
  project?: Project;
}

export const ProjectForm = ({
  open,
  onClose,
  onSave,
  project,
}: ProjectFormProps) => {
  const [formData, setFormData] = useState<NewProject>({
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    project_manager: '',
    documentation_links: [],
    status: 'active',
  });

  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        start_date: project.start_date.split('T')[0],
        end_date: project.end_date.split('T')[0],
        project_manager: project.project_manager,
        documentation_links: project.documentation_links,
        status: project.status,
      });
    } else {
      setFormData({
        name: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        project_manager: '',
        documentation_links: [],
        status: 'active',
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  const handleAddLink = () => {
    if (newLink && !formData.documentation_links.includes(newLink)) {
      setFormData({
        ...formData,
        documentation_links: [...formData.documentation_links, newLink],
      });
      setNewLink('');
    }
  };

  const handleRemoveLink = (linkToRemove: string) => {
    setFormData({
      ...formData,
      documentation_links: formData.documentation_links.filter(
        (link) => link !== linkToRemove
      ),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {project ? 'Projekt bearbeiten' : 'Neues Projekt'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              fullWidth
            />

            <TextField
              label="Projektleiter"
              value={formData.project_manager}
              onChange={(e) =>
                setFormData({ ...formData, project_manager: e.target.value })
              }
              required
              fullWidth
            />

            <TextField
              label="Start-Datum"
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              required
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              label="End-Datum"
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              required
              InputLabelProps={{
                shrink: true,
              }}
            />

            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                value={formData.status}
                label="Status"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'active' | 'archived',
                  })
                }
              >
                {PROJECT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status === 'active' ? 'Aktiv' : 'Archiviert'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Dokumentation Link"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleAddLink}
                      edge="end"
                      disabled={!newLink}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.documentation_links.map((link, index) => (
                <Chip
                  key={index}
                  label={`Link ${index + 1}`}
                  onDelete={() => handleRemoveLink(link)}
                  component="a"
                  href={link}
                  target="_blank"
                  clickable
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button type="submit" variant="contained" color="primary">
            Speichern
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
