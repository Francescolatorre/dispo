import type { ReactNode } from 'react';
import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { formatDayMonth, INSIGHT_WEEKS, MIN_FREE_PERCENT, type Insights } from './boardModel';
import { AlertIcon } from './icons';

interface InsightButtonProps {
  tone: 'over' | 'free';
  value: number;
  title: string;
  hint: string;
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
}

const InsightButton = ({ tone, value, title, hint, active, onClick, icon }: InsightButtonProps) => {
  const accent = tone === 'over' ? 'red' : 'green';
  const muted = value === 0;
  return (
    <Box
      as="button"
      type="button"
      aria-pressed={active}
      onClick={onClick}
      textAlign="left"
      display="flex"
      alignItems="center"
      gap={3}
      px={4}
      py={2.5}
      bg={active ? `${accent}.50` : 'white'}
      borderWidth="1px"
      borderColor={active ? `${accent}.300` : 'gray.200'}
      borderRadius="lg"
      transition="border-color 120ms, background 120ms"
      _hover={{ borderColor: `${accent}.300` }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'blue.500', outlineOffset: '2px' }}
    >
      <HStack spacing={1.5} color={muted ? 'gray.400' : `${accent}.600`}>
        {icon}
        <Text as="span" fontSize="2xl" fontWeight="bold" lineHeight="1" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Text>
      </HStack>
      <Box>
        <Text fontSize="sm" fontWeight="semibold" color="gray.800" lineHeight="short">
          {title}
        </Text>
        <Text fontSize="xs" color="gray.500" lineHeight="short">
          {active ? 'Filter aktiv – erneut klicken zum Aufheben' : hint}
        </Text>
      </Box>
    </Box>
  );
};

const LegendItem = ({ swatch, label, children }: { swatch: string; label: string; children?: ReactNode }) => (
  <HStack spacing={1.5}>
    <Box boxSize="12px" borderRadius="sm" bg={swatch} borderWidth="1px" borderColor="blackAlpha.100" display="grid" placeItems="center">
      {children}
    </Box>
    <Text fontSize="xs" color="gray.600" whiteSpace="nowrap">
      {label}
    </Text>
  </HStack>
);

export interface BoardInsightsProps {
  insights: Insights;
  onlyOverbooked: boolean;
  onlyFree: boolean;
  onToggleOverbooked: () => void;
  onToggleFree: () => void;
}

export function BoardInsights({ insights, onlyOverbooked, onlyFree, onToggleOverbooked, onToggleFree }: BoardInsightsProps) {
  const horizon = `${formatDayMonth(insights.from)}–${formatDayMonth(insights.to)}`;
  const overPeople = insights.overbookedEmployeeIds.size;
  const freePeople = insights.freeEmployeeIds.size;
  return (
    <Flex gap={3} align="stretch" wrap="wrap" as="section" aria-label={`Hinweise für die nächsten ${INSIGHT_WEEKS} Wochen`}>
      <InsightButton
        tone="over"
        value={insights.overbookedPersonWeeks}
        icon={insights.overbookedPersonWeeks > 0 ? <AlertIcon boxSize={4} /> : undefined}
        title={insights.overbookedPersonWeeks === 1 ? 'überbuchte Personenwoche' : 'überbuchte Personenwochen'}
        hint={`${overPeople} ${overPeople === 1 ? 'Person' : 'Personen'} · nächste ${INSIGHT_WEEKS} Wochen (${horizon})`}
        active={onlyOverbooked}
        onClick={onToggleOverbooked}
      />
      <InsightButton
        tone="free"
        value={freePeople}
        title={freePeople === 1 ? 'Person mit freier Kapazität' : 'Personen mit freier Kapazität'}
        hint={`≥ ${MIN_FREE_PERCENT} % frei in jeder der nächsten ${INSIGHT_WEEKS} Wochen`}
        active={onlyFree}
        onClick={onToggleFree}
      />
      <Flex
        as="figure"
        aria-label="Legende"
        m={0}
        ml={{ base: 0, xl: 'auto' }}
        align="center"
        gap={4}
        wrap="wrap"
        px={1}
      >
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
          Auslastung
        </Text>
        <LegendItem swatch="load.free.bg" label="frei" />
        <LegendItem swatch="load.luft.bg" label="bis 50 %" />
        <LegendItem swatch="load.ok.bg" label="bis 99 %" />
        <LegendItem swatch="load.full.bg" label="100 % – voll" />
        <LegendItem swatch="load.over.bg" label="über 100 % – überbucht">
          <AlertIcon boxSize="8px" color="red.700" />
        </LegendItem>
        <HStack spacing={1.5}>
          <Box w="2px" h="14px" bg="board.today" borderRadius="full" />
          <Text fontSize="xs" color="gray.600">
            Heute
          </Text>
        </HStack>
      </Flex>
    </Flex>
  );
}
