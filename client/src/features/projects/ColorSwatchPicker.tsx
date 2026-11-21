import { Box, HStack, Text, VisuallyHiddenInput, chakra } from '@chakra-ui/react';
import { isProjectColor, PROJECT_COLOR_LABELS, PROJECT_COLORS } from '../../domain/projectColors';

export interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** id of the visible group label. */
  labelId: string;
}

/**
 * Swatches for the project palette only. Native radio inputs (visually hidden) give
 * arrow-key navigation and screen-reader semantics for free.
 */
export function ColorSwatchPicker({ value, onChange, labelId }: ColorSwatchPickerProps) {
  return (
    <Box>
      <HStack role="radiogroup" aria-labelledby={labelId} spacing={2} wrap="wrap">
        {PROJECT_COLORS.map((c) => {
          const checked = value === c;
          return (
            <chakra.label key={c} cursor="pointer" title={PROJECT_COLOR_LABELS[c]} data-color={c}>
              <VisuallyHiddenInput
                type="radio"
                name="project-color"
                value={c}
                checked={checked}
                onChange={() => onChange(c)}
                aria-label={PROJECT_COLOR_LABELS[c]}
              />
              <Box
                aria-hidden
                w="28px"
                h="28px"
                borderRadius="full"
                bg={`${c}.200`}
                borderWidth="3px"
                borderColor={checked ? `${c}.600` : 'white'}
                boxShadow={checked ? 'none' : `0 0 0 1px var(--chakra-colors-${c}-300)`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{ 'input:focus-visible + &': { outline: '2px solid', outlineColor: 'blue.500', outlineOffset: '2px' } }}
              >
                <Box w="10px" h="10px" borderRadius="full" bg={`${c}.500`} />
              </Box>
            </chakra.label>
          );
        })}
      </HStack>
      {value && !isProjectColor(value) && (
        <Text fontSize="xs" color="orange.700" mt={2}>
          Die bisherige Farbe „{value}“ ist nicht mehr erlaubt – bitte eine Farbe aus der Palette wählen.
        </Text>
      )}
    </Box>
  );
}
