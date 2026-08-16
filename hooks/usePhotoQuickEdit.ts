'use client';

import { useEffect, useState } from 'react';
import { Photo, PhotoVisibility } from '@/types';
import { updatePhoto } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { useToast } from '@/components/providers/ToastProvider';

/**
 * Optimistic featured/visibility toggle logic shared by PhotoGrid,
 * PhotoListItem, and CollectionPhotoTile — previously copy-pasted
 * near-identically in all three (set state → updatePhoto → roll back +
 * toast on failure). Centralized here so a future fix only lands once.
 */
export function usePhotoQuickEdit(photo: Photo) {
  const toast = useToast();
  const [featured, setFeatured] = useState(photo.featured);
  const [visibility, setVisibility] = useState(photo.visibility);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => setFeatured(photo.featured), [photo.featured]);
  useEffect(() => setVisibility(photo.visibility), [photo.visibility]);

  const toggleFeatured = async () => {
    const next = !featured;
    setFeatured(next);
    setIsUpdating(true);

    try {
      await updatePhoto(photo.id, { featured: next });
    } catch (error) {
      console.error('Failed to update featured status:', error);
      setFeatured(!next);
      toast.error(error instanceof ApiError ? error.message : 'Failed to update featured status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const changeVisibility = async (nextVisibility: PhotoVisibility) => {
    const prev = visibility;
    setVisibility(nextVisibility);
    setIsUpdating(true);

    try {
      await updatePhoto(photo.id, { visibility: nextVisibility });
    } catch (error) {
      console.error('Failed to update visibility:', error);
      setVisibility(prev);
      toast.error(error instanceof ApiError ? error.message : 'Failed to update visibility.');
    } finally {
      setIsUpdating(false);
    }
  };

  return { featured, visibility, isUpdating, toggleFeatured, changeVisibility };
}
