import { Box, HStack } from '@chakra-ui/react';
import type { WeekLoad, WorkloadStatus } from '../../domain/workload';
import { formatWeekKey } from '../shared/format';

const HEIGHT = 24;
/** Bars are scaled to 125 % so overbooking sticks out above the 100 % line. */
const SCALE_MAX = 125;

const BAR_COLOR: Record<WorkloadStatus, string> = {
  free: 'load.free.strong',
  luft: 'load.luft.strong',
  ok: 'gray.300',
  full: 'gray.500',
  over: 'load.over.strong',
};

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

/** Mini bar chart of utilization (relative to capacity) for the next weeks. */
export function UtilizationStrip({ loads, name }: { loads: WeekLoad[]; name: string }) {
  const label = `${name}, Auslastung: ${loads.map((l) => `${formatWeekKey(l.weekKey)} ${percent(l)}`).join(', ')}`;
  const lineBottom = (100 / SCALE_MAX) * HEIGHT;
  return (
    <HStack display="inline-flex" role="img" aria-label={label} spacing="3px" align="flex-end" h={`${HEIGHT}px`} position="relative" data-testid="utilization-strip">
      <Box
        position="absolute"
        left={0}
        right={0}
        bottom={`${lineBottom}px`}
        borderTopWidth="1px"
        borderTopStyle="dashed"
        borderTopColor="gray.300"
        aria-hidden
      />
      {loads.map((l) => {
        const util = Number.isFinite(l.utilization) ? l.utilization : SCALE_MAX;
        const h = l.status === 'free' ? 3 : Math.max(3, (Math.min(util, SCALE_MAX) / SCALE_MAX) * HEIGHT);
        return (
          <Box
            key={l.weekKey}
            w="10px"
            h={`${h}px`}
            bg={BAR_COLOR[l.status]}
            borderRadius="2px"
            title={`${formatWeekKey(l.weekKey)}: ${percent(l)} (${STATUS_WORD[l.status]})`}
            data-status={l.status}
          />
        );
      })}
    </HStack>
  );
}
