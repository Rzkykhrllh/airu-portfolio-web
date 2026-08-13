'use client';

import { useEffect, useState } from 'react';

export type ViewportTier = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Shared viewport-tier tracking against the gallery's custom breakpoints
 * (<425px, 425–767px, 768–1023px, 1024px+ — not Tailwind's sm/md/lg
 * defaults). Returns null until the tier is known client-side, so callers
 * can render a hydration-safe fallback until then (matchMedia doesn't exist
 * during SSR).
 *
 * Extracted out of ZoomControls so MasonryGrid can compute its live column
 * count against the exact same breakpoint boundaries, instead of carrying a
 * second copy of this matchMedia setup that could quietly drift out of sync.
 */
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
