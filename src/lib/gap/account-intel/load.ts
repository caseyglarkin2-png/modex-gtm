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
import { factUrl, liveClaimFailure, liveFactFailure } from '../research/claim-rules';
import { contradictedFactIds } from '../research/conflicts';
import { selectConfirmedBids } from '../bid/select';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { buildROIEngineInputs, computeROIModel } from '@/lib/microsites/roi';
import { buildAccountRoiModel } from '@/lib/demo/roi-model';
import { loadDemoPack } from '@/lib/demo/load-pack';
import { getFacilityFact } from '@/lib/research/facility-fact-registry';
import type { AccountMicrositeData, AccountROIModel } from '@/lib/microsites/schema';
import { buildAccountBrief, type AccountInputs, type AccountIntelligenceBrief, type FactInput, type PackInput } from './build';
import { loadHubSpotPeople, loadHubSpotPeopleForCompanies, type HubSpotPeopleReads } from '../people/hubspot-people';
import { apolloEvidence, crmEvidence, type EmploymentEvidence } from '../people/employment';
import { accountEmploymentContext, loadEmployment, loadHubSpotContactRoleEvidence, personaRole, readHubSpotOnlyEmployment, type HubSpotEmploymentProps } from '../people/employment-store';
import { readRole, type RoleRead } from '../people/role-currentness';
import { stageLabels, type StageLabelRead } from '../opportunity/stage-labels';
import { stageName } from '../deals/stage-label';
import { bidScopeLabeler } from '../deals/opportunities';
import { fetchAccountContextRows, loadAccountContext, projectAccountContext } from '../context/load';
import { decodeEntities, type AccountContext } from '../context/context';
import { accountSlug } from './href';
import { approachOfHypothesis } from '../research/approach-policy';
import { factUsability, usabilityLine } from '../research/currentness';
import { draftApproachFor } from '../story/draft-approach';
import { nameFromAddress } from '../story/touches';
import { wordingOf } from '../bid/wording';
import type { IdentityContext } from '../identity/resolve';
import { loadIdentityContext } from '../identity/service';
import { resolvePersonAccount } from '../work/person-identity';
import { loadFamilyFacts, placeAmongFamily, placedViaOf } from '../work/intel';
import { ABSENT_COVERAGE, dealCoverageFrom, type DealCoverage } from '../work/deal-coverage';
import { loadInDealsSummary, type InDealsSummary } from '../deals/in-deals';
import { AUTO_REPLY_SUBJECT, FREEMAIL_DOMAINS, OWN_DOMAINS } from '../replies/domains';
import type { InboundVia } from './build';
import { loadAccountSent, type LoadAccountSentArgs } from './sent';
import { loadCompanyEngagements } from '../hubspot/engagements';
import { gapGmailSender } from '../execution/gap-sender';
import type { GmailSender } from '@/lib/email/gmail-sender';
/** R30/R31: the non-physical claim classes the read keeps as story facts of their own kind. */
const CLAIM_FACT_CLASSES: ReadonlySet<string> = new Set(['JOB_POSTING', 'PROCUREMENT']);

export { accountSlug };

/** C6: the inbound read's window and bound (each way). */
export const INBOUND_WINDOW_DAYS = 180;
export const INBOUND_MAX = 50;

type InboundRow = { id: string; thread_id: string | null; from_email: string; from_name: string | null; subject: string | null; snippet: string | null; body_text?: string | null; received_at: Date | string; thread?: { account_name: string | null } | null };

export type AccountInbound = NonNullable<AccountInputs['inbound']>;

/**
 * C6 (seller acceptance, 2026-10-09; Casey's rule 3: retrieve the Gmail conversation before declaring there is no
 * context). The account's inbound mail from GAP's synced inbox, two bounded reads merged by message id:
 *   thread   the messages of the threads keyed to this account (email_threads.account_name), the read the story had
 *   placed   the messages whose SENDER the identity machinery places here (resolvePersonAccount with the same identity
 *            context the people ranker uses, then the C5 family tie-break under the day's deal coverage): a persona, the
 *            CRM contact's company, the thread's name, the verified domain, the family's deal-holding account. A thread
 *            keyed to ANOTHER account is never taken; a freemail sender is never placed; own-domain and automated mail
 *            is left out.
 * Soft: a client without the tables, or a failed read, gives what was read and says so; identityRead false means the
 * identity context could not be read and only the thread read ran (the coverage says partial with that detail).
 */
