import React, { useState, useEffect } from 'react';
import {
  Requirement,
  NewRequirement,
  RequirementPriority
} from '../../types/requirement';
import requirementService from '../../services/requirementService';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Alert,
  Paper,
  Typography,
  Grid,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';

interface RequirementFormProps {
  projectId: number;
  requirement?: Requirement;
  onSubmit: (requirement: NewRequirement) => Promise<void>;
  onCancel: () => void;
}

const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'];
const PRIORITIES: RequirementPriority[] = ['low', 'medium', 'high', 'critical'];

const RequirementForm: React.FC<RequirementFormProps> = ({
  projectId,
  requirement,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<NewRequirement>({
    project_id: projectId,
    role: '',
    seniority_level: 'Mid',
    required_qualifications: [],
    start_date: '',
    end_date: '',
    priority: 'medium',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availableQualifications, setAvailableQualifications] = useState<string[]>([]);

  // Load existing requirement data if editing
  useEffect(() => {
    if (requirement) {
      setFormData({
        project_id: requirement.project_id,
        role: requirement.role,
        seniority_level: requirement.seniority_level,
        required_qualifications: requirement.required_qualifications,
        start_date: requirement.start_date,
        end_date: requirement.end_date,
        priority: requirement.priority,
        notes: requirement.notes || ''
      });
    }
  }, [requirement]);

  // Load available qualifications (could come from a service)
  useEffect(() => {
    // Mock data - replace with actual service call
    setAvailableQualifications([
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'Python',
      'Java',
      'SQL',
      'AWS',
      'Docker',
      'Kubernetes'
    ]);
  }, []);

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setValidationError(null);

    try {
      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      // Validate with backend
      const validation = await requirementService.validateRequirement(formData);
      if (!validation.valid) {
        setValidationError(validation.errors.join(', '));
        return;
      }

      await onSubmit(formData);
    } catch (error) {
      setValidationError('Failed to save requirement');
      console.error('Error saving requirement:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof NewRequirement,
    value: string | string[] | null
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDateChange = (field: 'start_date' | 'end_date', date: Dayjs | null) => {
    handleChange(field, date ? date.format('YYYY-MM-DD') : null);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {requirement ? 'Edit Requirement' : 'New Requirement'}
      </Typography>

      {validationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              error={!!errors.role}
              helperText={errors.role}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Seniority Level</InputLabel>
              <Select
                value={formData.seniority_level}
                onChange={(e) => handleChange('seniority_level', e.target.value)}
              >
                {SENIORITY_LEVELS.map(level => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                {PRIORITIES.map(priority => (
                  <MenuItem key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Start Date"
              value={formData.start_date ? dayjs(formData.start_date) : null}
              onChange={(date: Dayjs | null) => handleDateChange('start_date', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.start_date,
                  helperText: errors.start_date
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="End Date"
              value={formData.end_date ? dayjs(formData.end_date) : null}
              onChange={(date: Dayjs | null) => handleDateChange('end_date', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.end_date,
                  helperText: errors.end_date
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={availableQualifications}
              value={formData.required_qualifications}
              onChange={(_, newValue) => handleChange('required_qualifications', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Required Qualifications"
                  placeholder="Add qualifications"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : requirement ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default RequirementForm;