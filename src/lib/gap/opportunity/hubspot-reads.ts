/**
 * The HubSpot READS behind the active-opportunity resolver (active-opportunity.ts).
 * Reads only: company search, association reads, deal batch reads. Every
 * failure throws; the resolver turns a throw into UNKNOWN.
 */
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies/models/Filter';
import { getHubSpotClient, withHubSpotRetry } from '@/lib/hubspot/client';
import { canonicalDomain, hubspotDomainVariants, type CompanyRef, type OpportunityReads } from './active-opportunity';

/** HubSpot search allows five filter groups (OR) per request. */
const GROUPS_PER_SEARCH = 5;
const SEARCH_LIMIT = 100;
/** Pages per search before the match set counts as truncated (ambiguous). */
const SEARCH_PAGES = 3;
const BATCH = 100;

// createdate: read-only deal observation (learning/deal-observation.ts) only; the resolver ignores it.
const DEAL_PROPERTIES = ['dealname', 'dealstage', 'pipeline', 'hs_is_closed', 'createdate'];

type AssocPage = { results: Array<{ toObjectId: string | number }>; paging?: { next?: { after?: string } } };
type BatchAssoc = { results?: Array<{ _from?: { id?: string }; to?: Array<{ toObjectId: string | number }>; paging?: { next?: { after?: string } } }> };

type SearchFilter = { propertyName: string; operator: FilterOperatorEnum; value: string };

/** Companies matching any of `values` on `property` (EQ), five OR-groups per search, with the property's stored value. */
async function companiesWhere(property: 'domain' | 'name', values: string[]): Promise<{ companies: Array<CompanyRef & { stored: string | null }>; truncated: boolean }> {
  const client = getHubSpotClient();
  const out = new Map<string, CompanyRef & { stored: string | null }>();
  let truncated = false;
  for (let i = 0; i < values.length; i += GROUPS_PER_SEARCH) {
    const chunk = values.slice(i, i + GROUPS_PER_SEARCH);
    let after = '0';
    for (let page = 0; ; page += 1) {
      if (page >= SEARCH_PAGES) {
        truncated = true;
        break;
      }
      const res = await withHubSpotRetry(
        () =>
          client.crm.companies.searchApi.doSearch({
            filterGroups: chunk.map((v) => ({ filters: [{ propertyName: property, operator: FilterOperatorEnum.Eq, value: v } as SearchFilter] })),
            properties: ['name', 'domain'],
            limit: SEARCH_LIMIT,
            after,
            sorts: [],
          }),
        `gap-opportunity company search by ${property} (${chunk.length})`,
      );
      for (const r of res.results ?? []) out.set(String(r.id), { id: String(r.id), name: r.properties?.name ?? null, stored: r.properties?.[property] ?? null });
      const next = res.paging?.next?.after;
      if (!next) break;
      after = next;
    }
  }
  return { companies: [...out.values()], truncated };
}

const ref = ({ id, name }: CompanyRef): CompanyRef => ({ id, name });

export const hubspotOpportunityReads: OpportunityReads = {
  // HubSpot stores `domain` as typed (`www.example.com` happens): ask for both
  // forms, then keep only a company whose stored domain is canonically one asked for.
  async companiesByDomains(domains) {
    const wanted = new Set(domains.map(canonicalDomain).filter((d): d is string => !!d));
    const r = await companiesWhere('domain', hubspotDomainVariants([...wanted]));
    return { companies: r.companies.filter((c) => wanted.has(canonicalDomain(c.stored) ?? '')).map(ref), truncated: r.truncated };
  },
  // Search matches tokens, not whole values: keep only the exact (case-insensitive) name.
  async companiesByNames(names) {
    const r = await companiesWhere('name', names);
    const wanted = new Set(names.map((n) => n.trim().toLowerCase()));
    return { companies: r.companies.filter((c) => wanted.has(String(c.name ?? '').trim().toLowerCase())).map(ref), truncated: r.truncated };
  },

  async companiesById(ids) {
    const client = getHubSpotClient();
    const companies: CompanyRef[] = [];
    const missing: string[] = [];
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      const res = await withHubSpotRetry(
        () => client.crm.companies.batchApi.read({ inputs: chunk.map((id) => ({ id })), properties: ['name'], propertiesWithHistory: [] }),
        `gap-opportunity company read (${chunk.length})`,
      );
      const found = new Map((res.results ?? []).map((r) => [String(r.id), r.properties?.name ?? null]));
      for (const id of chunk) {
        if (found.has(id)) companies.push({ id, name: found.get(id) ?? null });
        else missing.push(id);
      }
    }
    return { companies, missing };
  },

  async associations(fromType, toType, ids) {
    const client = getHubSpotClient();
    const byId = new Map<string, string[]>();
    let truncated = false;

    if (fromType === 'companies') {
      // Every page of every company's deals: the required leg is never truncated.
      for (const id of ids) {
        const out: string[] = [];
        let after: string | undefined;
        do {
          const page = (await withHubSpotRetry(
            () => client.crm.associations.v4.basicApi.getPage('companies', id, toType, after, 500),
            `gap-opportunity company deals (${id})`,
          )) as AssocPage;
          for (const r of page.results ?? []) out.push(String(r.toObjectId));
          after = page.paging?.next?.after;
        } while (after);
        byId.set(id, out);
      }
      return { byId, truncated };
    }

    // Contacts and deals: one batch read per 100. HubSpot reports an object
    // with no associations as an error row; that is simply "none".
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      const res = (await withHubSpotRetry(
        () => client.crm.associations.v4.batchApi.getPage(fromType, toType, { inputs: chunk.map((id) => ({ id })) }),
        `gap-opportunity ${fromType} ${toType} (${chunk.length})`,
      )) as BatchAssoc;
      for (const r of res.results ?? []) {
        const from = String(r._from?.id ?? '');
        if (!from) continue;
        byId.set(from, [...(byId.get(from) ?? []), ...(r.to ?? []).map((t) => String(t.toObjectId))]);
        if (r.paging?.next?.after) truncated = true;
      }
    }
    return { byId, truncated };
  },

  async readDeals(ids) {
    const client = getHubSpotClient();
    const out: Array<{ id: string; properties: Record<string, string | null | undefined> }> = [];
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      const res = await withHubSpotRetry(
        () => client.crm.deals.batchApi.read({ inputs: chunk.map((id) => ({ id })), properties: DEAL_PROPERTIES, propertiesWithHistory: [] }),
        `gap-opportunity deal read (${chunk.length})`,
      );
      for (const r of res.results ?? []) out.push({ id: String(r.id), properties: (r.properties ?? {}) as Record<string, string | null> });
    }
    return out;
  },
};
