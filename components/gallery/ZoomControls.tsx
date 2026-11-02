'use client';

import { useState, useEffect, useRef } from 'react';
import { ColumnPrefs, DEFAULT_COLUMN_PREFS } from './MasonryGrid';
import { useViewportTier } from '@/hooks/useViewportTier';

const STORAGE_KEY = 'gallery-column-prefs';

const OPTIONS_BY_TIER: Record<'sm' | 'md' | 'lg', number[]> = {
  sm: [1, 2],
  md: [2, 3],
  lg: [2, 3, 4],
};

interface ZoomControlsProps {
  onChange: (prefs: ColumnPrefs) => void;
}

// Owns localStorage persistence + viewport-tier tracking, shared across
// gallery/collection pages. Renders nothing below 425px or before tier is
// known client-side (avoids hydration mismatch).
export default function ZoomControls({ onChange }: ZoomControlsProps) {
  const tier = useViewportTier();
  const [prefs, setPrefs] = useState<ColumnPrefs>(DEFAULT_COLUMN_PREFS);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const next = { ...DEFAULT_COLUMN_PREFS, ...parsed };
          setPrefs(next);
          onChangeRef.current(next);
        }
      }
    } catch (error) {
      console.error('Failed to read gallery column preferences:', error);
    }
  }, []);

  if (tier === null || tier === 'xs') return null;

  const handleSelect = (value: number) => {
    const next = { ...prefs, [tier]: value } as ColumnPrefs;
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    onChangeRef.current(next);
  };

  return (
    <div className="flex items-baseline gap-3 text-[0.6875rem] uppercase tracking-[0.22em] tabular-nums">
      <span className="text-neutral-400 dark:text-neutral-500">View</span>
      {OPTIONS_BY_TIER[tier].map((n) => {
        const active = prefs[tier] === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => handleSelect(n)}
            aria-label={`${n} columns`}
            aria-pressed={active}
            className={`pb-0.5 border-b transition-colors ${
              active
                ? 'text-neutral-900 dark:text-neutral-100 border-current'
                : 'text-neutral-400 dark:text-neutral-500 border-transparent hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
