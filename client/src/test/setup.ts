import '@testing-library/jest-dom/vitest';
import { trackFocusVisible } from '@zag-js/focus-visible';

// Chakra's Checkbox/Switch lazily patch `HTMLElement.prototype.focus` via @zag-js/focus-visible
// (plain assignment). If `userEvent.setup()` ran first, `focus` is a getter-only property and
// that assignment throws. Run zag's one-time global setup up front instead.
trackFocusVisible(() => {})();

// jsdom does not implement matchMedia; Chakra's color mode and breakpoint hooks need it.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
