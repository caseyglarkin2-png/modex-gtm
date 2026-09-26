'use client';

/**
 * What happened after APPROVE + USE (weekend reduction pass, 2026-09-26).
 * The approve response now carries the routing outcome, so this replaces the
 * old ROUTE THESE N button: Casey sees where each person landed, or the exact
 * reason routing did not run, with one link to the lane that needs him next.
 * Voice: no em dashes.
 */

import Link from 'next/link';

export interface UseOutcomeResponse {
  ok: boolean;
  reason?: string;
  detail?: string;
  runId?: string;
  people?: Array<{ personaId: number; name: string | null; lane: string; decisionId: string | null }>;
  counts?: Record<string, number>;
}

const LANE_WORDS: Array<[string, string]> = [
  ['ready', 'ready to contact'],
  ['follow_up', 'follow up due'],
  ['research', 'need research'],
  ['review', 'need review'],
  ['later', 'on hold'],
  ['blocked', 'blocked'],
  ['not_routed', 'not routed'],
];

const REASON_WORDS: Record<string, string> = {
  routable_scope_too_large: 'Too many accounts are in use for one interactive routing pass.',
  no_routable_hypotheses: 'Nothing is in use, so there was nothing to route.',
  routing_failed: 'Routing failed.',
};

export function UseOutcome({ approved, inUse, routing }: { approved: number; inUse: number; routing: UseOutcomeResponse | null }) {
  const counts = routing?.counts ?? {};
  const next = (counts.ready ?? 0) > 0 ? { href: '/gap?lane=ready', label: 'Contact them now' } : (counts.research ?? 0) > 0 ? { href: '/gap?lane=research', label: 'View research' } : { href: '/gap', label: 'View results' };
  return (
    <div data-testid="use-outcome" className="space-y-2 rounded-md border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm">
      <p className="font-semibold uppercase tracking-wide">
        {approved} approved{inUse > 0 ? ` · ${inUse} in use` : ''}
      </p>
      {inUse === 0 ? (
        <p className="text-xs">Approved, not in use. GAP will not recommend contacts until you choose Approve + use.</p>
      ) : routing?.ok ? (
        <>
          <p data-testid="use-outcome-lanes">
            {LANE_WORDS.filter(([k]) => (counts[k] ?? 0) > 0)
              .map(([k, words]) => `${counts[k]} ${words}`)
              .join(' · ') || 'No cards were created.'}
          </p>
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
