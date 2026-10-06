'use client';

/**
 * GAP subnav (account-first UX, UX-10): three seller items and an overflow.
 *
 *   WORK (/gap)   ACCOUNTS (/gap/accounts)   CAPTURE (/gap/capture)   More v (Add to GAP, Sources, Signals,
 *                                                                              All hypotheses, Learning, Notes)
 *
 * The intelligence and admin tools are not deleted: they live under More, out of the seller's normal path. Active
 * item from the pathname (the main sidebar's convention); a More item that is current keeps the menu label marked.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export const PRIMARY_TABS = [
  { label: 'Work', href: '/gap' },
  { label: 'Accounts', href: '/gap/accounts' },
  { label: 'Capture', href: '/gap/capture' },
] as const;

export const MORE_TABS = [
  // Universal Work Intake: the one front door (a link, a person, a list, a conversation).
  { label: 'Add to GAP', href: '/gap/add' },
  { label: 'Sources', href: '/gap/sources' },
  { label: 'Signals', href: '/gap/signals' },
  { label: 'All hypotheses', href: '/gap/hypotheses' },
  { label: 'Learning', href: '/gap/learning' },
  { label: 'Coverage', href: '/gap/coverage' },
  { label: 'Notes', href: '/gap/feedback' },
] as const;

function isActive(rawPathname: string, href: string): boolean {
  // next.config has trailingSlash: true, so the live pathname reads '/gap/'.
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : rawPathname;
  if (href === '/gap') return pathname === '/gap';
  if (href === '/gap/accounts') return pathname === '/gap/accounts' || pathname.startsWith('/gap/accounts/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

const ITEM = 'shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors';
const ACTIVE = 'border-[var(--primary)] text-[var(--primary)]';
const QUIET = 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]';

export function GapSubnav() {
  const pathname = usePathname();
  const more = useRef<HTMLDetailsElement>(null);
  // The menu closes on navigation (a details element otherwise stays open across client transitions).
  useEffect(() => {
    if (more.current) more.current.open = false;
  }, [pathname]);
  const moreActive = MORE_TABS.some((t) => isActive(pathname, t.href));
  return (
    <nav aria-label="GAP OS" data-testid="gap-subnav" className="flex flex-wrap items-center gap-x-1 border-b border-[var(--border)]">
      {PRIMARY_TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined} data-testid={`gap-subnav-${tab.label.toLowerCase()}`} className={cn(ITEM, active ? ACTIVE : QUIET)}>
            {tab.label}
          </Link>
        );
      })}
      <details ref={more} className="shrink-0 sm:relative" data-testid="gap-subnav-more">
        <summary className={cn(ITEM, 'cursor-pointer list-none marker:content-none', moreActive ? ACTIVE : QUIET)} aria-label="More GAP tools">
          More
        </summary>
        <ul className="mt-1 min-w-44 rounded-md border border-[var(--border)] bg-[var(--background)] p-1 shadow-md sm:absolute sm:left-0 sm:z-20" aria-label="More GAP tools">
          {MORE_TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href}>
                <Link href={tab.href} aria-current={active ? 'page' : undefined} data-testid={`gap-subnav-${tab.label.toLowerCase().replace(/\s+/g, '-')}`} className={cn('block rounded px-3 py-2 text-sm', active ? 'bg-[var(--muted)] text-[var(--primary)]' : 'hover:bg-[var(--muted)]')}>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </details>
    </nav>
  );
}
