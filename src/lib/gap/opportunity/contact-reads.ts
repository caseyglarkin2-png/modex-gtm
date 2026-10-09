/**
 * A HubSpot contact by email address, with the companies and deals the CRM associates with it (C02 of the
 * commercial-context audit, 2026-10-08). Reads only: a search by the exact address, then the v4 associations.
 * Null when HubSpot is not configured, the address is not there, or the read fails (the caller says unknown,
 * never "no deal"). Bounded: one search, two association reads.
 */
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts/models/Filter';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '@/lib/hubspot/client';

export interface ContactAssociations {
  contactId: string;
  email: string;
  companyIds: string[];
  dealIds: string[];
  /** The CRM's own name and title for the person, as it holds them. */
  name: string | null;
  title: string | null;
}

export type ContactLookup = (email: string) => Promise<ContactAssociations | null>;

export async function hubspotContactByEmail(email: string): Promise<ContactAssociations | null> {
  const address = email.trim().toLowerCase();
  if (!address.includes('@') || !isHubSpotConfigured()) return null;
  const client = getHubSpotClient();
  const res = await withHubSpotRetry(() =>
    client.crm.contacts.searchApi.doSearch({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: FilterOperatorEnum.Eq, value: address }] }],
      properties: ['email', 'firstname', 'lastname', 'jobtitle'],
      limit: 2,
    }),
  );
  const hit = res.results?.[0];
  if (!hit?.id) return null;
  const assoc = async (toType: 'companies' | 'deals'): Promise<string[]> => {
    const page = await withHubSpotRetry(() => client.crm.associations.v4.basicApi.getPage('contacts', hit.id, toType, undefined, 50));
    return (page.results ?? []).map((r) => String(r.toObjectId));
  };
  const [companyIds, dealIds] = await Promise.all([assoc('companies'), assoc('deals')]);
  const p = hit.properties ?? {};
  const name = [p.firstname, p.lastname].filter((x): x is string => !!x && x.trim().length > 0).join(' ').trim() || null;
  return { contactId: String(hit.id), email: address, companyIds, dealIds, name, title: p.jobtitle?.trim() || null };
}
