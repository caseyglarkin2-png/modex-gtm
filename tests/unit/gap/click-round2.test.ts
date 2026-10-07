/**
 * Click-test round 2 (2026-10-03), pinned:
 *   - ONE first-touch answer: NOW names the cockpit's ready-card person and links to that card; a better fit who is
 *     not a GAP contact is said beside it; the account card's motion line names nobody
 *   - deal stage names from the pipeline (never "1417384082"); a failed read falls back to the id
 *   - a send to ourselves is not a touch or a relationship; NOW lines carry no raw URL
 *   - BRIEF says each idea once; tier / band is a legacy rating, never a verified fact
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectNow, sellerLine } from '@/lib/gap/context/now';
import { projectBrief } from '@/lib/gap/context/brief';
import { isInternalRecipient, projectEngagement, projectHistory, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { loadReadyTarget } from '@/lib/gap/context/send-target';
import { stageLabels } from '@/lib/gap/opportunity/stage-labels';

const NOW = new Date('2026-10-03T12:00:00Z');
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const hyp = { id: 'h1', status: 'draft', observation: fact.quote, problem: 'My guess is that inbound arrivals pile up at the gate.', rootCauses: [], impacts: [], falsification: ['How are arrivals staged?'], whatANoMeans: 'Arrivals flow.', primarySignalId: 'f1' };
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: 'Tier 3', priorityBand: 'D', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '1' },
  aliases: [], domains: [], siblings: [], watched: true, watchReasons: [], facts: [fact], signals: [], lastResearch: null, hypotheses: [hyp], bids: [],
  personas: [{ id: 1, name: 'adel ghanem', title: 'VP Supply Chain', doNotContact: false, hasEmail: true, emailStatus: 'valid' }, { id: 2, name: 'michelle schlie', title: 'Director, Supply Chain Operations', doNotContact: false, hasEmail: true, emailStatus: 'valid' }],
  candidates: [], memberships: [], firstTouches: [], conversation: null, opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  hubspotPeople: { truncated: false, people: [{ id: '9', name: 'Isaac Scott', title: 'Sr Director of Transportation - Frito-Lay', location: 'Orlando, Florida, United States', hasEmail: true, optedOut: false }] },
  ...over,
});
const ctx = (over: Partial<AccountContext> = {}): AccountContext => ({ relationship: projectRelationship({ restriction: null, account: null, personas: [], memberships: [], meetings: [], emails: [], now: NOW }), engagement: projectEngagement([], NOW), history: [], assets: [], legacyNote: null, ...over });

describe('one first-touch answer', () => {
  // Round 6 (Casey's order: the lane before readiness): a ready card for an adjacent operator no longer outranks a
  // transportation owner on record. The owner leads; the ready card is named as the alternative, one tap away.
  it('with a ready card for an adjacent operator, the transportation owner leads and the card is the stated alternative', () => {
    const i = inputs();
    const ready = { name: 'michelle schlie', title: 'Director, Supply Chain Operations', href: '/gap?lane=ready&open=d9#card-d9', headline: 'Suggested primary: michelle schlie.' };
    const v = projectNow(buildAccountBrief(i, NOW), ctx(), i, NOW, { ready });
    expect(v.who).toMatchObject({ name: 'Isaac Scott', inHubSpotOnly: true });
    expect(v.next.text).toBe('Add Isaac Scott (Sr Director of Transportation - Frito-Lay) from HubSpot as a GAP contact, then first-touch them: the transportation owner on record. Ready now instead: the first-touch card for Michelle Schlie (ask who owns the yards).');
    expect(v.alternate).toMatchObject({ name: 'Michelle Schlie' });
    expect(v.betterFit).toBeNull();
  });
  it('without a ready card, NOW keeps its own WHO and says nothing about a card', () => {
    const i = inputs();
    const v = projectNow(buildAccountBrief(i, NOW), ctx(), i, NOW);
    expect(v.who?.name).toBe('Isaac Scott');
    expect(v.betterFit).toBeNull();
    expect(v.next.text).not.toMatch(/first-touch card/);
  });
  it('the account card\'s motion line names nobody (the card shows its own person)', () => {
    expect(buildAccountBrief(inputs(), NOW).glance.motion).toBe('Fact-led, on the verified fact.');
  });
  it('loadReadyTarget reads the cockpit\'s pick for the account and links its card; nothing ready or a failure is null', async () => {
    const list = async () => ({ items: [{ id: 'd9' }], nextCursor: null, runId: null, asOf: null }) as never;
    const motions = async () => ({ motions: [{ accountName: 'Acme Foods', state: 'ready', primary: { personaId: 2, name: 'michelle schlie', title: 'Director', cardId: 'd9', factors: [], chosen: false }, headline: 'Suggested primary: michelle schlie.' }], heldCardIds: [] }) as never;
    // R60: the ready card's own pack page, never the cockpit lane.
    expect(await loadReadyTarget({}, 'Acme Foods', NOW, { list, motions })).toEqual({ name: 'michelle schlie', title: 'Director', href: '/gap/pack/d9', headline: 'Suggested primary: michelle schlie.' });
    expect(await loadReadyTarget({}, 'Acme Foods', NOW, { list: async () => ({ items: [], nextCursor: null }) as never, motions })).toBeNull();
    expect(await loadReadyTarget({}, 'Acme Foods', NOW, { list: async () => { throw new Error('db'); }, motions })).toBeNull();
  });
});

describe('deal stage names', () => {
  it('maps a stage id to its pipeline label; a failed read is an empty map (the id shows)', async () => {
    const labels = await stageLabels(async () => [{ stages: [{ id: '1417384082', label: 'Pilot scoping' }, { id: 'appointmentscheduled', label: 'Appointment scheduled' }] }]);
    expect(labels.get('1417384082')).toBe('Pilot scoping');
    expect((await stageLabels(async () => { throw new Error('403'); })).size).toBe(0);
  });
});

describe('sends to ourselves, raw URLs, BRIEF repetition, legacy rating', () => {
  it('a send to our own mailboxes is not a touch or a relationship', () => {
    expect(isInternalRecipient('casey@freightroll.com')).toBe(true);
    expect(isInternalRecipient('caseyglarkin2@gmail.com')).toBe(true);
    expect(isInternalRecipient('dana@acmefoods.com')).toBe(false);
    const h = projectHistory({ activities: [], emails: [{ to_email: 'casey@freightroll.com', subject: 'one-pager copy', sent_at: '2026-09-01', reply_count: 0 }], meetings: [], captures: [], outcomes: [], sends: [], now: NOW });
    expect(h).toHaveLength(0);
    const r = projectRelationship({ restriction: null, account: null, personas: [], memberships: [], meetings: [], emails: [{ to_email: 'caseyglarkin2@gmail.com', subject: 'x', sent_at: '2026-09-01', reply_count: 0 }], now: NOW });
    expect(r.lastThread).toBeNull();
  });
  it('a NOW line carries no raw URL', () => {
    const l = sellerLine({ text: 'Walmart operates 42 DCs (https://www.sec.gov/Archives/edgar/data/104169/wmt-20250131.htm).', truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'evidence', ref: 'x', label: 'SEC', url: 'https://www.sec.gov/x', at: '2026-01-31' }] }, 'footprint', { domains: [], accountName: 'Walmart', citable: new Set() });
    expect(l?.text).toBe('Walmart operates 42 DCs.');
  });
  it('tier / band is a legacy rating the seller never reads (Sprint 5 exit), and the HubSpot link is said in words', () => {
    const i = inputs();
    expect(i.account.tier || i.account.priorityBand).toBeTruthy();
    const b = buildAccountBrief(i, NOW);
    const texts = Object.values(b.sections).flatMap((s) => s.statements.map((x) => x.text)).join('\n');
    expect(texts).not.toMatch(/Tier 3|band D|internal rating/i);
    const linked = buildAccountBrief({ ...i, account: { ...i.account, hubspotCompanyId: '30911223344' } }, NOW);
    const ids = linked.sections.identity.statements.map((x) => x.text);
    expect(ids).toContain('Linked to its HubSpot company record');
    expect(ids.join('\n')).not.toContain('30911223344');
  });
  it('BRIEF says each idea once across sections', () => {
    const i = inputs();
    const sections = projectBrief(buildAccountBrief(i, NOW), ctx(), i, NOW);
    const texts = sections.flatMap((s) => [...s.lines.map((l) => l.text), ...s.notes]).map((t) => t.replace(/^[A-Z][A-Z /]+:\s*/, '').toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });
});
