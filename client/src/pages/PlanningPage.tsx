import { Flex, Heading, Text } from '@chakra-ui/react';
import { PlanningBoard } from '../features/board';
import { usePlanning } from '../state';

export const PlanningPage = () => {
  const { employees, projects, assignments, loading, error } = usePlanning();

  return (
    // Fills the viewport (main has 1.5rem padding top/bottom) so only the board scrolls.
    <Flex direction="column" h="calc(100vh - 3rem)" minH="560px" gap={4}>
      <Flex align="baseline" gap={3} wrap="wrap">
        <Heading as="h1" size="lg" color="gray.900">
          Planung
        </Heading>
        <Text color="gray.500" fontSize="sm">
          Wer hat wann Luft?
        </Text>
        {!loading && !error && (
          <Text data-testid="planning-summary" color="gray.400" fontSize="sm" ml="auto">
            {employees.length} Personen · {projects.length} Projekte · {assignments.length} Einsätze
          </Text>
        )}
      </Flex>
      <PlanningBoard />
    </Flex>
  );
};
