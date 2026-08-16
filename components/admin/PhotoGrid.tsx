'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Photo } from '@/types';
import { deletePhoto } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirmDialog } from '@/components/providers/ConfirmDialogProvider';
import { usePhotoQuickEdit } from '@/hooks/usePhotoQuickEdit';
import VisibilityMenu from './VisibilityMenu';
import FeaturedToggle from './FeaturedToggle';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photoId: string) => void;
  onPhotoDeleted?: () => void;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (photoId: string) => void;
}

export default function PhotoGrid({
  photos,
  onPhotoClick,
  onPhotoDeleted,
  selectMode = false,
  selectedIds,
  onToggleSelect,
}: PhotoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <PhotoGridItem
          key={photo.id}
          photo={photo}
          onPhotoClick={onPhotoClick}
          onPhotoDeleted={onPhotoDeleted}
          selectMode={selectMode}
          selected={selectedIds?.has(photo.id) ?? false}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

interface PhotoGridItemProps {
  photo: Photo;
  onPhotoClick: (photoId: string) => void;
  onPhotoDeleted?: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (photoId: string) => void;
}

function PhotoGridItem({
  photo,
  onPhotoClick,
  onPhotoDeleted,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: PhotoGridItemProps) {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [isDeleting, setIsDeleting] = useState(false);
  const { featured, visibility, isUpdating, toggleFeatured, changeVisibility } = usePhotoQuickEdit(photo);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const ok = await confirmDialog({
      title: 'Delete photo?',
      message: `Delete "${photo.title || 'Untitled'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    setIsDeleting(true);

    try {
      await deletePhoto(photo.id);
      toast.success('Photo deleted successfully!');
      onPhotoDeleted?.();
    } catch (error) {
      console.error('Failed to delete photo:', error);
      toast.error(error instanceof ApiError ? error.message : 'Failed to delete photo. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    if (selectMode) {
      onToggleSelect?.(photo.id);
    } else {
      onPhotoClick(photo.id);
    }
  };

  return (
    <div className="relative group">
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
        className={`block w-full text-left cursor-pointer bg-white dark:bg-gray-800 rounded-lg border overflow-hidden hover:shadow-lg transition-shadow ${
          selectMode && selected
            ? 'border-blue-500 ring-2 ring-blue-500'
            : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className="relative aspect-square bg-gray-200 dark:bg-gray-900">
          <Image
            src={photo.src.medium}
            alt={photo.title || 'Photo'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {selectMode && (
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect?.(photo.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          )}

          {/* Visibility + Featured controls */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            <VisibilityMenu visibility={visibility} onChange={changeVisibility} disabled={isUpdating} />
            <FeaturedToggle
              featured={featured}
              onToggle={toggleFeatured}
              disabled={isUpdating}
              className="bg-white/90 dark:bg-gray-900/90 shadow-sm"
            />
          </div>

          {/* Delete button - shows on hover */}
          {!selectMode && (
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
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {photo.title || 'Untitled'}
            </h3>
            <span
              className="flex items-center gap-1 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400"
              title="Views (real visitor reads only)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {photo.viewCount}
            </span>
          </div>
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
      </div>
    </div>
  );
}
