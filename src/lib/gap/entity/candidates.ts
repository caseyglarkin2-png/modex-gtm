/**
 * ENTITY EXPANSION B2: candidate accounts and the ONE account creation contract.
 *
 * A company GAP met in a work source but does not know is a CANDIDATE (one row per normalized company).
 * Casey decides, GAP never does:
 *   ADD ACCOUNT        createGapAccount: the exact name, the normalized name (siblings), curated aliases,
 *                      the domain and HubSpot are checked FIRST; a possible duplicate is refused with the
 *                      matches so Casey can map instead. HubSpot is read, never written.
 *   MAP TO EXISTING    mapCandidateToAccount: a curated alias (the same mechanism as the source page).
 *   RESEARCH MORE      recorded; Scout can run again.
 *   IGNORE             recorded; the company stops surfacing.
 */
import { legacyNormalizeCompanyName, normalizeCompanyName } from '../identity/normalize';
import { scoutCompany, type ScoutResult } from './scout';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type CandidateDecision = 'open' | 'added' | 'mapped' | 'research_more' | 'ignored';
export interface HubspotLookup {
  /** False when this environment cannot read HubSpot: the check then says "not checked", never "not found". */
  configured?: () => boolean;
  /** May throw: a failed read is reported as "could not be checked", never as "not found". */
  hubspotByDomain: (domain: string) => Promise<{ id: string; name?: string | null } | null>;
  hubspotByName: (name: string) => Promise<{ id: string; name?: string | null } | null>;
}

const defaultHubspot: HubspotLookup = {
  configured: () => !!process.env.HUBSPOT_ACCESS_TOKEN && process.env.HUBSPOT_SYNC_ENABLED !== 'false',
  hubspotByDomain: async (d) => (await import('@/lib/hubspot/companies')).searchCompanyByDomain(d),
  hubspotByName: async (n) => (await import('@/lib/hubspot/companies')).searchCompanyByName(n),
};

