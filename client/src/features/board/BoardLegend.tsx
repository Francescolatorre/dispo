import type { ReactNode } from 'react';
import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import type { WorkloadStatus } from '../../domain/workload';
import { AlertIcon } from './icons';

const Swatch = ({ status, children }: { status: WorkloadStatus; children?: ReactNode }) => (
  <Box
    boxSize="12px"
    borderRadius="3px"
    bg={`load.${status}.bg`}
    borderWidth="1px"
    borderColor={status === 'ok' ? 'gray.300' : `load.${status}.strong`}
    display="grid"
    placeItems="center"
    flexShrink={0}
  >
    {children}
  </Box>
);

const Item = ({ status, label, children }: { status: WorkloadStatus; label: string; children?: ReactNode }) => (
  <HStack spacing={1.5}>
    <Swatch status={status}>{children}</Swatch>
    <Text fontSize="2xs" color="gray.600" whiteSpace="nowrap">
      {label}
    </Text>
  </HStack>
);

export interface BoardLegendProps {
  visibleCount: number;
  totalCount: number;
  hiddenInactive: number;
}

/** Board footer: workload legend (left) and the person count (right). */
export function BoardLegend({ visibleCount, totalCount, hiddenInactive }: BoardLegendProps) {
  return (
    <>
      <Flex as="figure" aria-label="Legende: Auslastung in Prozent" m={0} align="center" gap={3.5}>
        <Text fontSize="2xs" fontWeight={600} color="gray.500" whiteSpace="nowrap">
          Auslastung in %
        </Text>
        <Item status="free" label="frei" />
        <Item status="luft" label="≤ 50 · Luft" />
        <Item status="ok" label="51–99" />
        <Item status="full" label="100 · voll" />
        <Item status="over" label="> 100 · überbucht">
          <AlertIcon boxSize="8px" color="load.over.fg" />
        </Item>
        <HStack spacing={1.5}>
          <Box w="1px" h="12px" bg="board.today" />
          <Text fontSize="2xs" color="gray.600">
            Heute
          </Text>
        </HStack>
      </Flex>
      <Text ml="auto" fontSize="2xs" color="gray.500" whiteSpace="nowrap" data-testid="row-count" aria-live="polite">
        <Text as="span" fontFamily="mono">
          {visibleCount}
        </Text>{' '}
        von{' '}
        <Text as="span" fontFamily="mono">
          {totalCount}
        </Text>{' '}
        Personen{hiddenInactive > 0 ? ` · ${hiddenInactive} inaktiv ausgeblendet` : ''}
      </Text>
    </>
  );
}
