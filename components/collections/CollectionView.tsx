'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MasonryGrid, { ColumnPrefs, DEFAULT_COLUMN_PREFS } from '@/components/gallery/MasonryGrid';
import ZoomControls from '@/components/gallery/ZoomControls';
import { resolveAspectRatios } from '@/lib/resolveAspectRatio';
import { photoYear } from '@/lib/format';
import { Photo, Collection } from '@/types';

interface CollectionViewProps {
  collection: Collection;
  photos: Photo[];
  slug: string;
}

export default function CollectionView({ collection, photos, slug }: CollectionViewProps) {
  const [columnPrefs, setColumnPrefs] = useState<ColumnPrefs>(DEFAULT_COLUMN_PREFS);

  // Same fix as GalleryView — see lib/resolveAspectRatio.ts.
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

  const years = photos.map(photoYear).filter((y): y is number => y !== null);
  const span =
    years.length === 0
      ? null
      : Math.min(...years) === Math.max(...years)
        ? `${Math.min(...years)}`
        : `${Math.min(...years)}–${Math.max(...years)}`;

  const label = 'text-[0.6875rem] uppercase tracking-[0.22em] tabular-nums text-neutral-500 dark:text-neutral-400';

  return (
    <>
      <header className="pt-16 pb-12 md:pt-24 md:pb-16">
        <Link
          href="/collections"
          className={`${label} hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors`}
        >
          ← Collections
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h1 className="font-display font-normal text-5xl sm:text-6xl lg:text-[5rem] leading-[0.95] tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            {collection.title}.
          </h1>
          {photos.length > 0 && (
            <span className={`${label} pb-2`}>
              {photos.length} {photos.length === 1 ? 'photograph' : 'photographs'}
              {span && (
                <>
                  <span className="mx-2.5" aria-hidden="true">·</span>
                  {span}
                </>
              )}
            </span>
          )}
        </div>
        {collection.description && (
          <p className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
            {collection.description}
          </p>
        )}
      </header>

      <div className="flex justify-end pb-6 md:pb-8">
        <ZoomControls onChange={setColumnPrefs} />
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
