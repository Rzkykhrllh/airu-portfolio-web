'use client';

import { useEffect, useRef } from 'react';
import { onProgress, startProgress } from '@/lib/navProgress';

// Only show up for waits a person would notice — fast pages show nothing.
const SHOW_AFTER_MS = 150;
// Never leave it running (navigation cancelled, error page, …).
const GIVE_UP_MS = 12000;

/**
 * Hairline loading bar along the bottom edge of the header: creeps towards
 * ~85% while the next page loads, snaps to full and fades when it lands.
 * Lives inside the sticky <header>, so it stays put while scrolling and sits
 * above the photo morph overlay.
 */
export default function NavProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let showTimer = 0;
    let giveUpTimer = 0;
    let hideTimer = 0;
    let shown = false;
    let active = false;

    const set = (scale: number, transition: string, opacity = 1) => {
      bar.style.transition = transition;
      bar.style.transform = `scaleX(${scale})`;
      bar.style.opacity = String(opacity);
    };

    const start = () => {
      if (active) return;
      active = true;
      window.clearTimeout(hideTimer);
      window.clearTimeout(giveUpTimer);
      giveUpTimer = window.setTimeout(done, GIVE_UP_MS);
      showTimer = window.setTimeout(() => {
        shown = true;
        set(0.08, 'none');
        // Next frame: a long, decelerating creep that never quite arrives.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (active) set(0.85, 'transform 8s cubic-bezier(0.08, 0.7, 0.2, 1), opacity 0.2s');
          })
        );
      }, SHOW_AFTER_MS);
    };

    const done = () => {
      if (!active) return;
      active = false;
      window.clearTimeout(showTimer);
      window.clearTimeout(giveUpTimer);
      if (!shown) return;
      shown = false;
      set(1, 'transform 0.2s ease-out, opacity 0.3s ease 0.2s', 0);
      hideTimer = window.setTimeout(() => set(0, 'none', 0), 550);
    };

    // Internal link clicks start it (even ones that preventDefault and push
    // themselves, like the morphing photo cards — capture phase sees them first).
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest('a') : null;
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Only real page changes: pathname-change is what ends it.
      if (url.pathname === window.location.pathname) return;
      startProgress();
    };

    const off = onProgress((s) => (s === 'start' ? start() : done()));
    document.addEventListener('click', onClick, true);
    return () => {
      off();
      document.removeEventListener('click', onClick, true);
      window.clearTimeout(showTimer);
      window.clearTimeout(giveUpTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
      <div
        ref={barRef}
        style={{ transform: 'scaleX(0)', opacity: 0 }}
        className="h-full w-full origin-left bg-neutral-900/70 dark:bg-neutral-100/70"
      />
    </div>
  );
}
