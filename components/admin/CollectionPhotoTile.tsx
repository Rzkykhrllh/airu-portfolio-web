'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Photo } from '@/types';
import { updatePhoto } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirmDialog } from '@/components/providers/ConfirmDialogProvider';
import { usePhotoQuickEdit } from '@/hooks/usePhotoQuickEdit';
import VisibilityMenu from './VisibilityMenu';
import FeaturedToggle from './FeaturedToggle';

interface CollectionPhotoTileProps {
  photo: Photo;
  collectionId: string;
  isCover?: boolean;
  onRemoved: (photoId: string) => void;
  onEdit: (photoId: string) => void;
  /** Dense grid (zoomed out): smaller controls, secondary ones only on hover. */
  compact?: boolean;
}

export default function CollectionPhotoTile({ photo, collectionId, isCover, onRemoved, onEdit, compact = false }: CollectionPhotoTileProps) {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  const { featured, visibility, isUpdating, toggleFeatured, changeVisibility } = usePhotoQuickEdit(photo);
  const [isRemoving, setIsRemoving] = useState(false);

  // Control sizing. Full class names only (Tailwind can't see built strings).
  // Compact = dense zoomed-out grid: smaller buttons tucked into the corners,
  // and only the visibility state (plus a filled featured star) stays visible —
  // drag / edit / remove / empty star show on hover.
  const c = compact
    ? {
        tl: 'top-1 left-1',
        tr: 'top-1 right-1',
        bl: 'bottom-1 left-1',
        br: 'bottom-1 right-1',
        btn: 'p-1 rounded-md',
        icon: 'w-3 h-3',
        star: 'w-3.5 h-3.5',
        hover: 'opacity-0 group-hover:opacity-100 transition-opacity',
      }
    : {
        tl: 'top-2 left-2',
        tr: 'top-2 right-2',
        bl: 'bottom-2 left-2',
        br: 'bottom-2 right-2',
        btn: 'p-1.5 rounded-lg',
        icon: 'w-4 h-4',
        star: 'w-5 h-5',
        hover: '',
      };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleRemove = async () => {
    const ok = await confirmDialog({
      title: 'Remove from collection?',
      message: `Remove "${photo.title || 'Untitled'}" from this collection?`,
      confirmLabel: 'Remove',
    });
    if (!ok) return;

    setIsRemoving(true);
    const remainingCollectionIds = photo.collections
      .filter((c) => c.id !== collectionId)
      .map((c) => c.id);

    try {
      await updatePhoto(photo.id, { collections: remainingCollectionIds });
      toast.success('Photo removed from collection.');
      onRemoved(photo.id);
    } catch (error) {
      console.error('Failed to remove photo from collection:', error);
      toast.error(error instanceof ApiError ? error.message : 'Failed to remove photo from collection.');
      setIsRemoving(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group touch-none">
      <div className="relative aspect-square bg-gray-200 dark:bg-gray-900 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
        <Image
          src={photo.src.medium}
          alt={photo.title || 'Photo'}
          fill
          className="object-cover"
          sizes="200px"
        />

        {isCover && (
          <span
            className={`absolute left-1/2 -translate-x-1/2 rounded font-medium bg-black/70 text-white ${
              compact ? 'top-1 px-1 text-[8px] leading-3' : 'top-2 px-2 py-0.5 text-[10px]'
            }`}
          >
            Cover
          </span>
        )}

        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`absolute ${c.bl} ${c.btn} ${c.hover} bg-white/90 dark:bg-gray-900/90 shadow-sm cursor-grab active:cursor-grabbing touch-none`}
          title="Drag to reorder"
        >
          <svg className={`${c.icon} text-gray-600 dark:text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zM7 10a1 1 0 11-2 0 1 1 0 012 0zM7 16a1 1 0 11-2 0 1 1 0 012 0zM15 4a1 1 0 11-2 0 1 1 0 012 0zM15 10a1 1 0 11-2 0 1 1 0 012 0zM15 16a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>

        {/* Edit button */}
        <button
          type="button"
          onClick={() => onEdit(photo.id)}
          className={`absolute ${c.tl} ${c.btn} bg-white/90 dark:bg-gray-900/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity`}
          title="Edit photo info"
        >
          <svg className={`${c.icon} text-gray-700 dark:text-gray-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving}
          className={`absolute ${c.tr} ${c.btn} bg-red-600 hover:bg-red-700 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50`}
          title="Remove from collection"
        >
          {isRemoving ? (
            <svg className={`${c.icon} animate-spin`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className={c.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* Featured + Visibility controls */}
        <div className={`absolute ${c.br} flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
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
            iconClassName={c.star}
            className={`bg-white/90 dark:bg-gray-900/90 shadow-sm ${compact ? '!p-0.5' : ''} ${
              compact && !featured ? c.hover : ''
            }`}
          />
        </div>
      </div>
      {photo.title && (
        <p className={`truncate text-gray-600 dark:text-gray-400 ${compact ? 'mt-1 text-[10px]' : 'mt-1.5 text-xs'}`}>
          {photo.title}
        </p>
      )}
    </div>
  );
}
