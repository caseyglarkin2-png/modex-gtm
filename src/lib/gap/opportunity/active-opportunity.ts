/**
 * ACTIVE OPPORTUNITY TRUTH (final Monday blocker, 2026-09-27).
 *
 * The ONE resolver GAP uses to answer "does this account already have a live
 * sales opportunity?". HubSpot is authoritative. Routing (R3b/R3c) and every
 * action-time gate (Gmail draft, direct send, enroll) read it; nothing in GAP
 * reads `accounts.pipeline_stage` for this any more.
 *
 * The defect it replaces: the guard read local `accounts.pipeline_stage`,
 * which modex derives from ordinary outreach and never syncs from HubSpot deal
 * stages (production: 1660 targeted / 27 contacted / 21 engaged, zero
 * `meeting`/`proposal`), so every account read as "no opportunity" while
 * HubSpot held sixteen open deals.
 *
 * Answer, three-valued:
 *   ACTIVE   at least one OPEN deal (`hs_is_closed` = false) is associated with
 *            the account's HubSpot company, or with a HubSpot contact GAP holds
 *            for someone at the account. Account level: the recipient does not
 *            have to be on the deal.
 *   CLEAR    the company identity was determined and every associated deal
 *            read back closed (or there are none).
 *   UNKNOWN  anything else: HubSpot unconfigured, a read failed or timed out,
 *            a malformed response, or no HubSpot company could be determined.
 *            UNKNOWN never permits a draft or a send (fail closed).
 *
 * Company identity, deterministic and conservative (a union, never a guess):
 *   - `accounts.hubspot_company_id` when set (HubSpot must still have it);
 *   - HubSpot companies whose `domain` is canonically (canonicalDomain: case,
 *     scheme, path, `www.`, trailing dot) the account's verified canonical
 *     domain (`canonical_account_links` -> `domain:<d>`), or the email domain
 *     of any person GAP holds at the account (consumer mail excluded);
 *   - HubSpot's own duplicates of those companies: every company whose name
 *     is exactly the name of one found above. The portal carries duplicate
 *     company records (two "Lazerspot" rows, on lazerspot.com and
 *     lazerlogistics.com, with the open deal on the other one), and a deal on
 *     either is the same account's opportunity.
 * Every company in the union is checked; any open deal on any of them is
 * ACTIVE. An empty union is UNKNOWN (identity_unresolved), never CLEAR. The
 * union can only over-protect (block a first touch), never under-protect.
 *
 * Open/closed comes from HubSpot's own `hs_is_closed`, never a hardcoded stage
 * list (the portal already has a custom open stage outside the default ids).
 */

import { FREEMAIL_DOMAINS, OWN_DOMAINS } from '../replies/domains';
import { classifyReply } from '../replies/classify';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type OpportunityStatus = 'CLEAR' | 'ACTIVE' | 'UNKNOWN';

export type OpportunityUnknownReason =
  | 'hubspot_unconfigured'
  | 'hubspot_error'
  | 'timeout'
  | 'identity_unresolved'
  | 'identity_ambiguous'
  | 'malformed_response';

export interface OpenDeal {
  id: string;
  name: string | null;
  stage: string | null;
  pipeline: string | null;
  /** The account's companies this deal is associated with (of those checked). */
  companyIds: string[];
  /** HubSpot contacts on the deal, where HubSpot returned them. */
  contactIds: string[];
  /** Phase 2 F1: last activity (notes_last_updated, else hs_lastmodifieddate), when HubSpot returned one. Display only. */
  lastActivityAt?: string | null;
  /** V2 (display only): what HubSpot holds for the deal's amount, close date and next step. */
  amount?: string | null;
  closeDate?: string | null;
  nextStep?: string | null;
}

/** R55: a deal HubSpot marks closed, and how it ended (`hs_is_closed_won`; null when HubSpot did not say). */
export interface ClosedDeal {
  id: string;
  name: string | null;
  stage: string | null;
  won: boolean | null;
  /** HubSpot's close date, when it holds one. */
  closedAt: string | null;
}

/**
 * R55: what a closed deal means for prospecting, when no deal is open:
 *   customer   a deal closed WON: no first-touch campaign, ever automatically; post-sale expansion is the seller's
 *              explicit call, worked with the customer
 *   parked     the newest deal closed LOST (or ended with no outcome) and nothing material has changed since (no
 *              newer verified fact, no buyer reply after it): no cold outreach until something does
 */
