'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { arrive } from '@/lib/pageLeave';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  // New page committed: fade it in (see lib/pageLeave.ts).
  useLayoutEffect(() => {
    arrive();
  }, [pathname]);

  if (isAdminRoute) {
    // Admin routes: no header/footer, just children
    return <>{children}</>;
  }

  // Public routes: with header and footer
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer showCta={pathname !== '/about'} />
    </>
  );
}