export async function loadAccountInbound(prisma: PrismaLike, args: { accountName: string; now: Date; domains?: readonly string[]; personaEmails?: readonly string[]; identity?: IdentityContext | null; coverage?: DealCoverage }): Promise<AccountInbound> {
  const { accountName, now } = args;
  const since = new Date(now.getTime() - INBOUND_WINDOW_DAYS * 86_400_000);
  const iso = (d: Date | string) => new Date(d).toISOString();
  const lower = (s: string) => s.trim().toLowerCase();
  const sameName = (a: string | null | undefined) => !!a && lower(a) === lower(accountName);
  const select = { id: true, thread_id: true, from_email: true, from_name: true, subject: true, snippet: true, body_text: true, received_at: true, thread: { select: { account_name: true } } };
  const canRead = typeof prisma?.inboundMessage?.findMany === 'function';
  const messages = new Map<string, AccountInbound['messages'][number]>();
  // C7: the synced inbox's snippet arrives HTML-escaped ("I&#39;ve only met him once"); the buyer's words are decoded before the story quotes them.
  const toMessage = (r: InboundRow, via: InboundVia, domain: string | null) => ({ id: r.id, from: lower(r.from_email), name: r.from_name?.trim() || null, at: iso(r.received_at), subject: r.subject ? decodeEntities(r.subject) : null, snippet: decodeEntities((r.snippet ?? r.body_text ?? '').replace(/\s+/g, ' ').trim()).slice(0, 600), threadId: r.thread_id ?? null, via, domain });

  // The thread-keyed read.
  if (canRead && typeof prisma?.emailThread?.findMany === 'function') {
    const threads: Array<{ id: string }> = await prisma.emailThread.findMany({ where: { account_name: accountName }, select: { id: true }, take: 200 }).catch(() => []);
    if (threads.length) {
      const rows: InboundRow[] = await prisma.inboundMessage.findMany({ where: { thread_id: { in: threads.map((t) => t.id) }, received_at: { gte: since } }, select, orderBy: { received_at: 'desc' }, take: INBOUND_MAX }).catch(() => []);
      for (const r of rows) if (!messages.has(r.id)) messages.set(r.id, toMessage(r, 'thread', r.from_email.includes('@') ? lower(r.from_email.split('@')[1]) : null));
    }
  }

  // The placed read: the identity context first (the people ranker's), then the senders a domain or a persona could place.
  const identity: IdentityContext | null | undefined = args.identity !== undefined ? args.identity : typeof prisma?.canonicalCompany?.findMany === 'function' && typeof prisma?.gapAccountAlias?.findMany === 'function' ? await loadIdentityContext(prisma).catch(() => null) : null;
  const identityRead = !!identity;
  const claimedDomains = new Set<string>((args.domains ?? []).map(lower));
  if (identity) {
    for (const m of [identity.verifiedDomainToAccounts, identity.conflictedDomainToAccounts ?? new Map<string, readonly string[]>()]) for (const [d, names] of m) if (names.some(sameName)) claimedDomains.add(lower(d));
  }
  for (const e of args.personaEmails ?? []) { const d = e.includes('@') ? lower(e.split('@')[1]) : ''; if (d && !FREEMAIL_DOMAINS.has(d)) claimedDomains.add(d); }
  for (const d of [...claimedDomains]) if (OWN_DOMAINS.has(d) || FREEMAIL_DOMAINS.has(d)) claimedDomains.delete(d);
  const personaEmails = [...new Set((args.personaEmails ?? []).map(lower).filter((e) => e.includes('@')))];
  if (canRead && identity && (claimedDomains.size || personaEmails.length)) {
    const or = [...(personaEmails.length ? [{ from_email: { in: personaEmails, mode: 'insensitive' } }] : []), ...[...claimedDomains].map((d) => ({ from_email: { endsWith: `@${d}`, mode: 'insensitive' } }))];
    const rows: InboundRow[] = await prisma.inboundMessage.findMany({ where: { received_at: { gte: since }, OR: or }, select, orderBy: { received_at: 'desc' }, take: INBOUND_MAX }).catch(() => []);
    const fresh = rows.filter((r) => !messages.has(r.id) && r.from_email.includes('@') && !OWN_DOMAINS.has(lower(r.from_email.split('@')[1])) && !AUTO_REPLY_SUBJECT.test(r.subject ?? '') && !(r.thread?.account_name && !sameName(r.thread.account_name)));
    if (fresh.length) {
      // The senders' personas (any account: a persona elsewhere places the sender elsewhere, never here).
      const senders = [...new Set(fresh.map((r) => lower(r.from_email)))];
      const personas: Array<{ email: string | null; account_name: string | null }> = typeof prisma?.persona?.findMany === 'function' ? await prisma.persona.findMany({ where: { email: { in: senders, mode: 'insensitive' } }, select: { email: true, account_name: true } }).catch(() => []) : [];
      const personaByEmail = new Map(personas.filter((p) => p.email).map((p) => [lower(String(p.email)), p]));
      const placedBy = new Map(senders.map((e) => [e, resolvePersonAccount({ email: e, persona: personaByEmail.get(e) ?? null, threadAccount: null, identity, hubspotCompanyIds: [] })]));
      const candidates = [...new Set([...placedBy.values()].flatMap((p) => p.candidates))];
      const family = candidates.length ? await loadFamilyFacts(prisma, candidates).catch(() => null) : null;
      const coverage = args.coverage ?? ABSENT_COVERAGE;
      for (const r of fresh) {
        const placed = placedBy.get(lower(r.from_email))!;
        const among = placeAmongFamily(placed, family, coverage, now);
        if (!sameName(among.accountName)) continue;
        const via = placedViaOf(among.via) ?? 'domain';
        messages.set(r.id, toMessage(r, via, lower(r.from_email.split('@')[1])));
      }
    }
  }
  const out = [...messages.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, INBOUND_MAX * 2);
  return { messages: out, identityRead, detail: identityRead ? null : 'identity context unreadable: senders could not be placed, only the threads keyed to the account were read' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;
/** A raw row from a narrow select (house glue). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;


/** Accents folded to their base letter ("Nestlé" reads "Nestle"), the same fold as normalizeCompanyName. */
export const foldAccents = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
// Postgres translate() pairs for the same fold, upper case too (lower() of an accented capital depends on the
// database collation). Built from one map so the two strings always line up.
const FOLD: Record<string, string> = { a: 'áàâäãåā', c: 'çćč', e: 'éèêëēę', i: 'íìîïī', n: 'ñń', o: 'óòôöõō', s: 'šś', u: 'úùûüū', y: 'ýÿ', z: 'žźż' };
export const FOLD_FROM = Object.values(FOLD).map((f) => f + f.toUpperCase()).join('');
export const FOLD_TO = Object.entries(FOLD).map(([to, from]) => to.repeat([...from].length * 2)).join('');

/**
 * Accounts whose (accent-folded) names start like this ASCII token: a narrowed read, never the whole table.
 * "Nestle" finds "Nestlé USA" and "Élan" finds "Elan Foods" and "Élan Foods".
 */
async function namesStartingLike(prisma: PrismaLike, name: string): Promise<string[]> {
  const token = foldAccents(name).trim().toLowerCase().split(/[^a-z0-9]/)[0] ?? '';
  if (!token) return [];
  if (typeof prisma.$queryRaw === 'function') {
    // A database that cannot encode the fold characters (a WIN1252 scratch database) falls back to the plain read.
    const rows: Array<{ name: string }> | null = await prisma.$queryRaw`SELECT name FROM accounts WHERE translate(lower(name), ${FOLD_FROM}, ${FOLD_TO}) LIKE ${`${token}%`} ORDER BY name LIMIT 500`.catch(() => null);
    if (rows) return rows.map((r) => r.name);
  }
  const rows: Array<{ name: string }> = await prisma.account.findMany({ where: { name: { startsWith: token, mode: 'insensitive' } }, select: { name: true }, orderBy: { name: 'asc' }, take: 500 });
  return rows.map((r) => r.name);
}

/**
 * Every account whose slug this is (the app-wide scheme has no slug column: resolve by name). More than one
 * means a collision ("P&G" and "P-G"): the page asks which, never picks. The slug drops accented letters
 * ("Élan Foods" is "lan-foods"), so the match runs the slug rule itself in SQL, never a name prefix.
 */
export async function accountNamesForSlug(prisma: PrismaLike, slug: string): Promise<string[]> {
  if (!slug) return [];
  if (typeof prisma.$queryRaw === 'function') {
    const rows: Array<{ name: string }> = await prisma.$queryRaw`SELECT name FROM accounts WHERE trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) = ${slug} ORDER BY name LIMIT 20`;
    return rows.map((r) => r.name).filter((n) => accountSlug(n) === slug);
  }
  return (await namesStartingLike(prisma, slug.split('-')[0] ?? '')).filter((n) => accountSlug(n) === slug);
}

export async function accountNameForSlug(prisma: PrismaLike, slug: string): Promise<string | null> {
  const names = await accountNamesForSlug(prisma, slug);
  return names.length === 1 ? names[0] : null;
}

function micrositeFor(name: string, aliases: string[]): AccountMicrositeData | null {
  // The account's own name first; an alias only when exactly one microsite answers to it (a parent's or a sibling's
  // microsite must never become this account's audit).
  const all = getAllAccountMicrositeData();
  const is = (m: AccountMicrositeData, k: string) => normalizeCompanyName(m.accountName) === k || (!!m.hubspotName && normalizeCompanyName(m.hubspotName) === k);
  const own = all.filter((m) => is(m, normalizeCompanyName(name)));
  if (own.length === 1) return own[0];
  if (own.length > 1) return null;
  const viaAlias = all.filter((m) => aliases.some((a) => is(m, normalizeCompanyName(a))));
  return viaAlias.length === 1 ? viaAlias[0] : null;
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
  opts: {
    live?: boolean;
    deps?: {
      opportunity?: (p: PrismaLike, a: string) => Promise<OpportunityTruth>;
      hubspotPeople?: HubSpotPeopleReads;
      stageLabels?: StageLabelRead;
      /** C6: the identity context and the in-deals read the placed inbound read uses (tests inject them; the live page reads the cached summary). */
      identity?: IdentityContext | null;
      inDeals?: (p: PrismaLike, now: Date) => Promise<InDealsSummary | null>;
      /** B1: our Sent mail to the account (tests inject; the live page reads the GAP mailbox through account-intel/sent.ts). */
      sent?: (args: Omit<LoadAccountSentArgs, 'sender'> & { sender: GmailSender | null }) => Promise<AccountInputs['sent']>;
      /** B2: the HubSpot company's engagements (tests inject; the live page reads hubspot/engagements.ts with its cache). */
      engagements?: (companyId: string, now: Date) => Promise<AccountInputs['engagements']>;
    };
    hypothesisId?: string;
    /**
     * Execution acceptance: only what the current-actionable-thesis rule reads (theses, facts, buyer truth, review
     * acks), for a click or an action pack. Its reads THROW instead of degrading to empty, so a failure is
     * "cannot confirm", never "nothing against it".
     */
    lean?: boolean;
  } = {},
): Promise<AccountInputs | null> {
  const lean = !!opts.lean;
  // Lean: a failed read throws (the caller fails closed); full: a failed read degrades to empty, as before.
  const soft = <T,>(p: Promise<T>, fallback: T): Promise<T> => (lean ? p : p.catch(() => fallback));
  const skip = <T,>(p: () => Promise<T>, fallback: T): Promise<T> => (lean ? Promise.resolve(fallback) : p());
  const account = await prisma.account.findUnique({ where: { name: accountName }, select: { name: true, tier: true, priority_band: true, vertical: true, parent_brand: true, hubspot_company_id: true, updated_at: true } });
  if (!account) return null;
  // SPEED (V2): every read that needs only the account name starts NOW and runs alongside the rest; each is awaited
  // where it was before, with the same failure semantics (a handler is attached so an early rejection is not
  // "unhandled"; awaiting it still rethrows).
  const early = <T,>(p: Promise<T>): Promise<T> => {
    p.catch(() => undefined);
    return p;
  };
  const oppP = opts.live ? early((opts.deps?.opportunity ?? ((p: PrismaLike, a: string) => resolveAccountOpportunity(p, a)))(prisma, accountName)) : null;
  const hsPeopleP = opts.live && account.hubspot_company_id ? loadHubSpotPeople(account.hubspot_company_id, opts.deps?.hubspotPeople) : Promise.resolve(null);
  const stagesP = opts.live ? stageLabels(opts.deps?.stageLabels) : Promise.resolve(new Map<string, string>());
  const contradictedP = early(soft(contradictedFactIds(prisma, accountName, now), new Map<string, string>()));
  // R61: the account's names and domains need only its name: read now, beside everything else (it waited for the
  // HubSpot people before).
  const empCtxP = opts.lean ? Promise.resolve({ aliases: [] as string[], domains: [] as string[] }) : early(accountEmploymentContext(prisma, accountName).catch(() => ({ aliases: [] as string[], domains: [] as string[] })));
  // Item 2: every fact a REJECTED thesis here cites (the seller set the story aside), not only the ten newest theses.
  const setAsideP: Promise<string[]> = early(skip(() => (prisma.hypothesisSignal?.findMany ? prisma.hypothesisSignal.findMany({ where: { hypothesis: { account_name: accountName, status: 'rejected' } }, select: { signal_id: true }, take: 500 }).then((rows: Row[]) => [...new Set(rows.map((r) => String(r.signal_id)))]).catch(() => [] as string[]) : Promise.resolve([] as string[])), [] as string[]));
  const candidateP: Promise<Row | null> = !lean && prisma.gapAccountCandidate?.findFirst
    ? prisma.gapAccountCandidate.findFirst({ where: { scouted_at: { not: null }, OR: [{ account_name: accountName, decision: { in: ['added', 'mapped'] } }, { company_key: normalizeCompanyName(accountName) }] }, orderBy: { scouted_at: 'desc' } }).catch(() => null)
    : Promise.resolve(null);
  const touchesConvsP = lean
    ? Promise.resolve([new Map(), new Map()] as const)
    : Promise.all([loadAccountFirstTouches(prisma, [accountName], now).catch(() => new Map()), loadAccountConversations(prisma, [accountName], now).catch(() => new Map())]);
  const familyP = lean ? Promise.resolve(null) : early((async () => {
    const fam = await import('../family/family');
    const f = await fam.loadCorporateFamily(prisma, accountName, opts.live ? { hubspot: fam.hubspotFamily } : {}).catch(() => null);
    if (!f || (!f.parentName && !f.members.length)) return f ? { parentName: f.parentName, members: [], related: [], separate: null, hold: null } : null;
    if (!opts.live || !f.members.length) return { parentName: f.parentName, members: f.members, related: null, separate: null, hold: null };
    const [related, separate] = await Promise.all([fam.loadRelatedActivity(prisma, f, now).catch(() => null), fam.loadSeparateMotion(prisma, accountName, now).catch(() => null)]);
    const hold = related ? fam.relatedHold(f, related, separate) : { detail: `Related account activity could not be read for ${f.members.map((m) => m.accountName).join(', ')}.`, accounts: f.members.map((m) => m.accountName), unknown: true };
    return { parentName: f.parentName, members: f.members, related, separate, hold };
  })());
  const [aliases, link, allNames, profiles, signalRows, factRows, lastRun, hyps, bidRows, personas, candidates, members] = await Promise.all([
    skip(() => prisma.gapAccountAlias.findMany({ where: { account_name: accountName }, select: { alias: true, created_at: true } }).catch(() => []), []),
    skip(() => prisma.canonicalAccountLink.findUnique({ where: { account_name: accountName }, select: { canonical_company_id: true, status: true } }).catch(() => null), null as Row | null),
    skip(() => namesStartingLike(prisma, accountName), [] as string[]),
    skip(() => loadWatchProfilesCached(prisma).catch(() => []), []),
    skip(() => prisma.gapSignal.findMany({ where: { account_name: accountName, resolution: 'resolved' }, select: { id: true, title: true, url: true, published_at: true, research_status: true, note: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 15 }).catch(() => []), []),
    prisma.prospectingSignal.findMany({ where: { account_name: accountName, source_kind: 'evidence_record' }, select: { id: true, title: true, evidence_text: true, evidence_url: true, observed_at: true, freshness_expires_at: true, metadata: true, claim_class: true, type: true }, orderBy: { observed_at: 'desc' }, take: 200 }),
    skip(() => prisma.researchRun.findFirst({ where: { account_name: accountName, run_key: { startsWith: 'gap_research:' } }, orderBy: { created_at: 'desc' }, select: { created_at: true, provider_status: true } }).catch(() => null), null as Row | null),
    soft(prisma.prospectingHypothesis.findMany({
      where: { account_name: accountName, superseded_by: { is: null }, status: { in: ['draft', 'review_required', 'approved', 'active', 'confirmed', 'partially_confirmed', 'rejected'] } },
      select: { id: true, status: true, reviewed_at: true, activated_at: true, observation: true, problem_hypothesis: true, root_cause_hypotheses: true, impact_hypotheses: true, falsification_questions: true, what_a_no_means: true, problem_family: true, primary_persona_id: true, metadata: true, signals: { where: { role: 'primary' }, select: { signal_id: true } } },
      orderBy: { updated_at: 'desc' },
      take: 10,
    })
      // Execution acceptance: a click-time check names its thesis; it is loaded even past the 10 most recent.
      .then(async (rows: Row[]) => {
        if (!opts.hypothesisId || rows.some((r) => r.id === opts.hypothesisId)) return rows;
        const extra: Row[] = await prisma.prospectingHypothesis.findMany({
          where: { id: opts.hypothesisId, account_name: accountName, superseded_by: { is: null }, status: { in: ['draft', 'review_required', 'approved', 'active', 'confirmed', 'partially_confirmed', 'rejected'] } },
          select: { id: true, status: true, reviewed_at: true, activated_at: true, observation: true, problem_hypothesis: true, root_cause_hypotheses: true, impact_hypotheses: true, falsification_questions: true, what_a_no_means: true, problem_family: true, primary_persona_id: true, metadata: true, signals: { where: { role: 'primary' }, select: { signal_id: true } } },
        });
        return [...rows, ...extra];
      }), [] as Row[]),
    soft(prisma.buyerInputData.findMany({ where: { account_name: accountName }, select: { id: true, type: true, normalized_summary: true, raw_buyer_language: true, contact_email: true, captured_at: true, human_confirmed: true, supersedes_id: true, confirmed_at: true, hypothesis_id: true, metadata: true } }), [] as Row[]),
    skip(() => prisma.persona.findMany({ where: { account_name: accountName }, select: { id: true, name: true, title: true, do_not_contact: true, email: true, email_status: true, updated_at: true, hubspot_contact_id: true, enrichment: { select: { apollo_person_id: true, last_enriched_at: true } } }, take: 60 }), [] as Row[]),
    skip(() => prisma.accountContactCandidate.findMany({ where: { account_name: accountName, state: 'staged' }, select: { id: true, full_name: true, title: true, state: true, last_seen_at: true }, take: 30 }).catch(() => []), []),
    skip(() => (prisma.gapWorkSourceMember?.findMany ? prisma.gapWorkSourceMember.findMany({ where: { account_name: accountName, status: { notIn: ['ignored', 'not_now'] } }, select: { name: true, kind: true, title: true, company: true, persona_id: true, relationship_context: true, ingested_at: true, work_source: { select: { name: true, source_type: true } } }, take: 30 }).catch(() => []) : Promise.resolve([])), []),
  ]);
  // "I reviewed it" after a THESIS NEEDS REVIEW flag (Casey's click, an audit row): the newest per thesis.
  const hypIds = (hyps as Row[]).map((h) => h.id as string);
  const rejectedIds = (hyps as Row[]).filter((h) => h.status === 'rejected').map((h) => h.id as string);
  const [ackRows, buyerNo] = await Promise.all([
    hypIds.length && prisma.gapAuditEvent?.findMany ? soft(prisma.gapAuditEvent.findMany({ where: { kind: 'thesis.review_ack', subject_type: 'hypothesis', subject_id: { in: hypIds } }, select: { subject_id: true, created_at: true }, orderBy: { created_at: 'desc' } }), [] as Row[]) : Promise.resolve([] as Row[]),
    // A thesis the BUYER rejected (a human-confirmed problem_rejected disposition) shows as contradicted; a draft Casey withdrew does not.
    rejectedIds.length && prisma.conversationDisposition?.findMany ? soft(prisma.conversationDisposition.findMany({ where: { hypothesis_id: { in: rejectedIds }, response_class: 'problem_rejected', human_confirmed: true }, select: { hypothesis_id: true } }), [] as Row[]) : Promise.resolve([] as Row[]),
  ]) as [Row[], Row[]];
  const acks = new Map<string, Date>();
  for (const r of ackRows) if (!acks.has(r.subject_id)) acks.set(r.subject_id, new Date(r.created_at));
  const buyerRejected = new Set(buyerNo.map((r) => r.hypothesis_id as string));
  // The corporate family: related accounts (never merged). What is live at them is read only on the live page.
  const family = await familyP;
  const aliasList = (aliases as Array<{ alias: string }>).map((a) => a.alias);
  // First-party freshness: the record's own timestamp, or none (shown undated). Never a made-up date.
  const iso = (d: unknown): string | null => (d instanceof Date || typeof d === 'string' ? (Number.isNaN(new Date(d).getTime()) ? null : new Date(d).toISOString()) : null);
  const aliasesAddedAt = (aliases as Row[]).map((a) => iso(a.created_at)).filter((d): d is string => !!d).sort().pop() ?? null;
  const domains: string[] = [];
  if (!lean && link?.status === 'resolved') {
    const cc = await prisma.canonicalCompany.findUnique({ where: { id: link.canonical_company_id }, select: { domain: true } }).catch(() => null);
    if (cc?.domain) domains.push(cc.domain);
  }
  const key = normalizeCompanyName(accountName);
  const siblings = (allNames as string[]).filter((n) => n !== accountName && normalizeCompanyName(n) === key);
  const profile = (profiles as Array<{ accountName: string; reasons?: string[] }>).find((p) => p.accountName === accountName);

  // A fact another live fact contradicts is not outreach evidence (the same check the inbox and the send gate run).
  const contradicted: Map<string, string> = await contradictedP;
  // Verified research facts; a continuation row carries its chain (one fact per quote, newest clock).
  const byQuote = new Map<string, FactInput>();
  for (const r of factRows as Row[]) {
    const meta = (r.metadata ?? {}) as Row;
    if (meta.verified !== 'excerpt_found_at_source' || !r.evidence_text) continue;
    // Re-gated on read: a fact stored before a rule tightened (a software rollout, a 10-K description, an acquired
    // company's exhibit) stops being live. The row stays for audit; nothing is deleted.
    // A quote attributed to another organization (a vendor's CEO about this account) is that organization's fact.
    // R30/R31: a job or procurement claim is re-gated by the claim rules (publisher, speaker), a physical fact by the
    // fact rules; the class rides on the fact so the story and the anchor know which approach it may open.
    const claimClass = typeof r.claim_class === 'string' && CLAIM_FACT_CLASSES.has(r.claim_class) ? r.claim_class : null;
    // Item 4: an ONGOING partnership or program the account states (the Gatik agreement) opens a fit-led thesis; it is
    // kept and re-gated by the claim rules (publisher, speaker), like a posting. A one-time software deployment opens
    // nothing and stays off the page, as before.
    const recordedKind = meta.continuity?.kind;
    const fitLed = !claimClass && draftApproachFor({ text: r.evidence_text, claimClass: r.claim_class ?? null, continuity: recordedKind === 'event' || recordedKind === 'ongoing_state' || recordedKind === 'ended' ? recordedKind : null }) === 'fit_led';
    if (claimClass || fitLed ? liveClaimFailure(r.evidence_text, accountName, factUrl(r)) : liveFactFailure(r.evidence_text, accountName, factUrl(r))) continue;
    if (contradicted.has(r.id)) continue;
    const k = meta.continuity?.kind;
    const standing = factUsability(r as never, now);
    const f: FactInput = {
      id: r.id,
      claimClass,
      quote: r.evidence_text,
      url: factUrl(r),
      title: r.title ?? '',
      publishedAt: new Date(r.observed_at).toISOString(),
      // I06: when its window closes (a label) and whether it may carry a thesis (the gate), by the one authority.
      expiresAt: standing.currentness.until,
      usable: standing.usable,
      historical: standing.historical,
      usabilityLine: usabilityLine(standing, r as never),
      continuity: k === 'ended' ? 'ended' : k === 'ongoing_state' ? 'ongoing_state' : classifyContinuity(r.evidence_text),
      currentness: meta.continuity?.currentness?.publishedAt ? { url: meta.continuity.currentness.url ?? null, publishedAt: meta.continuity.currentness.publishedAt } : null,
    };
    const q = f.quote.trim().toLowerCase();
    const cur = byQuote.get(q);
    // One fact per quote; the rows it absorbs stay its ids (a thesis may cite any of them).
    if (!cur) byQuote.set(q, f);
    else if ((f.expiresAt ?? '') > (cur.expiresAt ?? '')) byQuote.set(q, { ...f, sameQuoteIds: [cur.id, ...(cur.sameQuoteIds ?? [])] });
    else byQuote.set(q, { ...cur, sameQuoteIds: [...(cur.sameQuoteIds ?? []), f.id] });
  }

  // The shared selector speaks camelCase: map, then keep human-confirmed rows no later row supersedes.
  const confirmed: Row[] = selectConfirmedBids((bidRows as Row[]).map((b) => ({ ...b, id: String(b.id), humanConfirmed: !!b.human_confirmed, supersedesId: (b.supersedes_id as string | null) ?? null })));
  const micro = lean ? null : micrositeFor(accountName, aliasList);
  const pack = lean ? null : await loadDemoPack(micro?.slug ?? accountSlug(accountName));
  const roi = lean ? null : roiFrom(micro?.roiModel) ?? (pack ? roiFrom(buildAccountRoiModel(pack)) : null);
  const fact = lean ? null : getFacilityFact(accountName);
  // What Scout found while this was a candidate (added or mapped here): leads, never verified facts.
  // What Scout found: while this was a candidate (added or mapped here), or an identity Scout run on the account
  // itself (the same normalized company key). Leads, never verified facts.
  const candidate: Row | null = await candidateP;
  const [touches, convs] = await touchesConvsP;
  let opportunity: AccountInputs['opportunity'] = null;
  if (oppP) {
    const o: OpportunityTruth = await oppP;
    // The stage's NAME from the pipeline (display only; the id when the label cannot be read).
    const labels = await stagesP;
    // R55: with no open deal, the closure (a customer, or parked after a lost deal) rides on CLEAR.
    const closure = o.status === 'CLEAR' && o.closure ? { kind: o.closure.kind, why: o.closure.why, dealName: o.closure.deal.name, closedAt: o.closure.deal.closedAt } : null;
    const closed = o.status !== 'UNKNOWN' && o.closed?.length ? { closed: o.closed.map((d) => ({ ...d })) } : {};
    opportunity = o.status === 'ACTIVE' ? { status: 'ACTIVE', detail: '', deals: o.deals.map((d) => ({ id: d.id, name: d.name, stage: stageName(d.stage, labels), amount: d.amount ?? null, closeDate: d.closeDate ?? null, nextStep: d.nextStep ?? null, contactIds: [...(d.contactIds ?? [])] })), ...closed } : o.status === 'UNKNOWN' ? { status: 'UNKNOWN', detail: o.reason, deals: [], ...(o.reason === 'identity_unresolved' && /^no HubSpot company/.test(o.detail ?? '') ? { unlinked: true } : {}) } : { status: 'CLEAR', detail: '', deals: [], ...(closure ? { closure } : {}), ...closed };
  }
  // Sprint 5 review (R50): with a deal at the account (open or closed), each buyer input carries its opportunity's
  // label (deals/scope.ts, the same rule as the deal brief), so NOW, the brief and the story never show one deal's words
  // as the account's. With no deal there is nothing to tell apart.
  const scopeOfBid = bidScopeLabeler(opportunity, (personas as Row[]).map((p) => ({ personaId: p.id as number, name: (p.name as string | null) ?? `person ${p.id}`, title: (p.title as string | null) ?? null, email: (p.email as string | null) ?? null, hubspotContactId: p.hubspot_contact_id ? String(p.hubspot_contact_id) : null })));
  const conv = (convs as Map<string, { who: string; responseClass: string; at: string }>).get(accountName) ?? null;
  // R63-A B4 / the matrix: an address is said as the person on record at it, else the name the address carries; the
  // story never names a speaker by an address.
  const speakerName = (email: string | null): string | null => {
    const e = (email ?? '').trim().toLowerCase();
    if (!e) return null;
    const p = (personas as Row[]).find((x) => String(x.email ?? '').trim().toLowerCase() === e);
    return p?.name ? String(p.name) : e.includes('@') ? nameFromAddress(e) : e;
  };
  // The account's HubSpot people: the linked company; else (owner resolution, 2026-10-05) the companies the account's
  // identity resolved for deal truth (the one identity rule: FedEx and H-E-B have no linked company but their people
  // mail from fedex.com and heb.com). Read only; nothing links the account.
  const hsPeople = await (account.hubspot_company_id || !oppP
    ? hsPeopleP
    : (async () => {
        const o: OpportunityTruth = await oppP;
        const ids = 'companyIds' in o ? o.companyIds : [];
        return ids.length ? loadHubSpotPeopleForCompanies(ids, opts.deps?.hubspotPeople) : null;
      })().catch(() => null));
  const hsById = new Map((hsPeople?.people ?? []).map((h) => [h.id, h]));
  // C6: the account's inbound mail, thread-keyed and placed (the live page reads the cached in-deals summary for the C5 tie-break; soft).
  const inboundP: Promise<AccountInputs['inbound']> = lean
    ? Promise.resolve(null)
    : (async () => {
        const summary = opts.deps?.inDeals ? await opts.deps.inDeals(prisma, now).catch(() => null) : opts.live && typeof prisma?.systemConfig?.findUnique === 'function' ? await loadInDealsSummary(prisma, { now }).catch(() => null) : null;
        return loadAccountInbound(prisma, { accountName, now, domains, personaEmails: (personas as Row[]).map((p) => String(p.email ?? '')).filter(Boolean), identity: opts.deps?.identity, coverage: dealCoverageFrom(summary) });
      })().catch(() => null);
  // B1: our Sent mail to the account's people (the GAP mailbox, after the inbound read names its senders; live only; soft).
  const sentP: Promise<AccountInputs['sent']> = lean || !(opts.deps?.sent || opts.live)
    ? Promise.resolve(null)
    : (async () => {
        const inbound = await inboundP;
        const firstTouchRecipients = ((touches as Map<string, Array<{ recipient: string }>>).get(accountName) ?? []).map((t) => t.recipient);
        const addresses = [...new Set([...(personas as Row[]).map((p) => String(p.email ?? '')), ...(inbound?.messages ?? []).map((m) => m.from), ...firstTouchRecipients].map((a) => a.trim().toLowerCase()).filter((a) => a.includes('@')))];
        const args = { accountName, addresses, domains, now, sender: gapGmailSender() };
        return opts.deps?.sent ? opts.deps.sent(args) : loadAccountSent(prisma, args);
      })().catch(() => null);
  // B2: the HubSpot company's engagements: the linked company, else the first company the identity resolved for deal
  // truth (the one identity rule the people read uses); live only; soft; cached per company.
  const engagementsP: Promise<AccountInputs['engagements']> = lean || !(opts.deps?.engagements || opts.live)
    ? Promise.resolve(null)
    : (async () => {
        let companyId = account.hubspot_company_id ? String(account.hubspot_company_id) : null;
        if (!companyId && oppP) {
          const o: OpportunityTruth = await oppP;
          companyId = ('companyIds' in o ? o.companyIds : [])[0] ?? null;
        }
        if (!companyId) return { items: [], read: false, detail: 'no HubSpot company linked to the account' };
        if (opts.deps?.engagements) return opts.deps.engagements(companyId, now);
        const r = await loadCompanyEngagements(companyId, { token: process.env.HUBSPOT_ACCESS_TOKEN, now, prisma });
        return { items: r.items.map((e) => ({ kind: e.kind, at: e.at, title: e.title, body: e.body, id: e.id, from: e.from ?? null, to: e.to ?? null, direction: e.direction ?? null })), read: r.read, detail: r.detail };
      })().catch(() => null);
  // Contact currentness for the GAP contacts (database evidence plus the live HubSpot properties where linked).
  const hsProps = new Map<string, HubSpotEmploymentProps>();
  for (const h of hsPeople?.people ?? []) hsProps.set(h.id, { company: h.company ?? null, title: h.title, email: null, lastModifiedAt: h.lastModifiedAt ?? null, apolloEmploymentStatus: h.apolloEmploymentStatus ?? null, apolloVerifiedAt: h.apolloVerifiedAt ?? null });
  const empCtx = await empCtxP;
  const empAliases = [...new Set([...aliasList, ...(account.parent_brand ? [account.parent_brand] : []), ...empCtx.aliases])];
  // ROLE currentness (WHO truth maintenance, 2026-10-05): the stored title against current evidence, for GAP contacts
  // (the record plus anything verified against the linked HubSpot contact) and for HubSpot-only people (the CRM row,
  // Apollo's sweep, anything verified against the contact id). A changed role with no known title, or a role
  // conflict, never fills a slot; a verified new title is the title the buyer map reads.
  const roleIds = lean ? [] : [...new Set([...(hsPeople?.people ?? []).map((h) => h.id), ...(personas as Row[]).map((p) => (p.hubspot_contact_id ? String(p.hubspot_contact_id) : '')).filter(Boolean)])];
  // R61: the contacts' employment and their role evidence are read together, never one after the other.
  const [employment, roleEvidence] = await Promise.all([
    lean || !(personas as Row[]).length ? Promise.resolve(new Map()) : loadEmployment(prisma, (personas as Row[]).map((p) => p.id as number), { now, hubspot: hsProps, aliasesFor: () => empAliases, domainsFor: () => empCtx.domains }).catch(() => new Map()),
    roleIds.length ? loadHubSpotContactRoleEvidence(prisma, roleIds).catch(() => new Map<string, EmploymentEvidence[]>()) : Promise.resolve(new Map<string, EmploymentEvidence[]>()),
  ]);
  const roleView = (r: RoleRead) => ({ state: r.state, why: r.why, effectiveTitle: r.effectiveTitle, priorTitle: r.priorTitle, usableForRanking: r.usableForRanking });
  const personaRoleOf = (p: Row) => {
    const emp = employment.get(p.id);
    if (!emp) return null;
    const extra = p.hubspot_contact_id ? roleEvidence.get(String(p.hubspot_contact_id)) ?? [] : [];
    const storedTitle = (p.title as string | null) ?? null;
    const r = extra.length ? readRole({ accountName, aliases: empAliases, domains: empCtx.domains, storedTitle, evidence: [...emp.evidence, ...extra], now }) : personaRole(emp, storedTitle, { now, aliases: empAliases, domains: empCtx.domains });
    return roleView(r);
  };
  // HubSpot-only people carry the same read (the CRM field and Apollo's sweep), so a moved person never becomes WHO.
  const hsWithEmployment = hsPeople && !lean
    ? { ...hsPeople, people: hsPeople.people.map((h) => { const e = readHubSpotOnlyEmployment({ accountName, aliases: empAliases, domains: empCtx.domains, props: hsProps.get(h.id)!, now }); const role = readRole({ accountName, aliases: empAliases, domains: empCtx.domains, storedTitle: h.title, crmTitle: h.title, evidence: [...crmEvidence({ company: h.company ?? null, title: h.title, email: null, lastModifiedAt: h.lastModifiedAt ?? null }), ...apolloEvidence({ status: h.apolloEmploymentStatus ?? null, verifiedAt: h.apolloVerifiedAt ?? null, accountName, title: h.title }), ...(roleEvidence.get(h.id) ?? [])], now }); return { ...h, employment: { state: e.state, why: e.why, elsewhere: e.elsewhere ? { company: e.elsewhere.company, title: e.elsewhere.title } : null }, role: roleView(role) }; }) }
    : hsPeople;

  return {
    account: { name: account.name, tier: account.tier ?? null, priorityBand: account.priority_band ?? null, vertical: account.vertical ?? null, parentBrand: account.parent_brand ?? null, hubspotCompanyId: account.hubspot_company_id ?? null, recordUpdatedAt: iso(account.updated_at) },
    aliases: aliasList,
    aliasesAddedAt,
    domains,
    siblings,
    watched: !!profile,
    watchReasons: profile?.reasons ?? [],
    facts: [...byQuote.values()],
    setAsideFactIds: await setAsideP,
    signals: (signalRows as Row[]).map((s) => ({ id: s.id, title: s.title ?? null, url: s.url ?? null, publishedAt: s.published_at ? new Date(s.published_at).toISOString() : null, researchStatus: s.research_status, note: s.note ?? null, capturedAt: iso(s.created_at) })),
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
      problemFamily: typeof h.problem_family === 'string' ? h.problem_family : null,
      // R32: the declared evidence approach (metadata.approach; default event-led), for the person match.
      approach: approachOfHypothesis(h),
      personaId: typeof h.primary_persona_id === 'number' ? h.primary_persona_id : null,
      buyerRejected: buyerRejected.has(h.id),
      // The last time Casey looked: approval, activation, or an explicit "reviewed" after a flag.
      reviewedAt: (h.status === 'approved' || h.status === 'active') && h.reviewed_at ? lastReview(h, acks.get(h.id)) : null,
      reviewAckAt: acks.get(h.id) ? acks.get(h.id)!.toISOString() : null,
    })),
    // R63-A B4 / matrix: whose words, by the person on record at the address (never the address itself).
    bids: confirmed.map((b) => ({ id: b.id, type: b.type, summary: b.normalized_summary ?? b.raw_buyer_language, quote: b.raw_buyer_language, who: speakerName(b.contact_email ?? null), at: new Date(b.confirmed_at ?? b.captured_at).toISOString(), hypothesisId: b.hypothesis_id ?? null, scope: scopeOfBid({ metadata: b.metadata, contactEmail: b.contact_email ?? null }), noted: wordingOf(b.metadata, String(b.raw_buyer_language ?? '')) === 'noted' })),
    personas: (personas as Row[]).map((p) => {
      const emp = employment.get(p.id) ?? null;
      return { id: p.id, name: p.name, title: p.title ?? null, email: p.email ?? null, doNotContact: !!p.do_not_contact, hasEmail: !!p.email, emailStatus: p.email_status ?? null, updatedAt: iso(p.updated_at), hubspotContactId: p.hubspot_contact_id ?? null, apolloEnrichedAt: p.enrichment?.apollo_person_id ? iso(p.enrichment.last_enriched_at) : null, location: p.hubspot_contact_id ? hsById.get(String(p.hubspot_contact_id))?.location ?? null : null, employment: emp ? { state: emp.state, why: emp.why, elsewhere: emp.elsewhere ? { company: emp.elsewhere.company, title: emp.elsewhere.title } : null } : null, role: personaRoleOf(p) };
    }),
    hubspotPeople: hsWithEmployment,
    candidates: (candidates as Row[]).map((c) => ({ id: c.id, name: c.full_name, title: c.title ?? null, state: c.state, seenAt: iso(c.last_seen_at) })),
    // A member whose Persona is do-not-contact is never a way in (relationship context is never consent).
    memberships: (members as Row[]).map((m) => ({ sourceName: m.work_source?.name ?? 'a source', sourceType: m.work_source?.source_type ?? 'other', relationshipContext: m.relationship_context ?? null, personName: m.kind === 'person' ? m.name ?? null : null, title: m.kind === 'person' ? m.title ?? null : null, company: m.company ?? null, addedAt: iso(m.ingested_at), doNotContact: !!(m.persona_id && (personas as Row[]).some((p) => p.id === m.persona_id && p.do_not_contact)) })),
    firstTouches: ((touches as Map<string, Array<{ recipient: string; sentAt: string; released: boolean; outstanding?: boolean; personaId?: number | null; decisionId?: string; gmailDraftId?: string }>>).get(accountName) ?? []).map((t) => ({ recipient: t.recipient, sentAt: t.sentAt, state: t.outstanding ? 'draft outstanding' : t.released ? 'released' : 'sent', personaId: t.personaId ?? null, ...(t.decisionId ? { decisionId: t.decisionId } : {}), ...(t.gmailDraftId ? { gmailDraftId: t.gmailDraftId } : {}) })),
    conversation: conv ? { who: speakerName(conv.who) ?? conv.who, responseClass: conv.responseClass, at: new Date(conv.at).toISOString() } : null,
    opportunity,
    pack: pack as unknown as PackInput | null,
    microsite: micro ? { network: micro.network, freight: micro.freight, sections: micro.sections } : null,
    facilityFact: fact ? { facilityCount: String(fact.facilityCount), status: fact.status === 'verified' ? 'verified' : 'provisional', summary: fact.summary, updatedAt: fact.updatedAt, sources: fact.sources } : null,
    roi,
    scout: scoutOf(candidate),
    family,
    inbound: await inboundP,
    sent: await sentP,
    engagements: await engagementsP,
  };
}

