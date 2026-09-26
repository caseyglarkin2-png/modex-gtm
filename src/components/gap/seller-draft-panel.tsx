'use client';

/**
 * Seller Action Center: the draft panel on the action pack (final pass
 * 2026-09-25; CHECK COPY removed 2026-09-26). Explicit clicks, none of which sends:
 *
 *   Create Gmail draft  POST gmail-draft: the server compiles this exact copy
 *                       when it was never checked; PASS creates one DRAFT in
 *                       Casey's Drafts folder, REVIEW shows Approve this copy
 *                       right here, REJECT says why.
 *   Check if sent       POST gmail-draft/reconcile: read Gmail, record sent /
 *                       discarded / still a draft
 *
 * Sending happens in Gmail, by Casey. This panel never records "I emailed".
 * Voice: no em dashes.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export interface DraftRow {
  gmailDraftId: string;
  recipient: string;
  subject: string;
  createdAt: string;
  fate: 'drafted' | 'sent' | 'discarded';
  sentAt: string | null;
  gmailSentMessageId: string | null;
}

export interface SellerDraftPanelProps {
  decisionId: string;
  emailReady: boolean;
  senderIdentity: string;
  drafts: DraftRow[];
  /** Why the draft button is unavailable even when copy is ready (blocked card, no email...). Null when eligible. */
  ineligibleReason: string | null;
  /** The pending SendApprovalRequest for exactly this copy, if the compiler asked for review. */
  pendingApproval?: { id: string; reason: string } | null;
  /** Which touch this panel drafts (0 = first email). */
  stepIndex?: number;
}

type Outcome =
  | { kind: 'drafted'; recipient: string; subject: string; at: string; already: boolean; ledgerError?: string }
  | { kind: 'review'; detail: string; approvalId: string | null }
  | { kind: 'refused'; reason: string; detail: string };

const REASON_COPY: Record<string, string> = {
  copy_review_required: 'The copy needs your approval first. Approve it right here.',
  copy_rejected: 'The compiler rejected this copy. Nothing was drafted.',
  gmail_refused: 'Gmail or the suppression gate refused the draft. Nothing was drafted.',
  decision_blocked: 'This card is a system block. Nothing can be drafted.',
  persona_do_not_contact: 'This person is marked do not contact. Nothing was drafted.',
  hypothesis_not_active: 'The hypothesis is no longer active. Nothing was drafted.',
  unsubscribe_link_unavailable: 'The unsubscribe link could not be built, so no draft was created.',
};

