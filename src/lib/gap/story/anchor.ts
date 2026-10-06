/**
 * OUTREACH ANCHOR (account-first UX, UX-06, 2026-10-06; Option A, the approved-thesis model). For the chosen person:
 *
 *   PRIMARY ANCHOR        ONE usable thesis at the account (approved or active, grounded, not needing review, and one
 *                         the send gate would let out); the person's recorded anchor choice when it is usable, else the
 *                         usable thesis whose fact lands on the person's remit, else the highest-ranked usable one
 *   WHY THIS PERSON CARES Our read, one sentence from the person's remit and the fact; never a prospect fact. When the
 *                         fact misses the chosen person's remit, the eligible person it fits is named (the caution
 *                         travels to NEXT)
 *   SUPPORTING FACT       one more checked, citable, live, physical-network fact that is not the anchor, only when
 *                         eligible
 *   BEST PROOF            YardFlow's own proof, clearly ours (the canon phrasing), never Checked, never a story row
 *   DO NOT USE            private engagement, an unverified item, a modeled value as their pain, an imagery fact, a
 *                         fact marked not for outreach, a checked line whose number does not parse
 *   USE A DIFFERENT STORY the other theses at the account; a thesis the gate would refuse, or one needing review, is
 *                         listed as not usable with the reason; choosing one records the choice on the person's angle
 *                         row and switches the action pack to that thesis; it never sends, never bypasses approval,
 *                         never widens the compiler's evidence scope
 *   DRAFT A THESIS        a checked, citable story line that no thesis (of any live status) is grounded on yet: the
 *                         prefilled draft (the story, the source, a proposed observation in the house cited form) goes
 *                         through the existing hypothesis authority and review transition, never straight into copy
 *
 * The distinction stands: the ACCOUNT STORY is the holistic account read (story.ts); the OUTREACH ANCHOR is the one
 * reviewed story chosen for this person (this file); the EMAIL COPY is the governed rendered message
 * (sequence/render.ts, the compiler, approval), which this file never touches. Pure; pinned by
 * tests/unit/gap/outreach-anchor.test.ts.
 */
import type { AccountInputs, AccountIntelligenceBrief, HypothesisView } from '../account-intel/build';
import { thesisRelevance } from '../people/thesis-relevance';
import { sensitivityOf } from '../research/sensitivity';
import { isPhysicalOpsFact } from '../research/facts';
import { citedQuote } from '../research/propose';
import { sameIdea } from '../context/same-idea';
import type { AccountStory, StoryRow, StorySentence, StoryTag } from './story';

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
  /** The fact family in words ("a site opening or expansion"). */
  factLabel: string;
  /** The problem the thesis opens on (Our read). */
  problem: string;
  /** Would the send gate let this opening out (its observation rests on a verified outreach fact) and is it not under review? */
  usable: boolean;
  /** Why not, when not usable. */
  unusableWhy: string | null;
}

export type PrimaryBy = 'your choice' | 'their remit' | 'the highest-ranked usable thesis';

export const PRIMARY_BY_TEXT: Record<PrimaryBy, string> = {
  'your choice': 'your choice',
  'their remit': 'it lands on their remit',
  'the highest-ranked usable thesis': 'the highest-ranked usable thesis',
};

export interface OutreachAnchor {
  person: AnchorPerson | null;
  primary: AnchorThesis | null;
  /** How the primary was chosen. */
  primaryBy: PrimaryBy | null;
  whyTheyCare: { text: string; tag: 'Our read' } | null;
  /** When the primary's fact misses the chosen person's remit: the eligible person it lands on, if any. */
  fitsBetter: AnchorPerson | null;
  supporting: StorySentence | null;
  bestProof: { text: string; tag: 'Our proof, measured' | 'Our model' };
  doNotUse: Array<{ text: string; reason: string }>;
  /** The other theses (approved, active or under review, grounded, not contradicted), the primary excluded. */
  alternatives: AnchorThesis[];
  /** Checked, citable story lines no thesis is grounded on: a prefilled draft each. */
  draftable: Array<{ story: string; sourceLabel: string; sourceUrl: string | null; factId: string; proposedObservation: string }>;
}

export interface AnchorInput {
  accountName: string;
  person: AnchorPerson | null;
  /** The eligible people on the stack (for "fits better"). */
  people?: AnchorPerson[];
  brief: Pick<AccountIntelligenceBrief, 'hypotheses'>;
  inputs: Pick<AccountInputs, 'facts' | 'hypotheses' | 'roi'>;
  story: Pick<AccountStory, 'rows'>;
  /** The person's recorded anchor choice (persona.angle row with anchorHypothesisId), if any. */
  anchorChoice: string | null;
  /** The private engagement line, when material (never used, only named under DO NOT USE). */
  privateLine: string | null;
  /**
   * The theses whose opening the send gate would let out (research/evidence-gate.ts `hypothesisSendable` over their
   * linked signals), from the loader. Absent means "not read": then nothing is called usable (fail closed).
   */
  sendable?: ReadonlySet<string> | null;
  /** Now, for fact expiry. */
  now: Date;
}

