/**
 * HubSpot Companies module — search, fetch, and create companies.
 * Maps to the Account model in our DB.
 */
import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured } from './client';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies/models/Filter';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import { ensureCompanyIntentProperties } from './properties';

const COMPANY_PROPERTIES = [
  'name',
  'domain',
  'industry',
  'city',
  'state',
  'numberofemployees',
  'description',
  'phone',
  'website',
] as const;

export interface HubSpotCompany {
  id: string;
  name: string;
  domain: string;
  industry: string;
  city: string;
  state: string;
  numberofemployees: string;
  description: string;
  phone: string;
  website: string;
}

function mapCompany(raw: { id: string; properties: Record<string, string | null> }): HubSpotCompany {
  return {
    id: raw.id,
    name: raw.properties.name || '',
    domain: raw.properties.domain || '',
    industry: raw.properties.industry || '',
    city: raw.properties.city || '',
    state: raw.properties.state || '',
    numberofemployees: raw.properties.numberofemployees || '',
    description: raw.properties.description || '',
    phone: raw.properties.phone || '',
    website: raw.properties.website || '',
  };
}

/** Search HubSpot companies by domain (exact match). */
export async function searchCompanyByDomain(domain: string): Promise<HubSpotCompany | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;

  const client = getHubSpotClient();
  const result = await withHubSpotRetry(
    () =>
      client.crm.companies.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              { propertyName: 'domain', operator: FilterOperatorEnum.Eq, value: domain.toLowerCase().trim() },
            ],
          },
        ],
        properties: [...COMPANY_PROPERTIES],
        limit: 1,
        after: '0',
        sorts: [],
      }),
    `searchCompanyByDomain(${domain})`,
  );

  if (!result.results.length) return null;
  return mapCompany(result.results[0] as { id: string; properties: Record<string, string | null> });
}

/** Search HubSpot companies by name (exact match). */
export async function searchCompanyByName(name: string): Promise<HubSpotCompany | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;

  const client = getHubSpotClient();
  const result = await withHubSpotRetry(
    () =>
      client.crm.companies.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              { propertyName: 'name', operator: FilterOperatorEnum.Eq, value: name.trim() },
            ],
          },
        ],
        properties: [...COMPANY_PROPERTIES],
        limit: 1,
        after: '0',
        sorts: [],
      }),
    `searchCompanyByName(${name})`,
  );

  if (!result.results.length) return null;
  return mapCompany(result.results[0] as { id: string; properties: Record<string, string | null> });
}

/** Fetch a HubSpot company by ID. */
export async function getCompanyById(hubspotId: string): Promise<HubSpotCompany | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;

  const client = getHubSpotClient();
  try {
    const result = await withHubSpotRetry(
      () =>
        client.crm.companies.basicApi.getById(hubspotId, [...COMPANY_PROPERTIES]),
      `getCompanyById(${hubspotId})`,
    );
    return mapCompany(result as { id: string; properties: Record<string, string | null> });
  } catch {
    return null;
  }
}

/** Create or update a HubSpot company. Returns the HubSpot company ID. */
export async function upsertCompany(properties: {
  name: string;
  domain?: string;
  industry?: string;
  city?: string;
  state?: string;
}): Promise<string | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;
  assertExternalWriteAllowed('hubspot', 'upsertCompany');

  const client = getHubSpotClient();

  // Try to find by domain first, then name
  const existing = properties.domain
    ? await searchCompanyByDomain(properties.domain)
    : await searchCompanyByName(properties.name);

  if (existing) {
    await withHubSpotRetry(
      () =>
        client.crm.companies.basicApi.update(existing.id, { properties }),
      `updateCompany(${existing.id})`,
    );
    return existing.id;
  }

  const result = await withHubSpotRetry(
    () =>
      client.crm.companies.basicApi.create({ properties, associations: [] }),
    `createCompany(${properties.name})`,
  );
  return result.id;
}

/**
 * Write account-level YardFlow intent signals onto a COMPANY: intent_score
 * (sortable hot-accounts view), plus when and on what surface the signal fired.
 * Mirrors updateContactIntent for the account level. Best-effort — never throws
 * (intent logging must not break a page view). Ensures the company intent
 * properties exist first.
 */
export async function updateCompanyIntent(
  companyId: string,
  intent: { score: number; source: string; at: Date },
): Promise<void> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return;
  assertExternalWriteAllowed('hubspot', 'updateCompanyIntent');

  try {
    await ensureCompanyIntentProperties();
  } catch {
    return; // can't write the values without their properties
  }

  const client = getHubSpotClient();
  await withHubSpotRetry(
    () =>
      client.crm.companies.basicApi.update(companyId, {
        properties: {
          intent_score: String(Math.round(intent.score)),
          last_intent_at: String(intent.at.getTime()),
          last_intent_source: intent.source,
        },
      }),
    `updateCompanyIntent(${companyId})`,
  ).catch(() => undefined);
}