function scoutOf(c: Row | null): AccountInputs['scout'] {
  if (!c) return null;
  const s = (c.scout ?? {}) as Row;
  return { domain: c.domain ?? null, what: s.what ?? null, entityType: c.entity_type ?? null, network: Array.isArray(s.network) ? s.network : [], freight: Array.isArray(s.freight) ? s.freight : [], at: c.scouted_at ? new Date(c.scouted_at).toISOString() : null, basis: s.basis === 'name_rules' ? 'name_rules' : 'web', ambiguous: s.ambiguous === true };
}

/**
 * The brief AND the inputs it was built from (the V2 NOW / BRIEF projections read both). With `context`, the
 * account context's reads (they need only the name) run alongside the inputs instead of after them.
 */
export async function loadAccountView(prisma: PrismaLike, slug: string, now: Date, opts: Parameters<typeof loadAccountInputs>[3] & { name?: string; context?: boolean } = {}): Promise<{ brief: AccountIntelligenceBrief; inputs: AccountInputs; context?: AccountContext } | { collision: string[] } | null> {
  const names = await accountNamesForSlug(prisma, slug);
  const name = opts.name && names.includes(opts.name) ? opts.name : names.length === 1 ? names[0] : null;
  if (!name) return names.length > 1 ? { collision: names } : null;
  const rowsP = opts.context ? fetchAccountContextRows(prisma, name).catch(() => null) : Promise.resolve(null);
  const inputs = await loadAccountInputs(prisma, name, now, opts);
  if (!inputs) return null;
  const rows = await rowsP;
  return { brief: buildAccountBrief(inputs, now), inputs, ...(opts.context ? { context: rows ? projectAccountContext(rows, inputs, now) : await loadAccountContext(prisma, inputs, now) } : {}) };
}

/** The canonical brief for one account (live projection). Null when the slug names no account. */
export async function loadAccountBrief(prisma: PrismaLike, slug: string, now: Date, opts: Parameters<typeof loadAccountInputs>[3] & { name?: string } = {}): Promise<AccountIntelligenceBrief | { collision: string[] } | null> {
  const v = await loadAccountView(prisma, slug, now, opts);
  return v && 'brief' in v ? v.brief : v;
}

/** The last time Casey looked at a thesis: approval, activation, or an explicit review after a flag. */
function lastReview(h: Row, ack: Date | undefined): string {
  const times = [h.reviewed_at, h.activated_at, ack].filter(Boolean).map((d) => new Date(d).getTime());
  return new Date(Math.max(...times)).toISOString();
}
