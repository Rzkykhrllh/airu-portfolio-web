import type { Photo } from '@/types';

/*
 * Large photo views (photo-page hero, fullscreen) load straight from the R2
 * CDN instead of through next/image. The optimizer re-encodes the 2400px
 * original on every cold request (measured 2.8–4.6s, ~1s even when cached),
 * while the CDN serves the ready-made 1600px webp / 2400px jpeg in ~0.3s.
 * Both are exactly 1600 / 2400 px wide, so the browser can pick by width.
 */
export const photoSrcSet = (photo: Photo) => `${photo.src.medium} 1600w, ${photo.src.full} 2400w`;

/** Warm the browser cache with the same candidate an <img sizes={sizes}> would pick. */
export function preloadPhoto(photo: Photo, sizes = '100vw') {
  if (typeof window === 'undefined') return;
  const img = new window.Image();
  img.decoding = 'async';
  img.sizes = sizes;
  img.srcset = photoSrcSet(photo);
  img.src = photo.src.medium;
}
