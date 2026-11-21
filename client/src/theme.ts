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

/** The single Chakra theme of the app. */
const theme = extendTheme({
  config,
  components: {
    Button,
    Input,
    Select,
    Slider,
  },
});

export default theme;
