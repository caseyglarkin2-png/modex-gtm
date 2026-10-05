/**
 * NOW and the brief carry the owner-resolution controls' data (2026-10-05): the HubSpot contact behind a
 * HubSpot-only WHO (ADD TO GAP), the outstanding GAP draft that holds the account (the remediation control), and
 * contact currentness (a person who left is historical: never WHO, never the alternate, never the motion's person).
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectHistory, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';

const NOW = new Date('2026-10-05T15:00:00Z');
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const hyp = { id: 'h1', status: 'approved', observation: fact.quote, problem: 'My guess is arrivals pile up at the gate.', rootCauses: [], impacts: [], falsification: [], whatANoMeans: 'No queue.', primarySignalId: 'f1' };
const michelle = { id: 928, name: 'michelle schlie', title: 'vice president supply chain', location: 'Overland Park, Kansas, United States', doNotContact: false, hasEmail: true, emailStatus: 'valid', hubspotContactId: '219171953266' };
const left = { state: 'LEFT_COMPANY_CONFIRMED' as const, why: 'Current evidence places them elsewhere: LinkedIn profile: ADUSA Distribution.', elsewhere: { company: 'ADUSA Distribution', title: 'Director of Distribution Operations' } };
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

describe('ADD TO GAP: NOW carries the HubSpot contact behind a HubSpot-only WHO', () => {
  const i = inputs({ hubspotPeople: hs([{ id: '219885493392', name: 'Isaac Scott', title: 'Sr Director of Transportation - Frito-Lay', location: 'Orlando, Florida, United States' }]) });
  const b = buildAccountBrief(i, NOW);
  it('the buyer map carries ids: a GAP contact its persona id and HubSpot link, a HubSpot person its contact id', () => {
    const all = b.people.lanes.flatMap((l) => l.people);
    expect(all.find((x) => x.name === 'Isaac Scott')).toMatchObject({ source: 'hubspot', hubspotContactId: '219885493392', personaId: null });
    expect(all.find((x) => x.name === 'michelle schlie')).toMatchObject({ source: 'gap', personaId: 928, hubspotContactId: '219171953266' });
  });
  it('NOW names the control: who.hubspotContactId and addToGap, so no instruction stands without a button', () => {
    const v = projectNow(b, ctx(), i, NOW);
    expect(v.who).toMatchObject({ name: 'Isaac Scott', inHubSpotOnly: true, hubspotContactId: '219885493392' });
    expect(v.addToGap).toEqual({ name: 'Isaac Scott', title: 'Sr Director of Transportation - Frito-Lay', hubspotContactId: '219885493392' });
  });
});

describe('the outstanding GAP draft that holds the account is a control, with its ids', () => {
  it('NOW exposes recipient, decision and draft ids, and the person it was drafted to', () => {
    const i = inputs({ firstTouches: [{ recipient: 'michelle.schlie@pepsico.com', sentAt: '2026-10-05T00:26:16.378Z', state: 'draft outstanding', personaId: 928, decisionId: 'cmurhhob4001wjq04nv3iysa8', gmailDraftId: 'r7108052208134565800' }] });
    const v = projectNow(buildAccountBrief(i, NOW), ctx(), i, NOW);
    expect(v.outstandingDraft).toEqual({ recipient: 'michelle.schlie@pepsico.com', name: 'Michelle Schlie', decisionId: 'cmurhhob4001wjq04nv3iysa8', gmailDraftId: 'r7108052208134565800', createdAt: '2026-10-05T00:26:16.378Z' });
  });
  it('a sent first touch, or an outstanding draft with no ids, is not a control', () => {
    const sent = inputs({ firstTouches: [{ recipient: 'a@b.co', sentAt: '2026-10-01T00:00:00Z', state: 'sent' }] });
    expect(projectNow(buildAccountBrief(sent, NOW), ctx(), sent, NOW).outstandingDraft).toBeNull();
    const old = inputs({ firstTouches: [{ recipient: 'a@b.co', sentAt: '2026-10-01T00:00:00Z', state: 'draft outstanding' }] });
    expect(projectNow(buildAccountBrief(old, NOW), ctx(), old, NOW).outstandingDraft).toBeNull();
  });
});

describe('contact currentness in the brief and NOW: a person who left is historical', () => {
  const dakota = { id: 1306, name: 'dakota socha', title: 'transportation & reverse logistics', location: 'San Antonio, Texas, United States', doNotContact: false, hasEmail: true, emailStatus: 'unverified', employment: left };
  it('never WHO, never the alternate, never the motion person; the slot stays research with the sponsor named', () => {
    const i = inputs({ account: { ...inputs().account, name: 'H-E-B', vertical: 'Retail' }, personas: [michelle, dakota] });
    const b = buildAccountBrief(i, NOW);
    expect(b.people.primary).toBeNull();
    expect(b.people.alternate?.name).toBe('michelle schlie');
    expect(b.motion.who).toBeNull();
    expect(b.glance.likelyOwner).toMatch(/^Unknown: transportation owner not yet identified/);
    const v = projectNow(b, ctx(), i, NOW);
    expect(v.who).toBeNull();
    expect(v.historical).toEqual([{ name: 'Dakota Socha', title: 'transportation & reverse logistics', personaId: 1306, elsewhere: 'ADUSA Distribution (Director of Distribution Operations)' }]);
    // Still in the buyer map (history kept), flagged, and never do-not-contact.
    const row = b.people.lanes.flatMap((l) => l.people).find((x) => x.name === 'dakota socha');
    expect(row).toMatchObject({ employment: { state: 'LEFT_COMPANY_CONFIRMED' }, doNotContact: false });
  });
  it('a current operator beside the departed one leads; the departed one is historical', () => {
    const jose = { id: 2, name: 'Jose Huerta', title: 'Director of Transportation', location: 'Schertz, Texas, United States', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
    const i = inputs({ account: { ...inputs().account, name: 'H-E-B', vertical: 'Retail' }, personas: [dakota, jose] });
    const b = buildAccountBrief(i, NOW);
    expect(b.people.primary?.name).toBe('Jose Huerta');
    expect(b.motion.who).toBe('Jose Huerta');
    expect(projectNow(b, ctx(), i, NOW).historical?.map((h) => h.name)).toEqual(['Dakota Socha']);
  });
  it('an employment conflict fills no slot either', () => {
    const conflicted = { ...dakota, employment: { state: 'EMPLOYMENT_CONFLICT' as const, why: 'Sources disagree.', elsewhere: null } };
    const b = buildAccountBrief(inputs({ personas: [conflicted] }), NOW);
    expect(b.people.primary).toBeNull();
  });
});
