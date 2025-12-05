'use client';

import { Photo } from '@/types';
import PhotoListItem from './PhotoListItem';

interface PhotoListProps {
  photos: Photo[];
}

export default function PhotoList({ photos }: PhotoListProps) {
  return (
    <div className="space-y-3">
      {photos.map((photo) => (
        <PhotoListItem key={photo.id} photo={photo} />
      ))}
    </div>
  );
}