const cleanDomain = (d: string | null | undefined) => (d ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') || null;

export type RefusalReason = 'name_required' | 'exists' | 'possible_duplicate' | 'alias_of' | 'domain_of' | 'hubspot_of' | 'already_decided';
export type CreationCheck = { ok: true; hubspotCompanyId: string | null; notes: string[] } | { ok: false; reason: RefusalReason; matches: string[] };

/**
 * The GAP-side identity conflicts for a new account: the exact name, any account whose NORMALIZED name equals the
 * name's or the company spelling's (compared in memory, so accents, apostrophes, "&" and "The" never slip past a
 * prefix read), any alias under either key (stored key, legacy key, or the key recomputed today), a candidate
 * already added or mapped, and the domain. Pure reads; run again inside the create transaction.
 */
async function identityConflict(db: PrismaLike, input: { name: string; company?: string | null; domain?: string | null }): Promise<{ reason: RefusalReason; matches: string[] } | null> {
  const name = input.name.trim();
  if (await db.account.findUnique({ where: { name } })) return { reason: 'exists', matches: [name] };
  const spellings = [name, ...(input.company?.trim() ? [input.company.trim()] : [])];
  const keys = new Set(spellings.map(normalizeCompanyName));
  const legacy = new Set(spellings.map(legacyNormalizeCompanyName));
  const all: Array<{ name: string }> = await db.account.findMany({ select: { name: true } });
  const siblings = all.map((a) => a.name).filter((n) => keys.has(normalizeCompanyName(n)));
  if (siblings.length) return { reason: 'possible_duplicate', matches: siblings };
  const aliases: Array<{ alias: string; normalized_alias: string; account_name: string }> = await db.gapAccountAlias.findMany({ select: { alias: true, normalized_alias: true, account_name: true } });
  const aliasHit = aliases.filter((a) => keys.has(a.normalized_alias) || legacy.has(a.normalized_alias) || keys.has(normalizeCompanyName(a.alias)));
  if (aliasHit.length) return { reason: 'alias_of', matches: [...new Set(aliasHit.map((a) => a.account_name))] };
  for (const k of keys) {
    const c = await db.gapAccountCandidate.findUnique({ where: { company_key: k } });
    if (c && (c.decision === 'added' || c.decision === 'mapped') && c.account_name) return { reason: 'already_decided', matches: [c.account_name] };
  }
  const domain = cleanDomain(input.domain);
  if (domain) {
    const owners: Array<{ account_links?: Array<{ account_name: string }> }> = await db.canonicalCompany.findMany({ where: { domain }, select: { domain: true, account_links: { select: { account_name: true } } } }).catch(() => []);
    const names = [...new Set(owners.flatMap((o) => (o.account_links ?? []).map((l) => l.account_name)))];
    if (names.length) return { reason: 'domain_of', matches: names };
  }
  return null;
}

/** Everything that must be true before an account may exist. Read-only; HubSpot is read, never written. */
export async function accountCreationCheck(prisma: PrismaLike, input: { name: string; company?: string | null; domain?: string | null }, deps: HubspotLookup = defaultHubspot): Promise<CreationCheck> {
  const name = input.name?.trim();
  if (!name) return { ok: false, reason: 'name_required', matches: [] };
  const conflict = await identityConflict(prisma, { ...input, name });
  if (conflict) return { ok: false, ...conflict };
  const notes: string[] = [];
  let hs: { id: string; name?: string | null } | null = null;
  if (deps.configured && !deps.configured()) notes.push('HubSpot was not checked (not configured here).');
  else {
    try {
      const domain = cleanDomain(input.domain);
      hs = (domain ? await deps.hubspotByDomain(domain) : null) ?? (await deps.hubspotByName(name));
      if (!hs) notes.push('No HubSpot company found by domain or name.');
    } catch (e) {
      notes.push(`HubSpot could not be checked (${e instanceof Error ? e.message : 'error'}); nothing will be linked.`);
    }
  }
  if (hs) {
    // A HubSpot company already linked to a GAP account is itself a duplicate signal.
    const owner = await prisma.account.findFirst({ where: { hubspot_company_id: hs.id }, select: { name: true } });
    if (owner) return { ok: false, reason: 'hubspot_of', matches: [owner.name] };
    notes.push(`HubSpot already has this company (${hs.id}${hs.name ? `, ${hs.name}` : ''}): it will be linked, not created.`);
  }
  return { ok: true, hubspotCompanyId: hs?.id ?? null, notes };
}

async function upsertCandidate(prisma: PrismaLike, company: string, actor: string, data: Record<string, unknown>) {
  const company_key = normalizeCompanyName(company);
  return prisma.gapAccountCandidate.upsert({ where: { company_key }, create: { company: company.trim(), company_key, created_by: actor, ...data }, update: data });
}

const SCOUT_COOLDOWN_MS = 24 * 3_600_000;
const SCOUT_DAILY_CAP = 60;

/**
 * Scout one company and keep what it found on its one candidate row. One web pass at most, and never twice in a
 * day for the same company unless forced; at most SCOUT_DAILY_CAP passes that learned something a day across GAP
 * (cost control; a failed pass is neither stored nor counted).
 */
export async function scoutCandidate(
  prisma: PrismaLike,
  input: { company: string; actor: string; now: Date; hint?: string; force?: boolean },
  deps: { scout?: (company: string, opts: { hint?: string }) => Promise<ScoutResult> } = {},
): Promise<ScoutResult | { refused: 'recently_scouted' | 'daily_cap' | 'web_failed'; scoutedAt?: string; why?: string }> {
  const company_key = normalizeCompanyName(input.company);
  const prior = await prisma.gapAccountCandidate.findUnique({ where: { company_key } });
  if (!input.force && prior?.scouted_at && input.now.getTime() - new Date(prior.scouted_at).getTime() < SCOUT_COOLDOWN_MS) return { refused: 'recently_scouted', scoutedAt: new Date(prior.scouted_at).toISOString() };
  const today: number = prisma.gapAuditEvent.count ? await prisma.gapAuditEvent.count({ where: { kind: 'entity.scouted', created_at: { gte: new Date(input.now.getTime() - 86_400_000) }, payload: { path: ['ok'], equals: true } } }).catch(() => 0) : 0;
  if (today >= SCOUT_DAILY_CAP) return { refused: 'daily_cap' };
  const scout = deps.scout ?? ((c: string, o: { hint?: string }) => scoutCompany(c, { hint: o.hint }));
  const r = await scout(input.company.trim(), { hint: input.hint });
  // A failed web pass learned nothing: never stored as a verdict (it would block a retry for a day).
  if (r.failed) return { refused: 'web_failed', why: r.why };
  await upsertCandidate(prisma, input.company, input.actor, { verdict: r.verdict, entity_type: r.entityType, domain: r.domain, scout: r as unknown as object, scouted_at: input.now });
  await prisma.gapAuditEvent.create({ data: { kind: 'entity.scouted', actor: input.actor, subject_type: 'account_candidate', subject_id: company_key, payload: { company: input.company, verdict: r.verdict, entityType: r.entityType, basis: r.basis, ok: true } } });
  return r;
}

/** RESEARCH MORE or IGNORE. ADD and MAP go through their own contracts. */
export async function decideCandidate(prisma: PrismaLike, input: { company: string; decision: 'research_more' | 'ignored' | 'open'; actor: string; now: Date }): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!['research_more', 'ignored', 'open'].includes(input.decision)) return { ok: false, reason: 'invalid_decision' };
  if (!input.company?.trim()) return { ok: false, reason: 'company_required' };
  const prior = await prisma.gapAccountCandidate.findUnique({ where: { company_key: normalizeCompanyName(input.company) } });
  if (prior && (prior.decision === 'added' || prior.decision === 'mapped')) return { ok: false, reason: 'already_decided' };
  await upsertCandidate(prisma, input.company, input.actor, input.decision === 'open' ? { decision: 'open', decided_by: null, decided_at: null } : { decision: input.decision, decided_by: input.actor, decided_at: input.now });
  await prisma.gapAuditEvent.create({ data: { kind: `entity.${input.decision}`, actor: input.actor, subject_type: 'account_candidate', subject_id: normalizeCompanyName(input.company), payload: { company: input.company } } });
  return { ok: true };
}

