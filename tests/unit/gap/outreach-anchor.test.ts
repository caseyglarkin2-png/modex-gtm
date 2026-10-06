/**
 * UX-06, Option A: the outreach anchor is ONE approved grounded thesis for the chosen person; a different story is a
 * different thesis; nothing private, unverified, modeled or imagery-sourced can become the anchor; the supporting
 * fact is eligible or absent; BEST PROOF is clearly YardFlow's; a checked story line with no thesis is a prefilled
 * draft, never copy. Also: the title-shaped observation rule and "why #1 over #2" from the resolver's own rank keys.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { projectStory } from '@/lib/gap/story/story';
import { BEST_PROOF_MEASURED, projectAnchor } from '@/lib/gap/story/anchor';
import { OBSERVATION_REFUSAL_TEXT, titleShapedReason, validateObservation } from '@/lib/gap/hypothesis/observation';
import { leadOver, rankDimensionNames, resolveOwner, type OwnerCandidateInput } from '@/lib/gap/people/owner-resolution';
import { buildPeopleStack } from '@/lib/gap/people/stack';

const NOW = new Date('2026-10-06T12:00:00Z');
const PRIVATE_SENTINEL = '/for/pepsico-private-sentinel';
const factA = { id: 'f-gatik', quote: 'PepsiCo and Gatik announced a multi-year strategic partnership to bring autonomous freight into the PepsiCo North America food and beverage supply chain.', url: 'https://pepsico.com/news/gatik', title: 'PepsiCo and Gatik', publishedAt: '2026-08-25T00:00:00Z', expiresAt: null, continuity: 'ongoing_state' as const, currentness: null };
const factB = { id: 'f-denver', quote: 'PepsiCo is building a 1.2 million square foot distribution center in Denver, opening in 2027.', url: 'https://news.example/denver', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-03-01T00:00:00Z', continuity: 'event' as const, currentness: null };
const factC = { id: 'f-plant', quote: 'PepsiCo is ceasing manufacturing and warehouse operations at a bottling plant in Maryland, which will result in 143 layoffs, according to a WARN notice.', url: 'https://fooddive.com/x', title: 'news', publishedAt: '2026-09-16T00:00:00Z', expiresAt: null, continuity: 'event' as const, currentness: null };
const cited = (q: string, id: string) => `${q.replace(/[.!?]+$/, '')} [S:${id}].`;
const hypA = { id: 'h-gatik', status: 'active', observation: cited(factA.quote, 'f-gatik'), problem: 'My guess is that autonomous linehaul lands trailers on a schedule the yards were not built to keep.', rootCauses: ['Gate check-in is not tied to dock assignment'], impacts: [], falsification: ['Do autonomous arrivals wait at the gate?'], whatANoMeans: 'Arrivals flow. A no closes it.', primarySignalId: 'f-gatik', reviewedAt: '2026-09-01T00:00:00Z' };
const hypB = { id: 'h-denver', status: 'approved', observation: cited(factB.quote, 'f-denver'), problem: 'My guess is that a new DC opens on the old yard habits.', rootCauses: [], impacts: [], falsification: ['How will Denver check trailers in?'], whatANoMeans: 'One process from day one.', primarySignalId: 'f-denver', reviewedAt: '2026-09-25T00:00:00Z' };
const hypDraft = { id: 'h-draft', status: 'draft', observation: cited(factC.quote, 'f-plant'), problem: 'My guess is that the Maryland closure moves volume onto the other plants.', rootCauses: [], impacts: [], falsification: [], whatANoMeans: null, primarySignalId: 'f-plant' };
const personas = [
  { id: 1, name: 'Karen Darling', title: 'Senior Director - PBNA Transportation', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
  { id: 2, name: 'Shawn Pierce', title: 'Sr Director Transportation Strategy', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
];
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'PepsiCo', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '2' },
  aliases: [], domains: ['pepsico.com'], siblings: [], watched: true, watchReasons: [],
  facts: [factA, factB, factC], signals: [{ id: 's-rumor', title: 'PepsiCo said to weigh sale of Quaker Foods unit', url: 'https://rumor.example/q', publishedAt: '2026-09-28T00:00:00Z', researchStatus: 'pending' }], lastResearch: null,
  hypotheses: [hypA, hypB, hypDraft], bids: [], personas, candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: { hardSavingsAnnual: 2_000_000, totalValueAnnual: 6_000_000, facilities: 6, calculatorVersion: 'v1', assumptions: [] },
  ...over,
});
const ctx: AccountContext = {
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
  engagement: { ...projectEngagement([], NOW), sessions: 3, material: true, pages: [PRIVATE_SENTINEL], line: `Private: interest signal, never mention to the buyer. 3 deep sessions on ${PRIVATE_SENTINEL}.` },
  history: [], assets: [], legacyNote: null,
};

function anchorFor(i: AccountInputs, personaId: number | null, anchorChoice: string | null = null) {
  const brief = buildAccountBrief(i, NOW);
  const v = projectNow(brief, ctx, i, NOW);
  const eligible = i.personas.map((p) => ({ key: `gap:${p.id}`, personaId: p.id, name: p.name, title: p.title }));
  const state = projectPursuitState({ accountName: 'PepsiCo', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: personaId ? { personaId, by: 'casey@yardflow.ai', at: '2026-10-05T14:00:00Z', source: 'motion' } : null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
  const story = projectStory({ accountName: 'PepsiCo', now: NOW, state, brief, inputs: i, whyNow: v.whyNow, know: v.know, touches: [], clawdRead: 'ok', vaultNote: null, excluded: [] });
  const p = personaId ? i.personas.find((x) => x.id === personaId)! : null;
  const sendable = new Set(i.hypotheses.filter((h) => h.status !== 'draft' && !(i as AccountInputs & { unsendable?: string[] }).unsendable?.includes(h.id)).map((h) => h.id));
  return { anchor: projectAnchor({ accountName: 'PepsiCo', person: p ? { personaId: p.id, name: p.name, title: p.title } : null, brief, inputs: i, story, anchorChoice, privateLine: v.private, sendable, now: NOW }), story, brief };
}

describe('the outreach anchor (Option A)', () => {
  it('the primary anchor is one approved grounded thesis; the other open thesis is the alternative; the draft is neither', () => {
    const { anchor } = anchorFor(inputs(), 1);
    // Karen runs transportation: the Denver site opening lands directly on her remit; the Gatik fact is adjacent.
    expect(anchor.primary?.hypothesisId).toBe('h-denver');
    expect(anchor.primary?.relevance.tier).toBe('direct');
    expect(anchor.primary?.observation).toBe(factB.quote);
    expect(anchor.primary?.factIds).toEqual(['f-denver']);
    expect(anchor.primaryBy).toBe('their remit');
    expect(anchor.alternatives.map((t) => t.hypothesisId)).toEqual(['h-gatik']);
    expect(anchor.alternatives[0].status).toBe('active');
    expect(anchor.alternatives[0].relevance.tier).toBe('related');
  });
  it('a recorded choice switches the primary to that thesis, never to arbitrary evidence; an unknown choice is ignored', () => {
    const { anchor } = anchorFor(inputs(), 1, 'h-gatik');
    expect(anchor.primary?.hypothesisId).toBe('h-gatik');
    expect(anchor.primaryBy).toBe('your choice');
    expect(anchor.alternatives.map((t) => t.hypothesisId)).toEqual(['h-denver']);
    // A draft is not an approved thesis: choosing it changes nothing; an unknown id changes nothing.
    expect(anchorFor(inputs(), 1, 'h-draft').anchor.primary?.hypothesisId).toBe('h-denver');
    expect(anchorFor(inputs(), 1, 'nope').anchor.primary?.hypothesisId).toBe('h-denver');
  });
  it('WHY THIS PERSON CARES is Our read from the remit; a person whose remit the fact misses is told to ask who owns it', () => {
    const { anchor } = anchorFor(inputs(), 1);
    expect(anchor.whyTheyCare?.tag).toBe('Our read');
    expect(anchor.whyTheyCare?.text).toMatch(/^Karen /);
    const cfo = anchorFor(inputs({ personas: [{ id: 9, name: 'Pat Finance', title: 'Chief Financial Officer', doNotContact: false, hasEmail: true, emailStatus: 'valid' }] }), 9).anchor;
    expect(cfo.whyTheyCare?.text).toMatch(/ask who owns it/);
  });
  it('nothing private, unverified, modeled or imagery-sourced can be the anchor or the supporting fact; each is named under DO NOT USE', () => {
    const { anchor, story } = anchorFor(inputs(), 1);
    const texts = [anchor.primary?.observation ?? '', anchor.supporting?.text ?? ''].join(' ');
    expect(texts).not.toContain(PRIVATE_SENTINEL);
    expect(texts).not.toMatch(/Quaker Foods unit/);
    expect(texts).not.toMatch(/\$6M|modeled/i);
    expect(anchor.supporting?.tag).toBe('Checked');
    expect(anchor.supporting?.basisIds[0]).toMatch(/^evidence:f-/);
    expect(anchor.supporting?.basisIds[0]).not.toBe(`evidence:${anchor.primary!.factIds[0]}`);
    expect(anchor.doNotUse.some((d) => /visits to our pages/.test(d.text) && /private/.test(d.reason))).toBe(true);
    expect(anchor.doNotUse.some((d) => /modeled value/.test(d.text) && /our model/.test(d.reason))).toBe(true);
    const unverifiedInStory = story.rows.flatMap((r) => r.sentences).filter((s) => s.tag === 'Unverified');
    for (const u of unverifiedInStory) expect(anchor.doNotUse.some((d) => d.text === u.text)).toBe(true);
    expect(anchor.doNotUse.every((d) => d.text !== anchor.primary?.observation)).toBe(true);
  });
  it('BEST PROOF is YardFlow proof in the canon phrasing, tagged ours, never Checked', () => {
    const { anchor } = anchorFor(inputs(), 1);
    expect(anchor.bestProof).toEqual({ text: BEST_PROOF_MEASURED, tag: 'Our proof, measured' });
    expect(anchor.bestProof.text).toMatch(/48 to 24 minutes, measured/);
    expect(anchor.bestProof.text).toMatch(/Primo Brands/);
  });
  it('a checked, citable story line with no thesis is a prefilled DRAFT + REVIEW, with the source and a cited observation; a grounded one is not', () => {
    const { anchor } = anchorFor(inputs({ hypotheses: [hypA] }), 1);
    const denver = anchor.draftable.find((d) => d.factId === 'f-denver');
    expect(denver).toBeDefined();
    expect(denver!.proposedObservation).toMatch(/: "PepsiCo is building a 1\.2 million square foot distribution center in Denver, opening in 2027" \[S:f-denver\]\.$/);
    expect(validateObservation(denver!.proposedObservation, ['f-denver']).ok).toBe(true);
    expect(denver!.sourceUrl).toBe(factB.url);
    expect(denver!.sourceLabel).toMatch(/news\.example, Sep 20, 2026/);
    expect(anchor.draftable.some((d) => d.factId === 'f-gatik')).toBe(false);
    // Not for outreach (the WARN notice is checked but not citable): never draftable.
    expect(anchor.draftable.some((d) => d.factId === 'f-plant')).toBe(false);
  });
  it('a thesis the send gate would refuse is never the anchor and is listed as not usable; with the gate unread nothing is usable', () => {
    const gated = { ...inputs(), unsendable: ['h-denver'] } as AccountInputs & { unsendable: string[] };
    const { anchor } = anchorFor(gated, 1);
    expect(anchor.primary?.hypothesisId).toBe('h-gatik');
    const denver = anchor.alternatives.find((t) => t.hypothesisId === 'h-denver')!;
    expect(denver.usable).toBe(false);
    expect(denver.unusableWhy).toMatch(/keyword hit or not a verified outreach fact/);
    // A recorded choice of an unusable thesis changes nothing.
    expect(anchorFor(gated, 1, 'h-denver').anchor.primary?.hypothesisId).toBe('h-gatik');
    const unread = projectAnchor({ accountName: 'PepsiCo', person: { personaId: 1, name: 'Karen Darling', title: 'Senior Director - PBNA Transportation' }, brief: buildAccountBrief(inputs(), NOW), inputs: inputs(), story: { rows: [] }, anchorChoice: null, privateLine: null, sendable: null, now: NOW });
    expect(unread.primary).toBeNull();
    expect(unread.alternatives.every((t) => !t.usable && /could not be read/.test(t.unusableWhy ?? ''))).toBe(true);
  });
  it('a thesis that needs review is not usable; draftable stories about the same deal are one entry', () => {
    const i = inputs();
    const brief = buildAccountBrief(i, NOW);
    const review = { ...brief, hypotheses: brief.hypotheses.map((h) => (h.id === 'h-denver' ? { ...h, needsReview: ['the fact it opens on expired'] } : h)) };
    const a = projectAnchor({ accountName: 'PepsiCo', person: { personaId: 1, name: 'Karen Darling', title: 'Senior Director - PBNA Transportation' }, brief: review, inputs: i, story: { rows: [] }, anchorChoice: null, privateLine: null, sendable: new Set(['h-denver', 'h-gatik']), now: NOW });
    expect(a.primary?.hypothesisId).toBe('h-gatik');
    expect(a.alternatives.find((t) => t.hypothesisId === 'h-denver')?.unusableWhy).toMatch(/needs your review/);
    const twice = { rows: [{ key: 'changing' as const, label: 'x', tag: 'Checked' as const, collapsed: false, wrongIf: null, sentences: [
      { text: 'PepsiCo and Gatik announced a multi-year partnership for autonomous freight.', tag: 'Checked' as const, basis: 'pepsico.com', basisIds: ['evidence:f-gatik'], cite: 'OK to cite to the buyer' as const },
      { text: 'Gatik moves freight for PepsiCo under a new multi-year agreement.', tag: 'Checked' as const, basis: 'freightwaves.com', basisIds: ['evidence:f-gatik2'], cite: 'OK to cite to the buyer' as const },
    ] }] };
    const i2 = inputs({ hypotheses: [], facts: [factA, { ...factA, id: 'f-gatik2', quote: 'Gatik moves freight for PepsiCo under a new multi-year agreement.', url: 'https://freightwaves.com/g' }] });
    const b = projectAnchor({ accountName: 'PepsiCo', person: null, brief: buildAccountBrief(i2, NOW), inputs: i2, story: twice, anchorChoice: null, privateLine: null, sendable: new Set(), now: NOW });
    expect(b.draftable).toHaveLength(1);
    expect(b.draftable[0].factId).toBe('f-gatik');
  });
  it('without a person there is no primary by remit and no why-they-care; without an open thesis there is no primary at all', () => {
    const none = anchorFor(inputs(), null).anchor;
    expect(none.person).toBeNull();
    expect(none.whyTheyCare).toBeNull();
    expect(none.primaryBy).toBe('the top grounded thesis');
    const bare = anchorFor(inputs({ hypotheses: [hypDraft] }), 1).anchor;
    expect(bare.primary).toBeNull();
    expect(bare.alternatives).toHaveLength(0);
  });
});

describe('the title-shaped observation rule', () => {
  it('refuses a pasted headline with plain language and accepts a sentence about what changed', () => {
    expect(titleShapedReason('FedEx Completes Sale of FedEx Supply Chain to CMA CGM Group [S:a].')).toMatch(/reads like a headline/);
    expect(titleShapedReason('PepsiCo and Gatik Announce Multi-Year Strategic Partnership [S:a].')).toMatch(/reads like a headline/);
    expect(titleShapedReason('FedEx completed the sale of FedEx Supply Chain to CMA CGM on October 1 [S:a].')).toBeNull();
    expect(titleShapedReason('PepsiCo and Gatik announced a multi-year strategic partnership to bring autonomous freight into the PepsiCo North America supply chain [S:a].')).toBeNull();
    expect(titleShapedReason('Walmart is accelerating a broad overhaul of its U.S. distribution network [S:a].')).toBeNull();
    expect(validateObservation('FedEx Completes Sale of FedEx Supply Chain to CMA CGM Group [S:a].', ['a'])).toEqual({ ok: false, reason: 'title_shaped_observation' });
    expect(validateObservation('FedEx completed the sale of FedEx Supply Chain to CMA CGM on October 1 [S:a].', ['a']).ok).toBe(true);
    expect(validateObservation('They opened a second DC in Ohio [S:S1]. Trailer counts doubled [S:S2].', ['S1', 'S2']).ok).toBe(true);
    expect(OBSERVATION_REFUSAL_TEXT.title_shaped_observation).toMatch(/reads like a headline/);
  });
});

describe('why #1 over #2 from the rank keys', () => {
  const gap = (id: number, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false }, ...over });
  it('the dimension names match the rank keys in order for every purpose', () => {
    const r = resolveOwner({ account: { name: 'FedEx', entityType: 'carrier' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(7, 'Glen Chaffee', 'Managing Director, Transportation & Logistics'), gap(2, 'Jeffrey Tallman', 'Vice President, Operations Planning and Engineering, North America')], hubspot: { read: true, count: 2, truncated: false, via: 'linked' }, now: NOW });
    expect(r.eligible[0].rank?.length).toBe(rankDimensionNames('COLD_FIRST_TOUCH').length);
    for (const p of ['COLD_FIRST_TOUCH', 'SITE_PILOT', 'TRANSFORMATION_INITIATIVE', 'HYPOTHESIS_ACTIVATION'] as const) expect(rankDimensionNames(p).length).toBeGreaterThan(8);
  });
  it('names the first dimension on which the top person leads, from the two reads, and says nothing on a tie', () => {
    const r = resolveOwner({ account: { name: 'FedEx', entityType: 'carrier' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(7, 'Glen Chaffee', 'Managing Director, Transportation & Logistics'), gap(3, 'Pat Ops', 'Director, Logistics')], hubspot: { read: true, count: 2, truncated: false, via: 'linked' }, now: NOW });
    const lead = leadOver(r.eligible[0], r.eligible[1], 'COLD_FIRST_TOUCH');
    expect(lead).not.toBeNull();
    expect(lead!.text).toMatch(/^Glen'?s? .*; Pat'?s? /);
    expect(lead!.dimension).toBe('named ownership');
    const tie = resolveOwner({ account: { name: 'Walmart Inc.', entityType: 'retailer' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(1, 'Doug Estrada', 'Regional Transportation Director'), gap(2, 'Kelly Kruse', 'Regional Transportation Director')], hubspot: { read: true, count: 2, truncated: false, via: 'linked' }, now: NOW });
    expect(leadOver(tie.eligible[0], tie.eligible[1], 'COLD_FIRST_TOUCH')).toBeNull();
    const stack = buildPeopleStack(tie, { chosenKey: null });
    expect(stack.rows[0].leadOver).toEqual({ over: expect.any(String), text: 'GAP cannot separate these two on current evidence.', tie: true });
    const led = buildPeopleStack(r, { chosenKey: 'gap:7', chosenBy: 'you' });
    expect(led.rows[0].leadOver?.tie).toBe(false);
    expect(led.rows[0].leadOver?.over).toBe('Pat Ops');
    expect(led.rows[1].leadOver).toBeNull();
  });
});
