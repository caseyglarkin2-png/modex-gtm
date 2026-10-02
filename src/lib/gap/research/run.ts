/**
 * RESEARCH THIS: the evidence-acquisition run (last mile, 2026-09-25).
 *
 * Input: the card's account, person, problem family and current hypothesis.
 * Output: exactly one of
 *
 *   evidence_found         at least one FRESH, verified physical-operations fact
 *   insufficient_evidence  no defensible outreach trigger found (a success)
 *   conflicting_evidence   the same named site is described moving both ways
 *
 * Every candidate, from any provider, is re-fetched from its own URL and
 * accepted only if its excerpt is there verbatim, it is dated, it states a
 * physical-operations change, and (for web pages) the page names the account.
 * Accepted facts are stored through the EXISTING stores, no new database:
 * a ResearchRun (outcome + provider notes), one EvidenceRecord per fact
 * (verbatim claim, source URL/title, publication date, provider, retrieved
 * time), and one ProspectingSignal per fact (source_kind evidence_record,
 * evidence_text = the excerpt, freshness from the type TTL). Stale facts are
 * stored for the record but never counted as a trigger.
 *
 * It never creates, edits, approves or activates a hypothesis. Proposing one
 * is a separate human click (propose.ts).
 */
import { createHash } from 'node:crypto';
import { classifyContinuity } from './continuity';
import { establishContinuity, currentnessFocus, type ContinuityOutcome } from './continuity-store';
import { createResearchRun, upsertEvidenceRecords } from '@/lib/source-backed/evidence';
import { registerSignal } from '../signals/registry';
import { freshnessExpiresAt } from '../signals/freshness';
import type { SignalType } from '../taxonomy';
import { classifyFact, detectConflicts, excerptFoundIn, isPhysicalOpsFact, normalizeForMatch, pageSentenceFor, statedEventDate, type FactChange, describesPastEvent } from './facts';
import { datelineDate, defaultFetchPage, edgarCandidates, hostBelongsToAccount, normalizeCompany, webCandidates, type Candidate, type FetchPage } from './providers';
import type { PageResult } from '../signals/research';
import { WEAK_SOURCE, speakerOrg, textNamesAccount } from './claim-rules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/**
 * Why a proposal did not become a verified fact, as a class a person can act on: the internet has no good fact
 * (UNDATED, NOT_PHYSICAL_OPERATIONS, STALE_EVENT, WRONG_ACCOUNT) versus search chose badly (SOURCE_TOO_WEAK,
 * SOURCE_FETCH_BLOCKED, EXCERPT_NOT_FOUND, REANCHOR_TOO_WEAK) versus infrastructure (PROVIDER_UNAVAILABLE).
 */
export type FailureClass = 'SOURCE_FETCH_BLOCKED' | 'SOURCE_NOT_FOUND' | 'EXCERPT_NOT_FOUND' | 'REANCHOR_TOO_WEAK' | 'WRONG_ACCOUNT' | 'NOT_PHYSICAL_OPERATIONS' | 'STALE_EVENT' | 'BOILERPLATE' | 'CONTRADICTED' | 'UNDATED' | 'SOURCE_TOO_WEAK' | 'PROVIDER_UNAVAILABLE' | 'OTHER';
export function failureClass(reason: string): FailureClass {
  if (/^source_unreadable:fetch (401|403|429|451)\b/.test(reason)) return 'SOURCE_FETCH_BLOCKED';
  if (/^source_unreadable:(?:fetch (?:404|410)\b|no_readable_text)/.test(reason)) return 'SOURCE_NOT_FOUND';
  if (reason.startsWith('source_unreadable')) return 'SOURCE_FETCH_BLOCKED';
  const map: Record<string, FailureClass> = {
    excerpt_not_found_at_source: 'EXCERPT_NOT_FOUND',
    reanchor_too_weak: 'REANCHOR_TOO_WEAK',
    page_does_not_name_account: 'WRONG_ACCOUNT',
    sentence_does_not_name_account: 'WRONG_ACCOUNT',
    quoted_third_party: 'WRONG_ACCOUNT',
    not_a_physical_operations_fact: 'NOT_PHYSICAL_OPERATIONS',
    describes_past_event: 'STALE_EVENT',
    no_publication_date: 'UNDATED',
    source_too_weak: 'SOURCE_TOO_WEAK',
    boilerplate: 'BOILERPLATE',
  };
  return map[reason] ?? 'OTHER';
}

