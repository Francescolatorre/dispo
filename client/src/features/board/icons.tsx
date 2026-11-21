/** Small inline icons (no icon package dependency). */
import { createIcon } from '@chakra-ui/react';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const ChevronLeftIcon = createIcon({
  displayName: 'ChevronLeftIcon',
  viewBox: '0 0 24 24',
  path: <path {...stroke} d="M15 18l-6-6 6-6" />,
});

export const ChevronRightIcon = createIcon({
  displayName: 'ChevronRightIcon',
  viewBox: '0 0 24 24',
  path: <path {...stroke} d="M9 18l6-6-6-6" />,
});

export const SearchIcon = createIcon({
  displayName: 'SearchIcon',
  viewBox: '0 0 24 24',
  path: (
    <g {...stroke}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </g>
  ),
});

export const PlusIcon = createIcon({
  displayName: 'PlusIcon',
  viewBox: '0 0 24 24',
  path: <path {...stroke} d="M12 5v14M5 12h14" />,
});

export const UndoIcon = createIcon({
  displayName: 'UndoIcon',
  viewBox: '0 0 24 24',
  path: <path {...stroke} d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11" />,
});

export const RedoIcon = createIcon({
  displayName: 'RedoIcon',
  viewBox: '0 0 24 24',
  path: <path {...stroke} d="M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 000 11H13" />,
});

export const AlertIcon = createIcon({
  displayName: 'AlertIcon',
  viewBox: '0 0 24 24',
  path: (
    <g {...stroke}>
      <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </g>
  ),
});
