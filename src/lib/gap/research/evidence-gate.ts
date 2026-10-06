/**
 * THE EVIDENCE GATE (red team T6, 2026-09-26). Pure.
 *
 * GAP approved, activated and sent on evidence it itself labeled
 * INSUFFICIENT: an auto-ingested keyword hit ("PEP 10-Q mentions: capital
 * expenditure") reached the observation, the copy and the call script, and
 * three verbatim-but-irrelevant 10-Q sentences (a restructuring-charge split,
 * a risk factor, a liquidity paragraph) counted as facts.
 *
 * The rule, one place, used by approval, activation, routing, the compiler
 * and the send gate:
 *
 *   A first touch needs ONE outreach fact: a verified, dated, quoted,
 *   account-specific statement of a relevant physical-network change.
 *
 * An outreach fact proves only that the change happened. It never proves a
 * yard problem; everything beyond it stays a question or a hypothesis.
 *
 * A keyword-only signal (nothing quoted) may trigger RESEARCH. It may not be
 * cited in outbound copy, may not count toward approval and may not make a
 * hypothesis sendable. Casey's own operator knowledge informs a thesis but is
 * not a public, verifiable fact, so it cannot be the first-touch fact either.
 */
import { isPhysicalOpsFact, splitSentencesAware } from './facts';
import { factUrl, liveClaimFailure, liveFactFailure } from './claim-rules';
import { extractCitationIds } from '../hypothesis/observation';
import { sourceLabelVariants } from './source-label';
import { approachOfHypothesis, claimAdmittedFor, type EvidenceApproach } from './approach-policy';

export interface GateSignal {
  id: string;
  account_name?: string | null;
  source_kind?: string | null;
  source_type?: string | null;
  evidence_text?: string | null;
  evidence_url?: string | null;
  observed_at?: Date | string | null;
  external_ok?: boolean | null;
  metadata?: unknown;
  /** The source's title; its label is the only prose an observation may add around a quote (ops closeout 16). */
  title?: string | null;
  /** R30: the claim's class (FACT, JOB_POSTING, PROCUREMENT, ...); absent reads as FACT. */
  claim_class?: string | null;
}

/** R30: the gate's approach context (default: the physical-change path). */
export interface GateOptions {
  approach?: EvidenceApproach;
}

export type OutreachFactRefusal =
  | 'keyword_only'
  | 'operator_knowledge'
  | 'not_public'
  | 'not_verified'
  | 'not_external'
  | 'undated'
  | 'other_account'
  | 'not_a_physical_network_change'
  /** Evidence continuity: a newer source says this program ended. */
  | 'superseded'
  /** Stabilization A: the claim is another organization's (a vendor quoted about the account). */
  | 'third_party_statement'
  /** Stabilization A: stored on a search-redirect link; no publisher page Casey can open. */
  | 'redirect_source'
  /** Final review: linked to an aggregator or mirror, not the publisher's page. */
  | 'weak_source'
  /** R30: the claim's class is not one this approach may open on (a job claim under the event-led path, and the reverse). */
  | 'claim_not_admitted_for_approach'
  /** R30: a posting the source says is closed is not a live job claim. */
  | 'posting_closed'
  /** R30: an approach the policy does not enable (an attributed report). */
  | 'approach_not_enabled'
  /** R30: the fit-led approach needs a stable operating fact, not a fresh event. */
  | 'not_an_ongoing_state';

/** The verification stamp research writes when the excerpt was found in the fetched source (research/run.ts). */
export const VERIFIED_EXCERPT = 'excerpt_found_at_source';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A signal that quotes nothing: it names a document, it does not show a fact from it. */
export function isKeywordOnly(s: GateSignal): boolean {
  const operator = s.source_kind === 'operator_knowledge' || s.source_kind === 'manual';
  return !operator && !(s.evidence_text ?? '').trim();
}

