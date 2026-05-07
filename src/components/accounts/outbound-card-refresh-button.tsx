'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { readApiResponse } from '@/lib/api-response';

type OutboundCardRefreshButtonProps = {
  accountName: string;
  accountNames: string[];
  /** Short label shown to the operator on success toast (e.g. "Recommended asset"). */
  surfaceLabel: string;
};

/**
 * Tiny client button rendered in the corner of each Outbound Command Center
 * card. POSTs to /api/agent-actions to trigger a content_context refresh on
 * the account scope, then asks Next.js to revalidate the route so the server
 * component picks up new data without a hard reload.
 */
export function OutboundCardRefreshButton({ accountName, accountNames, surfaceLabel }: OutboundCardRefreshButtonProps) {
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/agent-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'content_context',
          refresh: true,
          target: { accountName, accountNames, company: accountName },
        }),
      });
      await readApiResponse(response);
      if (!response.ok) {
        throw new Error('Refresh failed');
      }
      toast.success(`${surfaceLabel} refreshed`);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Refresh failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-50"
      aria-label={`Refresh ${surfaceLabel}`}
      title={`Refresh ${surfaceLabel}`}
      data-testid={`refresh-card-${surfaceLabel.toLowerCase().replaceAll(/\s+/g, '-')}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
    </button>
  );
}
