'use client';

import { useEffect, useRef, useState } from 'react';
import { PhotoVisibility } from '@/types';

interface VisibilityMenuProps {
  visibility: PhotoVisibility;
  onChange: (visibility: PhotoVisibility) => void;
  disabled?: boolean;
  className?: string;
}

const VISIBILITY_OPTIONS: { value: PhotoVisibility; label: string; badgeClass: string }[] = [
  {
    value: 'PUBLIC',
    label: 'Public',
    badgeClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
  {
    value: 'COLLECTION_ONLY',
    label: 'Collection',
    badgeClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  },
  {
    value: 'PRIVATE',
    label: 'Private',
    badgeClass: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  },
];

export default function VisibilityMenu({ visibility, onChange, disabled, className = '' }: VisibilityMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = VISIBILITY_OPTIONS.find((option) => option.value === visibility) ?? VISIBILITY_OPTIONS[0];

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setOpen((o) => !o);
        }}
        disabled={disabled}
        className={`px-2 py-1 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${current.badgeClass}`}
        title="Change visibility"
      >
        {current.label}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1"
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                if (option.value !== visibility) onChange(option.value);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                option.value === visibility
                  ? 'font-semibold text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {option.label}
              {option.value === visibility && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
