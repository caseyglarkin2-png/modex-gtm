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
let companyIntentEnsured = false;

/** Reset the memo (tests only). */
export function __resetYardflowPropertyCache() {
  ensured = false;
  companyIntentEnsured = false;
}

// Account-level intent properties on the COMPANY object (mirror of the contact
// intent properties), so the intent engine can stamp account-level demo /
// microsite engagement, not only person-identified contacts.
const COMPANY_INTENT_PROPERTIES: ReadonlyArray<{
  name: string;
  label: string;
  type: PropertyCreateTypeEnum;
  fieldType: PropertyCreateFieldTypeEnum;
  description: string;
}> = [
  {
    name: 'intent_score',
    label: 'Intent Score',
    type: PropertyCreateTypeEnum.Number,
    fieldType: PropertyCreateFieldTypeEnum.Number,
    description:
      'Account-level YardFlow demo/microsite buying-intent score (0-100), rolled up by the GTM intent pipeline.',
  },
  {
    name: 'last_intent_at',
    label: 'Last Intent Signal At',
    type: PropertyCreateTypeEnum.Datetime,
    fieldType: PropertyCreateFieldTypeEnum.Date,
    description:
      'Timestamp of the most recent high-intent YardFlow engagement for this account.',
  },
  {
    name: 'last_intent_source',
    label: 'Last Intent Source',
    type: PropertyCreateTypeEnum.String,
    fieldType: PropertyCreateFieldTypeEnum.Text,
    description:
      'Surface/path of the most recent high-intent engagement (e.g. /demo/<account>).',
  },
];

/**
 * Ensure the account-level intent properties exist on the COMPANY object.
 * Idempotent, memoized per process, tolerant of a concurrent create. No-ops
 * without HubSpot configured. Lets the intent engine stamp account-level intent
 * even when a demo/microsite session has no resolvable person.
 */
export async function ensureCompanyIntentProperties(): Promise<void> {
  if (companyIntentEnsured) return;
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return;

  const client = getHubSpotClient();
  for (const p of COMPANY_INTENT_PROPERTIES) {
    try {
      await withHubSpotRetry(
        () => client.crm.properties.coreApi.getByName('companies', p.name),
        `ensureCompanyIntent.get(${p.name})`,
      );
      continue; // already exists
    } catch {
      // not found (or transient) — try to create it
    }
    try {
      await withHubSpotRetry(
        () =>
          client.crm.properties.coreApi.create('companies', {
            name: p.name,
            label: p.label,
            type: p.type,
            fieldType: p.fieldType,
            groupName: 'companyinformation',
            description: p.description,
            hasUniqueValue: false,
            hidden: false,
            formField: false,
          }),
        `ensureCompanyIntent.create(${p.name})`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/already exists|PROPERTY_ALREADY_EXISTS|409/i.test(msg)) throw err;
    }
  }
  companyIntentEnsured = true;
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
