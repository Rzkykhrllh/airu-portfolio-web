'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Photo } from '@/types';

interface PhotoGridProps {
  photos: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <Link
          key={photo.id}
          href={`/admin/photos/${photo.id}`}
          className="group block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="relative aspect-square bg-gray-200 dark:bg-gray-900">
            <Image
              src={photo.src.medium}
              alt={photo.title || 'Photo'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            {photo.featured && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {photo.title || 'Untitled'}
            </h3>
            {photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {photo.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {photo.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-gray-500 dark:text-gray-400 text-xs">
                    +{photo.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