export interface Closure {
  kind: 'customer' | 'parked';
  deal: ClosedDeal;
  why: string;
}

export type OpportunityTruth =
  | { status: 'CLEAR'; companyIds: string[]; closed?: ClosedDeal[]; closure?: Closure | null }
  | { status: 'ACTIVE'; companyIds: string[]; deals: OpenDeal[]; closed?: ClosedDeal[] }
  | { status: 'UNKNOWN'; reason: OpportunityUnknownReason; detail?: string };

const closedDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : 'a date HubSpot does not hold');

/**
 * R55, pure: the closure a CLEAR account carries. A won deal makes a customer (whatever else lost); otherwise the newest
 * closed deal parks the account unless something material changed after it closed (`materialChangeAt`: the newest
 * verified fact or human buyer reply after the close). An open deal is never a closure (it is ACTIVE).
 */
export function closureOf(closed: readonly ClosedDeal[], materialChangeAt: string | null): Closure | null {
  if (closed.length === 0) return null;
  const won = closed.filter((d) => d.won === true).sort((a, b) => String(b.closedAt ?? '').localeCompare(String(a.closedAt ?? '')))[0];
  if (won) return { kind: 'customer', deal: won, why: `A customer: "${won.name ?? `deal ${won.id}`}" closed won on ${closedDay(won.closedAt)}. No first-touch campaign here; any expansion is your explicit call, worked with the customer, never a cold sequence.` };
  const newest = [...closed].sort((a, b) => String(b.closedAt ?? '').localeCompare(String(a.closedAt ?? '')))[0];
  if (materialChangeAt && newest.closedAt && materialChangeAt > newest.closedAt) return null;
  return { kind: 'parked', deal: newest, why: `Parked: "${newest.name ?? `deal ${newest.id}`}" closed ${newest.won === false ? 'lost' : 'without an outcome'} on ${closedDay(newest.closedAt)}, and nothing material has changed since (a newer verified fact or a buyer reply would). No cold outreach until then.` };
}

/** What the resolver needs to know about the account, loaded from modex (loadOpportunityIdentity). */
export interface OpportunityIdentity {
  accountName: string;
  hubspotCompanyId: string | null;
  /** Normalized company domains (verified canonical domain + people's email domains). */
  domains: string[];
  /** HubSpot contact ids of people GAP holds at the account (and the recipient). */
  contactIds: string[];
}

/** The HubSpot READS the resolver needs. Every method throws on failure; the resolver maps a throw to UNKNOWN. */
export interface CompanyRef {
  id: string;
  name: string | null;
}

export interface OpportunityReads {
  /** Companies whose `domain` property equals one of `domains`. `truncated` when more matched than were returned. */
  companiesByDomains(domains: string[]): Promise<{ companies: CompanyRef[]; truncated: boolean }>;
  /** Companies whose `name` property equals one of `names` exactly. */
  companiesByNames(names: string[]): Promise<{ companies: CompanyRef[]; truncated: boolean }>;
  /** The companies HubSpot has, by id; `missing` lists ids it does not (merged or deleted). */
  companiesById(ids: string[]): Promise<{ companies: CompanyRef[]; missing: string[] }>;
  /** Associated ids from each input object. `truncated` when any input had more pages than were read. */
  associations(
    fromType: 'companies' | 'contacts' | 'deals',
    toType: 'deals' | 'contacts',
    ids: string[],
  ): Promise<{ byId: Map<string, string[]>; truncated: boolean }>;
  /** Deals with `dealname`, `dealstage`, `pipeline`, `hs_is_closed`. */
  readDeals(ids: string[]): Promise<Array<{ id: string; properties: Record<string, string | null | undefined> }>>;
}

/** More distinct company domains than this is not one company: UNKNOWN (identity_ambiguous). */
export const MAX_IDENTITY_DOMAINS = 10;
/** More matched companies than this is not one account: UNKNOWN (identity_ambiguous). */
export const MAX_IDENTITY_COMPANIES = 25;

const unknown = (reason: OpportunityUnknownReason, detail?: string): OpportunityTruth => ({ status: 'UNKNOWN', reason, ...(detail ? { detail } : {}) });

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 200);

/**
 * The ONE hostname canonicalizer for company-domain comparison (last mile,
 * 2026-09-27: HubSpot stores some companies as `www.example.com`). Lowercase,
 * trim, drop a scheme, user info, port, path, query and fragment, one leading
 * `www.` and a trailing dot. Exact host otherwise: `sub.example.com`,
 * `example.co` and `example-logistics.com` stay distinct (no fuzzy matching).
 * Null for anything that is not a dotted hostname.
 */
