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

/** Batch-write yardflow_qual_verdict + evaluated_at for the changed rows. Returns count updated. */
export async function applyVerdicts(changed: VerdictDiff[]): Promise<{ updated: number }> {
  if (changed.length === 0) return { updated: 0 };
  assertExternalWriteAllowed('hubspot', 'applyVerdicts');

  const client = getHubSpotClient();
  const now = new Date().toISOString();
  let updated = 0;

  for (let i = 0; i < changed.length; i += 100) {
    const batch = changed.slice(i, i + 100);
    await withHubSpotRetry(
      () =>
        client.crm.contacts.batchApi.update({
          inputs: batch.map((d) => ({
            id: d.contactId,
            properties: {
              [YARDFLOW_QUAL_VERDICT_PROPERTY]: d.newVerdict,
              [YARDFLOW_QUAL_EVALUATED_AT_PROPERTY]: now,
            },
          })),
        }),
      `applyVerdicts(${batch.length})`,
    );
    updated += batch.length;
  }

  return { updated };
}
