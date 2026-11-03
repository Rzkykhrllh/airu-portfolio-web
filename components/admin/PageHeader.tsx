import Link from 'next/link';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  /** Small line under the title (counts, hints). */
  description?: ReactNode;
  /** Optional "← Back" link above the title. */
  back?: { href: string; label: string };
  /** Right-aligned buttons. */
  actions?: ReactNode;
}

// Consistent title block for every admin page.
export default function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 lg:mb-8">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 mb-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          {back.label}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-[1.75rem] font-semibold tracking-tight text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
