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
import { BEST_PROOF_MEASURED, moneyShort, projectAnchor, storyBesideAnchor } from '@/lib/gap/story/anchor';
import { openerCaution } from '@/lib/gap/replies/call-pursuit';
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
  return { anchor: projectAnchor({ accountName: 'PepsiCo', person: p ? { personaId: p.id, name: p.name, title: p.title } : null, people: i.personas.map((x) => ({ personaId: x.id, name: x.name, title: x.title })), brief, inputs: i, story, anchorChoice, privateLine: v.private, sendable, now: NOW }), story, brief };
}

describe('the seller re-check batch: one fact is one item', () => {
  it('the supporting fact prefers a fact no other usable thesis is grounded on; when none exists, the alternative says it is the same fact', () => {
    // Karen: Denver is the anchor; Gatik grounds the only alternative; Maryland is sensitive. The supporting fact can
    // only be Gatik, and the alternative is flagged as the same fact (never three items on one page).
    const { anchor } = anchorFor(inputs(), 1);
    expect(anchor.supporting?.text).toBe(factA.quote);
    expect(anchor.alternatives.map((t) => [t.hypothesisId, t.sameAsSupporting === true])).toEqual([['h-gatik', true]]);
    // With a checked fact of its own, the supporting fact is that one and the alternative is not flagged.
    const factD = { ...factB, id: 'f-ohio', quote: 'PepsiCo is opening a new distribution center in Columbus, Ohio in 2027.', url: 'https://news.example/ohio' };
    const withD = anchorFor(inputs({ facts: [factA, factB, factC, factD] }), 1);
    expect(withD.anchor.supporting?.text).toBe(factD.quote);
    expect(withD.anchor.alternatives[0].sameAsSupporting).toBeUndefined();
  });
  it('the story beside the anchor tells the supporting fact once too (a pointer, never the sentence again)', () => {
    const { anchor, story } = anchorFor(inputs(), 1);
    const beside = storyBesideAnchor(story, anchor);
    const all = beside.rows.flatMap((r) => r.sentences.map((s) => s.text));
    expect(all.filter((t) => t === factA.quote)).toHaveLength(0);
    expect(all.filter((t) => t === factB.quote)).toHaveLength(0);
    expect(all).toContain('The opening story, above.');
    expect(all).toContain('The supporting fact, above.');
    // Nothing is told twice.
    expect(new Set(all).size).toBe(all.length);
  });
  it('DO NOT USE names each fact once, with every reason it carries', () => {
    const { anchor } = anchorFor(inputs(), 1);
    const texts = anchor.doNotUse.map((d) => d.text.trim().toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
    const maryland = anchor.doNotUse.filter((d) => d.text === factC.quote);
    expect(maryland).toHaveLength(1);
    expect(maryland[0].reason).toMatch(/sensitive \(people lost their jobs\)/);
  });
  it('a modeled dollar figure reads as a seller would say it', () => {
    expect(moneyShort(1_202_000_000)).toBe('$1.2B');
    expect(moneyShort(2_000_000_000)).toBe('$2B');
    expect(moneyShort(950_000_000)).toBe('$950M');
    expect(moneyShort(6_000_000)).toBe('$6M');
    expect(moneyShort(420_000)).toBe('$420K');
    const { anchor } = anchorFor(inputs({ roi: { hardSavingsAnnual: 2_000_000, totalValueAnnual: 1_202_000_000, facilities: 1250, calculatorVersion: 'v1', assumptions: [] } }), 1);
    expect(anchor.doNotUse.find((d) => d.text.startsWith('Our modeled value'))?.text).toBe('Our modeled value (about $1.2B a year across 1250 sites)');
  });
  it('the call page carries the same remit caution NEXT does, naming the eligible person the fact fits; none when the fact lands', () => {
    const glen = { name: 'Glen Chaffee', title: 'Managing Director, Transportation & Logistics, FedEx Ground' };
    const lisa = { name: 'Lisa Lisson', title: 'President, Air Network Operations' };
    const jeff = { name: 'Jeffrey Smith', title: 'Chief Operating Officer' };
    const air = { observation: { text: 'With Tricolor, we are redesigning our international air network by deploying our aircraft strategically to optimize asset utilization.' }, problem: 'My guess is that the air network redesign lands freight on ground yards on a new rhythm.' };
    const caution = openerCaution(glen, air, [glen, jeff, lisa]);
    expect(caution).toMatch(/^Caution: the opening fact is an air network change \(aircraft, flights\)[^;]* and may not land on Glen's remit; Lisa Lisson, President, Air Network Operations, fits it\.$/);
    // Lisa herself: the fact lands (related or direct), no caution; no opener, no caution.
    expect(openerCaution(lisa, air, [glen, lisa])).toBeNull();
    expect(openerCaution(glen, null, [lisa])).toBeNull();
    expect(openerCaution(null, air, [lisa])).toBeNull();
    // Nobody eligible fits: the caution still says the fact may not land, naming no one.
    expect(openerCaution(glen, air, [glen, jeff])).toMatch(/may not land on Glen's remit\.$/);
  });
});

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
    expect(cfo.primaryBy).toBe('the highest-ranked usable thesis');
    // With an eligible person the fact lands on, the read names them (the caution travels to NEXT).
    const i9 = inputs({ personas: [{ id: 9, name: 'Pat Finance', title: 'Chief Financial Officer', doNotContact: false, hasEmail: true, emailStatus: 'valid' }, ...personas] });
    const brief9 = buildAccountBrief(i9, NOW);
    const fits = projectAnchor({ accountName: 'PepsiCo', person: { personaId: 9, name: 'Pat Finance', title: 'Chief Financial Officer' }, people: i9.personas.map((p) => ({ personaId: p.id, name: p.name, title: p.title })), brief: brief9, inputs: i9, story: { rows: [] }, anchorChoice: null, privateLine: null, sendable: new Set(['h-denver', 'h-gatik']), now: NOW });
    expect(fits.fitsBetter?.name).toBe('Karen Darling');
    expect(fits.whyTheyCare?.text).toMatch(/Karen Darling \(Senior Director - PBNA Transportation\) fits it/);
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
  it('an open draft grounded on a checked fact is a PENDING proposal (status, family known or not, the person); its fact is not offered as a draft again (R11/R12)', () => {
    const { anchor } = anchorFor(inputs({ hypotheses: [hypA, hypB, { ...hypDraft, problemFamily: 'unmapped', personaId: 1 }] }), 1);
    expect(anchor.pending).toEqual([
      expect.objectContaining({ hypothesisId: 'h-draft', status: 'draft', factId: 'f-plant', story: factC.quote, family: 'unmapped', familyKnown: false, personaId: 1, personName: 'Karen Darling', gate: 'not_judged', observation: expect.stringMatching(/^PepsiCo is ceasing manufacturing/) }),
    ]);
    expect(anchor.pending[0].observation).not.toMatch(/\[S:/);
    expect(anchor.pending[0].observationRaw).toMatch(/\[S:f-plant\]/);
    expect(anchor.draftable.map((d) => d.factId)).not.toContain('f-plant');
    // A proposal under review with its family set reads as such; the gate is read from the loader's sendable set.
    const under = anchorFor(inputs({ hypotheses: [hypA, hypB, { ...hypDraft, status: 'review_required', problemFamily: 'hidden_capacity', personaId: 2 }] }), 1).anchor;
    expect(under.pending[0]).toMatchObject({ status: 'review_required', family: 'hidden_capacity', familyKnown: true, personName: 'Shawn Pierce', gate: 'sendable' });
    // An approved thesis is never pending; an account with no open draft has none.
    expect(anchorFor(inputs({ hypotheses: [hypA, hypB] }), 1).anchor.pending).toEqual([]);
  });
  it('item 2a: a story past its currentness is never draftable; it is listed TOO OLD with the reason; a proposal on it stays listed, says why and is refused; a current one says until when', () => {
    const tulsa = { ...factB, id: 'f-tulsa', quote: 'PepsiCo will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.', url: 'https://news.example/tulsa', publishedAt: '2026-07-23T00:00:00Z', expiresAt: '2026-09-06T00:00:00Z' };
    const denver = { ...factB, expiresAt: '2026-11-20T00:00:00Z' };
    const { anchor } = anchorFor(inputs({ facts: [factA, denver, factC, tulsa], hypotheses: [hypA] }), 1);
    expect(anchor.draftable.map((d) => d.factId)).not.toContain('f-tulsa');
    expect(anchor.draftable.find((d) => d.factId === 'f-denver')?.currentLine).toBe('Current until Nov 19, 2026.');
    expect(anchor.tooOld).toEqual([expect.objectContaining({ factId: 'f-tulsa', story: tulsa.quote, sourceUrl: tulsa.url, line: 'This story is too old for a first touch: it was current until Sep 5, 2026.' })]);
    // The stranded proposal on the old fact never vanishes: it is listed, says why, and its gate reads refused.
    const withDraft = anchorFor(inputs({ facts: [factA, denver, factC, tulsa], hypotheses: [hypA, { ...hypDraft, id: 'h-tulsa', status: 'review_required', observation: cited(tulsa.quote, 'f-tulsa'), problemFamily: 'hidden_capacity', personaId: 1 }] }), 1).anchor;
    expect(withDraft.pending).toEqual([expect.objectContaining({ hypothesisId: 'h-tulsa', factId: 'f-tulsa', gate: 'refused', stale: 'This story is too old for a first touch: it was current until Sep 5, 2026.' })]);
    expect(withDraft.tooOld).toEqual([]);
    // A current proposal carries no stale line.
    expect(anchorFor(inputs({ hypotheses: [hypA, hypB, { ...hypDraft, status: 'review_required', problemFamily: 'hidden_capacity', personaId: 2 }] }), 1).anchor.pending[0].stale).toBeNull();
  });
  it('item 2: a story the seller set aside (a rejected thesis cites it, loaded or listed by the loader) is never offered again and never listed as too old', () => {
    const denverOpen = anchorFor(inputs({ hypotheses: [hypA] }), 1).anchor;
    expect(denverOpen.draftable.map((d) => d.factId)).toContain('f-denver');
    // Set aside: the rejected thesis is among the loaded theses.
    const rejected = anchorFor(inputs({ hypotheses: [hypA, { ...hypB, id: 'h-denver-x', status: 'rejected' }] }), 1).anchor;
    expect(rejected.draftable.map((d) => d.factId)).not.toContain('f-denver');
    expect(rejected.tooOld.map((t) => t.factId)).not.toContain('f-denver');
    // Set aside by an older thesis the ten newest do not include: the loader's list carries it.
    const listed = anchorFor(inputs({ hypotheses: [hypA], setAsideFactIds: ['f-denver'] }), 1).anchor;
    expect(listed.draftable.map((d) => d.factId)).not.toContain('f-denver');
  });
  it('item 3: an incomplete proposal carries a suggested family (preselected, with why) and the title of its OWN person, never that of the anchor person', () => {
    const { anchor } = anchorFor(inputs({ hypotheses: [hypA, hypB, { ...hypDraft, problemFamily: 'unmapped', personaId: 2 }] }), 1);
    expect(anchor.pending[0]).toMatchObject({ familyKnown: false, suggestedFamily: 'hidden_capacity', suggestedBasis: expect.any(String), personaId: 2, personName: 'Shawn Pierce', personTitle: 'Sr Director Transportation Strategy' });
    const known = anchorFor(inputs({ hypotheses: [hypA, hypB, { ...hypDraft, status: 'review_required', problemFamily: 'hidden_capacity', personaId: 2 }] }), 1).anchor;
    expect(known.pending[0]).toMatchObject({ suggestedFamily: null, suggestedBasis: null });
  });
  it('R30/R31: a job claim (its class on the fact) is a draftable story; the draft the service makes of it carries the job/procurement approach, never the physical words', () => {
    const job = { id: 'f-job', quote: 'PepsiCo is now hiring a Transportation Coordinator in Dallas; apply by October 30.', url: 'https://jobs.pepsico.com/yard-ops-dallas', title: 'PepsiCo Careers', publishedAt: '2026-09-20T00:00:00Z', expiresAt: null, continuity: 'ongoing_state' as const, currentness: null, claimClass: 'JOB_POSTING' };
    const { anchor } = anchorFor(inputs({ facts: [factA, factB, job], hypotheses: [hypA, hypB] }), 1);
    expect(anchor.draftable.map((d) => d.factId)).toContain('f-job');
    // The class is what admits it as a story fact at all: without it the read (account-intel/load.ts, pinned in
    // account-intel-regate.test.ts) never hands the sentence to the story, so there is nothing to draft.
    expect(anchor.draftable.find((d) => d.factId === 'f-job')?.proposedObservation).toMatch(/\[S:f-job\]\.$/);
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
  it('the story is told once beside the anchor: the anchor\'s own sentence becomes a pointer, never a repeat', () => {
    const { anchor, story } = anchorFor(inputs(), 1);
    const before = story.rows.find((r) => r.key === 'changing')!;
    expect(before.sentences.some((s) => /Denver/.test(s.text))).toBe(true);
    const shown = storyBesideAnchor(story, anchor);
    const changing = shown.rows.find((r) => r.key === 'changing')!;
    expect(changing.sentences[0].text).toBe('The opening story, above.');
    expect(shown.rows.flatMap((r) => r.sentences).filter((s) => /Denver/.test(s.text))).toHaveLength(0);
    expect(storyBesideAnchor(story, null)).toBe(story);
  });
  it('a thesis that needs review is not usable; draftable stories about the same deal are one entry', () => {
    const i = inputs();
    const brief = buildAccountBrief(i, NOW);
    const review = { ...brief, hypotheses: brief.hypotheses.map((h) => (h.id === 'h-denver' ? { ...h, needsReview: ['the fact it opens on expired'] } : h)) };
    const a = projectAnchor({ accountName: 'PepsiCo', person: { personaId: 1, name: 'Karen Darling', title: 'Senior Director - PBNA Transportation' }, brief: review, inputs: i, story: { rows: [] }, anchorChoice: null, privateLine: null, sendable: new Set(['h-denver', 'h-gatik']), now: NOW });
    expect(a.primary?.hypothesisId).toBe('h-gatik');
    expect(a.alternatives.find((t) => t.hypothesisId === 'h-denver')?.unusableWhy).toMatch(/^the angle needs your review: the fact it opens on expired$/);
    // A fact an existing thesis (any live status) is grounded on is never offered as a new draft.
    expect(a.draftable.some((d) => d.factId === 'f-denver')).toBe(false);
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
    expect(none.primaryBy).toBe('the highest-ranked usable thesis');
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
    // An honest Title Case sentence with an ordinary verb passes; a bare headline with a verb is the reviewer's call.
    expect(titleShapedReason('CMA CGM Group Now Owns FedEx Supply Chain [S:a].')).toBeNull();
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
    expect(stack.rows[0].leadOver).toEqual({ over: expect.any(String), text: 'GAP cannot separate these two on current evidence.', tie: true, leads: false });
    // The seller's choice of the lower-ranked person is said as what it is, never as a tie.
    const behind = leadOver(r.eligible[1], r.eligible[0], 'COLD_FIRST_TOUCH');
    expect(behind?.leads).toBe(false);
    expect(behind?.text).toMatch(/^Glen/);
    const chosePat = buildPeopleStack(r, { chosenKey: r.eligible[1].key, chosenBy: 'you, Oct 5' });
    expect(chosePat.rows[0].name).toBe('Pat Ops');
    expect(chosePat.rows[0].leadOver).toMatchObject({ over: 'Glen Chaffee', tie: false, leads: false });
    const led = buildPeopleStack(r, { chosenKey: 'gap:7', chosenBy: 'you' });
    expect(led.rows[0].leadOver?.tie).toBe(false);
    expect(led.rows[0].leadOver?.over).toBe('Pat Ops');
    expect(led.rows[1].leadOver).toBeNull();
  });
});
