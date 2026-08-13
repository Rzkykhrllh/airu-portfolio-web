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
          className={`object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          priority={priority}
          onLoad={() => setLoaded(true)}
        />

        {/* Desktop: hover-revealed overlay — CSS only, no JS */}
        <div
          className="absolute inset-0 hidden md:flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-[200ms] ease-out motion-reduce:duration-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, transparent 72%)' }}
        >
          <div className="px-4 pb-4 pt-10 w-full">
            {photo.title && (
              <p className="text-white text-sm font-medium leading-snug mb-0.5 line-clamp-2">
                {photo.title}
              </p>
            )}
            {photo.location && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.58)' }}>
                {photo.location}
              </p>
            )}
          </div>
        </div>

        {/* Mobile: permanent subtle bottom fade with location only */}
        {photo.location && (
          <div
            className="absolute inset-x-0 bottom-0 md:hidden pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 65%)' }}
          >
            <p className="px-3 pb-2.5 pt-8 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {photo.location}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
