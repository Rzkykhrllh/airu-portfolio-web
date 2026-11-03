'use client';

import { PhotoVisibility } from '@/types';

interface VisibilitySelectProps {
  value: PhotoVisibility;
  onChange: (value: PhotoVisibility) => void;
}

/**
 * Full visibility `<select>` + explanation text used in the Add/Edit photo
 * forms. Not to be confused with `VisibilityMenu.tsx`, the small badge
 * dropdown used for quick-edit on grid/list cards — same underlying value,
 * different UI for a different context.
 */
export default function VisibilitySelect({ value, onChange }: VisibilitySelectProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Visibility</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PhotoVisibility)}
        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-colors"
      >
        <option value="PUBLIC">Public (Show everywhere)</option>
        <option value="COLLECTION_ONLY">Collection Only (Not in gallery)</option>
        <option value="PRIVATE">Private (Admin only)</option>
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {value === 'PUBLIC' && 'Visible in gallery, collections, and admin'}
        {value === 'COLLECTION_ONLY' && 'Visible in collections and admin only, not in main gallery'}
        {value === 'PRIVATE' && 'Only visible to admins, hidden from public'}
      </p>
    </div>
  );
}
