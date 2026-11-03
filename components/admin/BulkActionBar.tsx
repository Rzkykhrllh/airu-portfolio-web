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

const darkSelect =
  'h-9 pl-3 pr-8 rounded-lg text-sm bg-white/10 hover:bg-white/15 text-white border-0 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-40 appearance-none bg-no-repeat bg-[length:14px] bg-[right_0.55rem_center] bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27%23ffffff%27%3E%3Cpath%20fill-rule%3D%27evenodd%27%20d%3D%27M5.23%207.21a.75.75%200%20011.06.02L10%2011.17l3.71-3.94a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%27%2F%3E%3C%2Fsvg%3E")] cursor-pointer [&>option]:text-gray-900';

/**
 * Floating action bar shown while photos are selected in the admin Photos
 * list (grid or list). Applies one change to many photos at once instead of
 * opening each one — pinned to the bottom of the viewport so it's always in
 * reach while scrolling a long library.
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
  if (selectedCount === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Click photos to select them — actions appear at the bottom.
      </p>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 lg:left-[calc(50%+7.5rem)] -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl">
      <div className="flex flex-wrap items-center gap-2 pl-4 pr-2 py-2 rounded-2xl bg-gray-900 dark:bg-gray-800 text-white shadow-2xl ring-1 ring-black/10">
        <span className="text-sm font-medium tabular-nums mr-auto">
          {selectedCount} selected
        </span>

        <select
          disabled={busy || collections.length === 0}
          value=""
          onChange={(e) => {
            if (e.target.value) onAddToCollection(e.target.value);
            e.target.value = '';
          }}
          className={darkSelect}
          aria-label="Add to collection"
        >
          <option value="" disabled>
            {collections.length === 0 ? 'No collections' : 'Add to collection'}
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
          className={darkSelect}
          aria-label="Set visibility"
        >
          <option value="" disabled>
            Visibility
          </option>
          <option value="PUBLIC">Public</option>
          <option value="COLLECTION_ONLY">Collection only</option>
          <option value="PRIVATE">Private</option>
        </select>

        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="h-9 px-3 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-40 transition-colors"
        >
          Delete
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onClear}
          title="Clear selection"
          aria-label="Clear selection"
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
