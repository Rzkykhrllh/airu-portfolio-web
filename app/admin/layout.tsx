'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/providers/ToastProvider';

interface AdminLayoutWrapperProps {
  children: ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return <ToastProvider>{children}</ToastProvider>;
}
