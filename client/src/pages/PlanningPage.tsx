import { Alert, AlertIcon, Heading, HStack, Spinner, Text } from '@chakra-ui/react';
import { usePlanning } from '../state';

export const PlanningPage = () => {
  const { employees, projects, assignments, loading, error } = usePlanning();

  return (
    <>
      <Heading as="h1" size="lg" mb={2}>
        Planung
      </Heading>
      <Text color="gray.600" mb={4}>
        Das Planungsboard (Personen × Kalenderwochen) entsteht hier.
      </Text>
      {error ? (
        <Alert status="error">
          <AlertIcon />
          Daten konnten nicht geladen werden: {error.message}
        </Alert>
      ) : loading ? (
        <HStack>
          <Spinner size="sm" />
          <Text>Lade Planungsdaten…</Text>
        </HStack>
      ) : (
        <Text data-testid="planning-summary">
          {employees.length} Personen · {projects.length} Projekte · {assignments.length} Einsätze
        </Text>
      )}
    </>
  );
};
