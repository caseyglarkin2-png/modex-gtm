'use client';

/**
 * A cold CALL or LINKEDIN action on a GAP card (last mile, 2026-09-27).
 *
 * Not a raw link: the click asks POST /api/gap/decisions/{id}/outbound-check,
 * which re-reads HubSpot opportunity truth with the same resolver email
 * draft / send / enroll use. Only a CLEAR answer carries the tel: / LinkedIn
 * link, and only then is it opened. ACTIVE shows "work the deal"; UNKNOWN and
 * any failure (network, bad answer) fail closed with "check HubSpot first".
 *
 * Logging a call that already happened is not this button: the card's
 * "Record call outcome" stays ungated. Voice: no em dashes.
 */
import { useState, type ReactNode } from 'react';

const UNKNOWN_COPY = "Can't verify whether this account already has an active opportunity. Check HubSpot before contacting them.";

type State = { kind: 'idle' } | { kind: 'checking' } | { kind: 'cleared'; href: string } | { kind: 'refused'; message: string };

export interface ColdOutboundButtonProps {
  decisionId: string;
  channel: 'call' | 'linkedin';
  children: ReactNode;
  className?: string;
  /** Called once HubSpot answered CLEAR and the dial / profile was opened. */
  onCleared?: () => void;
}

export function ColdOutboundButton({ decisionId, channel, children, className, onCleared }: ColdOutboundButtonProps) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function go() {
    setState({ kind: 'checking' });
    let body: { ok?: unknown; href?: unknown; message?: unknown } = {};
    let status = 0;
    try {
      const res = await fetch(`/api/gap/decisions/${encodeURIComponent(decisionId)}/outbound-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      status = res.status;
      body = (await res.json().catch(() => ({}))) as typeof body;
    } catch {
      setState({ kind: 'refused', message: UNKNOWN_COPY });
      return;
    }
    const href = typeof body.href === 'string' ? body.href : '';
    const clear = status === 200 && body.ok === true && (channel === 'call' ? href.startsWith('tel:') : /^https?:\/\//i.test(href));
    if (!clear) {
      setState({ kind: 'refused', message: typeof body.message === 'string' && body.message ? body.message : UNKNOWN_COPY });
      return;
    }
    if (channel === 'call') window.open(href, '_self');
    else window.open(href, '_blank', 'noopener,noreferrer');
    setState({ kind: 'cleared', href });
    onCleared?.();
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" data-testid={`cold-${channel}`} disabled={state.kind === 'checking'} onClick={() => void go()} className={className}>
        {state.kind === 'checking' ? 'Checking HubSpot...' : children}
      </button>
      {state.kind === 'cleared' ? (
        <span data-testid="cold-cleared" className="text-xs text-[var(--muted-foreground)]">
          No open deal in HubSpot.{' '}
          <a href={state.href} {...(channel === 'linkedin' ? { target: '_blank', rel: 'noreferrer noopener' } : {})} className="underline">
            {channel === 'call' ? 'Dial again' : 'Open LinkedIn'}
          </a>
        </span>
      ) : null}
      {state.kind === 'refused' ? (
        <span role="alert" data-testid="cold-refused" className="text-xs text-[var(--destructive)]">
          {state.message}
        </span>
      ) : null}
    </span>
  );
}
