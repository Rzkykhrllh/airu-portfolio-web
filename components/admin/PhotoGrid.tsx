'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Photo } from '@/types';
import { deletePhoto } from '@/lib/api';
import { useToast } from '@/components/providers/ToastProvider';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoDeleted?: () => void;
}

export default function PhotoGrid({ photos, onPhotoDeleted }: PhotoGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();

  const handleDelete = async (e: React.MouseEvent, photoId: string, photoTitle: string) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${photoTitle || 'Untitled'}"?`)) {
      return;
    }

    setDeletingId(photoId);

    try {
      await deletePhoto(photoId);
      toast.success('Photo deleted successfully!');
      onPhotoDeleted?.(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete photo:', error);
      toast.error('Failed to delete photo. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group">
          <Link
            href={`/admin/photos/${photo.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
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

              {/* Delete button - shows on hover */}
              <button
                onClick={(e) => handleDelete(e, photo.id, photo.title || '')}
                disabled={deletingId === photo.id}
                className="absolute top-2 left-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                title="Delete photo"
              >
                {deletingId === photo.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
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
        </div>
      ))}
    </div>
  );
}
