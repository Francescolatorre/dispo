/** Small building blocks shared by the Personen and Projekte pages. */
import { useEffect, useRef, type ReactNode } from 'react';
import { Box, Button, Flex, HStack, Heading, Skeleton, Stack, Text, type BoxProps } from '@chakra-ui/react';
import type { ValidationIssue } from '../../domain/validation';
import { describeIssue } from './format';
import { WarningIcon } from './icons';

/** 40 px page header: H1, a quiet meta line and the one primary action. */
export function PageHeader({ title, subtitle, meta, action }: { title: string; subtitle?: ReactNode; meta?: ReactNode; action?: ReactNode }) {
  return (
    <Flex as="header" align="center" gap={3} wrap="wrap" minH="40px" mb={3}>
      <Heading as="h1" size="lg">
        {title}
      </Heading>
      {subtitle && (
        <Text color="gray.500" fontSize="sm">
          {subtitle}
        </Text>
      )}
      <HStack spacing={4} ml="auto">
        {meta}
        {action}
      </HStack>
    </Flex>
  );
}

/** White content frame (radius lg, hairline, small shadow) used for tables and the board. */
export function Frame(props: BoxProps) {
  return <Box bg="white" borderWidth="1px" borderColor="line" borderRadius="lg" boxShadow="sm" overflow="hidden" {...props} />;
}

/** Neutral avatar with initials (never coloured: colour is reserved for workload and projects). */
export function Avatar({ name, muted }: { name: string; muted?: boolean }) {
  const parts = name.split(/[\s-]+/).filter(Boolean);
  const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
  return (
    <Flex
      aria-hidden
      flexShrink={0}
      boxSize="28px"
      borderRadius="full"
      bg="gray.100"
      color={muted ? 'gray.400' : 'gray.700'}
      fontSize="2xs"
      fontWeight={600}
      align="center"
      justify="center"
    >
      {initials}
    </Flex>
  );
}

export function ListSkeleton({ label }: { label: string }) {
  return (
    <Frame aria-busy="true" aria-label={label} data-testid="list-loading">
      <Box h="32px" bg="gray.50" borderBottomWidth="1px" borderColor="line" />
      <Stack spacing={0}>
        {Array.from({ length: 8 }, (_, i) => (
          <HStack key={i} h="48px" px={4} spacing={3} borderBottomWidth="1px" borderColor="line">
            <Skeleton boxSize="28px" borderRadius="full" startColor="gray.100" endColor="gray.200" />
            <Skeleton h="10px" w={`${120 + ((i * 37) % 80)}px`} borderRadius="sm" startColor="gray.100" endColor="gray.200" />
          </HStack>
        ))}
      </Stack>
    </Frame>
  );
}

export function LoadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Frame data-testid="list-error" role="alert" display="flex" alignItems="center" gap={3} px={4} py={3}>
      <WarningIcon boxSize="16px" color="load.over.fg" />
      <Text flex={1} fontSize="sm" color="gray.800">
        Daten konnten nicht geladen werden: {error.message}
      </Text>
      <Button variant="outline" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </Frame>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Flex direction="column" align="center" textAlign="center" py={14} px={6} data-testid="empty-state">
      <Text fontSize="md" fontWeight={600} color="gray.900">
        {title}
      </Text>
      <Text fontSize="sm" color="gray.500" mt={1} mb={action ? 4 : 0}>
        {text}
      </Text>
      {action}
    </Flex>
  );
}

/**
 * Live validation feedback in drawers: blocking errors and non-blocking warnings.
 * No red or amber fills: errors are a red hairline + text, warnings a neutral panel; the
 * overbooking warning keeps the workload "over" colour on its icon.
 */
export function IssueList({ errors, warnings }: { errors: ValidationIssue[]; warnings: ValidationIssue[] }) {
  if (errors.length === 0 && warnings.length === 0) return null;
  return (
    <Stack spacing={2} aria-live="polite" data-testid="issue-list">
      {errors.map((issue, i) => (
        <HStack
          key={`e${i}`}
          role="alert"
          align="flex-start"
          spacing={2}
          borderWidth="1px"
          borderColor="load.over.strong"
          borderRadius="md"
          px={3}
          py={2}
        >
          <WarningIcon boxSize="16px" color="load.over.fg" mt="1px" />
          <Text fontSize="sm" color="load.over.fg">
            {describeIssue(issue)}
          </Text>
        </HStack>
      ))}
      {warnings.map((issue, i) => (
        <HStack
          key={`w${i}`}
          role="status"
          data-testid="dry-run-warning"
          align="flex-start"
          spacing={2}
          bg="gray.50"
          borderWidth="1px"
          borderColor="line"
          borderRadius="md"
          px={3}
          py={2}
        >
          <WarningIcon boxSize="16px" color={issue.code === 'OVERBOOKED' ? 'load.over.strong' : 'gray.600'} mt="1px" />
          <Text fontSize="sm" color="gray.800">
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
    <Box role="alertdialog" aria-label={title} bg="gray.50" borderWidth="1px" borderColor="line" borderRadius="md" p={3} w="full">
      <Text fontWeight={600} fontSize="sm" color="gray.900">
        {title}
      </Text>
      <Text fontSize="sm" color="gray.600" mt={1}>
        {text}
      </Text>
      <HStack mt={3} justify="flex-end">
        <Button ref={cancelRef} variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button variant="danger" borderWidth="1px" borderColor="load.over.strong" bg="white" onClick={onConfirm} isLoading={isLoading}>
          Endgültig löschen
        </Button>
      </HStack>
    </Box>
  );
}
