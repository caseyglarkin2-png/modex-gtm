/** Client-safe: the one link to an account's intelligence page, from anywhere in GAP. */

/** The same rule as src/lib/data.ts slugify (the app-wide account slug). */
export const accountSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const accountHref = (name: string) => `/gap/accounts/${accountSlug(name)}`;

/** R60: where a reply is read and recorded: on its own account, never a list of every account's replies. */
export const RECORD_REPLY_ANCHOR = 'record-reply';
export const recordReplyHref = (name: string) => `${accountHref(name)}#${RECORD_REPLY_ANCHOR}`;

/** R60: a link into a cockpit lane (every account's cards, analyst words, no Next account): never a seller destination. */
export const isCockpitLaneHref = (href: string) => /^\/gap\/?\?(?:[^#]*&)?lane=/.test(href);

/** R60: a first touch or follow-up by its card: the dedicated pack page (redirects), never the cockpit lane. */
export const packHref = (decisionId: string) => `/gap/pack/${encodeURIComponent(decisionId)}`;

/**
 * R60: a link to the same account page keeps the seller's place in Work (Back to Work and Next account follow them
 * through the account's views and anchors). Any other link is returned unchanged.
 */
export function withWorkContext(href: string, accountName: string, index: number | null | undefined): string {
  if (index === null || index === undefined || !Number.isInteger(index) || index < 0) return href;
  const hashAt = href.indexOf('#');
  const hash = hashAt >= 0 ? href.slice(hashAt) : '';
  const head = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const queryAt = head.indexOf('?');
  const path = queryAt >= 0 ? head.slice(0, queryAt) : head;
  // The account's own page, or one of its cards' packs (the pack page ends with Back to Work / Next account too).
  if (path.replace(/\/+$/, '') !== accountHref(accountName) && !path.startsWith('/gap/pack/')) return href;
  const params = new URLSearchParams(queryAt >= 0 ? head.slice(queryAt + 1) : '');
  params.set('from', 'work');
  params.set('i', String(index));
  return `${path}?${params.toString()}${hash}`;
}

/** A Gmail search for someone's thread, in the signed-in seller's own mailbox (never whichever account is /u/0). */
export function gmailThreadHref(from: string, mailbox: string | null | undefined): string {
  const q = `#search/${encodeURIComponent(`from:"${from}"`)}`;
  return `https://mail.google.com/mail/u/0/${mailbox ? `?authuser=${encodeURIComponent(mailbox)}` : ''}${q}`;
}

/** The browser title for an account page, from its slug alone (no read): "general-mills" -> "General Mills | GAP". */
export function accountTitle(slug: string): string {
  const name = slug.split('-').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  return `${name || 'Account'} | GAP`;
}