/** The canon, as the compiler phrases it (compiler/canon.ts): measured and modeled, both clearly YardFlow's. */
export const BEST_PROOF_MEASURED = 'Primo Brands: trailer turns 48 to 24 minutes, measured, with about 5% more volume through the same doors, observed; 24 sites live, 260 sites under contract.';
export const BEST_PROOF_MODELED = 'Our model, not their number: about $1M per site a year, modeled.';

const OPEN_STATUSES = new Set(['approved', 'active', 'confirmed', 'partially_confirmed']);
const REVIEW_STATUSES = new Set(['review_required']);
const LIVE_STATUSES = new Set([...OPEN_STATUSES, ...REVIEW_STATUSES, 'draft']);
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
const GENERIC_NOUN = /^(north|america|american|supply|chain|group|company|inc|corp|logistics|transportation|distribution|network|center|centre|county|township|united|states|texas|ohio)$/i;

/** Two story lines about the same counterparty are one story for the draft list (over-merging here costs nothing). */
function sharedCounterparty(a: string, b: string, account: string): boolean {
  const own = new Set(account.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const nouns = (t: string) => new Set((t.match(/\b[A-Z][a-z]{4,}\b/g) ?? []).map((w) => w.toLowerCase()).filter((w) => !own.has(w) && !GENERIC_NOUN.test(w)));
  const nb = nouns(b);
  return [...nouns(a)].some((w) => nb.has(w));
}

function thesisOf(h: HypothesisView, raw: AccountInputs['hypotheses'][number] | undefined, facts: AccountInputs['facts'], person: AnchorPerson | null, sendable: ReadonlySet<string> | null | undefined): AnchorThesis {
  const factIds = raw ? [...new Set([...raw.observation.matchAll(CITATION)].map((m) => m[1]))] : [];
  const first = facts.find((f) => factIds.includes(f.id) || (f.sameQuoteIds ?? []).some((id) => factIds.includes(id)));
  const rel = thesisRelevance(person?.title ?? null, { observation: h.observation.text, problemHypothesis: h.problem });
  const gateRead = !!sendable;
  const gateOk = !!sendable && sendable.has(h.id);
  const needsReview = h.needsReview.length > 0;
  return {
    hypothesisId: h.id,
    status: raw?.status ?? 'unknown',
    observation: stripCitations(h.observation.text),
    factIds,
    basis: first ? `${host(first.url) ?? 'source'}, ${day(first.publishedAt)}` : 'the thesis observation',
    relevance: { tier: rel.tier, why: rel.why },
    factLabel: rel.factLabel,
    problem: h.problem,
    usable: gateRead && gateOk && !needsReview,
    unusableWhy: !gateRead ? 'the send gate could not be read just now' : !gateOk ? 'its observation is a keyword hit or not a verified outreach fact, so the send gate would refuse the opening' : needsReview ? `the angle needs your review: ${h.needsReview[0].replace(/\.$/, '')}` : null,
  };
}

/** A thesis is eligible as an anchor when it is open, grounded, not contradicted, not under review and the gate would let it out. */
export function projectAnchor(i: AnchorInput): OutreachAnchor {
  const rawById = new Map(i.inputs.hypotheses.map((h) => [h.id, h]));
  const live = i.inputs.facts.filter((f) => !f.expiresAt || new Date(f.expiresAt).getTime() > i.now.getTime());
  const theses = i.brief.hypotheses
    .filter((h) => h.grounded && h.truth !== 'CONTRADICTED')
    .map((h) => thesisOf(h, rawById.get(h.id), live, i.person, i.sendable))
    .filter((t) => OPEN_STATUSES.has(t.status) || REVIEW_STATUSES.has(t.status));
  // Only a usable open thesis can be the anchor: the same gate the email runs (General Mills' active thesis opens on a
  // Brazil divestiture that needs review; the call page says so, and the anchor must never contradict it).
  const open = theses.filter((t) => OPEN_STATUSES.has(t.status) && t.usable);
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
    primaryBy = 'the highest-ranked usable thesis';
  }

  // WHY THIS PERSON CARES: their remit against the fact (Our read), never a prospect fact. When the fact misses the
  // chosen person's remit, the eligible person it lands on is named (NEXT carries the caution).
  let fitsBetter: AnchorPerson | null = null;
  if (primary && i.person && primary.relevance.tier === 'none') {
    const t = primary;
    const others = (i.people ?? []).filter((p) => p.name !== i.person!.name);
    const tierOf = (p: AnchorPerson) => thesisRelevance(p.title, { observation: t.observation, problemHypothesis: t.problem }).tier;
    fitsBetter = others.find((p) => tierOf(p) === 'direct') ?? others.find((p) => tierOf(p) === 'related') ?? null;
  }
  const first = i.person ? i.person.name.split(' ')[0] : '';
  const whyTheyCare = primary && i.person
    ? {
        text: primary.relevance.tier === 'none'
          ? `${first} ${primary.relevance.why.replace(/, which the fact.*$/, '')}; the fact (${primary.factLabel}) may not land on their remit${fitsBetter ? `, and ${fitsBetter.name}${fitsBetter.title ? ` (${fitsBetter.title})` : ''} fits it` : ', so ask who owns it'}.`
          : `${first} ${primary.relevance.why}.`,
        tag: 'Our read' as const,
      }
    : null;

  // SUPPORTING FACT: one more checked, citable, live, physical-network fact that is not the anchor's (the gate's rules).
  const citable = (f: AccountInputs['facts'][number]) => f.continuity !== 'ended' && !sensitivityOf(f.quote) && !BROKEN_MONEY.test(f.quote) && isPhysicalOpsFact(f.quote);
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

  // USE A DIFFERENT STORY: the other theses; DRAFT A THESIS: checked, citable story lines with no live thesis at all
  // (a thesis that needs review is still a thesis: review it, do not draft its twin).
  const alternatives = theses.filter((t) => t.hypothesisId !== primary?.hypothesisId);
  const groundedFactIds = new Set(
    i.brief.hypotheses
      .filter((h) => LIVE_STATUSES.has(rawById.get(h.id)?.status ?? ''))
      .flatMap((h) => [...(rawById.get(h.id)?.observation ?? '').matchAll(CITATION)].map((m) => m[1])),
  );
  const draftable: OutreachAnchor['draftable'] = [];
  for (const r of i.story.rows) {
    if (r.key !== 'changing' && r.key !== 'stories' && r.key !== 'goal') continue;
    for (const s of r.sentences) {
      if (s.tag !== 'Checked' || s.cite !== 'OK to cite to the buyer') continue;
      const factId = s.basisIds.map((id) => id.replace(/^evidence:/, '')).find((id) => live.some((f) => f.id === id || (f.sameQuoteIds ?? []).includes(id)));
      if (!factId) continue;
      const fact = live.find((f) => f.id === factId || (f.sameQuoteIds ?? []).includes(factId))!;
      if (groundedFactIds.has(fact.id) || (fact.sameQuoteIds ?? []).some((id) => groundedFactIds.has(id))) continue;
      if (theses.some((t) => sameIdea(t.observation, s.text, i.accountName) || sharedCounterparty(t.observation, s.text, i.accountName))) continue;
      if (draftable.some((d) => d.factId === fact.id || sameIdea(d.story, s.text, i.accountName) || sharedCounterparty(d.story, s.text, i.accountName))) continue;
      draftable.push({ story: s.text, sourceLabel: `${host(fact.url) ?? (fact.title || 'source')}, ${day(fact.publishedAt)}`, sourceUrl: fact.url, factId: fact.id, proposedObservation: citedQuote(fact.title || host(fact.url) || 'source', fact.quote.trim().replace(/\s+/g, ' '), fact.id, i.accountName) });
    }
  }

  return {
    person: i.person,
    primary,
    primaryBy,
    whyTheyCare,
    fitsBetter,
    supporting,
    bestProof: { text: BEST_PROOF_MEASURED, tag: 'Our proof, measured' },
    doNotUse,
    alternatives,
    draftable,
  };
}

