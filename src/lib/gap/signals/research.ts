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
import type { Candidate } from '../research/providers';
import type { ResearchResult } from '../research/run';
import { extractFactSentences, htmlToText } from '../research/facts';
import { defaultFetchHtml, normalizeSignalUrl, type FetchHtml } from './intake';

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

export async function signalCandidates(signals: readonly ResearchableSignal[], deps: { fetchHtml?: FetchHtml } = {}): Promise<{ candidates: Candidate[]; note: string; pages: Map<string, string> }> {
  const fetchHtml = deps.fetchHtml ?? defaultFetchHtml;
  const candidates: Candidate[] = [];
  const pages = new Map<string, string>();
  const notes: string[] = [];
  for (const s of signals) {
    if (!s.url) continue;
    let text: string;
    try {
      text = htmlToText(await fetchHtml(s.url));
    } catch (e) {
      notes.push(`${s.id}: page unreadable (${(e instanceof Error ? e.message : String(e)).slice(0, 60)})`);
      continue;
    }
    pages.set(s.url, text);
    const published = s.published_at ? new Date(s.published_at) : null;
    const sentences = extractFactSentences(text, 8);
    notes.push(`${s.id}: ${sentences.length} candidate sentence(s)${published ? '' : ', page undated'}`);
    for (const excerpt of sentences) {
      candidates.push({
        provider: 'signal',
        url: s.url,
        title: s.title ?? s.url,
        publishedAt: published,
        excerpt,
        sourceType: PRIMARY_CLASSES.has(s.source_class) || PRIMARY_BASIS.has(s.resolution_basis ?? '') ? 'public_primary' : 'public_secondary',
      });
    }
  }
  return { candidates, note: notes.join('; ') || 'no signal pages', pages };
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

/** A fact is about the signal's story when it came from the signal's page, or shares 3+ of its specific words. */
export function factMatchesSignal(fact: { url: string; excerpt: string; title?: string }, signal: ResearchableSignal, accountName: string): boolean {
  if (signal.url && normalizeSignalUrl(fact.url) && normalizeSignalUrl(fact.url) === normalizeSignalUrl(signal.url)) return true;
  if (!signal.title) return false;
  const want = storyTokens(signal.title, accountName);
  const got = storyTokens(`${fact.excerpt} ${fact.title ?? ''}`, accountName);
  let shared = 0;
  for (const w of want) if (got.has(w)) shared += 1;
  return shared >= 3;
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
    const matched = input.result.facts.filter((f) => factMatchesSignal(f, s, input.accountName));
    const status: SettledStatus = matched.some((f) => conflicted.has(f.signalId)) ? 'contradiction' : matched.length ? 'fact_found' : 'no_usable_fact';
    const row: { metadata: Record<string, unknown> | null } | null = await prisma.gapSignal.findUnique({ where: { id: s.id }, select: { metadata: true } });
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
