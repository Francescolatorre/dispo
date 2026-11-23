/**
 * The single Chakra theme of the app — design direction "Leitstand"
 * (see docs: design-direction.md, §3 Tokens).
 *
 * - Near-monochrome cool "ink" chrome on an off-white canvas, hairlines instead of boxes.
 * - Workload is the only loud colour (`load.*`); red/green are reserved for it.
 * - Accent (blue) is for state and orientation only: focus, today, selection.
 * - Projects are identity: 8 hues (`domain/projectColors.ts`), shown as edge + dot.
 */
import { createMultiStyleConfigHelpers, defineStyleConfig, extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const INK = '21,24,32';

// -------------------------------------------------------------------------------------------
// Primitive colours

const colors = {
  /** Cool neutral "ink" scale. */
  gray: {
    0: '#FFFFFF',
    50: '#F6F7F9',
    100: '#EEF0F3',
    200: '#E2E5EA',
    300: '#CDD2DA',
    400: '#8C95A3',
    500: '#5F6876',
    600: '#474F5C',
    700: '#353B46',
    800: '#262B35',
    900: '#151820',
  },
  accent: {
    50: '#EAF0FD',
    100: '#D5E0FB',
    200: '#ADC2F6',
    300: '#8AA8F2',
    400: '#5B82E6',
    500: '#2F5BD3',
    600: '#284EB6',
    700: '#1E3F9E',
    800: '#18337F',
    900: '#132862',
  },
  // Project palette (Tailwind scales). `.600` = edge, `.100` = tint, `.800` = text on tint.
  sky: {
    50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD', 300: '#7DD3FC', 400: '#38BDF8',
    500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1', 800: '#075985', 900: '#0C4A6E',
  },
  cobalt: {
    50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD', 400: '#60A5FA',
    500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A',
  },
  indigo: {
    50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC', 400: '#818CF8',
    500: '#6366F1', 600: '#4F46E5', 700: '#4338CA', 800: '#3730A3', 900: '#312E81',
  },
  violet: {
    50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD', 400: '#A78BFA',
    500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9', 800: '#5B21B6', 900: '#4C1D95',
  },
  grape: {
    50: '#FAF5FF', 100: '#F3E8FF', 200: '#E9D5FF', 300: '#D8B4FE', 400: '#C084FC',
    500: '#A855F7', 600: '#9333EA', 700: '#7E22CE', 800: '#6B21A8', 900: '#581C87',
  },
  fuchsia: {
    50: '#FDF4FF', 100: '#FAE8FF', 200: '#F5D0FE', 300: '#F0ABFC', 400: '#E879F9',
    500: '#D946EF', 600: '#C026D3', 700: '#A21CAF', 800: '#86198F', 900: '#701A75',
  },
  cyan: {
    50: '#ECFEFF', 100: '#CFFAFE', 200: '#A5F3FC', 300: '#67E8F9', 400: '#22D3EE',
    500: '#06B6D4', 600: '#0891B2', 700: '#0E7490', 800: '#155E75', 900: '#164E63',
  },
  slate: {
    50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8',
    500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A',
  },
};

// -------------------------------------------------------------------------------------------
// Semantic tokens

const semanticTokens = {
  colors: {
    canvas: 'gray.50',
    surface: 'gray.0',
    'text.primary': 'gray.800',
    'text.secondary': 'gray.500',
    'text.strong': 'gray.900',
    line: 'gray.200',
    'line.strong': 'gray.300',
    'border.control': 'gray.400',
    /**
     * Workload scale (see `domain/workload.ts`). `bg` = cell tint, `fg` = text on it,
     * `strong` = 3 px status edge / legend / chip icon. Colour is never the only signal:
     * free → "frei", full → "voll", over → ⚠ + bold number.
     */
    load: {
      free: { bg: '#D3F0DC', fg: '#14663A', strong: '#1E8A4C' },
      luft: { bg: '#EAF7EE', fg: '#14663A', strong: '#7CC494' },
      ok: { bg: '#FFFFFF', fg: '#5F6876', strong: 'transparent' },
      full: { bg: '#E6E9EE', fg: '#262B35', strong: '#8C95A3' },
      over: { bg: '#FBD0D0', fg: '#9B1C1C', strong: '#D92D2D' },
    },
    board: {
      line: 'gray.100',
      lineStrong: 'gray.200',
      today: 'accent.500',
      currentWeekHead: 'accent.50',
      pastVeil: 'rgba(246,247,249,0.55)',
    },
  },
};

// -------------------------------------------------------------------------------------------
// Type, space, shape

const fonts = {
  heading: `"Geist", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  body: `"Geist", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  mono: `"Geist Mono", ui-monospace, "SFMono-Regular", "Cascadia Mono", Consolas, monospace`,
};

const fontSizes = { '2xs': '11px', xs: '12px', sm: '13px', md: '14px', lg: '16px', xl: '20px', '2xl': '24px' };
const lineHeights = { '2xs': '14px', xs: '16px', sm: '18px', md: '20px', lg: '24px', xl: '28px', '2xl': '32px' };
const radii = { sm: '4px', md: '6px', lg: '8px', xl: '12px' };
const shadows = {
  xs: `0 1px 2px rgba(${INK},0.06)`,
  sm: `0 1px 3px rgba(${INK},0.08), 0 1px 2px rgba(${INK},0.04)`,
  md: `0 4px 12px rgba(${INK},0.10), 0 2px 4px rgba(${INK},0.06)`,
  lg: `0 16px 40px rgba(${INK},0.16)`,
  outline: '0 0 0 2px #FFFFFF, 0 0 0 4px #2F5BD3',
};

const styles = {
  global: {
    'html, body': { bg: 'canvas', color: 'text.primary', fontSize: 'sm', lineHeight: 'sm' },
    '*': { scrollbarWidth: 'thin', scrollbarColor: 'var(--chakra-colors-gray-300) transparent' },
    '*::-webkit-scrollbar': { width: '8px', height: '8px' },
    '*::-webkit-scrollbar-track': { bg: 'transparent' },
    '*::-webkit-scrollbar-thumb': {
      bg: 'gray.300',
      borderRadius: 'full',
      border: '2px solid transparent',
      backgroundClip: 'content-box',
    },
    '*::-webkit-scrollbar-thumb:hover': { bg: 'gray.400' },
    '@media (prefers-reduced-motion: reduce)': {
      '*, *::before, *::after': { transitionDuration: '0ms !important', animationDuration: '0ms !important' },
    },
  },
};

// -------------------------------------------------------------------------------------------
// Components

const stateLayer = (alpha: number) => `rgba(${INK},${alpha})`;

const Button = defineStyleConfig({
  baseStyle: {
    fontWeight: 500,
    borderRadius: 'md',
    transitionDuration: '100ms',
    _focusVisible: { boxShadow: 'outline' },
    _disabled: { opacity: 0.38, cursor: 'not-allowed', boxShadow: 'none' },
  },
  sizes: {
    xs: { h: '24px', minW: '24px', fontSize: 'xs', px: 2 },
    sm: { h: '28px', minW: '28px', fontSize: 'xs', px: 2.5 },
    md: { h: '32px', minW: '32px', fontSize: 'sm', px: 3 },
    lg: { h: '40px', minW: '40px', fontSize: 'md', px: 4 },
  },
  variants: {
    /** Primary: ink. Use once per view. */
    solid: {
      bg: 'gray.900',
      color: 'white',
      fontWeight: 600,
      _hover: { bg: 'gray.800', _disabled: { bg: 'gray.900' } },
      _active: { bg: 'gray.700' },
    },
    /** Secondary. */
    outline: {
      bg: 'white',
      color: 'gray.800',
      borderWidth: '1px',
      borderColor: 'gray.200',
      boxShadow: 'xs',
      _hover: { bg: 'gray.50', _disabled: { bg: 'white' } },
      _active: { bg: 'gray.100' },
    },
    ghost: {
      bg: 'transparent',
      color: 'gray.700',
      _hover: { bg: stateLayer(0.08) },
      _active: { bg: stateLayer(0.1) },
    },
    /** Destructive action: text only, never a red fill. */
    danger: {
      bg: 'transparent',
      color: 'load.over.fg',
      fontWeight: 600,
      _hover: { bg: 'rgba(155,28,28,0.08)' },
      _active: { bg: 'rgba(155,28,28,0.12)' },
    },
    link: { color: 'accent.600', fontWeight: 500 },
  },
  defaultProps: { variant: 'solid', size: 'md', colorScheme: 'gray' },
});

const fieldSizes = {
  sm: { field: { h: '28px', fontSize: 'xs', px: 2.5, borderRadius: 'md' }, addon: { h: '28px', fontSize: 'xs', px: 2.5 } },
  md: { field: { h: '32px', fontSize: 'sm', px: 2.5, borderRadius: 'md' }, addon: { h: '32px', fontSize: 'sm', px: 2.5 } },
  lg: { field: { h: '40px', fontSize: 'md', px: 3, borderRadius: 'md' }, addon: { h: '40px', fontSize: 'md', px: 3 } },
};

const outlineField = {
  field: {
    bg: 'white',
    borderColor: 'border.control',
    _hover: { borderColor: 'gray.500' },
    _placeholder: { color: 'gray.500' },
    _focusVisible: { borderColor: 'accent.500', boxShadow: 'outline' },
    _invalid: { borderColor: 'load.over.strong', boxShadow: 'none' },
  },
};

const Input = defineStyleConfig({ sizes: fieldSizes, variants: { outline: outlineField }, defaultProps: { size: 'md', variant: 'outline' } });
const Select = defineStyleConfig({ sizes: fieldSizes, variants: { outline: outlineField }, defaultProps: { size: 'md', variant: 'outline' } });
const NumberInput = defineStyleConfig({ sizes: fieldSizes, variants: { outline: outlineField }, defaultProps: { size: 'md', variant: 'outline' } });

const FormLabel = defineStyleConfig({ baseStyle: { fontSize: 'sm', fontWeight: 500, color: 'gray.700', mb: 1.5 } });

const { defineMultiStyleConfig: formMulti, definePartsStyle: formParts } = createMultiStyleConfigHelpers(['container', 'helperText', 'requiredIndicator']);
const Form = formMulti({
  baseStyle: formParts({ helperText: { fontSize: 'xs', color: 'gray.500', mt: 1.5 }, requiredIndicator: { color: 'gray.500' } }),
});
const { defineMultiStyleConfig: errorMulti, definePartsStyle: errorParts } = createMultiStyleConfigHelpers(['text', 'icon']);
const FormError = errorMulti({ baseStyle: errorParts({ text: { fontSize: 'xs', color: 'load.over.fg', mt: 1.5 } }) });

const { defineMultiStyleConfig: sliderMulti, definePartsStyle: sliderParts } = createMultiStyleConfigHelpers(['container', 'track', 'thumb', 'filledTrack']);
const Slider = sliderMulti({
  baseStyle: sliderParts({
    track: { bg: 'gray.100' },
    filledTrack: { bg: 'accent.500' },
    thumb: { bg: 'white', borderWidth: '1px', borderColor: 'accent.500', _focusVisible: { boxShadow: 'outline' } },
  }),
});

/** Toggles and choices use the accent (state), never green/red (workload). */
const accentDefault = { defaultProps: { colorScheme: 'accent' } };
const Switch = createMultiStyleConfigHelpers(['container', 'track', 'thumb']).defineMultiStyleConfig(accentDefault);
const Checkbox = createMultiStyleConfigHelpers(['container', 'control', 'label', 'icon']).defineMultiStyleConfig(accentDefault);
const Radio = createMultiStyleConfigHelpers(['container', 'control', 'label']).defineMultiStyleConfig(accentDefault);

const Tooltip = defineStyleConfig({
  baseStyle: {
    bg: 'gray.900',
    color: 'white',
    fontSize: 'xs',
    lineHeight: 'xs',
    fontWeight: 400,
    px: 2,
    py: 1,
    borderRadius: 'md',
    maxW: '240px',
    boxShadow: 'md',
    '--tooltip-bg': 'colors.gray.900',
  },
});

const { defineMultiStyleConfig: menuMulti, definePartsStyle: menuParts } = createMultiStyleConfigHelpers(['button', 'list', 'item', 'groupTitle', 'command', 'divider']);
const Menu = menuMulti({
  baseStyle: menuParts({
    list: { py: 1, borderRadius: 'lg', borderColor: 'gray.200', boxShadow: 'md', minW: '200px', zIndex: 'dropdown' },
    item: {
      fontSize: 'sm',
      minH: '32px',
      px: 3,
      color: 'gray.800',
      _hover: { bg: stateLayer(0.06) },
      _focus: { bg: stateLayer(0.06) },
      _checked: { fontWeight: 500 },
    },
    groupTitle: { fontSize: 'xs', fontWeight: 500, color: 'gray.500', mx: 3, my: 1.5 },
    divider: { borderColor: 'gray.200', my: 1 },
  }),
});

const { defineMultiStyleConfig: drawerMulti, definePartsStyle: drawerParts } = createMultiStyleConfigHelpers(['overlay', 'dialogContainer', 'dialog', 'header', 'closeButton', 'body', 'footer']);
const Drawer = drawerMulti({
  baseStyle: drawerParts({
    overlay: { bg: `rgba(${INK},0.24)` },
    dialog: { boxShadow: 'lg' },
    header: { fontSize: 'lg', lineHeight: 'lg', fontWeight: 600, color: 'gray.900', px: 6, py: 4, borderBottomWidth: '1px', borderColor: 'line' },
    closeButton: { top: 3.5, insetEnd: 4, borderRadius: 'md' },
    body: { px: 6, py: 5, fontSize: 'md' },
    footer: { px: 6, py: 4, borderTopWidth: '1px', borderColor: 'line', minH: '64px' },
  }),
  sizes: {
    sm: drawerParts({ dialog: { maxW: '400px' } }),
    md: drawerParts({ dialog: { maxW: '400px' } }),
  },
});

const { defineMultiStyleConfig: tableMulti, definePartsStyle: tableParts } = createMultiStyleConfigHelpers(['table', 'thead', 'tbody', 'tr', 'th', 'td', 'tfoot', 'caption']);
const Table = tableMulti({
  baseStyle: tableParts({
    th: { fontFamily: 'body', textTransform: 'none', letterSpacing: 'normal', fontWeight: 500, color: 'gray.600' },
    td: { fontSize: 'md' },
  }),
  sizes: {
    sm: tableParts({
      th: { fontSize: 'xs', px: 3, h: '32px', py: 0 },
      td: { fontSize: 'sm', px: 3, py: 1.5 },
    }),
    md: tableParts({
      th: { fontSize: 'xs', px: 4, h: '32px', py: 0 },
      td: { fontSize: 'md', px: 4, h: '40px', py: 1.5 },
    }),
  },
  variants: {
    simple: tableParts({
      th: { bg: 'gray.50', borderColor: 'line' },
      td: { borderColor: 'line' },
    }),
  },
});

const Badge = defineStyleConfig({
  baseStyle: { textTransform: 'none', fontWeight: 500, borderRadius: 'sm', px: 1.5, fontSize: '2xs', lineHeight: '18px' },
  defaultProps: { colorScheme: 'gray', variant: 'subtle' },
});

const Heading = defineStyleConfig({
  baseStyle: { fontWeight: 600, color: 'gray.900', letterSpacing: '-0.01em' },
  sizes: {
    lg: { fontSize: 'xl', lineHeight: 'xl' },
    md: { fontSize: 'lg', lineHeight: 'lg' },
    sm: { fontSize: 'md', lineHeight: 'md' },
  },
});

const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  shadows,
  styles,
  components: {
    Badge,
    Button,
    Checkbox,
    Drawer,
    Form,
    FormError,
    FormLabel,
    Heading,
    Input,
    Menu,
    NumberInput,
    Radio,
    Select,
    Slider,
    Switch,
    Table,
    Tooltip,
  },
});

export default theme;
