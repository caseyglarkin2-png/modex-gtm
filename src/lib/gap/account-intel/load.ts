/**
 * ACCOUNT INTELLIGENCE: gather the inputs for ONE account from the canonical
 * stores (a live projection; nothing is copied). The HubSpot deal read is the
 * only remote call and runs only when `live` is asked for (the account page).
 */
import { normalizeCompanyName } from '../identity/normalize';
import { loadWatchProfilesCached } from '../signals/watch';
import { loadAccountConversations, loadAccountFirstTouches } from '../motion/load';
import { resolveAccountOpportunity, type OpportunityTruth } from '../opportunity/active-opportunity';
import { classifyContinuity } from '../research/continuity';
import { selectConfirmedBids } from '../bid/select';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { buildROIEngineInputs, computeROIModel } from '@/lib/microsites/roi';
import { buildAccountRoiModel } from '@/lib/demo/roi-model';
import { loadDemoPack } from '@/lib/demo/load-pack';
import { getFacilityFact } from '@/lib/research/facility-fact-registry';
import type { AccountMicrositeData, AccountROIModel } from '@/lib/microsites/schema';
import { buildAccountBrief, type AccountInputs, type AccountIntelligenceBrief, type FactInput, type PackInput } from './build';
import { accountSlug } from './href';

export { accountSlug };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;
/** A raw row from a narrow select (house glue). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;


/** Accounts whose names start like this name or slug (a narrowed read, never the whole table). */
async function namesStartingLike(prisma: PrismaLike, firstToken: string): Promise<string[]> {
  if (!firstToken) return [];
  const rows: Array<{ name: string }> = await prisma.account.findMany({ where: { name: { startsWith: firstToken, mode: 'insensitive' } }, select: { name: true }, orderBy: { name: 'asc' }, take: 500 });
  return rows.map((r) => r.name);
}

/**
 * Every account whose slug this is (the app-wide scheme has no slug column: resolve by name). More than one
 * means a collision ("P&G" and "P-G"): the page asks which, never picks.
 */
export async function accountNamesForSlug(prisma: PrismaLike, slug: string): Promise<string[]> {
  const first = slug.split('-')[0] ?? '';
  return (await namesStartingLike(prisma, first)).filter((n) => accountSlug(n) === slug);
}

export async function accountNameForSlug(prisma: PrismaLike, slug: string): Promise<string | null> {
  const names = await accountNamesForSlug(prisma, slug);
  return names.length === 1 ? names[0] : null;
}

function micrositeFor(name: string, aliases: string[]): AccountMicrositeData | null {
  const keys = new Set([name, ...aliases].map(normalizeCompanyName));
  return getAllAccountMicrositeData().find((m) => keys.has(normalizeCompanyName(m.accountName)) || (m.hubspotName && keys.has(normalizeCompanyName(m.hubspotName)))) ?? null;
}

function roiFrom(model: AccountROIModel | undefined): AccountInputs['roi'] {
  if (!model) return null;
  const c = computeROIModel(buildROIEngineInputs(model));
  const notes = (model.sourceNotes ?? []).map((n) => `${n.label}: ${n.detail} (${n.confidence})`);
  return {
    hardSavingsAnnual: Math.round(c.laborSavingsAnnual + c.detentionSavingsAnnual + c.paperSavingsAnnual),
    totalValueAnnual: Math.round(c.totalValueAnnual),
    facilities: c.totalFacilities,
    calculatorVersion: model.calculatorVersion ?? null,
    assumptions: notes.length ? notes : ['Shared engine defaults for this facility mix'],
  };
}

