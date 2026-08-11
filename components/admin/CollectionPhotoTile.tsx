'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Photo, PhotoVisibility } from '@/types';
import { updatePhoto } from '@/lib/api';
import { useToast } from '@/components/providers/ToastProvider';
import VisibilityMenu from './VisibilityMenu';
import FeaturedToggle from './FeaturedToggle';

interface CollectionPhotoTileProps {
  photo: Photo;
  collectionId: string;
  isCover?: boolean;
  onRemoved: (photoId: string) => void;
  onEdit: (photoId: string) => void;
}

export default function CollectionPhotoTile({ photo, collectionId, isCover, onRemoved, onEdit }: CollectionPhotoTileProps) {
  const toast = useToast();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  const [featured, setFeatured] = useState(photo.featured);
  const [visibility, setVisibility] = useState(photo.visibility);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => setFeatured(photo.featured), [photo.featured]);
  useEffect(() => setVisibility(photo.visibility), [photo.visibility]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
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

  const handleRemove = async () => {
    if (!confirm(`Remove "${photo.title || 'Untitled'}" from this collection?`)) return;

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
      toast.error('Failed to remove photo from collection.');
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
          <span className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-medium bg-black/70 text-white">
            Cover
          </span>
        )}

        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute bottom-2 left-2 p-1.5 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zM7 10a1 1 0 11-2 0 1 1 0 012 0zM7 16a1 1 0 11-2 0 1 1 0 012 0zM15 4a1 1 0 11-2 0 1 1 0 012 0zM15 10a1 1 0 11-2 0 1 1 0 012 0zM15 16a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>

        {/* Edit button */}
        <button
          type="button"
          onClick={() => onEdit(photo.id)}
          className="absolute top-2 left-2 p-1.5 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit photo info"
        >
          <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          title="Remove from collection"
        >
          {isRemoving ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* Featured + Visibility controls */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <VisibilityMenu visibility={visibility} onChange={handleVisibilityChange} disabled={isUpdating} />
          <FeaturedToggle
            featured={featured}
            onToggle={handleToggleFeatured}
            disabled={isUpdating}
            className="bg-white/90 dark:bg-gray-900/90 shadow-sm"
          />
        </div>
      </div>
      {photo.title && (
        <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 truncate">{photo.title}</p>
      )}
    </div>
  );
}