/** Why this signal is not an outreach fact, or null when it is one. */
export function outreachFactRefusal(s: GateSignal, accountName: string, opts: GateOptions = {}): OutreachFactRefusal | null {
  if (s.source_kind === 'operator_knowledge' || s.source_kind === 'manual') return 'operator_knowledge';
  const text = (s.evidence_text ?? '').trim();
  if (!text) return 'keyword_only';
  if (s.source_type !== 'public_primary' && s.source_type !== 'public_secondary') return 'not_public';
  if (!isObj(s.metadata) || s.metadata.verified !== VERIFIED_EXCERPT) return 'not_verified';
  if (s.external_ok !== true) return 'not_external';
  const observed = s.observed_at instanceof Date ? s.observed_at : s.observed_at ? new Date(s.observed_at) : null;
  if (!observed || Number.isNaN(observed.getTime())) return 'undated';
  if (s.account_name != null && s.account_name.trim().toLowerCase() !== accountName.trim().toLowerCase()) return 'other_account';
  const continuity = isObj(s.metadata) && isObj(s.metadata.continuity) ? s.metadata.continuity : null;
  const approach = opts.approach ?? 'event_led';
  // R30: the approach decides which claim classes may open; the event-led path is exactly the physical-change rule.
  const physical = isPhysicalOpsFact(text);
  const claimClass = typeof s.claim_class === 'string' && s.claim_class ? s.claim_class : physical ? 'FACT' : null;
  if (approach === 'event_led') {
    if (!physical) return 'not_a_physical_network_change';
  } else {
    const attrs = isObj(s.metadata) && isObj(s.metadata.claimAttributes) ? (s.metadata.claimAttributes as { postingStatus?: 'open' | 'closed' | 'reposted' | 'unknown' }) : null;
    const kind = continuity && typeof continuity.kind === 'string' ? (continuity.kind as 'event' | 'ongoing_state' | 'ended') : null;
    const admitted = claimAdmittedFor(approach, { claimClass, attributes: attrs, continuity: kind });
    if (!admitted.ok) return admitted.reason;
    // A physical fact cited under another approach still passes the physical rules; a job or procurement claim passes
    // the attribution and publisher rules only.
    if (claimClass === 'FACT' && !physical) return 'not_a_physical_network_change';
  }
  if (continuity && continuity.kind === 'ended') return 'superseded';
  // The same stored-claim rules the brief applies: attribution and a real publisher link.
  const live = claimClass === 'FACT' ? liveFactFailure(text, accountName, factUrl(s)) : liveClaimFailure(text, accountName, factUrl(s));
  if (live === 'redirect_unresolved') return 'redirect_source';
  if (live === 'source_too_weak') return 'weak_source';
  if (live === 'quoted_third_party') return 'third_party_statement';
  return null;
}

export interface OutreachEvidence {
  /** 'VERIFIED_FACT' when at least one outreach fact is linked, else 'INSUFFICIENT'. */
  tier: 'VERIFIED_FACT' | 'INSUFFICIENT';
  facts: string[];
  keywordOnly: string[];
  refused: Array<{ id: string; reason: OutreachFactRefusal }>;
}

/** The outreach tier of a hypothesis from its linked signals. */
export function outreachEvidence(signals: readonly GateSignal[], accountName: string, opts: GateOptions = {}): OutreachEvidence {
  const facts: string[] = [];
  const keywordOnly: string[] = [];
  const refused: Array<{ id: string; reason: OutreachFactRefusal }> = [];
  for (const s of signals) {
    if (!s || typeof s.id !== 'string') continue;
    const why = outreachFactRefusal(s, accountName, opts);
    if (why === null) facts.push(s.id);
    else {
      refused.push({ id: s.id, reason: why });
      if (why === 'keyword_only') keywordOnly.push(s.id);
    }
  }
  return { tier: facts.length > 0 ? 'VERIFIED_FACT' : 'INSUFFICIENT', facts, keywordOnly, refused };
}

export interface SendableEvidence extends OutreachEvidence {
  /** Ids the observation cites that are not live outreach facts. Any one makes the hypothesis unsendable. */
  nonFactCitations: string[];
  /** Ops closeout 16: the observation text its cited facts do not support, or null. Non-null makes it unsendable. */
  unsupported: string | null;
}

const TOKEN = /\[S:[A-Za-z0-9_-]+\]/g;
const norm = (t: string) =>
  t
    .replace(TOKEN, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * Ops closeout 16: does the observation say only what its cited facts say?
 * Deterministic, no scoring: an observation is its source label(s) plus
 * quotes. Every quote must be found, verbatim after whitespace/quote/case
 * normalization, in the evidence_text of a fact the observation CITES; the
 * only other words allowed are a cited fact's own source label (its title as
 * `sourceLabel` names it, or the raw title). Anything else is a claim the
 * evidence does not make. Returns the first unsupported text, or null.
 */
