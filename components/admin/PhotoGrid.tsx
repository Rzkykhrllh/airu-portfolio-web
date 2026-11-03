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
import { zoomGridClass, zoomGridStyle } from './GridZoom';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photoId: string) => void;
  onPhotoDeleted?: () => void;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (photoId: string) => void;
  /** Columns from the page's zoom slider (sm and up). */
  columns?: number;
}

export default function PhotoGrid({
  photos,
  onPhotoClick,
  onPhotoDeleted,
  selectMode = false,
  selectedIds,
  onToggleSelect,
  columns = 4,
}: PhotoGridProps) {
  return (
    <div
      className={`${zoomGridClass(2)} ${columns >= 7 ? 'gap-2' : 'gap-4'}`}
      style={zoomGridStyle(columns)}
    >
      {photos.map((photo) => (
        <PhotoGridItem
          key={photo.id}
          photo={photo}
          onPhotoClick={onPhotoClick}
          onPhotoDeleted={onPhotoDeleted}
          selectMode={selectMode}
          selected={selectedIds?.has(photo.id) ?? false}
          onToggleSelect={onToggleSelect}
          compact={columns >= 7}
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
  compact?: boolean;
}

function PhotoGridItem({
  photo,
  onPhotoClick,
  onPhotoDeleted,
  selectMode = false,
  selected = false,
  onToggleSelect,
  compact = false,
}: PhotoGridItemProps) {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const undoDelete = useUndoDelete();
  const [isPendingDelete, setIsPendingDelete] = useState(false);
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

    // Hides immediately; the actual delete only fires after the undo grace
    // period (see UndoDeleteProvider) so a misclick is easy to walk back.
    setIsPendingDelete(true);
    undoDelete.requestDelete({
      key: photo.id,
      message: `"${photo.title || 'Untitled'}" deleted.`,
      commit: async () => {
        try {
          await deletePhoto(photo.id);
          onPhotoDeleted?.();
        } catch (error) {
          console.error('Failed to delete photo:', error);
          toast.error(error instanceof ApiError ? error.message : 'Failed to delete photo. Please try again.');
          setIsPendingDelete(false);
        }
      },
      undo: () => setIsPendingDelete(false),
    });
  };

  const handleCardClick = () => {
    if (selectMode) {
      onToggleSelect?.(photo.id);
    } else {
      onPhotoClick(photo.id);
    }
  };

  if (isPendingDelete) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
      className="group cursor-pointer focus:outline-none"
    >
      <div
        className={`relative aspect-square overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 transition-shadow ${
          selectMode && selected
            ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white ring-offset-[var(--background)]'
            : 'group-focus-visible:ring-2 group-focus-visible:ring-gray-900/30'
        }`}
      >
        <Image
          src={photo.src.medium}
          alt={photo.title || 'Photo'}
          fill
          className={`object-cover transition-transform duration-500 ease-out ${selectMode ? '' : 'group-hover:scale-[1.03]'}`}
          sizes="(max-width: 640px) 50vw, 25vw"
        />

        {/* Hover scrim keeps the controls legible on bright photos */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {selectMode && (
          <span
            className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 inline-flex items-center justify-center transition-colors ${
              selected ? 'bg-gray-900 border-gray-900 dark:bg-white dark:border-white' : 'bg-white/70 border-white'
            }`}
            aria-hidden
          >
            {selected && (
              <svg className="w-3 h-3 text-white dark:text-gray-900" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        )}

        {/* Delete (hover) */}
        {!selectMode && (
          <button
            onClick={handleDelete}
            className={`absolute ${compact ? 'top-1 right-1 p-1' : 'top-2 right-2 p-1.5'} rounded-lg bg-white/90 dark:bg-gray-900/90 text-gray-500 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity`}
            title="Delete photo"
            aria-label="Delete photo"
          >
            <svg className={compact ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        {/* Visibility + featured */}
        <div className={`absolute ${compact ? 'bottom-1 right-1 gap-0.5' : 'bottom-2 right-2 gap-1'} flex items-center`}>
          <VisibilityMenu
            visibility={visibility}
            onChange={changeVisibility}
            disabled={isUpdating}
            size={compact ? 'sm' : 'md'}
          />
          <FeaturedToggle
            featured={featured}
            onToggle={toggleFeatured}
            disabled={isUpdating}
            iconClassName={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'}
            className={`bg-white/90 dark:bg-gray-900/90 shadow-sm ${compact ? '!p-0.5' : ''} ${
              !featured ? 'opacity-0 group-hover:opacity-100' : ''
            }`}
          />
        </div>
      </div>

      {!compact && (
        <div className="pt-2 px-0.5 flex items-baseline justify-between gap-2">
          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{photo.title || 'Untitled'}</p>
          <span
            className="flex items-center gap-1 shrink-0 text-xs tabular-nums text-gray-400"
            title="Views (real visitor reads only)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {photo.viewCount}
          </span>
        </div>
      )}
      {!compact && (photo.location || photo.tags.length > 0) && (
        <p className="px-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
          {[photo.location, photo.tags.slice(0, 3).join(', ')].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}