export function canonicalDomain(raw: string | null | undefined): string | null {
  const d = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/^[^@]*@/, '')
    .replace(/:\d*$/, '')
    .replace(/\.$/, '')
    .replace(/^www\./, '');
  if (!d || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) return null;
  return d;
}

/** Canonical company domain, or null for consumer mail, our own domains and junk. */
export function companyDomain(raw: string | null | undefined): string | null {
  const d = canonicalDomain(raw);
  if (!d || FREEMAIL_DOMAINS.has(d) || OWN_DOMAINS.has(d)) return null;
  return d;
}

/**
 * The stored forms to ask HubSpot for (its search is exact on `domain`): the
 * bare and the `www.` form of each canonical domain. Nothing broader.
 */
export function hubspotDomainVariants(domains: string[]): string[] {
  const out = new Set<string>();
  for (const raw of domains) {
    const d = canonicalDomain(raw);
    if (!d) continue;
    out.add(d);
    out.add(`www.${d}`);
  }
  return [...out].sort();
}

export function emailDomain(email: string | null | undefined): string | null {
  const at = String(email ?? '').lastIndexOf('@');
  return at < 0 ? null : companyDomain(String(email).slice(at + 1));
}

/**
 * The canonical resolver. Pure over `reads`: no Prisma, no clock, no env.
 * Every throw, truncation or malformed field is UNKNOWN, never CLEAR.
 */
export async function resolveOpportunity(identity: OpportunityIdentity, reads: OpportunityReads): Promise<OpportunityTruth> {
  const resolved = await resolveCompanyIdentity(identity, reads);
  if (!resolved.ok) return resolved.truth;
  const companyIds = resolved.companyIds;
  return resolveDealsFor(identity, companyIds, reads);
}

/**
 * The account's HubSpot company identity: the union described above (company
 * id, verified and email domains, exact-name duplicates). Shared by the
 * opportunity resolver and the read-only deal observation (Phase 2 A2), so
 * there is ONE identity rule. UNKNOWN on anything it cannot determine.
 */
export async function resolveCompanyIdentity(
  identity: OpportunityIdentity,
  reads: OpportunityReads,
): Promise<{ ok: true; companyIds: string[] } | { ok: false; truth: OpportunityTruth }> {
  const fail = (t: OpportunityTruth) => ({ ok: false as const, truth: t });
  const domains = [...new Set(identity.domains.map(companyDomain).filter((d): d is string => !!d))].sort();
  if (domains.length > MAX_IDENTITY_DOMAINS) return fail(unknown('identity_ambiguous', `${domains.length} company domains at ${identity.accountName}`));

  const companies = new Map<string, string | null>();
  const hsId = String(identity.hubspotCompanyId ?? '').trim();
  if (hsId) {
    let known: { companies: CompanyRef[]; missing: string[] };
    try {
      known = await reads.companiesById([hsId]);
    } catch (e) {
      return fail(unknown('hubspot_error', `company read: ${errText(e)}`));
    }
    if (!known || !Array.isArray(known.companies) || !Array.isArray(known.missing)) return fail(unknown('malformed_response', 'company read'));
    // A company id HubSpot no longer has (merged or deleted) is not a determined identity.
    if (known.missing.length > 0 || !known.companies.some((c) => String(c.id) === hsId)) return fail(unknown('identity_unresolved', `HubSpot company ${hsId} not found`));
    for (const c of known.companies) companies.set(String(c.id), c.name ?? null);
  }
  if (domains.length > 0) {
    let hit: { companies: CompanyRef[]; truncated: boolean };
    try {
      hit = await reads.companiesByDomains(hubspotDomainVariants(domains));
    } catch (e) {
      return fail(unknown('hubspot_error', `company search: ${errText(e)}`));
    }
    if (!hit || !Array.isArray(hit.companies)) return fail(unknown('malformed_response', 'company search'));
    if (hit.truncated) return fail(unknown('identity_ambiguous', `more companies match ${domains.join(', ')} than one read returns`));
    for (const c of hit.companies) if (String(c.id).trim()) companies.set(String(c.id).trim(), c.name ?? null);
  }
  if (companies.size === 0) {
    return fail(unknown('identity_unresolved', `no HubSpot company for ${identity.accountName}${domains.length ? ` (${domains.join(', ')})` : ' (no company id or domain on file)'}`));
  }
  // HubSpot's own duplicate records of the same company (exact name).
  const names = [...new Set([...companies.values()].map((n) => String(n ?? '').trim()).filter(Boolean))].sort();
  if (names.length > 0) {
    let dup: { companies: CompanyRef[]; truncated: boolean };
    try {
      dup = await reads.companiesByNames(names);
    } catch (e) {
      return fail(unknown('hubspot_error', `company name search: ${errText(e)}`));
    }
    if (!dup || !Array.isArray(dup.companies)) return fail(unknown('malformed_response', 'company name search'));
    if (dup.truncated) return fail(unknown('identity_ambiguous', `more companies are named ${names.join(', ')} than one read returns`));
    for (const c of dup.companies) if (String(c.id).trim()) companies.set(String(c.id).trim(), c.name ?? null);
  }
  if (companies.size > MAX_IDENTITY_COMPANIES) return fail(unknown('identity_ambiguous', `${companies.size} HubSpot companies for ${identity.accountName}`));
  return { ok: true, companyIds: [...companies.keys()].sort() };
}

