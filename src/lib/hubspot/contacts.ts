/**
 * HubSpot Contacts module — search, fetch, and create contacts.
 * All calls wrapped in withHubSpotRetry for rate-limit resilience.
 * Graceful degradation: returns null/empty when HubSpot is unavailable.
 */
import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured } from './client';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts/models/Filter';

/** HubSpot contact properties we read/write */
const CONTACT_PROPERTIES = [
  'email',
  'firstname',
  'lastname',
  'company',
  'jobtitle',
  'phone',
  'hs_lead_status',
  'lifecyclestage',
  'hs_email_optout',
] as const;

export interface HubSpotContact {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  company: string;
  jobtitle: string;
  phone: string;
  hs_lead_status: string;
  lifecyclestage: string;
  hs_email_optout: boolean;
}

function mapContact(raw: { id: string; properties: Record<string, string | null> }): HubSpotContact {
  return {
    id: raw.id,
    email: raw.properties.email || '',
    firstname: raw.properties.firstname || '',
    lastname: raw.properties.lastname || '',
    company: raw.properties.company || '',
    jobtitle: raw.properties.jobtitle || '',
    phone: raw.properties.phone || '',
    hs_lead_status: raw.properties.hs_lead_status || '',
    lifecyclestage: raw.properties.lifecyclestage || '',
    hs_email_optout: raw.properties.hs_email_optout === 'true',
  };
}

/** Search HubSpot contacts by email (exact match). */
export async function searchContactByEmail(email: string): Promise<HubSpotContact | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;

  const client = getHubSpotClient();
  const result = await withHubSpotRetry(
    () =>
      client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              { propertyName: 'email', operator: FilterOperatorEnum.Eq, value: email.toLowerCase().trim() },
            ],
          },
        ],
        properties: [...CONTACT_PROPERTIES],
        limit: 1,
        after: '0',
        sorts: [],
      }),
    `searchContactByEmail(${email})`,
  );

  if (!result.results.length) return null;
  return mapContact(result.results[0] as { id: string; properties: Record<string, string | null> });
}

/** Fetch a HubSpot contact by ID. */
export async function getContactById(hubspotId: string): Promise<HubSpotContact | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;

  const client = getHubSpotClient();
  try {
    const result = await withHubSpotRetry(
      () =>
        client.crm.contacts.basicApi.getById(hubspotId, [...CONTACT_PROPERTIES]),
      `getContactById(${hubspotId})`,
    );
    return mapContact(result as { id: string; properties: Record<string, string | null> });
  } catch {
    return null;
  }
}

/** Create or update a HubSpot contact. Returns the HubSpot contact ID. */
export async function upsertContact(properties: {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  jobtitle?: string;
  phone?: string;
  hs_lead_status?: string;
  lifecyclestage?: string;
  hs_email_optout?: string;
}): Promise<string | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;

  const client = getHubSpotClient();

  // Check if contact exists
  const existing = await searchContactByEmail(properties.email);
  if (existing) {
    // Update existing
    await withHubSpotRetry(
      () =>
        client.crm.contacts.basicApi.update(existing.id, { properties }),
      `updateContact(${existing.id})`,
    );
    return existing.id;
  }

  // Create new
  const result = await withHubSpotRetry(
    () =>
      client.crm.contacts.basicApi.create({ properties, associations: [] }),
    `createContact(${properties.email})`,
  );
  return result.id;
}

/** Fetch all contacts modified after a given date (for incremental sync). */
export async function listRecentContacts(
  after?: string,
  limit: number = 100,
): Promise<{ contacts: HubSpotContact[]; nextAfter?: string }> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return { contacts: [] };

  const client = getHubSpotClient();
  const result = await withHubSpotRetry(
    () =>
      client.crm.contacts.basicApi.getPage(limit, after, [...CONTACT_PROPERTIES]),
    'listRecentContacts',
  );

  const contacts = result.results.map((r) =>
    mapContact(r as { id: string; properties: Record<string, string | null> }),
  );
  const nextAfter = result.paging?.next?.after;
  return { contacts, nextAfter };
}

/** Full-text search across name, email, company. Paginated. */
export async function hsSearchContacts(
  query: string,
  after?: string,
  limit: number = 100,
): Promise<{ contacts: HubSpotContact[]; nextAfter?: string; total: number }> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return { contacts: [], total: 0 };

  const client = getHubSpotClient();
  const result = await withHubSpotRetry(
    () =>
      client.crm.contacts.searchApi.doSearch({
        query: query.trim(),
        properties: [...CONTACT_PROPERTIES],
        limit,
        after: after ?? '0',
        sorts: [],
        filterGroups: [],
      }),
    `hsSearchContacts(${query})`,
  );

  const contacts = result.results.map((r) =>
    mapContact(r as { id: string; properties: Record<string, string | null> }),
  );
  const nextAfter = result.paging?.next?.after;
  return { contacts, nextAfter, total: result.total };
}

export interface ContactFilter {
  property: string;
  operator: 'EQ' | 'CONTAINS' | 'HAS_PROPERTY' | 'NOT_HAS_PROPERTY';
  value?: string;
}

/** Filter contacts using CRM filter groups (title, industry, lifecycle). Paginated. */
export async function hsFilterContacts(
  filters: ContactFilter[],
  after?: string,
  limit: number = 100,
): Promise<{ contacts: HubSpotContact[]; nextAfter?: string; total: number }> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return { contacts: [], total: 0 };
  if (filters.length === 0) return { contacts: [], total: 0 };

  const operatorMap: Record<string, FilterOperatorEnum> = {
    EQ: FilterOperatorEnum.Eq,
    CONTAINS: FilterOperatorEnum.ContainsToken,
    HAS_PROPERTY: FilterOperatorEnum.HasProperty,
    NOT_HAS_PROPERTY: FilterOperatorEnum.NotHasProperty,
  };

  const client = getHubSpotClient();
  const result = await withHubSpotRetry(
    () =>
      client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: filters.map((f) => ({
              propertyName: f.property,
              operator: operatorMap[f.operator] ?? FilterOperatorEnum.Eq,
              ...(f.value !== undefined ? { value: f.value } : {}),
            })),
          },
        ],
        properties: [...CONTACT_PROPERTIES],
        limit,
        after: after ?? '0',
        sorts: [],
      }),
    `hsFilterContacts(${filters.length} filters)`,
  );

  const contacts = result.results.map((r) =>
    mapContact(r as { id: string; properties: Record<string, string | null> }),
  );
  const nextAfter = result.paging?.next?.after;
  return { contacts, nextAfter, total: result.total };
}
