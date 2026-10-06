/**
 * OUTREACH ANCHOR (account-first UX, UX-06, 2026-10-06; Option A, the approved-thesis model). For the chosen person:
 *
 *   PRIMARY ANCHOR        ONE approved, grounded hypothesis at the account (its observation is the verified fact the
 *                         opening is built on); the person's recorded anchor choice when it is still eligible, else
 *                         the grounded thesis whose fact lands on the person's remit, else the top grounded thesis
 *   WHY THIS PERSON CARES Our read, one sentence from the person's remit and the fact; never a prospect fact
 *   SUPPORTING FACT       one more checked, citable fact that is not the anchor, only when eligible
 *   BEST PROOF            YardFlow's own proof, clearly ours (the canon phrasing), never Checked, never a story row
 *   DO NOT USE            private engagement, an unverified item, a modeled value as their pain, an imagery fact, a
 *                         fact marked not for outreach, a checked line whose number does not parse
 *   USE A DIFFERENT STORY the other eligible grounded or reviewed hypotheses at the account; choosing one records
 *                         the choice on the person's angle row and switches the action pack to that thesis; it
 *                         never sends, never bypasses approval, never widens the compiler's evidence scope
 *   DRAFT + REVIEW STORY  a checked, citable story line that no thesis is grounded on yet: the prefilled draft
 *                         (the story, the source, a proposed observation sentence with its citation) goes through
 *                         the existing hypothesis authority and review transition, never straight into copy
 *
 * The distinction stands: the ACCOUNT STORY is the holistic account read (story.ts); the OUTREACH ANCHOR is the one
 * reviewed story chosen for this person (this file); the EMAIL COPY is the governed rendered message
 * (sequence/render.ts, the compiler, approval), which this file never touches. Pure; pinned by
 * tests/unit/gap/outreach-anchor.test.ts.
 */
import type { AccountInputs, AccountIntelligenceBrief, HypothesisView } from '../account-intel/build';
import { thesisRelevance } from '../people/thesis-relevance';
import { sensitivityOf } from '../research/sensitivity';
import type { AccountStory, StorySentence, StoryTag } from './story';

export interface AnchorPerson {
  personaId: number | null;
  name: string;
  title: string | null;
}

export interface AnchorThesis {
  hypothesisId: string;
  /** The hypothesis status as stored ('approved', 'active', 'review_required', 'draft', ...). */
  status: string;
  /** The observation without its citation tokens: the verified fact in the thesis's own words. */
  observation: string;
  /** The fact ids the observation cites. */
  factIds: string[];
  /** The fact's source, dated (the first cited fact). */
  basis: string;
  /** Does the fact land on the person's remit (thesis-relevance), and why. */
  relevance: { tier: 'direct' | 'related' | 'none'; why: string };
  /** The problem the thesis opens on (Our read). */
  problem: string;
}

export interface OutreachAnchor {
  person: AnchorPerson | null;
  primary: AnchorThesis | null;
  /** How the primary was chosen: the person's recorded choice, the fact on their remit, or the top grounded thesis. */
  primaryBy: 'your choice' | 'their remit' | 'the top grounded thesis' | null;
  whyTheyCare: { text: string; tag: 'Our read' } | null;
  supporting: StorySentence | null;
  bestProof: { text: string; tag: 'Our proof, measured' | 'Our model' };
  doNotUse: Array<{ text: string; reason: string }>;
  /** The other eligible theses (approved, active or under review, grounded, not contradicted), the primary excluded. */
  alternatives: AnchorThesis[];
  /** Checked, citable story lines no thesis is grounded on: a prefilled draft each. */
  draftable: Array<{ story: string; sourceLabel: string; sourceUrl: string | null; factId: string; proposedObservation: string }>;
}

export interface AnchorInput {
  accountName: string;
  person: AnchorPerson | null;
  brief: Pick<AccountIntelligenceBrief, 'hypotheses'>;
  inputs: Pick<AccountInputs, 'facts' | 'hypotheses' | 'roi'>;
  story: Pick<AccountStory, 'rows'>;
  /** The person's recorded anchor choice (persona.angle row with anchorHypothesisId), if any. */
  anchorChoice: string | null;
  /** The private engagement line, when material (never used, only named under DO NOT USE). */
  privateLine: string | null;
  /** Now, for fact expiry. */
  now: Date;
}

