'use client';

import { createContext, useCallback, useContext, useRef, ReactNode } from 'react';
import { useToast } from './ToastProvider';

const DEFAULT_GRACE_MS = 6000;

interface RequestDeleteOptions {
  /** Unique key for this pending delete (e.g. a photo id, or a batch key). */
  key: string;
  /** Toast message shown while the delete is pending, e.g. `"Sunset" deleted.` */
  message: string;
  /** Actually performs the delete (the real API call + any final local sync). */
  commit: () => Promise<void>;
  /** Restores whatever local UI state was optimistically hidden. */
  undo: () => void;
  durationMs?: number;
}

interface UndoDeleteContextType {
  requestDelete: (options: RequestDeleteOptions) => void;
}

const UndoDeleteContext = createContext<UndoDeleteContextType | undefined>(undefined);

/**
 * Centralizes the "delete doesn't happen for N seconds, with an Undo toast"
 * pattern used across the admin panel's delete buttons (single-photo delete
 * in PhotoGrid/PhotoListItem/PhotoEditModal, and bulk delete). Living at the
 * provider level (rather than per-component state) matters specifically for
 * PhotoEditModal: it closes immediately on delete, so a local timer would be
 * lost the instant the component unmounts — this one survives that.
 *
 * If the tab is closed or navigated away before the grace period elapses,
 * `commit` simply never runs — the photo silently stays un-deleted server
 * side. That's an intentionally safe failure mode: the worst case is an
 * admin has to delete again, never that a delete fires without ever having
 * been shown as undoable.
 */
export function UndoDeleteProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const requestDelete = useCallback(
    ({ key, message, commit, undo, durationMs = DEFAULT_GRACE_MS }: RequestDeleteOptions) => {
      // If something is already pending under this key, finalize it now
      // rather than silently dropping it — shouldn't normally happen, but
      // avoids a leaked timer if a delete is somehow requested twice.
      const existing = timers.current.get(key);
      if (existing) {
        clearTimeout(existing);
        timers.current.delete(key);
      }

      const timer = setTimeout(() => {
        timers.current.delete(key);
        commit().catch((error) => {
          console.error(`Failed to finalize delete for "${key}":`, error);
        });
      }, durationMs);
      timers.current.set(key, timer);

      toast.undoable(
        message,
        () => {
          const pending = timers.current.get(key);
          if (pending) {
            clearTimeout(pending);
            timers.current.delete(key);
            undo();
          }
        },
        durationMs
      );
    },
    [toast]
  );

  return <UndoDeleteContext.Provider value={{ requestDelete }}>{children}</UndoDeleteContext.Provider>;
}

export function useUndoDelete(): UndoDeleteContextType {
  const context = useContext(UndoDeleteContext);
  if (!context) {
    throw new Error('useUndoDelete must be used within UndoDeleteProvider');
  }
  return context;
}
