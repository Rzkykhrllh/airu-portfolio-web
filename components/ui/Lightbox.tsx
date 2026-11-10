'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo } from '@/types';
import { photoSrcSet, preloadPhoto } from '@/lib/photoSrc';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo;
  /** Neighbours: rendered beside the photo (so a swipe drags the real next one in) and preloaded. */
  prevPhoto?: Photo | null;
  nextPhoto?: Photo | null;
  onNext?: () => void;
  onPrev?: () => void;
}

const SLIDE_MS = 300;
// After a swipe: keep the finger's momentum (fast start, long settle).
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
// From rest (arrow / key): that curve covers 60% of the screen in 3 frames and
// reads as a jump, so ease in and out over a bit longer instead.
const STEP_MS = 450;
const STEP_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
// Clicking / swiping faster than that: queued slides run quick, and the one in
// flight speeds up, so the strip keeps up with the clicks.
const FAST_MS = 220;
const FAST_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const HURRY = 3;
const MAX_QUEUE = 8;

type Motion = false | 'swipe' | 'step' | 'fast';
const TRANSITION: Record<Exclude<Motion, false>, string> = {
  swipe: `transform ${SLIDE_MS}ms ${EASE}`,
  step: `transform ${STEP_MS}ms ${STEP_EASE}`,
  fast: `transform ${FAST_MS}ms ${FAST_EASE}`,
};

