/** Small building blocks shared by the Personen and Projekte pages. */
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import type { ValidationIssue } from '../../domain/validation';
import { describeIssue } from './format';
import { WarningIcon } from './icons';

export function PageHeader({ title, subtitle, meta, action }: { title: string; subtitle: string; meta?: ReactNode; action?: ReactNode }) {
  return (
    <Flex align="center" gap={3} wrap="wrap" mb={5}>
      <Flex align="baseline" gap={3} wrap="wrap">
        <Heading as="h1" size="lg" color="gray.900">
          {title}
        </Heading>
        <Text color="gray.500" fontSize="sm">
          {subtitle}
        </Text>
      </Flex>
      <HStack spacing={4} ml="auto">
        {meta}
        {action}
      </HStack>
    </Flex>
  );
}

export function ListSkeleton({ label }: { label: string }) {
  return (
    <Stack spacing={2} aria-busy="true" aria-label={label} data-testid="list-loading">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} h="52px" borderRadius="md" startColor="gray.100" endColor="gray.200" />
      ))}
    </Stack>
  );
}

export function LoadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Alert status="error" borderRadius="lg" data-testid="list-error">
      <AlertIcon />
      <AlertDescription flex={1}>Daten konnten nicht geladen werden: {error.message}</AlertDescription>
      <Button size="sm" colorScheme="red" variant="outline" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </Alert>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Flex direction="column" align="center" textAlign="center" py={14} px={6} data-testid="empty-state">
      <Text fontWeight="semibold" color="gray.800">
        {title}
      </Text>
      <Text fontSize="sm" color="gray.500" mt={1} mb={action ? 4 : 0}>
        {text}
      </Text>
      {action}
    </Flex>
  );
}

/** Live validation feedback in drawers: blocking errors (red) and non-blocking warnings (amber). */
export function IssueList({ errors, warnings }: { errors: ValidationIssue[]; warnings: ValidationIssue[] }) {
  if (errors.length === 0 && warnings.length === 0) return null;
  return (
    <Stack spacing={2} aria-live="polite" data-testid="issue-list">
      {errors.map((issue, i) => (
        <Alert key={`e${i}`} status="error" variant="left-accent" borderRadius="md" py={2} fontSize="sm">
          <AlertIcon boxSize={4} />
          <AlertDescription>{describeIssue(issue)}</AlertDescription>
        </Alert>
      ))}
      {warnings.map((issue, i) => (
        <HStack
          key={`w${i}`}
          role="status"
          data-testid="dry-run-warning"
          align="flex-start"
          spacing={2}
          bg="orange.50"
          borderLeftWidth="3px"
          borderLeftColor="orange.400"
          borderRadius="md"
          px={3}
          py={2}
        >
          <WarningIcon boxSize={4} color="orange.600" mt="2px" />
          <Text fontSize="sm" color="orange.900">
            {describeIssue(issue)}
          </Text>
        </HStack>
      ))}
    </Stack>
  );
}

/** Inline "really delete?" panel inside a drawer; focuses the safe choice when shown. */
export function DeleteConfirm({
  title,
  text,
  onCancel,
  onConfirm,
  isLoading,
}: {
  title: string;
  text: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), []);
  return (
    <Box role="alertdialog" aria-label={title} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="md" p={3} w="full">
      <Text fontWeight="semibold" fontSize="sm" color="gray.900">
        {title}
      </Text>
      <Text fontSize="sm" color="gray.700" mt={1}>
        {text}
      </Text>
      <HStack mt={3} justify="flex-end">
        <Button ref={cancelRef} size="sm" variant="ghost" colorScheme="gray" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button size="sm" colorScheme="red" onClick={onConfirm} isLoading={isLoading}>
          Endgültig löschen
        </Button>
      </HStack>
    </Box>
  );
}
