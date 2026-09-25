'use client';

/**
 * Run Routing panel (dogfood operator-loop fix, hardened 2026-09-25 after a
 * production interactive run defaulted to the broad account universe and
 * hung until Vercel's 300s maxDuration killed it).
 *
 * The one button that turns "activate a hypothesis" into "see a
 * recommendation card," without Casey ever touching an API or a cron.
 * POSTs /api/gap/routing/run?mode=apply with `{ scope: 'routable_hypotheses' }`
 * from the authenticated browser session (same-origin fetch, cookies carried
 * automatically) -- never a CRON_SECRET in the browser, never a client-
 * supplied account list. The SERVER resolves that scope to the accounts
 * carrying an approved/active hypothesis; this button never falls back to
 * the broad default. Routing itself only ever creates `RoutingDecision`
 * rows (mode: shadow); it cannot send email or enroll anyone, and this
 * panel says so before and after every run.
 *
 * A client-side 60s AbortController bounds the request: an interactive
 * click over a small, capped scope should never need Vercel's full 300s
 * function budget, and Casey should never be left staring at "Running..."
 * indefinitely. On timeout, no automatic retry (that could double-run
 * shadow routing) -- the message says exactly that and how to recover.
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
  /** How many approved/active hypotheses, and how many distinct accounts, THIS run will cover. Shown before the click. */
  routableHypotheses: number;
  routableAccounts: number;
  /** Called after a successful run so the owning page can refresh dependent surfaces (the Queue). */
  onComplete?: (report: RunRoutingReport) => void;
}

type RunState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; report: RunRoutingReport; at: string }
  | { kind: 'error'; message: string }
  | { kind: 'timeout' };

const CLIENT_TIMEOUT_MS = 60_000;

function summarizeSkips(skips: Record<string, number>): string {
  const entries = Object.entries(skips).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return 'none';
  return entries.map(([reason, count]) => `${reason.replace(/_/g, ' ')} (${count})`).join(', ');
}

export function RunRoutingPanel({ canRun, routableHypotheses, routableAccounts, onComplete }: RunRoutingPanelProps) {
  const router = useRouter();
  const [state, setState] = useState<RunState>({ kind: 'idle' });

  async function run() {
    setState({ kind: 'running' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch('/api/gap/routing/run?mode=apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'routable_hypotheses' }),
        signal: controller.signal,
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
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        setState({ kind: 'timeout' });
        return;
      }
      setState({ kind: 'error', message: caught instanceof Error ? caught.message : 'network_error' });
    } finally {
      clearTimeout(timer);
    }
  }

  const running = state.kind === 'running';

  return (
    <section data-testid="run-routing-panel" className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!canRun || running} onClick={() => void run()}>
          {running ? 'Running...' : 'Run routing'}
        </Button>
        <div className="text-xs text-[var(--muted-foreground)]">
          <p data-testid="run-routing-scope">
            {routableHypotheses} routable {routableHypotheses === 1 ? 'hypothesis' : 'hypotheses'}, {routableAccounts} account
            {routableAccounts === 1 ? '' : 's'}
          </p>
          <p>Routes only accounts with approved or active hypotheses. Creates recommendation cards only. Does not send or enroll.</p>
        </div>
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

      {state.kind === 'timeout' ? (
        <p role="alert" data-testid="run-routing-timeout" className="mt-3 text-sm text-[var(--destructive)]">
          Routing is taking too long. No outbound action was taken. Check routing status before trying again.
        </p>
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
