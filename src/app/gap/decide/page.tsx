/**
 * /gap/decide?t=<signed token>   (I02, GAP OS prospecting first, 2026-10-08)
 *
 * The briefing's decision links land here: the token (work/action-token.ts, op `decide`, item `<key>|<decision>`) is
 * verified, the decision is applied once through the one service (work/decide.ts) and the page says what happened,
 * with the way on (the account, the Signals page, Work). A forged or expired link applies nothing. Session only.
 */
import Link from 'next/link';
import { hubspotContactByEmail } from '@/lib/gap/opportunity/contact-reads';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { actionSecret, verifyActionToken } from '@/lib/gap/work/action-token';
import { applyDecision, decisionLine, isDecision } from '@/lib/gap/work/decide';
import { GapSubnav } from '@/components/gap/gap-subnav';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Decided' };

export default async function DecidePage({ searchParams }: { searchParams?: Promise<{ t?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/decide/'));
  const q = (await searchParams) ?? {};
  const now = new Date();
  const v = q.t ? verifyActionToken(q.t, { secret: actionSecret(), now }) : null;
  let body: { ok: true; line: string; href: string; accountName: string | null } | { ok: false; line: string };
  if (!v || !v.ok || v.payload.op !== 'decide' || !v.payload.item) {
    body = { ok: false, line: !v ? 'No decision link was given.' : !v.ok ? (v.reason === 'expired' ? 'This decision link has expired. Decide it on Work instead.' : 'This decision link could not be verified. Nothing was applied.') : 'This link is not a decision link.' };
  } else {
    const sep = v.payload.item.lastIndexOf('|');
    const key = sep > 0 ? v.payload.item.slice(0, sep) : '';
    const decision = sep > 0 ? v.payload.item.slice(sep + 1) : '';
    if (!key || !isDecision(decision)) body = { ok: false, line: 'This decision link names no decision. Nothing was applied.' };
    else {
      const r = await applyDecision(prisma, { key, decision, actor: session.user.email, now, via: 'gmail:link' }, { contactLookup: hubspotContactByEmail });
      body = r.ok ? { ok: true, line: decisionLine(r), href: r.href, accountName: r.accountName } : { ok: false, line: r.reason === 'not_found' ? 'That item is no longer on record.' : `Not applied: ${String(r.reason).replace(/_/g, ' ')}.` };
    }
  }
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{body.ok ? 'Decided' : 'Not decided'}</h1>
        <p className="mt-2 text-sm" data-testid="decide-line">{body.line}</p>
      </div>
      <p className="text-sm">
        {body.ok ? <Link href={body.href} className="underline">{body.accountName ? `Open ${body.accountName}` : 'Open the Signals page'}</Link> : null}
        {body.ok ? ' · ' : null}
        <Link href="/gap/" className="underline">Back to Work</Link>
      </p>
    </div>
  );
}
