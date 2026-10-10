// @vitest-environment node
/**
 * The assignment packet's demonstrated defects (Casey, 2026-10-10, after the October 10 preview), pinned:
 *   Kenco      Who is never empty while a move names a person: the prepared angle's target and the people the
 *              correspondence names are resolved from the account's contacts; an angle that later correspondence with
 *              its target supersedes is kept for reference, not offered as a first touch; no blanket "nobody gets a
 *              cold email until then".
 *   Boston Beer  a reply item is about ITS person: another person's reply is not its situation or its move; a request
 *              they redirected ("reach out to Brian Kellog") follows the person they named; when our outbound history
 *              was not read nothing says "an answer is owed" or "nothing sent since", it says not known; the buyer's
 *              words are attributed; the specific Gmail thread is linked when its id is on record.
 *   PepsiCo    the subject and the first line say the held state (gui-packet.test.ts pins the rest of the hold).
 *   Evidence   our own dossier is "our read (interpretation)", never "reported"; an excerpt gets its original link
 *              from the signal row GAP holds; the four sales documents link to the app's own PDFs.
 *   Layout     the bookkeeping (searched, coverage) is the last section.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { buildAssignment } from '@/lib/gap/work/assignment';
import { knownAssetLink, linkEvidence, peopleNamedIn, stripBlanket } from '@/lib/gap/work/assignment-packet';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';
import type { AskContext } from '@/lib/gap/ask/grounding';
import type { RelationshipState } from '@/lib/gap/work/relationship-state';
import type { PursuedItem } from '@/lib/gap/work/intel';

const NOW = new Date('2026-10-10T13:00:00Z');
const item = (over: Partial<PlanItem> & { key: string; accountName: string; token: string }): PlanItem => ({ kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: null, refs: {}, rank: 0, ...over });
const plan = (items: PlanItem[]): DayPlan => ({ day: '2026-10-10', plannedAt: NOW.toISOString(), fresh: true, items, counts: { needsYou: items.length, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } });
const ask = (over: Partial<AskContext> & { accountName: string }): AskContext => ({ state: { state: 'ready', stateLine: 'Ready for a first touch.', blocker: null, next: 'Prepare the first touch.', coldTouchAllowed: true }, people: [], setAside: null, story: [], opening: null, otherStories: [], buyerSaid: [], ...over });
const reads = { inbox: { read: true, count: 1, detail: null }, sent: { read: false, count: 0, detail: 'no GAP sender configured' }, drafts: { read: false, count: 0, detail: 'no GAP sender configured' }, engagements: { read: true, count: 3, detail: null }, commitments: { read: true, count: 0 }, deals: { read: true, detail: null }, conversations: { read: true, count: 0 } };
const rel = (over: Partial<RelationshipState> & { person: RelationshipState['person'] }): RelationshipState => ({
  purpose: 'buyer_conversation', purposeWord: 'buyer', lastInbound: null, lastOutbound: null, laterResponse: null, answerOwed: { owed: false, basis: 'nothing of theirs asks for an answer', known: true }, quiet: { quiet: false, days: null, basis: 'no exchange on record either way' }, request: null, requestState: 'none', referral: null, correspondents: [], hubspotCompanyId: null, outboundRead: { read: true, basis: "HubSpot's logged emails were read" }, reads, meetings: [], nextMeetingAt: null, deals: [], promises: [], drafts: [], optOut: null, links: { thread: null, threadKind: null, hubspotContact: null, hubspotCompany: null }, searched: 'the synced inbox; read Oct 10, 2026, 9:00 AM New York', ...over,
});
const input = { revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW };
const lines = (t: string) => t.split('\n');

describe('Kenco: Who is resolved from the correspondence and the prepared angle; a superseded angle is kept for reference; no blanket instruction', () => {
  const DAVE = 'dave.kiesling@kencogroup.com';
  const kenco = item({ key: 'review:Kenco:2026-10-10', accountName: 'Kenco', token: 'k'.repeat(32), kind: 'review', stateKind: 'decide', title: 'Decide the angle', why: 'A proposal to review.', href: '/gap/accounts/kenco', person: null });
  const ctx = ask({
    accountName: 'Kenco',
    state: { state: 'replied', stateLine: 'Someone replied: Morrison, Craig, Sep 24.', blocker: null, next: "Read Morrison, Craig's reply of Sep 24 and record what they said. Nobody at Kenco gets a cold email until then.", coldTouchAllowed: false },
    story: [{ label: 'What has happened between us', tag: 'Checked', lines: [
      { text: 'Last email to Dave Kiesling, Oct 9: "48-minute turns became 24 at a Primo Brands site". No answer owed yet.', tag: 'Checked', basis: 'HubSpot, Oct 9' },
      { text: 'Craig Morrison, Vice President, Asset Transportation replied on Sep 24: "Hey Casey, good to hear from you. Honestly, I have only met him once on video a few years back."', tag: 'Buyer said', basis: 'HubSpot, Sep 24' },
    ] }],
  });
  const pursued: PursuedItem[] = [{ key: 'p-1', taskId: 't-1', writer: { email: DAVE, name: 'Dave Kiesling' }, kind: 'person', title: 'Dave Kiesling', accountName: 'Kenco', accountHint: null, url: null, decision: 'pursue', decidedAt: '2026-10-07T12:00:00.000Z', status: 'ready', error: null, angle: { whyItMatters: 'The undated note from Dave Kiesling suggests Kenco might have expressed interest in optimizing their yards.', starters: ['How do you currently manage gate check-in during busy periods?'], roles: [], accounts: [], peopleNamed: [{ personaId: 5, name: 'Dave Kiesling', title: 'VP Operations' }], proposedAction: 'email', caveat: null, sourceLine: 'an undated note' } }];
  const db = () => ledgerDb({ accounts: [{ name: 'Kenco', hubspot_company_id: '77' }], personas: [
    { id: 5, name: 'Dave Kiesling', title: 'VP Operations', email: DAVE, email_status: 'verified', phone: null, phone_status: null, linkedin_url: null, linkedin_confidence: null, hubspot_contact_id: '5005', account_name: 'Kenco', updated_at: new Date('2026-10-01T12:00:00Z') },
    { id: 6, name: 'Morrison, Craig', title: 'Vice President, Asset Transportation', email: 'craig.morrison@kencogroup.com', email_status: 'verified', phone: null, phone_status: null, linkedin_url: null, linkedin_confidence: null, hubspot_contact_id: '6006', account_name: 'Kenco', updated_at: new Date('2026-10-01T12:00:00Z') },
  ] }, NOW);
  const relationship = async (_p: unknown, q: { email: string | null; name: string | null }) => (q.email === DAVE || q.name === 'Dave Kiesling')
    ? rel({ person: { email: DAVE, name: 'Dave Kiesling' }, lastOutbound: { at: '2026-10-09T14:00:00.000Z', subject: '48-minute turns became 24 at a Primo Brands site', threadId: null, source: 'HubSpot (logged email)' }, quiet: { quiet: false, days: 1, basis: 'we wrote Oct 9, 1 day ago' } })
    : rel({ person: { email: null, name: null }, purposeWord: 'prospect, no message from them on record', purpose: null });

  it('Who names Dave (the angle target) and Craig (who replied), from the contacts at the account; no "No person is named" while a move names someone', async () => {
    const a = await buildAssignment(db().client(), { plan: plan([kenco]), item: kenco, ...input }, { askContext: async () => ctx, pursued: async () => pursued, packet: { relationship, contact: { hubspotContact: null } }, senderEmail: null });
    const t = a.text;
    expect(a.prepared.kind).toBe('angle');
    expect(t).toContain('- Dave Kiesling, VP Operations, Kenco. Relationship: the prepared angle is for them.');
    expect(t).toContain(`  Email: ${DAVE} (verified).`);
    expect(t).toContain('  HubSpot contact: https://app.hubspot.com/contacts/3819073/record/0-1/5005. HubSpot company: https://app.hubspot.com/contacts/3819073/record/0-2/77.');
    expect(t).toContain('- Morrison, Craig, Vice President, Asset Transportation, Kenco. Relationship: named in the correspondence (under Relationship).');
    expect(t).not.toContain('No person is named on this item');
    expect(a.packet?.who.map((w) => w.name)).toEqual(['Dave Kiesling', 'Morrison, Craig']);
  });

  it('the angle prepared Oct 7 is superseded by our email to Dave on Oct 9: kept for reference, the moves follow the correspondence; the situation and the move carry no blanket instruction; the account relationship prints no person-less "nothing from this person" lines', async () => {
    const a = await buildAssignment(db().client(), { plan: plan([kenco]), item: kenco, ...input }, { askContext: async () => ctx, pursued: async () => pursued, packet: { relationship, contact: { hubspotContact: null } }, senderEmail: null });
    const t = a.text;
    expect(a.packet?.angleSuperseded).toEqual({ since: 'since the angle was prepared on Oct 7, 2026: we wrote Dave Kiesling Oct 9, 2026 ("48-minute turns became 24 at a Primo Brands site") (HubSpot (logged email))', target: 'Dave Kiesling' });
    expect(t).toContain('The angle GAP prepared for Dave Kiesling on Oct 7, 2026 is superseded by later correspondence (since the angle was prepared on Oct 7, 2026: we wrote Dave Kiesling Oct 9, 2026 ("48-minute turns became 24 at a Primo Brands site") (HubSpot (logged email))). Kept for reference, not as a first touch: The undated note from Dave Kiesling suggests Kenco might have expressed interest in optimizing their yards.');
    expect(t).toContain('- Continue the correspondence with Dave Kiesling in your own words: since the angle was prepared on Oct 7, 2026');
    expect(t).not.toContain('Write Dave Kiesling from the prepared angle');
    expect(t).not.toMatch(/gets a cold email|account cools/);
    expect(t).toContain("The move: Read Morrison, Craig's reply of Sep 24 and record what they said.");
    expect(t).toContain('Relationship (the account):');
    expect(t).not.toContain('Nothing from this person');
    expect(t).not.toContain('Nothing from us to this person');
    // The excerpt is whole, not cut mid-word.
    expect(t).toContain('I have only met him once on video a few years back.');
  });

  it('an angle whose target has no later correspondence stands: "Write ... from the prepared angle" with the prepared date', async () => {
    const quiet = async (_p: unknown, q: { email: string | null; name: string | null }) => (q.email === DAVE ? rel({ person: { email: DAVE, name: 'Dave Kiesling' } }) : rel({ person: { email: null, name: null } }));
    const a = await buildAssignment(db().client(), { plan: plan([kenco]), item: kenco, ...input }, { askContext: async () => ask({ accountName: 'Kenco' }), pursued: async () => pursued, packet: { relationship: quiet, contact: { hubspotContact: null } }, senderEmail: null });
    expect(a.packet?.angleSuperseded).toBeNull();
    expect(a.text).toContain('GAP has prepared an angle for Dave Kiesling (prepared Oct 7, 2026): The undated note');
    expect(a.text).toContain('- Write Dave Kiesling from the prepared angle, in your own words: the angle is grounded');
  });
});

describe('Boston Beer: a reply item is about its person; a redirected request follows the person named; unread outbound history is said unknown', () => {
  const PHIL = 'philip.savastano@bostonbeer.com';
  const THREAD = '19e8826006435cef';
  const boston = item({ key: 'reply:m1', accountName: 'The Boston Beer Company', token: 'b'.repeat(32), kind: 'admin', stateKind: 'replied', title: 'Someone replied', why: 'An old reply to triage (129 days): record what they said or dismiss it.', href: `/gap/capture?account=The+Boston+Beer+Company&person=980&context=email&from=reply%3Am1`, person: { name: 'Savastano, Philip', title: 'Chief Supply Chain Officer' }, refs: { replyMessageId: 'm1' } });
  const ctx = ask({
    accountName: 'The Boston Beer Company',
    state: { state: 'replied', stateLine: 'Someone replied: Cowan, David, Jun 10.', blocker: null, next: "Read Cowan, David's reply of Jun 10 and record what they said. Nobody at The Boston Beer Company gets a cold email until then.", coldTouchAllowed: false },
    buyerSaid: [{ text: 'Casey, We are all out Thursday. I am out next week as well.', who: 'Cowan, David', at: '2026-06-10T14:00:00.000Z' }, { text: 'Not sure if would work, feel free to send some info and I will take look.', who: 'Savastano, Philip', at: '2026-06-02T11:44:08.000Z' }],
    story: [{ label: 'What has happened between us', tag: 'Checked', lines: [{ text: 'Last email to Brian Kellogg, Director Planning & Supply Chain Strategy, Oct 2: "Re: Call follow up". No answer on record.', tag: 'Checked', basis: 'HubSpot, Oct 2' }] }],
    coverageLine: 'Not read this time: Gmail Sent (no GAP sender configured)',
  });
  const redirected: NonNullable<RelationshipState['request']> = { at: '2026-06-02T11:44:08.000Z', subject: 'Re: [EXTERNAL] Yard flow insights amid leadership change', excerpt: 'Not sure if would work, feel free to send some info and I will take look.', state: 'redirected', basis: 'on Jun 3, 2026 they pointed to Brian Kellogg; we wrote Brian Kellogg Oct 2, 2026 under "Re: Call follow up" (HubSpot (logged email))', fulfilledBy: null, draft: null, redirectedTo: { at: '2026-06-03T12:00:00.000Z', subject: 'FW: [EXTERNAL] Yard flow insights amid leadership change', name: 'Brian Kellogg', email: 'brian.kellogg@bostonbeer.com', writtenAfter: { at: '2026-10-02T15:00:00.000Z', subject: 'Re: Call follow up', source: 'HubSpot (logged email)' } } };
  const relationship = async () => rel({
    person: { email: PHIL, name: 'Savastano, Philip' },
    lastInbound: { at: '2026-06-03T12:00:00.000Z', subject: 'FW: [EXTERNAL] Yard flow insights amid leadership change', purpose: 'buyer_conversation', excerpt: 'Hi Casey. Feel free to reach out to Brian Kellog to see if can work timing.', threadId: THREAD },
    lastOutbound: null,
    answerOwed: { owed: false, known: false, basis: 'whether an answer went is not known: our Sent was not read (no GAP sender configured) and HubSpot engagements at The Boston Beer Company were not read (no HubSpot company on the account record), so what we sent is not known' },
    outboundRead: { read: false, basis: 'our Sent was not read (no GAP sender configured) and HubSpot engagements at The Boston Beer Company were not read (no HubSpot company on the account record), so what we sent is not known' },
    request: redirected, requestState: 'redirected', referral: redirected.redirectedTo,
    links: { thread: `https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#all/${THREAD}`, threadKind: 'thread', hubspotContact: 'https://app.hubspot.com/contacts/3819073/record/0-1/980', hubspotCompany: null },
  });
  const db = () => ledgerDb({ accounts: ['The Boston Beer Company'], personas: [{ id: 980, name: 'Savastano, Philip', title: 'Chief Supply Chain Officer', email: PHIL, email_status: 'verified', phone: null, phone_status: null, linkedin_url: null, linkedin_confidence: null, hubspot_contact_id: '980', account_name: 'The Boston Beer Company', updated_at: new Date('2026-08-18T12:00:00Z') }], inbound: [{ id: 'm1', thread_id: THREAD, from_email: PHIL, from_name: 'Savastano, Philip', subject: 'Re: [EXTERNAL] Yard flow insights amid leadership change', received_at: new Date('2026-06-02T11:44:08Z') }] }, NOW);

  it('the situation and the move name Phil, never David Cowan; the request is REDIRECTED to Brian with our Oct 2 email to him; no "answer is owed" or "nothing sent since"; the buyer words are attributed, Phil first; the thread link is the specific thread', async () => {
    const a = await buildAssignment(db().client(), { plan: plan([boston]), item: boston, ...input }, { askContext: async () => ctx, pursued: async () => [], packet: { relationship, contact: { hubspotContact: null } }, senderEmail: null });
    const t = a.text;
    const L = lines(t);
    expect(L[0]).toBe('The Boston Beer Company: Savastano, Philip (Chief Supply Chain Officer). Why now: An old reply to triage (129 days): record what they said or dismiss it. As of Oct 10, 2026, 9:00 AM New York.');
    expect(L[0]).not.toContain('Cowan');
    expect(t).toContain("The move: Read Savastano, Philip's reply of Jun 3, 2026 and record what they said.");
    expect(t).not.toContain("Read Cowan, David's reply");
    expect(t).not.toMatch(/gets a cold email|account cools/);
    expect(t).toContain('- Savastano, Philip asked for something on Jun 2, 2026 ("Re: [EXTERNAL] Yard flow insights amid leadership change"), "Not sure if would work, feel free to send some info and I will take look". Redirected to Brian Kellogg: on Jun 3, 2026 they pointed to Brian Kellogg; we wrote Brian Kellogg Oct 2, 2026 under "Re: Call follow up" (HubSpot (logged email)). (event Jun 2, 2026; their Gmail thread https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#all/19e8826006435cef)');
    expect(t).toContain('- Their request of Jun 2, 2026 ("Re: [EXTERNAL] Yard flow insights amid leadership change"): REDIRECTED: on Jun 3, 2026 they pointed to Brian Kellogg; we wrote Brian Kellogg Oct 2, 2026 under "Re: Call follow up" (HubSpot (logged email)).');
    expect(t).toContain('- What we sent Savastano, Philip is not known: our Sent was not read (no GAP sender configured) and HubSpot engagements at The Boston Beer Company were not read (no HubSpot company on the account record), so what we sent is not known.');
    expect(t).not.toMatch(/an answer is owed|nothing sent since|. Unresolved:/);
    expect(t).toContain('- Follow the thread with Brian Kellogg (we wrote Oct 2, 2026), not Savastano, Philip: on Jun 3, 2026 they pointed to Brian Kellogg');
    const ev = L.indexOf('Evidence:');
    const phil = L.findIndex((l, i) => i > ev && l.startsWith('Savastano, Philip said:'));
    const cowan = L.findIndex((l, i) => i > ev && l.startsWith('Cowan, David said:'));
    expect(phil).toBeGreaterThan(ev);
    expect(cowan).toBeGreaterThan(phil);
    expect(t).toContain('Savastano, Philip said: "Not sure if would work, feel free to send some info and I will take look." (Jun 2, 2026)');
    expect(t).toContain('- Links: their Gmail thread https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#all/19e8826006435cef; HubSpot contact https://app.hubspot.com/contacts/3819073/record/0-1/980.');
    expect(t).not.toContain('They said:');
    // The bookkeeping is last.
    expect(L.indexOf('Read for this packet:')).toBeGreaterThan(L.indexOf('Controls:'));
    expect(L[L.indexOf('Read for this packet:') + 2]).toBe('- Not read this time: Gmail Sent (no GAP sender configured)');
  });

  it('a search fallback is labelled as such when no thread id is on record', async () => {
    const search = async () => rel({ person: { email: PHIL, name: 'Savastano, Philip' }, links: { thread: `https://mail.google.com/mail/u/0/#search/from%3A%22${PHIL}%22`, threadKind: 'search', hubspotContact: null, hubspotCompany: null } });
    const a = await buildAssignment(db().client(), { plan: plan([boston]), item: boston, ...input }, { askContext: async () => ctx, pursued: async () => [], packet: { relationship: search, contact: { hubspotContact: null } }, senderEmail: null });
    expect(a.text).toContain(`- Links: a Gmail search for their address (no thread id on record) https://mail.google.com/mail/u/0/#search/from%3A%22${PHIL}%22.`);
  });
});

describe('Evidence: our dossier is interpretation, an excerpt gets its original link, the four documents link to the app PDFs', () => {
  const acme = item({ key: 'review:Acme', accountName: 'Acme Foods', token: 'f'.repeat(32), kind: 'review', stateKind: 'decide', title: 'Decide the angle', why: 'A proposal to review.', href: '/gap/accounts/acme-foods', person: null });
  const record = (over: Record<string, unknown>) => ({ producer: 'yards_first_brief', producerLabel: 'Yards First Brief', producerRunId: 'r-1', producerItemId: 'i-1', kind: 'development', title: 'Acme opens a DC', text: 'Acme Foods is opening a 900,000 square foot distribution center in Reno with 120 dock doors.', sources: [{ url: 'https://supplychaindive.com/acme-reno', publisher: 'supplychaindive.com', label: null }], sourceRecordIds: [], eventDate: '2026-09-24', reportedOn: '2026-10-01', reportedOnBasis: 'stated', collectedAt: null, importedAt: '2026-10-09T12:00:00.000Z', accountHint: 'Acme', personHints: [], producerStatus: null, uncertainty: null, interpretation: null, suggestions: [], archive: { reportRef: 'r-1', section: null }, visibility: 'digest', contentHash: 'x', revisions: [], ...over });
  const relationship = async () => rel({ person: { email: null, name: null }, purposeWord: 'prospect, no message from them on record', purpose: null });

  it('a war-room dossier record (our own page as its only link) prints as our read with "written", never "reported"; a brief with an outside link stays reported', async () => {
    const imported = async () => [
      { id: 's-1', title: null, url: null, source_name: null, published_at: null, metadata: { import: record({ producer: 'war_room_dossier', producerLabel: 'War-room dossier', producerItemId: 'acme-foods', kind: 'observation', text: 'Acme pulled production in-house, so the yards at its own plants are now the live constraint on shipped volume.', sources: [{ url: 'https://yardflow.ai/for/acme-foods', publisher: 'yardflow.ai', label: 'the for page' }], eventDate: null, reportedOn: '2026-06-25', interpretation: "The dossier's one-liner: Acme is in-sourcing." }) }, created_at: new Date('2026-10-09T12:00:00.000Z') },
      { id: 's-2', title: null, url: null, source_name: null, published_at: null, metadata: { import: record({}) }, created_at: new Date('2026-10-09T12:01:00.000Z') },
    ];
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([acme]), item: acme, ...input }, { askContext: async () => ask({ accountName: 'Acme Foods' }), pursued: async () => [], packet: { relationship, imported, contact: { hubspotContact: null } }, senderEmail: null });
    const L = lines(a.text);
    const at = L.indexOf('What changed or remains unresolved:');
    expect(L[at + 1]).toBe('- Our read (interpretation, not a reported fact or a buyer statement): Acme pulled production in-house, so the yards at its own plants are now the live constraint on shipped volume. (written Jun 25, 2026; imported Oct 9, 2026; war-room dossier, our own material https://yardflow.ai/for/acme-foods)');
    expect(L[at + 2]).toBe("  Its one-line read (not an obligation): The dossier's one-liner: Acme is in-sourcing.");
    expect(L[at + 3]).toBe('- Acme Foods is opening a 900,000 square foot distribution center in Reno with 120 dock doors. (event Sep 24, 2026; reported Oct 1, 2026; imported Oct 9, 2026; supplychaindive.com https://supplychaindive.com/acme-reno)');
    expect(a.packet?.changed.map((c) => c.claim)).toEqual(['interpretation', 'reported']);
  });

  it('a story excerpt gets its original article link from the signal row that starts with the same words; "unverified" is said apart from "only the producer\'s claim"', async () => {
    const ctx = ask({ accountName: 'Acme Foods', story: [{ label: 'Stories that matter', tag: 'Checked', lines: [
      { text: 'Acme Foods plans to invest more than $300 million in a new fulfillment center in Turtlecreek Township, creating more than 300 new jobs.', tag: 'Checked', basis: 'reported by jobsohio.com, Sep 28, 2026' },
      { text: 'Acme named a new COO.', tag: 'Unverified', basis: 'reported by prnewswire.com, Sep 2, 2026' },
    ] }] });
    const signalLinks = async () => [{ title: 'Acme Foods plans to invest more than $300 million in a new fulfillment center in Turtlecreek Township', url: 'https://www.jobsohio.com/news/acme-turtlecreek', source_name: 'jobsohio.com' }];
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([acme]), item: acme, ...input }, { askContext: async () => ctx, pursued: async () => [], packet: { relationship, imported: async () => [], signalLinks, contact: { hubspotContact: null } }, senderEmail: null });
    expect(a.text).toContain('- Acme Foods plans to invest more than $300 million in a new fulfillment center in Turtlecreek Township, creating more than 300 new jobs. (reported by jobsohio.com, Sep 28, 2026) https://www.jobsohio.com/news/acme-turtlecreek');
    expect(a.text).toContain('- Acme named a new COO. (reported by prnewswire.com, Sep 2, 2026) (unverified: its present-day status is not established)');
    expect(a.text).not.toContain("only the producer's claim");
    expect(a.html).toContain('<a href="https://www.jobsohio.com/news/acme-turtlecreek">');
  });

  it('linkEvidence, knownAssetLink, stripBlanket, peopleNamedIn: the pure rules', () => {
    const rows = [{ title: 'Acme opens a DC in Reno with 120 doors', url: 'https://x.test/a', source_name: null }];
    expect(linkEvidence([{ text: 'Acme opens a DC in Reno with 120 doors, the company said.', source: { label: 'x', url: null } }], rows)[0].source.url).toBe('https://x.test/a');
    expect(linkEvidence([{ text: 'Short.', source: { label: 'x', url: null } }], rows)[0].source.url).toBeNull();
    expect(linkEvidence([{ text: 'Acme opens a DC in Reno with 120 doors.', source: { label: 'x', url: 'https://keep.test' } }], rows)[0].source.url).toBe('https://keep.test');
    const link = knownAssetLink('https://app.example/');
    expect(link('Pilot-Program')).toBe('https://app.example/docs/pilot-program.pdf');
    expect(link('ROI-One-Pager')).toBe('https://app.example/docs/roi-one-pager.pdf');
    expect(link('Deck-Of-Nothing')).toBeNull();
    expect(stripBlanket("Read Phil's reply of Jun 3 and record what they said. Nobody at The Boston Beer Company gets a cold email until then.")).toBe("Read Phil's reply of Jun 3 and record what they said.");
    expect(stripBlanket("Record Tim Cooper's opt-out as do not contact. No reply goes back; the account cools before anyone else is touched.")).toBe("Record Tim Cooper's opt-out as do not contact. No reply goes back.");
    expect(stripBlanket('Prepare the first touch to Tom.')).toBe('Prepare the first touch to Tom.');
    expect(peopleNamedIn(['Last email to Dave Kiesling, Oct 9: "48-minute turns". No answer owed yet.', 'Craig Morrison, Vice President, Asset Transportation replied on Sep 24: "Hey".', '30 emails to 7 people since Mar 2026.', 'We wrote Brian Kellogg on Oct 2.'])).toEqual(['Dave Kiesling', 'Craig Morrison', 'Brian Kellogg']);
  });
});
