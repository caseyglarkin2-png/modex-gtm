'use client';

/**
 * HUBSPOT CHANGES FOR ONE DEAL (GAP OS execution recovery, R54): each change GAP would make (a deal note, a task, the
 * deal's next step) shown EXACTLY as HubSpot would hold it, with what in GAP it came from, and ONE explicit approval
 * click per change. After the click the state is said plainly: written, approved but not written (HubSpot writes are
 * off here), failed (the text is kept; retry is safe), a newer value in HubSpot (never overwritten), or discarded.
 * Posts to `POST /api/gap/crm-sync`, then the page reloads.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { changeText, CRM_REFUSAL_TEXT, crmStateLine, externalIdFor, proposalIdFor, sameChange, type CrmChange, type CrmOrigin, type CrmSyncItem } from '@/lib/gap/deals/crm-model';

/** Batch item 9: what the click answered, in seller words (a refusal names why; nothing is ever implied written). */
function answerLine(r: { ok: boolean; item: CrmSyncItem | null; error: string | null; detail?: string | null }): string {
  if (!r.ok) return `Not done: ${r.detail ?? CRM_REFUSAL_TEXT[r.error ?? ''] ?? r.error}.`;
  return r.item ? crmStateLine(r.item) : 'Recorded.';
}
const KIND_WORDS: Record<CrmChange['kind'], string> = { note: 'a deal note', task: 'a deal task', task_complete: 'completing a deal task', deal_property: 'the deal next step' };

const SMALL = 'inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--border)] px-2.5 text-xs hover:bg-[var(--muted)] disabled:opacity-60 sm:min-h-9';

async function post(body: unknown): Promise<{ ok: boolean; item: CrmSyncItem | null; error: string | null; detail?: string | null }> {
  try {
    const res = await fetch('/api/gap/crm-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = (await res.json().catch(() => ({}))) as { item?: CrmSyncItem | null; error?: string; detail?: string | null };
    return { ok: res.ok, item: j.item ?? null, error: res.ok ? null : j.error ?? `HTTP ${res.status}`, detail: j.detail ?? null };
  } catch {
    return { ok: false, item: null, error: 'no connection' };
  }
}

function Candidate({ accountName, dealId, dealName, change, origin, revision = false }: { accountName: string; dealId: string; dealName: string | null; change: CrmChange; origin: CrmOrigin; /** Batch item 9: the obligation changed since its task was proposed. */ revision?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const proposalId = proposalIdFor(origin, change);
  const text = changeText({ change, dealName, dealId, externalId: externalIdFor(proposalId) });
  async function approve() {
    setBusy(true);
    const r = await post({ op: 'approve', accountName, dealId, dealName, change, origin });
    setBusy(false);
    setStatus(answerLine(r));
    if (r.ok) router.refresh();
  }
  return (
    <li className="space-y-1" data-testid="crm-proposal" data-kind={change.kind} data-proposal-id={proposalId}>
      <pre className="whitespace-pre-wrap break-words rounded-md border border-[var(--border)] p-2 text-xs" data-testid="crm-proposal-text">{text}</pre>
      <p className="text-xs text-[var(--muted-foreground)]">{revision ? 'The obligation changed: this updates its one task. ' : ''}From: {origin.label}. Nothing is written until you approve it.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={SMALL} disabled={busy} onClick={() => void approve()} data-testid="crm-approve">Approve this HubSpot change</button>
        {status ? <span role="status" className="text-xs" data-testid="crm-status">{status}</span> : null}
      </div>
    </li>
  );
}

function Item({ it }: { it: CrmSyncItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  async function act(op: 'retry' | 'discard') {
    setBusy(true);
    const r = await post({ op, proposalId: it.proposalId, ...(op === 'discard' ? { reason: 'not needed' } : {}) });
    setBusy(false);
    setStatus(answerLine(r));
    if (r.ok) router.refresh();
  }
  return (
    <li className="space-y-1" data-testid="crm-sync-item" data-state={it.state} data-proposal-id={it.proposalId}>
      <p className="text-xs font-medium" data-testid="crm-sync-state">{crmStateLine(it)}</p>
      <details>
        <summary className="min-h-9 cursor-pointer text-xs text-[var(--muted-foreground)]">The exact change ({KIND_WORDS[it.change.kind]}, from {it.origin.label})</summary>
        <pre className="whitespace-pre-wrap break-words rounded-md border border-[var(--border)] p-2 text-xs">{changeText(it)}</pre>
      </details>
      <div className="flex flex-wrap items-center gap-2">
        {it.state === 'failed' || it.state === 'off' || it.state === 'approved' ? <button type="button" className={SMALL} disabled={busy} onClick={() => void act('retry')} data-testid="crm-retry">Retry</button> : null}
        {it.state !== 'written' && it.state !== 'discarded' ? <button type="button" className={SMALL} disabled={busy} onClick={() => void act('discard')} data-testid="crm-discard">Discard</button> : null}
        {status ? <span role="status" className="text-xs" data-testid="crm-item-status">{status}</span> : null}
      </div>
    </li>
  );
}

export function CrmSyncPanel({ accountName, dealId, dealName, candidates, items }: { accountName: string; dealId: string; dealName: string | null; candidates: ReadonlyArray<{ change: CrmChange; origin: CrmOrigin }>; items: readonly CrmSyncItem[] }) {
  // Batch item 9: a candidate is new, or an amended obligation's newer text for its one task (offered as an update).
  const byId = new Map(items.map((i) => [i.proposalId, i]));
  const fresh = candidates.filter((c) => {
    const have = byId.get(proposalIdFor(c.origin, c.change));
    return !have || (have.state !== 'discarded' && !sameChange(have.change, c.change));
  });
  if (!fresh.length && !items.length) return null;
  return (
    <div className="space-y-2" data-testid="crm-sync" data-deal-id={dealId}>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">HubSpot changes (each needs your approval)</h4>
      {items.length ? <ul className="space-y-2">{items.map((it) => <Item key={it.proposalId} it={it} />)}</ul> : null}
      {fresh.length ? <ul className="space-y-2">{fresh.map((c) => <Candidate key={proposalIdFor(c.origin, c.change)} accountName={accountName} dealId={dealId} dealName={dealName} change={c.change} origin={c.origin} revision={byId.has(proposalIdFor(c.origin, c.change))} />)}</ul> : null}
    </div>
  );
}
