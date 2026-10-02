/**
 * The GAP truth vocabulary as it reaches a seller, and source-card copy. Pure: safe in client components.
 *
 *   SOURCE             a document or human input, with provenance
 *   SIGNAL             a source that may be worth knowing about (needs no fact)
 *   CLAIM              one attributed assertion: who said it, where, when
 *   VERIFIED FACT      a claim GAP checked at its source (true; not necessarily new, useful or first-party)
 *   OUTREACH EVIDENCE  the strict subset Casey may say to a buyer (current, attributable, not contradicted)
 *   HYPOTHESIS         what GAP / Casey think may be happening (never a fact)
 *   BUYER TRUTH        what the buyer confirms (outranks everything above)
 *
 * Two axes, never one: whether a claim VERIFIED AT ITS SOURCE, and whether it is ELIGIBLE AS OUTREACH EVIDENCE.
 */

/** Did the claim check out at its own source? */
export type VerificationState = 'UNCHECKED' | 'VERIFYING' | 'VERIFIED_AT_SOURCE' | 'COULD_NOT_VERIFY' | 'CONTRADICTED';
/** May Casey use it as outreach evidence? (The strict execution gate; truth and usefulness are separate.) */
export type OutreachState = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NOT_EVALUATED' | 'NEEDS_HUMAN_JUDGMENT';

export type WhyFound =
  | 'network' | 'facility' | 'automation' | 'leadership' | 'labor' | 'M&A' | 'CapEx' | 'transportation'
  | '3PL/vendor' | 'hiring' | 'security/risk' | 'technology' | 'customer/vendor story' | 'other';

export interface SourceClaim {
  excerpt: string;
  verification: VerificationState;
  outreach: OutreachState;
  reason: string | null;
  /** Who made the claim when it is not the account (a vendor quoted about the account). */
  attribution: string | null;
}

export interface AccountSource {
  /** Normalized URL: the dedupe key. */
  key: string;
  link: string;
  title: string | null;
  /** The site that published it (host, or the feed's publisher name). */
  publisher: string;
  publishedAt: string | null;
  discoveredAt: string;
  ageDays: number | null;
  /** Published recently enough to be a fresh trigger. An old source is shown, labelled NOT A FRESH TRIGGER. */
  freshTrigger: boolean;
  excerpt: string | null;
  /** verbatim: the page's words; search_summary: a search model's paraphrase (never shown as a quote); headline; typed. */
  excerptKind: 'verbatim' | 'search_summary' | 'headline' | 'typed' | null;
  /** Who said it, when the excerpt is a claim by another organization (a vendor about the account). */
  attribution: string | null;
  whyFound: WhyFound[];
  origin: 'casey_shared' | 'gap_discovered' | 'gap_research' | 'scout';
  /** The lead claim's verification at its source. */
  verification: VerificationState;
  /** The lead claim's eligibility as outreach evidence. */
  outreach: OutreachState;
  /** Why it is not verified or not eligible, in plain words (null when verified and eligible). Never "irrelevant". */
  reason: string | null;
  signalId: string | null;
  factId: string | null;
  /** Casey has acted on it (feedback recorded). */
  reviewed: boolean;
  /** Other claims GAP read on the same page, each with its own states and speaker (never merged into one). */
  alsoOnPage?: SourceClaim[];
  /** The signal event this source belongs to (sources telling one story group under one event). */
  eventId?: string | null;
}

/** Only search-redirect and search-result pages; an aggregator copy is still a source (not verified, shown). */
export const SEARCH_REDIRECT = /^https?:\/\/(?:[^/]*\.)?(?:vertexaisearch\.cloud\.google\.com|google\.[a-z.]+\/(?:search|url)|bing\.com\/(?:search|ck)|duckduckgo\.com\/(?:\?|l\/))/i;

/**
 * Reasons that prove the source is not about the account: dropped (counted), never shown. Empty on purpose: a page
 * that does not name the account by its full name may still name a brand or short form, so it is shown.
 */
export const DROP_REASONS = new Set<string>();

/**
 * Where a raw research reason leaves the claim on the two axes. A rule the claim failed BEFORE GAP checked it at
 * the page (undated, no physical change, a past event) leaves it UNCHECKED: never "false", only not eligible.
 */
