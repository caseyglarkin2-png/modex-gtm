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
  hubspotByDomain: (domain: string) => Promise<{ id: string; name?: string | null } | null>;
  hubspotByName: (name: string) => Promise<{ id: string; name?: string | null } | null>;
}

const defaultHubspot: HubspotLookup = {
  hubspotByDomain: async (d) => (await import('@/lib/hubspot/companies')).searchCompanyByDomain(d).catch(() => null),
  hubspotByName: async (n) => (await import('@/lib/hubspot/companies')).searchCompanyByName(n).catch(() => null),
};

const cleanDomain = (d: string | null | undefined) => (d ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') || null;

export type CreationCheck =
  | { ok: true; hubspotCompanyId: string | null; notes: string[] }
  | { ok: false; reason: 'name_required' | 'exists' | 'possible_duplicate' | 'alias_of' | 'domain_of'; matches: string[] };

/** Everything that must be true before an account may exist. Read-only. */
export async function accountCreationCheck(prisma: PrismaLike, input: { name: string; domain?: string | null }, deps: HubspotLookup = defaultHubspot): Promise<CreationCheck> {
  const name = input.name?.trim();
  if (!name) return { ok: false, reason: 'name_required', matches: [] };
  if (await prisma.account.findUnique({ where: { name } })) return { ok: false, reason: 'exists', matches: [name] };
  const key = normalizeCompanyName(name);
  // Accents are folded before comparing, so the prefix read uses the plain first letters too.
  const stem = key.slice(0, 3);
  const near: Array<{ name: string }> = await prisma.account.findMany({ where: { OR: [{ name: { startsWith: stem, mode: 'insensitive' } }, { name: { startsWith: `the ${stem}`, mode: 'insensitive' } }] }, select: { name: true } });
  const siblings = near.map((a) => a.name).filter((n) => normalizeCompanyName(n) === key);
  if (siblings.length) return { ok: false, reason: 'possible_duplicate', matches: siblings };
  const alias =
    (await prisma.gapAccountAlias.findUnique({ where: { normalized_alias: key } })) ??
    (legacyNormalizeCompanyName(name) !== key ? await prisma.gapAccountAlias.findUnique({ where: { normalized_alias: legacyNormalizeCompanyName(name) } }) : null);
  if (alias) return { ok: false, reason: 'alias_of', matches: [alias.account_name] };
  const domain = cleanDomain(input.domain);
  if (domain) {
    const owners: Array<{ account_links?: Array<{ account_name: string }> }> = await prisma.canonicalCompany.findMany({ where: { domain }, select: { domain: true, account_links: { select: { account_name: true } } } }).catch(() => []);
    const names = [...new Set(owners.flatMap((o) => (o.account_links ?? []).map((l) => l.account_name)))];
    if (names.length) return { ok: false, reason: 'domain_of', matches: names };
  }
  const notes: string[] = [];
  const hs = (domain ? await deps.hubspotByDomain(domain).catch(() => null) : null) ?? (await deps.hubspotByName(name).catch(() => null));
  if (hs) notes.push(`HubSpot already has this company (${hs.id}${hs.name ? `, ${hs.name}` : ''}): it will be linked, not created.`);
  else notes.push('No HubSpot company found by domain or name.');
  return { ok: true, hubspotCompanyId: hs?.id ?? null, notes };
}

async function upsertCandidate(prisma: PrismaLike, company: string, actor: string, data: Record<string, unknown>) {
  const company_key = normalizeCompanyName(company);
  return prisma.gapAccountCandidate.upsert({ where: { company_key }, create: { company: company.trim(), company_key, created_by: actor, ...data }, update: data });
}

/** Scout one company and keep what it found on its one candidate row. Spends one web pass at most. */
export async function scoutCandidate(prisma: PrismaLike, input: { company: string; actor: string; now: Date; hint?: string }, deps: { scout?: (company: string, opts: { hint?: string }) => Promise<ScoutResult> } = {}): Promise<ScoutResult> {
  const scout = deps.scout ?? ((c: string, o: { hint?: string }) => scoutCompany(c, { hint: o.hint }));
  const r = await scout(input.company.trim(), { hint: input.hint });
  await upsertCandidate(prisma, input.company, input.actor, { verdict: r.verdict, entity_type: r.entityType, domain: r.domain, scout: r as unknown as object, scouted_at: input.now });
  await prisma.gapAuditEvent.create({ data: { kind: 'entity.scouted', actor: input.actor, subject_type: 'account_candidate', subject_id: normalizeCompanyName(input.company), payload: { company: input.company, verdict: r.verdict, entityType: r.entityType, basis: r.basis } } });
  return r;
}

/** RESEARCH MORE or IGNORE. ADD and MAP go through their own contracts. */
export async function decideCandidate(prisma: PrismaLike, input: { company: string; decision: 'research_more' | 'ignored' | 'open'; actor: string; now: Date }): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!['research_more', 'ignored', 'open'].includes(input.decision)) return { ok: false, reason: 'invalid_decision' };
  if (!input.company?.trim()) return { ok: false, reason: 'company_required' };
  await upsertCandidate(prisma, input.company, input.actor, input.decision === 'open' ? { decision: 'open', decided_by: null, decided_at: null } : { decision: input.decision, decided_by: input.actor, decided_at: input.now });
  await prisma.gapAuditEvent.create({ data: { kind: `entity.${input.decision}`, actor: input.actor, subject_type: 'account_candidate', subject_id: normalizeCompanyName(input.company), payload: { company: input.company } } });
  return { ok: true };
}

