'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { leave } from '@/lib/pageLeave';
import { Collection, Photo } from '@/types';
import { photoYear } from '@/lib/format';
import { cropWrapperStyle } from '@/lib/coverCrop';
import type { CoverCrop } from '@/types';

// Blur-up cover — same thumbnail-probe + cross-fade pattern as PhotoCard,
// plus a slow hover zoom.
function CoverPhoto({
  photo,
  alt,
  priority,
  crop,
}: {
  photo: Photo;
  alt: string;
  priority: boolean;
  crop: CoverCrop | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const fit = crop ? 'object-fill' : 'object-cover';
  return (
    // Crop = wrapper sized to the crop rectangle; images fill it.
    <div className="absolute inset-0" style={crop ? cropWrapperStyle(crop) : undefined}>
      <img
        src={photo.src.thumbnail}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full ${fit} scale-110 blur-xl transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <Image
        src={photo.src.medium}
        alt={alt}
        fill
        priority={priority}
        // Same src + sizes as the collection grid's PhotoCard: the grid's
        // first tile (the cover) then reuses this cached file.
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`${fit} transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025] motion-reduce:transition-none ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function yearRange(photos: Photo[]): string | null {
  const years = photos.map(photoYear).filter((y): y is number => y !== null);
  if (years.length === 0) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? `${min}` : `${min}–${max}`;
}

interface CollectionCardProps {
  collection: Collection;
  index: number;
  priority?: boolean;
}

export default function CollectionCard({ collection, index, priority = false }: CollectionCardProps) {
  const photos = collection.photos || [];
  const cover = photos[0];
  // photos[] is visibility-filtered on public requests; photoCount (_count)
  // isn't, so it can include private photos. Prefer the visible length.
  const count = photos.length || collection.photoCount;
  const years = yearRange(photos);
  const number = String(index + 1).padStart(3, '0');
  const href = `/collections/${collection.slug}`;
  const router = useRouter();

  // Fetch the (force-dynamic) collection page on hover/touch.
  const warmed = useRef(false);
  const warm = () => {
    if (warmed.current) return;
    warmed.current = true;
    router.prefetch(href, { kind: 'full' } as Parameters<typeof router.prefetch>[1]);
  };

  // Fade this page out right away; the collection fades in as soon as it's here.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    leave(() => router.push(href));
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      onPointerEnter={warm}
      onTouchStart={warm}
      className="group block outline-none"
    >
      <div
        data-cursor="Open"
        className="relative w-full aspect-[3/2] overflow-hidden bg-neutral-200 dark:bg-neutral-900 group-focus-visible:outline group-focus-visible:outline-1 group-focus-visible:outline-offset-4 group-focus-visible:outline-neutral-900 dark:group-focus-visible:outline-neutral-100">
        {cover && (
          <CoverPhoto
            photo={cover}
            alt={cover.title || collection.title}
            priority={priority}
            crop={collection.coverCrop && collection.coverCrop.photoId === cover.id ? collection.coverCrop : null}
          />
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-[1.15] font-normal text-neutral-900 dark:text-neutral-100">
            {collection.title}
          </h2>
          <p className="mt-2 text-[0.6875rem] uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400 tabular-nums">
            {number}
            <span className="mx-2.5" aria-hidden="true">—</span>
            {count} {count === 1 ? 'photograph' : 'photographs'}
            {years && (
              <>
                <span className="mx-2.5" aria-hidden="true">·</span>
                {years}
              </>
            )}
          </p>
        </div>
        <svg
          className="mt-2 w-4 h-4 shrink-0 text-neutral-700 dark:text-neutral-300 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          aria-hidden="true"
        >
          <path d="M4 12L12 4M5.5 4H12v6.5" />
        </svg>
      </div>
    </Link>
  );
}
