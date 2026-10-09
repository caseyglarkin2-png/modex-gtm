'use client';

/**
 * Set the next learning objective for an account in a deal (Phase 2 F3).
 * Posts to /api/gap/deals/objective; the newest objective wins, every earlier
 * one stays in the audit ledger. Nothing is written to HubSpot.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshNow } from '@/components/gap/refresh-now';
import { ActionStatus } from '@/components/gap/action-status';
import { postAction, type ActionResult } from '@/lib/gap/ui/action-result';

export function DealObjectiveForm({ accountName, initial }: { accountName: string; initial: string }) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const save = async () => {
    setSaving(true);
    setResult(null);
    // C44: one state per save; an incomplete request says it may have applied instead of "network error".
    const r = await postAction('/api/gap/deals/objective', { accountName, text }, { verb: 'Saved', source: accountName, accepted: () => 'Saved.' });
    setSaving(false);
    setResult(r);
    if (r.state === 'accepted') refreshNow(router);
  };
  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
      <input
        aria-label="Next learning objective"
        data-testid="deal-objective-input"
        className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
        value={text}
        maxLength={240}
        placeholder="What do you need to learn next?"
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        data-testid="deal-objective-save"
        disabled={saving || !text.trim()}
        onClick={save}
        className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
      >
        {saving ? 'Saving' : 'Set objective'}
      </button>
      <ActionStatus result={result} testId="deal-objective-status" busy={saving} onRetry={() => void save()} />
    </div>
  );
}
