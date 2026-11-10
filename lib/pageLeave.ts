'use client';

/**
 * Collection card -> collection page. The page itself doesn't fade out any
 * more (a blank screen read as "broken" while the next page loaded): the
 * header loading line and app/collections/[slug]/loading.tsx carry the wait.
 * This only remembers that the collection was opened from a card, so its
 * heading can rise in when it lands.
 */

let leftVia = false;

export function leave(navigate: () => void) {
  leftVia = true;
  navigate();
}

/** One-shot: did we get here through `leave()`? (plays the heading entrance) */
export function consumeLeave(): boolean {
  const v = leftVia;
  leftVia = false;
  return v;
}
