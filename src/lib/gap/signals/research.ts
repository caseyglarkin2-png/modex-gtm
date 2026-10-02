/**
 * SIGNAL -> RESEARCH (GAP Signal Intelligence B).
 *
 * A signal Casey shared (or a strong discovered one) is FOLLOWED UP by the
 * existing evidence research (research/run.ts runEvidenceResearch). This module
 * adds only:
 *   signalCandidates   sentences from the signal's OWN page (fetched SSRF-safe,
 *                      dated by the page's publication date) proposed as
 *                      candidates. They pass the SAME verifyCandidate contract
 *                      as EDGAR and web candidates: verbatim at the source,
 *                      dated, a physical-network change, naming the account.
 *   signalFocus        the web search is told which story to find the primary
 *                      source for.
 *   settleSignals      what research concluded FOR EACH SIGNAL: fact_found
 *                      (a verified fact from its own page, or one that shares
 *                      the story's specific words), contradiction, or
 *                      no_usable_fact. Honest: an unrelated fact about the same
 *                      account never marks a signal "fact ready".
 * Research never links evidence to a hypothesis, never changes a hypothesis,
 * never drafts, enrolls or sends. Settling writes the GapSignal row only.
 */
import { datelineDate, hostBelongsToAccount, type Candidate } from '../research/providers';
import type { ResearchResult } from '../research/run';
import { classifyFact, extractFactSentences, htmlToText } from '../research/facts';
import { defaultFetchHtml, normalizeSignalUrl, parseSignalMeta, type FetchHtml } from './intake';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface ResearchableSignal {
  id: string;
  url: string | null;
  title: string | null;
  published_at: Date | string | null;
  source_class: string;
  resolution_basis: string | null;
  event_id: string | null;
}

const PRIMARY_CLASSES = new Set(['press_release', 'sec_filing']);
const PRIMARY_BASIS = new Set(['company_newsroom', 'domain']);

/** At most this many signal pages per research run, and this much time reading them (final review: a run hit the 300s limit). */
export const SIGNAL_PAGES_PER_RUN = 3;
export const SIGNAL_PAGES_BUDGET_MS = 25_000;

/** What happened to each page a run was asked to read: read (with how many candidate sentences), unreadable, or not read. */
export interface PageResult {
  url: string;
  title: string | null;
  publishedAt: Date | null;
  outcome: 'read' | 'unreadable' | 'not_read';
  sentences: number;
  error?: string;
  /** Why it yielded no candidate, when the producer knows (e.g. excerpt_too_short). */
  reason?: string;
}

export async function signalCandidates(signals: readonly ResearchableSignal[], deps: { fetchHtml?: FetchHtml; clock?: () => number; accountName?: string } = {}): Promise<{ candidates: Candidate[]; note: string; pages: Map<string, string>; pageResults: PageResult[] }> {
  const fetchHtml = deps.fetchHtml ?? defaultFetchHtml;
  const clock = deps.clock ?? Date.now;
  const started = clock();
  const candidates: Candidate[] = [];
  const pages = new Map<string, string>();
  const notes: string[] = [];
  const pageResults: PageResult[] = [];
  let read = 0;
  for (const s of signals) {
    if (!s.url) continue;
    if (read >= SIGNAL_PAGES_PER_RUN || clock() - started > SIGNAL_PAGES_BUDGET_MS) {
      notes.push(`${s.id}: page not read this run (page budget)`);
      pageResults.push({ url: s.url, title: s.title, publishedAt: s.published_at ? new Date(s.published_at) : null, outcome: 'not_read', sentences: 0 });
      continue;
    }
    read += 1;
    let text: string;
    let html: string;
    try {
      html = await fetchHtml(s.url);
      text = htmlToText(html);
    } catch (e) {
      notes.push(`${s.id}: page unreadable (${(e instanceof Error ? e.message : String(e)).slice(0, 60)})`);
      pageResults.push({ url: s.url, title: s.title, publishedAt: s.published_at ? new Date(s.published_at) : null, outcome: 'unreadable', sentences: 0, error: (e instanceof Error ? e.message : String(e)).slice(0, 120) });
      continue;
    }
    pages.set(s.url, text);
    // Evidence continuity: an undated signal still has the page's own article date, or a press-release dateline
    // that names the account ("June 8, 2026 PepsiCo and Gatik announced ...").
    const published = s.published_at ? new Date(s.published_at) : (parseSignalMeta(html).publishedAt ?? (deps.accountName ? datelineDate(text, deps.accountName) : null));
    const sentences = extractFactSentences(text, 8);
    notes.push(`${s.id}: ${sentences.length} candidate sentence(s)${published ? '' : ', page undated'}`);
    pageResults.push({ url: s.url, title: s.title ?? (parseSignalMeta(html).title ?? null), publishedAt: published, outcome: 'read', sentences: sentences.length });
    for (const excerpt of sentences) {
      candidates.push({
        provider: 'signal',
        url: s.url,
        title: s.title ?? parseSignalMeta(html).title ?? s.url,
        publishedAt: published,
        excerpt,
        sourceType: PRIMARY_CLASSES.has(s.source_class) || PRIMARY_BASIS.has(s.resolution_basis ?? '') || (deps.accountName && hostBelongsToAccount(s.url, deps.accountName)) ? 'public_primary' : 'public_secondary',
      });
    }
  }
  return { candidates, note: notes.join('; ') || 'no signal pages', pages, pageResults };
}

