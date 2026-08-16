'use client';

import { Collection, PhotoVisibility } from '@/types';

interface BulkActionBarProps {
  selectedCount: number;
  collections: Collection[];
  busy: boolean;
  onAddToCollection: (collectionId: string) => void;
  onSetVisibility: (visibility: PhotoVisibility) => void;
  onDelete: () => void;
  onClear: () => void;
}

/**
 * Sticky action bar shown when one or more photos are selected in the admin
 * Photos list (grid or list view). Lets the admin apply a change to many
 * photos at once instead of opening each one individually — the main pain
 * point once the library grew past a few hundred photos.
 */
export default function BulkActionBar({
  selectedCount,
  collections,
  busy,
  onAddToCollection,
  onSetVisibility,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg">
      <span className="font-medium">
        {selectedCount} {selectedCount === 1 ? 'photo' : 'photos'} selected
      </span>

      <div className="flex flex-wrap items-center gap-2 ml-auto">
        <select
          disabled={busy || collections.length === 0}
          value=""
          onChange={(e) => {
            if (e.target.value) onAddToCollection(e.target.value);
            e.target.value = '';
          }}
          className="px-3 py-1.5 rounded-md text-sm bg-white text-gray-900 disabled:opacity-50"
        >
          <option value="" disabled>
            {collections.length === 0 ? 'No collections' : 'Add to collection...'}
          </option>
          {collections.map((col) => (
            <option key={col.id} value={col.id}>
              {col.title}
            </option>
          ))}
        </select>

        <select
          disabled={busy}
          value=""
          onChange={(e) => {
            if (e.target.value) onSetVisibility(e.target.value as PhotoVisibility);
            e.target.value = '';
          }}
          className="px-3 py-1.5 rounded-md text-sm bg-white text-gray-900 disabled:opacity-50"
        >
          <option value="" disabled>
            Set visibility...
          </option>
          <option value="PUBLIC">Public</option>
          <option value="COLLECTION_ONLY">Collection Only</option>
          <option value="PRIVATE">Private</option>
        </select>

        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          Delete
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onClear}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
