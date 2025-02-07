import { 
  ThemeConfig,
  ThemeComponents,
  defineStyleConfig,
  defineStyle,
  createMultiStyleConfigHelpers
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

const { defineMultiStyleConfig: defineFormStyleConfig, definePartsStyle: defineFormPartsStyle } =
  createMultiStyleConfigHelpers(['field', 'label', 'container']);

const Form = defineFormStyleConfig({
  variants: {
    floating: defineFormPartsStyle({
      container: {
        _focusWithin: {
          label: {
            transform: 'scale(0.85) translateY(-24px)',
          },
        },
        'input:not(:placeholder-shown) + label, .chakra-select__wrapper + label': {
          transform: 'scale(0.85) translateY(-24px)',
        },
        label: {
          top: 0,
          left: 0,
          zIndex: 2,
          position: 'absolute',
          backgroundColor: 'white',
          pointerEvents: 'none',
          mx: 3,
          px: 1,
          my: 2,
          transformOrigin: 'left top',
        },
      },
    }),
  },
});

const Input = defineStyleConfig({
  variants: {
    outline: {
      field: {
        borderRadius: 'md',
        borderColor: 'gray.200',
        _hover: {
          borderColor: 'gray.300',
        },
        _focus: {
          borderColor: 'blue.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
        },
      },
    },
  },
});

const Select = defineStyleConfig({
  variants: {
    outline: {
      field: {
        borderRadius: 'md',
        borderColor: 'gray.200',
        _hover: {
          borderColor: 'gray.300',
        },
        _focus: {
          borderColor: 'blue.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
        },
      },
    },
  },
});

const { defineMultiStyleConfig: defineSliderStyleConfig, definePartsStyle: defineSliderPartsStyle } =
  createMultiStyleConfigHelpers(['container', 'track', 'thumb', 'filledTrack']);

const Slider = defineSliderStyleConfig({
  baseStyle: defineSliderPartsStyle({
    container: {},
    track: {
      bg: 'gray.100',
    },
    filledTrack: {
      bg: 'blue.500',
    },
    thumb: {
      bg: 'white',
      borderWidth: '1px',
      borderColor: 'blue.500',
    },
  }),
});

const components: ThemeComponents = {
  Button,
  Form,
  Input,
  Select,
  Slider,
};

const theme = {
  config,
  components,
  styles: {
    global: {
      '.chakra-input': {
        width: '100%',
      },
      '.react-datepicker-wrapper': {
        width: '100%',
      },
      '.react-datepicker__input-container input': {
        width: '100%',
        padding: '8px 16px',
        borderRadius: 'md',
        borderWidth: '1px',
        borderColor: 'gray.200',
        _hover: {
          borderColor: 'gray.300',
        },
        _focus: {
          borderColor: 'blue.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
        },
      },
    },
  },
};

export default theme;