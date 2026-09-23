/**
 * Hypothesis resolution scoring (GAP Prospecting OS, Sprint 4, S4-T2). Pure.
 *
 * Takes the human-confirmed dispositions of a hypothesis and its selected
 * BID rows (human-confirmed, unsuperseded: see `bid/select.ts`) and returns
 * the outcome, a confidence, and the basis the resolution JSON cites. It
 * FEEDS `machine.ts`: the outcome here is derived by the same rule the
 * machine's `resolve` uses (the newest confirmed problem_* disposition
 * decides, `DISPOSITION_OUTCOMES`), so the service can pass `outcome` as
 * `ctx.outcome` and the machine will agree, or refuse `outcome_mismatch`
 * if the rows changed underneath.
 *
 * Scoring (spec section 7):
 *   confirmed            base 70 for call or meeting, 60 for email or linkedin
 *                        +15 when a confirmed business_problem or current_state
 *                            BID carries the buyer's words
 *                        +10 when a confirmed root_cause BID exists and the
 *                            problem is confirmed
 *                        cap 95
 *   partially_confirmed  the same, minus 20
 *   rejected             no confidence
 *   root_cause with no confirmed problem: orphan (named in reasons, never scored)
 *   impact: acknowledged when an impact BID is confirmed; quantified when a
 *           metric or impact BID carries a number and a unit (the bid ids are cited)
 *   timing sets resumeAt; wrong_person asks for a re-target; referral names
 *   the BID that names the person.
 *
 * Belt and braces: an unconfirmed disposition or BID in the input, or a BID
 * the input itself supersedes, is refused (`unconfirmed_input`,
 * `superseded_input`) with outcome null. The caller filtered; this module
 * checks anyway, because an unconfirmed AI suggestion must never move a
 * hypothesis.
 */

import { DISPOSITION_OUTCOMES, newestConfirmedDisposition, type ResolutionOutcome } from './machine';
import { supersededIds, type ResolutionBid } from '../bid/select';

export type { ResolutionBid };

export const BASE_CALL_OR_MEETING = 70;
export const BASE_EMAIL_OR_LINKEDIN = 60;
export const QUOTE_BONUS = 15;
export const ROOT_CAUSE_BONUS = 10;
export const PARTIAL_PENALTY = 20;
export const CONFIDENCE_CAP = 95;

/** BID types whose raw language counts as the buyer quoting the problem. */
export const QUOTE_BID_TYPES = ['business_problem', 'current_state'] as const;
/** BID types that can carry a quantified impact. */
export const QUANTIFIABLE_BID_TYPES = ['impact', 'metric'] as const;

export interface ResolutionDisposition {
  id: string;
  responseClass: string;
  channel: string;
  humanConfirmed: boolean;
  createdAt: Date;
  confirmedAt?: Date | null;
  /**
   * ConversationDisposition has no metadata column today. `resumeAt` and
   * `referral` are read from `metadata` if a later migration adds it, else
   * from `ai_suggested`, exactly as `routing/inputs.ts` reads them.
   */
  metadata?: unknown;
  aiSuggested?: unknown;
}

export interface ScoreResolutionInput {
  /** The hypothesis's human-confirmed dispositions. Any order; the newest by createdAt decides. */
  dispositions: readonly ResolutionDisposition[];
  /** Already through `selectConfirmedBids`. */
  bids: readonly ResolutionBid[];
  /** Override for how a disposition's channel is read. Defaults to `d.channel`. */
  channelOf?: (d: ResolutionDisposition) => string;
}

export type ImpactLevel = 'none' | 'acknowledged' | 'quantified';

export interface ResolutionBasis {
  /** Confirmed problem_* disposition ids, newest first (the service's `resolvingDispositionIds` order). */
  dispositionIds: string[];
  /** Every BID the score read. */
  bidIds: string[];
  quote: boolean;
  rootCauseConfirmed: boolean;
  /** Confirmed root_cause BIDs that had no confirmed problem to attach to. The service stores `orphan: true` on them. */
  orphanRootCauseBidIds: string[];
  impact: ImpactLevel;
  quantified?: { value: number; unit: string; bidIds: string[] };
}

export type ResolutionRefusal = 'unconfirmed_input' | 'superseded_input';

export interface ResolutionScore {
  outcome: ResolutionOutcome | null;
  confidence: number | null;
  basis: ResolutionBasis;
  resumeAt?: Date;
  retarget?: boolean;
  referral?: { fromBidId: string | null; name?: string; title?: string };
  refusal: ResolutionRefusal | null;
  reasons: string[];
}

