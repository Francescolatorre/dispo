import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useToast,
} from '@chakra-ui/react';
import Timeline from '../components/timeline/Timeline';
import { generateTestAssignments, testDates } from '../components/timeline/__tests__/test-utils';
import type { AssignmentWithRelations } from '../types/assignment';

const TimelineDemo: React.FC = () => {
  const toast = useToast();
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>(() =>
    generateTestAssignments({
      count: 5,
      startDate: testDates.startOfYear,
      durationDays: 30,
      employeeId: 1,
    })
  );

  const handleAssignmentUpdate = (assignment: AssignmentWithRelations) => {
    setAssignments(current =>
      current.map(a => (a.id === assignment.id ? assignment : a))
    );
    toast({
      title: 'Assignment Updated',
      description: `${assignment.project_name} updated`,
      status: 'success',
      duration: 2000,
    });
  };

  const handleAssignmentEdit = (assignment: AssignmentWithRelations) => {
    toast({
      title: 'Edit Assignment',
      description: `Editing ${assignment.project_name}`,
      status: 'info',
      duration: 2000,
    });
  };

  const handleAssignmentDelete = (assignmentId: number) => {
    setAssignments(current => current.filter(a => a.id !== assignmentId));
    toast({
      title: 'Assignment Deleted',
      description: 'Assignment has been removed',
      status: 'info',
      duration: 2000,
    });
  };

  const addSampleAssignments = () => {
    const newAssignments = generateTestAssignments({
      count: 3,
      startDate: new Date(),
      durationDays: 14,
      employeeId: assignments.length > 0 ? 2 : 1,
    });
    setAssignments(current => [...current, ...newAssignments]);
  };

  const clearAssignments = () => {
    setAssignments([]);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Timeline Demo
          </Heading>
          <Text color="gray.600" mb={4}>
            Interactive demonstration of the timeline component with sample data.
          </Text>
          <Box mb={4}>
            <Button
              colorScheme="blue"
              onClick={addSampleAssignments}
              mr={4}
            >
              Add Sample Assignments
            </Button>
            <Button
              variant="outline"
              onClick={clearAssignments}
            >
              Clear All
            </Button>
          </Box>
        </Box>

        <Box
          border="1px"
          borderColor="gray.200"
          borderRadius="md"
          height="600px"
          overflow="hidden"
        >
          <Timeline
            assignments={assignments}
            onAssignmentUpdate={handleAssignmentUpdate}
            onAssignmentEdit={handleAssignmentEdit}
            onAssignmentDelete={handleAssignmentDelete}
          />
        </Box>

        <Box>
          <Heading size="sm" mb={2}>
            Instructions
          </Heading>
          <VStack align="start" spacing={2} fontSize="sm">
            <Text>• Click "Add Sample Assignments" to add test data</Text>
            <Text>• Drag assignments to move them</Text>
            <Text>• Drag edges to resize</Text>
            <Text>• Double-click to edit</Text>
            <Text>• Right-click for more options</Text>
            <Text>• Use scale selector to change view</Text>
            <Text>• Navigate with arrow buttons or zoom controls</Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default TimelineDemo;