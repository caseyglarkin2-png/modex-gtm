'use client';

/**
 * The GAP health strip (Phase 2 A3): one line at the top of /gap saying
 * whether the cockpit can be trusted right now, with the diagnostic detail
 * under a disclosure. It loads after the page (GET /api/gap/health) so a slow
 * dependency never delays the cockpit. A strip that cannot load says so; it
 * is never shown green by default. Voice: no em dashes.
 */
import { useEffect, useState } from 'react';
import type { HealthReport, HealthState } from '@/lib/gap/health/health';

const DOT: Record<HealthState, string> = {
  HEALTHY: 'bg-emerald-500',
  DEGRADED: 'bg-amber-500',
  BLOCKED: 'bg-[var(--destructive)]',
};

const WORD: Record<HealthState, string> = { HEALTHY: 'Healthy', DEGRADED: 'Degraded', BLOCKED: 'Blocked' };

type State = { kind: 'loading' } | { kind: 'ready'; report: HealthReport } | { kind: 'failed'; reason: string };

export function HealthStrip({ initial = null }: { initial?: HealthReport | null }) {
  const [state, setState] = useState<State>(initial ? { kind: 'ready', report: initial } : { kind: 'loading' });

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    fetch('/api/gap/health', { cache: 'no-store' })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as HealthReport | null;
        if (cancelled) return;
        if (!res.ok || !body || !Array.isArray(body.components)) setState({ kind: 'failed', reason: `HTTP ${res.status}` });
        else setState({ kind: 'ready', report: body });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ kind: 'failed', reason: e instanceof Error ? e.message : 'network error' });
      });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  if (state.kind === 'loading') {
    return (
      <p data-testid="health-strip" data-state="loading" className="text-xs text-[var(--muted-foreground)]">
        Checking GAP health...
      </p>
    );
  }
  if (state.kind === 'failed') {
    return (
      <p data-testid="health-strip" data-state="unknown" role="status" className="text-xs text-amber-700 dark:text-amber-400">
        GAP health could not be checked ({state.reason}). Every outbound click still re-checks its own gates.
      </p>
    );
  }
  const r = state.report;
  // R63-A S16: the worst failure names who repairs it and the next step, on the line itself (never only in the details).
  const worst = r.overall === 'HEALTHY' ? null : r.components.filter((c) => c.state === r.overall && c.owner && c.retry)[0] ?? null;
  return (
    <details data-testid="health-strip" data-state={r.overall} className="rounded-md border border-[var(--border)] px-3 py-2 text-xs">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-0.5">
        <span aria-hidden className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT[r.overall]}`} />
        <span className="sr-only">{WORD[r.overall]}:</span>
        <span data-testid="health-headline" className={r.overall === 'HEALTHY' ? 'text-[var(--muted-foreground)]' : 'font-medium'}>
          {r.headline}
        </span>
        {worst ? (
          <span data-testid="health-repair" className="basis-full pl-4 text-[var(--muted-foreground)]">
            Owner: {worst.owner}. Next: {worst.retry}.
          </span>
        ) : null}
      </summary>
      <ul className="mt-2 space-y-1" data-testid="health-details">
        {r.components.map((c) => (
          <li key={c.key} data-testid={`health-${c.key}`} data-state={c.state} className="flex flex-wrap items-baseline gap-x-2">
            <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${DOT[c.state]}`} aria-hidden />
            <span className="font-medium">{c.name}</span>
            <span>{WORD[c.state]}</span>
            <span className="text-[var(--muted-foreground)]">{c.detail}</span>
            {c.owner && c.retry ? <span className="basis-full pl-3.5" data-testid={`health-${c.key}-repair`}>Owner: {c.owner}. Next: {c.retry}.</span> : null}
          </li>
        ))}
        <li className="text-[var(--muted-foreground)]">Checked {new Date(r.checkedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</li>
      </ul>
    </details>
  );
}
