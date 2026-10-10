// @vitest-environment node
/**
 * The second round of packet fixes (the production preview and the independent review of October 10):
 *   - a person the correspondence names resolves to the address HubSpot's logged emails carry, and to the HubSpot
 *     contact by that address when GAP holds no row (Dave Kiesling at Kenco); one person is one Who entry whether
 *     named by address or by name
 *   - the angle's supersession also reads the account story's own "Last email to <name>, <date>" line
 *   - an angle that names nobody adds nobody to Who and asks for the person (a headline is never a person)
 *   - a lowercase stored name or title prints proper-cased; the buyer's cut quote takes the story's longer copy
 *   - a dangling "[[" from an earlier clip is scrubbed; a short profile title never links a story
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { buildAssignment } from '@/lib/gap/work/assignment';
import { lengthenQuote, linkEvidence, storyDate, storyWroteOn } from '@/lib/gap/work/assignment-packet';
import { contactPacketFor, properCase, readHubSpotContactByEmail, contactByEmailCacheKey } from '@/lib/gap/people/contact-packet';
import { scrubWiki, cleanLine } from '@/lib/gap/work/clean-text';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';
import type { AskContext } from '@/lib/gap/ask/grounding';
import type { RelationshipState } from '@/lib/gap/work/relationship-state';
import type { PursuedItem } from '@/lib/gap/work/intel';

const NOW = new Date('2026-10-10T13:00:00Z');
const item = (over: Partial<PlanItem> & { key: string; accountName: string; token: string }): PlanItem => ({ kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: null, refs: {}, rank: 0, ...over });
const plan = (items: PlanItem[]): DayPlan => ({ day: '2026-10-10', plannedAt: NOW.toISOString(), fresh: true, items, counts: { needsYou: items.length, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } });
const ask = (over: Partial<AskContext> & { accountName: string }): AskContext => ({ state: { state: 'ready', stateLine: 'Ready for a first touch.', blocker: null, next: 'Prepare the first touch.', coldTouchAllowed: true }, people: [], setAside: null, story: [], opening: null, otherStories: [], buyerSaid: [], ...over });
const reads = { inbox: { read: true, count: 0, detail: null }, sent: { read: false, count: 0, detail: 'no GAP sender configured' }, drafts: { read: false, count: 0, detail: 'no GAP sender configured' }, engagements: { read: true, count: 3, detail: 'the company resolved from the deals' }, commitments: { read: true, count: 0 }, deals: { read: true, detail: null }, conversations: { read: true, count: 0 } };
const rel = (over: Partial<RelationshipState> & { person: RelationshipState['person'] }): RelationshipState => ({
  purpose: null, purposeWord: 'prospect, no message from them on record', lastInbound: null, lastOutbound: null, laterResponse: null, answerOwed: { owed: false, basis: 'no message either way on record', known: true }, quiet: { quiet: false, days: null, basis: 'no exchange on record either way' }, request: null, requestState: 'none', referral: null, correspondents: [], outboundRead: { read: true, basis: "HubSpot's logged emails were read" }, reads, meetings: [], nextMeetingAt: null, deals: [], promises: [], drafts: [], optOut: null, links: { thread: null, threadKind: null, hubspotContact: null, hubspotCompany: null }, searched: 'read Oct 10, 2026, 9:00 AM New York', ...over,
});
const input = { revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW };

describe('Kenco in production shape: no GAP row for Dave, his address in the logged emails, the HubSpot contact found by address', () => {
  const DAVE = 'dave.kiesling@kencogroup.com';
  const CRAIG = 'craig.morrison@kencogroup.com';
  const kenco = item({ key: 'review:Kenco:2026-10-10', accountName: 'Kenco', token: 'k'.repeat(32), kind: 'review', stateKind: 'decide', title: 'Decide the angle', why: 'A proposal to review.', href: '/gap/accounts/kenco', person: null });
  const between = [
    { text: 'Last email to Dave Kiesling, Oct 9: "48-minute turns became 24 at a Primo Brands site". No answer owed yet.', tag: 'Checked', basis: 'HubSpot, Oct 9' },
    { text: 'Craig Morrison, Vice President, Asset Transportation replied on Sep 24: "Hey Casey, good to hear from you. Honestly, I have only met him once on video a few weeks ago and it was during a quarterly business review, but I do not know him well at all."', tag: 'Buyer said', basis: 'HubSpot, Sep 24' },
  ];
  const ctx = ask({ accountName: 'Kenco', state: { state: 'replied', stateLine: 'Someone replied: Morrison, Craig, Sep 24.', blocker: null, next: "Read Morrison, Craig's reply of Sep 24 and record what they said.", coldTouchAllowed: false }, story: [{ label: 'What has happened between us', tag: 'Checked', lines: between }], buyerSaid: [{ text: 'Hey Casey, good to hear from you. Honestly, I have only met him once on video a fe', who: 'morrison, craig', at: '2026-09-24T14:00:00.000Z' }] });
  // The angle names Dave only by address (the writer had no name); prepared Oct 8; nobody is a persona.
  const pursued: PursuedItem[] = [{ key: 'p-1', taskId: 't-1', writer: { email: DAVE, name: null }, kind: 'person', title: DAVE, accountName: 'Kenco', accountHint: null, url: null, decision: 'pursue', decidedAt: '2026-10-08T12:00:00.000Z', status: 'ready', error: null, angle: { whyItMatters: 'The undated note from Dave Kiesling suggests Kenco might have expressed interest.', starters: ['How do you manage gate check-in?'], roles: [], accounts: [], peopleNamed: [], proposedAction: 'email', caveat: null, sourceLine: 'an undated note' } }];
  const correspondents = [{ name: null, email: DAVE, lastAt: '2026-10-09T14:00:00.000Z' }, { name: null, email: CRAIG, lastAt: '2026-09-24T14:00:00.000Z' }];
  // The account relationship (no person) carries the correspondents; Dave's own read finds nothing newer (the preview's case: the HubSpot read answered for the account, not for him).
  const relationship = async (_p: unknown, q: { email: string | null; name: string | null }) => (q.email === DAVE || q.name === 'Dave Kiesling')
    ? rel({ person: { email: DAVE, name: 'Dave Kiesling' }, correspondents })
    : rel({ person: { email: null, name: null }, correspondents });
  const found = async (email: string) => (email === DAVE ? { id: '7007', name: 'Dave Kiesling', live: { phone: null, mobilephone: '+1 423 555 0199', jobtitle: 'VP Operations', linkedin: 'https://www.linkedin.com/in/dave-kiesling/', timezone: null, updatedAt: '2026-10-09T15:00:00.000Z' } } : email === CRAIG ? { id: '7008', name: 'Craig Morrison', live: { phone: null, mobilephone: null, jobtitle: 'Vice President, Asset Transportation', linkedin: null, timezone: null, updatedAt: null } } : null);

  it('Who: Dave once (by the address the angle carries, named and detailed from the HubSpot contact found by address) and Craig once; the angle is superseded by the story\'s Oct 9 email; the buyer quote is whole and proper-cased', async () => {
    const a = await buildAssignment(ledgerDb({ accounts: ['Kenco'] }, NOW).client(), { plan: plan([kenco]), item: kenco, ...input }, { askContext: async () => ctx, pursued: async () => pursued, packet: { relationship, contact: { hubspotContact: null, hubspotContactByEmail: found } }, senderEmail: null });
    const t = a.text;
    expect(a.packet?.who.map((w) => [w.name, w.email, w.hubspotContactUrl])).toEqual([
      ['Dave Kiesling', DAVE, 'https://app.hubspot.com/contacts/3819073/record/0-1/7007'],
      ['Craig Morrison', CRAIG, 'https://app.hubspot.com/contacts/3819073/record/0-1/7008'],
    ]);
    expect(t).toContain('- Dave Kiesling, VP Operations, Kenco. Relationship: the prepared angle is for them.');
    expect(t).toContain(`  Email: ${DAVE} (not on the GAP record). Phones: +1 423 555 0199 (mobile; HubSpot contact (mobile phone field), found by address, read live, updated Oct 9, 2026). Time zone: unavailable. LinkedIn: https://www.linkedin.com/in/dave-kiesling/.`);
    expect(t).toContain('  Source: no GAP contact record and the HubSpot contact, found by address, read live; updated Oct 9, 2026.');
    expect(t).not.toContain('- dave.kiesling@kencogroup.com, Kenco.');
    expect(a.packet?.angleSuperseded).toEqual({ since: 'since the angle was prepared on Oct 8, 2026: we wrote Dave Kiesling Oct 9, 2026 (HubSpot, Oct 9)', target: 'Dave Kiesling' });
    expect(t).toContain('- Continue the correspondence with Dave Kiesling in your own words:');
    expect(t).toContain('Morrison, Craig said: "Hey Casey, good to hear from you. Honestly, I have only met him once on video a few weeks ago and it was during a quarterly business review, but I do not know him well at all." (Sep 24, 2026)');
  });

  it('an angle that names nobody adds nobody to Who and asks for the person; a headline never becomes a person', async () => {
    const headline: PursuedItem[] = [{ ...pursued[0], writer: null, title: 'Kenco Opens New Distribution Center In Ohio', angle: { ...pursued[0].angle!, peopleNamed: [] } }];
    const a = await buildAssignment(ledgerDb({ accounts: ['Kenco'] }, NOW).client(), { plan: plan([kenco]), item: kenco, ...input }, { askContext: async () => ask({ accountName: 'Kenco' }), pursued: async () => headline, packet: { relationship, contact: { hubspotContact: null, hubspotContactByEmail: null } }, senderEmail: null });
    expect(a.prepared).toMatchObject({ kind: 'angle', who: null });
    expect(a.packet?.who).toEqual([]);
    expect(a.text).not.toContain('Kenco Opens New Distribution Center In Ohio, Kenco');
    expect(a.text).toContain('- Choose the person on the account for the prepared angle (internal work): the angle names nobody; a first touch needs a person before any copy is written.');
    expect(a.text).toContain('GAP has prepared an angle for Kenco (prepared Oct 8, 2026) that names nobody: The undated note');
  });
});

describe('the pure helpers', () => {
  it('storyDate and storyWroteOn: a day without a year is this year, or last year when ahead of now; the person must match', () => {
    expect(storyDate('Oct 9', NOW)).toBe('2026-10-09');
    expect(storyDate('Dec 1', NOW)).toBe('2025-12-01');
    expect(storyDate('Jun 3, 2025', NOW)).toBe('2025-06-03');
    expect(storyDate('yesterday', NOW)).toBeNull();
    const lines = ['Last email to Dave Kiesling, Oct 9: "48-minute turns". No answer owed yet. (HubSpot, Oct 9)', 'We wrote Brian Kellogg on Oct 2: "Re: Call follow up". (Gmail Sent, Oct 2)'];
    expect(storyWroteOn(lines, 'Kiesling, Dave', NOW)).toEqual({ at: '2026-10-09', source: 'HubSpot, Oct 9' });
    expect(storyWroteOn(lines, 'Brian Kellogg', NOW)).toEqual({ at: '2026-10-02', source: 'Gmail Sent, Oct 2' });
    expect(storyWroteOn(lines, 'Craig Morrison', NOW)).toBeNull();
  });

  it('lengthenQuote takes the story\'s longer copy of a cut quote; a whole quote stays', () => {
    const lines = ['Craig Morrison replied on Sep 24: "Hey Casey, good to hear from you. Honestly, I have only met him once on video a few weeks ago and it was a review."'];
    expect(lengthenQuote('Hey Casey, good to hear from you. Honestly, I have only met him once on video a fe', lines)).toBe('Hey Casey, good to hear from you. Honestly, I have only met him once on video a few weeks ago and it was a review.');
    expect(lengthenQuote('Poking holes in the Primo record now.', lines)).toBe('Poking holes in the Primo record now.');
  });

  it('linkEvidence: a short profile title never links a story; a title that covers the excerpt does', () => {
    const rows = [{ title: 'Kenco Logistics Inc.', url: 'https://x.test/profile', source_name: null }, { title: 'Kenco Logistics Inc announced a new CEO on October 1 after a year of searching', url: 'https://x.test/ceo', source_name: null }];
    const [e] = linkEvidence([{ text: 'Kenco Logistics Inc announced a new CEO on October 1 after a year of searching, the company said.', source: { label: 'x', url: null } }], rows);
    expect(e.source.url).toBe('https://x.test/ceo');
    const [short] = linkEvidence([{ text: 'Kenco Logistics Inc announced a new CEO on October 1 after a year of searching, the company said.', source: { label: 'x', url: null } }], [rows[0]]);
    expect(short.source.url).toBeNull();
  });

  it('properCase and scrubWiki', () => {
    expect(properCase('phil savastano')).toBe('Phil Savastano');
    expect(properCase("shawn o'brien-smith")).toBe("Shawn O'Brien-Smith");
    expect(properCase('Tom Kamantauskas')).toBe('Tom Kamantauskas');
    expect(properCase('VP of Ops')).toBe('VP of Ops');
    expect(properCase('')).toBeNull();
    expect(scrubWiki('Send the 4 tracked sales docs as tracked links, first stop per [[RE, due yesterday')).toBe('Send the 4 tracked sales docs as tracked links, due yesterday');
    expect(cleanLine('first stop per [[RETIREMENT-HANDOFF]] since the handoff')).toBe('first stop per RETIREMENT-HANDOFF since the handoff');
    expect(scrubWiki('see [[Kenco|the account]] and [[2026-W28')).toBe('see the account and 2026-W28');
  });
});

describe('contact-packet: the HubSpot contact by address', () => {
  it('readHubSpotContactByEmail searches once, caches for the window, and answers null without a token', async () => {
    const db = ledgerDb({}, NOW).client();
    let calls = 0;
    const search = async (email: string) => { calls += 1; return email === 'dave.kiesling@kencogroup.com' ? { id: '7007', properties: { firstname: 'Dave', lastname: 'Kiesling', jobtitle: 'VP Operations', mobilephone: '+1 423 555 0199', hs_linkedin_url: 'https://www.linkedin.com/in/dave-kiesling/', lastmodifieddate: '2026-10-09T15:00:00.000Z' } } : null; };
    const found = await readHubSpotContactByEmail(db, 'Dave.Kiesling@kencogroup.com', NOW, { search, configured: true });
    expect(found).toEqual({ id: '7007', name: 'Dave Kiesling', live: { phone: null, mobilephone: '+1 423 555 0199', jobtitle: 'VP Operations', linkedin: 'https://www.linkedin.com/in/dave-kiesling/', timezone: null, updatedAt: '2026-10-09T15:00:00.000Z' } });
    const again = await readHubSpotContactByEmail(db, 'dave.kiesling@kencogroup.com', new Date(NOW.getTime() + 60_000), { search, configured: true });
    expect(again?.id).toBe('7007');
    expect(calls).toBe(1);
    const row = await db.systemConfig.findUnique({ where: { key: contactByEmailCacheKey('dave.kiesling@kencogroup.com') } });
    expect(row).toBeTruthy();
    expect(await readHubSpotContactByEmail(db, 'nobody@kencogroup.com', NOW, { search, configured: false })).toBeNull();
    expect(await readHubSpotContactByEmail(db, 'not-an-address', NOW, { search, configured: true })).toBeNull();
  });

  it('contactPacketFor with no GAP row and an address: the found contact names the person, links the record and says the source; with a row, no search runs', async () => {
    const db = ledgerDb({ accounts: [{ name: 'Kenco', hubspot_company_id: '77' }], personas: [{ id: 5, name: 'kristi montgomery', title: 'vice president of strategic transformation', email: 'kristi@kencogroup.com', email_status: 'verified', phone: null, phone_status: null, linkedin_url: null, linkedin_confidence: null, hubspot_contact_id: '5005', account_name: 'Kenco', updated_at: new Date('2026-10-01T12:00:00Z') }] }, NOW).client();
    let searched = 0;
    const finder = async (email: string) => { searched += 1; return email === 'dave.kiesling@kencogroup.com' ? { id: '7007', name: 'Dave Kiesling', live: { phone: '+1 423 555 0100', mobilephone: null, jobtitle: 'VP Operations', linkedin: null, timezone: 'America/New_York', updatedAt: null } } : null; };
    const dave = await contactPacketFor(db, { email: 'dave.kiesling@kencogroup.com', accountName: 'Kenco', now: NOW, fallback: { name: 'dave.kiesling@kencogroup.com', title: null, email: 'dave.kiesling@kencogroup.com' } }, { hubspotContact: null, hubspotContactByEmail: finder });
    expect(dave).toMatchObject({ name: 'Dave Kiesling', title: 'VP Operations', email: 'dave.kiesling@kencogroup.com', emailStatus: 'not on the GAP record', timezone: 'America/New_York', hubspotContactUrl: 'https://app.hubspot.com/contacts/3819073/record/0-1/7007', hubspotCompanyUrl: 'https://app.hubspot.com/contacts/3819073/record/0-2/77', source: 'no GAP contact record and the HubSpot contact, found by address, read live' });
    expect(dave?.phones).toEqual([{ kind: 'direct', value: '+1 423 555 0100', source: 'HubSpot contact (phone field), found by address, read live', updatedAt: null }]);
    const kristi = await contactPacketFor(db, { email: 'kristi@kencogroup.com', accountName: 'Kenco', now: NOW }, { hubspotContact: null, hubspotContactByEmail: finder });
    expect(kristi).toMatchObject({ name: 'Kristi Montgomery', title: 'Vice President of Strategic Transformation', source: 'GAP contact record 5 and the HubSpot contact (not read this time)' });
    expect(searched).toBe(1);
    const nobody = await contactPacketFor(db, { email: 'nobody@kencogroup.com', accountName: 'Kenco', now: NOW, fallback: { name: 'nobody@kencogroup.com', title: null, email: 'nobody@kencogroup.com' } }, { hubspotContact: null, hubspotContactByEmail: finder });
    expect(nobody).toMatchObject({ name: 'nobody@kencogroup.com', source: 'no GAP contact record and no HubSpot contact link' });
  });
});