/** Search redirects, snippets, aggregators and mirrors: never a source a fact can be verified at. */
// WEAK_SOURCE lives in claim-rules.ts (shared with the stored-fact gate and the redirect resolver).

/** provider_unavailable: the web search could not run and nothing fresh was found. Retryable, never an answer. */
export type ResearchOutcome = 'evidence_found' | 'insufficient_evidence' | 'conflicting_evidence' | 'provider_unavailable';

export interface ResearchFact {
  signalId: string;
  evidenceRecordId: string;
  excerpt: string;
  url: string;
  title: string;
  publishedAt: string;
  retrievedAt: string;
  provider: Candidate['provider'];
  type: SignalType;
  change: FactChange;
  fresh: boolean;
}

/**
 * Research aperture: every page a run looked at, kept with its provenance whether or not it yielded an outreach
 * fact. A source is what GAP found; a verified fact is what Casey may state. Failing the evidence contract never
 * makes a source disappear: it is recorded with the factual reason.
 */
export interface SourceRecord {
  url: string;
  title: string | null;
  publishedAt: string | null;
  /** verbatim: the page's own sentence; search_summary: a search model's paraphrase that did not verify; typed: Casey's own words. */
  excerpt: string | null;
  excerptKind: 'verbatim' | 'search_summary' | 'typed' | null;
  provider: string;
  status: 'verified' | 'not_verified' | 'could_not_verify';
  /** The raw verification reason (failureClass vocabulary), or no_fact_sentence / not_read_budget. */
  reason: string | null;
}

const RANK: Record<SourceRecord['status'], number> = { verified: 3, not_verified: 2, could_not_verify: 1 };

export function recordSource(map: Map<string, SourceRecord>, r: SourceRecord): void {
  const cur = map.get(r.url);
  if (!cur || RANK[r.status] > RANK[cur.status] || (RANK[r.status] === RANK[cur.status] && !cur.excerpt && r.excerpt)) map.set(r.url, { ...r, title: r.title ?? cur?.title ?? null, publishedAt: r.publishedAt ?? cur?.publishedAt ?? null });
}

function sourceFromCandidate(c: Candidate, v: { ok: true; excerpt: string } | { ok: false; reason: string }): SourceRecord {
  const could = !v.ok && v.reason.startsWith('source_unreadable');
  return {
    url: c.url,
    title: c.title && c.title !== c.url ? c.title.slice(0, 300) : null,
    publishedAt: c.publishedAt && !Number.isNaN(c.publishedAt.getTime()) ? c.publishedAt.toISOString() : null,
    excerpt: (v.ok ? v.excerpt : c.excerpt)?.slice(0, 600) || null,
    excerptKind: v.ok ? 'verbatim' : c.provider === 'web' ? 'search_summary' : c.provider === 'manual' ? 'typed' : 'verbatim',
    provider: c.provider,
    status: v.ok ? 'verified' : could ? 'could_not_verify' : 'not_verified',
    reason: v.ok ? null : v.reason,
  };
}

export interface ResearchResult {
  runId: string;
  outcome: ResearchOutcome;
  facts: ResearchFact[];
  rejected: Array<{ url: string; reason: string }>;
  /** Every page this run looked at, with provenance and its evidence status (research aperture). */
  sources?: SourceRecord[];
  conflicts: Array<{ site: string; signalIds: string[] }>;
  notes: string[];
  /** Evidence continuity over the account's verified facts after this run (corroborated, superseded, still seeking). */
  continuity?: ContinuityOutcome;
}

