/**
 * R63-B S7: a GAP link that names nothing (an account, a pack, a card that does not exist) said the prospect-facing
 * "404 Page Not Found. This page doesn't exist or has been moved." with exits to yardflow.ai and /demo/ only. GAP's
 * own not-found says what is missing in the seller's words and offers one way back: Work.
 */
import Link from 'next/link';

export const GAP_NOT_FOUND = {
  account: { title: 'This account is not on your list', body: 'No account in GAP answers to this link. It may have been renamed or merged; Work and Accounts list every account you have.' },
  pack: { title: 'This action pack is not on your list', body: 'No thesis or card in GAP answers to this link. Open the account from Work to prepare the touch.' },
  page: { title: 'This page is not in GAP', body: 'Nothing in GAP answers to this link.' },
} as const;

/** The tab title for a GAP link that names nothing. */
export const GAP_NOT_FOUND_TITLE = 'Not found | GAP';

export function GapNotFound({ what }: { what: keyof typeof GAP_NOT_FOUND }) {
  const t = GAP_NOT_FOUND[what];
  return (
    <div className="mx-auto max-w-2xl space-y-3 py-10" data-testid="gap-not-found" data-what={what}>
      <h1 className="text-xl font-semibold">{t.title}</h1>
      <p className="text-sm text-[var(--muted-foreground)]">{t.body}</p>
      <Link href="/gap" className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-3 text-sm hover:bg-[var(--muted)]" data-testid="gap-not-found-work">
        Back to Work
      </Link>
    </div>
  );
}
