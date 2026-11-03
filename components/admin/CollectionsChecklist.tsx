'use client';

import { Collection } from '@/types';

interface CollectionsChecklistProps {
  collections: Collection[];
  isLoading: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/** Collections checkbox list shared by the Add/Edit photo forms. */
export default function CollectionsChecklist({
  collections,
  isLoading,
  selectedIds,
  onChange,
}: CollectionsChecklistProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Collections</label>
      {isLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading collections...</div>
      ) : collections.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">No collections available</div>
      ) : (
        <div className="space-y-2">
          {collections.map((col) => (
            <label key={col.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedIds.includes(col.id)}
                onChange={(e) => {
                  onChange(
                    e.target.checked
                      ? [...selectedIds, col.id]
                      : selectedIds.filter((id) => id !== col.id)
                  );
                }}
                className="w-4 h-4 rounded accent-gray-900 dark:accent-white"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{col.title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
