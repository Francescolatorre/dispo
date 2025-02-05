import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Box,
} from '@mui/material';
import { Employee, SENIORITY_LEVELS, LEVEL_CODES, NewEmployee } from '../../types/employee';

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
    level_code: LEVEL_CODES.Junior,
    qualifications: [],
    work_time_factor: 1.0,
    contract_end_date: null,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];
    
    if (!formData.name || formData.name.trim().length < 2) {
      validationErrors.push('Name muss mindestens 2 Zeichen lang sein');
    }

    if (!formData.qualifications || formData.qualifications.length === 0) {
      validationErrors.push('Mindestens eine Qualifikation ist erforderlich');
    }

    if (typeof formData.work_time_factor !== 'number' || 
        formData.work_time_factor < 0.1 || 
        formData.work_time_factor > 1.0) {
      validationErrors.push('Arbeitszeitfaktor muss zwischen 0 und 1 liegen');
    }

    if (formData.contract_end_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.contract_end_date)) {
        validationErrors.push('Vertragsende muss im Format JJJJ-MM-TT sein');
      }
    }

    return validationErrors;
  };

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        seniority_level: employee.seniority_level,
        level_code: employee.level_code,
        qualifications: employee.qualifications,
        work_time_factor: employee.work_time_factor,
        contract_end_date: employee.contract_end_date,
      });
    } else {
      setFormData({
        name: '',
        seniority_level: 'Junior',
        level_code: LEVEL_CODES.Junior,
        qualifications: [],
        work_time_factor: 1.0,
        contract_end_date: null,
      });
    }
    setErrors([]);
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setErrors([error.message]);
      } else {
        setErrors(['Ein unerwarteter Fehler ist aufgetreten']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {employee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
        </DialogTitle>
        <DialogContent>
          {errors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error">
                {errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </Alert>
            </Box>
          )}
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
                    level_code: LEVEL_CODES[e.target.value as keyof typeof LEVEL_CODES],
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
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({
                  ...formData,
                  work_time_factor: value,
                });
              }}
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
          <Button onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            Speichern
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
