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
import { Employee } from '../../types/employee';
import { SENIORITY_LEVELS, LEVEL_CODES, SeniorityLevel, getLevelCode } from '../../constants/employeeLevels';

type NewEmployee = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;

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
    employee_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    position: '',
    seniority_level: 'Junior',
    level_code: LEVEL_CODES.Junior,
    qualifications: [],
    work_time_factor: 100, // Represents 100%
    contract_end_date: undefined,
    status: 'active',
    part_time_factor: 100
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];
    
    if (!formData.name || formData.name.trim().length < 2) {
      validationErrors.push('Name muss mindestens 2 Zeichen lang sein');
    }

    if (!formData.seniority_level || !SENIORITY_LEVELS.includes(formData.seniority_level)) {
      validationErrors.push('Ungültige Seniorität');
    }

    if (!formData.qualifications || formData.qualifications.length === 0) {
      validationErrors.push('Mindestens eine Qualifikation ist erforderlich');
    }

    if (typeof formData.work_time_factor !== 'number' ||
        formData.work_time_factor < 0 ||
        formData.work_time_factor > 100) {
      validationErrors.push('Arbeitszeitfaktor muss zwischen 0 und 100 liegen');
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
        ...employee,
        entry_date: employee.entry_date || new Date().toISOString().split('T')[0],
        part_time_factor: employee.part_time_factor || 100,
      });
    } else {
      setFormData({
        name: '',
        employee_number: '',
        entry_date: new Date().toISOString().split('T')[0],
        email: '',
        phone: '',
        position: '',
        seniority_level: 'Junior',
        level_code: LEVEL_CODES.Junior,
        qualifications: [],
        work_time_factor: 100,
        contract_end_date: undefined,
        status: 'active',
        part_time_factor: 100
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Personalnummer"
              value={formData.employee_number}
              onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Eintrittsdatum"
              type="date"
              value={formData.entry_date}
              onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="E-Mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Telefonnummer"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />

            <TextField
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
                onChange={(e) => {
                  const seniorityLevel = e.target.value as SeniorityLevel;
                  setFormData({
                    ...formData,
                    seniority_level: seniorityLevel,
                    level_code: getLevelCode(seniorityLevel),
                  });
                }}
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
              label="Arbeitszeitfaktor (%)"
              type="number"
              value={formData.work_time_factor}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setFormData({
                  ...formData,
                  work_time_factor: value,
                });
              }}
              required
              inputProps={{
                min: 0,
                max: 100,
                step: 1,
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
                  contract_end_date: e.target.value || undefined,
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
