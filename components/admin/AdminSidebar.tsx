'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getInquiries } from '@/lib/api';
import { getUser, logout } from '@/lib/auth';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  {
    label: 'Photos',
    href: '/admin/photos',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    label: 'Collections',
    href: '/admin/collections',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    label: 'Inquiries',
    href: '/admin/inquiries',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const user = getUser();
  const [unreadInquiries, setUnreadInquiries] = useState(0);

  useEffect(() => {
    getInquiries({ limit: 1 })
      .then((result) => setUnreadInquiries(result.unreadCount))
      .catch((error) => console.error('Failed to load inquiry count:', error));
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-60 shrink-0 flex flex-col
          bg-white dark:bg-gray-950 border-r border-gray-200/80 dark:border-gray-800
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between">
          <Link href="/admin/photos" onClick={onClose} className="flex items-center gap-2.5" aria-label="Admin home">
            <Logo size="sm" animated={false} />
          </Link>
          <span className="text-[0.625rem] uppercase tracking-[0.18em] text-gray-400">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <svg
                  className={`w-[18px] h-[18px] ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="flex-1">{item.label}</span>
                {item.href === '/admin/inquiries' && unreadInquiries > 0 && (
                  <span className="min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[0.6875rem] font-semibold tabular-nums bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                    {unreadInquiries}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: site link, theme, account */}
        <div className="p-3 space-y-0.5 border-t border-gray-200/80 dark:border-gray-800">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 h-10 px-3 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <svg className="w-[18px] h-[18px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
            </svg>
            View site
          </a>
          <div className="flex items-center gap-3 h-12 pl-3 pr-1">
            <span className="w-7 h-7 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold inline-flex items-center justify-center uppercase">
              {user?.username?.[0] ?? 'A'}
            </span>
            <span className="flex-1 min-w-0 text-sm text-gray-900 dark:text-gray-100 truncate">{user?.username}</span>
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17l5-5-5-5M20 12H9M12 20H5a1 1 0 01-1-1V5a1 1 0 011-1h7" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
