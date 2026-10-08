/**
 * IN DEALS (Phase 2 F1, 2026-09-28; one authoritative read, 2026-10-01). When HubSpot says an account already
 * has an open opportunity, GAP stops cold prospecting there (routing rule `active_opportunity`, every send gate)
 * but stays useful: the account is listed with its open deals, the people GAP holds there and how much buyer
 * truth is confirmed, and its Deal Brief is one click away.
 *
 * The tile and the lane read the SAME summary, built from the deal side: every deal HubSpot marks open, its
 * companies and contacts, mapped to GAP accounts by the identity the opportunity resolver itself uses (the
 * account's HubSpot company id, its canonical domain links, the email domains and HubSpot contact ids of the
 * people GAP holds there, and an exact company name). A handful of HubSpot calls for the whole portal, never
 * one per GAP account and never an account cap.
 *
 * Honest by construction: an open deal no GAP account maps to is listed as unresolved (identity work, never an
 * account created here); a read that failed or came back incomplete makes the count UNKNOWN, never 0. The
 * summary is cached for a few minutes with its timestamp; every draft, send and enroll still runs the
 * per-account resolver fresh at the click. Read-only: nothing here writes to HubSpot.
 */
import { normalizeCompanyName } from '../identity/normalize';
import { companyDomain, emailDomain } from '../opportunity/active-opportunity';
import { BRIEF_BID_SELECT, knownSectionsOf, type BriefBidRow } from './deal-brief';
import { stageLabel } from './stage-label';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** The reads the summary needs (opportunity/hubspot-reads.ts hubspotOpenDealReads in production). */
export interface OpenDealReadsLike {
  openDeals(): Promise<{ deals: Array<{ id: string; properties: Record<string, string | null | undefined> }>; truncated: boolean }>;
  dealAssociations(toType: 'companies' | 'contacts', dealIds: string[]): Promise<{ byId: Map<string, string[]>; truncated: boolean }>;
  companies(ids: string[]): Promise<Array<{ id: string; name: string | null; domain: string | null }>>;
  /** HubSpot companies whose name is exactly one of `names` (the portal's duplicate company records). */
  companiesByNames(names: string[]): Promise<Array<{ id: string; name: string | null; domain: string | null }>>;
}

/** How long one summary answers the cockpit before HubSpot is read again. */
export const IN_DEALS_CACHE_MS = 5 * 60_000;
/** A failed read is retried sooner. */
export const IN_DEALS_FAILURE_CACHE_MS = 60_000;
const CACHE_KEY = 'gap:in-deals-summary';

export interface InDealAccount {
  accountName: string;
  /** Other GAP records of the same company on exactly these deals (duplicates are one row, never two). */
  alsoRecordedAs: string[];
  /** R50: each open deal with its HubSpot id (what scopes work to it); R55: its close date and next step (stalled reads). */
  deals: Array<{ id?: string; name: string | null; stage: string; lastActivityAt: string | null; closeDate?: string | null; nextStep?: string | null; /** Batch item 8: the deal's HubSpot contacts (Work scopes a reply and a meeting to their own deal). */ contactIds?: string[] }>;
  /** HubSpot contacts on the open deals (distinct). */
  dealContacts: number;
  /** People GAP holds at the account. */
  people: Array<{ name: string; title: string | null }>;
  /** Truth sections with confirmed buyer truth (of 6). */
  known: number;
}

export interface UnresolvedDeal {
  dealName: string | null;
  stage: string;
  companies: string[];
}

export interface InDealsSummary {
  /** complete: every open deal was read and mapped or listed unresolved. unavailable: the count is not known. */
  status: 'complete' | 'unavailable';
  /** Accounts in an open deal; null whenever the read was not complete (never a false 0). */
  count: number | null;
  accounts: InDealAccount[];
  unresolved: UnresolvedDeal[];
  checkedAt: string;
  openDeals: number;
  error?: string;
}

/** Accounts the current routing cards hold for an open deal, once each (background research skips them). */
export function heldDealAccounts(items: ReadonlyArray<{ ruleId: string | null; account: { name: string } }>): string[] {
  return [...new Set(items.filter((i) => i.ruleId === 'active_opportunity').map((i) => i.account.name))];
}

