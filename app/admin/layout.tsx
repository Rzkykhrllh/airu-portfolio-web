'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ConfirmDialogProvider } from '@/components/providers/ConfirmDialogProvider';
import { UndoDeleteProvider } from '@/components/providers/UndoDeleteProvider';

interface AdminLayoutWrapperProps {
  children: ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return (
    <ToastProvider>
      <UndoDeleteProvider>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </UndoDeleteProvider>
    </ToastProvider>
  );
}
