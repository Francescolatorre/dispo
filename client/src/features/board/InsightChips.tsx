import type { ReactNode } from 'react';
import { Box, Text, Tooltip } from '@chakra-ui/react';
import { formatDayMonth, INSIGHT_WEEKS, MIN_FREE_PERCENT, type Insights } from './boardModel';
import { AlertIcon } from './icons';

interface ChipProps {
  tone: 'over' | 'free';
  count: number;
  label: string;
  ariaLabel: string;
  hint: string;
  pressed: boolean;
  onClick: () => void;
  icon: ReactNode;
}

/** 28 px filter chip with a count; pressed = workload tint + strong border. */
const Chip = ({ tone, count, label, ariaLabel, hint, pressed, onClick, icon }: ChipProps) => (
  <Tooltip label={hint} openDelay={400}>
    <Box
      as="button"
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      h="28px"
      px={2.5}
      fontSize="xs"
      fontWeight={500}
      whiteSpace="nowrap"
      borderRadius="md"
      borderWidth="1px"
      bg={pressed ? `load.${tone}.bg` : 'white'}
      borderColor={pressed ? `load.${tone}.strong` : 'gray.200'}
      color={pressed ? `load.${tone}.fg` : count === 0 ? 'gray.500' : 'gray.800'}
      boxShadow={pressed ? undefined : 'xs'}
      transition="background 150ms, border-color 150ms"
      _hover={{ bg: pressed ? `load.${tone}.bg` : 'gray.50' }}
      _focusVisible={{ boxShadow: 'outline' }}
    >
      {icon}
      <Text as="span" fontFamily="mono" fontWeight={600}>
        {count}
      </Text>{' '}
      <Text as="span">{label}</Text>
    </Box>
  </Tooltip>
);

export interface InsightChipsProps {
  insights: Insights;
  onlyOverbooked: boolean;
  onlyFree: boolean;
  onToggleOverbooked: () => void;
  onToggleFree: () => void;
}

/** The two exception filters of the toolbar: "⚠ 2 überbucht" and "● 7 mit Luft". */
export function InsightChips({ insights, onlyOverbooked, onlyFree, onToggleOverbooked, onToggleFree }: InsightChipsProps) {
  const horizon = `${formatDayMonth(insights.from)}–${formatDayMonth(insights.to)}`;
  const overWeeks = insights.overbookedPersonWeeks;
  const overPeople = insights.overbookedEmployeeIds.size;
  const freePeople = insights.freeEmployeeIds.size;
  const overText = `${overWeeks} ${overWeeks === 1 ? 'überbuchte Personenwoche' : 'überbuchte Personenwochen'}`;
  const overHint = `${overText} · ${overPeople} ${overPeople === 1 ? 'Person' : 'Personen'} · nächste ${INSIGHT_WEEKS} Wochen (${horizon})`;
  const freeHint = `≥ ${MIN_FREE_PERCENT} % frei in jeder der nächsten ${INSIGHT_WEEKS} Wochen (${horizon})`;
  return (
    <>
      <Chip
        tone="over"
        count={overWeeks}
        label="überbucht"
        ariaLabel={overHint}
        hint={overHint}
        pressed={onlyOverbooked}
        onClick={onToggleOverbooked}
        icon={<AlertIcon boxSize="12px" color={overWeeks === 0 ? 'gray.400' : 'load.over.strong'} />}
      />
      <Chip
        tone="free"
        count={freePeople}
        label="mit Luft"
        ariaLabel={`${freePeople} ${freePeople === 1 ? 'Person' : 'Personen'} mit Luft: ${freeHint}`}
        hint={freeHint}
        pressed={onlyFree}
        onClick={onToggleFree}
        icon={<Box as="span" boxSize="8px" borderRadius="full" bg={freePeople === 0 ? 'gray.400' : 'load.free.strong'} />}
      />
    </>
  );
}
