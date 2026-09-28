/** A tiny in-memory HubSpot for the active-opportunity resolver (src/lib/gap/opportunity). */
import type { OpportunityReads } from '@/lib/gap/opportunity/active-opportunity';

type Deal = { id: string; closed: string | undefined; name?: string; stage?: string; contacts?: string[]; created?: string };

/** A tiny in-memory HubSpot: companies by domain, company->deals, contact->deals, deals. */
export function fakeHubSpot(world: {
  companiesByDomain?: Record<string, string[]>;
  /** HubSpot company id -> name (default: the id itself, so no accidental name duplicates). */
  names?: Record<string, string>;
  companyDeals?: Record<string, string[]>;
  contactDeals?: Record<string, string[]>;
  deals?: Deal[];
  missingCompanies?: string[];
  fail?: Partial<Record<'search' | 'names' | 'byId' | 'companyAssoc' | 'contactAssoc' | 'deals', Error>>;
}): OpportunityReads & { calls: string[] } {
  const calls: string[] = [];
  const deals = new Map((world.deals ?? []).map((d) => [d.id, d]));
  const nameOf = (id: string) => world.names?.[id] ?? id;
  const allCompanies = () => [...new Set([...Object.values(world.companiesByDomain ?? {}).flat(), ...Object.keys(world.companyDeals ?? {}), ...Object.keys(world.names ?? {})])];
  return {
    calls,
    async companiesByDomains(domains) {
      calls.push(`search:${domains.join(',')}`);
      if (world.fail?.search) throw world.fail.search;
      return { companies: domains.flatMap((d) => world.companiesByDomain?.[d] ?? []).map((id) => ({ id, name: nameOf(id) })), truncated: false };
    },
    async companiesByNames(names) {
      calls.push(`names:${names.join(',')}`);
      if (world.fail?.names) throw world.fail.names;
      return { companies: allCompanies().filter((id) => names.includes(nameOf(id))).map((id) => ({ id, name: nameOf(id) })), truncated: false };
    },
    async companiesById(ids) {
      calls.push(`byId:${ids.join(',')}`);
      if (world.fail?.byId) throw world.fail.byId;
      const missing = ids.filter((id) => world.missingCompanies?.includes(id));
      return { companies: ids.filter((id) => !missing.includes(id)).map((id) => ({ id, name: nameOf(id) })), missing };
    },
    async associations(from, to, ids) {
      calls.push(`assoc:${from}->${to}:${ids.join(',')}`);
      if (from === 'companies' && world.fail?.companyAssoc) throw world.fail.companyAssoc;
      if (from === 'contacts' && world.fail?.contactAssoc) throw world.fail.contactAssoc;
      const byId = new Map<string, string[]>();
      for (const id of ids) {
        if (from === 'companies') byId.set(id, world.companyDeals?.[id] ?? []);
        else if (from === 'contacts') byId.set(id, world.contactDeals?.[id] ?? []);
        else byId.set(id, deals.get(id)?.contacts ?? []);
      }
      return { byId, truncated: false };
    },
    async readDeals(ids) {
      calls.push(`deals:${ids.join(',')}`);
      if (world.fail?.deals) throw world.fail.deals;
      return ids.filter((id) => deals.has(id)).map((id) => {
        const d = deals.get(id)!;
        return { id, properties: { dealname: d.name ?? null, dealstage: d.stage ?? 'appointmentscheduled', pipeline: 'default', hs_is_closed: d.closed, createdate: d.created } };
      });
    },
  };
}

