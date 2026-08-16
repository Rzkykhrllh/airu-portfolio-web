'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import Button from '@/components/ui/Button';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' (default) for destructive actions, 'primary' for neutral confirmations. */
  variant?: 'danger' | 'primary';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | undefined>(undefined);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Promise-based replacement for the browser's native confirm() — same call
 * shape (await, then branch on the boolean) but styled consistently with
 * the rest of the admin UI, and wording is centralized here instead of
 * six different call sites each writing their own (sometimes forgetting
 * "this cannot be undone").
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback(
    (value: boolean) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending]
  );

  useEffect(() => {
    if (!pending) return;

    confirmButtonRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pending, settle]);

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}

      {pending && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={() => settle(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {pending.title}
            </h2>
            <p id="confirm-dialog-message" className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {pending.message}
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => settle(false)}>
                {pending.cancelLabel || 'Cancel'}
              </Button>
              <Button
                ref={confirmButtonRef}
                type="button"
                variant={pending.variant === 'primary' ? 'primary' : 'danger'}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel || 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog(): ConfirmFn {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
}
