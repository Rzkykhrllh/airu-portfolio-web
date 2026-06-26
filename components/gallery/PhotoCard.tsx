import Image from 'next/image';
import Link from 'next/link';
import { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  priority?: boolean;
  collectionSlug?: string;
}

export default function PhotoCard({ photo, priority = false, collectionSlug }: PhotoCardProps) {
  const photoUrl = collectionSlug
    ? `/photo/${photo.id}?collection=${collectionSlug}`
    : `/photo/${photo.id}`;

  return (
    <Link href={photoUrl} className="block relative group w-full">
      {/* bg-gray-100/dark:bg-gray-900 shows while image loads */}
      <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-900 w-full">
        <Image
          src={photo.src.medium}
          alt={photo.title || 'Photograph by Airu'}
          width={1600}
          height={Math.round(1600 * photo.aspectRatio)}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="w-full h-auto block"
          priority={priority}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmQAAAA"
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
