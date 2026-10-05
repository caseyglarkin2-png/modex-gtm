/**
 * OPERATOR-FIRST COLD WHO, wired through both recommendation authorities (seller correction, 2026-10-04).
 *
 * Live PepsiCo (read-only repro, 2026-10-04): the account brief already ranked 542 HubSpot people and named a
 * Sr Director of Transportation, but the COCKPIT ranks only the READY cards, and cards exist only for GAP contacts
 * that pass the generic routing role gate: five VP Supply Chain personas and a specialist. Its "Suggested primary"
 * (Michelle Schlie, VP Supply Chain) became a first-touch draft. The brief's motion WHO had the same blind spot (GAP
 * contacts only, any operating lane). Now:
 *   - the cockpit never SUGGESTS a card whose person is not cold WHO; Casey's explicit choice still makes it primary
 *   - the brief's primary is a direct operator or nobody ("transportation owner not yet identified: research")
 *   - the sponsor, the transportation tech / transformation contact and the site operator are named separately
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { computeAccountMotion, confirmChoiceBody, type MotionCard } from '@/lib/gap/motion/account-motion';
import { apolloCandidates } from '@/lib/gap/people/apollo-candidates';
import { projectEngagement, projectHistory, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';

const NOW = new Date('2026-10-04T15:00:00Z');

// ------------------------------------------------------------------ the cockpit (account motion)
const card = (id: string, pid: number, title: string): MotionCard => ({
  id,
  action: 'one_off_email',
  account: { name: 'Acme Foods' },
  persona: { id: pid, displayName: `${id} person`, title, email: `${id}@acme.com`, personaKey: 'supply_chain', phone: null },
  hypothesis: { id: 'h1', status: 'active', persona: 'supply_chain' },
  createdAt: NOW,
});
const base = { accountName: 'Acme Foods', choice: null, firstTouches: [], replyHold: null, now: NOW };

describe('the cockpit never suggests a sponsor as the cold first touch', () => {
  it('only VP Supply Chain cards: no suggested primary, every card held, the owner is research', () => {
    const m = computeAccountMotion({ ...base, readyEmailCards: [card('vp1', 1, 'Vice President Supply Chain'), card('vp2', 2, 'Vice President Supply Chain'), card('spec', 3, 'Senior Supply Chain Specialist')] });
    expect(m.state).toBe('needs_owner');
    expect(m.primary).toBeNull();
    expect(m.heldCardIds.sort()).toEqual(['spec', 'vp1', 'vp2']);
    expect(m.headline).toBe('No ready card is for a direct transportation operator: check the BRIEF buyer map (it may name one in HubSpot to add as a GAP contact), else research. Sponsor on record: vp1 person (Vice President Supply Chain). A card leads only by your choice.');
    expect(m.alsoWaiting.map((p) => p.name)).toEqual(['vp1 person', 'vp2 person', 'spec person']);
  });
  it("Casey's explicit choice still makes the sponsor primary", () => {
    const m = computeAccountMotion({ ...base, choice: { primaryPersonaId: 2, nextPersonaId: null, by: 'casey', at: NOW.toISOString() }, readyEmailCards: [card('vp1', 1, 'Vice President Supply Chain'), card('vp2', 2, 'Vice President Supply Chain')] });
    expect(m.state).toBe('ready');
    expect(m.primary).toMatchObject({ name: 'vp2 person', chosen: true });
  });
  it('a direct operator card is the suggested primary; the sponsor waits as next', () => {
    const m = computeAccountMotion({ ...base, readyEmailCards: [card('vp', 1, 'Vice President Supply Chain'), card('tom', 2, 'Transportation Operations Manager')] });
    expect(m.state).toBe('ready');
    expect(m.primary).toMatchObject({ name: 'tom person', chosen: false });
    expect(m.next?.name).toBe('vp person');
    // Review N1: the display never promises an unlock that would not happen.
    expect(m.next?.unlock).toMatch(/then only by your choice \(not a direct transportation operator\)$/);
  });
  it('re-review C2: confirming the operator never records the non-operator NEXT as Casey\'s choice', () => {
    const m = computeAccountMotion({ ...base, readyEmailCards: [card('vp', 1, 'Vice President Supply Chain'), card('tom', 2, 'Transportation Operations Manager')] });
    expect(m.next).toMatchObject({ name: 'vp person', byChoiceOnly: true });
    expect(confirmChoiceBody(m)).toEqual({ accountName: 'Acme Foods', primaryPersonaId: 2, nextPersonaId: null });
    const ops = computeAccountMotion({ ...base, readyEmailCards: [card('a', 1, 'Director of Transportation'), card('tom', 2, 'Transportation Operations Manager')] });
    expect(confirmChoiceBody(ops)).toEqual({ accountName: 'Acme Foods', primaryPersonaId: 1, nextPersonaId: 2 });
  });
  it('re-review: an old choice never unlocks a non-operator after a touch sent later', () => {
    const sent = new Date(NOW.getTime() - 20 * 86_400_000).toISOString();
    const old = new Date(NOW.getTime() - 40 * 86_400_000).toISOString();
    const cards = [card('vp', 1, 'Vice President Supply Chain'), card('tom', 2, 'Transportation Operations Manager')];
    const touches = [{ personaId: 2, recipient: 'tom@acme.com', sentAt: sent, released: false }];
    expect(computeAccountMotion({ ...base, choice: { primaryPersonaId: 1, nextPersonaId: null, by: 'casey', at: old }, firstTouches: touches, readyEmailCards: cards }).state).toBe('needs_owner');
    expect(computeAccountMotion({ ...base, choice: { primaryPersonaId: 1, nextPersonaId: null, by: 'casey', at: NOW.toISOString() }, firstTouches: touches, readyEmailCards: cards }).state).toBe('ready');
  });
  it('review S2: the headline names a sponsor only by the sponsor rule', () => {
    const m = computeAccountMotion({ ...base, readyEmailCards: [card('cat', 1, 'Transportation Category Manager'), card('fs', 2, 'Fleet Safety Manager')] });
    expect(m.state).toBe('needs_owner');
    expect(m.headline).not.toMatch(/Sponsor on record/);
  });
  it('review S1: after an unlock, choosing someone (primaryPersonaId) makes them primary', () => {
    const sent = new Date(NOW.getTime() - 20 * 86_400_000).toISOString();
    const m = computeAccountMotion({ ...base, choice: { primaryPersonaId: 1, nextPersonaId: null, by: 'casey', at: NOW.toISOString() }, firstTouches: [{ personaId: 2, recipient: 'tom@acme.com', sentAt: sent, released: false }], readyEmailCards: [card('vp', 1, 'Vice President Supply Chain'), card('tom', 2, 'Transportation Operations Manager')] });
    expect(m.state).toBe('ready');
    expect(m.primary).toMatchObject({ name: 'vp person', chosen: true });
  });
  it('review S3: with locations on the cards, the cockpit applies US-first like the brief', () => {
    const at = (c: MotionCard, location: string): MotionCard => ({ ...c, persona: { ...c.persona, location } });
    const m = computeAccountMotion({ ...base, readyEmailCards: [at(card('a-toronto', 1, 'Director of Transportation'), 'Toronto, Ontario, Canada'), at(card('z-dallas', 2, 'Director of Transportation'), 'Dallas, Texas, United States')] });
    expect(m.primary?.name).toBe('z-dallas person');
  });
  it('after an unanswered first touch, a sponsor is not unlocked as the next primary without a choice', () => {
    const sent = new Date(NOW.getTime() - 20 * 86_400_000).toISOString();
    const m = computeAccountMotion({ ...base, firstTouches: [{ personaId: 2, recipient: 'tom@acme.com', sentAt: sent, released: false }], readyEmailCards: [card('vp', 1, 'Vice President Supply Chain'), card('tom', 2, 'Transportation Operations Manager')] });
    expect(m.state).toBe('needs_owner');
    expect(m.primary).toBeNull();
    expect(m.heldCardIds).toEqual(['vp', 'tom']);
  });
});

// ------------------------------------------------------------------ the brief (buyer map, motion WHO, NEXT)
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const hyp = { id: 'h1', status: 'approved', observation: fact.quote, problem: 'My guess is arrivals pile up at the gate.', rootCauses: [], impacts: [], falsification: [], whatANoMeans: 'No queue.', primarySignalId: 'f1' };
const michelle = { id: 3, name: 'Michelle Schlie', title: 'Vice President Supply Chain', location: 'Overland Park, Kansas, United States', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
const hs = (people: Array<{ id: string; name: string; title: string; location?: string | null }>) => ({ truncated: false, people: people.map((p) => ({ location: null, hasEmail: true, optedOut: false, ...p })) });
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: ['acmefoods.com'], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact], signals: [], lastResearch: null, hypotheses: [hyp] as never, bids: [], personas: [michelle], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null, hubspotPeople: hs([]),
  ...over,
});
const ctx = (): AccountContext => ({
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
  engagement: projectEngagement([], NOW), history: projectHistory({ activities: [], emails: [], meetings: [], captures: [], outcomes: [], sends: [], now: NOW }), assets: [], legacyNote: null,
});

describe('PepsiCo pattern: the HubSpot Director of Transportation leads, the VP Supply Chain is the sponsor', () => {
  const i = inputs({ hubspotPeople: hs([{ id: '9', name: 'Himanshu Gupta', title: 'Director of Transportation' }]) });
  const b = buildAccountBrief(i, NOW);
  it('primary is the operator, the sponsor and alternate is the VP Supply Chain', () => {
    expect(b.people?.primary).toMatchObject({ name: 'Himanshu Gupta', lane: 'PRIMARY_OPERATOR', source: 'hubspot' });
    expect(b.people?.sponsor).toMatchObject({ name: 'Michelle Schlie' });
    expect(b.people?.alternate).toMatchObject({ name: 'Michelle Schlie' });
    expect(b.people?.ownerMissing).toBeNull();
  });
  it('the fact-led motion never names the sponsor as WHO; NEXT adds the operator from HubSpot', () => {
    expect(b.motion.type).toBe('FACT_LED');
    expect(b.motion.who).toBeNull();
    expect(b.glance.nextAction).toMatch(/^Add Himanshu Gupta, Director of Transportation from HubSpot as a GAP contact/);
  });
  it('Apollo never spends a credit to re-find an email HubSpot already holds for the operator', () => {
    const a = apolloCandidates(b, i);
    expect(a.candidates).toEqual([]);
    expect(a.notNeeded).toBe('Himanshu Gupta already has an email in HubSpot: add them as a GAP contact (no credit needed).');
  });
  it('NOW: WHO is the operator, the sponsor is the alternate', () => {
    const v = projectNow(b, ctx(), i, NOW);
    expect(v.who).toMatchObject({ name: 'Himanshu Gupta', inHubSpotOnly: true });
    expect(v.alternate).toMatchObject({ name: 'Michelle Schlie' });
  });
});

describe('no direct operator on record: owner unresolved, research required (never the broadest senior title)', () => {
  const i = inputs({ personas: [], hubspotPeople: hs([{ id: '7', name: 'Pat Csco', title: 'Chief Supply Chain Officer' }]) });
  const b = buildAccountBrief(i, NOW);
  it('primary is empty; the sponsor is named; the missing role is stated', () => {
    expect(b.people?.primary).toBeNull();
    expect(b.people?.sponsor?.name).toBe('Pat Csco');
    expect(b.people?.ownerMissing).toBe('Transportation owner not yet identified: research required (direct transportation / logistics / fleet operator).');
    expect(b.glance.likelyOwner).toBe('Unknown: transportation owner not yet identified: research required. Sponsor on record: Pat Csco, Chief Supply Chain Officer (executive sponsor).');
  });
  it('the motion has no cold WHO; NOW says research, with the sponsor as alternate', () => {
    expect(b.motion.who).toBeNull();
    const v = projectNow(b, ctx(), i, NOW);
    expect(v.who).toBeNull();
    expect(v.whoUnknown).toMatch(/^Unknown: transportation owner not yet identified: research required/);
    expect(v.alternate).toMatchObject({ name: 'Pat Csco' });
  });
  it('Apollo proposes FIND_OWNER (Casey decides), naming the sponsor as the nearest person on record', () => {
    const a = apolloCandidates(b, i);
    expect(a.candidates.map((c) => c.kind)).toEqual(['FIND_OWNER']);
    expect(a.candidates[0].possibleMatch).toBe('Pat Csco, Chief Supply Chain Officer (executive sponsor, on record)');
  });
});

describe('the buyer map keeps its richness: tech / transformation and site operator slots', () => {
  it('names the transportation transformation contact and a site operator without making either primary', () => {
    const i = inputs({ hubspotPeople: hs([{ id: '1', name: 'Tess Tech', title: 'VP Strategy & Transformation, Global Transportation & Fleet' }, { id: '2', name: 'Sam Site', title: 'Plant Manager', location: 'Reno, Nevada, United States' }, { id: '3', name: 'Ivy Innov', title: 'Director of Innovation' }]) });
    const b = buildAccountBrief(i, NOW);
    expect(b.people?.primary).toBeNull();
    expect(b.people?.tech?.name).toBe('Tess Tech');
    expect(b.people?.site?.name).toBe('Sam Site');
    expect(b.people?.lanes.find((l) => l.lane === 'NON_OPERATING')?.people.map((p) => p.name)).toContain('Ivy Innov');
  });
  it('dogfood 2026-10-04: a director of warehouse operations is not the sponsor; a nameless record fills no slot', () => {
    const i = inputs({ personas: [], hubspotPeople: hs([{ id: '1', name: 'Matt Whse', title: 'Director of Warehouse Operations' }, { id: '2', name: '(no name in HubSpot)', title: 'Head of Global Operations' }, { id: '3', name: '(no name in HubSpot)', title: 'Director of Transportation' }, { id: '4', name: 'Dee Sc', title: 'Director, Supply Chain' }]) });
    const b = buildAccountBrief(i, NOW);
    expect(b.people?.primary).toBeNull();
    expect(b.people?.sponsor?.name).toBe('Dee Sc');
  });
  it('review N6 / Q8: no slot is filled from outside North America; a truncated HubSpot read is said', () => {
    const i = inputs({ personas: [], hubspotPeople: { truncated: true, people: [{ id: '1', name: 'Uwe Euro', title: 'VP Supply Chain', location: 'Munich, Bavaria, Germany', hasEmail: true, optedOut: false }] } });
    const b = buildAccountBrief(i, NOW);
    expect(b.people?.sponsor).toBeNull();
    expect(b.people?.ownerMissing).toMatch(/HubSpot returned only the first 1 associated contacts: the owner may be beyond them\.$/);
  });
  it('a GAP-contact operator is the motion WHO', () => {
    const tom = { id: 5, name: 'Tom Ops', title: 'Transportation Operations Manager', location: 'Madison, Wisconsin, United States', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
    const b = buildAccountBrief(inputs({ personas: [michelle, tom] }), NOW);
    expect(b.motion.who).toBe('Tom Ops');
    expect(b.people?.primary?.name).toBe('Tom Ops');
  });
});