export function axesOf(raw: string | null): { verification: VerificationState; outreach: OutreachState } {
  if (!raw) return { verification: 'UNCHECKED', outreach: 'NOT_EVALUATED' };
  if (raw.startsWith('source_unreadable') || raw === 'not_read_budget') return { verification: 'COULD_NOT_VERIFY', outreach: 'NOT_EVALUATED' };
  if (raw === 'excerpt_not_found_at_source' || raw === 'reanchor_too_weak' || raw === 'redirect_unresolved') return { verification: 'COULD_NOT_VERIFY', outreach: 'NOT_ELIGIBLE' };
  if (raw === 'contradiction') return { verification: 'CONTRADICTED', outreach: 'NOT_ELIGIBLE' };
  if (raw === 'being_checked') return { verification: 'VERIFYING', outreach: 'NOT_EVALUATED' };
  // Checked at the page: the words are there, but they are someone else's, or not about this account.
  if (raw === 'quoted_third_party' || raw === 'sentence_does_not_name_account' || raw === 'page_does_not_name_account' || raw === 'fact_no_longer_passes') return { verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE' };
  if (raw === 'not_checked' || raw === 'mention_only' || raw === 'same_statement_as_other_source' || raw === 'fact_at_other_source' || raw === 'grounded_found') return { verification: 'UNCHECKED', outreach: 'NOT_EVALUATED' };
  return { verification: 'UNCHECKED', outreach: 'NOT_ELIGIBLE' };
}

/** The factual reason, in plain words. */
export function sourceReason(raw: string | null, accountName: string, speaker?: string | null): string {
  if (!raw) return 'not checked yet';
  if (raw.startsWith('source_unreadable:no_readable_text')) return 'page has no readable text (script-rendered or empty)';
  if (raw.startsWith('source_unreadable')) return 'source could not be fetched';
  const map: Record<string, string> = {
    describes_past_event: 'describes a past event, not a current change',
    quoted_third_party: `said by ${speaker ?? 'another organization'}, not ${accountName}`,
    not_a_physical_operations_fact: 'no sentence states a physical operations change',
    reanchor_too_weak: 'the statement was not found word for word at the source',
    excerpt_not_found_at_source: 'the quoted sentence is not on the page',
    sentence_does_not_name_account: `the sentence is not about ${accountName} itself (could be about a partner or rival)`,
    page_does_not_name_account: `the page does not name ${accountName} by its full name (it may use a brand or short name)`,
    no_publication_date: 'no publication date found',
    source_too_weak: 'aggregator or syndicated copy, not the original page',
    boilerplate: 'company boilerplate, not news',
    no_fact_sentence: 'page read; no sentence states a physical operations change',
    not_read_budget: 'found, not read this run (time budget)',
    no_excerpt: 'no sentence to check',
    excerpt_too_short: 'the search proposed too short a sentence to check',
    contradiction: 'contradicted by another source',
    being_checked: 'being checked now',
    not_checked: 'not checked yet',
    fact_no_longer_passes: 'verified at the source; no longer passes the outreach rules',
    same_statement_as_other_source: 'carries the same statement as another source (that card shows its status)',
    mention_only: `the headline mentions ${accountName}; the story is about another company`,
    fact_ended: 'the change has since ended or was superseded',
    fact_expired: 'past its freshness window: true, but not a fresh trigger',
    failed_recheck: 'failed a later recheck',
    redirect_unresolved: 'stored on a search-redirect link; the original publisher page could not be confirmed',
    fact_at_other_source: 'research on this story checked a claim on another page (that card shows it)',
    scout_citation: 'cited by Scout for its company verdict; not checked as a claim',
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

export const VERIFICATION_LABEL: Record<VerificationState, string> = {
  UNCHECKED: 'Unchecked',
  VERIFYING: 'Verifying',
  VERIFIED_AT_SOURCE: 'Verified at source',
  COULD_NOT_VERIFY: 'Could not verify',
  CONTRADICTED: 'Contradicted',
};

export const OUTREACH_LABEL: Record<OutreachState, string> = {
  ELIGIBLE: 'Eligible as outreach evidence',
  NOT_ELIGIBLE: 'Not eligible as outreach evidence',
  NOT_EVALUATED: 'Outreach not evaluated',
  NEEDS_HUMAN_JUDGMENT: 'Outreach needs your judgment',
};

/** One line for a claim's two axes: "Verified at source · Not eligible as outreach evidence: <reason>". */
export function claimLine(c: { verification: VerificationState; outreach: OutreachState; reason: string | null }): string {
  return `${VERIFICATION_LABEL[c.verification]} · ${OUTREACH_LABEL[c.outreach]}${c.reason ? `: ${c.reason}` : ''}`;
}
