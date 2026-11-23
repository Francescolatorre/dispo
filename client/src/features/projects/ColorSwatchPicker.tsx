import { Box, HStack, Text, VisuallyHiddenInput, chakra } from '@chakra-ui/react';
import { isProjectColor, PROJECT_COLOR_LABELS, PROJECT_COLORS, projectColorTokens } from '../../domain/projectColors';
import { CheckIcon } from '../shared/icons';

export interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** id of the visible group label. */
  labelId: string;
}

/**
 * Swatches for the project palette only (24 px, selected = ink ring + check). Native radio
 * inputs (visually hidden) give arrow-key navigation and screen-reader semantics for free.
 */
export function ColorSwatchPicker({ value, onChange, labelId }: ColorSwatchPickerProps) {
  return (
    <Box>
      <HStack role="radiogroup" aria-labelledby={labelId} spacing={2} wrap="wrap">
        {PROJECT_COLORS.map((c) => {
          const checked = value === c;
          return (
            <chakra.label key={c} cursor="pointer" title={PROJECT_COLOR_LABELS[c]} data-color={c} display="inline-flex">
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
                boxSize="24px"
                borderRadius="sm"
                bg={projectColorTokens(c).edge}
                boxShadow={checked ? '0 0 0 2px #FFFFFF, 0 0 0 4px #151820' : undefined}
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="box-shadow 150ms"
                sx={{ 'input:focus-visible + &': { outline: '2px solid', outlineColor: 'accent.500', outlineOffset: '4px' } }}
              >
                {checked && <CheckIcon boxSize="14px" />}
              </Box>
            </chakra.label>
          );
        })}
      </HStack>
      {value && !isProjectColor(value) && (
        <Text fontSize="xs" color="gray.700" mt={2}>
          Die bisherige Farbe „{value}“ ist nicht mehr erlaubt – bitte eine Farbe aus der Palette wählen.
        </Text>
      )}
    </Box>
  );
}