export interface ResearchInput {
  accountName: string;
  personaId: number | null;
  hypothesisId: string | null;
  problemFamily: string | null;
  decisionId: string | null;
  actor: string;
  now: Date;
  /** Extra run context kept on the ResearchRun (e.g. the sibling thesis fingerprint). */
  context?: Record<string, unknown>;
  /** Extra search focus for the web provider (Phase 2 B1: the fresh trigger headline). Candidates are still verified at their own source. */
  focus?: string;
  /** Evidence continuity case H: when an ongoing fact nears its own clock uncorroborated, make ONE focused web call. Default on. */
  seekCurrentness?: boolean;
}

export interface ResearchDeps {
  edgar?: (accountName: string, now: Date) => Promise<{ candidates: Candidate[]; note: string }>;
  web?: (accountName: string, focus: string) => Promise<{ candidates: Candidate[]; note: string; sources?: string[] }>;
  /** The SSRF-safe page reader for the pages the web search cited (signals/intake makeFetchHtml by default). */
  fetchHtml?: (url: string) => Promise<string>;
  /** Read the pages the web search cited and propose their own verbatim sentences (default on). */
  sourcePages?: boolean;
  fetchText?: FetchPage;
  /**
   * Signal Intelligence B: extra candidates from the pages of the signals being followed up, with the page text
   * this run fetched (SSRF-safe). They pass the SAME verifyCandidate contract as every other candidate.
   */
  extra?: () => Promise<{ candidates: Candidate[]; note: string; pages?: Map<string, string> }>;
}

const hash = (s: string) => createHash('sha256').update(s).digest('hex');