// A HubSpot stage id in words lives in the client-safe ./stage-label (a custom stage says so, never its id).
export { stageLabel };

const lastActivity = (p: Record<string, string | null | undefined>): string | null => {
  const raw = p.notes_last_updated || p.hs_lastmodifieddate;
  const d = raw ? new Date(raw) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
};

const unavailable = (now: Date, error: string, openDeals = 0): InDealsSummary => ({ status: 'unavailable', count: null, accounts: [], unresolved: [], checkedAt: now.toISOString(), openDeals, error: error.slice(0, 200) });

/** Build the summary from HubSpot's open deals and GAP's own identity records. */
async function buildSummary(prisma: PrismaLike, reads: OpenDealReadsLike, now: Date): Promise<InDealsSummary> {
  let deals: Array<{ id: string; properties: Record<string, string | null | undefined> }>;
  let dealCompanies: Map<string, string[]>;
  let dealContacts: Map<string, string[]>;
  let companies: Array<{ id: string; name: string | null; domain: string | null }>;
  try {
    const open = await reads.openDeals();
    if (open.truncated) return unavailable(now, 'more open deals than one read returns', open.deals.length);
    deals = open.deals.filter((d) => String(d.properties.hs_is_closed ?? '').toLowerCase() === 'false');
    if (deals.length === 0) return { status: 'complete', count: 0, accounts: [], unresolved: [], checkedAt: now.toISOString(), openDeals: 0 };
    const ids = deals.map((d) => d.id);
    const [c, k] = await Promise.all([reads.dealAssociations('companies', ids), reads.dealAssociations('contacts', ids)]);
    if (c.truncated || k.truncated) return unavailable(now, 'a deal association read was truncated', deals.length);
    dealCompanies = c.byId;
    dealContacts = k.byId;
    companies = await reads.companies([...new Set([...dealCompanies.values()].flat())]);
  } catch (e) {
    return unavailable(now, e instanceof Error ? e.message : String(e));
  }

  // GAP's side of the identity: the same keys the opportunity resolver uses for one account, indexed once.
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const domains = [...new Set(companies.map((c) => companyDomain(c.domain)).filter((d): d is string => !!d))];
  const contactIds = [...new Set([...dealContacts.values()].flat())];
  const [accounts, links, people] = await Promise.all([
    prisma.account.findMany({ select: { name: true, hubspot_company_id: true } }),
    domains.length ? prisma.canonicalAccountLink.findMany({ where: { canonical_company_id: { in: domains.map((d) => `domain:${d}`) } }, select: { account_name: true, canonical_company_id: true } }) : [],
    domains.length || contactIds.length
      ? prisma.persona.findMany({
          where: { OR: [...(contactIds.length ? [{ hubspot_contact_id: { in: contactIds } }] : []), ...domains.map((d) => ({ email: { endsWith: `@${d}`, mode: 'insensitive' } }))] },
          select: { account_name: true, email: true, hubspot_contact_id: true },
        })
      : [],
  ]);
  const byCompanyId = new Map<string, string[]>();
  const byName = new Map<string, string[]>();
  for (const a of accounts as Array<{ name: string; hubspot_company_id: string | null }>) {
    if (a.hubspot_company_id) byCompanyId.set(String(a.hubspot_company_id), [...(byCompanyId.get(String(a.hubspot_company_id)) ?? []), a.name]);
    const k = normalizeCompanyName(a.name);
    if (k) byName.set(k, [...(byName.get(k) ?? []), a.name]);
  }
  const byDomain = new Map<string, Set<string>>();
  const add = (d: string | null, name: string) => {
    if (d) (byDomain.get(d) ?? byDomain.set(d, new Set()).get(d)!).add(name);
  };
  for (const l of links as Array<{ account_name: string; canonical_company_id: string }>) add(companyDomain(String(l.canonical_company_id).slice('domain:'.length)), l.account_name);
  const byContact = new Map<string, Set<string>>();
  for (const p of people as Array<{ account_name: string; email: string | null; hubspot_contact_id: string | null }>) {
    add(emailDomain(p.email), p.account_name);
    const k = p.hubspot_contact_id ? String(p.hubspot_contact_id) : null;
    if (k) (byContact.get(k) ?? byContact.set(k, new Set()).get(k)!).add(p.account_name);
  }

  // Each open deal to the GAP accounts it belongs to.
  const ownersOf = (d: { id: string }, extra: Array<{ id: string; name: string | null; domain: string | null }> = []) => {
    const owners = new Set<string>();
    for (const c of [...(dealCompanies.get(d.id) ?? []).map((cid) => companyById.get(cid) ?? { id: cid, name: null, domain: null }), ...extra]) {
      for (const n of byCompanyId.get(c.id) ?? []) owners.add(n);
      const dom = companyDomain(c.domain);
      if (dom) for (const n of byDomain.get(dom) ?? []) owners.add(n);
      const key = normalizeCompanyName(c.name ?? '');
      if (key) for (const n of byName.get(key) ?? []) owners.add(n);
    }
    for (const k of dealContacts.get(d.id) ?? []) for (const n of byContact.get(k) ?? []) owners.add(n);
    return owners;
  };
  // As the resolver reads one account: HubSpot's own duplicates of a company (same exact name, another domain)
  // are the same company. Looked up only for deals the first pass could not map, so the call count stays small.
  const firstPass = new Map(deals.map((d) => [d.id, ownersOf(d)]));
  const orphanNames = [...new Set(deals.filter((d) => firstPass.get(d.id)!.size === 0).flatMap((d) => (dealCompanies.get(d.id) ?? []).map((cid) => companyById.get(cid)?.name ?? '').filter(Boolean)))];
  let duplicates: Array<{ id: string; name: string | null; domain: string | null }> = [];
  if (orphanNames.length) {
    try {
      duplicates = await reads.companiesByNames(orphanNames);
    } catch (e) {
      return unavailable(now, `duplicate company read: ${e instanceof Error ? e.message : String(e)}`, deals.length);
    }
    const dupDomains = [...new Set(duplicates.map((c) => companyDomain(c.domain)).filter((d): d is string => !!d && !byDomain.has(d)))];
    if (dupDomains.length) {
      const [moreLinks, morePeople] = await Promise.all([
        prisma.canonicalAccountLink.findMany({ where: { canonical_company_id: { in: dupDomains.map((d) => `domain:${d}`) } }, select: { account_name: true, canonical_company_id: true } }),
        prisma.persona.findMany({ where: { OR: dupDomains.map((d) => ({ email: { endsWith: `@${d}`, mode: 'insensitive' } })) }, select: { account_name: true, email: true, hubspot_contact_id: true } }),
      ]);
      for (const l of moreLinks as Array<{ account_name: string; canonical_company_id: string }>) add(companyDomain(String(l.canonical_company_id).slice('domain:'.length)), l.account_name);
      for (const p of morePeople as Array<{ account_name: string; email: string | null }>) add(emailDomain(p.email), p.account_name);
    }
  }
  const accountDeals = new Map<string, Set<string>>();
  const unresolved: UnresolvedDeal[] = [];
  for (const d of deals) {
    let owners = firstPass.get(d.id)!;
    if (owners.size === 0) {
      const names = new Set((dealCompanies.get(d.id) ?? []).map((cid) => companyById.get(cid)?.name).filter(Boolean));
      owners = ownersOf(d, duplicates.filter((c) => c.name && names.has(c.name)));
    }
    if (owners.size === 0) {
      unresolved.push({ dealName: d.properties.dealname ?? null, stage: stageLabel(d.properties.dealstage), companies: (dealCompanies.get(d.id) ?? []).map((cid) => companyById.get(cid)?.name ?? 'a HubSpot company with no name') });
      continue;
    }
    for (const n of owners) (accountDeals.get(n) ?? accountDeals.set(n, new Set()).get(n)!).add(d.id);
  }

  // GAP records on exactly the same deals are one company recorded twice: one row (shortest name first).
  const groups = new Map<string, string[]>();
  for (const [name, ids] of accountDeals) {
    const key = [...ids].sort().join('|');
    groups.set(key, [...(groups.get(key) ?? []), name]);
  }
  const rows = [...groups.entries()].map(([key, names]) => {
    const dealIds = key.split('|');
    const companyKeys = new Set(dealIds.flatMap((id) => (dealCompanies.get(id) ?? []).map((cid) => normalizeCompanyName(companyById.get(cid)?.name ?? ''))).filter(Boolean));
    const matches = (n: string) => (companyKeys.has(normalizeCompanyName(n)) ? 0 : 1);
    const sorted = [...names].sort((a, b) => matches(a) - matches(b) || a.length - b.length || a.localeCompare(b));
    return { primary: sorted[0], also: sorted.slice(1), dealIds };
  });
  const dealById = new Map(deals.map((d) => [d.id, d]));
  const allNames = rows.flatMap((r) => [r.primary, ...r.also]);
  const [persons, bids] = await Promise.all([
    prisma.persona.findMany({ where: { account_name: { in: allNames } }, select: { account_name: true, name: true, title: true }, orderBy: { id: 'asc' } }).catch(() => []),
    prisma.buyerInputData.findMany({ where: { account_name: { in: allNames } }, select: { ...BRIEF_BID_SELECT, account_name: true } }).catch(() => []),
  ]);
  const inDeals: InDealAccount[] = rows
    .map((r) => {
      const names = [r.primary, ...r.also];
      return {
        accountName: r.primary,
        alsoRecordedAs: r.also,
        deals: r.dealIds.map((id) => dealById.get(id)!).map((d) => ({ id: d.id, name: d.properties.dealname ?? null, stage: stageLabel(d.properties.dealstage), lastActivityAt: lastActivity(d.properties), closeDate: d.properties.closedate ? String(d.properties.closedate) : null, nextStep: d.properties.hs_next_step ? String(d.properties.hs_next_step) : null, contactIds: (dealContacts.get(d.id) ?? []).map(String) })),
        dealContacts: new Set(r.dealIds.flatMap((id) => dealContacts.get(id) ?? [])).size,
        people: (persons as Array<{ account_name: string; name: string; title: string | null }>).filter((p) => names.includes(p.account_name)).map((p) => ({ name: p.name, title: p.title ?? null })),
        known: knownSectionsOf((bids as Array<BriefBidRow & { account_name: string }>).filter((b) => names.includes(b.account_name))),
      };
    })
    .sort((a, b) => a.accountName.localeCompare(b.accountName));
  return { status: 'complete', count: inDeals.length, accounts: inDeals, unresolved, checkedAt: now.toISOString(), openDeals: deals.length };
}

