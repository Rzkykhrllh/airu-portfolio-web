'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  /**
   * The on-page element showing `photo` (the hero): the photo grows out of it
   * on open and shrinks back into it on close. Without one it just fades.
   */
  getOrigin?: () => HTMLElement | null;
}

const SLIDE_MS = 300;
const OPEN_MS = 420;
const CLOSE_MS = 360;
const ZOOM_EASE = 'cubic-bezier(0.2, 0, 0, 1)';
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

/**
 * One photo in the strip: until the sharp file is in, the on-page copy
 * (`preview`, already sharp) or else the blurred thumbnail.
 */
function Slide({ photo, current, preview }: { photo: Photo; current: boolean; preview?: string }) {
  const [loaded, setLoaded] = useState(false);
  // Already decoded when it mounted (cache): show it outright. Fading it in
  // made the photo near-invisible at the start of the open zoom.
  const [instant, setInstant] = useState(false);
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
          src={preview || photo.src.thumbnail}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-contain ${preview ? '' : 'blur-md opacity-80'}`}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={(el) => {
          // Cached images can be complete before React attaches onLoad.
          if (!loaded && el?.complete && el.naturalWidth > 0) {
            setInstant(true);
            setLoaded(true);
          }
        }}
        srcSet={photoSrcSet(photo)}
        sizes="100vw"
        src={photo.src.medium}
        alt={current ? photo.title || 'Photo' : ''}
        aria-hidden={current ? undefined : true}
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={`relative w-full h-full object-contain select-none ${instant ? '' : 'transition-opacity duration-300'} motion-reduce:transition-none ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {current && !loaded && !preview && showSpinner && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none" role="status" aria-label="Loading photo">
          <span className="w-9 h-9 rounded-full border-2 border-white/25 border-t-white animate-spin" />
        </div>
      )}
    </div>
  );
}

/** The origin, if it's on screen and showing its image. */
function originBox(getOrigin?: () => HTMLElement | null) {
  const el = getOrigin?.();
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > window.innerHeight) return null;
  const img = [...el.querySelectorAll('img')].reverse().find((i) => i.complete && i.naturalWidth > 0);
  return { el, r, src: img?.currentSrc || img?.src };
}

/**
 * Transform that puts the lightbox's (centred, object-contain) photo exactly
 * over `r`: same centre, same width.
 */
function flyTo(r: DOMRect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 16; // the slide's p-4
  const ratio = r.height / r.width;
  const fitW = Math.min(vw - pad * 2, (vh - pad * 2) / ratio);
  const s = r.width / fitW;
  const dx = r.left + r.width / 2 - vw / 2;
  const dy = r.top + r.height / 2 - vh / 2;
  return `translate(${dx}px, ${dy}px) scale(${s})`;
}

