'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Client-only: auth lives in localStorage.
    setIsMounted(true);
    if (!isAuthenticated()) {
      router.push('/admin/login');
    }
  }, [router]);

  // Before mount: identical server/client markup (avoids hydration mismatch).
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="hidden lg:block w-60 shrink-0 border-r border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950" />
        <div className="flex-1 p-6 lg:p-10 animate-pulse space-y-6">
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded-md" />
          <div className="h-12 bg-gray-200/70 dark:bg-gray-800/70 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200/70 dark:bg-gray-800/70 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen((open) => !open)} />
        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
