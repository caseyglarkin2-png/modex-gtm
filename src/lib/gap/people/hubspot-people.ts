/**
 * THE ACCOUNT'S PEOPLE IN HUBSPOT (V2, 2026-10-03). GAP's personas are a small slice of what HubSpot holds (PepsiCo:
 * 19 personas, 542 HubSpot contacts, among them the PBNA and Frito-Lay transportation directors GAP called
 * "missing"). This is a LIVE, READ-ONLY projection of the contacts associated with the account's HubSpot company:
 * name, title, person-level location (city / state / country, set per contact), and whether an email exists (never
 * the address). Nothing is copied into a table; nobody is created, merged or contacted. A persona is the same
 * person only through its stored hubspot_contact_id (an explicit link).
 *
 * Fails soft: a read error returns null and the page carries on with the personas alone.
 */
import { getHubSpotClient, withHubSpotRetry } from '@/lib/hubspot/client';

export interface HubSpotPerson {
  id: string;
  name: string;
  title: string | null;
  /** "Chicago, Illinois, United States" from the contact's own city / state / country, else null. */
  location: string | null;
  hasEmail: boolean;
  /** HubSpot says they opted out of email (hs_email_optout): never a WHO pick. */
  optedOut: boolean;
}

export interface HubSpotPeopleReads {
  contactIdsForCompany(companyId: string, cap: number): Promise<{ ids: string[]; truncated: boolean }>;
  readContacts(ids: string[]): Promise<Array<{ id: string; properties: Record<string, string | null | undefined> }>>;
}

const PROPS = ['firstname', 'lastname', 'jobtitle', 'city', 'state', 'country', 'email', 'hs_email_optout'];

export const hubspotPeopleReads: HubSpotPeopleReads = {
  async contactIdsForCompany(companyId, cap) {
    const client = getHubSpotClient();
    const ids: string[] = [];
    let after: string | undefined;
    for (;;) {
      const res = (await withHubSpotRetry(() => client.crm.associations.v4.basicApi.getPage('companies', companyId, 'contacts', after, 500), `gap-people company contacts (${companyId})`)) as { results?: Array<{ toObjectId: string | number }>; paging?: { next?: { after?: string } } };
      for (const r of res.results ?? []) ids.push(String(r.toObjectId));
      after = res.paging?.next?.after;
      if (!after) return { ids, truncated: false };
      if (ids.length >= cap) return { ids: ids.slice(0, cap), truncated: true };
    }
  },
  async readContacts(ids) {
    const client = getHubSpotClient();
    const out: Array<{ id: string; properties: Record<string, string | null | undefined> }> = [];
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const res = await withHubSpotRetry(() => client.crm.contacts.batchApi.read({ inputs: chunk.map((id) => ({ id })), properties: PROPS, propertiesWithHistory: [] }), `gap-people contact read (${chunk.length})`);
      for (const r of res.results ?? []) out.push({ id: String(r.id), properties: (r.properties ?? {}) as Record<string, string | null> });
    }
    return out;
  },
};

const clean = (v: string | null | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * A short in-memory cache (per server instance, 15 minutes) for the real HubSpot reads only: a company's contacts
 * change slowly, and re-reading 500+ of them on every page view is the slowest thing the account page did. A failed
 * read is never cached. Injected reads (tests) bypass it.
 */
const CACHE_MS = 15 * 60_000;
const cache = new Map<string, { at: number; value: { people: HubSpotPerson[]; truncated: boolean } }>();

/** The people HubSpot associates with this company (capped), or null when it cannot be read. */
export async function loadHubSpotPeople(companyId: string | null, reads: HubSpotPeopleReads = hubspotPeopleReads, cap = 1000, now = Date.now(), cacheable = reads === hubspotPeopleReads): Promise<{ people: HubSpotPerson[]; truncated: boolean } | null> {
  if (!companyId) return null;
  const hit = cacheable ? cache.get(companyId) : undefined;
  if (hit && now - hit.at < CACHE_MS) return hit.value;
  const value = await readPeople(companyId, reads, cap);
  if (value && cacheable) cache.set(companyId, { at: now, value });
  return value;
}

async function readPeople(companyId: string, reads: HubSpotPeopleReads, cap: number): Promise<{ people: HubSpotPerson[]; truncated: boolean } | null> {
  try {
    const { ids, truncated } = await reads.contactIdsForCompany(companyId, cap);
    if (!ids.length) return { people: [], truncated };
    const rows = await reads.readContacts(ids);
    const people = rows.map(({ id, properties: p }) => {
      const name = [clean(p.firstname), clean(p.lastname)].filter(Boolean).join(' ') || '(no name in HubSpot)';
      const location = [clean(p.city), clean(p.state), clean(p.country)].filter(Boolean).join(', ') || null;
      return { id, name, title: clean(p.jobtitle), location, hasEmail: !!clean(p.email), optedOut: String(p.hs_email_optout ?? '').toLowerCase() === 'true' };
    });
    return { people, truncated };
  } catch {
    return null;
  }
}

/**
 * The person-level location of specific HubSpot contacts (city, state, country), for the cockpit's ranking of ready
 * cards: the brief applies US-first with this same location, so the cockpit must too (review S3, 2026-10-04). One
 * batch read per 100 ids, cached per id for 15 minutes; a read error throws (the caller falls back to no location).
 */
const locationCache = new Map<string, { at: number; location: string | null }>();
export async function loadContactLocations(ids: readonly string[], reads: HubSpotPeopleReads = hubspotPeopleReads, now = Date.now()): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  const cacheable = reads === hubspotPeopleReads;
  const missing: string[] = [];
  for (const id of new Set(ids)) {
    const hit = cacheable ? locationCache.get(id) : undefined;
    if (hit && now - hit.at < CACHE_MS) out.set(id, hit.location);
    else missing.push(id);
  }
  if (missing.length) {
    for (const { id, properties: p } of await reads.readContacts(missing)) {
      const location = [clean(p.city), clean(p.state), clean(p.country)].filter(Boolean).join(', ') || null;
      out.set(id, location);
      if (cacheable) locationCache.set(id, { at: now, location });
    }
  }
  return out;
}
