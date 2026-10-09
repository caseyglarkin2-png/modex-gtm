/**
 * THE OUTCOME LOOP (C55 of the commercial-context audit, 2026-10-08). Pure. Real outcomes already recorded by the
 * existing layers (a human-confirmed disposition with the buyer's words, a hypothesis resolution, a seller's own
 * correction or edit, a meeting outcome) become attributed, cited evidence for future recommendations:
 *
 *   a buyer's confirmed words           buyer_said, authority buyer_words, cited by disposition id
 *   a rejected hypothesis               the family is REJECTED at the account from that date, cited; a later claim
 *                                       that restates it (a vault wedge, a thesis seed) is marked superseded by the
 *                                       rejection so it never returns as a fact (guardFacts)
 *   a seller's edit or correction       seller_noted, seller authority, never buyer evidence
 *   a meeting outcome                   seller_noted with its basis (the seller's record), never a stage move
 *   a not-now with a return date        advice to resume after the date, attributed to the buyer
 *   a referral                          advice naming who was referred, attributed to the buyer
 *   a win or a loss                     seller_noted with the reason given, cited
 *
 * Uplift is never implied from a small sample: upliftLine says "k of n, an early observation" under the reliable n
 * (learning/metrics.ts) and "observed, not causal" above it. Routing cites the disposition id (routing/explain.ts).
 */
import type { ContextClaim } from '../context/commercial-context';
import { sameIdea } from '../context/same-idea';
import { isLowSample, MIN_RELIABLE_SAMPLE, rate } from './metrics';

export interface OutcomeDisposition {
  id: string;
  accountName: string | null;
  personaEmail: string | null;
  responseClass: string;
  humanConfirmed: boolean;
  at: string;
  /** The buyer's own words the disposition quoted, when it did (problem_* classes require one). */
  quote: string | null;
  resumeAt?: string | null;
  referral?: { name?: string; title?: string } | null;
  /** A win or loss reason the seller recorded. */
  reason?: string | null;
}

export interface OutcomeHypothesis {
  id: string;
  accountName: string;
  family: string | null;
  status: string;
  problemHypothesis: string;
  resolvedAt?: string | null;
  resolutionOutcome?: 'confirmed' | 'partially_confirmed' | 'rejected' | null;
  /** The disposition that resolved it, when known. */
  resolvedBy?: string | null;
}

export interface OutcomeSellerEdit {
  id: string;
  accountName: string | null;
  at: string;
  kind: 'seller_edit' | 'classification_override' | 'revise' | 'done_note';
  text: string;
}

export interface OutcomeMeeting {
  id: string;
  accountName: string;
  at: string;
  outcome: string;
  basis: string;
}

export interface OutcomeInputs {
  dispositions: readonly OutcomeDisposition[];
  hypotheses: readonly OutcomeHypothesis[];
  sellerEdits?: readonly OutcomeSellerEdit[];
  meetings?: readonly OutcomeMeeting[];
  now: Date;
}

export interface RejectedFamily {
  accountName: string;
  family: string | null;
  problemHypothesis: string;
  at: string;
  citedBy: string[];
}

export interface OutcomeAdvice {
  accountName: string | null;
  personaEmail: string | null;
  line: string;
  citedBy: string[];
  attribution: 'buyer' | 'seller';
}