export async function loadAccountInputs(
  prisma: PrismaLike,
  accountName: string,
  now: Date,
  opts: { live?: boolean; deps?: { opportunity?: (p: PrismaLike, a: string) => Promise<OpportunityTruth> } } = {},
): Promise<AccountInputs | null> {
  const account = await prisma.account.findUnique({ where: { name: accountName }, select: { name: true, tier: true, priority_band: true, vertical: true, parent_brand: true, hubspot_company_id: true } });
  if (!account) return null;
  const [aliases, link, allNames, profiles, signalRows, factRows, lastRun, hyps, bidRows, personas, candidates, members] = await Promise.all([
    prisma.gapAccountAlias.findMany({ where: { account_name: accountName }, select: { alias: true } }).catch(() => []),
    prisma.canonicalAccountLink.findUnique({ where: { account_name: accountName }, select: { canonical_company_id: true, status: true } }).catch(() => null),
    namesStartingLike(prisma, accountName.trim().split(/[^A-Za-z0-9]/)[0] ?? ''),
    loadWatchProfilesCached(prisma).catch(() => []),
    prisma.gapSignal.findMany({ where: { account_name: accountName, resolution: 'resolved' }, select: { id: true, title: true, url: true, published_at: true, research_status: true }, orderBy: { created_at: 'desc' }, take: 15 }).catch(() => []),
    prisma.prospectingSignal.findMany({ where: { account_name: accountName, source_kind: 'evidence_record' }, select: { id: true, title: true, evidence_text: true, evidence_url: true, observed_at: true, freshness_expires_at: true, metadata: true }, orderBy: { observed_at: 'desc' }, take: 200 }),
    prisma.researchRun.findFirst({ where: { account_name: accountName, run_key: { startsWith: 'gap_research:' } }, orderBy: { created_at: 'desc' }, select: { created_at: true, provider_status: true } }).catch(() => null),
    prisma.prospectingHypothesis.findMany({
      where: { account_name: accountName, superseded_by: { is: null }, status: { in: ['draft', 'review_required', 'approved', 'active', 'confirmed', 'partially_confirmed'] } },
      select: { id: true, status: true, observation: true, problem_hypothesis: true, root_cause_hypotheses: true, impact_hypotheses: true, falsification_questions: true, what_a_no_means: true, signals: { where: { role: 'primary' }, select: { signal_id: true } } },
      orderBy: { updated_at: 'desc' },
      take: 10,
    }).catch(() => []),
    prisma.buyerInputData.findMany({ where: { account_name: accountName }, select: { id: true, type: true, normalized_summary: true, raw_buyer_language: true, contact_email: true, captured_at: true, human_confirmed: true, supersedes_id: true, confirmed_at: true, hypothesis_id: true } }).catch(() => []),
    prisma.persona.findMany({ where: { account_name: accountName }, select: { id: true, name: true, title: true, do_not_contact: true, email: true, email_status: true }, take: 60 }),
    prisma.accountContactCandidate.findMany({ where: { account_name: accountName, state: 'staged' }, select: { id: true, full_name: true, title: true, state: true }, take: 30 }).catch(() => []),
    prisma.gapWorkSourceMember?.findMany ? prisma.gapWorkSourceMember.findMany({ where: { account_name: accountName, status: { notIn: ['ignored', 'not_now'] } }, select: { name: true, kind: true, persona_id: true, relationship_context: true, work_source: { select: { name: true, source_type: true } } }, take: 30 }).catch(() => []) : [],
  ]);
  const aliasList = (aliases as Array<{ alias: string }>).map((a) => a.alias);
  const domains: string[] = [];
  if (link?.status === 'resolved') {
    const cc = await prisma.canonicalCompany.findUnique({ where: { id: link.canonical_company_id }, select: { domain: true } }).catch(() => null);
    if (cc?.domain) domains.push(cc.domain);
  }
  const key = normalizeCompanyName(accountName);
  const siblings = (allNames as string[]).filter((n) => n !== accountName && normalizeCompanyName(n) === key);
  const profile = (profiles as Array<{ accountName: string; reasons?: string[] }>).find((p) => p.accountName === accountName);

  // Verified research facts; a continuation row carries its chain (one fact per quote, newest clock).
  const byQuote = new Map<string, FactInput>();
  for (const r of factRows as Row[]) {
    const meta = (r.metadata ?? {}) as Row;
    if (meta.verified !== 'excerpt_found_at_source' || !r.evidence_text) continue;
    const k = meta.continuity?.kind;
    const f: FactInput = {
      id: r.id,
      quote: r.evidence_text,
      url: r.evidence_url ?? null,
      title: r.title ?? '',
      publishedAt: new Date(r.observed_at).toISOString(),
      expiresAt: r.freshness_expires_at ? new Date(r.freshness_expires_at).toISOString() : null,
      continuity: k === 'ended' ? 'ended' : k === 'ongoing_state' ? 'ongoing_state' : classifyContinuity(r.evidence_text),
      currentness: meta.continuity?.currentness?.publishedAt ? { url: meta.continuity.currentness.url ?? null, publishedAt: meta.continuity.currentness.publishedAt } : null,
    };
    const q = f.quote.trim().toLowerCase();
    const cur = byQuote.get(q);
    if (!cur || (f.expiresAt ?? '') > (cur.expiresAt ?? '')) byQuote.set(q, f);
  }

  // The shared selector speaks camelCase: map, then keep human-confirmed rows no later row supersedes.
  const confirmed: Row[] = selectConfirmedBids((bidRows as Row[]).map((b) => ({ ...b, id: String(b.id), humanConfirmed: !!b.human_confirmed, supersedesId: (b.supersedes_id as string | null) ?? null })));
  const micro = micrositeFor(accountName, aliasList);
  const pack = await loadDemoPack(micro?.slug ?? accountSlug(accountName));
  const roi = roiFrom(micro?.roiModel) ?? (pack ? roiFrom(buildAccountRoiModel(pack)) : null);
  const fact = getFacilityFact(accountName);
  // What Scout found while this was a candidate (added or mapped here): leads, never verified facts.
  const candidate: Row | null = prisma.gapAccountCandidate?.findFirst ? await prisma.gapAccountCandidate.findFirst({ where: { account_name: accountName, decision: { in: ['added', 'mapped'] }, scouted_at: { not: null } }, orderBy: { scouted_at: 'desc' } }).catch(() => null) : null;
  const [touches, convs] = await Promise.all([
    loadAccountFirstTouches(prisma, [accountName], now).catch(() => new Map()),
    loadAccountConversations(prisma, [accountName], now).catch(() => new Map()),
  ]);
  let opportunity: AccountInputs['opportunity'] = null;
  if (opts.live) {
    const o: OpportunityTruth = await (opts.deps?.opportunity ?? ((p, a) => resolveAccountOpportunity(p, a)))(prisma, accountName);
    opportunity = o.status === 'ACTIVE' ? { status: 'ACTIVE', detail: '', deals: o.deals.map((d) => ({ name: d.name, stage: d.stage })) } : o.status === 'UNKNOWN' ? { status: 'UNKNOWN', detail: o.reason, deals: [] } : { status: 'CLEAR', detail: '', deals: [] };
  }
  const conv = (convs as Map<string, { who: string; responseClass: string; at: string }>).get(accountName) ?? null;

  return {
    account: { name: account.name, tier: account.tier ?? null, priorityBand: account.priority_band ?? null, vertical: account.vertical ?? null, parentBrand: account.parent_brand ?? null, hubspotCompanyId: account.hubspot_company_id ?? null },
    aliases: aliasList,
    domains,
    siblings,
    watched: !!profile,
    watchReasons: profile?.reasons ?? [],
    facts: [...byQuote.values()],
    signals: (signalRows as Row[]).map((s) => ({ id: s.id, title: s.title ?? null, url: s.url ?? null, publishedAt: s.published_at ? new Date(s.published_at).toISOString() : null, researchStatus: s.research_status })),
    lastResearch: lastRun ? { at: new Date(lastRun.created_at).toISOString(), outcome: String((lastRun.provider_status as Record<string, unknown> | null)?.outcome ?? 'unknown') } : null,
    hypotheses: (hyps as Row[]).map((h) => ({
      id: h.id,
      status: h.status,
      observation: h.observation ?? '',
      problem: h.problem_hypothesis ?? '',
      rootCauses: Array.isArray(h.root_cause_hypotheses) ? h.root_cause_hypotheses.map(String) : [],
      impacts: Array.isArray(h.impact_hypotheses) ? h.impact_hypotheses.map(String) : [],
      falsification: Array.isArray(h.falsification_questions) ? h.falsification_questions.map(String) : [],
      whatANoMeans: h.what_a_no_means ?? null,
      primarySignalId: h.signals?.[0]?.signal_id ?? null,
    })),
    bids: confirmed.map((b) => ({ id: b.id, type: b.type, summary: b.normalized_summary ?? b.raw_buyer_language, quote: b.raw_buyer_language, who: b.contact_email ?? null, at: new Date(b.confirmed_at ?? b.captured_at).toISOString(), hypothesisId: b.hypothesis_id ?? null })),
    personas: (personas as Row[]).map((p) => ({ id: p.id, name: p.name, title: p.title ?? null, doNotContact: !!p.do_not_contact, hasEmail: !!p.email, emailStatus: p.email_status ?? null })),
    candidates: (candidates as Row[]).map((c) => ({ id: c.id, name: c.full_name, title: c.title ?? null, state: c.state })),
    // A member whose Persona is do-not-contact is never a way in (relationship context is never consent).
    memberships: (members as Row[]).map((m) => ({ sourceName: m.work_source?.name ?? 'a source', sourceType: m.work_source?.source_type ?? 'other', relationshipContext: m.relationship_context ?? null, personName: m.kind === 'person' ? m.name ?? null : null, doNotContact: !!(m.persona_id && (personas as Row[]).some((p) => p.id === m.persona_id && p.do_not_contact)) })),
    firstTouches: ((touches as Map<string, Array<{ recipient: string; sentAt: string; released: boolean; outstanding?: boolean }>>).get(accountName) ?? []).map((t) => ({ recipient: t.recipient, sentAt: t.sentAt, state: t.outstanding ? 'draft outstanding' : t.released ? 'released' : 'sent' })),
    conversation: conv ? { who: conv.who, responseClass: conv.responseClass, at: new Date(conv.at).toISOString() } : null,
    opportunity,
    pack: pack as unknown as PackInput | null,
    microsite: micro ? { network: micro.network, freight: micro.freight, sections: micro.sections } : null,
    facilityFact: fact ? { facilityCount: String(fact.facilityCount), status: fact.status === 'verified' ? 'verified' : 'provisional', summary: fact.summary, updatedAt: fact.updatedAt, sources: fact.sources } : null,
    roi,
    scout: scoutOf(candidate),
  };
}

function scoutOf(c: Row | null): AccountInputs['scout'] {
  if (!c) return null;
  const s = (c.scout ?? {}) as Row;
  return { domain: c.domain ?? null, what: s.what ?? null, entityType: c.entity_type ?? null, network: Array.isArray(s.network) ? s.network : [], freight: Array.isArray(s.freight) ? s.freight : [], at: c.scouted_at ? new Date(c.scouted_at).toISOString() : null };
}

/** The canonical brief for one account (live projection). Null when the slug names no account. */
export async function loadAccountBrief(prisma: PrismaLike, slug: string, now: Date, opts: Parameters<typeof loadAccountInputs>[3] & { name?: string } = {}): Promise<AccountIntelligenceBrief | { collision: string[] } | null> {
  const names = await accountNamesForSlug(prisma, slug);
  const name = opts.name && names.includes(opts.name) ? opts.name : names.length === 1 ? names[0] : null;
  if (!name) return names.length > 1 ? { collision: names } : null;
  const inputs = await loadAccountInputs(prisma, name, now, opts);
  return inputs ? buildAccountBrief(inputs, now) : null;
}
