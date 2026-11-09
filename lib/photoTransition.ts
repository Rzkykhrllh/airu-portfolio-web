'use client';

/**
 * Grid ⇄ photo page "morph": the tapped thumbnail grows into the hero on the
 * photo page (and shrinks back on the page's back link), using the browser's
 * View Transitions API.
 *
 * Only ONE element per page ever carries the shared name, set imperatively
 * right before a transition, so a gallery with hundreds of cards doesn't make
 * every navigation snapshot all of them.
 *
 * Browsers without the API (or with reduced motion on) just navigate normally.
 */

export const HERO_NAME = 'photo-hero';
export const HERO_ATTR = 'data-photo-hero';

type Pending = () => void;

let activeId: string | null = null;
let activeSrc: string | null = null;
let fromGridUrl: string | null = null;
let pending: Pending | null = null;
let claimed = false;
let landed: { len: number; path: string } | null = null;

export function canMorph(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const getActiveId = () => activeId;
export const getActiveSrc = (id: string) => (id === activeId ? activeSrc : null);
/** The grid URL the active photo was opened from (for a history back). */
export const getFromGridUrl = () => fromGridUrl;

export function setActive(id: string, src: string | null, gridUrl: string | null) {
  activeId = id;
  activeSrc = src;
  fromGridUrl = gridUrl;
}

/** The photo page opened from the grid has mounted; remember the history spot. */
export function markLanded() {
  landed = { len: window.history.length, path: window.location.pathname };
}

/**
 * Can "back" be a real history back to the grid? Only if nothing was pushed
 * since landing (lightbox / next-prev push entries) and we're on the same photo.
 */
export function canGoBackToGrid(): boolean {
  return (
    fromGridUrl !== null &&
    landed !== null &&
    landed.len === window.history.length &&
    landed.path === window.location.pathname &&
    window.location.pathname === `/photo/${activeId}`
  );
}

/** Is a morph waiting for its destination element to appear? */
export const isPending = () => pending !== null;

/** A destination element will call `arrived()` itself (after its image decodes). */
export function claim() {
  claimed = true;
}
export const isClaimed = () => claimed;

/** Destination element is in the DOM (and painted): take the "after" snapshot. */
export function arrived() {
  const done = pending;
  pending = null;
  done?.();
}

/** Remove the shared name from everything (only one element may hold it). */
export function clearNames() {
  document.querySelectorAll<HTMLElement>(`[${HERO_ATTR}]`).forEach((el) => {
    el.style.viewTransitionName = '';
  });
}

export function name(el: HTMLElement | null) {
  if (el) el.style.viewTransitionName = HERO_NAME;
}

/** Run `navigate` inside a view transition; resolves on `arrived()` or timeout. */
export function morph(navigate: () => void, timeoutMs = 2500) {
  if (!canMorph()) {
    navigate();
    return;
  }
  const vt = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const finish = () => {
          clearTimeout(timer);
          if (pending === finish) pending = null;
          resolve();
        };
        // Slow network / destination never matched: finish as a plain crossfade.
        const timer = setTimeout(finish, timeoutMs);
        pending = finish;
        claimed = false;
        navigate();
      })
  );
  vt.finished.finally(() => {
    // The destination keeps no name afterwards, so the next transition starts clean.
    clearNames();
  });
}