export interface OutcomeLoop {
  claims: ContextClaim[];
  rejected: RejectedFamily[];
  advice: OutcomeAdvice[];
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
const WIN_LOSS = new Set(['won', 'closed_won', 'lost', 'closed_lost']);

function claim(over: Partial<ContextClaim> & Pick<ContextClaim, 'claimId' | 'sourceId' | 'text' | 'claimClass' | 'authority' | 'subjectId'>): ContextClaim {
  return { sourceKind: 'gap', eventAt: null, observedAt: null, indexedAt: null, url: null, version: null, completeness: 'complete', visibility: 'internal', about: 'account', ...over };
}

export function outcomeLoop(i: OutcomeInputs): OutcomeLoop {
  const claims: ContextClaim[] = [];
  const advice: OutcomeAdvice[] = [];
  const rejected: RejectedFamily[] = [];

  for (const d of i.dispositions) {
    // An unconfirmed row is an AI suggestion: no effect, no evidence (disposition/model.ts NO_EFFECTS).
    if (!d.humanConfirmed) continue;
    const subject = d.accountName ?? d.personaEmail ?? 'unknown';
    const src = `disposition:${d.id}`;
    if (d.quote && d.quote.trim()) {
      claims.push(claim({ claimId: `${src}:quote`, sourceId: src, text: `${d.personaEmail ?? 'the buyer'}: ${d.quote.trim()}`, claimClass: 'buyer_said', authority: 'buyer_words', subjectId: subject, eventAt: d.at, observedAt: d.at }));
    }
    if (d.responseClass === 'timing' && d.resumeAt) advice.push({ accountName: d.accountName, personaEmail: d.personaEmail, line: `Not now: resume after ${day(d.resumeAt)} (the buyer said so on ${day(d.at)}).`, citedBy: [src], attribution: 'buyer' });
    if (d.responseClass === 'referral' && d.referral) advice.push({ accountName: d.accountName, personaEmail: d.personaEmail, line: `Referred to ${[d.referral.name, d.referral.title].filter(Boolean).join(', ') || 'someone unnamed'} on ${day(d.at)}.`, citedBy: [src], attribution: 'buyer' });
    if (d.responseClass === 'existing_solution' || d.responseClass === 'problem_rejected') advice.push({ accountName: d.accountName, personaEmail: d.personaEmail, line: `${d.responseClass === 'existing_solution' ? 'An existing solution' : 'The problem'} was named on ${day(d.at)}; a reply must answer that, never restate the hypothesis.`, citedBy: [src], attribution: 'buyer' });
    if (WIN_LOSS.has(d.responseClass) && d.reason) claims.push(claim({ claimId: `${src}:reason`, sourceId: src, text: `${d.responseClass.replace('closed_', '')} on ${day(d.at)}: ${d.reason.trim()}`, claimClass: 'seller_noted', authority: 'seller_interpretation', subjectId: subject, eventAt: d.at, observedAt: d.at }));
  }

  for (const h of i.hypotheses) {
    if (h.status !== 'rejected' && h.resolutionOutcome !== 'rejected') continue;
    const at = h.resolvedAt ?? i.now.toISOString();
    const citedBy = [`hypothesis:${h.id}`, ...(h.resolvedBy ? [`disposition:${h.resolvedBy}`] : [])];
    rejected.push({ accountName: h.accountName, family: h.family, problemHypothesis: h.problemHypothesis, at, citedBy });
    claims.push(claim({ claimId: `hypothesis:${h.id}:rejected`, sourceId: `hypothesis:${h.id}`, text: `Hypothesis rejected on ${day(at)} (${h.family ?? 'unmapped'}): "${h.problemHypothesis.slice(0, 200)}" is not the buyer's problem; do not restate it.`, claimClass: 'seller_noted', authority: 'seller_interpretation', subjectId: h.accountName, eventAt: at, observedAt: at, conflictsWith: [] }));
  }

  for (const e of i.sellerEdits ?? []) {
    // A seller's own words are interpretation, whatever they were typed into; never the buyer's evidence.
    claims.push(claim({ claimId: `seller:${e.id}`, sourceId: `seller:${e.kind}:${e.id}`, text: e.text.trim().slice(0, 300), claimClass: 'seller_noted', authority: 'seller_interpretation', subjectId: e.accountName ?? 'unknown', eventAt: e.at, observedAt: e.at }));
  }

  for (const m of i.meetings ?? []) {
    claims.push(claim({ claimId: `meeting:${m.id}:outcome`, sourceId: `meeting:${m.id}`, text: `Meeting outcome on ${day(m.at)}: ${m.outcome.trim().slice(0, 200)} (basis: ${m.basis}).`, claimClass: 'seller_noted', authority: 'seller_interpretation', subjectId: m.accountName, eventAt: m.at, observedAt: m.at }));
    advice.push({ accountName: m.accountName, personaEmail: null, line: `A meeting outcome is on record (${day(m.at)}); the next step follows it, and no stage moves on it.`, citedBy: [`meeting:${m.id}`], attribution: 'seller' });
  }

  return { claims, rejected, advice };
}

/**
 * C55 acceptance: a rejected hypothesis never recurs as a fact. Any claim at the account that restates a rejected
 * hypothesis (the same idea, by context/same-idea.ts) is kept visible but superseded by the rejection, so
 * externallyUsable (commercial-context.ts) drops it and a reader sees why. Buyer words are never touched.
 */
export function guardFacts(claims: readonly ContextClaim[], rejected: readonly RejectedFamily[]): ContextClaim[] {
  return claims.map((c) => {
    if (c.claimClass === 'buyer_said') return c;
    const hit = rejected.find((r) => r.accountName.toLowerCase() === c.subjectId.toLowerCase() && sameIdea(r.problemHypothesis, c.text, r.accountName));
    if (!hit) return c;
    return { ...c, supersededBy: `rejected:${hit.citedBy[0]}`, conflictsWith: [...(c.conflictsWith ?? []), hit.citedBy[0]], text: `${c.text} [rejected ${day(hit.at)}: ${hit.citedBy.join(', ')}]` };
  });
}

/** C55 acceptance: a small sample never implies causal uplift; the words say what n allows. */
export function upliftLine(numerator: number, denominator: number, what = 'replied'): string {
  const r = rate(numerator, denominator);
  if (r.denominator === 0) return `no sends yet, so nothing ${what}: no rate, no claim.`;
  if (isLowSample(r)) return `${numerator} of ${denominator} ${what}: an early observation at n under ${MIN_RELIABLE_SAMPLE}, not a rate and not a cause.`;
  return `${numerator} of ${denominator} ${what} (${Math.round((r.value ?? 0) * 100)}%): observed, not causal; a comparison needs a control.`;
}
