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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Collections</label>
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
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{col.title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
