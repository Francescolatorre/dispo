import { Box, Button, CloseButton, Flex, HStack, Text } from '@chakra-ui/react';
import { AlertIcon } from '../icons';

export type Tone = 'success' | 'warning' | 'error' | 'info';

export interface ActionToastProps {
  title: string;
  messages: readonly string[];
  tone: Tone;
  onUndo?: () => void;
  onClose: () => void;
}

/**
 * Ink toast (bottom centre) with an optional "Rückgängig" action. Consequences such as
 * overbooking are listed with the ⚠ glyph in the light "over" tint — no red fills.
 */
export function ActionToast({ title, messages, tone, onUndo, onClose }: ActionToastProps) {
  const alarming = tone === 'warning' || tone === 'error';
  return (
    <Box
      data-testid="action-toast"
      data-tone={tone}
      bg="gray.900"
      color="white"
      borderRadius="lg"
      boxShadow="lg"
      pl={4}
      pr={2}
      py={2.5}
      minW="320px"
      maxW="480px"
    >
      <Flex align="center" gap={3}>
        <Box flex={1} minW={0}>
          <HStack spacing={2}>
            {tone === 'error' && <AlertIcon boxSize="14px" color="load.over.bg" />}
            <Text fontWeight={500} fontSize="sm">
              {title}
            </Text>
          </HStack>
          {messages.map((m) => (
            <HStack key={m} spacing={1.5} mt={0.5} align="flex-start">
              {alarming && <AlertIcon boxSize="12px" color="load.over.bg" mt="3px" flexShrink={0} />}
              <Text fontSize="xs" color={alarming ? 'load.over.bg' : 'gray.300'}>
                {m}
              </Text>
            </HStack>
          ))}
        </Box>
        {onUndo && (
          <Button
            variant="ghost"
            size="sm"
            color="accent.100"
            fontWeight={600}
            _hover={{ bg: 'whiteAlpha.200' }}
            _active={{ bg: 'whiteAlpha.300' }}
            onClick={onUndo}
            title="Strg+Z"
          >
            Rückgängig
          </Button>
        )}
        <CloseButton size="sm" color="gray.400" _hover={{ bg: 'whiteAlpha.200', color: 'white' }} aria-label="Hinweis schließen" onClick={onClose} />
      </Flex>
    </Box>
  );
}