/** Deals on the resolved companies (required) and on the people GAP holds there (extra protection). */
/** Display-only last activity; absent when HubSpot returned no readable date (never affects ACTIVE). */
function lastActivityOf(p: Record<string, string | null | undefined>): { lastActivityAt?: string } {
  for (const raw of [p.notes_last_updated, p.hs_lastmodifieddate]) {
    const t = raw ? new Date(String(raw)).getTime() : NaN;
    if (Number.isFinite(t)) return { lastActivityAt: new Date(t).toISOString() };
  }
  return {};
}

async function resolveDealsFor(identity: OpportunityIdentity, companyIds: string[], reads: OpportunityReads): Promise<OpportunityTruth> {


  // Deals on the companies (required) and on the people GAP holds there (extra protection).
  const dealCompanies = new Map<string, Set<string>>();
  try {
    const a = await reads.associations('companies', 'deals', companyIds);
    if (!a || !(a.byId instanceof Map)) return unknown('malformed_response', 'company deal associations');
    if (a.truncated) return unknown('malformed_response', 'company deal associations were truncated');
    for (const [cid, deals] of a.byId) for (const d of deals) (dealCompanies.get(d) ?? dealCompanies.set(d, new Set()).get(d)!).add(cid);
  } catch (e) {
    return unknown('hubspot_error', `company deal associations: ${errText(e)}`);
  }
  const contactIds = [...new Set(identity.contactIds.map((c) => String(c ?? '').trim()).filter(Boolean))].sort();
  if (contactIds.length > 0) {
    try {
      const a = await reads.associations('contacts', 'deals', contactIds);
      if (!a || !(a.byId instanceof Map)) return unknown('malformed_response', 'contact deal associations');
      if (a.truncated) return unknown('malformed_response', 'contact deal associations were truncated');
      // A contact HubSpot no longer has carries no deals; the company leg above is the required identity.
      for (const deals of a.byId.values()) for (const d of deals) if (!dealCompanies.has(d)) dealCompanies.set(d, new Set());
    } catch (e) {
      return unknown('hubspot_error', `contact deal associations: ${errText(e)}`);
    }
  }

  const dealIds = [...dealCompanies.keys()].sort();
  if (dealIds.length === 0) return { status: 'CLEAR', companyIds };

  let rows: Array<{ id: string; properties: Record<string, string | null | undefined> }>;
  try {
    rows = await reads.readDeals(dealIds);
  } catch (e) {
    return unknown('hubspot_error', `deal read: ${errText(e)}`);
  }
  if (!Array.isArray(rows)) return unknown('malformed_response', 'deal read');
  const byId = new Map(rows.map((r) => [String(r?.id ?? ''), r]));
  const open: OpenDeal[] = [];
  const closedDeals: ClosedDeal[] = [];
  for (const id of dealIds) {
    const r = byId.get(id);
    if (!r || !r.properties) return unknown('malformed_response', `deal ${id} did not read back`);
    const closed = String(r.properties.hs_is_closed ?? '').trim().toLowerCase();
    if (closed !== 'true' && closed !== 'false') return unknown('malformed_response', `deal ${id} has no hs_is_closed`);
    if (closed === 'true') {
      // R55: how it ended, as HubSpot says (never inferred from a stage name).
      const wonRaw = String(r.properties.hs_is_closed_won ?? '').trim().toLowerCase();
      const at = r.properties.closedate ? new Date(String(r.properties.closedate)) : null;
      closedDeals.push({ id, name: r.properties.dealname ?? null, stage: r.properties.dealstage ?? null, won: wonRaw === 'true' ? true : wonRaw === 'false' ? false : null, closedAt: at && !Number.isNaN(at.getTime()) ? at.toISOString() : null });
      continue;
    }
    open.push({
      id,
      name: r.properties.dealname ?? null,
      stage: r.properties.dealstage ?? null,
      pipeline: r.properties.pipeline ?? null,
      companyIds: [...(dealCompanies.get(id) ?? [])].sort(),
      contactIds: [],
      ...lastActivityOf(r.properties),
      ...(r.properties.amount?.toString().trim() ? { amount: r.properties.amount.toString().trim() } : {}),
      ...(r.properties.closedate?.toString().trim() ? { closeDate: r.properties.closedate.toString().trim() } : {}),
      ...(r.properties.hs_next_step?.toString().trim() ? { nextStep: r.properties.hs_next_step.toString().trim() } : {}),
    });
  }
  if (open.length === 0) return { status: 'CLEAR', companyIds, ...(closedDeals.length ? { closed: closedDeals } : {}) };

  // Metadata only: who is on the open deals. A failure here never changes ACTIVE.
  try {
    const a = await reads.associations('deals', 'contacts', open.map((d) => d.id));
    for (const d of open) d.contactIds = [...new Set(a.byId.get(d.id) ?? [])].sort();
  } catch {
    // ACTIVE stands without the contact list.
  }
  return { status: 'ACTIVE', companyIds, deals: open, ...(closedDeals.length ? { closed: closedDeals } : {}) };
}

