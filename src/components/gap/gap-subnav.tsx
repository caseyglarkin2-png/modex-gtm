'use client';

/**
 * GAP subnav (dogfood UX pass): the one persistent tab strip shown across
 * every top-level GAP surface (/gap, /gap/hypotheses, /gap/learning) so
 * Casey never has to type a GAP URL by hand. Active tab is derived from the
 * pathname, same convention as the main sidebar's `isActiveNavModule`.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Queue', href: '/gap' },
  { label: 'Hypotheses', href: '/gap/hypotheses' },
  { label: 'Learning', href: '/gap/learning' },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/gap' && pathname.startsWith(`${href}/`));
}

export function GapSubnav() {
  const pathname = usePathname();
  return (
    <nav aria-label="GAP OS" data-testid="gap-subnav" className="flex items-center gap-1 border-b border-[var(--border)]">
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            data-testid={`gap-subnav-${tab.label.toLowerCase()}`}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