export function signalFocus(signals: readonly ResearchableSignal[]): string | undefined {
  const s = signals.find((x) => x.title) ?? signals[0];
  if (!s) return undefined;
  return `Casey flagged this story; find its PRIMARY source (company newsroom, filing, or the original report) and what it says about the physical network: "${s.title ?? ''}" (${s.url ?? ''}).`;
}

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'its', 'as', 'is', 'from', 'new', 'will', 'plans', 'plan', 'says', 'said', 'into', 'over', 'after', 'amid', 'this', 'that', 'their', 'our', 'more', 'use', 'inc', 'co', 'company', 'corp']);

/** The story's specific words (the account name removed): what makes it THIS event. */
export function storyTokens(text: string, accountName: string): Set<string> {
  const acct = new Set(
    accountName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter(Boolean),
  );
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9$]+/g, ' ')
      .split(' ')
      .filter((w) => w.length >= 3 && !STOP.has(w) && !acct.has(w)),
  );
}

/** Words every physical-network story shares: they never make two stories the same one (review B P1). */
const GENERIC_OPS = new Set(['distribution', 'center', 'centers', 'facility', 'facilities', 'million', 'billion', 'warehouse', 'warehouses', 'square', 'feet', 'foot', 'plant', 'plants', 'supply', 'chain', 'network', 'logistics', 'investment', 'invest', 'invests', 'expansion', 'expand', 'expands', 'expanding', 'operations', 'operation', 'company', 'jobs', 'site', 'sites', 'announced', 'announce', 'announces', 'opens', 'open', 'opening', 'build', 'building', 'new', 'year', 'years', 'state', 'county', 'city']);

/** A headline's specific words: story words minus the generic operations vocabulary every story shares. */
export function specificTokens(text: string, accountName: string): Set<string> {
  return new Set([...storyTokens(text, accountName)].filter((w) => !GENERIC_OPS.has(w) && !/^(?:to|plans?|plan|new|us)$/.test(w)));
}

/**
 * A fact is about the signal's story when it came from the signal's own page, or when it describes the SAME
 * direction of change (a closure never matches an opening or investment) AND shares 2+ of the story's specific words (a place,
 * a partner, a program), generic operations vocabulary excluded (review B P1: "invests in a new distribution
 * center" and "closes its Memphis distribution center" are different stories).
 */
export function factMatchesSignal(fact: { url: string; excerpt: string; title?: string }, signal: ResearchableSignal, accountName: string): boolean {
  if (signal.url && normalizeSignalUrl(fact.url) && normalizeSignalUrl(fact.url) === normalizeSignalUrl(signal.url)) return true;
  if (!signal.title) return false;
  // Same DIRECTION of change: a closure is never the same story as an opening, expansion or investment.
  const dir = (c: string | null | undefined) => (!c ? null : c === 'closure' ? 'shrink' : 'grow');
  const want = dir(classifyFact(signal.title).change);
  const got = dir(classifyFact(fact.excerpt).change);
  if (!want || !got || want !== got) return false;
  const specific = (t: string) => specificTokens(t, accountName);
  const a = specific(signal.title);
  // Only the verified excerpt counts (final review P1): a provider-supplied title is unverified and can echo the headline.
  const b = specific(fact.excerpt);
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  return shared >= 2;
}

export type SettledStatus = 'fact_found' | 'contradiction' | 'no_usable_fact';

/** Record, per signal, what the research run concluded about ITS story. Writes GapSignal rows only. */
export async function settleSignals(
  prisma: PrismaLike,
  input: { signals: readonly ResearchableSignal[]; accountName: string; result: ResearchResult; now: Date },
): Promise<Array<{ id: string; status: SettledStatus; matched: string[] }>> {
  const out: Array<{ id: string; status: SettledStatus; matched: string[] }> = [];
  const conflicted = new Set(input.result.conflicts.flatMap((c) => c.signalIds));
  for (const s of input.signals) {
    // Review B P1: only a FRESH verified fact makes a signal fact-ready (a stale one is kept for the record, never a trigger).
    const matchedAll = input.result.facts.filter((f) => factMatchesSignal(f, s, input.accountName));
    const matched = matchedAll.filter((f) => f.fresh);
    const status: SettledStatus = matched.some((f) => conflicted.has(f.signalId)) ? 'contradiction' : matched.length ? 'fact_found' : 'no_usable_fact';
    const row: { metadata: Record<string, unknown> | null; account_name?: string | null; research_status?: string } | null = await prisma.gapSignal.findUnique({ where: { id: s.id }, select: { metadata: true, account_name: true, research_status: true } });
    // Final review P0: Casey may have reassigned (or un-resolved) the signal while research ran; the result
    // belongs to the account it was researched for and never lands on a different one.
    if (!row || (row.account_name !== undefined && row.account_name !== input.accountName) || (row.research_status !== undefined && row.research_status !== 'researching')) {
      out.push({ id: s.id, status: 'no_usable_fact', matched: [] });
      continue;
    }
    await prisma.gapSignal.update({
      where: { id: s.id },
      data: {
        research_status: status,
        research_run_id: input.result.runId,
        metadata: {
          ...((row?.metadata ?? {}) as Record<string, unknown>),
          research: {
            runId: input.result.runId,
            at: input.now.toISOString(),
            outcome: input.result.outcome,
            matchedFactSignalIds: matched.map((f) => f.signalId),
            staleMatches: matchedAll.length - matched.length,
            otherVerifiedFacts: input.result.facts.length - matched.length,
            rejectedFromThisPage: input.result.rejected.filter((r) => s.url && r.url === s.url).map((r) => r.reason).slice(0, 8),
          },
        },
      },
    });
    out.push({ id: s.id, status, matched: matched.map((f) => f.signalId) });
  }
  return out;
}
