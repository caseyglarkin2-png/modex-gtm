'use client';

/**
 * THE LINE AFTER AN ACTION (C44, 2026-10-08): what the request came to, with its next path. Accepted, queued and
 * prepared read as a status; refused, failed and unknown read as an alert with "Try again" (when the same click is
 * safe) and "Reload to see" (when the request did not complete and may have applied). Nothing here fires an action
 * of its own; the parent owns the retry.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { actionRole, type ActionResult } from '@/lib/gap/ui/action-result';
import { refreshNow } from './refresh-now';

const LINK = 'rounded border border-[var(--border)] px-1.5 py-0.5 text-xs hover:bg-[var(--muted)] disabled:opacity-60';

export function ActionStatus({ result, onRetry, testId = 'action-status', className = 'text-xs text-[var(--muted-foreground)]', busy = false }: { result: ActionResult | null; onRetry?: () => void; testId?: string; className?: string; busy?: boolean }) {
  const router = useRouter();
  if (!result) return null;
  const role = actionRole(result);
  return (
    <span role={role} className={className} data-testid={testId} data-state={result.state}>
      {result.line}
      {result.retry && onRetry ? (
        <>
          {' '}
          <button type="button" className={LINK} disabled={busy} onClick={onRetry} data-testid={`${testId}-retry`}>
            Try again
          </button>
        </>
      ) : null}
      {result.next?.kind === 'reload' ? (
        <>
          {' '}
          <button type="button" className={LINK} disabled={busy} onClick={() => refreshNow(router)} data-testid={`${testId}-reload`}>
            {result.next.label}
          </button>
        </>
      ) : null}
      {result.next?.kind === 'open' && result.next.href ? (
        <>
          {' '}
          <Link href={result.next.href} className={LINK} data-testid={`${testId}-open`}>
            {result.next.label}
          </Link>
        </>
      ) : null}
    </span>
  );
}
