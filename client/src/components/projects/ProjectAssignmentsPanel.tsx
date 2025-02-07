import React from 'react';
import {
  Box,
  Button,
  Flex,
  useDisclosure,
} from '@chakra-ui/react';
import { useProject } from '../../contexts/ProjectContext';
import AssignmentForm from '../assignments/AssignmentForm';
import Timeline from '../timeline/Timeline';
import { assignmentService } from '../../services/assignmentService';
import type { AssignmentWithRelations } from '../../types/assignment';

const ProjectAssignmentsPanel: React.FC = () => {
  const { assignments, refreshData } = useProject();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAssignment, setSelectedAssignment] = React.useState<AssignmentWithRelations | null>(null);

  const handleCreateAssignment = () => {
    setSelectedAssignment(null);
    onOpen();
  };

  const handleEditAssignment = (assignment: AssignmentWithRelations) => {
    setSelectedAssignment(assignment);
    onOpen();
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      await assignmentService.deleteAssignment(assignmentId);
      refreshData();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const handleUpdateAssignment = async (assignment: AssignmentWithRelations) => {
    try {
      await assignmentService.updateAssignment(assignment.id, {
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        allocation_percentage: assignment.allocation_percentage,
      });
      refreshData();
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedAssignment) {
        await assignmentService.updateAssignment(selectedAssignment.id, data);
      } else {
        await assignmentService.createAssignment(data);
      }
      refreshData();
      onClose();
    } catch (error) {
      console.error('Failed to save assignment:', error);
    }
  };

  return (
    <Box>
      <Flex justifyContent="flex-end" mb={4}>
        <Button colorScheme="blue" onClick={handleCreateAssignment}>
          Add Assignment
        </Button>
      </Flex>

      <Box height="600px" border="1px" borderColor="gray.200" borderRadius="md">
        <Timeline
          assignments={assignments}
          onAssignmentUpdate={handleUpdateAssignment}
          onAssignmentEdit={handleEditAssignment}
          onAssignmentDelete={handleDeleteAssignment}
        />
      </Box>

      {isOpen && (
        <AssignmentForm
          initialData={selectedAssignment || undefined}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      )}
    </Box>
  );
};

export default ProjectAssignmentsPanel;