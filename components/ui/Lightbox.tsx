'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo } from '@/types';
import { photoSrcSet, preloadPhoto } from '@/lib/photoSrc';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo;
  /** Prev/next photos — preloaded while open so arrow clicks show instantly. */
  neighbors?: Array<Photo | null | undefined>;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function Lightbox({ isOpen, onClose, photo, neighbors = [], onNext, onPrev }: LightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  // Which photo's sharp image has finished loading; anything else shows the
  // blurred thumbnail + a spinner (after a short delay, so cached photos don't flash it).
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const loading = loadedId !== photo.id;

  useEffect(() => {
    setShowSpinner(false);
    if (!loading) return;
    const t = setTimeout(() => setShowSpinner(true), 200);
    return () => clearTimeout(t);
  }, [photo.id, loading]);

  useEffect(() => {
    if (!isOpen) return;
    neighbors.forEach((n) => n && preloadPhoto(n));
  }, [isOpen, neighbors]);

  const markLoaded = (el: HTMLImageElement | null) => {
    // Cached images can be complete before React attaches onLoad.
    if (el?.complete && el.naturalWidth > 0) setLoadedId(photo.id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
        case 'z':
        case 'Z':
          setIsZoomed(!isZoomed);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev, isZoomed]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/10"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Zoom Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
            className="absolute top-4 right-16 z-50 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/10"
            aria-label={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            )}
          </button>

          {/* Navigation Arrows */}
          {onPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-gray-300 transition-colors p-3 rounded-full hover:bg-white/10"
              aria-label="Previous"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-gray-300 transition-colors p-3 rounded-full hover:bg-white/10"
              aria-label="Next"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image Container */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center justify-center w-full h-full p-4 ${
              isZoomed ? 'overflow-auto' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {isZoomed ? (
              // Zoom: the 2400px original at natural size, for pixel-peeking.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.src.full}
                alt={photo.title || 'Photo'}
                className="w-auto h-auto max-w-none"
              />
            ) : (
              <div className="relative w-full h-full">
                {/* Instant stand-in while the sharp file loads (thumbnail is usually cached from the grid). */}
                {loading && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.src.thumbnail}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-contain blur-md opacity-80"
                  />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={photo.id}
                  ref={markLoaded}
                  srcSet={photoSrcSet(photo)}
                  sizes="100vw"
                  src={photo.src.medium}
                  alt={photo.title || 'Photo'}
                  onLoad={() => setLoadedId(photo.id)}
                  className={`relative w-full h-full object-contain transition-opacity duration-300 motion-reduce:transition-none ${
                    loading ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                {loading && showSpinner && (
                  <div className="absolute inset-0 grid place-items-center pointer-events-none" role="status" aria-label="Loading photo">
                    <span className="w-9 h-9 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Keyboard Hints */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd>
              Close
            </span>
            {onPrev && (
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs">←</kbd>
                Previous
              </span>
            )}
            {onNext && (
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs">→</kbd>
                Next
              </span>
            )}
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Z</kbd>
              Zoom
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
