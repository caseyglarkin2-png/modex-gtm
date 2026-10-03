'use client';

/**
 * A link that says it is working the moment it is clicked (click test round 3: "Do this next" sat 11s with no
 * feedback, a tab click kept the old tab up for ~4s). The page behind it is server-rendered and slow on a cold
 * read; the click is acknowledged at once.
 */
import Link, { useLinkStatus } from 'next/link';
import type { ComponentProps } from 'react';

function Pending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal">
      <span aria-hidden className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
      <span role="status">Opening</span>
    </span>
  );
}

export function PendingLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <Pending />
    </Link>
  );
}
