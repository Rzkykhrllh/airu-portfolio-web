'use client';

import { useEffect, useState } from 'react';

export type ViewportTier = 'xs' | 'sm' | 'md' | 'lg';

// Shared viewport-tier tracking (custom breakpoints, not Tailwind's
// defaults). Null until known client-side (no matchMedia during SSR).
// Extracted from ZoomControls so MasonryGrid uses the same boundaries.
export function useViewportTier(): ViewportTier | null {
  const [tier, setTier] = useState<ViewportTier | null>(null);

  useEffect(() => {
    const mqSm = window.matchMedia('(min-width: 425px)');
    const mqMd = window.matchMedia('(min-width: 768px)');
    const mqLg = window.matchMedia('(min-width: 1024px)');

    const updateTier = () => {
      if (mqLg.matches) setTier('lg');
      else if (mqMd.matches) setTier('md');
      else if (mqSm.matches) setTier('sm');
      else setTier('xs');
    };

    updateTier();
    mqSm.addEventListener('change', updateTier);
    mqMd.addEventListener('change', updateTier);
    mqLg.addEventListener('change', updateTier);

    return () => {
      mqSm.removeEventListener('change', updateTier);
      mqMd.removeEventListener('change', updateTier);
      mqLg.removeEventListener('change', updateTier);
    };
  }, []);

  return tier;
}
