'use client';

import { CSSProperties, useEffect, useState } from 'react';

// Admin grid density control: a slider for how many columns a photo grid
// shows. The choice is remembered per screen (localStorage key) so each
// admin page keeps its own zoom level.

interface GridZoomRange {
  min: number;
  max: number;
  initial: number;
}

export function useGridZoom(storageKey: string, { min, max, initial }: GridZoomRange) {
  const [columns, setColumns] = useState(initial);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(`gridZoom:${storageKey}`));
      if (saved >= min && saved <= max) setColumns(saved);
    } catch {
      // storage blocked — keep the default
    }
  }, [storageKey, min, max]);

  const update = (value: number) => {
    const clamped = Math.min(max, Math.max(min, value));
    setColumns(clamped);
    try {
      localStorage.setItem(`gridZoom:${storageKey}`, String(clamped));
    } catch {
      // ignore
    }
  };

  return { columns, setColumns: update, min, max };
}

// Phones keep a fixed, readable column count; from `sm` up the grid follows
// the slider. Pair with `zoomGridClass(mobileCols)` on the grid element.
export function zoomGridStyle(columns: number): CSSProperties {
  return { '--grid-cols': columns } as CSSProperties;
}

export function zoomGridClass(mobileColumns: 1 | 2 | 3 = 2) {
  const mobile = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }[mobileColumns];
  return `grid ${mobile} sm:[grid-template-columns:repeat(var(--grid-cols),minmax(0,1fr))]`;
}

interface GridZoomSliderProps {
  columns: number;
  min: number;
  max: number;
  onChange: (columns: number) => void;
  className?: string;
}

// Slider runs "zoom in" → right = bigger photos (fewer columns), matching the
// usual photo-app convention; the stored value is still the column count.
export default function GridZoomSlider({ columns, min, max, onChange, className = '' }: GridZoomSliderProps) {
  const zoom = max + min - columns;

  return (
    <div className={`hidden sm:flex items-center gap-2 text-gray-500 dark:text-gray-400 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(columns + 1)}
        disabled={columns >= max}
        className="p-1 rounded hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
        title="Smaller photos (more per row)"
        aria-label="Smaller photos"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={zoom}
        onChange={(e) => onChange(max + min - Number(e.target.value))}
        className="w-28 accent-gray-900 dark:accent-white cursor-pointer"
        aria-label="Photo size"
        title={`${columns} per row`}
      />
      <button
        type="button"
        onClick={() => onChange(columns - 1)}
        disabled={columns <= min}
        className="p-1 rounded hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
        title="Bigger photos (fewer per row)"
        aria-label="Bigger photos"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </button>
      <span className="text-xs tabular-nums w-6 text-right">{columns}</span>
    </div>
  );
}
