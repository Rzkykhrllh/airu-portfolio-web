'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Photo } from '@/types';

interface PhotoListItemProps {
  photo: Photo;
}

export default function PhotoListItem({ photo }: PhotoListItemProps) {
  return (
    <Link
      href={`/admin/photos/${photo.id}`}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-gray-900 rounded overflow-hidden">
        <Image
          src={photo.src.thumbnail}
          alt={photo.title || 'Photo'}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {photo.title || 'Untitled'}
            </h3>
            {photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {photo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
              {photo.location && <span>{photo.location}</span>}
              {photo.capturedAt && (
                <span>
                  {new Date(photo.capturedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {photo.exif?.camera && <span>{photo.exif.camera}</span>}
              {photo.exif?.lens && <span>{photo.exif.lens}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            {photo.featured && (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
