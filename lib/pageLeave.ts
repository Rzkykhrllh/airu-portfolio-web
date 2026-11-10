'use client';

/**
 * Cheap, non-blocking page change for collection cards: the current page
 * fades out right away while the next one loads, and fades back in the
 * moment it commits (ConditionalLayout calls `arrive()` on every pathname
 * change). Nothing waits on the server, unlike a view transition, which
 * froze the screen until the whole collection grid was laid out.
 */

let safety = 0;
let leftVia = false;

export function leave(navigate: () => void) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    navigate();
    return;
  }
  document.documentElement.dataset.leaving = '';
  leftVia = true;
  window.clearTimeout(safety);
  // Never leave the page invisible (failed load, navigation cancelled).
  safety = window.setTimeout(arrive, 4000);
  navigate();
}

export function arrive() {
  window.clearTimeout(safety);
  delete document.documentElement.dataset.leaving;
}

/** One-shot: did we get here through `leave()`? (plays the heading entrance) */
export function consumeLeave(): boolean {
  const v = leftVia;
  leftVia = false;
  return v;
}
