'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MasonryGrid, { ColumnPrefs, DEFAULT_COLUMN_PREFS } from '@/components/gallery/MasonryGrid';
import ZoomControls from '@/components/gallery/ZoomControls';
import { resolveAspectRatios } from '@/lib/resolveAspectRatio';
import { Photo, Collection } from '@/types';

interface CollectionViewProps {
  collection: Collection;
  photos: Photo[];
  slug: string;
}

export default function CollectionView({ collection, photos, slug }: CollectionViewProps) {
  const [columnPrefs, setColumnPrefs] = useState<ColumnPrefs>(DEFAULT_COLUMN_PREFS);

  // Same fix as GalleryView — see lib/resolveAspectRatio.ts. `photos` here
  // is a fixed list (no infinite scroll), so this only ever runs once per
  // collection page; large collections (e.g. one with 181 photos) hit the
  // exact same placeholder-ratio column-imbalance bug otherwise.
  const [resolvedPhotos, setResolvedPhotos] = useState<Photo[]>(photos);
  const [ratiosResolved, setRatiosResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRatiosResolved(false);
    resolveAspectRatios(photos).then((resolved) => {
      if (cancelled) return;
      setResolvedPhotos(resolved);
      setRatiosResolved(true);
    });
    return () => {
      cancelled = true;
    };
  }, [photos]);

  return (
    <>
      <div className="pt-10 pb-7 border-b border-gray-200 dark:border-white/10 mb-0">
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4"
        >
          ← Collections
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {collection.title}
          </h1>
          <div className="flex items-center gap-4">
            <ZoomControls onChange={setColumnPrefs} />
            {photos.length > 0 && (
              <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
                {photos.length} photographs
              </span>
            )}
          </div>
        </div>
        {collection.description && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            {collection.description}
          </p>
        )}
      </div>

      <MasonryGrid
        photos={resolvedPhotos}
        columns={columnPrefs}
        collectionSlug={slug}
        ratiosResolved={ratiosResolved}
      />
    </>
  );
}