export async function runEvidenceResearch(prisma: PrismaLike, input: ResearchInput, deps: ResearchDeps = {}): Promise<ResearchResult> {
  const notes: string[] = [];
  const providerErrors: Record<string, string> = {};
  const candidates: Candidate[] = [];
  const seededPages = new Map<string, string>();
  const pageResults: PageResult[] = [];
  let webSources: string[] = [];
  const providers: Array<readonly [string, () => Promise<{ candidates: Candidate[]; note: string; pages?: Map<string, string>; pageResults?: PageResult[] }>]> = [
    ['edgar', () => (deps.edgar ?? ((a, n) => edgarCandidates(a, n)))(input.accountName, input.now)],
    ['web', async () => {
      const r = await (deps.web ?? webCandidates)(input.accountName, [input.problemFamily ? `Focus: ${input.problemFamily.replace(/_/g, ' ')}.` : '', input.focus ?? ''].filter(Boolean).join(' '));
      webSources = r.sources ?? [];
      return r;
    }],
    // The search only LOCATES pages: GAP reads the cited pages itself and proposes their own verbatim sentences
    // that name the account (dated by the page's article date), through the same verification contract.
    ['sources', async () => {
      const readable = webSources.filter((u) => !WEAK_SOURCE.test(u));
      const pages = readable.slice(0, 6);
      // A cited page past the read budget is still a source GAP found (not read this run).
      for (const url of readable.slice(6)) pageResults.push({ url, title: null, publishedAt: null, outcome: 'not_read', sentences: 0 });
      if (deps.sourcePages === false || !pages.length) return { candidates: [], note: 'no cited pages to read' };
      const { signalCandidates } = await import('../signals/research');
      const r = await signalCandidates(pages.map((url, i) => ({ id: `cited${i + 1}`, url, title: null, published_at: null, source_class: '', resolution_basis: null, event_id: null })), { fetchHtml: deps.fetchHtml, accountName: input.accountName });
      return { ...r, note: `${r.candidates.length} sentences from ${pages.length} cited pages` };
    }],
    ...(deps.extra ? [['signal', deps.extra] as const] : []),
  ];
  for (const [name, run] of providers) {
    try {
      const r = await run();
      candidates.push(...r.candidates);
      for (const [u, t] of r.pages ?? []) seededPages.set(u, t);
      pageResults.push(...(r.pageResults ?? []));
      notes.push(`${name}: ${r.note}`);
    } catch (err) {
      providerErrors[name] = err instanceof Error ? err.message : String(err);
      notes.push(`${name}: unavailable (${providerErrors[name]})`);
    }
  }

  // Verify every candidate at its own source (the ONE verification contract, verifyCandidate).
  const ctx = verificationContext(input.accountName, deps.fetchText);
  // The signal page text this run already fetched safely is the source it is verified against.
  for (const [u, t] of seededPages) ctx.pages.set(u, t);
  const accepted: Array<Candidate & { publishedAt: Date }> = [];
  const rejected: Array<{ url: string; reason: string }> = [];
  const sources = new Map<string, SourceRecord>();
  // Pages read with no candidate sentence, unreadable, or not read: sources all the same, with the reason.
  for (const p of pageResults) {
    if (p.outcome === 'read' && p.sentences > 0) continue;
    recordSource(sources, {
      url: p.url,
      title: p.title,
      publishedAt: p.publishedAt && !Number.isNaN(p.publishedAt.getTime()) ? p.publishedAt.toISOString() : null,
      excerpt: null,
      excerptKind: null,
      provider: 'page',
      status: p.outcome === 'read' ? 'not_verified' : 'could_not_verify',
      reason: p.reason ?? (p.outcome === 'read' ? 'no_fact_sentence' : p.outcome === 'not_read' ? 'not_read_budget' : `source_unreadable:${p.error ?? 'fetch failed'}`),
    });
  }
  const seen = new Set<string>();
  const unreachable: Candidate[] = [];
  for (const c of candidates) {
    const key = normalizeForMatch(c.excerpt);
    // Syndicated copy of a statement already checked is still a page that carried the story.
    if (seen.has(key)) { recordSource(sources, sourceFromCandidate(c, { ok: false, reason: 'same_statement_as_other_source' })); continue; }
    const v = await verifyCandidate(c, ctx);
    recordSource(sources, sourceFromCandidate(c, v));
    if (!v.ok) {
      rejected.push({ url: c.url, reason: v.reason });
      const k = failureClass(v.reason);
      if (c.provider === 'web' && (k === 'SOURCE_FETCH_BLOCKED' || k === 'SOURCE_NOT_FOUND')) unreachable.push(c);
      continue;
    }
    seen.add(key);
    seen.add(normalizeForMatch(v.excerpt));
    accepted.push({ ...c, excerpt: v.excerpt, publishedAt: v.publishedAt });
  }
  // A blocked or unreadable page is an inaccessible SOURCE, not a false fact: one focused search for another
  // accessible page stating the same event (at most two per run), and it must still pass the same verification.
  let alternates = 0;
  for (const c of unreachable.slice(0, 2)) {
    let host = '';
    try { host = new URL(c.url).hostname.replace(/^www\./, ''); } catch { /* keep empty */ }
    try {
      const r = await (deps.web ?? webCandidates)(input.accountName, `Find ONE other accessible source (${input.accountName}'s own announcement, a filing, a government release or a credible publication) that states this event: "${c.excerpt}". Do not use ${host || 'the same site'}.`);
      for (const alt of r.candidates.filter((a) => { try { return new URL(a.url).hostname.replace(/^www\./, '') !== host; } catch { return false; } }).slice(0, 2)) {
        const v = await verifyCandidate(alt, ctx);
        recordSource(sources, sourceFromCandidate(alt, v));
        if (!v.ok) { rejected.push({ url: alt.url, reason: v.reason }); continue; }
        const k2 = normalizeForMatch(v.excerpt);
        if (seen.has(k2)) continue;
        seen.add(k2);
        accepted.push({ ...alt, excerpt: v.excerpt, publishedAt: v.publishedAt });
        alternates += 1;
        break;
      }
    } catch (err) {
      notes.push(`alternate source: unavailable (${err instanceof Error ? err.message : String(err)})`);
    }
  }
  if (unreachable.length) notes.push(`alternate source: ${alternates} of ${Math.min(unreachable.length, 2)} blocked facts found elsewhere`);

  // Store: ResearchRun + EvidenceRecord + ProspectingSignal (existing stores).
  const run = await createResearchRun(prisma, {
    accountName: input.accountName,
    personaId: input.personaId,
    status: Object.keys(providerErrors).length >= 2 && Object.keys(providerErrors).length === providers.length ? 'failed' : Object.keys(providerErrors).length ? 'partial' : 'succeeded',
    runKey: `gap_research:${input.accountName}:${input.personaId ?? 'account'}:${input.now.toISOString()}`,
    providerStatus: { purpose: 'gap_research_this', hypothesisId: input.hypothesisId, decisionId: input.decisionId, problemFamily: input.problemFamily, ...(input.context ?? {}), notes },
    errorMap: providerErrors,
    startedAt: input.now,
    completedAt: new Date(),
  });

  const facts: ResearchFact[] = [];
  for (const a of accepted) {
    facts.push(await storeVerifiedFact(prisma, { runId: run.id, accountName: input.accountName, personaId: input.personaId, candidate: a, actor: input.actor, now: input.now }));
  }

  // EVIDENCE CONTINUITY over the account's verified facts (this run's and earlier runs').
  let continuity = await establishContinuity(prisma, { accountName: input.accountName, actor: input.actor, now: input.now });
  if (continuity.seeking.length > 0 && input.seekCurrentness !== false) {
    // Case H: an ongoing fact is never called fresh on its own wording; look ONCE for newer corroboration.
    const focus = currentnessFocus(input.accountName, continuity.seeking, input.now);
    try {
      const r = await (deps.web ?? webCandidates)(input.accountName, focus);
      notes.push(`currentness: ${r.note}`);
      for (const c of r.candidates) {
        const key = normalizeForMatch(c.excerpt);
        if (seen.has(key)) { recordSource(sources, sourceFromCandidate(c, { ok: false, reason: 'same_statement_as_other_source' })); continue; }
        const v = await verifyCandidate(c, ctx);
        recordSource(sources, sourceFromCandidate(c, v));
        if (!v.ok) { rejected.push({ url: c.url, reason: v.reason }); continue; }
        seen.add(key);
        seen.add(normalizeForMatch(v.excerpt));
        facts.push(await storeVerifiedFact(prisma, { runId: run.id, accountName: input.accountName, personaId: input.personaId, candidate: { ...c, excerpt: v.excerpt, publishedAt: v.publishedAt }, actor: input.actor, now: input.now }));
      }
      continuity = await establishContinuity(prisma, { accountName: input.accountName, actor: input.actor, now: input.now });
    } catch (err) {
      notes.push(`currentness: unavailable (${err instanceof Error ? err.message : String(err)})`);
    }
  }

  const conflicts = detectConflicts(facts.map((f) => ({ id: f.signalId, excerpt: f.excerpt, change: f.change }))).map((c) => ({ site: c.site, signalIds: c.ids }));
  const outcome: ResearchOutcome = conflicts.length > 0 ? 'conflicting_evidence' : facts.some((f) => f.fresh) ? 'evidence_found' : providerErrors.web ? 'provider_unavailable' : 'insufficient_evidence';

  await prisma.researchRun.update({
    where: { id: run.id },
    data: {
      provider_status: {
        purpose: 'gap_research_this',
        hypothesisId: input.hypothesisId,
        decisionId: input.decisionId,
        problemFamily: input.problemFamily,
        ...(input.context ?? {}),
        notes,
        outcome,
        facts: facts.length,
        freshFacts: facts.filter((f) => f.fresh).length,
        rejected: rejected.length,
        // Why the rest failed, as classes and by source site (the yield diagnosis).
        rejectionClasses: rejected.reduce<Record<string, number>>((m, r) => ((m[failureClass(r.reason)] = (m[failureClass(r.reason)] ?? 0) + 1), m), {}),
        rejectionDomains: rejected.reduce<Record<string, number>>((m, r) => {
          const d = (() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return 'invalid'; } })();
          return ((m[d] = (m[d] ?? 0) + 1), m);
        }, {}),
        conflicts,
        continuity: JSON.parse(JSON.stringify(continuity)),
        // The full result, so a thesis research run is reused instead of repeated.
        sources: sources.size,
        result: JSON.parse(JSON.stringify({ runId: run.id, outcome, facts, rejected, sources: [...sources.values()], conflicts, notes, continuity })),
      },
    },
  });
  await prisma.gapAuditEvent.create({
    data: { kind: 'research.completed', actor: input.actor, subject_type: 'research_run', subject_id: run.id, payload: { outcome, accountName: input.accountName, personaId: input.personaId, hypothesisId: input.hypothesisId, facts: facts.length, rejected: rejected.length } },
  });

  return { runId: run.id, outcome, facts, rejected, sources: [...sources.values()], conflicts, notes, continuity };
}

