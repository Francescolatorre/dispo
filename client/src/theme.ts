import {
  createMultiStyleConfigHelpers,
  defineStyleConfig,
  extendTheme,
  type ThemeConfig,
} from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const Button = defineStyleConfig({
  defaultProps: {
    colorScheme: 'blue',
  },
});

const focusedField = {
  borderRadius: 'md',
  borderColor: 'gray.200',
  _hover: {
    borderColor: 'gray.300',
  },
  _focus: {
    borderColor: 'blue.500',
    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
  },
};

const Input = defineStyleConfig({
  variants: {
    outline: { field: focusedField },
  },
});

const Select = defineStyleConfig({
  variants: {
    outline: { field: focusedField },
  },
});

const { defineMultiStyleConfig: defineSliderStyleConfig, definePartsStyle: defineSliderPartsStyle } =
  createMultiStyleConfigHelpers(['container', 'track', 'thumb', 'filledTrack']);

const Slider = defineSliderStyleConfig({
  baseStyle: defineSliderPartsStyle({
    track: { bg: 'gray.100' },
    filledTrack: { bg: 'blue.500' },
    thumb: { bg: 'white', borderWidth: '1px', borderColor: 'blue.500' },
  }),
});

/**
 * Semantic colours of the planning board. Workload tints stay subtle so project bars remain
 * readable on top of them; only "over" is clearly visible (and always paired with an icon).
 */
const semanticTokens = {
  colors: {
    load: {
      free: { bg: 'green.50', fg: 'green.700', swatch: 'green.100' },
      ok: { bg: 'white', fg: 'gray.500', swatch: 'gray.100' },
      warning: { bg: 'orange.50', fg: 'orange.700', swatch: 'orange.100' },
      over: { bg: 'red.100', fg: 'red.700', swatch: 'red.200' },
    },
    board: {
      line: 'gray.100',
      lineStrong: 'gray.200',
      currentWeek: 'blue.50',
      today: 'blue.500',
    },
  },
};

/**
 * Extra colour scale for the project palette (`domain/projectColors.ts`); Chakra has no
 * indigo by default. Full 50–900 scale because bars use `.100`, `.200`, `.500` and `.900`.
 */
const colors = {
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
};

/** The single Chakra theme of the app. */
const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  components: {
    Button,
    Input,
    Select,
    Slider,
  },
});

export default theme;
