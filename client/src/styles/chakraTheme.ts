import { extendTheme } from '@chakra-ui/react';

// Map MUI palette to Chakra colors
const colors = {
  primary: {
    50: '#e6f0ff',
    100: '#b3d1ff',
    200: '#80b3ff',
    300: '#4d94ff',
    400: '#1a75ff',
    500: '#007bff', // main
    600: '#0056b3', // dark
    700: '#004085',
    800: '#002b57',
    900: '#00152a',
  },
  secondary: {
    50: '#f2f3f4',
    100: '#d8dadd',
    200: '#bfc2c6',
    300: '#a5a9af',
    400: '#8c9198',
    500: '#6c757d', // main
    600: '#495057', // dark
    700: '#343a40',
    800: '#1f2326',
    900: '#0a0b0c',
  },
  error: {
    50: '#fce8ea',
    100: '#f5b8bf',
    200: '#ee8994',
    300: '#e75a69',
    400: '#e02a3e',
    500: '#dc3545', // main
    600: '#bd2130', // dark
    700: '#921925',
    800: '#66111a',
    900: '#3b0a0f',
  },
  warning: {
    50: '#fff8e6',
    100: '#ffe5b3',
    200: '#ffd280',
    300: '#ffbf4d',
    400: '#ffac1a',
    500: '#ffc107', // main
    600: '#d39e00', // dark
    700: '#a07800',
    800: '#6d5200',
    900: '#3a2c00',
  },
  success: {
    50: '#e8f5eb',
    100: '#b7e1bf',
    200: '#86cd94',
    300: '#55b969',
    400: '#24a53e',
    500: '#28a745', // main
    600: '#1e7e34', // dark
    700: '#175c26',
    800: '#0f3b18',
    900: '#081b0b',
  },
};

// Component style overrides
const components = {
  Button: {
    defaultProps: {
      colorScheme: 'primary',
    },
    variants: {
      solid: (props: any) => ({
        bg: `${props.colorScheme}.500`,
        color: 'white',
        _hover: {
          bg: `${props.colorScheme}.600`,
        },
      }),
      outline: (props: any) => ({
        borderColor: `${props.colorScheme}.500`,
        color: `${props.colorScheme}.500`,
        _hover: {
          bg: `${props.colorScheme}.50`,
        },
      }),
    },
  },
  Alert: {
    defaultProps: {
      variant: 'subtle',
    },
    variants: {
      subtle: (props: any) => ({
        container: {
          bg: `${props.status}.50`,
        },
      }),
    },
  },
  Badge: {
    defaultProps: {
      variant: 'subtle',
    },
    variants: {
      subtle: (props: any) => ({
        bg: `${props.colorScheme}.50`,
        color: `${props.colorScheme}.600`,
      }),
    },
  },
};

// Typography styles
const typography = {
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
};

export const theme = extendTheme({
  colors,
  components,
  ...typography,
  styles: {
    global: {
      body: {
        bg: 'white',
        color: 'gray.800',
      },
    },
  },
});