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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibility</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PhotoVisibility)}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
