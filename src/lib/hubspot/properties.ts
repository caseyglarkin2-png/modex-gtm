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
  __resetGapPropertyCache();
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

export const YARDFLOW_QUAL_VERDICT_PROPERTY = 'yardflow_qual_verdict';
export const YARDFLOW_QUAL_EVALUATED_AT_PROPERTY = 'yardflow_qual_evaluated_at';

/**
 * Ensure the qualification-engine contact properties exist.
 * yardflow_qual_verdict: enumeration none/mql/sql (the engine's opinion).
 * yardflow_qual_evaluated_at: datetime audit stamp.
 * Idempotent: ignores "already exists" (409) errors.
 */
export async function ensureQualificationProperties(): Promise<void> {
  const client = getHubSpotClient();
  const defs = [
    {
      name: YARDFLOW_QUAL_VERDICT_PROPERTY,
      label: 'YardFlow Qualification Verdict',
      type: PropertyCreateTypeEnum.Enumeration,
      fieldType: PropertyCreateFieldTypeEnum.Select,
      groupName: 'contactinformation',
      options: [
        { label: 'None', value: 'none', displayOrder: 0, hidden: false },
        { label: 'MQL', value: 'mql', displayOrder: 1, hidden: false },
        { label: 'SQL', value: 'sql', displayOrder: 2, hidden: false },
      ],
    },
    {
      name: YARDFLOW_QUAL_EVALUATED_AT_PROPERTY,
      label: 'YardFlow Qualification Evaluated At',
      type: PropertyCreateTypeEnum.Datetime,
      fieldType: PropertyCreateFieldTypeEnum.Date,
      groupName: 'contactinformation',
    },
  ];
  for (const def of defs) {
    try {
      await withHubSpotRetry(
        () => client.crm.properties.coreApi.create('contacts', def as never),
        `ensureQualificationProperties(${def.name})`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/already exists|PROPERTY_ALREADY_EXISTS|409/i.test(msg)) throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// GAP Prospecting OS properties (docs/GAP_PROSPECTING_OS.md section 9, S1-T11)
// ---------------------------------------------------------------------------

import { PROBLEM_FAMILIES, RESPONSE_CLASSES } from '@/lib/gap/taxonomy';
import type { Client as HubSpotClient } from '@hubspot/api-client';

export const GAP_PROPERTY_NAMES = {
  companyStatus: 'yardflow_gap_status',
  companyProblemFamily: 'yardflow_gap_problem_family',
  contactLastDisposition: 'yardflow_gap_last_disposition',
  contactLastDispositionAt: 'yardflow_gap_last_disposition_at',
} as const;

export const GAP_STATUS_OPTIONS = [
  'none',
  'hypothesis_proposed',
  'hypothesis_approved',
  'in_sequence',
  'conversation',
  'resolved_confirmed',
  'resolved_rejected',
  'nurture',
] as const;
export type GapStatusOption = (typeof GAP_STATUS_OPTIONS)[number];

const GAP_ADVISORY =
  'Written by the modex GAP layer (GAP Prospecting OS). Advisory only: it mirrors hypothesis state held in modex Postgres and never drives deal stage or lifecycle.';

function enumOptions(values: readonly string[]) {
  return values.map((value, displayOrder) => ({
    label: value.replace(/_/g, ' '),
    value,
    displayOrder,
    hidden: false,
  }));
}

interface GapPropertyDef {
  objectType: 'companies' | 'contacts';
  name: string;
  label: string;
  type: PropertyCreateTypeEnum;
  fieldType: PropertyCreateFieldTypeEnum;
  groupName: string;
  description: string;
  options?: ReturnType<typeof enumOptions>;
}

const GAP_PROPERTIES: ReadonlyArray<GapPropertyDef> = [
  {
    objectType: 'companies',
    name: GAP_PROPERTY_NAMES.companyStatus,
    label: 'YardFlow GAP Status',
    type: PropertyCreateTypeEnum.Enumeration,
    fieldType: PropertyCreateFieldTypeEnum.Select,
    groupName: 'companyinformation',
    description: `Where this account sits in the GAP hypothesis motion. ${GAP_ADVISORY}`,
    options: enumOptions(GAP_STATUS_OPTIONS),
  },
  {
    objectType: 'companies',
    name: GAP_PROPERTY_NAMES.companyProblemFamily,
    label: 'YardFlow GAP Problem Family',
    type: PropertyCreateTypeEnum.Enumeration,
    fieldType: PropertyCreateFieldTypeEnum.Select,
    groupName: 'companyinformation',
    description: `Problem family of the most recent GAP hypothesis for this account, for segmentation. ${GAP_ADVISORY}`,
    options: enumOptions(PROBLEM_FAMILIES),
  },
  {
    objectType: 'contacts',
    name: GAP_PROPERTY_NAMES.contactLastDisposition,
    label: 'YardFlow GAP Last Disposition',
    type: PropertyCreateTypeEnum.Enumeration,
    fieldType: PropertyCreateFieldTypeEnum.Select,
    groupName: 'contactinformation',
    description: `Most recent GAP response class for this contact (hs_lead_status is human-curated and keeps its own semantics). ${GAP_ADVISORY}`,
    options: enumOptions(RESPONSE_CLASSES),
  },
  {
    objectType: 'contacts',
    name: GAP_PROPERTY_NAMES.contactLastDispositionAt,
    label: 'YardFlow GAP Last Disposition At',
    type: PropertyCreateTypeEnum.Datetime,
    fieldType: PropertyCreateFieldTypeEnum.Date,
    groupName: 'contactinformation',
    description: `When the most recent GAP disposition was recorded. ${GAP_ADVISORY}`,
  },
];

// Memoized PROMISE (not a boolean) so concurrent callers share one provisioning
// pass. A rejected pass clears the memo so the next caller retries.
let gapEnsured: Promise<void> | null = null;

/** Reset the GAP property memo (tests only). Also cleared by __resetYardflowPropertyCache. */
export function __resetGapPropertyCache() {
  gapEnsured = null;
}

/**
 * Ensure the four GAP properties exist (two on COMPANY, two on CONTACT).
 * Idempotent, memoized per process, tolerant of a concurrent create (409).
 * With no client injected it no-ops unless HubSpot is configured and sync is
 * on, like ensureCompanyIntentProperties. Throws only on genuine errors, and a
 * throw is not memoized.
 */
export async function ensureGapProperties(client?: HubSpotClient): Promise<void> {
  if (gapEnsured) return gapEnsured;
  if (!client && (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED)) return;

  const hs = client ?? getHubSpotClient();
  gapEnsured = (async () => {
    for (const p of GAP_PROPERTIES) {
      try {
        await withHubSpotRetry(
          () => hs.crm.properties.coreApi.getByName(p.objectType, p.name),
          `ensureGapProperties.get(${p.name})`,
        );
        continue; // already exists
      } catch {
        // not found (or transient): try to create it
      }
      try {
        await withHubSpotRetry(
          () =>
            hs.crm.properties.coreApi.create(p.objectType, {
              name: p.name,
              label: p.label,
              type: p.type,
              fieldType: p.fieldType,
              groupName: p.groupName,
              description: p.description,
              hasUniqueValue: false,
              hidden: false,
              formField: false,
              ...(p.options ? { options: p.options } : {}),
            }),
          `ensureGapProperties.create(${p.name})`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!/already exists|PROPERTY_ALREADY_EXISTS|409/i.test(msg)) throw err;
      }
    }
  })();

  try {
    await gapEnsured;
  } catch (err) {
    gapEnsured = null;
    throw err;
  }
}