export interface VerificationContext {
  accountKey: string;
  fetchText: FetchPage;
  /** One fetch per URL per run. */
  pages: Map<string, string | Error>;
  /** The page's own article date (metadata), when the fetch read one. */
  pageDates: Map<string, Date | null>;
}

export function verificationContext(accountName: string, fetchText?: FetchPage): VerificationContext {
  // Signal Intelligence final review P1: the FULL normalized name, matched as whole words. The first token
  // ("general" for General Mills, "home" for The Home Depot, "h" for H-E-B) matched other companies' pages.
  return { accountKey: normalizeCompany(accountName), fetchText: fetchText ?? defaultFetchPage, pages: new Map(), pageDates: new Map() };
}

// The pure claim rules live in claim-rules.ts (shared with the strict outreach gate); re-exported here.
export { liveFactFailure, speakerOrg, textNamesAccount } from './claim-rules';

/**
 * The account is the SUBJECT of the sentence, not a party mentioned around someone else's fact: it is named
 * near the start (after an optional "The", a date or a dateline), never after "unlike", "than", "with", "to" or
 * "a/an", and never as "<account> rival / supplier / customer / partner". "Walmart, a Kroger rival, opened ...",
 * "Kroger supplier Acme opened ..." and "Unlike Kroger, Albertsons ..." are not Kroger's facts.
 */
