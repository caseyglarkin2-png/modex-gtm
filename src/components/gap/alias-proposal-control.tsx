'use client';

/**
 * POSSIBLE ACCOUNT ALIAS, the seller's word (enterprise graph, 2026-10-05). GAP found a company spelling on the
 * account's people that is not the account by the employer rule (a banner, a subsidiary, a provider spelling) and
 * proposes it as an alias. Casey confirms (the alias is registered and audited) or says it is not the same family
 * (recorded, never proposed again). Nothing is created until the click. Voice: no em dashes.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AliasProposal } from '@/lib/gap/people/alias-review';

export function AliasProposalControl({ proposal, onDecided }: { proposal: AliasProposal; onDecided?: () => void }) {
  const [busy, setBusy] = useState<null | 'confirm' | 'reject'>(null);
  const [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = useState(false);

  async function decide(decision: 'confirm' | 'reject') {
    setBusy(decision);
    setOutcome(null);
    try {
      const res = await fetch('/api/gap/accounts/alias-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(decision === 'confirm' ? { accountName: proposal.canonical, alias: proposal.company, decision, evidence: proposal.evidence } : { accountName: proposal.canonical, alias: proposal.company, decision }),
      });
      const b = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const why = String(b.error ?? res.status).replace(/_/g, ' ');
        setOutcome({ ok: false, text: `Not recorded: ${why}${typeof b.detail === 'string' && b.detail ? ` (${b.detail})` : ''}.` });
        return;
      }
      setOutcome({
        ok: true,
        text:
          decision === 'confirm'
            ? b.status === 'ALREADY_MATCHED'
              ? `${proposal.company} was already an alias of ${proposal.canonical}. Nothing new was written.`
              : `Confirmed: ${proposal.company} is now an alias of ${proposal.canonical}. People at that spelling read as current here from the next read. HubSpot was not changed.`
            : `Recorded: ${proposal.company} is not the same family as ${proposal.canonical}. It will not be proposed again.`,
      });
      setDone(true);
      onDecided?.();
    } catch (e) {
      setOutcome({ ok: false, text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-1 rounded-md border border-[var(--border)] p-2 text-xs" data-testid="alias-proposal" data-alias-key={proposal.key}>
      <p>
        <span className="font-medium">Possible account alias.</span> Company: {proposal.company}. Canonical: {proposal.canonical}.
      </p>
      <p className="text-[var(--muted-foreground)]">Evidence: {proposal.evidence.join('; ')}</p>
      {!done ? (
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={busy !== null} onClick={() => void decide('confirm')} data-testid="alias-confirm">
            {busy === 'confirm' ? 'Confirming...' : 'Confirm alias'}
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={busy !== null} onClick={() => void decide('reject')} data-testid="alias-reject">
            {busy === 'reject' ? 'Recording...' : 'Not the same family'}
          </Button>
        </div>
      ) : null}
      {outcome ? (
        <p role={outcome.ok ? 'status' : 'alert'} className={outcome.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--destructive)]'} data-testid="alias-outcome">
          {outcome.text}
        </p>
      ) : null}
    </div>
  );
}
