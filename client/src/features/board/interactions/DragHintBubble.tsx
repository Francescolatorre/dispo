import { Box, HStack, Portal, Text } from '@chakra-ui/react';
import { AlertIcon } from '../icons';
import type { DragHint } from './dragMath';

const OFFSET = 16;

/** Compact floating hint next to the pointer while dragging. */
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
        boxShadow="lg"
        fontSize="xs"
        fontWeight="semibold"
        whiteSpace="nowrap"
        bg={hint.over ? 'red.600' : 'gray.800'}
        color="white"
      >
        <HStack spacing={1.5}>
          {hint.over && <AlertIcon boxSize="12px" />}
          <Text as="span">{hint.text}</Text>
          {hint.over && <Text as="span" fontWeight="bold">· überbucht</Text>}
        </HStack>
      </Box>
    </Portal>
  );
}
