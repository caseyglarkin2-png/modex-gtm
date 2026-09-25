'use client';

/**
 * Ties Run Routing to the Queue: after a successful run, `router.refresh()`
 * (from <RunRoutingPanel>) re-fetches this server page's props, so
 * `latestRunId` changes to the new run's id. That change alone (no extra
 * state here) is what tells <WorkQueue> to refetch -- one trigger, one
 * source of truth, no manual page refresh.
 */

import { RunRoutingPanel } from '@/components/gap/run-routing-panel';
import { WorkQueue } from './work-queue';

export function GapQueueSection({
  latestRunId,
  canRunRouting,
  routableHypotheses,
  routableAccounts,
}: {
  latestRunId: string | null;
  canRunRouting: boolean;
  routableHypotheses: number;
  routableAccounts: number;
}) {
  return (
    <div className="space-y-4">
      <RunRoutingPanel canRun={canRunRouting} routableHypotheses={routableHypotheses} routableAccounts={routableAccounts} />
      <WorkQueue reloadKey={latestRunId ?? undefined} />
    </div>
  );
}
