import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { assignmentService } from '../../services/assignmentService';
import type { AssignmentValidationDto } from '../../types/assignment';

interface AssignmentFormProps {
  projectId: number;
  onSubmit: (data: AssignmentValidationDto) => void;
  onCancel: () => void;
  initialData?: AssignmentValidationDto;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  projectId,
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState<AssignmentValidationDto>({
    projectId,
    employeeId: initialData?.employeeId || undefined,
    role: initialData?.role || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    allocationPercentage: initialData?.allocationPercentage || 100,
    status: initialData?.status || 'active',
    drStatus: initialData?.drStatus || '',
    positionStatus: initialData?.positionStatus || '',
  });

  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: { [key: string]: string[] };
    warning?: boolean;
    message?: string;
  } | null>(null);

  const toast = useToast();

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = async () => {
    try {
      const result = await assignmentService.validateAssignment(formData);
      setValidationResult(result);
    } catch (error) {
      toast({
        title: 'Validation Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationResult?.isValid) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Stack spacing={4}>
        {validationResult?.warning && (
          <Alert status="warning">
            <AlertIcon />
            {validationResult.message}
          </Alert>
        )}

        <FormControl>
          <FormLabel>Employee ID</FormLabel>
          <Input
            name="employeeId"
            type="number"
            value={formData.employeeId || ''}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Role</FormLabel>
          <Input
            name="role"
            value={formData.role}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Start Date</FormLabel>
          <Input
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>End Date</FormLabel>
          <Input
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Allocation Percentage</FormLabel>
          <Input
            name="allocationPercentage"
            type="number"
            min={0}
            max={100}
            value={formData.allocationPercentage}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Status</FormLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>DR Status</FormLabel>
          <Input
            name="drStatus"
            value={formData.drStatus}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Position Status</FormLabel>
          <Input
            name="positionStatus"
            value={formData.positionStatus}
            onChange={handleChange}
          />
        </FormControl>

        <Stack direction="row" spacing={4} justify="flex-end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="submit"
            colorScheme="blue"
            isDisabled={!validationResult?.isValid}
          >
            Submit
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AssignmentForm;