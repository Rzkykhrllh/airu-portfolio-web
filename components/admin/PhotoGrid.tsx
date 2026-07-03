'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Photo, PhotoVisibility } from '@/types';
import { deletePhoto, updatePhoto } from '@/lib/api';
import { useToast } from '@/components/providers/ToastProvider';
import VisibilityMenu from './VisibilityMenu';
import FeaturedToggle from './FeaturedToggle';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoDeleted?: () => void;
}

export default function PhotoGrid({ photos, onPhotoDeleted }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <PhotoGridItem key={photo.id} photo={photo} onPhotoDeleted={onPhotoDeleted} />
      ))}
    </div>
  );
}

interface PhotoGridItemProps {
  photo: Photo;
  onPhotoDeleted?: () => void;
}

function PhotoGridItem({ photo, onPhotoDeleted }: PhotoGridItemProps) {
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [featured, setFeatured] = useState(photo.featured);
  const [visibility, setVisibility] = useState(photo.visibility);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => setFeatured(photo.featured), [photo.featured]);
  useEffect(() => setVisibility(photo.visibility), [photo.visibility]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${photo.title || 'Untitled'}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      await deletePhoto(photo.id);
      toast.success('Photo deleted successfully!');
      onPhotoDeleted?.();
    } catch (error) {
      console.error('Failed to delete photo:', error);
      toast.error('Failed to delete photo. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async () => {
    const next = !featured;
    setFeatured(next);
    setIsUpdating(true);

    try {
      await updatePhoto(photo.id, { featured: next });
    } catch (error) {
      console.error('Failed to update featured status:', error);
      setFeatured(!next);
      toast.error('Failed to update featured status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVisibilityChange = async (nextVisibility: PhotoVisibility) => {
    const prev = visibility;
    setVisibility(nextVisibility);
    setIsUpdating(true);

    try {
      await updatePhoto(photo.id, { visibility: nextVisibility });
    } catch (error) {
      console.error('Failed to update visibility:', error);
      setVisibility(prev);
      toast.error('Failed to update visibility.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative group">
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
          {/* Visibility + Featured controls */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            <VisibilityMenu visibility={visibility} onChange={handleVisibilityChange} disabled={isUpdating} />
            <FeaturedToggle
              featured={featured}
              onToggle={handleToggleFeatured}
              disabled={isUpdating}
              className="bg-white/90 dark:bg-gray-900/90 shadow-sm"
            />
          </div>

          {/* Delete button - shows on hover */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 left-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="Delete photo"
          >
            {isDeleting ? (
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
  );
}
