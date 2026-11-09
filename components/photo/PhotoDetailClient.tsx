'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Photo } from '@/types';
import Lightbox from '@/components/ui/Lightbox';
import { getNextPhoto, getPreviousPhoto, getPhotoById } from '@/lib/data';
import { HERO_ATTR, getActiveId, getActiveRatio, getActiveSrc, handOff, markLanded } from '@/lib/photoTransition';

interface PhotoDetailClientProps {
  photo: Photo;
  nextPhotoId?: string;
  prevPhotoId?: string;
}

// Blur-up hero — same thumbnail-probe + cross-fade pattern as PhotoCard/CollectionCard.
// Keyed by photo.id where it's rendered below, so `loaded` resets cleanly on every
// Next/Prev navigation instead of showing a blank box while the new photo loads.
function HeroImage({ photo, onOpen }: { photo: Photo; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const boxRef = useRef<HTMLButtonElement>(null);
  const placeholderRef = useRef<HTMLImageElement>(null);
  // Opened by tapping a grid card: start from that card's already-loaded image
  // (sharp, from cache) instead of the blurred thumbnail, and size the box with
  // the card's real ratio (photo.aspectRatio here is only a 1.5 placeholder).
  const [handoffSrc] = useState(() => getActiveSrc(photo.id));
  const [knownRatio] = useState(() => getActiveRatio(photo.id));
  const ratio = knownRatio ?? photo.aspectRatio;
  // With a known ratio, give the box its final size up front: an <img> with
  // w-auto/h-auto is 0×0 until the full file arrives, which made the morph
  // overlay shrink to nothing. Same caps as below (container, 100svh-12rem, 1600px).
  const boxStyle = knownRatio
    ? { width: `min(100%, calc((100svh - 12rem) / ${knownRatio}), 1600px)`, aspectRatio: `1 / ${knownRatio}` }
    : undefined;

  // Grid -> photo morph landed on a temporary overlay (lib/photoTransition.ts);
  // take over from it now that the real hero is here.
  useLayoutEffect(() => {
    if (getActiveId() !== photo.id) return;
    markLanded();
    handOff(photo.id, boxRef.current, placeholderRef.current);
  }, [photo.id]);

  return (
    // Box shrink-wraps the photo (w-fit), so the blur placeholder covers exactly
    // the image area — no blurred side bands around portrait shots.
    <button
      ref={boxRef}
      {...{ [HERO_ATTR]: '', 'data-photo-hero-main': '' }}
      onClick={onOpen}
      style={boxStyle}
      className={`relative block mx-auto max-w-full overflow-hidden cursor-zoom-in ${boxStyle ? '' : 'w-fit'}`}
      aria-label="View fullscreen"
    >
      <img
        ref={placeholderRef}
        src={handoffSrc || photo.src.thumbnail}
        alt=""
        aria-hidden="true"
        // Stays underneath (no fade-out): the full image fades in on top, so
        // there's no mid-crossfade dip where both are half transparent.
        className={`absolute inset-0 w-full h-full object-cover ${handoffSrc ? '' : 'scale-105 blur-xl'}`}
      />
      <Image
        src={photo.src.full}
        alt={photo.title || (photo.location ? `Photograph from ${photo.location}` : 'Photograph by Airu')}
        width={1600}
        height={Math.round(1600 * ratio)}
        sizes="(min-width: 1536px) 1472px, 100vw"
        className={`relative block transition-opacity duration-500 motion-reduce:transition-none ${
          boxStyle ? 'w-full h-full object-cover' : 'w-auto h-auto max-w-full max-h-[calc(100svh-12rem)]'
        } ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        priority
      />
    </button>
  );
}

export default function PhotoDetailClient({ photo, nextPhotoId, prevPhotoId }: PhotoDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(photo);
  const [currentNextId, setCurrentNextId] = useState(nextPhotoId);
  const [currentPrevId, setCurrentPrevId] = useState(prevPhotoId);

  // Get collection slug from URL for scoped navigation
  const collectionSlug = searchParams.get('collection') || undefined;

  // Build URL with collection context preserved
  const buildPhotoUrl = (photoId: string, includeFullscreen: boolean = false) => {
    const params = new URLSearchParams();
    if (collectionSlug) params.set('collection', collectionSlug);
    if (includeFullscreen) params.set('view', 'fullscreen');
    const queryString = params.toString();
    return `/photo/${photoId}${queryString ? `?${queryString}` : ''}`;
  };

  // Check if lightbox should be open based on URL
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'fullscreen') {
      setIsLightboxOpen(true);
    }
  }, [searchParams]);

  // Update currentPhoto when photo prop changes (after navigation)
  useEffect(() => {
    setCurrentPhoto(photo);
    setCurrentNextId(nextPhotoId);
    setCurrentPrevId(prevPhotoId);
  }, [photo, nextPhotoId, prevPhotoId]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = async () => {
      const url = new URL(window.location.href);
      const photoId = url.pathname.split('/').pop();
      const viewParam = url.searchParams.get('view');
      const urlCollectionSlug = url.searchParams.get('collection') || undefined;

      // Update lightbox state based on URL
      setIsLightboxOpen(viewParam === 'fullscreen');

      // If photo ID changed, fetch the new photo
      if (photoId && photoId !== currentPhoto.id) {
        try {
          const fetchedPhoto = await getPhotoById(photoId);

          if (fetchedPhoto) {
            setCurrentPhoto(fetchedPhoto);

            // Update next/prev IDs (use collection context from URL)
            const newNextPhoto = await getNextPhoto(fetchedPhoto.id, urlCollectionSlug);
            const newPrevPhoto = await getPreviousPhoto(fetchedPhoto.id, urlCollectionSlug);
            setCurrentNextId(newNextPhoto?.id);
            setCurrentPrevId(newPrevPhoto?.id);
          }
        } catch (error) {
          console.error('Failed to load photo on popstate:', error);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPhoto.id]);

  const handleNext = currentNextId ? async () => {
    // Fetch next photo without page navigation for smooth transition (use collection context)
    const nextPhoto = await getNextPhoto(currentPhoto.id, collectionSlug);
    if (nextPhoto) {
      setCurrentPhoto(nextPhoto);

      // Update next/prev IDs (use collection context)
      const newNextPhoto = await getNextPhoto(nextPhoto.id, collectionSlug);
      const newPrevPhoto = await getPreviousPhoto(nextPhoto.id, collectionSlug);
      setCurrentNextId(newNextPhoto?.id);
      setCurrentPrevId(newPrevPhoto?.id);

      // Update URL silently without page reload (preserve collection context)
      window.history.pushState(null, '', buildPhotoUrl(nextPhoto.id, true));
    }
  } : undefined;

  const handlePrev = currentPrevId ? async () => {
    // Fetch prev photo without page navigation for smooth transition (use collection context)
    const prevPhoto = await getPreviousPhoto(currentPhoto.id, collectionSlug);
    if (prevPhoto) {
      setCurrentPhoto(prevPhoto);

      // Update next/prev IDs (use collection context)
      const newNextPhoto = await getNextPhoto(prevPhoto.id, collectionSlug);
      const newPrevPhoto = await getPreviousPhoto(prevPhoto.id, collectionSlug);
      setCurrentNextId(newNextPhoto?.id);
      setCurrentPrevId(newPrevPhoto?.id);

      // Update URL silently without page reload (preserve collection context)
      window.history.pushState(null, '', buildPhotoUrl(prevPhoto.id, true));
    }
  } : undefined;

  const handleOpenLightbox = () => {
    setIsLightboxOpen(true);
    // Add fullscreen param to URL without page reload (preserve collection context)
    window.history.pushState(null, '', buildPhotoUrl(currentPhoto.id, true));
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    // Rerender (push) If navigated different photo, else just remove fullscreen param
    if (currentPhoto.id !== photo.id) {
      router.push(buildPhotoUrl(currentPhoto.id, false));
    } else {
      window.history.pushState(null, '', buildPhotoUrl(currentPhoto.id, false));
    }
  };

  // ←/→ on the page itself (lightbox handles its own keys while open).
  useEffect(() => {
    if (isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      if (e.key === 'ArrowRight' && nextPhotoId) router.push(buildPhotoUrl(nextPhotoId));
      if (e.key === 'ArrowLeft' && prevPhotoId) router.push(buildPhotoUrl(prevPhotoId));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // buildPhotoUrl only depends on collectionSlug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, nextPhotoId, prevPhotoId, collectionSlug, router]);

  return (
    <>
      {/* Hero — click opens fullscreen */}
      <div className="pt-8 md:pt-10">
        <HeroImage key={currentPhoto.id} photo={currentPhoto} onOpen={handleOpenLightbox} />
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleOpenLightbox}
            className="text-[0.6875rem] uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            View fullscreen ↗
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
        imageSrc={currentPhoto.src.full}
        imageAlt={currentPhoto.title || 'Photo'}
        aspectRatio={currentPhoto.aspectRatio}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </>
  );
}
