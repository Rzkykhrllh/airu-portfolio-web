'use client';

import { useEffect, useRef } from 'react';

/**
 * Desktop-only cursor label: over anything with `data-cursor="…"` (photo
 * cards, collection covers) a small round "View" badge follows the pointer.
 * Touch / pen and devices without hover never see it. Reduced motion keeps
 * the badge but drops the trailing ease.
 */
export default function ViewCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const labelEl = labelRef.current;
    if (!el || !labelEl || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const root = document.documentElement;
    root.classList.add('has-view-cursor');
    const ease = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0.22;

    let x = 0;
    let y = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let on = false;

    const place = () => {
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    };
    const loop = () => {
      cx += (x - cx) * ease;
      cy += (y - cy) * ease;
      place();
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(loop) : 0;
    };
    const setOn = (label: string | null) => {
      if (label) {
        if (!on) {
          // Appear right under the pointer, not flying in from the last spot.
          cx = x;
          cy = y;
          place();
        }
        labelEl.textContent = label;
      }
      on = !!label;
      el.dataset.on = on ? 'true' : 'false';
    };
    const labelAt = (target: EventTarget | null) =>
      target instanceof Element ? target.closest('[data-cursor]')?.getAttribute('data-cursor') ?? null : null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      setOn(labelAt(e.target));
      if (!raf) raf = requestAnimationFrame(loop);
    };
    // Scrolling moves things under a still pointer.
    const onScroll = () => {
      if (on || x || y) setOn(labelAt(document.elementFromPoint(x, y)));
    };
    const hide = () => setOn(null);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', hide);
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove('has-view-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', hide);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-on="false"
      className="group/cursor pointer-events-none fixed left-0 top-0 z-[60] hidden [@media(hover:hover)_and_(pointer:fine)]:block"
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white/85 text-neutral-900 shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-md scale-50 opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[on=true]/cursor:scale-100 group-data-[on=true]/cursor:opacity-100 motion-reduce:transition-none">
          <span ref={labelRef} className="text-[0.625rem] uppercase tracking-[0.22em] pl-[0.22em]">
            View
          </span>
        </div>
      </div>
    </div>
  );
}