/**
 * R55: the newest material change at the account after `since` (a verified fact registered for it, or a reply a
 * PERSON wrote, never an automatic notice, a bounce or an opt-out), or null. Soft: an unreadable store is no change
 * (so a parked account stays parked: the conservative answer).
 */
export async function materialChangeSince(prisma: PrismaLike, accountName: string, since: string | null): Promise<string | null> {
  if (!since) return null;
  const after = new Date(since);
  const [fact, replies] = await Promise.all([
    typeof prisma?.prospectingSignal?.findFirst === 'function' ? prisma.prospectingSignal.findFirst({ where: { account_name: accountName, source_kind: 'evidence_record', observed_at: { gt: after } }, orderBy: { observed_at: 'desc' }, select: { observed_at: true } }).catch(() => null) : null,
    typeof prisma?.inboundMessage?.findMany === 'function' ? prisma.inboundMessage.findMany({ where: { thread: { account_name: accountName }, received_at: { gt: after } }, orderBy: { received_at: 'desc' }, take: 10, select: { received_at: true, snippet: true, subject: true, from_email: true } }).catch(() => []) : [],
  ]);
  const human = (replies as Array<{ received_at: Date; snippet: string | null; subject: string | null; from_email: string }>).find((r) => classifyReply({ snippet: r.snippet ?? '', subject: r.subject, from: r.from_email }).kind === 'human');
  const dates = [fact?.observed_at, human?.received_at].filter(Boolean).map((d) => new Date(d as Date).toISOString()).sort();
  return dates.pop() ?? null;
}

/**
 * Load the account's HubSpot identity from modex: the company id, the verified
 * canonical domain, and the people GAP holds there (their email domains and
 * HubSpot contact ids). `extra` adds the recipient, who may not be a Persona
 * row yet.
 */