export function observationSupportGap(
  observation: string | null | undefined,
  citedFacts: ReadonlyArray<{ id: string; evidence_text?: string | null; title?: string | null }>,
  accountName: string,
): string | null {
  // Quotes are delimited by straight quotes and closed right before a citation
  // token (citedQuote's shape), so a fact that itself contains quotes
  // (Kroger: 'Giant Eagle, Inc. (“Giant Eagle”)') stays one quote.
  const text = observation ?? '';
  const citedIds = new Set(extractCitationIds(text));
  const facts = citedFacts.filter((f) => citedIds.has(f.id));
  if (facts.length === 0) return text.trim() || '(empty)';
  // Closeout review: a quote must be a WHOLE sentence of a cited fact, or the
  // whole excerpt (citedQuote's shape); a fragment can drop a negation.
  const strip = (t: string) => t.replace(/[.!?,;:]+$/, '').trim();
  const whole = new Set(
    facts.flatMap((f) => {
      const text = f.evidence_text ?? '';
      return [text, ...splitSentencesAware(text)].map((t) => strip(norm(t))).filter(Boolean);
    }),
  );

  let residue = text;
  for (const m of text.matchAll(/"([\s\S]+?)"(?=\s*\[S:[A-Za-z0-9_-]+\])/g)) {
    const quote = norm(m[1]).replace(/[.!?,;:]+$/, '');
    if (!quote || !whole.has(quote)) return m[0];
    residue = residue.replace(m[0], ' ');
  }
  residue = residue.replace(TOKEN, ' ');
  const labels = facts
    .flatMap((f) => (f.title ? sourceLabelVariants(f.title, accountName) : []))
    .map((l) => l.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  let rest = residue;
  for (const label of labels) rest = rest.split(label).join(' ');
  // Case-insensitive second pass (a label typed with different casing).
  for (const label of labels) rest = rest.replace(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
  const left = rest.replace(/[\s.:,;!?'"()-]+/g, ' ').trim();
  return left.length === 0 ? null : left;
}

/**
 * The send decision (Release C review SF1). A linked fact is not enough when
 * the sentence that reaches the buyer cites something else: the observation
 * must cite at least one signal, and every signal it cites must itself be a
 * live outreach fact. Pass only live (unexpired) signals, so a cited expired
 * fact counts as a non-fact citation.
 */
export function sendableEvidence(observation: string | null | undefined, signals: readonly GateSignal[], accountName: string, opts: GateOptions = {}): SendableEvidence {
  const base = outreachEvidence(signals, accountName, opts);
  const facts = new Set(base.facts);
  const cited = extractCitationIds(observation ?? '');
  const nonFactCitations = cited.filter((id) => !facts.has(id));
  const unsupported =
    cited.length > 0 && nonFactCitations.length === 0
      ? observationSupportGap(observation, signals.filter((s) => facts.has(s.id)), accountName)
      : null;
  const ok = base.tier === 'VERIFIED_FACT' && cited.length > 0 && nonFactCitations.length === 0 && unsupported === null;
  return { ...base, tier: ok ? 'VERIFIED_FACT' : 'INSUFFICIENT', nonFactCitations, unsupported };
}

/** The Prisma select every gate caller needs on a linked ProspectingSignal. */
export const GATE_SIGNAL_SELECT = {
  id: true,
  account_name: true,
  source_kind: true,
  source_type: true,
  evidence_text: true,
  evidence_url: true,
  observed_at: true,
  external_ok: true,
  metadata: true,
  title: true,
  claim_class: true,
} as const;

/**
 * The send decision for a loaded hypothesis row (`signals: [{ signal }]`),
 * with only LIVE signals considered (Release C re-review S8): an expired fact
 * never makes a hypothesis sendable, and is never read aloud as an opener.
 */
export function hypothesisSendable(
  h: { observation?: string | null; account_name: string; metadata?: unknown; signals?: ReadonlyArray<{ signal?: (GateSignal & { freshness_expires_at?: Date | string | null }) | null }> | null },
  now: Date,
): boolean {
  const live = (h.signals ?? [])
    .map((l) => l.signal)
    .filter((s): s is GateSignal & { freshness_expires_at?: Date | string | null } => !!s && (!s.freshness_expires_at || new Date(s.freshness_expires_at).getTime() > now.getTime()));
  return sendableEvidence(h.observation, live, h.account_name, { approach: approachOfHypothesis(h) }).tier === 'VERIFIED_FACT';
}