/** The canon, as the compiler phrases it (compiler/canon.ts): measured and modeled, both clearly YardFlow's. */
export const BEST_PROOF_MEASURED = 'Primo Brands: trailer turns 48 to 24 minutes, measured, with about 5% more volume through the same doors, observed; 24 sites live, 260 sites under contract.';
export const BEST_PROOF_MODELED = 'Our model, not their number: about $1M per site a year, modeled.';

const OPEN_STATUSES = new Set(['approved', 'active']);
const REVIEW_STATUSES = new Set(['review_required']);
const CITATION = /\[S:([A-Za-z0-9_-]+)\]/g;
const stripCitations = (t: string) => t.replace(CITATION, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
const day = (s: string | null | undefined) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'undated');
const host = (u: string | null) => {
  try {
    return u ? new URL(u).hostname.replace(/^www\./, '') : null;
  } catch {
    return null;
  }
};
const BROKEN_MONEY = /\$\s?\d{1,3}(?:\.\d+)?\s+(?!(?:m|b|k|mm|bn|million|billion|thousand|per|a|an|each|to)\b)[a-z]/i;

function thesisOf(h: HypothesisView, raw: AccountInputs['hypotheses'][number] | undefined, facts: AccountInputs['facts'], person: AnchorPerson | null): AnchorThesis {
  const factIds = raw ? [...new Set([...(raw.observation.matchAll(CITATION))].map((m) => m[1]))] : [];
  const first = facts.find((f) => factIds.includes(f.id) || (f.sameQuoteIds ?? []).some((id) => factIds.includes(id)));
  const rel = thesisRelevance(person?.title ?? null, { observation: h.observation.text, problemHypothesis: h.problem });
  return {
    hypothesisId: h.id,
    status: raw?.status ?? 'unknown',
    observation: stripCitations(h.observation.text),
    factIds,
    basis: first ? `${host(first.url) ?? 'source'}, ${day(first.publishedAt)}` : 'the thesis observation',
    relevance: { tier: rel.tier, why: rel.why },
    problem: h.problem,
  };
}