/**
 * THE ONE ACCOUNT CREATION CONTRACT. Casey's explicit click, with a reason; the check runs first and a
 * possible duplicate refuses. Creates one account in the watched band (C), links an existing HubSpot company
 * (read, never written), records the company spelling as a curated alias, marks the candidate added, audits.
 */
export async function createGapAccount(
  prisma: PrismaLike,
  input: { name: string; company?: string | null; vertical: string; reason: string; domain?: string | null; actor: string; now: Date },
  deps: HubspotLookup = defaultHubspot,
): Promise<{ ok: true; accountName: string; hubspotCompanyId: string | null; notes: string[] } | { ok: false; reason: string; matches?: string[] }> {
  if (!input.actor?.trim()) return { ok: false, reason: 'actor_required' };
  if (!input.reason?.trim()) return { ok: false, reason: 'reason_required' };
  if (!input.vertical?.trim()) return { ok: false, reason: 'vertical_required' };
  const check = await accountCreationCheck(prisma, { name: input.name, domain: input.domain }, deps);
  if (!check.ok) return { ok: false, reason: check.reason, matches: check.matches };
  const name = input.name.trim();
  await prisma.account.create({
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
  const company = input.company?.trim();
  if (company && normalizeCompanyName(company) !== normalizeCompanyName(name)) {
    const { registerAlias } = await import('../identity/service');
    await registerAlias(prisma, { alias: company, accountName: name, source: 'manual', createdBy: input.actor });
  }
  await upsertCandidate(prisma, company || name, input.actor, { decision: 'added', account_name: name, decided_by: input.actor, decided_at: input.now, ...(cleanDomain(input.domain) ? { domain: cleanDomain(input.domain) } : {}) });
  await prisma.gapAuditEvent.create({ data: { kind: 'entity.account_created', actor: input.actor, subject_type: 'account', subject_id: name, payload: { company: company ?? name, reason: input.reason.trim(), vertical: input.vertical.trim(), hubspotCompanyId: check.hubspotCompanyId } } });
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

export interface QueueItem {
  company: string;
  companyKey: string;
  people: number;
  titles: string[];
  sources: string[];
  sourceIds: string[];
  relationship: string[];
  verdict: string | null;
  entityType: string | null;
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

const ORDER: Record<string, number> = { LIKELY_ICP: 0, MAYBE_ICP: 1, AMBIGUOUS: 2, '': 3, INSUFFICIENT: 4, NOT_ICP: 5 };

/**
 * Companies GAP met in work sources but could not place, one row per company however it was spelled, with
 * what Scout found. Decided companies (added, mapped, ignored) drop out unless asked for. No score: the order
 * is the verdict, then how many people GAP met there.
 */
export async function loadCandidateQueue(prisma: PrismaLike, opts: { workSourceId?: string; includeDecided?: boolean; limit?: number } = {}): Promise<QueueItem[]> {
  const { cleanCompanyName } = await import('../intake/parse');
  const { classifyByName } = await import('./scout');
  const rows: Array<{ company: string | null; title: string | null; relationship_context: string | null; work_source: { id: string; name: string } | null }> = await prisma.gapWorkSourceMember.findMany({
    where: { ...(opts.workSourceId ? { work_source_id: opts.workSourceId } : {}), status: { not: 'ignored' }, resolution: { in: ['unresolved', 'ambiguous'] }, company: { not: null } },
    select: { company: true, title: true, relationship_context: true, work_source: { select: { id: true, name: true } } },
    take: 10_000,
  });
  const by = new Map<string, QueueItem>();
  for (const r of rows) {
    const company = cleanCompanyName(r.company!);
    const key = normalizeCompanyName(company);
    if (!key) continue;
    const cur = by.get(key) ?? { company, companyKey: key, people: 0, titles: [], sources: [], sourceIds: [], relationship: [], verdict: null, entityType: null, scouted: false, scoutedAt: null, domain: null, what: null, why: null, network: [], freight: [], unknowns: [], decision: 'open' as CandidateDecision };
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
    const rule = classifyByName(item.company);
    if (rule.verdict === 'NOT_ICP') Object.assign(item, { verdict: 'NOT_ICP', entityType: rule.entityType, why: rule.why });
  }
  const out = [...by.values()]
    .filter((i) => opts.includeDecided || i.decision === 'open' || i.decision === 'research_more')
    .sort((a, b) => ORDER[a.verdict ?? ''] - ORDER[b.verdict ?? ''] || b.people - a.people || a.company.localeCompare(b.company));
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
    where: { resolution: { in: ['unresolved', 'ambiguous'] }, company: { not: null }, status: { not: 'ignored' } },
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
