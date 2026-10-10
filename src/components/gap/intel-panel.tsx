'use client';
/**
 * THE INTELLIGENCE PANEL (I04, GAP OS prospecting first, 2026-10-08): the day's intelligence on Work, for Casey to
 * decide on. Three lists from work/intel.ts (signals and triggers worth a look; people who wrote in and went quiet),
 * each item with its source and dates said as what they are, the account when known, the prepared angle when the
 * agent has one, and the decisions: Pursue, Explore, Save, Skip, Dismiss, More (POST /api/gap/decide). Nothing here
 * contacts anyone. Voice: no em dashes, "yards" plural.
 *
 * The undo of `never` (2026-10-10): the senders and domains marked not a prospect are listed under the people, each
 * with "Not a prospect since <date>" and its reversal ("List this sender again", decision `relist`), which ends only
 * that mark.
 */
import { useState } from 'react';
import { AnglePromote } from './angle-promote';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Intelligence, IntelItem, Decision, NeverMark, PursuedItem } from '@/lib/gap/work/intel';
import type { PreparedAngle } from '@/lib/gap/agents/develop-angle';
import { RELIST_WORDS, TRUTH_TEXT, notProspectSince, relistDomainWords } from '@/lib/gap/work/truth-text';
import { AccountLink } from './account-link';
import { accountHref } from '@/lib/gap/account-intel/href';
import { refreshNow } from './refresh-now';
import { ActionStatus } from './action-status';
import { postAction, type ActionResult } from '@/lib/gap/ui/action-result';

/** C44: a decision came to accepted or queued (an angle task); anything else stands as its own state with a next path. */
const landed = (r: ActionResult) => r.state === 'accepted' || r.state === 'queued' || r.state === 'prepared';

const BTN = 'min-h-11 rounded-md border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--muted)] disabled:opacity-50 sm:min-h-9';
const PRIMARY = 'min-h-11 rounded-md bg-[var(--primary)] px-3 py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 sm:min-h-9';
const DECISION_TEXT: Record<Decision, string> = { pursue: 'Pursue', explore: 'Explore', save: 'Save', skip: 'Skip', dismiss: 'Dismiss', more: 'More', never: 'Not a prospect', relist: RELIST_WORDS };

/** A standing never, reversible: the mark said with its date, and the one control that ends only it. */
function NotProspect({ m }: { m: NeverMark }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  async function relist() {
    setBusy(true);
    const r = await postAction('/api/gap/decide', { key: m.key, decision: 'relist' }, { verb: 'Listed again', source: m.key });
    setResult(r);
    setBusy(false);
    if (landed(r)) refreshNow(router);
  }
  return (
    <li data-testid="intel-not-prospect" data-key={m.key} className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-medium">{m.kind === 'domain' ? `Everyone at ${m.id}` : m.id}</span>
      <span className="text-[var(--muted-foreground)]" data-testid="intel-not-prospect-since">{notProspectSince(m.since)}{m.note ? `; your note: ${m.note}` : ''}</span>
      <button type="button" className={BTN} disabled={busy} onClick={() => void relist()} data-testid="intel-relist">
        {m.kind === 'domain' ? relistDomainWords(m.id) : RELIST_WORDS}
      </button>
      <ActionStatus result={result} testId="intel-relisted" busy={busy} onRetry={() => void relist()} />
    </li>
  );
}