class Refused extends Error {
  constructor(public readonly reason: string, public readonly matches: string[] = []) {
    super(reason);
  }
}

/**
 * THE ONE ACCOUNT CREATION CONTRACT. Casey's explicit click, with a reason. The check runs first (GAP identity,
 * then HubSpot, read only); then, inside ONE transaction holding an advisory lock on the normalized name, the GAP
 * identity check runs again, the account is created in the watched band (C), the company spelling is recorded as
 * a curated alias (a conflict rolls everything back), the candidate is marked added, and the add is audited.
 */
export async function createGapAccount(
  prisma: PrismaLike,
  input: { name: string; company?: string | null; vertical: string; reason: string; domain?: string | null; actor: string; now: Date },
  deps: HubspotLookup = defaultHubspot,
): Promise<{ ok: true; accountName: string; hubspotCompanyId: string | null; notes: string[] } | { ok: false; reason: string; matches?: string[] }> {
  if (!input.actor?.trim()) return { ok: false, reason: 'actor_required' };
  if (!input.reason?.trim()) return { ok: false, reason: 'reason_required' };
  if (!input.vertical?.trim()) return { ok: false, reason: 'vertical_required' };
  const check = await accountCreationCheck(prisma, { name: input.name, company: input.company, domain: input.domain }, deps);
  if (!check.ok) return { ok: false, reason: check.reason, matches: check.matches };
  const name = input.name.trim();
  const company = input.company?.trim() || null;
  const key = normalizeCompanyName(name);
  const inTx = async (tx: PrismaLike) => {
    if (typeof tx.$executeRaw === 'function') await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gap_account:${key}`}))`;
    const again = await identityConflict(tx, { name, company, domain: input.domain });
    if (again) throw new Refused(again.reason, again.matches);
    await tx.account.create({
      data: {
        rank: 999,
        name,
        vertical: input.vertical.trim(),
        why_now: null,
        priority_band: 'C',
        tier: 'Tier 3',
        owner: 'Casey',
        source: 'gap_candidate',
        notes: `Added from GAP by ${input.actor} on ${input.now.toISOString().slice(0, 10)}: ${input.reason.trim()}`,
        research_status: 'Not started',
        hubspot_company_id: check.hubspotCompanyId,
      },
    });
    if (company && normalizeCompanyName(company) !== key) {
      const { registerAlias } = await import('../identity/service');
      const a = await registerAlias(tx, { alias: company, accountName: name, source: 'manual', createdBy: input.actor });
      if (a.status === 'CONFLICT') throw new Refused('alias_of', [a.existingAccountName]);
    }
    await upsertCandidate(tx, company || name, input.actor, { decision: 'added', account_name: name, decided_by: input.actor, decided_at: input.now, ...(cleanDomain(input.domain) ? { domain: cleanDomain(input.domain) } : {}) });
    await tx.gapAuditEvent.create({ data: { kind: 'entity.account_created', actor: input.actor, subject_type: 'account', subject_id: name, payload: { company: company ?? name, reason: input.reason.trim(), vertical: input.vertical.trim(), hubspotCompanyId: check.hubspotCompanyId } } });
  };
  try {
    if (typeof prisma.$transaction === 'function') await prisma.$transaction(inTx, { timeout: 20_000 });
    else await inTx(prisma);
  } catch (e) {
    if (e instanceof Refused) return { ok: false, reason: e.reason, matches: e.matches };
    // A concurrent add of the same name (or HubSpot id) won the unique index.
    if ((e as { code?: string })?.code === 'P2002') return { ok: false, reason: 'exists', matches: [name] };
    throw e;
  }
  return { ok: true, accountName: name, hubspotCompanyId: check.hubspotCompanyId, notes: check.notes };
}

