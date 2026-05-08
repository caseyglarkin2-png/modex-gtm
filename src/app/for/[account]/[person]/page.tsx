/**
 * Sprint M3.10 / partial M5 — the per-person route now redirects to the
 * account microsite with `?p=<person-slug>`. The reader-aware rendering
 * (KPI vocabulary swap, comparable hooks, etc.) lands in full M5; for now
 * the redirect is a permanent ("301" semantics) move so existing email
 * links keep working while the route hierarchy collapses to a single
 * memo per account.
 *
 * M7 deletes this file entirely once the redirect has been in place
 * long enough to expire any cached external links.
 */

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PersonMicrositeRedirect({
  params,
}: {
  params: Promise<{ account: string; person: string }>;
}) {
  const { account, person } = await params;
  redirect(`/for/${account}?p=${encodeURIComponent(person)}`);
}
