'use client';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onChange: (view: 'grid' | 'list') => void;
}

const OPTIONS: { value: 'grid' | 'list'; label: string; path: string }[] = [
  {
    value: 'grid',
    label: 'Grid view',
    path: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
  },
  { value: 'list', label: 'List view', path: 'M4 6h16M4 12h16M4 18h16' },
];

// Segmented control, same language as the rest of the admin toolbar.
export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
      {OPTIONS.map((option) => {
        const active = view === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            title={option.label}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
              active
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={option.path} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
