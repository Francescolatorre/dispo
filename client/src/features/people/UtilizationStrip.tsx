import { Box, HStack } from '@chakra-ui/react';
import type { WeekLoad, WorkloadStatus } from '../../domain/workload';
import { formatWeekKey } from '../shared/format';

const STATUS_WORD: Record<WorkloadStatus, string> = {
  free: 'frei',
  luft: 'mit Luft',
  ok: 'im Rahmen',
  full: 'voll',
  over: 'überbucht',
};

function percent(l: WeekLoad): string {
  return Number.isFinite(l.utilization) ? `${Math.round(l.utilization)} %` : '∞ %';
}

/**
 * Mini heat cells (16 × 16) for the next weeks — the same `load.*` language as the board:
 * green "frei", light green "Luft", neutral, grey "voll", red with "!" for overbooked.
 */
export function UtilizationStrip({ loads, name }: { loads: WeekLoad[]; name: string }) {
  const label = `${name}, Auslastung: ${loads.map((l) => `${formatWeekKey(l.weekKey)} ${percent(l)}`).join(', ')}`;
  return (
    <HStack display="inline-flex" role="img" aria-label={label} spacing="2px" data-testid="utilization-strip">
      {loads.map((l) => (
        <Box
          key={l.weekKey}
          boxSize="16px"
          borderRadius="3px"
          bg={`load.${l.status}.bg`}
          borderWidth="1px"
          borderColor={l.status === 'ok' ? 'gray.200' : `load.${l.status}.strong`}
          color={`load.${l.status}.fg`}
          fontSize="10px"
          fontWeight={700}
          lineHeight="14px"
          textAlign="center"
          title={`${formatWeekKey(l.weekKey)}: ${percent(l)} (${STATUS_WORD[l.status]})`}
          data-status={l.status}
        >
          {l.status === 'over' ? '!' : null}
        </Box>
      ))}
    </HStack>
  );
}
