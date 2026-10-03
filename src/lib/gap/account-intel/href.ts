/** Client-safe: the one link to an account's intelligence page, from anywhere in GAP. */

/** The same rule as src/lib/data.ts slugify (the app-wide account slug). */
export const accountSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const accountHref = (name: string) => `/gap/accounts/${accountSlug(name)}`;

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
