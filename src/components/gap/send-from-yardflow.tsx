'use client';

/**
 * SEND EMAIL on the action pack (first-principles pass, 2026-09-25).
 *
 *   Send email       POST /api/gap/decisions/{id}/send (no confirm): the server
 *                    compiles exactly this copy if it was never checked, re-runs
 *                    every gate and returns the FINAL email. Nothing sent.
 *                    PASS goes straight to the confirmation (no CHECK COPY step).
 *                    REVIEW shows the concern inline: Approve copy + continue
 *                    records the approval and asks for the final email again.
 *                    REJECT says why sending is blocked.
 *   Confirm + send   POST the same route with the content hash and recipient
 *                    Casey is looking at. The server refuses if either changed.
 *   Back             closes the confirmation; nothing sent.
 *
 * A refusal no retry can fix (REJECT, do not contact, superseded card...)
 * removes Send at once and refreshes the pack; no page reload is needed.
 *
 * One confirmation, no typed phrase. The server is idempotent: a double click
 * or a retry answers "Already sent". Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Preview {
  crmLogging: 'on' | 'unavailable';
  fromName: string;
  from: string;
  toName: string | null;
  to: string;
  subject: string;
  body: string;
  contentHash: string;
  stepIndex: number;
}

type State =
  | { kind: 'idle' }
  | { kind: 'confirm'; preview: Preview }
  | { kind: 'review'; approvalId: string | null; detail: string }
  | { kind: 'sent'; at: string; messageId: string; already: boolean; note?: string }
  | { kind: 'refused'; reason: string; detail: string };

const REASONS: Record<string, string> = {
  copy_changed_since_review: 'The email changed after you reviewed it. Nothing was sent.',
  recipient_changed_since_review: 'The recipient changed after you reviewed it. Nothing was sent.',
  send_in_progress_or_unknown: 'This email was already started and its outcome is not recorded. Check Gmail Sent before trying again. GAP will not send it twice.',
  send_refused: 'The send was refused before anything left the mailbox.',
  copy_review_required: 'The copy needs your review first. Nothing was sent.',
  approval_failed: 'The approval did not save. Nothing was sent.',
  copy_rejected: 'The compiler rejected this copy. Nothing was sent.',
  persona_do_not_contact: 'This person is marked do not contact. Nothing was sent.',
  email_invalid: 'The address is not valid. Nothing was sent.',
  active_opportunity: 'Someone is already in conversation here (open deal, meeting or positive reply). Nothing was sent.',
  first_touch_already_sent: 'The first email was already sent. Nothing was sent.',
  touch_not_due: 'The next touch is not due yet. Nothing was sent.',
  sequence_stopped: 'The sequence stopped (for example the buyer replied). Nothing was sent.',
  hypothesis_not_active: 'The hypothesis is not in use. Nothing was sent.',
  decision_superseded: 'A newer routing run changed this card. Nothing was sent.',
};

/**
 * Refusals that no second click can fix: Send disappears the moment one comes
 * back and the pack refreshes (it re-reads the compile verdict and the card).
 * Anything else (the copy or recipient changed, a network drop, a refused
 * Gmail call) keeps Send so Casey can try again.
 */