/** One photo in the strip: blurred thumbnail until the sharp file is in. */
function Slide({ photo, current }: { photo: Photo; current: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (loaded || !current) return;
    // Short delay, so cached photos don't flash it.
    const t = setTimeout(() => setShowSpinner(true), 200);
    return () => clearTimeout(t);
  }, [loaded, current]);

  return (
    <div className="relative w-full h-full">
      {!loaded && (
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
        ref={(el) => {
          // Cached images can be complete before React attaches onLoad.
          if (el?.complete && el.naturalWidth > 0) setLoaded(true);
        }}
        srcSet={photoSrcSet(photo)}
        sizes="100vw"
        src={photo.src.medium}
        alt={current ? photo.title || 'Photo' : ''}
        aria-hidden={current ? undefined : true}
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={`relative w-full h-full object-contain select-none transition-opacity duration-300 motion-reduce:transition-none ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {current && !loaded && showSpinner && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none" role="status" aria-label="Loading photo">
          <span className="w-9 h-9 rounded-full border-2 border-white/25 border-t-white animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function Lightbox({ isOpen, onClose, photo, prevPhoto, nextPhoto, onNext, onPrev }: LightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  // Non-zero while a slide is animating out (the next photo is committed when
  // it ends). Each slide gets its own number, so a late timer from an earlier
  // slide can't reset a newer one mid-flight.
  const busy = useRef(0);
  const seq = useRef(0);
  // Clicks that came in while a slide was running: +n next, -n prev.
  const queued = useRef(0);
  const openRef = useRef(isOpen);
  openRef.current = isOpen;

  useEffect(() => {
    if (!isOpen) return;
    [prevPhoto, nextPhoto].forEach((n) => n && preloadPhoto(n));
  }, [isOpen, prevPhoto, nextPhoto]);

  const setStrip = (x: number, motion: Motion) => {
    const el = stripRef.current;
    if (!el) return;
    // A strip mounted this very frame has no computed style yet, and the
    // browser then skips the transition (an instant jump). Reading it fixes that.
    if (motion) void getComputedStyle(el).transform;
    el.style.transition = motion ? TRANSITION[motion] : 'none';
    el.style.transform = x ? `translate3d(${x}px, 0, 0)` : '';
  };
  const stripAnim = () => stripRef.current?.getAnimations()[0];
  const setDrop = (y: number, animate: boolean) => {
    const el = currentRef.current;
    const bd = backdropRef.current;
    const t = animate ? `${SLIDE_MS}ms ${EASE}` : '0s';
    const p = Math.min(1, Math.abs(y) / 400);
    if (el) {
      el.style.transition = `transform ${t}`;
      el.style.transform = y ? `translate3d(0, ${y}px, 0) scale(${1 - p * 0.15})` : '';
    }
    if (bd) {
      bd.style.transition = `opacity ${t}`;
      bd.style.opacity = String(1 - p * 0.7);
    }
  };

  // The new photo is in: the slide that just came in is now the middle one,
  // so snap the strip back to centre without animating (looks identical).
  useLayoutEffect(() => {
    busy.current = 0;
    setStrip(0, false);
    setDrop(0, false);
  }, [photo.id]);

  /** Slide the neighbour in, then switch to it. */
  const go = useCallback(
    (dir: 'prev' | 'next', motion: Exclude<Motion, false> = 'step') => {
      const fn = dir === 'next' ? onNext : onPrev;
      const target = dir === 'next' ? nextPhoto : prevPhoto;
      if (!fn) return;
      // Mid-slide, or the neighbour isn't loaded yet (first moments after
      // opening): remember the click and run it as soon as possible. Calling
      // fn() now would make every early click go to the same next photo.
      if (busy.current || !target) {
        const q = queued.current + (dir === 'next' ? 1 : -1);
        queued.current = Math.max(-MAX_QUEUE, Math.min(MAX_QUEUE, q));
        if (busy.current) stripAnim()?.updatePlaybackRate(HURRY);
        return;
      }
      // Reduced motion: just switch.
      if (!stripRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        fn();
        return;
      }
      const me = ++seq.current;
      busy.current = me;
      setStrip(dir === 'next' ? -window.innerWidth : window.innerWidth, motion);
      const commit = () => {
        if (busy.current !== me) return;
        // Closed mid-slide: don't switch photos behind the user's back.
        if (!openRef.current) {
          busy.current = 0;
          queued.current = 0;
          return;
        }
        fn();
        // Never leave the strip parked off-centre if the switch didn't happen.
        window.setTimeout(() => {
          if (busy.current === me) {
            busy.current = 0;
            queued.current = 0;
            setStrip(0, false);
          }
        }, 1500);
      };
      // Follow the animation itself (it may be sped up); a timer if there's none.
      const anim = stripAnim();
      if (anim) {
        anim.finished.then(commit, () => {
          // Cancelled (lightbox closed / strip reset).
          if (busy.current === me) busy.current = 0;
        });
      } else {
        window.setTimeout(commit, 0);
      }
    },
    [onNext, onPrev, nextPhoto, prevPhoto]
  );

  // Run queued clicks once the new photo (and its neighbours) are in.
  useEffect(() => {
    if (!isOpen) {
      queued.current = 0;
      return;
    }
    const q = queued.current;
    if (!q || busy.current) return;
    const dir = q > 0 ? 'next' : 'prev';
    if (!(dir === 'next' ? onNext : onPrev)) {
      queued.current = 0; // End of the collection.
      return;
    }
    if (!(dir === 'next' ? nextPhoto : prevPhoto)) return; // Neighbours still loading.
    queued.current -= Math.sign(q);
    go(dir, 'fast');
    // Still a backlog: catch up faster.
    if (Math.abs(queued.current) >= 2) stripAnim()?.updatePlaybackRate(2);
  }, [isOpen, photo.id, nextPhoto, prevPhoto, onNext, onPrev, go]);

  /* ------------------------------------------------------------ gestures */

  const drag = useRef<{ id: number; x0: number; y0: number; t0: number; axis: 'x' | 'y' | null; dx: number; dy: number } | null>(
    null
  );

  const reset = () => {
    setStrip(0, 'swipe');
    setDrop(0, true);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Touch / pen only: a mouse uses the arrows (and clicks shouldn't turn into drags).
    if (e.pointerType === 'mouse') return;
    // A new swipe while the last one is still settling: land it now and
    // let this one start straight away.
    if (busy.current) stripAnim()?.finish();
    if (drag.current) {
      // Second finger (pinch): drop the gesture.
      drag.current = null;
      reset();
      return;
    }
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), axis: null, dx: 0, dy: 0 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    d.dx = e.clientX - d.x0;
    d.dy = e.clientY - d.y0;
    if (!d.axis) {
      if (Math.abs(d.dx) < 8 && Math.abs(d.dy) < 8) return;
      d.axis = Math.abs(d.dx) > Math.abs(d.dy) ? 'x' : 'y';
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Pointer already gone.
      }
    }
    if (d.axis === 'x') {
      // Rubber band where there's nothing to go to.
      const edge = (d.dx > 0 && !(onPrev && prevPhoto)) || (d.dx < 0 && !(onNext && nextPhoto));
      setStrip(edge ? d.dx * 0.25 : d.dx, false);
    } else {
      setDrop(d.dy > 0 ? d.dy : d.dy * 0.25, false);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const ms = Math.max(1, performance.now() - d.t0);
    if (d.axis === 'x') {
      const dir = d.dx < 0 ? 'next' : 'prev';
      const ok = dir === 'next' ? onNext && nextPhoto : onPrev && prevPhoto;
      // A quarter of the screen, or a quick flick.
      const far = Math.abs(d.dx) > window.innerWidth * 0.25 || (Math.abs(d.dx) > 30 && Math.abs(d.dx) / ms > 0.45);
      if (far && ok) go(dir, 'swipe');
      else reset();
    } else if (d.axis === 'y') {
      if (d.dy > 120 || (d.dy > 40 && d.dy / ms > 0.5)) {
        // Carry on down while the lightbox fades out.
        setDrop(window.innerHeight * 0.6, true);
        onClose();
      } else {
        reset();
      }
    }
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    reset();
  };

  /* ------------------------------------------------------------ keys etc. */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          if (isZoomed) break;
          // A held key auto-repeats ~30×/s: keep it moving, but don't queue
          // those, or it carries on long after the key is let go.
          if (e.repeat && busy.current) {
            stripAnim()?.updatePlaybackRate(HURRY);
            break;
          }
          go(e.key === 'ArrowLeft' ? 'prev' : 'next');
          break;
        case 'z':
        case 'Z':
          setIsZoomed((z) => !z);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, go, isZoomed]);

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

  const slides: Array<{ p: Photo; at: number }> = [
    ...(prevPhoto && onPrev ? [{ p: prevPhoto, at: -1 }] : []),
    { p: photo, at: 0 },
    ...(nextPhoto && onNext ? [{ p: nextPhoto, at: 1 }] : []),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 overflow-hidden"
          onClick={onClose}
        >
          {/* Own layer so swipe-down can fade it. No backdrop blur: behind 95% black
              it was invisible, but cost a full-screen blur on every frame of a swipe. */}
          <div ref={backdropRef} className="absolute inset-0 bg-black/95" />

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
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
          {onPrev && !isZoomed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                go('prev');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-gray-300 transition-colors p-3 rounded-full hover:bg-white/10"
              aria-label="Previous"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {onNext && !isZoomed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                go('next');
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
            className={`relative w-full h-full ${isZoomed ? 'flex items-center justify-center p-4 overflow-auto' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {isZoomed ? (
              // Zoom: the 2400px original at natural size, for pixel-peeking.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.src.full} alt={photo.title || 'Photo'} className="w-auto h-auto max-w-none" />
            ) : (
              // Strip: prev | current | next, each a full screen wide. A drag moves
              // it with the finger; the arrows slide it the same way.
              <div
                ref={stripRef}
                className="absolute inset-0 will-change-transform"
                style={{ touchAction: 'pinch-zoom' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
              >
                {slides.map(({ p, at }) => (
                  <div
                    key={p.id}
                    ref={at === 0 ? currentRef : undefined}
                    className="absolute inset-0 p-4"
                    style={{ transform: at ? `translateX(${at * 100}%)` : undefined }}
                  >
                    <Slide photo={p} current={at === 0} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Keyboard Hints (not on touch screens) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 text-white/60 text-sm [@media(hover:none)]:hidden">
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
