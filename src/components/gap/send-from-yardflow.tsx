'use client';

/**
 * SEND EMAIL on the action pack (first-principles pass, 2026-09-25).
 *
 *   Send email       POST /api/gap/decisions/{id}/send (no confirm): the server
 *                    re-runs every gate and returns the FINAL email. Nothing sent.
 *   Confirm + send   POST the same route with the content hash and recipient
 *                    Casey is looking at. The server refuses if either changed.
 *   Back             closes the confirmation; nothing sent.
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
  | { kind: 'sent'; at: string; messageId: string; already: boolean; note?: string }
  | { kind: 'refused'; reason: string; detail: string };

const REASONS: Record<string, string> = {
  copy_changed_since_review: 'The email changed after you reviewed it. Nothing was sent.',
  recipient_changed_since_review: 'The recipient changed after you reviewed it. Nothing was sent.',
  send_in_progress_or_unknown: 'This email was already started and its outcome is not recorded. Check Gmail Sent before trying again. GAP will not send it twice.',
  send_refused: 'The send was refused before anything left the mailbox.',
  copy_review_required: 'The copy needs your review first (see below). Nothing was sent.',
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

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function SendFromYardflow({ decisionId, stepIndex = 0, mailbox }: { decisionId: string; stepIndex?: number; mailbox: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<State>({ kind: 'idle' });
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
      } else {
        const reason = String(data.error ?? `HTTP ${res.status}`);
        setState({ kind: 'refused', reason, detail: [data.detail, ...(Array.isArray(data.failedChecks) ? data.failedChecks : [])].filter(Boolean).join(' | ') });
      }
    } catch (err) {
      setState({ kind: 'refused', reason: 'network_error', detail: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  const step = stepIndex > 0 ? { stepIndex } : {};

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

  return (
    <div className="space-y-2">
      <Button type="button" disabled={busy} onClick={() => void call(step)}>
        {busy ? 'Checking...' : stepIndex > 0 ? `Send follow-up (touch ${stepIndex + 1})` : 'Send email'}
      </Button>
      {state.kind === 'refused' ? (
        <div role="alert" data-testid="send-refused" className="space-y-1 text-xs text-[var(--destructive)]">
          <p>{REASONS[state.reason] ?? `Not sent: ${state.reason.replace(/_/g, ' ')}.`}</p>
          {state.detail ? <p className="text-[var(--muted-foreground)]">{state.detail}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
