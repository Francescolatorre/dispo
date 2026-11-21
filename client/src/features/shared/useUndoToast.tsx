import { useCallback } from 'react';
import { Box, Button, CloseButton, HStack, Text, useToast } from '@chakra-ui/react';
import { usePlanning } from '../../state';

export interface UndoToastOptions {
  title: string;
  description?: string;
  /** History label of the action (e.g. `Person löschen`); undo only runs if it is still the latest entry. */
  undoLabel: string;
}

const UNDO_TOAST_MS = 8000;

/**
 * Returns `show(options)`: a toast with a "Rückgängig" button that reverts the latest
 * write through `actions.undo()`. Toasts render outside the planning context, so the
 * actions are captured here, not read inside the toast.
 */
export function useUndoToast() {
  const toast = useToast();
  const { actions } = usePlanning();

  return useCallback(
    ({ title, description, undoLabel }: UndoToastOptions) => {
      const undo = async () => {
        if (actions.undoLabel() !== undoLabel) {
          toast({ status: 'warning', title: 'Rückgängig nicht mehr möglich', description: 'Inzwischen wurde etwas anderes geändert.' });
          return;
        }
        const result = await actions.undo();
        if (!result.ok) {
          toast({ status: 'error', title: 'Rückgängig fehlgeschlagen', description: result.error });
        }
      };

      toast({
        duration: UNDO_TOAST_MS,
        position: 'bottom',
        render: ({ onClose }) => (
          <HStack
            data-testid="undo-toast"
            bg="gray.800"
            color="white"
            borderRadius="md"
            boxShadow="lg"
            px={4}
            py={3}
            spacing={4}
            align="center"
          >
            <Box flex={1} minW={0}>
              <Text fontWeight="semibold" fontSize="sm">
                {title}
              </Text>
              {description && (
                <Text fontSize="xs" color="gray.300">
                  {description}
                </Text>
              )}
            </Box>
            <Button
              size="sm"
              variant="outline"
              colorScheme="whiteAlpha"
              color="white"
              onClick={() => {
                onClose();
                void undo();
              }}
            >
              Rückgängig
            </Button>
            <CloseButton size="sm" aria-label="Hinweis schließen" onClick={onClose} />
          </HStack>
        ),
      });
    },
    [toast, actions],
  );
}
