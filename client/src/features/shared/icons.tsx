/** Small inline icons for the master-data pages (no icon package dependency). */
import { createIcon } from '@chakra-ui/react';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

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

export const WarningIcon = createIcon({
  displayName: 'WarningIcon',
  viewBox: '0 0 24 24',
  path: (
    <g {...stroke}>
      <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </g>
  ),
});
