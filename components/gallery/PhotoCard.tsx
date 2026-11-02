'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  priority?: boolean;
  collectionSlug?: string;
}

export default function PhotoCard({ photo, priority = false, collectionSlug }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const photoUrl = collectionSlug
    ? `/photo/${photo.id}?collection=${collectionSlug}`
    : `/photo/${photo.id}`;

  return (
    <Link href={photoUrl} className="block relative group w-full">
      <div
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
