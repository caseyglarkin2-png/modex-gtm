/**
 * HubSpot custom-property provisioning for the prospect-discovery push.
 *
 * The discovery push (src/app/discovery/actions.ts + scripts/prospect-discovery/
 * push-to-hubspot.ts) stamps the custom company property `yardflow_icp_score`.
 * If that property doesn't exist in the portal, every push 400s with
 * PROPERTY_DOESNT_EXIST. This module ensures it exists (idempotent, cached per
 * process) so a fresh portal / deleted property self-heals on first push.
 */
import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured } from './client';
import {
  PropertyCreateTypeEnum,
  PropertyCreateFieldTypeEnum,
} from '@hubspot/api-client/lib/codegen/crm/properties/models/PropertyCreate';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';

export const YARDFLOW_ICP_SCORE_PROPERTY = 'yardflow_icp_score';

// Per-process memo so we only hit the properties API once, not on every push.
let ensured = false;

/** Reset the memo (tests only). */
export function __resetYardflowPropertyCache() {
  ensured = false;
}

/**
 * Ensure the `yardflow_icp_score` company property exists. No-ops if already
 * provisioned this process, or if HubSpot isn't configured. Tolerates a
 * concurrent create (race → "already exists"). Throws only on genuine errors.
 */
export async function ensureYardflowIcpScoreProperty(): Promise<void> {
  if (ensured) return;
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return;

  const client = getHubSpotClient();

  // Fast path: property already exists.
  try {
    await withHubSpotRetry(
      () => client.crm.properties.coreApi.getByName('companies', YARDFLOW_ICP_SCORE_PROPERTY),
      `ensureProperty.get(${YARDFLOW_ICP_SCORE_PROPERTY})`,
    );
    ensured = true;
    return;
  } catch {
    // Not found (or transient) — fall through and try to create it.
  }

  try {
    await withHubSpotRetry(
      () =>
        client.crm.properties.coreApi.create('companies', {
          name: YARDFLOW_ICP_SCORE_PROPERTY,
          label: 'YardFlow ICP Score',
          type: PropertyCreateTypeEnum.Number,
          fieldType: PropertyCreateFieldTypeEnum.Number,
          groupName: 'companyinformation',
          description:
            'YardFlow by FreightRoll ICP fit score (0–100) from the corridor-scan discovery pipeline. Higher = stronger fit.',
          hasUniqueValue: false,
          hidden: false,
          formField: false,
        }),
      `ensureProperty.create(${YARDFLOW_ICP_SCORE_PROPERTY})`,
    );
  } catch (err) {
    // A concurrent create (race) returns "already exists" — that's success.
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists|PROPERTY_ALREADY_EXISTS|409/i.test(msg)) throw err;
  }

  ensured = true;
}
