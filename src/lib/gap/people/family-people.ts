/**
 * ENTERPRISE GRAPH: the corporate-family-aware HubSpot contact read (2026-10-05). Owner resolution read ONE HubSpot
 * company per account, and PepsiCo's transportation directors sit on the Frito-Lay and PBNA records, Walmart's on
 * Sam's, Kroger's on its banners, a carrier's on its operating companies. This read is bounded and honest:
 *
 *   - the PRIMARY read is exactly what owner-resolution-load makes today (resolveAccountHubSpotCompanies, then
 *     loadHubSpotPeopleForCompanies' per-company reads under one total cap);
 *   - FAMILY members come only from loadCorporateFamily (parent_brand naming a different GAP account, HubSpot
 *     parent / child / sibling when the deps give them, same_company duplicate rows);
 *   - a member is read ONLY through its own linked hubspot_company_id: never by domain, never by name (an unrelated
 *     same-domain company or an ambiguous name must never enter);
 *   - a member whose name is a divested unit of the account (entity-boundary.ts) is excluded with the transaction
 *     note; a separate operating company is read and each of its people carries that boundary in its provenance;
 *   - people are deduplicated by HubSpot contact id, then by the non-reversible email key; the primary row wins;
 *   - caps are deterministic (members in a fixed order, the same inputs cut the same way) and reported;
 *   - nothing throws: a failed member read is `excluded` as unreadable.
 *
 * Read only. No Apollo, no write, no account created. House `prisma: any` glue.
 */
import { loadCorporateFamily, type FamilyDeps, type FamilyMember, type Relation } from '../family/family';
import { resolveAccountHubSpotCompanies, type AccountCompanyDeps, type CompanyVia } from './account-company';
import { entityBoundaryFor } from './entity-boundary';
import { loadHubSpotPeople, type HubSpotPeopleReads, type HubSpotPerson } from './hubspot-people';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type FamilyRelation = 'primary' | Relation;

export interface FamilyPerson extends HubSpotPerson {
  provenance: {
    accountName: string;
    relation: FamilyRelation;
    companyId: string;
    /** The member is a separate operating company of the account (entity boundary): the resolver cautions. */
    boundary?: { unit: string; status: 'separate'; note: string };
  };
}

export interface FamilyPeopleRead {
  /** Deduplicated, the primary company's people first. */
  people: FamilyPerson[];
  primary: { accountName: string; companyIds: string[]; count: number; truncated: boolean; via: CompanyVia };
  /** What was actually searched beyond the primary company. */
  family: Array<{ accountName: string; relation: FamilyRelation; companyIds: string[]; count: number; truncated: boolean }>;
  /** "Frito-Lay (54772621360)" per company record searched. */
  searched: string[];
  /** A divested unit, no linked HubSpot company (never read by a domain guess), beyond a cap, or unreadable. */
  excluded: Array<{ accountName: string; why: string }>;
  capHit: boolean;
  dedupe: { byId: number; byEmail: number };
  /** At least one HubSpot read succeeded. */
  read: boolean;
}

export interface FamilyPeopleDeps {
  hubspotPeople?: HubSpotPeopleReads;
  company?: AccountCompanyDeps;
  family?: FamilyDeps;
  /** Defaults: 400 per family company, 1000 people in total, 8 family companies. */
  caps?: { perCompany?: number; total?: number; companies?: number };
}

export const FAMILY_PEOPLE_CAPS = { perCompany: 400, total: 1000, companies: 8 } as const;

export const NO_LINKED_COMPANY = 'no linked HubSpot company (never read by a domain or name guess)';

const RELATION_ORDER: Record<Relation, number> = { parent: 0, subsidiary: 1, sibling: 2, same_company: 3 };

/** A fixed order, so the same family always cuts the same way at the cap. */
function orderMembers(members: readonly FamilyMember[]): FamilyMember[] {
  return [...members].sort((a, b) => RELATION_ORDER[a.relation] - RELATION_ORDER[b.relation] || a.accountName.localeCompare(b.accountName));
}

