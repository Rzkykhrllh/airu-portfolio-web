'use client';

import { PhotoVisibility } from '@/types';

interface VisibilityMenuProps {
  visibility: PhotoVisibility;
  onChange: (visibility: PhotoVisibility) => void;
  disabled?: boolean;
  className?: string;
  /** 'sm' for dense grids (zoomed-out tiles). */
  size?: 'sm' | 'md';
}

// Single icon switch (was a dropdown): each click cycles
// Public → Collection only → Private → Public. Icon + color show the state,
// so it takes no more room than the featured star next to it.
const VISIBILITY_OPTIONS: {
  value: PhotoVisibility;
  label: string;
  hint: string;
  colorClass: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'PUBLIC',
    label: 'Public',
    hint: 'shown in the gallery and collections',
    colorClass: 'bg-green-600 text-white hover:bg-green-700',
    // globe
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.75 5.6 3.75 9s-1.25 6.4-3.75 9c-2.5-2.6-3.75-5.6-3.75-9S9.5 5.6 12 3z" />
      </>
    ),
  },
  {
    value: 'COLLECTION_ONLY',
    label: 'Collection only',
    hint: 'hidden from the gallery, shown inside its collections',
    colorClass: 'bg-blue-600 text-white hover:bg-blue-700',
    // stacked photos
    icon: (
      <>
        <rect x="7" y="7" width="13" height="13" rx="2" />
        <path d="M4 16V6a2 2 0 012-2h10" />
      </>
    ),
  },
  {
    value: 'PRIVATE',
    label: 'Private',
    hint: 'hidden everywhere on the public site',
    colorClass: 'bg-gray-700 text-white hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500',
    // lock
    icon: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </>
    ),
  },
];

export default function VisibilityMenu({ visibility, onChange, disabled, className = '', size = 'md' }: VisibilityMenuProps) {
  const index = Math.max(0, VISIBILITY_OPTIONS.findIndex((option) => option.value === visibility));
  const current = VISIBILITY_OPTIONS[index];
  const next = VISIBILITY_OPTIONS[(index + 1) % VISIBILITY_OPTIONS.length];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(next.value);
      }}
      title={`${current.label} — ${current.hint}. Click for ${next.label}.`}
      aria-label={`Visibility: ${current.label}. Click to change to ${next.label}.`}
      className={`${size === 'sm' ? 'p-1 rounded-md' : 'p-1.5 rounded-lg'} shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${current.colorClass} ${className}`}
    >
      <svg
        className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        {current.icon}
      </svg>
    </button>
  );
}
