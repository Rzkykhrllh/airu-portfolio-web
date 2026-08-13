'use client';

import { useEffect, useState } from 'react';
import MasonryGrid, { DEFAULT_COLUMN_PREFS } from '@/components/gallery/MasonryGrid';
import { resolveAspectRatios } from '@/lib/resolveAspectRatio';
import { Photo } from '@/types';

interface RelatedPhotosProps {
  photos: Photo[];
  heading: string;
}

export default function RelatedPhotos({ photos, heading }: RelatedPhotosProps) {
  const [resolvedPhotos, setResolvedPhotos] = useState(photos);
  const [ratiosResolved, setRatiosResolved] = useState(false);

  // PhotoCard sizes its box from aspectRatio directly now (blur-up
  // placeholder), so this needs real ratios too — same fix as CollectionView.
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

  if (photos.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-8">
          {heading}
        </h2>
        <MasonryGrid photos={resolvedPhotos} columns={DEFAULT_COLUMN_PREFS} ratiosResolved={ratiosResolved} />
      </div>
    </div>
  );
}