function Item({ item, angle }: { item: IntelItem; angle: PreparedAngle | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [last, setLast] = useState<Decision | null>(null);
  async function decide(decision: Decision) {
    // Explore opens the source AND records the look (the review's finding 13: one meaning for explore).
    if (decision === 'explore' && item.url) window.open(item.url, '_blank', 'noopener');
    setBusy(true);
    setLast(decision);
    // C44: never throws; refused, failed and unknown each come back as a state with its next path and the button free again.
    const r = await postAction('/api/gap/decide', { key: item.key, decision }, { verb: 'Decided', source: item.key });
    setResult(r);
    setBusy(false);
    if (landed(r)) refreshNow(router);
  }
  return (
    <li data-testid="intel-item" data-kind={item.kind} data-key={item.key} className="space-y-1 rounded-md border border-[var(--border)] p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted-foreground)]">
        <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-semibold" data-testid="intel-truth">{TRUTH_TEXT[item.truth]}</span>
        {item.accountName ? <AccountLink name={item.accountName} /> : item.ambiguousAmong?.length ? <span data-testid="intel-ambiguous">{item.ambiguityLine ?? `claimed by ${item.ambiguousAmong.join(' and ')}: choose the account`}</span> : <span data-testid="intel-no-account">{item.accountHint ? `${item.accountHint} (no account yet)` : 'No account yet'}</span>}
        {item.inDeal ? <span className="rounded bg-amber-500/15 px-1.5 py-0.5" data-testid="intel-in-deal">in an open deal</span> : null}
      </div>
      <p className="font-medium">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">{item.title}</a> : item.title}</p>
      <p className="text-xs text-[var(--muted-foreground)]" data-testid="intel-line">{item.line}</p>
      {item.substance ? (
        <div className="space-y-1 rounded-md border border-[var(--border)] p-2 text-xs" data-testid="intel-substance">
          <p className="whitespace-pre-line" data-testid="intel-substance-text">{item.substance.text}</p>
          {item.substance.uncertainty ? <p className="text-[var(--muted-foreground)]" data-testid="intel-substance-uncertainty">In the producer&apos;s words: {item.substance.uncertainty}</p> : null}
          {item.substance.interpretation ? <p className="whitespace-pre-line text-[var(--muted-foreground)]" data-testid="intel-substance-read">The producer&apos;s read (not an obligation): {item.substance.interpretation}</p> : null}
          {item.substance.sources.length || item.substance.sourceRecordIds.length ? (
            <p className="text-[var(--muted-foreground)]" data-testid="intel-substance-sources">
              {item.substance.sources.filter((s) => s.url).map((s, i) => (
                <span key={s.url ?? i}>{i ? '; ' : 'Sources: '}<a href={s.url ?? undefined} target="_blank" rel="noopener noreferrer" className="underline">{s.label ?? s.publisher ?? s.url}</a></span>
              ))}
              {item.substance.sourceRecordIds.length ? ` CRM: ${item.substance.sourceRecordIds.map((r) => `${r.system} ${r.type} ${r.id}`).join(', ')}.` : ''}
            </p>
          ) : null}
          <p className="text-[var(--muted-foreground)]">Reported {item.substance.reportedOn} by {item.substance.producerLabel}{item.substance.eventDate ? `; event date ${item.substance.eventDate}` : ''}; imported {item.substance.importedAt.slice(0, 10)}{item.substance.revisions ? `; revised ${item.substance.revisions} time${item.substance.revisions === 1 ? '' : 's'}` : ''}{item.substance.suggestions ? `; ${item.substance.suggestions} drafted message${item.substance.suggestions === 1 ? '' : 's'} archived, never sent` : ''}.</p>
        </div>
      ) : null}
      {angle ? (
        <div className="rounded-md bg-[var(--muted)] p-2 text-xs" data-testid="intel-angle">
          <p className="font-semibold">The angle, prepared by GAP</p>
          <p className="mt-1">{angle.whyItMatters}</p>
          {angle.peopleNamed.length ? <p className="mt-1">Who: {angle.peopleNamed.map((p) => `${p.name ?? `person ${p.personaId}`}${p.title ? ` (${p.title})` : ''}`).join('; ')}.</p> : angle.roles.length ? <p className="mt-1">Roles: {angle.roles.join(', ')}.</p> : null}
          {angle.accounts.length && !item.accountName ? <p className="mt-1">Accounts: {angle.accounts.join(', ')}.</p> : null}
          <ul className="mt-1 list-disc pl-4">{angle.starters.map((s, i) => <li key={i}>{s}</li>)}</ul>
          <p className="mt-1 text-[var(--muted-foreground)]">Proposed: {angle.proposedAction === 'email' ? 'an email' : angle.proposedAction === 'call' ? 'a call' : 'research first'}.{angle.caveat ? ` ${angle.caveat}` : ''} Source: {angle.sourceLine}.</p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {item.decisions.map((d) => (
          <button key={d} type="button" className={d === 'pursue' ? PRIMARY : BTN} disabled={busy} onClick={() => void decide(d)} data-testid={`intel-decide-${d}`}>
            {DECISION_TEXT[d]}
          </button>
        ))}
        <ActionStatus result={result} testId="intel-decided" busy={busy} onRetry={() => { if (last) void decide(last); }} />
      </div>
    </li>
  );
}

function Section({ title, hint, items, angles, testId, total, selection, moreHref }: { title: string; hint: string; items: IntelItem[]; angles: Record<string, PreparedAngle>; testId: string; total: number; /** C34: how the selection was made, in words. */ selection?: string; /** C34: the next page, when more exists beyond this one. */ moreHref?: string | null }) {
  return (
    <section className="space-y-2" data-testid={testId} aria-label={title}>
      <h2 className="text-sm font-semibold">
        {title} <span className="text-xs font-normal text-[var(--muted-foreground)]">({items.length}{total > items.length ? ` of ${total}` : ''})</span>
      </h2>
      <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
      {items.length ? <ul className="space-y-2">{items.map((it) => <Item key={it.key} item={it} angle={angles[it.key] ?? null} />)}</ul> : <p className="text-xs italic text-[var(--muted-foreground)]">Nothing waiting for a decision.</p>}
      {selection ? <p className="text-[11px] text-[var(--muted-foreground)]" data-testid={`${testId}-selection`}>How this was chosen: {selection}.{moreHref ? <> <Link href={moreHref} className="underline">More</Link></> : null}</p> : null}
    </section>
  );
}

function Pursued({ p }: { p: PursuedItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  async function done() {
    setBusy(true);
    const r = await postAction('/api/gap/decide', { key: p.key, decision: 'dismiss' }, { verb: 'Done', source: p.key });
    setResult(landed(r) ? { ...r, line: 'Done with it.' } : r);
    setBusy(false);
    if (landed(r)) refreshNow(router);
  }
  const a = p.angle;
  return (
    <li data-testid="intel-pursued" data-key={p.key} data-status={p.status} className="space-y-1 rounded-md border border-[var(--primary)] p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted-foreground)]">
        <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-semibold">{p.status === 'ready' ? 'The angle is ready' : p.status === 'failed' ? 'GAP could not develop the angle' : 'GAP is developing the angle'}</span>
        {p.accountName ? <AccountLink name={p.accountName} /> : p.ambiguousAmong?.length ? <span data-testid="intel-pursued-ambiguous">{p.ambiguityLine ?? `claimed by ${p.ambiguousAmong.join(' and ')}: choose the account`}</span> : <span data-testid="intel-pursued-no-account">{p.accountHint ? `${p.accountHint} (no account yet)` : 'No account yet'}</span>}
        {p.dealLine ? <span className="rounded bg-amber-500/15 px-1.5 py-0.5" data-testid="intel-pursued-deal">{p.dealLine}</span> : null}
      </div>
      <p className="font-medium">{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline">{p.title}</a> : p.title}</p>
      {/* Seller acceptance (2026-10-09): a person placed at read time (the task predates the identity fix) says so; nothing is queued, the seller decides. */}
      {p.placementLine ? <p className="text-xs text-amber-700 dark:text-amber-400" data-testid="intel-pursued-placement">{p.placementLine}.</p> : null}
      {a ? (
        <div className="rounded-md bg-[var(--muted)] p-2 text-xs" data-testid="intel-pursued-angle">
          <p>{a.whyItMatters}</p>
          {a.peopleNamed.length ? <p className="mt-1">Who: {a.peopleNamed.map((x) => `${x.name ?? `person ${x.personaId}`}${x.title ? ` (${x.title})` : ''}`).join('; ')}.</p> : a.roles.length ? <p className="mt-1">Roles: {a.roles.join(', ')}.</p> : null}
          {a.accounts.length && !p.accountName ? <p className="mt-1">Accounts: {a.accounts.join(', ')}.</p> : null}
          <ul className="mt-1 list-disc pl-4">{a.starters.map((s, i) => <li key={i}>{s}</li>)}</ul>
          {/* C24: the one control that promotes an accepted angle into the existing draft workflow (builder B's component); nothing sends. */}
          <div className="mt-2"><AnglePromote taskId={p.taskId} writer={p.writer ?? null} people={a.peopleNamed} proposedAction={(a.proposedAction === 'call' || a.proposedAction === 'research' ? a.proposedAction : 'email')} accountName={p.accountName} /></div>
          {a.warnings?.length ? <p className="mt-1 text-amber-700 dark:text-amber-400" data-testid="intel-pursued-warning">{a.warnings.join(' ')}</p> : null}
          <p className="mt-1 text-[var(--muted-foreground)]">Proposed: {a.proposedAction === 'email' ? 'an email' : a.proposedAction === 'call' ? 'a call' : 'research first'}.{a.caveat ? ` ${a.caveat}` : ''} Source: {a.sourceLine}.</p>
        </div>
      ) : p.status === 'failed' ? <p className="text-xs text-amber-700 dark:text-amber-400">{p.error ?? 'The task failed.'} Decide it again to retry.</p> : <p className="text-xs text-[var(--muted-foreground)]">It comes back here and in the next briefing.</p>}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {p.accountName ? <Link href={accountHref(p.accountName)} className={PRIMARY}>Open {p.accountName}: draft, call or research</Link> : <Link href="/gap/signals" className={PRIMARY}>Name the account on Signals</Link>}
        <button type="button" className={BTN} disabled={busy} onClick={() => void done()} data-testid="intel-pursued-done">Done with it</button>
        <ActionStatus result={result} testId="intel-pursued-status" busy={busy} onRetry={() => void done()} />
      </div>
    </li>
  );
}

export function IntelPanel({ intel, angles }: { intel: Intelligence; angles: Record<string, PreparedAngle> }) {
  const worth = [...intel.signals, ...intel.triggers];
  return (
    <div className="space-y-4" data-testid="intel-panel">
      {intel.pursued.length ? (
        <section className="space-y-2" data-testid="intel-pursued-section" aria-label="Pursued">
          <h2 className="text-sm font-semibold">Pursued <span className="text-xs font-normal text-[var(--muted-foreground)]">({intel.pursued.length})</span></h2>
          <p className="text-xs text-[var(--muted-foreground)]">What GAP prepared on your decisions. Nothing is sent until you draft and approve it on the account.</p>
          <ul className="space-y-2">{intel.pursued.map((p) => <Pursued key={p.key} p={p} />)}</ul>
        </section>
      ) : null}
      {intel.reports?.length ? (
        <Section title="From your briefs" hint="What your briefs and reports collected, newest report first, with the passage, the producer's confidence and its sources. Casey judges usefulness; nothing here is verified by GAP or an obligation." items={intel.reports} angles={angles} testId="intel-reports" total={intel.totals.reports ?? intel.reports.length} selection="the producers' imported records, newest report first; the complete list with filters is on the Intelligence page" moreHref="/gap/intelligence" />
      ) : null}
      <Section title="Intelligence worth a look" hint="What GAP found, any age, for your call. Pursue and GAP develops the angle and checks the source; nothing is sent until you approve it." items={worth} angles={angles} testId="intel-worth" total={intel.totals.signals + intel.totals.triggers} selection={intel.selection?.signals} moreHref={intel.selection?.moreSignals ? `/gap?moreSignals=${intel.selection.skipSignals + intel.signals.length}${intel.selection.skipPeople ? `&morePeople=${intel.selection.skipPeople}` : ''}` : null} />
      {intel.knowledge?.length ? (
        <Section title="From the vault" hint="Your recent calls and meetings on the vault, newest first: the Fireflies summary (advisory; the verbatim is on the note) and the action items. No decisions here; the account page holds the moves." items={intel.knowledge} angles={angles} testId="intel-knowledge" total={intel.totals.knowledge ?? intel.knowledge.length} selection="the vault's held calls and meetings of the last 45 days" moreHref={null} />
      ) : null}
      <Section title="Prospects to reengage" hint="People who wrote to us and went quiet. Pursue and GAP prepares the reopening; an open deal at the account is said, and the deal keeps its hold." items={intel.people} angles={angles} testId="intel-people" total={intel.totals.people} selection={intel.selection?.people} moreHref={intel.selection?.morePeople ? `/gap?morePeople=${intel.selection.skipPeople + intel.people.length}${intel.selection.skipSignals ? `&moreSignals=${intel.selection.skipSignals}` : ''}` : null} />
      {intel.notProspects?.length ? (
        <details className="space-y-2" data-testid="intel-not-prospects">
          <summary className="cursor-pointer text-sm font-semibold">Not a prospect <span className="text-xs font-normal text-[var(--muted-foreground)]">({intel.notProspects.length})</span></summary>
          <p className="text-xs text-[var(--muted-foreground)]">Senders you marked not a prospect. Listing one again reverses only that mark: an opt-out, a suppression or do not contact stays.</p>
          <ul className="space-y-1">{intel.notProspects.map((m) => <NotProspect key={m.key} m={m} />)}</ul>
        </details>
      ) : null}
      <p className="text-xs text-[var(--muted-foreground)]">
        Decided items leave the day. <Link href="/gap/signals" className="underline">Every signal</Link>, including the ones you set aside.
      </p>
    </div>
  );
}
