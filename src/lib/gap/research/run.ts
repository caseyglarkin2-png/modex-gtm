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
import { createResearchRun, upsertEvidenceRecords } from '@/lib/source-backed/evidence';
import { registerSignal } from '../signals/registry';
import { freshnessExpiresAt } from '../signals/freshness';
import type { SignalType } from '../taxonomy';
import { classifyFact, detectConflicts, excerptFoundIn, isPhysicalOpsFact, normalizeForMatch, type FactChange } from './facts';
import { defaultFetchText, edgarCandidates, normalizeCompany, webCandidates, type Candidate, type FetchText } from './providers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type ResearchOutcome = 'evidence_found' | 'insufficient_evidence' | 'conflicting_evidence';

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

export interface ResearchResult {
  runId: string;
  outcome: ResearchOutcome;
  facts: ResearchFact[];
  rejected: Array<{ url: string; reason: string }>;
  conflicts: Array<{ site: string; signalIds: string[] }>;
  notes: string[];
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
}

export interface ResearchDeps {
  edgar?: (accountName: string, now: Date) => Promise<{ candidates: Candidate[]; note: string }>;
  web?: (accountName: string, focus: string) => Promise<{ candidates: Candidate[]; note: string }>;
  fetchText?: FetchText;
}

const hash = (s: string) => createHash('sha256').update(s).digest('hex');

export async function runEvidenceResearch(prisma: PrismaLike, input: ResearchInput, deps: ResearchDeps = {}): Promise<ResearchResult> {
  const notes: string[] = [];
  const providerErrors: Record<string, string> = {};
  const candidates: Candidate[] = [];
  for (const [name, run] of [
    ['edgar', () => (deps.edgar ?? ((a, n) => edgarCandidates(a, n)))(input.accountName, input.now)],
    ['web', () => (deps.web ?? webCandidates)(input.accountName, [input.problemFamily ? `Focus: ${input.problemFamily.replace(/_/g, ' ')}.` : '', input.focus ?? ''].filter(Boolean).join(' '))],
  ] as const) {
    try {
      const r = await run();
      candidates.push(...r.candidates);
      notes.push(`${name}: ${r.note}`);
    } catch (err) {
      providerErrors[name] = err instanceof Error ? err.message : String(err);
      notes.push(`${name}: unavailable (${providerErrors[name]})`);
    }
  }

  // Verify every candidate at its own source (the ONE verification contract, verifyCandidate).
  const ctx = verificationContext(input.accountName, deps.fetchText);
  const accepted: Array<Candidate & { publishedAt: Date }> = [];
  const rejected: Array<{ url: string; reason: string }> = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    const key = normalizeForMatch(c.excerpt);
    if (seen.has(key)) continue;
    const v = await verifyCandidate(c, ctx);
    if (!v.ok) { rejected.push({ url: c.url, reason: v.reason }); continue; }
    seen.add(key);
    accepted.push({ ...c, publishedAt: v.publishedAt });
  }

  // Store: ResearchRun + EvidenceRecord + ProspectingSignal (existing stores).
  const run = await createResearchRun(prisma, {
    accountName: input.accountName,
    personaId: input.personaId,
    status: Object.keys(providerErrors).length === 2 ? 'failed' : Object.keys(providerErrors).length ? 'partial' : 'succeeded',
    runKey: `gap_research:${input.accountName}:${input.personaId ?? 'account'}:${input.now.toISOString()}`,
    providerStatus: { purpose: 'gap_research_this', hypothesisId: input.hypothesisId, decisionId: input.decisionId, problemFamily: input.problemFamily, notes },
    errorMap: providerErrors,
    startedAt: input.now,
    completedAt: new Date(),
  });

  const facts: ResearchFact[] = [];
  for (const a of accepted) {
    facts.push(await storeVerifiedFact(prisma, { runId: run.id, accountName: input.accountName, personaId: input.personaId, candidate: a, actor: input.actor, now: input.now }));
  }

  const conflicts = detectConflicts(facts.map((f) => ({ id: f.signalId, excerpt: f.excerpt, change: f.change }))).map((c) => ({ site: c.site, signalIds: c.ids }));
  const outcome: ResearchOutcome = conflicts.length > 0 ? 'conflicting_evidence' : facts.some((f) => f.fresh) ? 'evidence_found' : 'insufficient_evidence';

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
        conflicts,
        // The full result, so a thesis research run is reused instead of repeated.
        result: JSON.parse(JSON.stringify({ runId: run.id, outcome, facts, rejected, conflicts, notes })),
      },
    },
  });
  await prisma.gapAuditEvent.create({
    data: { kind: 'research.completed', actor: input.actor, subject_type: 'research_run', subject_id: run.id, payload: { outcome, accountName: input.accountName, personaId: input.personaId, hypothesisId: input.hypothesisId, facts: facts.length, rejected: rejected.length } },
  });

  return { runId: run.id, outcome, facts, rejected, conflicts, notes };
}

export interface VerificationContext {
  accountKey: string;
  fetchText: FetchText;
  /** One fetch per URL per run. */
  pages: Map<string, string | Error>;
}

export function verificationContext(accountName: string, fetchText?: FetchText): VerificationContext {
  return { accountKey: normalizeCompany(accountName).split(' ')[0], fetchText: fetchText ?? defaultFetchText, pages: new Map() };
}

/**
 * THE verification contract for a public fact, whoever proposed it (EDGAR,
 * web research, or Casey typing a URL and a sentence). Accepted only if it is
 * dated, states a physical-operations change, and its excerpt is found
 * verbatim at its own URL; a non-EDGAR page must also name the account.
 * Nothing else mints the `excerpt_found_at_source` stamp: storeVerifiedFact
 * is only ever called with a candidate that passed here.
 */
export async function verifyCandidate(c: Candidate, ctx: VerificationContext): Promise<{ ok: true; publishedAt: Date } | { ok: false; reason: string }> {
  if (!c.excerpt?.trim()) return { ok: false, reason: 'no_excerpt' };
  if (!c.publishedAt || Number.isNaN(c.publishedAt.getTime())) return { ok: false, reason: 'no_publication_date' };
  if (!isPhysicalOpsFact(c.excerpt)) return { ok: false, reason: 'not_a_physical_operations_fact' };
  if (!ctx.pages.has(c.url)) {
    try { ctx.pages.set(c.url, await ctx.fetchText(c.url)); } catch (err) { ctx.pages.set(c.url, err instanceof Error ? err : new Error(String(err))); }
  }
  const page = ctx.pages.get(c.url)!;
  if (page instanceof Error) return { ok: false, reason: `source_unreadable:${page.message}` };
  if (!excerptFoundIn(c.excerpt, page)) return { ok: false, reason: 'excerpt_not_found_at_source' };
  if (c.provider !== 'edgar' && !normalizeForMatch(page).includes(ctx.accountKey)) return { ok: false, reason: 'page_does_not_name_account' };
  return { ok: true, publishedAt: c.publishedAt };
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
  const expires = freshnessExpiresAt(cls.type, a.publishedAt);
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
    metadata: { researchRunId: input.runId, retrievedAt: input.now.toISOString(), provider: a.provider, change: cls.change, verified: 'excerpt_found_at_source' },
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
