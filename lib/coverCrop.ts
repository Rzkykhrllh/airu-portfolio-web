import type { CSSProperties } from 'react';
import type { Collection, CoverCrop, Photo } from '@/types';

/** The saved crop, but only if it still belongs to the current cover photo. */
export function coverCropFor(collection: Pick<Collection, 'coverCrop'>, cover?: Photo): CoverCrop | null {
  const crop = collection.coverCrop;
  if (!crop || !cover || crop.photoId !== cover.id) return null;
  return crop;
}

/**
 * Style for a WRAPPER div inside a 3:2 `relative overflow-hidden` frame: the
 * wrapper is sized/offset so that exactly the crop rectangle fills the frame.
 * Put the image inside it at 100% (next/image `fill` + `object-fill`).
 * Never put these on the <Image fill> itself — next/image forbids overriding
 * width/height on `fill` images (throws in dev).
 */
export function cropWrapperStyle(crop: CoverCrop): CSSProperties {
  return {
    position: 'absolute',
    width: `${(100 / crop.w) * 100}%`,
    height: `${(100 / crop.h) * 100}%`,
    left: `${(-crop.x / crop.w) * 100}%`,
    top: `${(-crop.y / crop.h) * 100}%`,
  };
}

/** Largest 3:2 rectangle (in %) that fits an image of the given size. */
export function maxCropSize(naturalWidth: number, naturalHeight: number): { w: number; h: number } {
  const imageAspect = naturalWidth / naturalHeight;
  if (imageAspect > 1.5) {
    return { w: (1.5 / imageAspect) * 100, h: 100 };
  }
  return { w: 100, h: (imageAspect / 1.5) * 100 };
}
