'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Photo } from '@/types';
import { deletePhoto } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirmDialog } from '@/components/providers/ConfirmDialogProvider';
import { useUndoDelete } from '@/components/providers/UndoDeleteProvider';
import { usePhotoQuickEdit } from '@/hooks/usePhotoQuickEdit';
import VisibilityMenu from './VisibilityMenu';
import FeaturedToggle from './FeaturedToggle';

interface PhotoListItemProps {
  photo: Photo;
  onPhotoClick: (photoId: string) => void;
  onPhotoDeleted?: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (photoId: string) => void;
}

export default function PhotoListItem({
  photo,
  onPhotoClick,
  onPhotoDeleted,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: PhotoListItemProps) {
  const [isPendingDelete, setIsPendingDelete] = useState(false);
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const undoDelete = useUndoDelete();
  const { featured, visibility, isUpdating, toggleFeatured, changeVisibility } = usePhotoQuickEdit(photo);

  const handleCardClick = () => {
    if (selectMode) {
      onToggleSelect?.(photo.id);
    } else {
      onPhotoClick(photo.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();

    const ok = await confirmDialog({
      title: 'Delete photo?',
      message: `Delete "${photo.title || 'Untitled'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    // Hides immediately; the actual delete only fires after the undo grace
    // period (see UndoDeleteProvider) so a misclick is easy to walk back.
    setIsPendingDelete(true);
    undoDelete.requestDelete({
      key: photo.id,
      message: `"${photo.title || 'Untitled'}" deleted.`,
      commit: async () => {
        try {
          await deletePhoto(photo.id);
          onPhotoDeleted?.(); // Refresh the list
        } catch (error) {
          console.error('Failed to delete photo:', error);
          toast.error(error instanceof ApiError ? error.message : 'Failed to delete photo. Please try again.');
          setIsPendingDelete(false);
        }
      },
      undo: () => setIsPendingDelete(false),
    });
  };

  if (isPendingDelete) return null;

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
        className={`flex items-center gap-4 p-4 cursor-pointer bg-white dark:bg-gray-800 rounded-lg border hover:shadow-md transition-shadow ${
          selectMode && selected
            ? 'border-blue-500 ring-2 ring-blue-500'
            : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        {selectMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(photo.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        )}

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
              <VisibilityMenu visibility={visibility} onChange={changeVisibility} disabled={isUpdating} />

              {/* Featured toggle */}
              <FeaturedToggle featured={featured} onToggle={toggleFeatured} disabled={isUpdating} />

              {/* Delete button */}
              {!selectMode && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

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
