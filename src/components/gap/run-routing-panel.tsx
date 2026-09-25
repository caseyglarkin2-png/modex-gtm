'use client';

/**
 * Run Routing panel (dogfood operator-loop fix).
 *
 * The one button that turns "activate a hypothesis" into "see a
 * recommendation card," without Casey ever touching an API or a cron.
 * POSTs /api/gap/routing/run?mode=apply from the authenticated browser
 * session (same-origin fetch, cookies carried automatically) -- never a
 * CRON_SECRET in the browser. Routing itself only ever creates
 * `RoutingDecision` rows (mode: shadow); it cannot send email or enroll
 * anyone, and this panel says so before and after every run.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export interface RunRoutingReport {
  runId: string;
  accountsScanned: number;
  pairs: number;
  decisions: number;
  skips: Record<string, number>;
}

export interface RunRoutingPanelProps {
  /** At least one hypothesis is approved/active (routable), or a prior run exists to refresh. */
  canRun: boolean;
  /** Called after a successful run so the owning page can refresh dependent surfaces (the Queue). */
  onComplete?: (report: RunRoutingReport) => void;
}

type RunState = { kind: 'idle' } | { kind: 'running' } | { kind: 'done'; report: RunRoutingReport; at: string } | { kind: 'error'; message: string };

function summarizeSkips(skips: Record<string, number>): string {
  const entries = Object.entries(skips).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return 'none';
  return entries.map(([reason, count]) => `${reason.replace(/_/g, ' ')} (${count})`).join(', ');
}

export function RunRoutingPanel({ canRun, onComplete }: RunRoutingPanelProps) {
  const router = useRouter();
  const [state, setState] = useState<RunState>({ kind: 'idle' });

  async function run() {
    setState({ kind: 'running' });
    try {
      const res = await fetch('/api/gap/routing/run?mode=apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      if (!res.ok) {
        const payload = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
        const message = typeof payload.error === 'string' ? payload.error : `HTTP ${res.status}`;
        setState({ kind: 'error', message });
        return;
      }
      const payload = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
      const report: RunRoutingReport = {
        runId: String(payload.runId ?? ''),
        accountsScanned: Number(payload.accountsScanned ?? 0),
        pairs: Number(payload.pairs ?? 0),
        decisions: Number(payload.decisions ?? 0),
        skips: (payload.skips && typeof payload.skips === 'object' ? (payload.skips as Record<string, number>) : {}),
      };
      setState({ kind: 'done', report, at: new Date().toISOString() });
      onComplete?.(report);
      router.refresh();
    } catch (caught) {
      setState({ kind: 'error', message: caught instanceof Error ? caught.message : 'network_error' });
    }
  }

  const running = state.kind === 'running';

  return (
    <section data-testid="run-routing-panel" className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!canRun || running} onClick={() => void run()}>
          {running ? 'Running...' : 'Run routing'}
        </Button>
        <p className="text-xs text-[var(--muted-foreground)]">Creates recommendation cards only. Does not send or enroll.</p>
      </div>

      {state.kind === 'done' ? (
        <div data-testid="run-routing-complete" className="mt-3 rounded-md bg-[var(--muted)]/60 p-3 text-sm">
          <p className="font-semibold">Routing complete</p>
          <ul className="mt-1 space-y-0.5 text-[var(--muted-foreground)]">
            <li>Accounts evaluated: {state.report.accountsScanned}</li>
            <li>Personas evaluated: {state.report.pairs}</li>
            <li>Decisions created: {state.report.decisions}</li>
            <li>Skipped: {summarizeSkips(state.report.skips)}</li>
            <li>Run at: {state.at}</li>
          </ul>
        </div>
      ) : null}

      {state.kind === 'error' ? (
        <p role="alert" data-testid="run-routing-error" className="mt-3 text-sm text-[var(--destructive)]">
          Could not run routing: <code className="font-mono">{state.message}</code>
        </p>
      ) : null}

      {!canRun && state.kind === 'idle' ? (
        <p className="mt-2 text-xs italic text-[var(--muted-foreground)]">
          No hypothesis is ready to route yet. Approve or activate one in Hypotheses first.
        </p>
      ) : null}
    </section>
  );
}
