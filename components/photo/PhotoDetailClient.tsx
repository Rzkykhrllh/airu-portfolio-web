'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Photo } from '@/types';
import Lightbox from '@/components/ui/Lightbox';
import { getNextPhoto, getPreviousPhoto, getPhotoById } from '@/lib/data';

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

  return (
    <button onClick={onOpen} className="relative w-full overflow-hidden rounded-lg cursor-zoom-in">
      <img
        src={photo.src.thumbnail}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-contain scale-105 blur-xl transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <Image
        src={photo.src.full}
        alt={photo.title || (photo.location ? `Photograph from ${photo.location}` : 'Photograph by Airu')}
        width={1600}
        height={1600 * photo.aspectRatio}
        sizes="(min-width: 1152px) 1152px, 100vw"
        className={`relative w-full h-auto max-h-[85vh] object-contain shadow-2xl transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        priority
      />

      {/* Fullscreen Hint Overlay — always visible on touch (no hover to reveal it on
          mobile), hover-revealed on desktop like the rest of the site's card overlays */}
      <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/20 transition-colors flex items-end md:items-center justify-center p-3 md:p-0">
        <div className="opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-black/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            View fullscreen
          </span>
        </div>
      </div>
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

  return (
    <>
      {/* Hero Image with Click to Fullscreen */}
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="relative w-full max-w-6xl group">
          <HeroImage key={currentPhoto.id} photo={currentPhoto} onOpen={handleOpenLightbox} />
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