export default function Lightbox({ isOpen, onClose, photo, prevPhoto, nextPhoto, onNext, onPrev, getOrigin }: LightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  // Stays true through the closing animation.
  const [shown, setShown] = useState(isOpen);
  const rootRef = useRef<HTMLDivElement>(null);
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
    [onNext, onPrev, nextPhoto, prevPhoto],
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

  const drag = useRef<{
    id: number;
    x0: number;
    y0: number;
    t0: number;
    axis: 'x' | 'y' | null;
    dx: number;
    dy: number;
  } | null>(null);

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
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      t0: performance.now(),
      axis: null,
      dx: 0,
      dy: 0,
    };
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
        // Close from right here: the photo flies back to its spot on the page.
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

  /* ------------------------------------------------------- open / close */

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The hero is hidden while its copy flies, so there aren't two of it.
  const hidden = useRef<HTMLElement | null>(null);
  const unhide = () => {
    if (hidden.current) hidden.current.style.visibility = '';
    hidden.current = null;
  };
  const hide = (el: HTMLElement) => {
    unhide();
    el.style.visibility = 'hidden';
    hidden.current = el;
  };
  const chrome = () => [...(rootRef.current?.querySelectorAll<HTMLElement>('[data-chrome]') ?? [])];

  useLayoutEffect(() => {
    if (isOpen) {
      // Re-opened mid-close: stop the close where it is.
      rootRef.current?.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      unhide();
      setShown(true);
      return;
    }
    if (!shown) return;
    const root = rootRef.current;
    const finish = () => {
      unhide();
      setShown(false);
    };
    if (!root || reducedMotion()) return finish();

    const slide = currentRef.current;
    const o = slide ? originBox(getOrigin) : null;
    const bd = backdropRef.current;
    chrome().forEach((c) => c.animate([{ opacity: 0 }], { duration: 150, fill: 'forwards' }));
    if (slide && o) {
      // Shrink back into the page, from wherever it is now (centre, or mid swipe-down).
      hide(o.el);
      const from = getComputedStyle(slide).transform;
      const opts = {
        duration: CLOSE_MS,
        easing: ZOOM_EASE,
        fill: 'forwards' as const,
      };
      slide
        .animate([{ transform: from === 'none' ? 'none' : from }, { transform: flyTo(o.r) }], opts)
        .finished.then(finish, () => {});
      if (bd) bd.animate([{ opacity: getComputedStyle(bd).opacity }, { opacity: 0 }], opts);
    } else {
      root
        .animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 200,
          fill: 'forwards',
        })
        .finished.then(finish, () => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Grow out of the page (runs before the first paint of the lightbox).
  useLayoutEffect(() => {
    if (!shown || !isOpen) return;
    const root = rootRef.current;
    if (!root || reducedMotion()) return;
    const slide = currentRef.current;
    const o = slide ? originBox(getOrigin) : null;
    if (slide && o) {
      hide(o.el);
      slide
        .animate([{ transform: flyTo(o.r) }, { transform: 'none' }], {
          duration: OPEN_MS,
          easing: ZOOM_EASE,
        })
        .finished.then(unhide, () => {});
      backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: OPEN_MS,
        easing: 'ease-out',
      });
      chrome().forEach((c) =>
        c.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 250,
          delay: 150,
          easing: 'ease-out',
          fill: 'backwards',
        }),
      );
    } else {
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  useEffect(() => () => unhide(), []);

  // Lock page scroll while it's on screen (through the close animation too).
  // The site's scrollbar takes real width, so padding stands in for it:
  // otherwise the whole page shifted 4px sideways on open and back on close,
  // right in the middle of the zoom. Layout effect = in place before the
  // first frame (and the open measurement sees the same layout).
  useLayoutEffect(() => {
    if (!shown) return;
    const html = document.documentElement;
    const bar = window.innerWidth - html.clientWidth;
    document.body.style.overflow = 'hidden';
    if (bar > 0) html.style.paddingRight = `${bar}px`;
    return () => {
      document.body.style.overflow = '';
      html.style.paddingRight = '';
    };
  }, [shown]);

  const slides: Array<{ p: Photo; at: number }> = [
    ...(prevPhoto && onPrev ? [{ p: prevPhoto, at: -1 }] : []),
    { p: photo, at: 0 },
    ...(nextPhoto && onNext ? [{ p: nextPhoto, at: 1 }] : []),
  ];

  if (!shown) return null;
  // The current photo shows the page's (sharp, loaded) copy until its own file is in.
  const preview = originBox(getOrigin)?.src;

  return (
    <div ref={rootRef} className={`fixed inset-0 z-50 overflow-hidden ${isOpen ? '' : 'pointer-events-none'}`} onClick={onClose}>
      {/* Own layer so swipe-down can fade it. No backdrop blur: behind 95% black
              it was invisible, but cost a full-screen blur on every frame of a swipe. */}
      <div ref={backdropRef} className="absolute inset-0 bg-black/95" />

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        data-chrome
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
        data-chrome
        className="absolute top-4 right-16 z-50 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/10"
        aria-label={isZoomed ? 'Zoom Out' : 'Zoom In'}
      >
        {isZoomed ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
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
          data-chrome
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
          data-chrome
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-gray-300 transition-colors p-3 rounded-full hover:bg-white/10"
          aria-label="Next"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image Container */}
      <div
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
                style={{
                  transform: at ? `translateX(${at * 100}%)` : undefined,
                }}
              >
                <Slide photo={p} current={at === 0} preview={at === 0 ? preview : undefined} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard Hints (not on touch screens) */}
      <div
        data-chrome
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 text-white/60 text-sm [@media(hover:none)]:hidden"
      >
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
    </div>
  );
}
