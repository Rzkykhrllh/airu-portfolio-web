'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, getUser } from '@/lib/auth';
import Button from '@/components/ui/Button';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Hamburger menu button - visible on mobile only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            PORTFOLIO Admin
          </h1>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">
            {user?.username}
          </span>

          <Link
            href="/"
            target="_blank"
            className="hidden md:inline text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            View Site →
          </Link>

          <Button variant="secondary" onClick={handleLogout} className="text-sm">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