export function accountIsSubject(sentence: string, accountKey: string): boolean {
  if (!accountKey) return false;
  const words = sentence.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  const key = accountKey.split(' ');
  let at = -1;
  for (let i = 0; i + key.length <= words.length; i++) if (key.every((k, j) => words[i + j] === k)) { at = i; break; }
  if (at < 0) return false;
  // "<partner> moves freight for <account>": the account's own operation, run by a partner ("Gatik moves freight
  // for PepsiCo across 250 retail locations"). Only "for" right before the account; rivals and suppliers stay out.
  if (words[at - 1] === 'for' && at <= 15) return !/\b(rival|competitor|supplier|unlike|competes)\b/.test(words.slice(0, at).join(' '));
  if (at > 8) return false;
  const before = words.slice(Math.max(0, at - 2), at);
  if (before.some((w) => /^(unlike|than|with|to|a|an|like|versus|vs|from|by|against|beat|beats)$/.test(w))) return false;
  const after = words.slice(at + key.length, at + key.length + 2).join(' ');
  if (/^(s )?(rival|rivals|competitor|competitors|supplier|suppliers|customer|customers|partner|partners|vendor|vendors|client|clients)\b/.test(after)) return false;
  // Everything before the account is a date or an opener, never another company's clause.
  const lead = words.slice(0, at).join(' ');
  return !lead || /^(?:the|on|in|as of|by|during|after|following|earlier|today|this|last|(?:january|february|march|april|may|june|july|august|september|october|november|december)|\d{1,4}|[a-z]+ \d{1,2}|,| )+$/.test(lead + ' ') || /^(on|in) /.test(lead);
}

/**
 * THE verification contract for a public fact, whoever proposed it (EDGAR,
 * web research, or Casey typing a URL and a sentence). Accepted only if it is
 * dated, states a physical-operations change, and its excerpt is found
 * verbatim at its own URL; a non-EDGAR page must also name the account.
 * Nothing else mints the `excerpt_found_at_source` stamp: storeVerifiedFact
 * is only ever called with a candidate that passed here.
 */
