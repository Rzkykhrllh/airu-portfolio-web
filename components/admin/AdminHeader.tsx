'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, getUser } from '@/lib/auth';
import Button from '@/components/ui/Button';

export default function AdminHeader() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            PORTFOLIO Admin
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user?.username}
          </span>

          <Link
            href="/"
            target="_blank"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