function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function SellerDraftPanel({ decisionId, emailReady, senderIdentity, drafts, ineligibleReason, pendingApproval = null, stepIndex = 0 }: SellerDraftPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reconcileNote, setReconcileNote] = useState<string | null>(null);
  const draftsHref = `https://mail.google.com/mail/?authuser=${encodeURIComponent(senderIdentity)}#drafts`;
  const base = `/api/gap/decisions/${encodeURIComponent(decisionId)}/gmail-draft`;

  async function post() {
    setBusy('draft');
    setOutcome(null);
    try {
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(stepIndex > 0 ? { stepIndex } : {}),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped route JSON, read field by field
      const data = (await res.json().catch(() => ({}))) as Record<string, any>;
      if (res.ok && data.receipt) {
        setOutcome({
          kind: 'drafted',
          recipient: data.receipt.recipient,
          subject: data.receipt.subject,
          at: data.receipt.createdAt,
          already: data.alreadyDrafted === true,
          ledgerError: data.ledgerError,
        });
        router.refresh();
      } else if (data.error === 'copy_review_required') {
        setOutcome({ kind: 'review', detail: String(data.detail ?? ''), approvalId: typeof data.approvalRequestId === 'string' ? data.approvalRequestId : null });
      } else {
        const reason = String(data.error ?? `HTTP ${res.status}`);
        const detail = [data.detail, ...(Array.isArray(data.failedChecks) ? data.failedChecks : [])].filter(Boolean).join(' | ');
        setOutcome({ kind: 'refused', reason, detail });
        // A rejected copy can never be drafted or sent: the pack re-reads the verdict and drops Send beside this panel too.
        if (reason === 'copy_rejected') router.refresh();
      }
    } catch (err) {
      setOutcome({ kind: 'refused', reason: 'network_error', detail: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(null);
    }
  }

  const [approveError, setApproveError] = useState<string | null>(null);
  /** Approve THIS copy through the existing approval resolver, then reload the pack (it re-reads clearance). */
  async function approve(approvalId: string) {
    setBusy('approve');
    setApproveError(null);
    try {
      const res = await fetch('/api/revops/send-approvals', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: approvalId, action: 'approve' }),
      });
      if (!res.ok) setApproveError(`Approval failed (HTTP ${res.status}).`);
      else {
        setOutcome(null);
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  const review = outcome?.kind === 'review' ? { id: outcome.approvalId, reason: outcome.detail } : pendingApproval;

  async function reconcile(gmailDraftId: string) {
    setBusy(`r:${gmailDraftId}`);
    setReconcileNote(null);
    try {
      const res = await fetch(`${base}/reconcile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gmailDraftId }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped route JSON, read field by field
      const data = (await res.json().catch(() => ({}))) as Record<string, any>;
      if (!res.ok) setReconcileNote(`Could not read Gmail (${data.error ?? res.status}). Nothing was recorded.`);
      else if (data.fate === 'sent') setReconcileNote(`Sent ${data.sent?.sentAt ? when(data.sent.sentAt) : ''}. Recorded.`);
      else if (data.fate === 'discarded') setReconcileNote('The draft is gone and nothing was sent. Recorded as discarded.');
      else setReconcileNote('Still a draft in Gmail.');
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section data-testid="seller-draft-panel" className="space-y-3 rounded-md border border-[var(--border)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Save as Gmail draft</p>
        <p className="text-[11px] text-[var(--muted-foreground)]">From {senderIdentity}. Creates a draft only. You send it from Gmail.</p>
      </div>

      {ineligibleReason ? (
        <p data-testid="draft-ineligible" className="text-xs text-[var(--muted-foreground)]">{ineligibleReason}</p>
      ) : outcome?.kind === 'refused' && outcome.reason === 'copy_rejected' ? null : (
        <Button type="button" size="sm" disabled={busy !== null} onClick={() => post()}>
          {busy === 'draft' ? 'Creating draft...' : stepIndex > 0 ? `Create Gmail draft (touch ${stepIndex + 1})` : 'Create Gmail draft'}
        </Button>
      )}

      {outcome?.kind === 'drafted' ? (
        <div data-testid="draft-created" className="space-y-1 rounded-md bg-emerald-500/10 p-3 text-xs">
          <p className="font-semibold uppercase tracking-wide">{outcome.already ? 'Draft already created' : 'Draft created'}</p>
          <p>recipient: {outcome.recipient}</p>
          <p>subject: {outcome.subject}</p>
          <p>timestamp: {when(outcome.at)}</p>
          {outcome.ledgerError ? <p className="text-[var(--destructive)]">The draft exists but its receipt did not save: {outcome.ledgerError}</p> : null}
          <a href={draftsHref} target="_blank" rel="noreferrer noopener" className="inline-block underline">
            Open Gmail drafts
          </a>
        </div>
      ) : null}
      {!emailReady && !ineligibleReason && review ? (
        <div data-testid="draft-review" className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          <p className="font-semibold">This exact email needs your review before it can be drafted.</p>
          {review.reason ? <p className="text-[var(--muted-foreground)]">Why: {review.reason}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            {review.id ? (
              <Button type="button" size="sm" disabled={busy !== null} onClick={() => approve(review.id!)}>
                {busy === 'approve' ? 'Approving...' : 'Approve this copy'}
              </Button>
            ) : null}
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)]">Approving records your review of the copy above. It does not draft or send anything; this page reloads with Send email and Save draft.</p>
          {approveError ? <p role="alert" className="text-[var(--destructive)]">{approveError}</p> : null}
        </div>
      ) : null}
      {outcome?.kind === 'refused' ? (
        <div role="alert" data-testid="draft-refused" className="space-y-1 text-xs text-[var(--destructive)]">
          <p>{REASON_COPY[outcome.reason] ?? `Refused: ${outcome.reason.replace(/_/g, ' ')}.`}</p>
          {outcome.detail ? <p className="text-[var(--muted-foreground)]">{outcome.detail}</p> : null}
        </div>
      ) : null}

      {drafts.length > 0 ? (
        <div className="space-y-2 border-t border-[var(--border)] pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Drafts for this card</p>
          {drafts.map((d) => (
            <div key={d.gmailDraftId} data-testid="draft-row" className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">{d.fate === 'sent' ? 'Sent' : d.fate === 'discarded' ? 'Discarded' : 'Drafted'}</span>
              <span className="text-[var(--muted-foreground)]">
                {d.subject} to {d.recipient}, {d.fate === 'sent' && d.sentAt ? `sent ${when(d.sentAt)}` : `drafted ${when(d.createdAt)}`}
              </span>
              {d.fate === 'drafted' ? (
                <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => reconcile(d.gmailDraftId)}>
                  {busy === `r:${d.gmailDraftId}` ? 'Checking...' : 'Check if sent'}
                </Button>
              ) : null}
            </div>
          ))}
          {reconcileNote ? <p className="text-xs text-[var(--muted-foreground)]">{reconcileNote}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
