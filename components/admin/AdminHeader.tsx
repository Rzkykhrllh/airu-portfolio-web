'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

// Mobile/tablet-only top bar. On desktop the sidebar carries the brand,
// site link and account controls, so there's no header at all.
export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800">
      <Link href="/admin/photos" className="flex items-center" aria-label="Admin home">
        <Logo size="sm" animated={false} />
      </Link>
      <button
        onClick={onMenuClick}
        className="w-10 h-10 -mr-2 inline-flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </header>
  );
}
