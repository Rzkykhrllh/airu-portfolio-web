'use client';

/**
 * Tiny pub/sub for the top-of-page loading line (components/ui/NavProgress).
 * `startProgress()` when a navigation begins (internal link clicks are picked
 * up automatically; call it yourself before a bare router.push), and
 * ConditionalLayout calls `doneProgress()` whenever the pathname changes.
 */

type Listener = (state: 'start' | 'done') => void;
const listeners = new Set<Listener>();

export function onProgress(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function startProgress() {
  listeners.forEach((fn) => fn('start'));
}

export function doneProgress() {
  listeners.forEach((fn) => fn('done'));
}
