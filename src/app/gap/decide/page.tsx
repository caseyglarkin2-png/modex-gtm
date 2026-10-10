/**
 * /gap/decide?t=<signed token>   (I02, GAP OS prospecting first, 2026-10-08)
 *
 * The briefing's decision links land here: the token (work/action-token.ts, op `decide`, item `<key>|<decision>`) is
 * verified, the decision is applied once through the one service (work/decide.ts) and the page says what happened,
 * with the way on (the account, the Signals page, Work). A forged or expired link applies nothing. Session only.
 *
 * The undo of `never` (2026-10-10, Casey: "Add undo for 'never'"): the undo is offered where the never was taken. A
 * `never` link on a sender already marked says "Not a prospect since <date>; list this sender again?" with the
 * control instead of a second never; a never just applied offers "List this sender again" beside its answer; a
 * `relist` link confirms what stands and what stays (an opt-out, a suppression or do not contact). The control is a
 * fresh signed `relist` token minted here for the signed-in seller, confirmed by its one click like every decision.
 */
import Link from 'next/link';
import { hubspotContactByEmail } from '@/lib/gap/opportunity/contact-reads';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { actionSecret, executionAllowed, signActionToken, verifyActionToken } from '@/lib/gap/work/action-token';
import { applyDecision, decisionLine, isDecision, neverStanding } from '@/lib/gap/work/decide';
import { nyDay } from '@/lib/gap/work/dates';
import { RELIST_WORDS, notProspectSince, relistDomainWords } from '@/lib/gap/work/truth-text';
import type { NeverMark } from '@/lib/gap/work/intel';
import { GapSubnav } from '@/components/gap/gap-subnav';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Decided' };

const DECISION_WORDS: Record<string, string> = { pursue: 'Pursue', explore: 'Explore', save: 'Save', skip: 'Skip', dismiss: 'Dismiss', more: 'Find out more about', never: 'Not a prospect', relist: RELIST_WORDS };

const BUTTON = 'inline-flex min-h-11 items-center rounded-md bg-[var(--primary)] px-3 text-sm font-semibold text-[var(--primary-foreground)]';

const idOf = (key: string) => key.slice(key.indexOf(':') + 1);
const relistWords = (key: string) => (key.startsWith('domain:') ? relistDomainWords(idOf(key)) : RELIST_WORDS);
const KEPT = 'Only that mark is reversed: an opt-out, a suppression or do not contact stays.';

/** The confirm question in words (the people fix of 2026-10-10 adds `never` on a person or a domain, and its undo). */
function confirmLine(decision: string, key: string, standing: NeverMark | null): string {
  const id = idOf(key);
  if (decision === 'never') return key.startsWith('domain:') ? `Not a prospect: never list anyone at ${id} again?` : `Not a prospect: never list this sender (${id}) again?`;
  if (decision === 'relist') {
    const ask = key.startsWith('domain:') ? `List anyone at ${id} again?` : `List this sender (${id}) again?`;
    return `${standing ? `${notProspectSince(standing.since)}. ` : ''}${ask} ${KEPT}`;
  }
  return `${DECISION_WORDS[decision]} ${key.startsWith('person:') ? 'the person' : key.startsWith('trigger:') ? 'the trigger' : 'the signal'} (${id})?`;
}

/** The one-click form a decision takes (the token it carries, confirmed). */
function DecideForm({ token, label, testId, buttonTestId }: { token: string; label: string; testId: string; buttonTestId: string }) {
  return (
    <form method="get" action="/gap/decide" className="flex flex-wrap items-center gap-3" data-testid={testId}>
      <input type="hidden" name="t" value={token} />
      <input type="hidden" name="confirmed" value="1" />
      <button type="submit" className={BUTTON} data-testid={buttonTestId}>
        {label}
      </button>
      <Link href="/gap/" className="text-sm underline">Not now, back to Work</Link>
    </form>
  );
}

