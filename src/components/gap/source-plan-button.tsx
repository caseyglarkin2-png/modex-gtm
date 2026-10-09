'use client';

/** PLAN NOW: qualify this source's accounts now (bounded). Research itself runs in the background, account by account. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshNow } from '@/components/gap/refresh-now';
import { ActionStatus } from '@/components/gap/action-status';
import { postAction, type ActionResult } from '@/lib/gap/ui/action-result';

export function SourcePlanButton({ workSourceId }: { workSourceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  async function plan() {
    setBusy(true);
    setResult(null);
    // C44: never a throw that leaves "Qualifying..." on; a plan that lands is queued work, said so, with nothing sent.
    const r = await postAction(`/api/gap/sources/${encodeURIComponent(workSourceId)}`, { op: 'plan' }, {
      verb: 'Planned',
      source: workSourceId,
      accepted: (body) => `Qualified ${typeof body.accounts === 'number' ? body.accounts : 0} accounts${typeof body.deferredAccounts === 'number' && body.deferredAccounts ? `, ${body.deferredAccounts} more next run` : ''}. Research runs in the background; nothing is sent.`,
    });
    setBusy(false);
    setResult(r);
    if (r.state === 'accepted' || r.state === 'queued') refreshNow(router);
  }
  return (
    <div className="space-y-1">
      <button type="button" data-testid="source-plan" disabled={busy} onClick={() => void plan()} className="min-h-[44px] rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)] disabled:opacity-60">
        {busy ? 'Qualifying...' : 'Qualify accounts now'}
      </button>
      <ActionStatus result={result} testId="source-plan-result" className="block text-xs" busy={busy} onRetry={() => void plan()} />
    </div>
  );
}
