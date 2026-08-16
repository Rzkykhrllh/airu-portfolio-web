'use client';

import { Photo } from '@/types';
import PhotoListItem from './PhotoListItem';

interface PhotoListProps {
  photos: Photo[];
  onPhotoClick: (photoId: string) => void;
  onPhotoDeleted?: () => void;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (photoId: string) => void;
}

export default function PhotoList({
  photos,
  onPhotoClick,
  onPhotoDeleted,
  selectMode = false,
  selectedIds,
  onToggleSelect,
}: PhotoListProps) {
  return (
    <div className="space-y-3">
      {photos.map((photo) => (
        <PhotoListItem
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