/**
 * The ONE In Deals answer for the cockpit tile and the lane. A summary younger than IN_DEALS_CACHE_MS (a failed
 * one, IN_DEALS_FAILURE_CACHE_MS) is reused with its own timestamp; `fresh` reads HubSpot now.
 */
export async function loadInDealsSummary(prisma: PrismaLike, deps: { reads?: OpenDealReadsLike; now?: Date; fresh?: boolean } = {}): Promise<InDealsSummary> {
  const now = deps.now ?? new Date();
  if (!deps.fresh) {
    try {
      const row = await prisma.systemConfig.findUnique({ where: { key: CACHE_KEY } });
      const cached = row?.value ? (JSON.parse(String(row.value)) as InDealsSummary) : null;
      const age = cached ? now.getTime() - new Date(cached.checkedAt).getTime() : Infinity;
      if (cached && age >= 0 && age < (cached.status === 'complete' ? IN_DEALS_CACHE_MS : IN_DEALS_FAILURE_CACHE_MS)) return cached;
    } catch {
      // an unreadable cache is a cache miss
    }
  }
  const configured = !!deps.reads || !!process.env.HUBSPOT_ACCESS_TOKEN?.trim();
  const reads = deps.reads ?? (configured ? (await import('../opportunity/hubspot-reads')).hubspotOpenDealReads : null);
  const summary = reads ? await buildSummary(prisma, reads, now) : unavailable(now, 'HubSpot is not configured');
  try {
    const value = JSON.stringify(summary);
    await prisma.systemConfig.upsert({ where: { key: CACHE_KEY }, create: { key: CACHE_KEY, value }, update: { value } });
  } catch {
    // the summary stands without the cache
  }
  return summary;
}
