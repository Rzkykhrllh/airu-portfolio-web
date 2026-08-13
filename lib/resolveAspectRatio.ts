import { Photo } from '@/types';

// transformPhoto hardcodes aspectRatio to 1.5 (backend doesn't return real
// dimensions), which breaks MasonryGrid's column packing (§7d). Fix: probe
// each photo's real ratio by loading its thumbnail (same fit:"inside"
// aspect ratio as the original, just much lighter) and reading naturalWidth/Height.

// Module-level, not React state — a learned ratio is valid for the session.
const ratioCache = new Map<string, number>();

const PROBE_TIMEOUT_MS = 4000;

function probeOne(photo: Photo): Promise<number> {
  const cached = ratioCache.get(photo.id);
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ratio: number) => {
      if (settled) return;
      settled = true;
      resolve(ratio);
    };

    // A slow/broken thumbnail shouldn't hold up the whole batch.
    const timeout = setTimeout(() => finish(photo.aspectRatio), PROBE_TIMEOUT_MS);

    const img = new window.Image();
    img.onload = () => {
      clearTimeout(timeout);
      const ratio = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : photo.aspectRatio;
      ratioCache.set(photo.id, ratio);
      finish(ratio);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      finish(photo.aspectRatio);
    };
    img.src = photo.src.thumbnail;
  });
}

// Resolves real aspect ratios in parallel. Client-only (no-op during SSR).
export async function resolveAspectRatios(photos: Photo[]): Promise<Photo[]> {
  if (typeof window === 'undefined' || photos.length === 0) return photos;
  const ratios = await Promise.all(photos.map(probeOne));
  return photos.map((photo, i) => ({ ...photo, aspectRatio: ratios[i] }));
}