// ---------------------------------------------------------------------------
// helpers (mirrors of routing/inputs.ts, kept local so this module stays pure and dependency-light)
// ---------------------------------------------------------------------------

function meta(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function hasWords(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Disposition metadata with `metadata` winning over `ai_suggested`. */
function dispositionMeta(d: ResolutionDisposition): Record<string, unknown> {
  return { ...meta(d.aiSuggested), ...meta(d.metadata) };
}

/** The newest disposition of ANY class: the buyer's latest answer. Ties go to the later entry. */
function newestOverall(dispositions: readonly ResolutionDisposition[]): ResolutionDisposition | null {
  let newest: ResolutionDisposition | null = null;
  for (const d of dispositions) {
    if (newest === null || d.createdAt.getTime() >= newest.createdAt.getTime()) newest = d;
  }
  return newest;
}

function emptyBasis(): ResolutionBasis {
  return {
    dispositionIds: [],
    bidIds: [],
    quote: false,
    rootCauseConfirmed: false,
    orphanRootCauseBidIds: [],
    impact: 'none',
  };
}

function refused(refusal: ResolutionRefusal, reasons: string[]): ResolutionScore {
  return { outcome: null, confidence: null, basis: emptyBasis(), refusal, reasons };
}

function baseFor(channel: string, reasons: string[]): number {
  if (channel === 'call' || channel === 'meeting') {
    reasons.push(`base:${BASE_CALL_OR_MEETING}:${channel}`);
    return BASE_CALL_OR_MEETING;
  }
  if (channel === 'email' || channel === 'linkedin') {
    reasons.push(`base:${BASE_EMAIL_OR_LINKEDIN}:${channel}`);
    return BASE_EMAIL_OR_LINKEDIN;
  }
  // An unknown channel scores as the weakest known one; never higher.
  reasons.push(`base:${BASE_EMAIL_OR_LINKEDIN}:unknown_channel:${channel}`);
  return BASE_EMAIL_OR_LINKEDIN;
}

// ---------------------------------------------------------------------------
// scoreResolution
// ---------------------------------------------------------------------------

export function scoreResolution(input: ScoreResolutionInput): ResolutionScore {
  const { dispositions, bids } = input;
  const channelOf = input.channelOf ?? ((d: ResolutionDisposition) => d.channel);

  // Belt and braces: nothing unconfirmed or superseded may reach the score.
  const unconfirmed: string[] = [];
  for (const d of dispositions) if (d.humanConfirmed !== true) unconfirmed.push(`unconfirmed_input:disposition:${d.id}`);
  for (const b of bids) if (b.humanConfirmed !== true) unconfirmed.push(`unconfirmed_input:bid:${b.id}`);
  if (unconfirmed.length > 0) return refused('unconfirmed_input', unconfirmed);

  const superseded = supersededIds(bids);
  const supersededInInput = bids.filter((b) => superseded.has(b.id)).map((b) => `superseded_input:bid:${b.id}`);
  if (supersededInInput.length > 0) return refused('superseded_input', supersededInInput);

  const reasons: string[] = [];
  const basis = emptyBasis();
  basis.bidIds = bids.map((b) => b.id);
  basis.dispositionIds = dispositions
    .filter((d) => d.responseClass in DISPOSITION_OUTCOMES)
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((d) => d.id);

  // The deciding row, by the machine's own rule.
  const deciding = newestConfirmedDisposition(dispositions) as ResolutionDisposition | null;
  const outcome: ResolutionOutcome | null = deciding ? DISPOSITION_OUTCOMES[deciding.responseClass] : null;
  if (!deciding) reasons.push('no_confirmed_disposition');

  // Evidence from BID.
  const quoteBids = bids.filter(
    (b) => (QUOTE_BID_TYPES as readonly string[]).includes(b.type) && hasWords(b.rawBuyerLanguage),
  );
  basis.quote = quoteBids.length > 0;

  const rootCauseBids = bids.filter((b) => b.type === 'root_cause');
  const problemHeld = outcome === 'confirmed' || outcome === 'partially_confirmed';
  basis.rootCauseConfirmed = rootCauseBids.length > 0 && problemHeld;
  if (rootCauseBids.length > 0 && !problemHeld) {
    basis.orphanRootCauseBidIds = rootCauseBids.map((b) => b.id);
    for (const b of rootCauseBids) reasons.push(`orphan:true:${b.id}`);
  }

  const quantifiedBids = bids.filter(
    (b) => (QUANTIFIABLE_BID_TYPES as readonly string[]).includes(b.type) && b.numericValue !== null && hasWords(b.unit),
  );
  if (quantifiedBids.length > 0) {
    const first = quantifiedBids[0];
    basis.impact = 'quantified';
    basis.quantified = { value: first.numericValue as number, unit: (first.unit as string).trim(), bidIds: quantifiedBids.map((b) => b.id) };
    reasons.push(`impact:quantified:${basis.quantified.bidIds.join(',')}`);
  } else if (bids.some((b) => b.type === 'impact')) {
    basis.impact = 'acknowledged';
    reasons.push('impact:acknowledged');
  }

  // Confidence.
  let confidence: number | null = null;
  if (outcome === 'confirmed' || outcome === 'partially_confirmed') {
    let score = baseFor(channelOf(deciding as ResolutionDisposition), reasons);
    if (basis.quote) {
      score += QUOTE_BONUS;
      reasons.push(`quote:+${QUOTE_BONUS}:${quoteBids.map((b) => b.id).join(',')}`);
    }
    if (basis.rootCauseConfirmed) {
      score += ROOT_CAUSE_BONUS;
      reasons.push(`root_cause:+${ROOT_CAUSE_BONUS}:${rootCauseBids.map((b) => b.id).join(',')}`);
    }
    if (outcome === 'partially_confirmed') {
      score -= PARTIAL_PENALTY;
      reasons.push(`partial:-${PARTIAL_PENALTY}`);
    }
    if (score > CONFIDENCE_CAP) {
      score = CONFIDENCE_CAP;
      reasons.push(`cap:${CONFIDENCE_CAP}`);
    }
    confidence = Math.max(0, score);
  } else if (outcome === 'rejected') {
    reasons.push('rejected:no_confidence');
  }

  // The buyer's latest answer, whatever its class, drives the side signals.
  const result: ResolutionScore = { outcome, confidence, basis, refusal: null, reasons };
  const latest = newestOverall(dispositions);
  if (latest) {
    if (latest.responseClass === 'timing') {
      const resumeAt = asDate(dispositionMeta(latest).resumeAt);
      if (resumeAt) {
        result.resumeAt = resumeAt;
        reasons.push(`resume_at:${resumeAt.toISOString()}`);
      } else {
        reasons.push(`timing_without_resume_at:${latest.id}`);
      }
    } else if (latest.responseClass === 'wrong_person') {
      result.retarget = true;
      reasons.push(`retarget:${latest.id}`);
    } else if (latest.responseClass === 'referral') {
      const namingBid = bids.find((b) => Object.keys(meta(meta(b.metadata).referral)).length > 0) ?? null;
      const fromMeta = meta(namingBid ? meta(namingBid.metadata).referral : dispositionMeta(latest).referral);
      result.referral = {
        fromBidId: namingBid ? namingBid.id : null,
        ...(typeof fromMeta.name === 'string' ? { name: fromMeta.name } : {}),
        ...(typeof fromMeta.title === 'string' ? { title: fromMeta.title } : {}),
      };
      reasons.push(namingBid ? `referral:${namingBid.id}` : `referral_unnamed:${latest.id}`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// The resolution JSON fragment the service merges into `prospecting_hypotheses.resolution`
// ---------------------------------------------------------------------------

export interface ResolutionRecord {
  problem: 'confirmed' | 'partial' | 'rejected' | null;
  rootCause: 'confirmed' | 'orphan' | 'unknown';
  impact: ImpactLevel;
  confidence: number | null;
  quote: boolean;
  dispositionIds: string[];
  bidIds: string[];
  quantified: { value: number; unit: string; bidIds: string[] } | null;
}

/** Shape the score for storage next to the machine's own fields (`problem`, `dispositionIds`, `bidIds`). */
export function resolutionRecord(score: ResolutionScore): ResolutionRecord {
  const problem =
    score.outcome === 'confirmed'
      ? 'confirmed'
      : score.outcome === 'partially_confirmed'
        ? 'partial'
        : score.outcome === 'rejected'
          ? 'rejected'
          : null;
  const rootCause = score.basis.rootCauseConfirmed
    ? 'confirmed'
    : score.basis.orphanRootCauseBidIds.length > 0
      ? 'orphan'
      : 'unknown';
  return {
    problem,
    rootCause,
    impact: score.basis.impact,
    confidence: score.confidence,
    quote: score.basis.quote,
    dispositionIds: score.basis.dispositionIds,
    bidIds: score.basis.bidIds,
    quantified: score.basis.quantified ?? null,
  };
}
