'use client';
/**
 * THE INTELLIGENCE PANEL (I04, GAP OS prospecting first, 2026-10-08): the day's intelligence on Work, for Casey to
 * decide on. Three lists from work/intel.ts (signals and triggers worth a look; people who wrote in and went quiet),
 * each item with its source and dates said as what they are, the account when known, the prepared angle when the
 * agent has one, and the decisions: Pursue, Explore, Save, Skip, Dismiss, More (POST /api/gap/decide). Nothing here
 * contacts anyone. Voice: no em dashes, "yards" plural.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Intelligence, IntelItem, Decision } from '@/lib/gap/work/intel';
import type { PreparedAngle } from '@/lib/gap/agents/develop-angle';
import { TRUTH_TEXT } from '@/lib/gap/work/intel';
import { AccountLink } from './account-link';
import { refreshNow } from './refresh-now';

const BTN = 'min-h-11 rounded-md border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--muted)] disabled:opacity-50 sm:min-h-9';
const PRIMARY = 'min-h-11 rounded-md bg-[var(--primary)] px-3 py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 sm:min-h-9';
const DECISION_TEXT: Record<Decision, string> = { pursue: 'Pursue', explore: 'Explore', save: 'Save', skip: 'Skip', dismiss: 'Dismiss', more: 'More' };

function Item({ item, angle }: { item: IntelItem; angle: PreparedAngle | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  async function decide(decision: Decision) {
    if (decision === 'explore') {
      setLine(null);
      if (item.url) window.open(item.url, '_blank', 'noopener');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/gap/decide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: item.key, decision }) });
      const b = (await res.json().catch(() => ({}))) as { line?: string; error?: string };
      setLine(res.ok ? (b.line ?? 'Decided.') : `Not decided: ${(b.error ?? String(res.status)).replace(/_/g, ' ')}.`);
      if (res.ok) refreshNow(router);
    } catch {
      setLine('Not decided: no connection.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <li data-testid="intel-item" data-kind={item.kind} data-key={item.key} className="space-y-1 rounded-md border border-[var(--border)] p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted-foreground)]">
        <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-semibold" data-testid="intel-truth">{TRUTH_TEXT[item.truth]}</span>
        {item.accountName ? <AccountLink name={item.accountName} /> : <span data-testid="intel-no-account">{item.accountHint ? `${item.accountHint} (no account yet)` : 'No account yet'}</span>}
      </div>
      <p className="font-medium">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">{item.title}</a> : item.title}</p>
      <p className="text-xs text-[var(--muted-foreground)]" data-testid="intel-line">{item.line}</p>
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
        {line ? <span role="status" className="text-xs text-[var(--muted-foreground)]" data-testid="intel-decided">{line}</span> : null}
      </div>
    </li>
  );
}

function Section({ title, hint, items, angles, testId, total }: { title: string; hint: string; items: IntelItem[]; angles: Record<string, PreparedAngle>; testId: string; total: number }) {
  return (
    <section className="space-y-2" data-testid={testId} aria-label={title}>
      <h2 className="text-sm font-semibold">
        {title} <span className="text-xs font-normal text-[var(--muted-foreground)]">({items.length}{total > items.length ? ` of ${total}` : ''})</span>
      </h2>
      <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
      {items.length ? <ul className="space-y-2">{items.map((it) => <Item key={it.key} item={it} angle={angles[it.key] ?? null} />)}</ul> : <p className="text-xs italic text-[var(--muted-foreground)]">Nothing waiting for a decision.</p>}
    </section>
  );
}

export function IntelPanel({ intel, angles }: { intel: Intelligence; angles: Record<string, PreparedAngle> }) {
  const worth = [...intel.signals, ...intel.triggers];
  return (
    <div className="space-y-4" data-testid="intel-panel">
      <Section title="Intelligence worth a look" hint="What GAP found, any age, for your call. Pursue and GAP develops the angle and checks the source; nothing is sent until you approve it." items={worth} angles={angles} testId="intel-worth" total={intel.totals.signals + intel.totals.triggers} />
      <Section title="Prospects to reengage" hint="People who wrote to us and went quiet, with no open deal. Pursue and GAP prepares the reopening." items={intel.people} angles={angles} testId="intel-people" total={intel.totals.people} />
      <p className="text-xs text-[var(--muted-foreground)]">
        Decided items leave the day. <Link href="/gap/signals" className="underline">Every signal</Link>, including the ones you set aside.
      </p>
    </div>
  );
}