/** MAP TO EXISTING: the company is an account GAP already has (a curated alias). */
export async function mapCandidateToAccount(prisma: PrismaLike, input: { company: string; accountName: string; actor: string; now: Date }): Promise<{ ok: true; alias: string } | { ok: false; reason: string }> {
  const account = await prisma.account.findUnique({ where: { name: input.accountName } });
  if (!account) return { ok: false, reason: 'account_not_found' };
  const { registerAlias } = await import('../identity/service');
  const a = await registerAlias(prisma, { alias: input.company.trim(), accountName: account.name, source: 'manual', createdBy: input.actor });
  if (a.status === 'CONFLICT') return { ok: false, reason: `alias_conflict:${a.existingAccountName}` };
  await upsertCandidate(prisma, input.company, input.actor, { decision: 'mapped', account_name: account.name, decided_by: input.actor, decided_at: input.now });
  await prisma.gapAuditEvent.create({ data: { kind: 'entity.mapped', actor: input.actor, subject_type: 'account_candidate', subject_id: normalizeCompanyName(input.company), payload: { company: input.company, accountName: account.name, alias: a.status } } });
  return { ok: true, alias: a.status };
}

/** The resolution bases that mean "GAP does not know this company" (intake/resolve.ts resolveCompany). */
export const UNPLACED_BASES = ['company_not_in_gap', 'company_ambiguous'] as const;

export interface QueueItem {
  company: string;
  companyKey: string;
  people: number;
  titles: string[];
  sources: string[];
  sourceIds: string[];
  relationship: string[];
  /** The YardFlow fit (DIRECT_BUYER, POTENTIAL_DIRECT_BUYER, PARTNER, NOT_FIT, UNKNOWN); null until judged. */
  verdict: string | null;
  entityType: string | null;
  /** The name could be several companies (identity, separate from fit). */
  ambiguous: boolean;
  scouted: boolean;
  scoutedAt: string | null;
  domain: string | null;
  what: string | null;
  why: string | null;
  network: Array<{ claim: string; url: string }>;
  freight: Array<{ claim: string; url: string }>;
  unknowns: string[];
  decision: CandidateDecision;
}

// Direct buyers first, then the ones worth a check, partners, and the settled not-fits last. No score.
const ORDER: Record<string, number> = { DIRECT_BUYER: 0, POTENTIAL_DIRECT_BUYER: 1, UNKNOWN: 2, '': 3, PARTNER: 4, NOT_FIT: 5 };

/**
 * Companies GAP met in work sources but could not place, one row per company however it was spelled, with
 * what Scout found. Decided companies (added, mapped, ignored) drop out unless asked for. No score: the order
 * is the verdict, then how many people GAP met there.
 */
