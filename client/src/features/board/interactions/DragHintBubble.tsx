import { Box, HStack, Portal, Text } from '@chakra-ui/react';
import { AlertIcon } from '../icons';
import type { DragHint } from './dragMath';

const OFFSET = 12;

/** Ink chip next to the pointer while dragging; overbooking is flagged with ⚠ in the "over" tint (no red fill). */
export function DragHintBubble({ hint, clientX, clientY }: { hint: DragHint; clientX: number; clientY: number }) {
  return (
    <Portal>
      <Box
        role="status"
        aria-live="polite"
        data-testid="drag-hint"
        data-over={hint.over || undefined}
        position="fixed"
        left={`${clientX + OFFSET}px`}
        top={`${clientY + OFFSET}px`}
        zIndex="tooltip"
        pointerEvents="none"
        px={2.5}
        py={1.5}
        borderRadius="md"
        boxShadow="md"
        fontSize="xs"
        fontWeight={500}
        whiteSpace="nowrap"
        bg="gray.900"
        color="white"
      >
        <Text as="span">{hint.text}</Text>
        {hint.over && (
          <HStack spacing={1} color="load.over.bg" mt={0.5}>
            <AlertIcon boxSize="12px" />
            <Text as="span" fontWeight={600}>
              überbucht
            </Text>
          </HStack>
        )}
      </Box>
    </Portal>
  );
}