/** A grounded thesis is eligible as an anchor when it is approved or active, grounded and not contradicted; one under review is listed, never primary. */
export function projectAnchor(i: AnchorInput): OutreachAnchor {
  const rawById = new Map(i.inputs.hypotheses.map((h) => [h.id, h]));
  const live = i.inputs.facts.filter((f) => !f.expiresAt || new Date(f.expiresAt).getTime() > i.now.getTime());
  const theses = i.brief.hypotheses
    .filter((h) => h.grounded && h.truth !== 'CONTRADICTED')
    .map((h) => thesisOf(h, rawById.get(h.id), live, i.person))
    .filter((t) => OPEN_STATUSES.has(t.status) || REVIEW_STATUSES.has(t.status));
  const open = theses.filter((t) => OPEN_STATUSES.has(t.status));
  const tierRank = { direct: 0, related: 1, none: 2 } as const;
  const byRemit = [...open].sort((a, b) => tierRank[a.relevance.tier] - tierRank[b.relevance.tier]);

  let primary: AnchorThesis | null = null;
  let primaryBy: OutreachAnchor['primaryBy'] = null;
  const chosen = i.anchorChoice ? open.find((t) => t.hypothesisId === i.anchorChoice) ?? null : null;
  if (chosen) {
    primary = chosen;
    primaryBy = 'your choice';
  } else if (byRemit[0] && byRemit[0].relevance.tier !== 'none' && i.person) {
    primary = byRemit[0];
    primaryBy = 'their remit';
  } else if (open[0]) {
    primary = open[0];
    primaryBy = 'the top grounded thesis';
  }

  // WHY THIS PERSON CARES: their remit against the fact (Our read), never a prospect fact.
  const whyTheyCare = primary && i.person
    ? { text: `${i.person.name.split(' ')[0]} ${primary.relevance.tier === 'none' ? `runs ${primary.relevance.why.replace(/^runs /, '').replace(/, which the fact.*$/, '')}; the fact may not land on their remit, so ask who owns it` : primary.relevance.why}.`.replace(/\.\.$/, '.'), tag: 'Our read' as const }
    : null;

  // SUPPORTING FACT: one more checked, citable, parsable fact that is not the anchor's.
  const citable = (f: AccountInputs['facts'][number]) => !sensitivityOf(f.quote) && !BROKEN_MONEY.test(f.quote);
  const supportingFact = primary ? live.find((f) => !primary.factIds.includes(f.id) && !(f.sameQuoteIds ?? []).some((id) => primary.factIds.includes(id)) && citable(f)) ?? null : null;
  const supporting: StorySentence | null = supportingFact
    ? { text: supportingFact.quote, tag: 'Checked' as StoryTag, basis: `${host(supportingFact.url) ?? 'source'}, ${day(supportingFact.publishedAt)}`, basisIds: [`evidence:${supportingFact.id}`], cite: 'OK to cite to the buyer' }
    : null;

  // DO NOT USE: named so the seller never reaches for them.
  const doNotUse: OutreachAnchor['doNotUse'] = [];
  if (i.privateLine) doNotUse.push({ text: 'Their visits to our pages and ROI reads', reason: 'private engagement: interest, never a reason to write' });
  if (i.inputs.roi) doNotUse.push({ text: `Our modeled value (about $${Math.round(i.inputs.roi.totalValueAnnual / 1e6)}M a year across ${i.inputs.roi.facilities} sites)`, reason: 'our model, never their pain until they say it' });
  for (const r of i.story.rows) {
    for (const s of r.sentences) {
      if (s.tag === 'Unverified') doNotUse.push({ text: s.text, reason: s.basis.includes('does not parse') ? 'the number does not parse; check the source first' : 'unverified: a third party said it and nobody checked' });
      else if (s.cite === 'Never cite (from imagery)') doNotUse.push({ text: s.text, reason: 'from imagery: a fact about one site on one date, never cited' });
      else if (s.cite === 'Checked, not for outreach') doNotUse.push({ text: s.text, reason: 'checked, but marked not for outreach' });
    }
  }
  for (const f of live) if (sensitivityOf(f.quote)) doNotUse.push({ text: f.quote, reason: `sensitive (${sensitivityOf(f.quote)}): never the hook` });

  // USE A DIFFERENT STORY: the other eligible theses; DRAFT + REVIEW: checked, citable story lines with no thesis.
  const alternatives = theses.filter((t) => t.hypothesisId !== primary?.hypothesisId);
  const groundedFactIds = new Set(theses.flatMap((t) => t.factIds));
  const draftable: OutreachAnchor['draftable'] = [];
  for (const r of i.story.rows) {
    if (r.key !== 'changing' && r.key !== 'stories' && r.key !== 'goal') continue;
    for (const s of r.sentences) {
      if (s.tag !== 'Checked' || s.cite !== 'OK to cite to the buyer') continue;
      const factId = s.basisIds.map((id) => id.replace(/^evidence:/, '')).find((id) => live.some((f) => f.id === id || (f.sameQuoteIds ?? []).includes(id)));
      if (!factId) continue;
      const fact = live.find((f) => f.id === factId || (f.sameQuoteIds ?? []).includes(factId))!;
      if (groundedFactIds.has(fact.id) || (fact.sameQuoteIds ?? []).some((id) => groundedFactIds.has(id))) continue;
      if (draftable.some((d) => d.factId === fact.id)) continue;
      draftable.push({ story: s.text, sourceLabel: `${host(fact.url) ?? (fact.title || 'source')}, ${day(fact.publishedAt)}`, sourceUrl: fact.url, factId: fact.id, proposedObservation: `${fact.quote.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '')} [S:${fact.id}].` });
    }
  }

  return {
    person: i.person,
    primary,
    primaryBy,
    whyTheyCare,
    supporting,
    bestProof: { text: BEST_PROOF_MEASURED, tag: 'Our proof, measured' },
    doNotUse,
    alternatives,
    draftable,
  };
}
