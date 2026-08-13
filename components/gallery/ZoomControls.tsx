'use client';

import { useState, useEffect, useRef } from 'react';
import { gridIcons } from './grid-icons';
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

// Owns localStorage persistence; viewport-tier tracking (matchMedia
// listeners, per-tier option sets) comes from the shared `useViewportTier`
// hook — also used by MasonryGrid (§7d) so both stay pinned to the exact
// same breakpoint boundaries instead of carrying two copies that could
// drift. Renders nothing below 425px (xs) — no column choice is possible
// there — and nothing until the viewport tier is known client-side,
// avoiding any hydration mismatch from a server-guessed tier.
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
    <div className="flex items-center gap-1">
      {OPTIONS_BY_TIER[tier].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => handleSelect(n)}
          aria-label={`${n} columns`}
          className={`p-1.5 rounded transition-colors ${
            prefs[tier] === n
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'
          }`}
        >
          {gridIcons[n as keyof typeof gridIcons]}
        </button>
      ))}
    </div>
  );
}
