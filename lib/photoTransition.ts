'use client';

/**
 * Grid ⇄ photo page "morph": the tapped thumbnail grows into the hero on the
 * photo page (and shrinks back on the page's back link), using the browser's
 * View Transitions API.
 *
 * Forward (grid -> photo) never waits for the server. The photo page is
 * force-dynamic, so it can take a moment to arrive; waiting froze the screen
 * and, past the timeout, the photo flew to nowhere and vanished. Instead the
 * photo lands on a temporary overlay (a page-coloured backdrop + the image at
 * the hero's computed position) that lives outside the route tree. When the
 * real page mounts, its hero takes over under the overlay, the overlay snaps
 * to the hero's exact box and fades away.
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
let activeRatio: number | null = null;
let fromGridUrl: string | null = null;
let pending: Pending | null = null;
let claimed = false;
let landed: { len: number; path: string } | null = null;
let running: Promise<void> | null = null;

export function canMorph(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const getActiveId = () => activeId;
export const getActiveSrc = (id: string) => (id === activeId ? activeSrc : null);
/** Real height/width ratio from the grid (the photo page only has a 1.5 placeholder). */
export const getActiveRatio = (id: string) => (id === activeId ? activeRatio : null);
/** The grid URL the active photo was opened from (for a history back). */
export const getFromGridUrl = () => fromGridUrl;

export function setActive(id: string, src: string | null, gridUrl: string | null, ratio: number | null) {
  activeId = id;
  activeSrc = src;
  activeRatio = ratio;
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
        // Destination never matched: finish as a plain crossfade.
        const timer = setTimeout(finish, timeoutMs);
        pending = finish;
        claimed = false;
        navigate();
      })
  );
  const done = vt.finished.catch(() => {}).finally(() => {
    if (running === done) running = null;
    // The destination keeps no name afterwards, so the next transition starts clean.
    clearNames();
  });
  running = done;
}

/* ------------------------------------------------------------------ overlay */

let overlay: { id: string; backdrop: HTMLDivElement; img: HTMLImageElement; safety: number } | null = null;

const mq = (q: string) => window.matchMedia(q).matches;

/**
 * Where the hero will sit on the photo page (app/photo/[id]/page.tsx +
 * PhotoDetailClient), from the same layout rules: header, max-w-screen-2xl
 * container with px-4/6/8, the text nav row, then the hero centred and capped
 * at calc(100svh - 12rem). Any small mismatch is corrected on hand-off.
 */
function heroRect(ratio: number) {
  const header = document.querySelector('header');
  const top0 = header ? Math.max(0, header.getBoundingClientRect().bottom) : 72;
  const md = mq('(min-width: 768px)');
  const pad = mq('(min-width: 1024px)') ? 32 : mq('(min-width: 640px)') ? 24 : 16;
  const docW = document.documentElement.clientWidth;
  const contW = Math.min(docW, 1536);
  const contL = (docW - contW) / 2;
  const innerW = contW - pad * 2;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const navRow = (md ? 20 : 16) + 0.6875 * rem * 1.5; // pt-4/5 + one label line
  const heroPad = md ? 40 : 32;

  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;height:calc(100svh - 12rem);width:0;top:0';
  document.body.appendChild(probe);
  const maxH = probe.getBoundingClientRect().height;
  probe.remove();

  const w = Math.min(1600, innerW, maxH / ratio);
  const h = w * ratio;
  return {
    left: contL + pad + (innerW - w) / 2,
    top: top0 + navRow + heroPad,
    width: w,
    height: h,
    top0,
    // For the skeleton (see skeleton()).
    contLeft: contL + pad,
    innerW,
    navTop: top0 + navRow - 0.6875 * rem * 1.5,
    labelH: 0.6875 * rem * 1.5,
    md,
  };
}

/**
 * Grey placeholder bars where the photo page's text will appear (the nav row
 * above the photo, "View fullscreen" and the title below it), so a landed
 * photo doesn't read as a finished page. They only fade in after a short
 * delay (CSS .vt-skeleton), so a fast page never flashes them.
 */
