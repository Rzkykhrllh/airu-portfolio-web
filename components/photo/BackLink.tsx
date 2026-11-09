'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { canGoBackToGrid, canMorph, clearNames, morph, name } from '@/lib/photoTransition';

interface BackLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * "← Gallery" on the photo page. When the photo was opened from the grid and
 * nothing was pushed since, go *back* in history (keeps the grid's scroll
 * position) and shrink the hero back into its card.
 */
export default function BackLink({ href, className, children }: BackLinkProps) {
  const router = useRouter();

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (!canMorph() || !canGoBackToGrid()) return; // plain link
    e.preventDefault();
    clearNames();
    name(document.querySelector<HTMLElement>('[data-photo-hero-main]'));
    morph(() => router.back(), 1500);
  };

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