export async function loadFamilyPeople(prisma: PrismaLike, accountName: string, now: Date, deps: FamilyPeopleDeps = {}): Promise<FamilyPeopleRead> {
  const caps = { ...FAMILY_PEOPLE_CAPS, ...(deps.caps ?? {}) };
  const out: FamilyPeopleRead = {
    people: [],
    primary: { accountName, companyIds: [], count: 0, truncated: false, via: 'none' },
    family: [],
    searched: [],
    excluded: [],
    capHit: false,
    dedupe: { byId: 0, byEmail: 0 },
    read: false,
  };
  const account: { name: string } | null = await prisma.account.findUnique({ where: { name: accountName }, select: { name: true } }).catch(() => null);
  if (!account) {
    out.excluded.push({ accountName, why: 'no such GAP account' });
    return out;
  }
  out.primary.accountName = account.name;

  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();
  const at = now.getTime();
  const admit = (p: HubSpotPerson, provenance: FamilyPerson['provenance']): boolean => {
    if (seenIds.has(p.id)) {
      out.dedupe.byId += 1;
      return false;
    }
    if (p.emailKey && seenEmails.has(p.emailKey)) {
      out.dedupe.byEmail += 1;
      return false;
    }
    seenIds.add(p.id);
    if (p.emailKey) seenEmails.add(p.emailKey);
    out.people.push({ ...p, provenance });
    return true;
  };
  const room = () => Math.max(0, caps.total - out.people.length);

  // 1. The primary read: the same companies and the same per-company reads owner resolution makes today.
  const companies = await resolveAccountHubSpotCompanies(prisma, account.name, deps.company).catch((e: unknown) => ({ ids: [] as string[], via: 'unreadable' as CompanyVia, detail: e instanceof Error ? e.message : String(e) }));
  const primaryIds = [...new Set(companies.ids.map((x) => String(x ?? '').trim()).filter(Boolean))];
  out.primary.companyIds = primaryIds;
  if (!primaryIds.length) {
    out.primary.via = companies.via === 'unreadable' ? 'unreadable' : 'none';
  } else {
    let any = false;
    for (const id of primaryIds) {
      if (room() === 0) {
        out.primary.truncated = true;
        break;
      }
      const r = await loadHubSpotPeople(id, deps.hubspotPeople, room(), at);
      if (!r) continue;
      any = true;
      out.searched.push(`${account.name} (${id})`);
      out.primary.truncated = out.primary.truncated || r.truncated;
      for (const p of r.people) {
        if (room() === 0) {
          out.primary.truncated = true;
          break;
        }
        admit(p, { accountName: account.name, relation: 'primary', companyId: id });
      }
    }
    out.primary.via = any ? companies.via : 'unreadable';
    out.primary.count = out.people.length;
    out.read = any;
  }

  // 2. The family: only what loadCorporateFamily derives; each member only through its own linked company.
  const family = await loadCorporateFamily(prisma, account.name, deps.family).catch(() => null);
  const members = orderMembers(family?.members ?? []);
  const primarySet = new Set(primaryIds);
  let searchedMembers = 0;
  for (const m of members) {
    const boundary = entityBoundaryFor(account.name, { company: m.accountName });
    if (boundary?.status === 'divested') {
      out.excluded.push({ accountName: m.accountName, why: `divested: ${boundary.note}` });
      continue;
    }
    const row: { hubspot_company_id: string | null } | null = await prisma.account.findUnique({ where: { name: m.accountName }, select: { hubspot_company_id: true } }).catch(() => null);
    const companyId = String(row?.hubspot_company_id ?? '').trim();
    if (!companyId) {
      out.excluded.push({ accountName: m.accountName, why: NO_LINKED_COMPANY });
      continue;
    }
    if (primarySet.has(companyId)) {
      out.excluded.push({ accountName: m.accountName, why: `already read as the primary company (${companyId})` });
      continue;
    }
    if (searchedMembers >= caps.companies) {
      out.excluded.push({ accountName: m.accountName, why: `beyond the ${caps.companies}-company cap` });
      out.capHit = true;
      continue;
    }
    if (room() === 0) {
      out.excluded.push({ accountName: m.accountName, why: `beyond the ${caps.total}-person total cap` });
      out.capHit = true;
      continue;
    }
    searchedMembers += 1;
    const r = await loadHubSpotPeople(companyId, deps.hubspotPeople, Math.min(caps.perCompany, room()), at).catch(() => null);
    if (!r) {
      out.excluded.push({ accountName: m.accountName, why: `unreadable: the HubSpot read of company ${companyId} failed` });
      continue;
    }
    out.read = true;
    out.searched.push(`${m.accountName} (${companyId})`);
    let truncated = r.truncated;
    const provenance: FamilyPerson['provenance'] = boundary?.status === 'separate' ? { accountName: m.accountName, relation: m.relation, companyId, boundary: { unit: boundary.unit, status: 'separate', note: boundary.note } } : { accountName: m.accountName, relation: m.relation, companyId };
    for (const p of r.people) {
      if (room() === 0) {
        truncated = true;
        break;
      }
      admit(p, provenance);
    }
    out.family.push({ accountName: m.accountName, relation: m.relation, companyIds: [companyId], count: r.people.length, truncated });
    if (truncated) out.capHit = true;
  }
  if (out.primary.truncated || out.people.length >= caps.total) out.capHit = true;
  return out;
}
