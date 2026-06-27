import type { ReactElement } from 'react';

export type Columns = 2 | 3 | 4;

export const gridIcons: Record<Columns, ReactElement> = {
  2: (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <rect x="0" y="0" width="7" height="5" rx="0.5" />
      <rect x="9" y="0" width="7" height="5" rx="0.5" />
      <rect x="0" y="7" width="7" height="5" rx="0.5" />
      <rect x="9" y="7" width="7" height="5" rx="0.5" />
    </svg>
  ),
  3: (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <rect x="0" y="0" width="4" height="5" rx="0.5" />
      <rect x="6" y="0" width="4" height="5" rx="0.5" />
      <rect x="12" y="0" width="4" height="5" rx="0.5" />
      <rect x="0" y="7" width="4" height="5" rx="0.5" />
      <rect x="6" y="7" width="4" height="5" rx="0.5" />
      <rect x="12" y="7" width="4" height="5" rx="0.5" />
    </svg>
  ),
  4: (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <rect x="0" y="0" width="2.5" height="5" rx="0.5" />
      <rect x="4.5" y="0" width="2.5" height="5" rx="0.5" />
      <rect x="9" y="0" width="2.5" height="5" rx="0.5" />
      <rect x="13.5" y="0" width="2.5" height="5" rx="0.5" />
      <rect x="0" y="7" width="2.5" height="5" rx="0.5" />
      <rect x="4.5" y="7" width="2.5" height="5" rx="0.5" />
      <rect x="9" y="7" width="2.5" height="5" rx="0.5" />
      <rect x="13.5" y="7" width="2.5" height="5" rx="0.5" />
    </svg>
  ),
};
