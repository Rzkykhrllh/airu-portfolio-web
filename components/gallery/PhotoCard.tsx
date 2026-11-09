'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Photo } from '@/types';
import {
  HERO_ATTR,
  arrived,
  canMorph,
  claim,
  clearNames,
  getActiveId,
  isPending,
  morph,
  name,
  setActive,
} from '@/lib/photoTransition';

interface PhotoCardProps {
  photo: Photo;
  priority?: boolean;
  collectionSlug?: string;
  /** Layout is final (columns packed) — safe to be a morph destination. */
  settled?: boolean;
}

export default function PhotoCard({ photo, priority = false, collectionSlug, settled = true }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const photoUrl = collectionSlug
    ? `/photo/${photo.id}?collection=${collectionSlug}`
    : `/photo/${photo.id}`;

  // Back from this photo's page: become the morph destination, but only once
  // the grid layout is final and the card is actually on screen (otherwise the
  // hero would fly off to some invisible spot — a plain fade is better).
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!settled || !box || !isPending() || getActiveId() !== photo.id) return;
    claim();
    // Wait a tick: the router restores the grid's scroll position after this
    // commit, and only then do we know whether the card is on screen. (Not
    // requestAnimationFrame — rendering is paused while a view transition
    // waits for its update, so a frame callback would never run in time.)
    const tick = window.setTimeout(() => {
      const r = box.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) {
        arrived();
        return;
      }
      name(box);
      const img = imgRef.current;
      const ready = img?.complete ? Promise.resolve() : img?.decode?.() ?? Promise.resolve();
      ready.catch(() => {}).finally(arrived);
    }, 30);
    return () => window.clearTimeout(tick);
  }, [settled, photo.id]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || !canMorph()) return;
    e.preventDefault();
    clearNames();
    name(boxRef.current);
    // Hand the already-decoded thumbnail to the photo page so the hero has a
    // sharp image in its first frame instead of a blur.
    setActive(photo.id, imgRef.current?.currentSrc || null, window.location.pathname + window.location.search);
    morph(() => router.push(photoUrl));
  };

  return (
    <Link href={photoUrl} onClick={handleClick} className="block relative group w-full">
      <div
        ref={boxRef}
        {...{ [HERO_ATTR]: '' }}
        className="relative overflow-hidden bg-gray-100 dark:bg-gray-900 w-full"
        style={{ aspectRatio: `1 / ${photo.aspectRatio}` }}
      >
        {/* Blurred preview — reuses the thumbnail already fetched for aspect-ratio probing, so it's free */}
        <img
          src={photo.src.thumbnail}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover scale-110 blur-xl transition-opacity duration-500 ${
            loaded ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <Image
          ref={imgRef}
          src={photo.src.medium}
          alt={photo.title || 'Photograph by Airu'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] motion-reduce:transition-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
          priority={priority}
          onLoad={() => setLoaded(true)}
        />

        {/* Desktop only: a light bottom fade + small caption on hover. Mobile
            shows the photo clean — no permanent overlay. */}
        {(photo.title || photo.location) && (
          <div
            className="absolute inset-x-0 bottom-0 hidden md:block opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none pointer-events-none bg-gradient-to-t from-black/45 via-black/10 to-transparent"
          >
            <div className="px-4 pb-3.5 pt-12">
              {photo.title && (
                <p className="text-white text-[0.8125rem] leading-snug line-clamp-1">{photo.title}</p>
              )}
              {photo.location && (
                <p className="mt-1 text-[0.625rem] uppercase tracking-[0.2em] text-white/70 line-clamp-1">
                  {photo.location}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
