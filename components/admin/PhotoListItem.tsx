'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Photo, PhotoVisibility } from '@/types';
import { deletePhoto, updatePhoto } from '@/lib/api';
import { useToast } from '@/components/providers/ToastProvider';
import VisibilityMenu from './VisibilityMenu';
import FeaturedToggle from './FeaturedToggle';

interface PhotoListItemProps {
  photo: Photo;
  onPhotoClick: (photoId: string) => void;
  onPhotoDeleted?: () => void;
}

export default function PhotoListItem({ photo, onPhotoClick, onPhotoDeleted }: PhotoListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [featured, setFeatured] = useState(photo.featured);
  const [visibility, setVisibility] = useState(photo.visibility);
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  useEffect(() => setFeatured(photo.featured), [photo.featured]);
  useEffect(() => setVisibility(photo.visibility), [photo.visibility]);

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${photo.title || 'Untitled'}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      await deletePhoto(photo.id);
      toast.success('Photo deleted successfully!');
      onPhotoDeleted?.(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete photo:', error);
      toast.error('Failed to delete photo. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onPhotoClick(photo.id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPhotoClick(photo.id)}
        className="flex items-center gap-4 p-4 cursor-pointer bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
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
                <span className="flex items-center gap-1" title="Views (real visitor reads only)">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {photo.viewCount}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              {/* Visibility control */}
              <VisibilityMenu visibility={visibility} onChange={handleVisibilityChange} disabled={isUpdating} />

              {/* Featured toggle */}
              <FeaturedToggle featured={featured} onToggle={handleToggleFeatured} disabled={isUpdating} />

              {/* Delete button */}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Delete photo"
              >
                {isDeleting ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>

              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
