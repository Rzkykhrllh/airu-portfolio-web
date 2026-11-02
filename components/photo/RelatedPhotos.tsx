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
    // Rendered inside the photo page's container — no own max-width/padding.
    <section className="pt-24 md:pt-32">
      <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
        Keep looking
      </p>
      <h2 className="mt-4 mb-10 md:mb-12 font-display font-normal text-4xl md:text-5xl leading-none text-neutral-900 dark:text-neutral-100">
        {heading}.
      </h2>
      <MasonryGrid photos={resolvedPhotos} columns={DEFAULT_COLUMN_PREFS} ratiosResolved={ratiosResolved} />
    </section>
  );
}
