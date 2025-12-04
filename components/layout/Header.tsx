'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Gallery' },
    { href: '/collections', label: 'Collections' },
    { href: '/about', label: 'About' },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/10 dark:border-white/10"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight">
            PORTFOLIO
          </Link>

          <div className="flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium transition-colors hover:text-gray-900 dark:hover:text-white ${
                  pathname === link.href
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="underline"
                    className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                  />
                )}
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </motion.header>
  );
}
