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
  Autocomplete,
  Box,
} from '@mui/material';
import { Employee, SENIORITY_LEVELS, NewEmployee } from '../../types/employee';

const COMMON_QUALIFICATIONS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'C#',
  '.NET',
  'SQL',
  'AWS',
  'Azure',
  'Docker',
  'Kubernetes',
];

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (employee: NewEmployee) => Promise<void>;
  employee?: Employee;
}

export const EmployeeForm = ({
  open,
  onClose,
  onSave,
  employee,
}: EmployeeFormProps) => {
  const [formData, setFormData] = useState<NewEmployee>({
    name: '',
    seniority_level: 'Junior',
    qualifications: [],
    work_time_factor: 1.0,
    contract_end_date: null,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        seniority_level: employee.seniority_level,
        qualifications: employee.qualifications,
        work_time_factor: employee.work_time_factor,
        contract_end_date: employee.contract_end_date,
      });
    } else {
      setFormData({
        name: '',
        seniority_level: 'Junior',
        qualifications: [],
        work_time_factor: 1.0,
        contract_end_date: null,
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {employee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
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

            <FormControl fullWidth required>
              <InputLabel id="seniority-label">Seniorität</InputLabel>
              <Select
                labelId="seniority-label"
                id="seniority"
                value={formData.seniority_level}
                label="Seniorität"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seniority_level: e.target.value,
                  })
                }
              >
                {SENIORITY_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              freeSolo
              options={COMMON_QUALIFICATIONS}
              value={formData.qualifications}
              onChange={(_, newValue) =>
                setFormData({
                  ...formData,
                  qualifications: newValue as string[],
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Qualifikationen"
                  placeholder="Neue Qualifikation eingeben"
                />
              )}
            />

            <TextField
              label="Arbeitszeitfaktor"
              type="number"
              value={formData.work_time_factor}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  work_time_factor: parseFloat(e.target.value),
                })
              }
              required
              inputProps={{
                min: 0.1,
                max: 1.0,
                step: 0.1,
              }}
            />

            <TextField
              label="Vertragsende"
              type="date"
              value={
                formData.contract_end_date
                  ? new Date(formData.contract_end_date)
                      .toISOString()
                      .split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contract_end_date: e.target.value || null,
                })
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
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
