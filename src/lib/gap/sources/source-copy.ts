/**
 * Source-card copy and types (research aperture). Pure: safe in client components (no node:crypto).
 */
export type SourceStatus = 'VERIFIED_FOR_OUTREACH' | 'NOT_VERIFIED_FOR_OUTREACH' | 'COULD_NOT_VERIFY';
export type WhyFound =
  | 'network' | 'facility' | 'automation' | 'leadership' | 'labor' | 'M&A' | 'CapEx' | 'transportation'
  | '3PL/vendor' | 'hiring' | 'security/risk' | 'technology' | 'customer/vendor story' | 'other';

export interface AccountSource {
  /** Normalized URL: the dedupe key. */
  key: string;
  link: string;
  title: string | null;
  /** The site that published it (host). */
  publisher: string;
  publishedAt: string | null;
  discoveredAt: string;
  ageDays: number | null;
  /** Published recently enough to be a fresh trigger. An old source is shown, labelled NOT A FRESH TRIGGER. */
  freshTrigger: boolean;
  excerpt: string | null;
  /** verbatim: the page's words; search_summary: a search model's paraphrase (never shown as a quote); headline; typed. */
  excerptKind: 'verbatim' | 'search_summary' | 'headline' | 'typed' | null;
  /** Who said it, when the excerpt is a quote from another organization (a vendor about the account). */
  attribution: string | null;
  whyFound: WhyFound[];
  origin: 'casey_shared' | 'gap_discovered' | 'gap_research';
  status: SourceStatus;
  /** The factual reason it is not outreach evidence (null when verified). Never "irrelevant". */
  reason: string | null;
  signalId: string | null;
  factId: string | null;
  /** Casey has acted on it (feedback recorded). */
  reviewed: boolean;
  /** Other statements GAP read on the same page, each with its own status and speaker (never merged into one). */
  alsoOnPage?: Array<{ excerpt: string; status: SourceStatus; reason: string | null; attribution: string | null }>;
}

/** Only search-redirect and search-result pages; an aggregator copy is still a source (not verified, shown). */
export const SEARCH_REDIRECT = /^https?:\/\/(?:[^/]*\.)?(?:vertexaisearch\.cloud\.google\.com|google\.[a-z.]+\/(?:search|url)|bing\.com\/(?:search|ck)|duckduckgo\.com\/(?:\?|l\/))/i;

/**
 * Reasons that prove the source is not about the account: dropped (counted), never shown. Empty on purpose: a page
 * that does not name the account by its full name may still name a brand or short form, so it is shown.
 */
export const DROP_REASONS = new Set<string>();

/** The factual reason, in plain words. */
export function sourceReason(raw: string | null, accountName: string, speaker?: string | null): string {
  if (!raw) return 'not checked yet';
  if (raw.startsWith('source_unreadable:no_readable_text')) return 'page has no readable text (script-rendered or empty)';
  if (raw.startsWith('source_unreadable')) return 'source could not be fetched';
  const map: Record<string, string> = {
    describes_past_event: 'describes a past event, not a current change',
    quoted_third_party: `third-party statement (said by ${speaker ?? 'another organization'}, not ${accountName})`,
    not_a_physical_operations_fact: 'no sentence states a physical operations change',
    reanchor_too_weak: 'sentence did not verify word for word at the source',
    excerpt_not_found_at_source: 'the quoted sentence is not on the page',
    sentence_does_not_name_account: `the sentence is not about ${accountName} itself (could be about a partner or rival)`,
    page_does_not_name_account: `the page does not name ${accountName} by its full name (it may use a brand or short name)`,
    no_publication_date: 'no publication date found',
    source_too_weak: 'aggregator or syndicated copy, not the original page',
    boilerplate: 'company boilerplate, not news',
    no_fact_sentence: 'page read; no sentence states a physical operations change',
    not_read_budget: 'found, not read this run (time budget)',
    no_excerpt: 'no sentence to check',
    contradiction: 'contradicted by another source',
    being_checked: 'being checked now',
    not_checked: 'not checked yet',
    fact_no_longer_passes: 'verified earlier; no longer passes the evidence rules',
    same_statement_as_other_source: 'carries the same statement as another source (that card shows its status)',
    mention_only: `the headline mentions ${accountName}; the story is about another company`,
    fact_ended: 'verified earlier; the change has since ended or was superseded',
    failed_recheck: 'verified earlier; failed a later recheck',
    fact_at_other_source: 'research on this story found a fact; it has its own card if it still passes the rules',
  };
  return map[raw] ?? raw.replace(/_/g, ' ');
}

/** "published Jun 8, 2026 · 3 months old". */
export function ageLabel(publishedAt: string | null, ageDays: number | null): string {
  if (!publishedAt || ageDays === null) return 'publication date unknown';
  const d = new Date(publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const age = ageDays < 1 ? 'today' : ageDays < 14 ? `${ageDays} day${ageDays === 1 ? '' : 's'} old` : ageDays < 60 ? `${Math.floor(ageDays / 7)} weeks old` : ageDays < 730 ? `${Math.floor(ageDays / 30)} months old` : `${Math.floor(ageDays / 365)} years old`;
  return `published ${d} · ${age}`;
}

export const STATUS_LABEL: Record<SourceStatus, string> = {
  VERIFIED_FOR_OUTREACH: 'Verified for outreach',
  NOT_VERIFIED_FOR_OUTREACH: 'Not verified for outreach',
  COULD_NOT_VERIFY: 'Could not verify',
};