export async function loadCandidateQueue(prisma: PrismaLike, opts: { workSourceId?: string; includeDecided?: boolean; limit?: number } = {}): Promise<QueueItem[]> {
  const { cleanCompanyName } = await import('../intake/parse');
  const { classifyByName } = await import('./scout');
  const rows: Array<{ company: string | null; title: string | null; relationship_context: string | null; work_source: { id: string; name: string } | null }> = await prisma.gapWorkSourceMember.findMany({
    // Only companies GAP could not place: a known account with an ambiguous PERSON is not a new company, and a
    // person Casey already judged (casey_*) never pushes a company back into the queue.
    where: { ...(opts.workSourceId ? { work_source_id: opts.workSourceId } : {}), status: { not: 'ignored' }, resolution: { in: ['unresolved', 'ambiguous'] }, resolution_basis: { in: [...UNPLACED_BASES] }, company: { not: null } },
    select: { company: true, title: true, relationship_context: true, work_source: { select: { id: true, name: true } } },
    take: 10_000,
  });
  const by = new Map<string, QueueItem>();
  for (const r of rows) {
    const company = cleanCompanyName(r.company!);
    const key = normalizeCompanyName(company);
    if (!key) continue;
    const cur = by.get(key) ?? { company, companyKey: key, people: 0, titles: [], sources: [], sourceIds: [], relationship: [], verdict: null, entityType: null, ambiguous: false, scouted: false, scoutedAt: null, domain: null, what: null, why: null, network: [], freight: [], unknowns: [], decision: 'open' as CandidateDecision };
    cur.people += 1;
    if (r.title && cur.titles.length < 3 && !cur.titles.includes(r.title)) cur.titles.push(r.title);
    if (r.work_source && !cur.sourceIds.includes(r.work_source.id)) {
      cur.sourceIds.push(r.work_source.id);
      cur.sources.push(r.work_source.name);
    }
    if (r.relationship_context && !cur.relationship.includes(r.relationship_context)) cur.relationship.push(r.relationship_context);
    by.set(key, cur);
  }
  const keys = [...by.keys()];
  const cands: Array<Record<string, unknown>> = keys.length ? await prisma.gapAccountCandidate.findMany({ where: { company_key: { in: keys } } }) : [];
  for (const c of cands) {
    const item = by.get(c.company_key as string);
    if (!item) continue;
    const s = (c.scout ?? {}) as Partial<ScoutResult>;
    Object.assign(item, {
      verdict: (c.verdict as string) ?? null,
      ambiguous: !!s.ambiguous,
      entityType: (c.entity_type as string) ?? null,
      scouted: !!c.scouted_at,
      scoutedAt: c.scouted_at ? new Date(c.scouted_at as string).toISOString() : null,
      domain: (c.domain as string) ?? null,
      what: s.what ?? null,
      why: s.why ?? null,
      network: s.network ?? [],
      freight: s.freight ?? [],
      unknowns: s.unknowns ?? [],
      decision: (c.decision as CandidateDecision) ?? 'open',
    });
  }
  for (const item of by.values()) {
    if (item.scouted || item.verdict) continue;
    // A free name rule only settles the genuinely obvious; a logistics or carrier name is a type guess to check.
    const rule = classifyByName(item.company);
    Object.assign(item, rule.final ? { verdict: rule.verdict, entityType: rule.entityType, why: rule.why } : { entityType: rule.entityType, why: rule.entityType ? rule.why : null });
  }
  const out = [...by.values()]
    .filter((i) => opts.includeDecided || i.decision === 'open' || i.decision === 'research_more')
    .sort((a, b) => (ORDER[a.verdict ?? ''] ?? 3) - (ORDER[b.verdict ?? ''] ?? 3) || b.people - a.people || a.company.localeCompare(b.company));
  return out.slice(0, opts.limit ?? 100);
}

/**
 * After an add or a map, re-qualify the sources that met this company so their people are placed at the account
 * (bounded: at most three sources, one minute; the nightly planner catches the rest).
 */
export async function replanSourcesFor(
  prisma: PrismaLike,
  input: { company: string; actor: string; now: Date },
  deps: { plan?: (p: PrismaLike, i: { now: Date; actor: string; workSourceId: string; maxAccounts: number; timeBudgetMs: number }) => Promise<{ reresolved?: number; accounts?: number }> } = {},
): Promise<{ sources: number; reresolved: number }> {
  const { cleanCompanyName } = await import('../intake/parse');
  const key = normalizeCompanyName(cleanCompanyName(input.company));
  const rows: Array<{ work_source_id: string; company: string | null }> = await prisma.gapWorkSourceMember.findMany({
    // The planner re-resolves unresolved members only; an ambiguous one is Casey's call.
    where: { resolution: 'unresolved', resolution_basis: { in: [...UNPLACED_BASES] }, company: { not: null }, status: { not: 'ignored' } },
    select: { work_source_id: true, company: true },
    take: 10_000,
  });
  const ids = [...new Set(rows.filter((r) => normalizeCompanyName(cleanCompanyName(r.company!)) === key).map((r) => r.work_source_id))].slice(0, 3);
  const plan = deps.plan ?? (await import('../intake/plan')).planWorkSources;
  let reresolved = 0;
  for (const id of ids) {
    const r = await plan(prisma, { now: input.now, actor: input.actor, workSourceId: id, maxAccounts: 10, timeBudgetMs: 20_000 }).catch(() => ({ reresolved: 0 }));
    reresolved += r.reresolved ?? 0;
  }
  return { sources: ids.length, reresolved };
}