function skeleton(r: ReturnType<typeof heroRect>): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'vt-skeleton';
  const bar = (left: number, top: number, width: number, height: number) => {
    const b = document.createElement('div');
    b.className = 'vt-skeleton-bar';
    b.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px`;
    wrap.appendChild(b);
  };
  const line = 8;
  const navMid = r.navTop + (r.labelH - line) / 2;
  bar(r.contLeft, navMid, 84, line); // ← Gallery
  bar(r.contLeft + r.innerW - 128, navMid, 128, line); // ← Prev  Next →
  const below = r.top + r.height + 16;
  bar(r.left + r.width / 2 - 56, below + (r.labelH - line) / 2, 112, line); // View fullscreen
  const text = below + r.labelH + (r.md ? 80 : 56);
  bar(r.contLeft, text, 150, line); // eyebrow
  bar(r.contLeft, text + line + 20, Math.min(r.innerW * 0.55, 520), r.md ? 52 : 40); // title
  return wrap;
}

/**
 * Inside the transition's update: drop the photo onto the overlay at the
 * hero's position. Resolves once the image is decoded (it's cached), which is
 * when the "after" snapshot may be taken.
 */
export function showOverlay(id: string, src: string, ratio: number): Promise<void> {
  removeOverlay(true);
  const r = heroRect(ratio);
  const bg = getComputedStyle(document.body).backgroundColor || '#fff';

  const backdrop = document.createElement('div');
  // Full screen but below the sticky header (z-50): the header is translucent
  // (bg 88% + blur), so the backdrop must sit behind it too — otherwise the
  // header keeps showing the old grid through it and reads as a different colour.
  backdrop.style.cssText = `position:fixed;inset:0;background:${bg};z-index:45;transition:opacity .25s ease`;
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  img.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;object-fit:cover;z-index:46;transition:opacity .25s ease;view-transition-name:${HERO_NAME}`;
  backdrop.appendChild(skeleton(r));
  document.body.append(backdrop, img);
  lock();

  // Never leave it stuck: page failed to load, or the user went elsewhere.
  const safety = window.setTimeout(() => removeOverlay(), 10000);
  overlay = { id, backdrop, img, safety };
  window.addEventListener('popstate', onPop, { once: true });

  return img.decode().catch(() => {});
}

function onPop() {
  removeOverlay(true);
}

/**
 * While waiting, the page behind is still the (long) gallery: hide its
 * scrollbar and stop it scrolling under the overlay. Padding takes the
 * scrollbar's place so nothing shifts sideways (scrollbar-gutter doesn't
 * apply to the site's custom-styled scrollbar).
 */
function lock() {
  const root = document.documentElement;
  // Measure first: Chrome doesn't update clientWidth for a scrollbar change
  // synchronously, so a before/after diff reads 0.
  const bar = window.innerWidth - root.clientWidth;
  root.classList.add('morph-lock');
  if (bar > 0) root.style.paddingRight = `${bar}px`;
}

function unlock() {
  const root = document.documentElement;
  if (!root.classList.contains('morph-lock')) return;
  root.classList.remove('morph-lock');
  root.style.paddingRight = '';
}

export const hasOverlay = (id: string) => overlay?.id === id;

export function removeOverlay(instant = false) {
  const o = overlay;
  if (!o) return;
  overlay = null;
  unlock();
  clearTimeout(o.safety);
  window.removeEventListener('popstate', onPop);
  if (instant) {
    o.backdrop.remove();
    o.img.remove();
    return;
  }
  o.backdrop.style.opacity = '0';
  o.img.style.opacity = '0';
  window.setTimeout(() => {
    o.backdrop.remove();
    o.img.remove();
  }, 280);
}

/**
 * The real hero has mounted (showing the same image underneath): once the
 * flight has landed and the hero's image is decoded, line the overlay up with
 * the hero's exact box and fade it out.
 */
export async function handOff(id: string, hero: HTMLElement | null, heroImg: HTMLImageElement | null) {
  if (!hero || overlay?.id !== id) return;
  const o = overlay;
  // The real page is here: its own scrollbar may show again.
  unlock();
  // Removing the destination mid-flight would cancel the animation.
  if (running) await running;
  if (heroImg && !heroImg.complete) await heroImg.decode().catch(() => {});
  if (overlay !== o) return;
  const r = hero.getBoundingClientRect();
  o.img.style.transition = 'left .2s ease, top .2s ease, width .2s ease, height .2s ease, opacity .25s ease';
  o.img.style.viewTransitionName = '';
  Object.assign(o.img.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  window.setTimeout(() => removeOverlay(), 200);
}
