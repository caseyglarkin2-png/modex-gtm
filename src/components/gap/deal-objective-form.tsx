'use client';

/**
 * Set the next learning objective for an account in a deal (Phase 2 F3).
 * Posts to /api/gap/deals/objective; the newest objective wins, every earlier
 * one stays in the audit ledger. Nothing is written to HubSpot.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshNow } from '@/components/gap/refresh-now';

export function DealObjectiveForm({ accountName, initial }: { accountName: string; initial: string }) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | string>('idle');
  const save = async () => {
    setState('saving');
    const res = await fetch('/api/gap/deals/objective', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountName, text }) }).catch(() => null);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null;
      setState(`Not saved: ${body?.error ?? 'network error'}`);
      return;
    }
    setState('saved');
    refreshNow(router);
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
        disabled={state === 'saving' || !text.trim()}
        onClick={save}
        className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
      >
        {state === 'saving' ? 'Saving' : 'Set objective'}
      </button>
      {state !== 'idle' && state !== 'saving' ? <p className="text-xs text-[var(--muted-foreground)]">{state === 'saved' ? 'Saved.' : state}</p> : null}
    </div>
  );
}