/**
 * The story told once beside the anchor: a WHAT IS CHANGING or STORIES sentence that is the anchor's own fact is
 * replaced by one pointer ("The opening story, above."), never repeated (FedEx: three Tricolor blocks on one page).
 */
export function storyBesideAnchor(story: AccountStory, anchor: OutreachAnchor | null): AccountStory {
  const p = anchor?.primary;
  if (!p) return story;
  const key = p.observation.replace(/^[^:]{0,80}:\s*"?/, '').replace(/"?\.?$/, '').toLowerCase().slice(0, 80);
  const same = (text: string) => sameIdea(p.observation, text, '') || (key.length >= 40 && text.toLowerCase().includes(key));
  const rows: StoryRow[] = [];
  for (const r of story.rows) {
    if (r.key !== 'changing' && r.key !== 'stories') {
      rows.push(r);
      continue;
    }
    const kept = r.sentences.filter((s) => !same(s.text));
    if (kept.length === r.sentences.length) {
      rows.push(r);
      continue;
    }
    if (r.key === 'changing') kept.unshift({ text: 'The opening story, above.', tag: 'Checked', basis: `the anchor: ${p.basis}`, basisIds: p.factIds.map((id) => `evidence:${id}`) });
    if (kept.length) rows.push({ ...r, sentences: kept });
  }
  return { ...story, rows, first: story.first.map((f) => rows.find((r) => r.key === f.key)).filter((r): r is StoryRow => !!r) };
}