export async function verifyCandidate(c: Candidate, ctx: VerificationContext): Promise<{ ok: true; publishedAt: Date; excerpt: string } | { ok: false; reason: string }> {
  if (!c.excerpt?.trim()) return { ok: false, reason: 'no_excerpt' };
  // A web search model's proposal is a summary; the gates run on what is STORED (the page's own sentence) below.
  // Every other proposer's excerpt is already the text that would be stored.
  const web = c.provider === 'web';
  // A web proposal's date is the model's claim: it is dated by its page below. Every other proposer dates its own.
  if (!web && (!c.publishedAt || Number.isNaN(c.publishedAt.getTime()))) return { ok: false, reason: 'no_publication_date' };
  if (!web && !isPhysicalOpsFact(c.excerpt)) return { ok: false, reason: 'not_a_physical_operations_fact' };
  // Quality review: a past-year event restated in a newer source is not dated by the source.
  if (!web && classifyContinuity(c.excerpt) === 'event' && describesPastEvent(c.excerpt, c.publishedAt!)) return { ok: false, reason: 'describes_past_event' };
  if (WEAK_SOURCE.test(c.url)) return { ok: false, reason: 'source_too_weak' };
  if (!ctx.pages.has(c.url)) {
    try {
      const got = await ctx.fetchText(c.url);
      ctx.pages.set(c.url, typeof got === 'string' ? got : got.text);
      ctx.pageDates.set(c.url, typeof got === 'string' ? null : got.publishedAt);
    } catch (err) {
      ctx.pages.set(c.url, err instanceof Error ? err : new Error(String(err)));
    }
  }
  const page = ctx.pages.get(c.url)!;
  if (page instanceof Error) return { ok: false, reason: `source_unreadable:${page.message}` };
  // Soak P1 (truth): a web fact is dated by its PAGE (article metadata, else a dateline naming the account), never
  // by the search model's claim; a page with no date of its own is not verified.
  const publishedAt = web ? (ctx.pageDates.get(c.url) ?? datelineDate(page, ctx.accountKey)) : c.publishedAt!;
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return { ok: false, reason: 'no_publication_date' };
  // A web search model restates what it read: its proposal may be re-anchored to the page's OWN sentence (same
  // facts, same numbers), and that verbatim sentence is what is stored. EDGAR, signal and hand-typed facts stay
  // strictly verbatim.
  let excerpt = c.excerpt;
  if (!excerptFoundIn(excerpt, page)) {
    // A script-rendered or empty page has no readable text to verify against (a source problem, not a false fact).
    if (page.replace(/\s+/g, ' ').trim().length < 25) return { ok: false, reason: 'source_unreadable:no_readable_text' };
    const own = c.provider === 'web' ? pageSentenceFor(excerpt, page) : null;
    // A web proposal the page does not state closely enough (or states differently) is a weak reanchor.
    if (!own) return { ok: false, reason: !web ? 'excerpt_not_found_at_source' : isPhysicalOpsFact(c.excerpt) ? 'reanchor_too_weak' : 'not_a_physical_operations_fact' };
    // The page's sentence must be about THIS account (a roundup page can hold a competitor's sentence).
    if (!textNamesAccount(own, ctx.accountKey)) return { ok: false, reason: 'sentence_does_not_name_account' };
    excerpt = own;
  }
  // The stored sentence itself must be a physical-operations fact that is current for its source date.
  if (web && !isPhysicalOpsFact(excerpt)) return { ok: false, reason: 'not_a_physical_operations_fact' };
  if (web && classifyContinuity(excerpt) === 'event' && describesPastEvent(excerpt, publishedAt)) return { ok: false, reason: 'describes_past_event' };
  if (c.provider !== 'edgar' && !textNamesAccount(page, ctx.accountKey)) return { ok: false, reason: 'page_does_not_name_account' };
  // A sentence taken from a signal's own page must itself name the account (a competitor's paragraph on the
  // same page is not this account's fact).
  // Every sentence GAP did not take from the account's own filing must be ABOUT the account: named as the subject
  // (a verbatim roundup sentence or a cited page can hold a competitor's or supplier's fact).
  // On the account's OWN site, "We ...", "Our ..." and "The company ..." are the account speaking about itself.
  const selfSubject = hostBelongsToAccount(c.url, ctx.accountKey) && /^(?:we|our|the company)\b/i.test(excerpt.trim());
  // Somebody quoted: the fact is the speaker's organization's ("... that's what we're doing with PepsiCo," said the
  // CEO of Gatik). The account's own executive quoted is the account speaking.
  const speaker = speakerOrg(excerpt, c.url);
  if (speaker && !textNamesAccount(speaker, ctx.accountKey)) return { ok: false, reason: 'quoted_third_party' };
  if ((c.provider === 'signal' || c.provider === 'web') && !selfSubject && !speaker && !(textNamesAccount(excerpt, ctx.accountKey) && accountIsSubject(excerpt, ctx.accountKey))) return { ok: false, reason: 'sentence_does_not_name_account' };
  return { ok: true, publishedAt, excerpt };
}


