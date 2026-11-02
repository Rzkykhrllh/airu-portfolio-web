'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

// Bare icon button — no chip, no color; sits quietly in the nav.
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Same footprint before mount so the nav doesn't shift.
  if (!mounted) return <span className="block w-5 h-5" aria-hidden="true" />;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="block p-0.5 -m-0.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
        {isDark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path strokeLinecap="round" d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7L5.3 5.3" />
          </>
        ) : (
          <path strokeLinejoin="round" d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
        )}
      </svg>
    </button>
  );
}
