'use client';

import { Suspense } from 'react';
import PhotoDetailClient from './PhotoDetailClient';
import { Photo } from '@/types';

interface PhotoDetailClientWrapperProps {
  photo: Photo;
  nextPhotoId?: string;
  prevPhotoId?: string;
}

export default function PhotoDetailClientWrapper(props: PhotoDetailClientWrapperProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="relative w-full max-w-6xl h-[85vh] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    }>
      <PhotoDetailClient {...props} />
    </Suspense>
  );
}
