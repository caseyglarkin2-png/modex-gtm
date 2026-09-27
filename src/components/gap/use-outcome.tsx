'use client';

/**
 * What happened after APPROVE + USE (weekend reduction pass, 2026-09-26).
 * The approve response now carries the routing outcome, so this replaces the
 * old ROUTE THESE N button: Casey sees where each person landed, or the exact
 * reason routing did not run, with one link to the lane that needs him next.
 * Voice: no em dashes.
 */

import Link from 'next/link';
import { refusalCopy } from '@/lib/gap/ui/refusal-copy';

export interface UseOutcomeResponse {
  ok: boolean;
  reason?: string;
  detail?: string;
  runId?: string;
  people?: Array<{ personaId: number; name: string | null; lane: string; decisionId: string | null }>;
  counts?: Record<string, number>;
  failures?: Array<{ accountName: string; reason: string }>;
}

const LANE_WORDS: Array<[string, string]> = [
  ['ready', 'ready to contact'],
  ['follow_up', 'follow up due'],
  ['research', 'need research'],
  ['review', 'need review'],
  ['later', 'on hold'],
  ['blocked', 'blocked'],
  ['not_routed', 'not routed'],
  ['failed', 'failed'],
];

const REASON_WORDS: Record<string, string> = {
  no_people: 'No person is attached to these hypotheses, so there was nothing to route.',
  routing_failed: 'Routing failed.',
};

/**
 * Actual state after the request (thesis-groups summarizeApproval), not only
 * what this request changed: already approved rows count as approved.
 */
export interface OutcomeState {
  newlyApproved?: number;
  alreadyApproved?: number;
  needsResearch?: number;
  blocked?: number;
  requestedUse?: boolean;
  reasons?: string[];
}

export function UseOutcome({ approved, inUse, routing, state }: { approved: number; inUse: number; routing: UseOutcomeResponse | null; state?: OutcomeState }) {
  const counts = routing?.counts ?? {};
  const next = (counts.ready ?? 0) > 0 ? { href: '/gap?lane=ready', label: 'Contact them now' } : (counts.research ?? 0) > 0 ? { href: '/gap?lane=research', label: 'View research' } : { href: '/gap', label: 'View results' };
  const needsResearch = state?.needsResearch ?? 0;
  const blocked = state?.blocked ?? 0;
  // A requested use that did not happen is never styled as success.
  const fell = needsResearch > 0 || blocked > 0 || (state?.requestedUse === true && inUse === 0);
  const primaryReason = state?.reasons?.[0] ?? null;
  const copy = refusalCopy(needsResearch > 0 ? (state?.reasons?.find((r) => refusalCopy(r)) ?? primaryReason) : primaryReason);
  const parts = [`${approved} approved`, state?.requestedUse || inUse > 0 ? `${inUse} in use` : null, needsResearch > 0 ? 'verified evidence required' : null, blocked > 0 ? `${blocked} blocked` : null].filter(Boolean);
  const breakdown = [state?.newlyApproved ? `${state.newlyApproved} newly approved` : null, state?.alreadyApproved ? `${state.alreadyApproved} already approved` : null].filter(Boolean).join(' · ');
  return (
    <div
      data-testid="use-outcome"
      data-tone={fell ? 'attention' : 'success'}
      className={fell ? 'space-y-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm' : 'space-y-2 rounded-md border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm'}
    >
      <p className="font-semibold uppercase tracking-wide" data-testid="use-outcome-headline">{parts.join(' · ')}</p>
      {breakdown ? <p className="text-xs text-[var(--muted-foreground)]" data-testid="use-outcome-breakdown">{breakdown}</p> : null}
      {fell && inUse === 0 ? (
        <div className="space-y-1 text-xs" data-testid="use-outcome-next">
          {copy ? (
            <>
              <p>{copy.what} {copy.why}</p>
              <p className="font-medium">Next: {copy.next}</p>
            </>
          ) : (
            <p>Not in use. Open the details below for the reason.</p>
          )}
          {needsResearch > 0 ? (
            <Link href="/gap?lane=research" className="inline-flex rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90">
              Find verified evidence
            </Link>
          ) : null}
          {state?.reasons?.length ? <p className="text-[var(--muted-foreground)]">Details: {state.reasons.join(', ')}</p> : null}
        </div>
      ) : inUse === 0 ? (
        <p className="text-xs">Approved, not in use. GAP will not recommend contacts until you choose Approve + use.</p>
      ) : routing?.ok ? (
        <>
          <p data-testid="use-outcome-lanes">
            {LANE_WORDS.filter(([k]) => (counts[k] ?? 0) > 0)
              .map(([k, words]) => `${counts[k]} ${words}`)
              .join(' · ') || 'No cards were created.'}
          </p>
          {routing.failures?.length ? (
            <p role="alert" data-testid="use-outcome-failures" className="text-xs text-[var(--destructive)]">
              Routing failed for {routing.failures.map((f) => `${f.accountName} (${f.reason})`).join(', ')}. Nothing was sent. Run routing on /gap retries them.
            </p>
          ) : null}
          <Link href={next.href} className="inline-flex rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90">
            {next.label}
          </Link>
        </>
      ) : routing ? (
        <p role="alert" className="text-[var(--destructive)]">
          In use, but no recommendations yet. {REASON_WORDS[routing.reason ?? ''] ?? `Routing: ${routing.reason ?? 'unknown'}.`}
          {routing.detail ? ` ${routing.detail}` : ''} Nothing was sent.
        </p>
      ) : null}
    </div>
  );
}
