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

export const ChevronDownIcon = createIcon({
  displayName: 'ChevronDownIcon',
  viewBox: '0 0 24 24',
  path: <path {...stroke} d="M6 9l6 6 6-6" />,
});

export const CloseIcon = createIcon({
  displayName: 'CloseIcon',
  viewBox: '0 0 24 24',
  path: <path {...stroke} d="M18 6L6 18M6 6l12 12" />,
});

export const SlidersIcon = createIcon({
  displayName: 'SlidersIcon',
  viewBox: '0 0 24 24',
  path: <path {...stroke} d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" />,
});

/** Board / planning grid (navigation). */
export const BoardIcon = createIcon({
  displayName: 'BoardIcon',
  viewBox: '0 0 24 24',
  path: (
    <g {...stroke}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 13h6M10 16.5h7" />
    </g>
  ),
});

export const UsersIcon = createIcon({
  displayName: 'UsersIcon',
  viewBox: '0 0 24 24',
  path: (
    <g {...stroke}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0113 0M16 4.6a3.5 3.5 0 010 6.8M18 14.2a6.5 6.5 0 013.5 5.8" />
    </g>
  ),
});

export const FolderIcon = createIcon({
  displayName: 'FolderIcon',
  viewBox: '0 0 24 24',
  path: <path {...stroke} d="M3 7a2 2 0 012-2h4l2 2.5h8a2 2 0 012 2V17a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
});
