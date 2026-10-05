'use client';

/**
 * OUTSTANDING GAP DRAFT (owner resolution, 2026-10-05): a GAP-created first-touch draft still sitting in Gmail holds
 * the account's one cold motion. The seller sees who it is to, can open Gmail, or discard exactly that draft after an
 * inline confirmation (POST /api/gap/decisions/[id]/gmail-draft/discard: the server proves GAP created it; a draft
 * Gmail no longer has is reconciled, never read as discarded). Never an unsubscribe. Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DISCARD_REASON_LABEL, DISCARD_REASONS, type DiscardReason } from '@/lib/gap/execution/draft-discard';
import { refusalSentence } from '@/lib/gap/ui/refusal-copy';

export interface OutstandingDraftProps {
  recipient: string;
  name: string | null;
  decisionId: string;
  gmailDraftId: string;
  createdAt: string;
  /** The GAP mailbox the draft lives in (opens Gmail's Drafts for that account). */
  mailbox: string | null;
}

export function OutstandingDraftPanel({ recipient, name, decisionId, gmailDraftId, createdAt, mailbox }: OutstandingDraftProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState<DiscardReason>('stale_pre_operator_who_draft');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null);
  const gmailHref = mailbox ? `https://mail.google.com/mail/?authuser=${encodeURIComponent(mailbox)}#drafts` : 'https://mail.google.com/mail/#drafts';
  const when = (() => {
    const d = new Date(createdAt);
    return Number.isNaN(d.getTime()) ? createdAt : d.toLocaleString();
  })();

  async function discard() {
    setBusy(true);
    setOutcome(null);
    try {
      const res = await fetch(`/api/gap/decisions/${encodeURIComponent(decisionId)}/gmail-draft/discard`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ gmailDraftId, recipient, reason }) });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const code = typeof body.error === 'string' ? body.error : `HTTP ${res.status}`;
        setOutcome({ ok: false, text: refusalSentence(code) ?? `Not discarded: ${code.replace(/_/g, ' ')}.${typeof body.detail === 'string' ? ` ${body.detail}` : ''} Nothing in Gmail was touched.` });
        return;
      }
      const action = String(body.action);
      setOutcome({ ok: true, text: action === 'discarded' ? `Discarded the GAP draft to ${recipient}. The account motion is released.` : action === 'reconciled' ? String(body.detail ?? 'Reconciled with Gmail.') : String(body.detail ?? 'Nothing to discard.') });
      setConfirming(false);
      router.refresh();
    } catch (e) {
      setOutcome({ ok: false, text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-2 rounded-md border border-amber-600/60 bg-amber-500/10 px-3 py-2" data-testid="outstanding-draft">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Outstanding GAP draft</p>
      <p className="text-sm">
        {name ? <span className="font-medium">{name}</span> : null}
        {name ? ' ' : null}
        <span className="text-[var(--muted-foreground)]">{recipient}</span>
      </p>
      <p className="text-xs text-[var(--muted-foreground)]">Drafted {when}. It holds the cold motion at this account until it is sent or discarded.</p>
      <div className="flex flex-wrap items-center gap-2">
        <a href={gmailHref} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center text-sm underline" data-testid="outstanding-draft-open">
          Open in Gmail
        </a>
        {!confirming ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setConfirming(true)} data-testid="outstanding-draft-discard">
            Discard draft
          </Button>
        ) : null}
      </div>
      {confirming ? (
        <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-xs" data-testid="outstanding-draft-confirm">
          <p className="font-medium">Discard the GAP draft to {recipient}? Only that one draft is deleted. If Gmail already sent it, GAP records the send instead.</p>
          <label className="block">
            <span className="text-[var(--muted-foreground)]">Reason</span>
            <select value={reason} onChange={(e) => setReason(e.target.value as DiscardReason)} className="mt-1 block w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-xs" data-testid="outstanding-draft-reason">
              {DISCARD_REASONS.map((r) => (
                <option key={r} value={r}>
                  {DISCARD_REASON_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => void discard()} data-testid="outstanding-draft-confirm-button">
              {busy ? 'Discarding...' : 'Confirm discard'}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {outcome ? (
        <p role={outcome.ok ? 'status' : 'alert'} className={`text-xs ${outcome.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--destructive)]'}`} data-testid="outstanding-draft-outcome">
          {outcome.text}
        </p>
      ) : null}
    </section>
  );
}
