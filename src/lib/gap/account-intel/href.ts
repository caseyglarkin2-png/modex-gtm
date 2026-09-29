/** Client-safe: the one link to an account's intelligence page, from anywhere in GAP. */

/** The same rule as src/lib/data.ts slugify (the app-wide account slug). */
export const accountSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const accountHref = (name: string) => `/gap/accounts/${accountSlug(name)}`;
