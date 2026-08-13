import { Photo } from '@/types';

// `transformPhoto` (see lib/transformers.ts) currently sets every photo's
// `aspectRatio` to a hardcoded placeholder (1.5) — the backend doesn't
// store/return real image dimensions at all. MasonryGrid's JS packing
// (§7d, packIntoColumns) relies on `aspectRatio` to decide which column is
// currently shortest, so with every photo reporting the *same* fake ratio,
// those decisions are close to blind: real portrait shots (~0.67) and real
// wide landscapes (~2+) are treated as identical, and over a large batch
// the error accumulates into visibly uneven column heights (confirmed live
// on byairu.com — one column ending up ~150 photos "ahead" of the others).
// It's also very likely a contributor to the photos-shift-while-scrolling
// issue from §7d's residual findings: each photo's box is initially sized
// from the same wrong 1.5 ratio (via its <Image width/height>), then
// snaps to its real size the moment the actual image loads.
//
// Fix: before a batch of photos is placed in the grid, probe each one's
// *real* aspect ratio by loading its small thumbnail (`src.thumbnail` /
// backend `urlSmall` — resized with `fit: "inside"`, so it's the exact
// same aspect ratio as the full photo, just far lighter: ~300px wide vs.
// 1600px+ for the medium/large variants actually displayed). Once loaded,
// the browser knows the thumbnail's real natural width/height regardless
// of the placeholder ratio baked into any width/height attribute — that's
// the number packIntoColumns should have been using all along.

// Module-level (not React state): a real ratio, once learned, is true for
// the rest of the session — no reason to re-probe a photo's thumbnail
// again just because the user navigated away from the gallery and back.
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

    // Safety net: a single slow/broken thumbnail shouldn't hold up the
    // whole batch (Promise.all in resolveAspectRatios waits for all of
    // them) — fall back to whatever ratio the photo already had.
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

// Resolves the real aspect ratio for each photo in `photos`, in parallel,
// and returns a new array with `aspectRatio` corrected. Client-only (no-op
// during SSR, where there's no `Image` constructor and no reason to probe
// anything the server won't lay out with JS packing anyway).
export async function resolveAspectRatios(photos: Photo[]): Promise<Photo[]> {
  if (typeof window === 'undefined' || photos.length === 0) return photos;
  const ratios = await Promise.all(photos.map(probeOne));
  return photos.map((photo, i) => ({ ...photo, aspectRatio: ratios[i] }));
}