export async function loadOpportunityIdentity(
  prisma: PrismaLike,
  accountName: string,
  extra: { email?: string | null; hubspotContactId?: string | null } = {},
): Promise<OpportunityIdentity> {
  const account: { hubspot_company_id: string | null } | null = await prisma.account.findUnique({
    where: { name: accountName },
    select: { hubspot_company_id: true },
  });
  const links: Array<{ canonical_company_id: string; status: string | null }> = await prisma.canonicalAccountLink.findMany({
    where: { account_name: accountName },
    select: { canonical_company_id: true, status: true },
  });
  const people: Array<{ email: string | null; hubspot_contact_id: string | null }> = await prisma.persona.findMany({
    where: { account_name: accountName },
    select: { email: true, hubspot_contact_id: true },
  });
  const domains = new Set<string>();
  // Phase 2 A4 (identity status audit, 2026-09-28): deliberately EVERY link
  // status, including `conflict`. The identity resolver (identity/service.ts)
  // matches only `resolved` links, because it answers "which account is this
  // company"; this answers "could this account have an open deal", where a
  // conflicting domain may only ADD companies to check. Filtering to resolved
  // here would drop PepsiCo's and Dannon's domains (both `conflict` in
  // production) and weaken active-opportunity protection. Pinned by
  // tests/unit/gap/identity-status.test.ts.
  for (const l of links) {
    const id = String(l.canonical_company_id ?? '');
    if (id.startsWith('domain:')) {
      const d = companyDomain(id.slice('domain:'.length));
      if (d) domains.add(d);
    }
  }
  for (const p of people) {
    const d = emailDomain(p.email);
    if (d) domains.add(d);
  }
  const extraDomain = emailDomain(extra.email);
  if (extraDomain) domains.add(extraDomain);
  const contactIds = new Set(people.map((p) => String(p.hubspot_contact_id ?? '').trim()).filter(Boolean));
  if (extra.hubspotContactId) contactIds.add(String(extra.hubspotContactId).trim());
  return {
    accountName,
    hubspotCompanyId: account?.hubspot_company_id ?? null,
    domains: [...domains].sort(),
    contactIds: [...contactIds].sort(),
  };
}

export interface ResolveForAccountDeps {
  reads?: OpportunityReads | null;
  /** Default: HUBSPOT_ACCESS_TOKEN present. */
  configured?: () => boolean;
  timeoutMs?: number;
}

/** Action time and routing both use this bound; a HubSpot that does not answer is UNKNOWN. */
export const OPPORTUNITY_TIMEOUT_MS = 15_000;

/** Load identity, resolve, bound the whole thing by a timeout. Never throws: every failure is UNKNOWN. */
export async function resolveAccountOpportunity(
  prisma: PrismaLike,
  accountName: string,
  extra: { email?: string | null; hubspotContactId?: string | null } = {},
  deps: ResolveForAccountDeps = {},
): Promise<OpportunityTruth> {
  const configured = deps.configured ?? (() => !!process.env.HUBSPOT_ACCESS_TOKEN);
  if (!configured()) return unknown('hubspot_unconfigured');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<OpportunityTruth>((resolve) => {
    timer = setTimeout(() => resolve(unknown('timeout', `HubSpot did not answer in ${deps.timeoutMs ?? OPPORTUNITY_TIMEOUT_MS}ms`)), deps.timeoutMs ?? OPPORTUNITY_TIMEOUT_MS);
  });
  const work = (async (): Promise<OpportunityTruth> => {
    try {
      const identity = await loadOpportunityIdentity(prisma, accountName, extra);
      const reads = deps.reads ?? (await import('./hubspot-reads')).hubspotOpportunityReads;
      const truth = await resolveOpportunity(identity, reads);
      // R55: with no open deal, a closed one says whether the account is a customer or parked (one place, so the
      // gates, routing, the brief and the pursuit state all read the same answer).
      if (truth.status === 'CLEAR' && truth.closed?.length) {
        const newest = [...truth.closed].sort((a, b) => String(b.closedAt ?? '').localeCompare(String(a.closedAt ?? '')))[0];
        const changed = truth.closed.some((d) => d.won === true) ? null : await materialChangeSince(prisma, accountName, newest.closedAt).catch(() => null);
        return { ...truth, closure: closureOf(truth.closed, changed) };
      }
      return truth;
    } catch (e) {
      return unknown('hubspot_error', errText(e));
    }
  })();
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** One plain line for the seller (no CRM ids beyond the deal name and stage). */
export function opportunitySentence(t: OpportunityTruth): string {
  if (t.status === 'ACTIVE') {
    const d = t.deals[0];
    const more = t.deals.length > 1 ? ` (and ${t.deals.length - 1} more open deal${t.deals.length > 2 ? 's' : ''})` : '';
    return `This account has an open HubSpot deal${d?.name ? `, "${d.name}"` : ''}${more}. Work it from the deal, not a cold first touch.`;
  }
  if (t.status === 'UNKNOWN') return OPPORTUNITY_UNKNOWN_COPY;
  return 'No open HubSpot deal at this account.';
}

export const OPPORTUNITY_UNKNOWN_COPY = "Can't verify whether this account already has an active opportunity. Check HubSpot before contacting them.";
