'use client';

import { useEffect, useState } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Hook for an operation that saves in the background (reorder, cover change):
 * `run(fn)` flips to "saving", then "saved" (auto-clears) or "error".
 */
export function useSaveState(savedMs = 1800) {
  const [state, setState] = useState<SaveState>('idle');

  useEffect(() => {
    if (state !== 'saved' && state !== 'error') return;
    const t = setTimeout(() => setState('idle'), state === 'error' ? 3500 : savedMs);
    return () => clearTimeout(t);
  }, [state, savedMs]);

  const run = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setState('saving');
    try {
      const result = await fn();
      setState('saved');
      return result;
    } catch (error) {
      setState('error');
      throw error;
    }
  };

  return { state, run, isSaving: state === 'saving' };
}

interface SaveStatusProps {
  state: SaveState;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
}

/**
 * Floating status pill (bottom-centre of the content area) — impossible to
 * miss, unlike a small inline "Saving…" text.
 */
export default function SaveStatus({
  state,
  savingLabel = 'Saving…',
  savedLabel = 'Saved',
  errorLabel = "Couldn't save — changes reverted",
}: SaveStatusProps) {
  const visible = state !== 'idle';

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 lg:left-[calc(50%+7.5rem)] -translate-x-1/2 z-50 transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div
        className={`flex items-center gap-2.5 h-11 pl-4 pr-5 rounded-full shadow-2xl text-sm font-medium ${
          state === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        }`}
      >
        {state === 'saving' && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
          </svg>
        )}
        {state === 'saved' && (
          <svg className="w-4 h-4 text-green-400 dark:text-green-600" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {state === 'error' && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 8v5M12 16.5v.5" />
          </svg>
        )}
        <span>{state === 'saving' ? savingLabel : state === 'saved' ? savedLabel : state === 'error' ? errorLabel : ''}</span>
      </div>
    </div>
  );
}