/** Store one VERIFIED candidate through the existing stores: EvidenceRecord + an evidence_record ProspectingSignal. */
export async function storeVerifiedFact(
  prisma: PrismaLike,
  input: { runId: string; accountName: string; personaId: number | null; candidate: Candidate & { publishedAt: Date }; actor: string; now: Date },
): Promise<ResearchFact> {
  const a = input.candidate;
  const cls = classifyFact(a.excerpt);
  const claimHash = hash(normalizeForMatch(a.excerpt));
  await upsertEvidenceRecords(prisma, input.runId, [{
    accountName: input.accountName,
    personaId: input.personaId,
    claim: a.excerpt,
    claimHash,
    sourceUrl: a.url,
    sourceTitle: a.title,
    sourceType: a.sourceType,
    provider: `gap_research:${a.provider}`,
    observedAt: a.publishedAt,
    deterministicKey: `gap_research:${input.accountName}:${claimHash.slice(0, 16)}`,
    metadata: { retrievedAt: input.now.toISOString(), excerpt: a.excerpt, change: cls.change, signalType: cls.type, verified: 'excerpt_found_at_source' },
  }]);
  const record = await prisma.evidenceRecord.findUnique({
    where: { account_name_claim_hash_source_url_observed_at: { account_name: input.accountName, claim_hash: claimHash, source_url: a.url, observed_at: a.publishedAt } },
    select: { id: true },
  });
  // The evidence clock runs from the event the sentence states when a later source restates it.
  const eventDate = statedEventDate(a.excerpt, a.publishedAt);
  const expires = freshnessExpiresAt(cls.type, eventDate ?? a.publishedAt);
  const signal = await registerSignal(prisma, {
    accountName: input.accountName,
    personaId: input.personaId,
    sourceKind: 'evidence_record',
    sourceId: record.id,
    type: cls.type,
    title: a.title,
    summary: null,
    sourceType: a.sourceType,
    evidenceUrl: a.url,
    evidenceText: a.excerpt,
    externalOk: true,
    observedAt: a.publishedAt,
    confidence: a.sourceType === 'public_primary' ? 80 : 60,
    freshnessExpiresAt: expires,
    metadata: { researchRunId: input.runId, retrievedAt: input.now.toISOString(), provider: a.provider, change: cls.change, verified: 'excerpt_found_at_source', ...(eventDate ? { eventDate: eventDate.toISOString().slice(0, 10) } : {}) },
    registeredBy: input.actor,
  });
  return {
    signalId: signal.id,
    evidenceRecordId: record.id,
    excerpt: a.excerpt,
    url: a.url,
    title: a.title,
    publishedAt: a.publishedAt.toISOString(),
    retrievedAt: input.now.toISOString(),
    provider: a.provider,
    type: cls.type,
    change: cls.change,
    fresh: expires.getTime() > input.now.getTime(),
  };
}
