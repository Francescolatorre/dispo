import { Box, Button, CloseButton, Flex, Text } from '@chakra-ui/react';

export type Tone = 'success' | 'warning' | 'error' | 'info';

const TONE_COLOR: Record<Tone, string> = { success: 'green.500', warning: 'red.500', error: 'red.500', info: 'blue.500' };

export interface ActionToastProps {
  title: string;
  messages: readonly string[];
  tone: Tone;
  onUndo?: () => void;
  onClose: () => void;
}

/** Toast body with an optional "Rückgängig" action. */
export function ActionToast({ title, messages, tone, onUndo, onClose }: ActionToastProps) {
  return (
    <Box
      data-testid="action-toast"
      data-tone={tone}
      bg="white"
      color="gray.800"
      borderRadius="md"
      borderLeftWidth="4px"
      borderLeftColor={TONE_COLOR[tone]}
      boxShadow="lg"
      px={4}
      py={3}
      minW="300px"
      maxW="420px"
    >
      <Flex align="flex-start" gap={3}>
        <Box flex={1} minW={0}>
          <Text fontWeight="semibold" fontSize="sm">
            {title}
          </Text>
          {messages.map((m) => (
            <Text key={m} fontSize="sm" color={tone === 'warning' || tone === 'error' ? 'red.700' : 'gray.600'} mt={0.5}>
              {m}
            </Text>
          ))}
        </Box>
        {onUndo && (
          <Button size="sm" variant="outline" colorScheme="blue" onClick={onUndo}>
            Rückgängig
          </Button>
        )}
        <CloseButton size="sm" aria-label="Hinweis schließen" onClick={onClose} />
      </Flex>
    </Box>
  );
}

