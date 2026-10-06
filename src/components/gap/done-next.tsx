'use client';

/**
 * DONE, NEXT (account-first UX, UX-09): one bar under NEXT when the account was opened from Work. It records
 * nothing itself (the outcome is whatever the seller did above: the email, the call, the touch, the disposition);
 * it moves to the next account in the order Work held when it was opened, with Back to the previous account and
 * Back to Work restoring the filter, the search and this card. Not a wizard: every link is a plain link, the seller
 * can leave at any point, and a deep link without the order still offers Back to Work.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { doneNextLinks, readWorkOrder, type DoneNextLinks } from '@/lib/gap/work/order';

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90`;
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)]`;

export function DoneNext({ slug, index }: { slug: string; index: number | null }) {
  // The order lives in session storage: read after mount (the server renders the bar with Back to Work only).
  const [links, setLinks] = useState<DoneNextLinks>(() => doneNextLinks(null, index, slug));
  useEffect(() => {
    setLinks(doneNextLinks(readWorkOrder(), index, slug));
  }, [index, slug]);
  return (
    <nav className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2" aria-label="Work order" data-testid="done-next" data-position={links.position ? `${links.position.n}/${links.position.of}` : 'none'}>
      <p className="min-w-0 flex-1 text-xs text-[var(--muted-foreground)]" data-testid="done-next-position">
        {links.position ? `Account ${links.position.n} of ${links.position.of} in Work.${links.next ? '' : ' The last one.'}` : 'Opened from Work.'}
      </p>
      {links.back ? (
        <Link href={links.back.href} className={OUTLINE} data-testid="done-next-back" aria-label={`Back to ${links.back.name}`}>
          Back
        </Link>
      ) : null}
      <Link href={links.backToWork} className={links.next ? OUTLINE : PRIMARY} data-testid="done-next-work">
        Back to Work
      </Link>
      {links.next ? (
        <Link href={links.next.href} className={PRIMARY} data-testid="done-next-next" aria-label={`Next account: ${links.next.name}`}>
          Next account
        </Link>
      ) : null}
    </nav>
  );
}