export default async function DecidePage({ searchParams }: { searchParams?: Promise<{ t?: string; confirmed?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/decide/'));
  const q = (await searchParams) ?? {};
  const now = new Date();
  const secret = actionSecret();
  // The undo's control: a fresh relist token for this key, minted for the signed-in seller (null without a secret).
  const relistToken = (key: string): string | null => (secret ? signActionToken({ op: 'decide', item: `${key}|relist`, day: nyDay(now) }, { secret, now }) : null);
  const v = q.t ? verifyActionToken(q.t, { secret, now }) : null;
  let body: { ok: true; line: string; href: string; accountName: string | null; undo: { token: string; label: string } | null } | { ok: false; line: string };
  if (!v || !v.ok || v.payload.op !== 'decide' || !v.payload.item) {
    body = { ok: false, line: !v ? 'No decision link was given.' : !v.ok ? (v.reason === 'expired' ? 'This decision link has expired. Decide it on Work instead.' : 'This decision link could not be verified. Nothing was applied.') : 'This link is not a decision link.' };
  } else {
    const sep = v.payload.item.lastIndexOf('|');
    const key = sep > 0 ? v.payload.item.slice(0, sep) : '';
    const decision = sep > 0 ? v.payload.item.slice(sep + 1) : '';
    if (!key || !isDecision(decision)) body = { ok: false, line: 'This decision link names no decision. Nothing was applied.' };
    else if (!executionAllowed({ op: 'decide', method: 'GET', confirmed: q.confirmed === '1' }).ok) {
      // C43 / C57 F-C2: a bare GET (a link preview, a prefetch, a scanner) executes nothing. One click confirms.
      const standing = decision === 'never' || decision === 'relist' ? await neverStanding(prisma, key).catch(() => null) : null;
      if (decision === 'never' && standing) {
        // The undo where the never was taken: a never link on a sender already marked offers the reversal, not a second never.
        const token = relistToken(standing.key);
        return (
          <div className="mx-auto max-w-2xl space-y-5">
            <GapSubnav />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Already not a prospect</h1>
              <p className="mt-2 text-sm" data-testid="decide-confirm-line">
                {notProspectSince(standing.since)}; {standing.kind === 'domain' ? `list anyone at ${standing.id} again?` : 'list this sender again?'} {KEPT} Nothing is applied until you confirm; nothing is sent to anyone either way.
              </p>
            </div>
            {token ? <DecideForm token={token} label={relistWords(standing.key)} testId="decide-relist-form" buttonTestId="decide-relist" /> : <p className="text-sm"><Link href="/gap/" className="underline">Back to Work</Link></p>}
          </div>
        );
      }
      if (decision === 'relist' && !standing) {
        body = { ok: false, line: `${idOf(key)} is not marked not a prospect, so there is nothing to list again. Nothing was applied.` };
      } else {
        return (
          <div className="mx-auto max-w-2xl space-y-5">
            <GapSubnav />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Confirm the decision</h1>
              <p className="mt-2 text-sm" data-testid="decide-confirm-line">
                {confirmLine(decision, key, standing)} Nothing is applied until you confirm; nothing is sent to anyone either way.
              </p>
            </div>
            <DecideForm token={q.t as string} label={decision === 'relist' ? relistWords(key) : DECISION_WORDS[decision]} testId="decide-confirm-form" buttonTestId="decide-confirm" />
          </div>
        );
      }
    } else {
      const r = await applyDecision(prisma, { key, decision, actor: session.user.email, now, via: 'gmail:link' }, { contactLookup: hubspotContactByEmail });
      // The undo beside a never just taken: the same key, one click to reverse it.
      const undoToken = r.ok && r.decision === 'never' ? relistToken(r.key) : null;
      body = r.ok
        ? { ok: true, line: decisionLine(r), href: r.href, accountName: r.accountName, undo: undoToken ? { token: undoToken, label: relistWords(r.key) } : null }
        : { ok: false, line: r.reason === 'not_found' ? 'That item is no longer on record.' : r.reason === 'nothing_to_relist' ? `${idOf(key)} is not marked not a prospect, so there is nothing to list again. Nothing was applied.` : `Not applied: ${String(r.reason).replace(/_/g, ' ')}.` };
    }
  }
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{body.ok ? 'Decided' : 'Not decided'}</h1>
        <p className="mt-2 text-sm" data-testid="decide-line">{body.line}</p>
      </div>
      {body.ok && body.undo ? (
        <div className="space-y-2" data-testid="decide-undo">
          <p className="text-sm text-[var(--muted-foreground)]">Changed your mind? This reverses only the not-a-prospect mark.</p>
          <DecideForm token={body.undo.token} label={body.undo.label} testId="decide-relist-form" buttonTestId="decide-relist" />
        </div>
      ) : null}
      <p className="text-sm">
        {body.ok ? <Link href={body.href} className="underline">{body.accountName ? `Open ${body.accountName}` : 'Open the Signals page'}</Link> : null}
        {body.ok ? ' · ' : null}
        <Link href="/gap/" className="underline">Back to Work</Link>
      </p>
    </div>
  );
}