const TERMINAL: ReadonlySet<string> = new Set([
  'copy_rejected',
  'persona_do_not_contact',
  'email_invalid',
  'active_opportunity',
  'first_touch_already_sent',
  'touch_not_due',
  'sequence_stopped',
  'hypothesis_not_active',
  'decision_superseded',
  'send_in_progress_or_unknown',
]);

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function SendFromYardflow({
  decisionId,
  stepIndex = 0,
  mailbox,
  pendingApproval = null,
}: {
  decisionId: string;
  stepIndex?: number;
  mailbox: string;
  /** A review already open for exactly this copy: shown before the first click. */
  pendingApproval?: { id: string; reason: string } | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<State>(pendingApproval ? { kind: 'review', approvalId: pendingApproval.id, detail: pendingApproval.reason } : { kind: 'idle' });
  const url = `/api/gap/decisions/${encodeURIComponent(decisionId)}/send`;

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- route JSON, read field by field
      const data = (await res.json().catch(() => ({}))) as Record<string, any>;
      if (res.ok && data.preview) setState({ kind: 'confirm', preview: data.preview });
      else if (res.ok && data.sent) {
        setState({
          kind: 'sent',
          at: data.sent.sentAt,
          messageId: data.sent.gmailSentMessageId,
          already: data.alreadySent === true,
          note: data.ledgerError ? `Sent, but the receipt did not save (${data.ledgerError}). GAP will not resend it.` : undefined,
        });
        router.refresh();
      } else if (data.error === 'copy_review_required') {
        const checks = Array.isArray(data.failedChecks) ? data.failedChecks : [];
        setState({ kind: 'review', approvalId: typeof data.approvalRequestId === 'string' ? data.approvalRequestId : null, detail: checks.join(' | ') || String(data.detail ?? '') });
      } else {
        const reason = String(data.error ?? `HTTP ${res.status}`);
        setState({ kind: 'refused', reason, detail: [data.detail, ...(Array.isArray(data.failedChecks) ? data.failedChecks : [])].filter(Boolean).join(' | ') });
        if (TERMINAL.has(reason)) router.refresh();
      }
    } catch (err) {
      setState({ kind: 'refused', reason: 'network_error', detail: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  const step = stepIndex > 0 ? { stepIndex } : {};

  /** Approve THIS copy through the existing approval resolver, then ask for the final email again. */
  async function approveAndContinue(approvalId: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/revops/send-approvals', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: approvalId, action: 'approve' }),
      });
      if (!res.ok) {
        setState({ kind: 'refused', reason: 'approval_failed', detail: `HTTP ${res.status}` });
        setBusy(false);
        return;
      }
    } catch (err) {
      setState({ kind: 'refused', reason: 'network_error', detail: err instanceof Error ? err.message : String(err) });
      setBusy(false);
      return;
    }
    await call(step);
  }

  if (state.kind === 'review') {
    return (
      <div data-testid="send-review" className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
        <p className="font-semibold">The copy check wants your eyes on this email before it goes.</p>
        {state.detail ? <p className="text-xs text-[var(--muted-foreground)]">Concern: {state.detail}</p> : null}
        <div className="flex flex-wrap gap-2">
          {state.approvalId ? (
            <Button type="button" disabled={busy} onClick={() => void approveAndContinue(state.approvalId!)}>
              {busy ? 'Approving...' : 'Approve copy + continue'}
            </Button>
          ) : (
            <p className="text-xs">No approval could be opened for this copy. Edit it in a Gmail draft instead.</p>
          )}
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)]">Approving records your review of the copy above. Nothing is sent until you confirm.</p>
      </div>
    );
  }

  if (state.kind === 'sent') {
    return (
      <div data-testid="send-done" className="space-y-1 rounded-md border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm">
        <p className="font-semibold uppercase tracking-wide">{state.already ? 'Already sent' : 'Sent'}</p>
        <p>{when(state.at)} from {mailbox}</p>
        <p className="text-xs text-[var(--muted-foreground)]">Gmail message {state.messageId}. Recorded as emailed.</p>
        {state.note ? <p className="text-xs text-[var(--destructive)]">{state.note}</p> : null}
      </div>
    );
  }

  if (state.kind === 'confirm') {
    const p = state.preview;
    return (
      <div data-testid="send-confirm" className="space-y-3 rounded-md border-2 border-[var(--primary)] p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide">Final check</p>
        <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1">
          <dt className="text-[var(--muted-foreground)]">From</dt>
          <dd>{p.fromName} &lt;{p.from}&gt;</dd>
          <dt className="text-[var(--muted-foreground)]">To</dt>
          <dd>{p.toName ? `${p.toName} ` : ''}&lt;{p.to}&gt;</dd>
          <dt className="text-[var(--muted-foreground)]">Subject</dt>
          <dd>{p.subject}</dd>
          <dt className="text-[var(--muted-foreground)]">CRM</dt>
          <dd>HubSpot: {p.crmLogging === 'on' ? 'ON' : 'UNAVAILABLE'}</dd>
        </dl>
        <pre data-testid="send-body" className="whitespace-pre-wrap rounded-md bg-[var(--muted)]/50 p-3 font-sans text-sm">{p.body}</pre>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void call({ ...step, confirm: { contentHash: p.contentHash, recipient: p.to } })}>
            {busy ? 'Sending...' : 'Confirm + send'}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => setState({ kind: 'idle' })}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  const terminal = state.kind === 'refused' && TERMINAL.has(state.reason);
  return (
    <div className="space-y-2">
      {terminal ? null : (
        <Button type="button" disabled={busy} onClick={() => void call(step)}>
          {busy ? 'Checking...' : stepIndex > 0 ? `Send follow-up (touch ${stepIndex + 1})` : 'Send email'}
        </Button>
      )}
      {state.kind === 'refused' ? (
        <div role="alert" data-testid="send-refused" className="space-y-1 text-xs text-[var(--destructive)]">
          <p>{REASONS[state.reason] ?? `Not sent: ${state.reason.replace(/_/g, ' ')}.`}</p>
          {state.detail ? <p className="text-[var(--muted-foreground)]">{state.detail}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
