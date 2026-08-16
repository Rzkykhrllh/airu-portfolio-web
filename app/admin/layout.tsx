'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ConfirmDialogProvider } from '@/components/providers/ConfirmDialogProvider';

interface AdminLayoutWrapperProps {
  children: ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </ToastProvider>
  );
}
