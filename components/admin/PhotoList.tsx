'use client';

import { Photo } from '@/types';
import PhotoListItem from './PhotoListItem';

interface PhotoListProps {
  photos: Photo[];
  onPhotoClick: (photoId: string) => void;
  onPhotoDeleted?: () => void;
}

export default function PhotoList({ photos, onPhotoClick, onPhotoDeleted }: PhotoListProps) {
  return (
    <div className="space-y-3">
      {photos.map((photo) => (
        <PhotoListItem key={photo.id} photo={photo} onPhotoClick={onPhotoClick} onPhotoDeleted={onPhotoDeleted} />
      ))}
    </div>
  );
}
