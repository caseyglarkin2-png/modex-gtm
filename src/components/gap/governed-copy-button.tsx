'use client';

/**
 * COPY EMAIL, governed (execution acceptance, 2026-10-01). Copying a cold card's email is sending it by another
 * route, so the text is never on the client until the server has run the same click-time gates as a draft and a
 * direct send, plus the suppression contract (POST /api/gap/decisions/[id]/copy-email). A refusal says why, in
 * seller words; nothing is copied. Copying is not recorded as drafted or sent.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { refusalSentence } from '@/lib/gap/ui/refusal-copy';
import { ReportThis } from './feedback-button';

export function GovernedCopyButton({ decisionId, stepIndex = 0 }: { decisionId: string; stepIndex?: number }) {
  const [state, setState] = useState<{ kind: 'idle' | 'busy' | 'copied' } | { kind: 'refused'; reason: string; detail: string }>({ kind: 'idle' });

  async function copy() {
    setState({ kind: 'busy' });
    try {
      const res = await fetch(`/api/gap/decisions/${encodeURIComponent(decisionId)}/copy-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepIndex }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; recipient?: string; subject?: string; text?: string; error?: string; detail?: string | null };
      if (!res.ok || data.ok !== true || !data.recipient || !data.text) {
        setState({ kind: 'refused', reason: data.error ?? `http_${res.status}`, detail: String(data.detail ?? '') });
        return;
      }
      const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
      if (!clipboard || typeof clipboard.writeText !== 'function') {
        setState({ kind: 'refused', reason: 'clipboard_unavailable', detail: 'The browser clipboard is not available here.' });
        return;
      }
      await clipboard.writeText(`To: ${data.recipient}\nSubject: ${data.subject ?? ''}\n\n${data.text}`);
      setState({ kind: 'copied' });
      setTimeout(() => setState({ kind: 'idle' }), 2500);
    } catch (e) {
      setState({ kind: 'refused', reason: 'network_error', detail: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="space-y-1" data-testid="governed-copy">
      <Button type="button" size="sm" variant="outline" disabled={state.kind === 'busy'} onClick={() => void copy()}>
        {state.kind === 'busy' ? 'Checking...' : state.kind === 'copied' ? 'Copied (checked)' : 'Copy email'}
      </Button>
      {state.kind === 'refused' ? (
        <div role="alert" data-testid="governed-copy-refused" className="text-xs text-[var(--destructive)]">
          <p>
            {refusalSentence(state.reason) ?? `Not copied: ${state.reason.replace(/_/g, ' ')}.`}
            <ReportThis errorCode={state.reason} surface="governed-copy" />
          </p>
          {state.detail ? (
            <details className="text-[var(--muted-foreground)]">
              <summary className="cursor-pointer">Details</summary>
              <p>{state.detail}</p>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
