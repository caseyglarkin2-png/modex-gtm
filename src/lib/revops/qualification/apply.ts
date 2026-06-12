/**
 * Qualification apply path — writes the engine's verdict (yardflow_qual_verdict) plus an
 * evaluated-at stamp to HubSpot contacts. This is intentionally side-effect-free in CRM terms:
 * it only sets an advisory field. Native HubSpot workflows (built separately, gated on review)
 * are what translate a verdict into a lifecyclestage change + Slack/task. Writes are blocked in
 * test mode by the shared external-write-guard.
 */
import { getHubSpotClient, withHubSpotRetry } from '@/lib/hubspot/client';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import {
  YARDFLOW_QUAL_VERDICT_PROPERTY,
  YARDFLOW_QUAL_EVALUATED_AT_PROPERTY,
} from '@/lib/hubspot/properties';
import type { VerdictDiff } from './types';

// Lifecycle rank — promotions only go UP, never demote (Casey's rule).
const LIFECYCLE_RANK: Record<string, number> = {
  lead: 0,
  '28942939': 1, // Warm Prospect
  '22575941': 2, // Interested
  '28840312': 3, // Holding Pattern
  marketingqualifiedlead: 4, // Engaged
  salesqualifiedlead: 5,
  customer: 6,
};
const MQL_STAGE = 'marketingqualifiedlead';
const SQL_STAGE = 'salesqualifiedlead';

/**
 * The lifecycle promotion a row earns, or null. Pure — exported for tests.
 * SQL verdicts always promote to SQL stage; MQL verdicts promote to Engaged only with a
 * pulse (real email engagement) — cold fit-only contacts keep their stage and carry the
 * verdict as the priority-pool marker (Casey 2026-06-12).
 */
export function lifecycleTarget(d: VerdictDiff): string | null {
  const rank = LIFECYCLE_RANK[d.currentLifecycle] ?? 0;
  if (d.newVerdict === 'sql' && rank < LIFECYCLE_RANK[SQL_STAGE]) return SQL_STAGE;
  if (d.newVerdict === 'mql' && d.hasPulse && rank < LIFECYCLE_RANK[MQL_STAGE]) return MQL_STAGE;
  return null;
}

/**
 * Batch-write verdict + evaluated_at for changed rows, plus the gated lifecycle promotion.
 * Returns counts of records updated and lifecycle promotions among them.
 */
export async function applyVerdicts(
  changed: VerdictDiff[],
): Promise<{ updated: number; promoted: number }> {
  if (changed.length === 0) return { updated: 0, promoted: 0 };
  assertExternalWriteAllowed('hubspot', 'applyVerdicts');

  const client = getHubSpotClient();
  const now = new Date().toISOString();
  let updated = 0;
  let promoted = 0;

  for (let i = 0; i < changed.length; i += 100) {
    const batch = changed.slice(i, i + 100);
    await withHubSpotRetry(
      () =>
        client.crm.contacts.batchApi.update({
          inputs: batch.map((d) => {
            const properties: Record<string, string> = {
              [YARDFLOW_QUAL_VERDICT_PROPERTY]: d.newVerdict,
              [YARDFLOW_QUAL_EVALUATED_AT_PROPERTY]: now,
            };
            const stage = lifecycleTarget(d);
            if (stage) {
              properties.lifecyclestage = stage;
              promoted += 1;
            }
            return { id: d.contactId, properties };
          }),
        }),
      `applyVerdicts(${batch.length})`,
    );
    updated += batch.length;
  }

  return { updated, promoted };
}
