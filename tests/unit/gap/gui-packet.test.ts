// @vitest-environment node
/**
 * GUI-02, GUI-04, GUI-06, GUI-07, GUI-08 (the Gmail action UI audit, 2026-10-10): the assignment packet. Pinned on
 * fixtures shaped like the October 10 preview: Boston Beer (Phil's request: fulfilled, unfulfilled or unknown, said
 * with the reason), PepsiCo (the IW15 hold stands; "preparation remains"), Walmart (STOP first; no outbound move),
 * an administrative item from a vendor (labelled), a deal item with its exchange context, an imported record with
 * its event, report and import dates apart and the producer's interpretation apart; the text and the HTML carry the
 * same packet; no line starts with a command word; no wiki fragment leaks; the digest's words (title, person) match
 * the packet's first line and asOf.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { buildAssignment } from '@/lib/gap/work/assignment';
import { assetsOf, movesOf, packetSections, renderPacketHtml, renderPacketText, type AssignmentPacket } from '@/lib/gap/work/assignment-packet';
import { COMMAND_WORDS } from '@/lib/gap/work/briefing';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';
import type { AskContext } from '@/lib/gap/ask/grounding';
import type { RelationshipState } from '@/lib/gap/work/relationship-state';

vi.mock('@/lib/gap/work/intel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/gap/work/intel')>()), loadPursued: vi.fn(async () => []) }));
vi.mock('@/lib/gap/deals/in-deals', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/gap/deals/in-deals')>()), loadInDealsSummary: vi.fn(async () => null) }));

const NOW = new Date('2026-10-10T13:00:00Z');
const COMMAND = new RegExp(`^(${COMMAND_WORDS.join('|')})\\b`, 'i');
const item = (over: Partial<PlanItem> & { key: string; accountName: string; token: string }): PlanItem => ({ kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: null, refs: {}, rank: 0, ...over });
const plan = (items: PlanItem[]): DayPlan => ({ day: '2026-10-10', plannedAt: NOW.toISOString(), fresh: true, items, counts: { needsYou: items.length, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } });
const ask = (over: Partial<AskContext> & { accountName: string }): AskContext => ({ state: { state: 'ready', stateLine: 'Ready for a first touch.', blocker: null, next: 'Prepare the first touch.', coldTouchAllowed: true }, people: [], setAside: null, story: [], opening: null, otherStories: [], buyerSaid: [], ...over });

const rel = (over: Partial<RelationshipState> & { person: RelationshipState['person'] }): RelationshipState => ({
  purpose: 'buyer_conversation', purposeWord: 'buyer', lastInbound: null, lastOutbound: null, laterResponse: null, answerOwed: { owed: false, basis: 'nothing of theirs asks for an answer' }, quiet: { quiet: false, days: null, basis: 'no exchange on record either way' }, request: null, requestState: 'none', meetings: [], nextMeetingAt: null, deals: [], promises: [], drafts: [], optOut: null, links: { thread: null, hubspotContact: null, hubspotCompany: null }, searched: "GAP's synced inbox (1 message from them); our Sent to them (2 messages); read Oct 10, 2026, 9:00 AM New York", ...over,
});
const input = { revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW };
const lines = (t: string) => t.split('\n');
const noCommandLines = (t: string) => { for (const l of lines(t)) expect(l, l).not.toMatch(COMMAND); };

describe('GUI-02 / GUI-05 / GUI-08: Boston Beer, Phil Savastano asked for four documents on Jun 10, 2026', () => {
  const PHIL = 'phil.savastano@bostonbeer.com';
  const boston = item({ key: 'reply:m-ask', accountName: 'The Boston Beer Company', token: 'b'.repeat(32), kind: 'admin', stateKind: 'replied', title: 'Someone replied', why: 'An old reply to triage (122 days): record what they said or dismiss it.', href: '/gap/capture?account=The+Boston+Beer+Company&person=980', person: { name: 'Savastano, Philip', title: 'Director of Supply Chain' }, refs: { replyMessageId: 'm-ask' } });
  const ctx = ask({
    accountName: 'The Boston Beer Company',
    state: { state: 'replied', stateLine: 'Someone replied: Savastano, Philip, Jun 10.', blocker: null, next: "Read Savastano, Philip's reply of Jun 10 and record what they said.", coldTouchAllowed: false },
    story: [
      { label: 'What has happened between us', tag: 'Checked', lines: [{ text: 'Last email to Brian Kellogg, Director Planning, Oct 2: "Re: Call follow up". No answer on record.', tag: 'Checked', basis: 'HubSpot, Oct 2' }, { text: '34 emails to 4 people since May 2026.', tag: 'Checked', basis: 'HubSpot' }] },
      { label: 'What is changing', tag: 'Checked', lines: [{ text: 'Boston Beer is in-sourcing its Pennsylvania distribution.', tag: 'Checked', basis: 'reported by brewbound.com, Sep 12, 2026' }] },
    ],
    sellerNote: { lines: ['In-sourcing moves the bottleneck to your own gates.', 'Next action on record, due Oct 8: Send the 4 tracked sales docs (Pilot-Program, Pricing-and-Packaging, ROI-One-Pager, Solution-Overview) as tracked links, first stop per [[RETIREMENT-HANDOFF]] since the handoff.'] },
    coverageLine: 'Not read this time: Gmail Sent (no GAP sender configured)',
  });
  const request = (state: 'fulfilled' | 'unfulfilled' | 'unknown', basis: string): RelationshipState['request'] => ({ at: '2026-06-10T13:50:48.000Z', subject: 'Re: Call follow up', excerpt: 'Casey, can you send the four documents? We are all out Thursday.', state, basis, fulfilledBy: state === 'fulfilled' ? { at: '2026-06-11T15:00:00.000Z', subject: 'Re: Call follow up' } : null, draft: null });
  const base = (r: RelationshipState['request']) => rel({ person: { email: PHIL, name: 'Savastano, Philip' }, lastInbound: { at: '2026-06-10T13:50:48.000Z', subject: 'Re: Call follow up', purpose: 'buyer_conversation', excerpt: 'Casey, can you send the four documents?', threadId: 't-1' }, lastOutbound: { at: '2026-10-02T15:00:00.000Z', subject: 'Onsite at Primo', threadId: 't-9', source: 'HubSpot (logged email)' }, request: r, requestState: r ? r.state : 'none', links: { thread: `https://mail.google.com/mail/u/0/#search/from%3A%22${PHIL}%22`, hubspotContact: 'https://app.hubspot.com/contacts/3819073/record/0-1/980', hubspotCompany: 'https://app.hubspot.com/contacts/3819073/record/0-2/55' } });
  const db = () => ledgerDb({ accounts: [{ name: 'The Boston Beer Company', hubspot_company_id: '55' }], personas: [{ id: 980, name: 'Savastano, Philip', title: 'Director of Supply Chain', email: PHIL, email_status: 'verified', phone: '+1 617 555 0100', phone_status: 'verified', linkedin_url: 'https://www.linkedin.com/in/phil-savastano/', linkedin_confidence: 80, hubspot_contact_id: '980', account_name: 'The Boston Beer Company', updated_at: new Date('2026-10-01T12:00:00Z') }] }, NOW);
  const build = (r: RelationshipState) => buildAssignment(db().client(), { plan: plan([boston]), item: boston, ...input }, { askContext: async () => ctx, packet: { relationship: async () => r, contact: { hubspotContact: null } }, senderEmail: null });

  it('UNFULFILLED: the request leads "What changed or remains unresolved" with its date, the reason and the thread link; the move offers answering it; the item is administrative and nothing is prepared', async () => {
    const a = await build(base(request('unfulfilled', 'nothing from us after their message of Jun 10, 2026: our Sent was read (2 messages to them)')));
    const t = a.text;
    const L = lines(t);
    const changedAt = L.indexOf('What changed or remains unresolved:');
    expect(changedAt).toBeGreaterThan(0);
    expect(L[changedAt + 1]).toBe(`- Savastano, Philip asked for something on Jun 10, 2026 ("Re: Call follow up"), "Casey, can you send the four documents? We are all out Thursday". Unresolved: nothing from us after their message of Jun 10, 2026: our Sent was read (2 messages to them). (event Jun 10, 2026; GAP's synced inbox https://mail.google.com/mail/u/0/#search/from%3A%22${PHIL}%22)`);
    expect(L[changedAt + 2], 'the story\'s "what is changing" line is a changed fact with the report date and the publisher apart').toBe('- Boston Beer is in-sourcing its Pennsylvania distribution. (reported Sep 12, 2026; brewbound.com)');
    expect(t).toContain('- Their request of Jun 10, 2026 ("Re: Call follow up"): UNFULFILLED: nothing from us after their message of Jun 10, 2026: our Sent was read (2 messages to them).');
    expect(t).toContain("- Answer Savastano, Philip's request of Jun 10, 2026: nothing from us after their message of Jun 10, 2026");
    expect(t).toContain("- Read Savastano, Philip's reply of Jun 10 and record what they said (administrative): an administrative item: record what they said or dismiss it; no outbound is prepared.");
    expect(t).toContain('Nothing is prepared yet; preparation remains: an administrative item has nothing to prepare.');
    expect(t).not.toContain('Ready to send');
    expect(a.prepared).toEqual({ kind: 'none' });
    expect(a.packet?.changed[0].source.url).toContain('mail.google.com');
    noCommandLines(t);
  });

  it('FULFILLED: the request is said met with the send that met it, and no repeat send is inferred; UNKNOWN says so with the reason', async () => {
    const met = await build(base(request('fulfilled', 'we wrote Jun 11, 2026 under "Re: Call follow up" (Gmail Sent), after their message of Jun 10, 2026')));
    expect(met.text).toContain('- Savastano, Philip asked for something on Jun 10, 2026 ("Re: Call follow up"); met: we wrote Jun 11, 2026 under "Re: Call follow up" (Gmail Sent), after their message of Jun 10, 2026. No repeat send is inferred from the old reply.');
    expect(met.text).toContain('- Their request of Jun 10, 2026 ("Re: Call follow up"): MET: we wrote Jun 11, 2026');
    expect(met.text).not.toContain("Answer Savastano, Philip's request");
    const unknown = await build(base(request('unknown', 'nothing from us after their message of Jun 10, 2026 in what was read, but our Sent was not read (no GAP sender configured), so this is not known')));
    expect(unknown.text).toContain('Whether it was met is unknown: nothing from us after their message of Jun 10, 2026 in what was read, but our Sent was not read (no GAP sender configured), so this is not known.');
    expect(unknown.text).toContain("- Check whether Savastano, Philip's request of Jun 10, 2026 was met before writing (internal work):");
  });

  it('Who carries the stored contact details, the relationship word and the HubSpot record links; the between-us story rides under Relationship with the searched line; the vault note names the four documents as assets with no link on record and no wiki fragment leaks', async () => {
    const a = await build(base(request('unfulfilled', 'nothing from us after their message of Jun 10, 2026: our Sent was read (2 messages to them)')));
    const t = a.text;
    expect(t).toContain('- Savastano, Philip, Director of Supply Chain, The Boston Beer Company. Relationship: buyer.');
    expect(t).toContain(`  Email: ${PHIL} (verified). Phones: +1 617 555 0100 (direct; GAP contact record (status verified), updated Oct 1, 2026). Time zone: unavailable. LinkedIn: https://www.linkedin.com/in/phil-savastano/.`);
    expect(t).toContain('  HubSpot contact: https://app.hubspot.com/contacts/3819073/record/0-1/980. HubSpot company: https://app.hubspot.com/contacts/3819073/record/0-2/55. Deals: none open on record.');
    expect(t).toContain('Relationship with Savastano, Philip (buyer):');
    expect(t).toContain('- Last from Savastano, Philip: Jun 10, 2026, "Re: Call follow up": "Casey, can you send the four documents?" (buyer conversation).');
    expect(t).toContain('- Last from us: Oct 2, 2026, "Onsite at Primo" (HubSpot (logged email)). Nothing from them since (no exchange on record either way).');
    expect(t).toContain('- Last email to Brian Kellogg, Director Planning, Oct 2: "Re: Call follow up". No answer on record. (HubSpot, Oct 2)');
    expect(t).toContain("- Searched: GAP's synced inbox (1 message from them); our Sent to them (2 messages); read Oct 10, 2026, 9:00 AM New York.");
    expect(t).toContain('Assets named: Pilot-Program (no link on record); Pricing-and-Packaging (no link on record); ROI-One-Pager (no link on record); Solution-Overview (no link on record).');
    expect(t).toContain('- Next action on record, due Oct 8: Send the 4 tracked sales docs (Pilot-Program, Pricing-and-Packaging, ROI-One-Pager, Solution-Overview) as tracked links, first stop per RETIREMENT-HANDOFF since the handoff.');
    expect(t).not.toContain('[[');
    expect(a.html).not.toContain('[[');
    expect(lines(t)).toContain('Not read this time: Gmail Sent (no GAP sender configured)');
    expect(a.packet?.assets.map((x) => x.name)).toEqual(['Pilot-Program', 'Pricing-and-Packaging', 'ROI-One-Pager', 'Solution-Overview']);
  });

  it('assetsOf: a link in the note or from the registry rides with its document; an all-caps token is not a document', () => {
    expect(assetsOf(['Send the Pilot-Program https://yardflow.ai/assets/pilot-program.pdf per [[RETIREMENT-HANDOFF]]'], 'X')).toEqual([{ name: 'Pilot-Program', url: 'https://yardflow.ai/assets/pilot-program.pdf' }]);
    expect(assetsOf(['Send the ROI-One-Pager'], 'X', (name) => (name === 'ROI-One-Pager' ? 'https://yardflow.ai/roi' : null))).toEqual([{ name: 'ROI-One-Pager', url: 'https://yardflow.ai/roi' }]);
    expect(assetsOf(['In-sourcing moves the bottleneck; the Co-founder agreed.'], 'X'), 'hyphenated words are not documents').toEqual([]);
  });
});

describe('GUI-07: PepsiCo, the IW15 hold stands and "preparation remains"', () => {
  const pepsi = item({ key: 'first_touch:dec-1', accountName: 'PepsiCo', token: 'a'.repeat(32), title: 'Ready for a first touch: Tom Kamantauskas', person: { name: 'Tom Kamantauskas', title: 'Senior Director, Logistics' }, refs: { decisionId: 'dec-1' } });
  const pack = (persona: { email: string; name?: string | null }) => ({ rendered: { queued: { subject: 'Doors versus spots', body: 'Shawn, the doors.' } }, contentHash: 'h1', emailReady: true, hypothesis: null, persona });
  const ctx = ask({ accountName: 'PepsiCo', state: { state: 'ready', stateLine: 'Ready for a first touch: Tom Kamantauskas.', blocker: null, next: 'Prepare the first touch to Tom Kamantauskas.', coldTouchAllowed: true } });

  it('the hold: its wording unchanged, the email never shown, "preparation remains" with what is missing, the move is internal work; the relationship is read by name, never by the mismatched address', async () => {
    const relationship = vi.fn(async (_p: unknown, q: { email: string | null; name: string | null }) => rel({ person: { email: null, name: q.name }, purposeWord: 'prospect, no message from them on record', purpose: null }));
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([pepsi]), item: pepsi, ...input }, { askContext: async () => ctx, pack: async () => pack({ email: 'shawn.miller@pepsico.com', name: 'Shawn Miller' }), packet: { relationship, contact: { hubspotContact: null } }, senderEmail: 'casey@yardflow.ai' });
    expect(a.hold).toEqual({ reason: 'recipient_mismatch', detail: "GAP's prepared email is addressed to Shawn Miller (shawn.miller@pepsico.com), but this item names Tom Kamantauskas. Held: nothing goes out until the account's chosen person and the draft agree; choose on the account." });
    expect(a.prepared).toEqual({ kind: 'none' });
    expect(relationship.mock.calls[0][1]).toMatchObject({ email: null, name: 'Tom Kamantauskas' });
    const t = a.text;
    expect(lines(t)).toContain(a.hold!.detail);
    expect(t).toContain("Nothing is prepared yet; preparation remains: the account's chosen person and the draft must agree.");
    expect(t).not.toContain('Ready to send');
    expect(t).not.toContain('Shawn, the doors.');
    expect(t).toContain('- Choose the person on the account, then APPROVE on the next revision (internal work): the prepared email and this item name different people; nothing goes out until they agree.');
    expect(t).toContain('PepsiCo: Tom Kamantauskas (Senior Director, Logistics). Why now: A prepared first touch. Ready for a first touch: Tom Kamantauskas. As of Oct 10, 2026, 9:00 AM New York.');
    noCommandLines(t);
  });

  it('no hold: "Ready to send" names the matching recipient and the sender, the whole message is quoted, and APPROVE is explained as the send step in the app', async () => {
    const relationship = async () => rel({ person: { email: 'tom.k@pepsico.com', name: 'Tom Kamantauskas' } });
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([pepsi]), item: pepsi, ...input }, { askContext: async () => ctx, pack: async () => ({ ...pack({ email: 'tom.k@pepsico.com', name: 'Tom Kamantauskas' }), rendered: { queued: { subject: 'Doors versus spots', body: 'Tom, the doors.\n\nApprove the pilot if it fits.' } } }), packet: { relationship, contact: { hubspotContact: null } }, senderEmail: 'casey@yardflow.ai' });
    expect(a.prepared).toMatchObject({ kind: 'email', to: 'tom.k@pepsico.com' });
    const t = a.text;
    expect(t).toContain('Prepared material:');
    expect(t).toContain('Ready to send, to tom.k@pepsico.com, from casey@yardflow.ai, subject "Doors versus spots":');
    expect(t).toContain('> Tom, the doors.');
    expect(t).toContain('> Approve the pilot if it fits.');
    expect(t).toContain('- APPROVE: approves the prepared email for the send step in the app (CONFIRM + SEND there); nothing is sent from your reply.');
    expect(t).toContain('Opening a link never approves or sends anything.');
    noCommandLines(t);
    // The move leads the moves section and the prepared material follows it.
    const L = lines(t);
    expect(L.indexOf('Possible next move:')).toBeLessThan(L.indexOf('Prepared material:'));
  });
});

describe('GUI-06: Walmart, STOP first and no outbound move', () => {
  const walmart = item({ key: 'reply:w-1', accountName: 'Walmart Inc.', token: 'c'.repeat(32), kind: 'admin', stateKind: 'opted_out', title: 'Opted out', why: 'Admin: record it; buyer activity Oct 5.', href: '/gap/capture?account=Walmart+Inc.', person: { name: 'Tim Cooper', title: null } });
  const ctx = ask({ accountName: 'Walmart Inc.', state: { state: 'opted_out', stateLine: 'Opted out: Tim Cooper, Oct 5.', blocker: null, next: "Record Tim Cooper's opt-out as do not contact. No reply goes back.", coldTouchAllowed: false }, buyerSaid: [{ text: 'Asked not to be contacted: "stop"', who: 'Tim Cooper', at: '2026-10-05T13:58:03.000Z' }], story: [{ label: 'What is changing', tag: 'Checked', lines: [{ text: 'Walmart also reported plans to invest more than $330 million to upgrade its regional distribution center in Opelousas, Louisiana.', tag: 'Checked', basis: 'reported by supplychaindive.com, Oct 1, 2026' }] }], opening: { fact: 'A DC upgrade', basis: 'supplychaindive.com', whyTheyCare: 'Doug runs transportation and logistics: the fact is a site expansion.', supporting: null, proof: 'checked' } });

  it('the first line is STOP with the date and their words; the moves are administrative or none; the opt-out line and the evidence stay; the HTML carries the same first line', async () => {
    const relationship = async () => rel({ person: { email: 'tim.cooper@walmart.com', name: 'Tim Cooper' }, optOut: { at: '2026-10-05T13:58:03.000Z', words: 'stop', source: 'their message of Oct 5, 2026; NOT yet on the suppression list' } });
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([walmart]), item: walmart, ...input }, { askContext: async () => ctx, packet: { relationship, contact: { hubspotContact: null } }, senderEmail: null });
    const L = lines(a.text);
    expect(L[0]).toBe('STOP: Tim Cooper asked not to be contacted on Oct 5, 2026 ("stop"). No outbound to them from this item; their message of Oct 5, 2026; NOT yet on the suppression list.');
    expect(L[1]).toBe('Walmart Inc.: Tim Cooper. Why now: Admin: record it; buyer activity Oct 5. Opted out: Tim Cooper, Oct 5. As of Oct 10, 2026, 9:00 AM New York.');
    expect(a.packet?.moves.map((m) => m.kind)).toEqual(['administrative', 'none']);
    expect(a.packet?.moves.some((m) => m.kind === 'outbound'), 'no outbound to an opted-out person').toBe(false);
    expect(a.text).toContain("- Record Tim Cooper's opt-out as do not contact and close the item (DONE: what happened) (administrative): they asked not to be contacted; nothing goes back to them and the account cools before anyone else is touched.");
    expect(a.text).toContain('- Opt-out: Tim Cooper asked not to be contacted on Oct 5, 2026 ("stop"); their message of Oct 5, 2026; NOT yet on the suppression list.');
    expect(a.text).toContain('They said: "Asked not to be contacted: "stop"" (Tim Cooper, Oct 5, 2026)');
    expect(a.text).toContain('- Walmart also reported plans to invest more than $330 million to upgrade its regional distribution center in Opelousas, Louisiana. (reported Oct 1, 2026; supplychaindive.com)');
    expect(a.html.indexOf('STOP: Tim Cooper asked not to be contacted on Oct 5, 2026')).toBeLessThan(a.html.indexOf('Walmart Inc.: Tim Cooper.'));
    noCommandLines(a.text);
  });
});

describe('GUI-06: an administrative item from a vendor is labelled, with no buyer move', () => {
  it('Gusto: the Who line says vendor pitching us; the moves are vendor or administrative or none', async () => {
    const gusto = item({ key: 'reply:g-1', accountName: 'Gusto', token: 'd'.repeat(32), kind: 'admin', stateKind: 'replied', title: 'Someone replied', why: 'An old reply to triage.', href: '/gap/capture?account=Gusto', person: { name: 'Emily Maja', title: null } });
    const relationship = async () => rel({ person: { email: 'emily@gusto.com', name: 'Emily Maja' }, purpose: 'vendor_solicitation', purposeWord: 'vendor pitching us', lastInbound: { at: '2026-09-01T10:00:00.000Z', subject: 'Payroll for your team', purpose: 'vendor_solicitation', excerpt: 'We offer payroll and benefits for teams like yours.', threadId: 'g-1' } });
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([gusto]), item: gusto, ...input }, { askContext: async () => ask({ accountName: 'Gusto', state: { state: 'replied', stateLine: 'Someone replied.', blocker: null, next: 'Read the reply and record what they said.', coldTouchAllowed: false } }), packet: { relationship, contact: { hubspotContact: null } }, senderEmail: null });
    expect(a.text).toContain('- Emily Maja, Gusto. Relationship: vendor pitching us.');
    expect(a.text).toContain('- Last from Emily Maja: Sep 1, 2026, "Payroll for your team": "We offer payroll and benefits for teams like yours." (a vendor pitching us).');
    expect(a.packet?.moves.map((m) => m.kind)).toEqual(['vendor', 'administrative', 'none']);
    expect(a.text).toContain('- File it (DONE: what happened), no reply (vendor, not a buyer): Emily Maja is vendor pitching us; not a buyer conversation.');
    noCommandLines(a.text);
  });
});

describe('GUI-08: a deal item carries the exchange, the stakeholder, the promise and the next-step evidence, never the close date alone', () => {
  it('Kenco: the deal context lines under Relationship', async () => {
    const kenco = item({ key: 'deal:Kenco:2026-10-10', accountName: 'Kenco', token: 'e'.repeat(32), kind: 'deal', stateKind: 'in_deal', title: 'Next step on the deal: Send the pilot scope', why: "The deal's next step", href: '/gap/accounts/kenco?view=brief', person: { name: 'Dave Kiesling', title: 'VP Operations' } });
    const relationship = async () => rel({
      person: { email: 'dave.kiesling@kencogroup.com', name: 'Dave Kiesling' },
      lastInbound: { at: '2026-09-16T14:00:00.000Z', subject: 'Re: Chattanooga', purpose: 'buyer_conversation', excerpt: 'Chattanooga first, then the rest.', threadId: 'k-1' },
      lastOutbound: { at: '2026-10-01T14:00:00.000Z', subject: 'Pilot scope draft', threadId: 'k-1', source: 'Gmail Sent' },
      deals: [{ id: '1001', name: 'YardFlow - Kenco Chattanooga', stage: 'Qualified to buy', nextStep: 'Send pilot scope', closeDate: '2026-10-31', lastActivityAt: '2026-10-01T14:00:00.000Z', url: 'https://app.hubspot.com/contacts/3819073/record/0-3/1001' }],
      promises: [{ title: 'Send Dave the pilot scope', owner: 'casey@freightroll.com', dueAt: '2026-10-08T13:00:00.000Z', status: 'open', basis: null, theirs: true }],
    });
    const ctx = ask({ accountName: 'Kenco', state: { state: 'in_deal', stateLine: 'In a deal.', blocker: null, next: 'Send Dave the pilot scope.', coldTouchAllowed: false }, sellerNote: { lines: ['Next action on record, due Oct 8: one pilot Dave owns at Chattanooga.'] } });
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([kenco]), item: kenco, ...input }, { askContext: async () => ctx, pursued: async () => [], packet: { relationship, contact: { hubspotContact: null } }, senderEmail: null });
    const t = a.text;
    expect(t).toContain('- The deal: YardFlow - Kenco Chattanooga (Qualified to buy) https://app.hubspot.com/contacts/3819073/record/0-3/1001. Last HubSpot activity Oct 1, 2026. Close date Oct 31, 2026 (a field on the deal, not evidence of activity).');
    expect(t).toContain('- Next step on the deal (HubSpot): Send pilot scope.');
    expect(t).toContain('- Stakeholder: Dave Kiesling (buyer).');
    expect(t).toContain('- Last meaningful exchange: they wrote Sep 16, 2026 ("Re: Chattanooga"); we wrote Oct 1, 2026 ("Pilot scope draft").');
    expect(t).toContain('- Promise: "Send Dave the pilot scope" (casey@freightroll.com, due Oct 8, 2026, open).');
    expect(t).toContain('- Next action on record, due Oct 8: one pilot Dave owns at Chattanooga. (your vault note; not a buyer commitment)');
    expect(t).toContain('- Open deal: YardFlow - Kenco Chattanooga (Qualified to buy), next step: Send pilot scope https://app.hubspot.com/contacts/3819073/record/0-3/1001.');
    expect(t).toContain("Nothing is prepared yet; preparation remains: the deal's next step is yours to take; GAP has no copy for it.");
    noCommandLines(t);
  });
});

describe('GUI-04: evidence with its dates apart, weak sources labelled, syndications never counted', () => {
  const acme = item({ key: 'review:Acme', accountName: 'Acme Foods', token: 'f'.repeat(32), kind: 'review', stateKind: 'decide', title: 'Decide the angle', why: 'A proposal to review.', href: '/gap/accounts/acme-foods', person: null });
  const record = (over: Record<string, unknown>) => ({ producer: 'yards_first_brief', producerLabel: 'Yards First Brief', producerRunId: 'r-1', producerItemId: 'i-1', kind: 'development', title: 'Acme opens a DC', text: 'Acme Foods is opening a 900,000 square foot distribution center in Reno with 120 dock doors.', sources: [{ url: 'https://supplychaindive.com/acme-reno', publisher: 'supplychaindive.com', label: null }], sourceRecordIds: [], eventDate: '2026-09-24', reportedOn: '2026-10-01', reportedOnBasis: 'stated', collectedAt: null, importedAt: '2026-10-09T12:00:00.000Z', accountHint: 'Acme', personHints: [], producerStatus: null, uncertainty: null, interpretation: 'A first touch to the DC director before the doors open.', suggestions: [], archive: { reportRef: 'r-1', section: null }, visibility: 'digest', contentHash: 'x', revisions: [], ...over });

  it('an imported record: the event date, the report date and the import date apart, the source link, the interpretation apart; a record with no link is only the producer\'s claim', async () => {
    const imported = async () => [
      { id: 's-1', title: 'Acme opens a DC', url: 'https://supplychaindive.com/acme-reno', source_name: 'supplychaindive.com', published_at: null, metadata: { import: record({}) }, created_at: new Date('2026-10-09T12:00:00.000Z') },
      { id: 's-2', title: 'Acme hiring', url: null, source_name: null, published_at: null, metadata: { import: record({ producerItemId: 'i-2', title: 'Acme hiring a yard lead', text: 'Acme is hiring a yard operations lead in Reno.', sources: [], eventDate: null, reportedOn: '2026-10-08', reportedOnBasis: 'captured', interpretation: null }) }, created_at: new Date('2026-10-09T12:01:00.000Z') },
    ];
    const relationship = async () => rel({ person: { email: null, name: null }, purposeWord: 'prospect, no message from them on record', purpose: null });
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([acme]), item: acme, ...input }, { askContext: async () => ask({ accountName: 'Acme Foods' }), pursued: async () => [], packet: { relationship, imported, contact: { hubspotContact: null } }, senderEmail: null });
    const L = lines(a.text);
    const at = L.indexOf('What changed or remains unresolved:');
    expect(L[at + 1]).toBe('- Acme Foods is opening a 900,000 square foot distribution center in Reno with 120 dock doors. (event Sep 24, 2026; reported Oct 1, 2026; imported Oct 9, 2026; supplychaindive.com https://supplychaindive.com/acme-reno)');
    expect(L[at + 2]).toBe("  The producer's read (not an obligation): A first touch to the DC director before the doors open.");
    expect(L[at + 3]).toBe("- Acme is hiring a yard operations lead in Reno. (reported Oct 8, 2026 (the capture date; the report states none); imported Oct 9, 2026; Yards First Brief: only the producer's claim is available)");
    expect(a.html).toContain('<a href="https://supplychaindive.com/acme-reno">https://supplychaindive.com/acme-reno</a>');
    noCommandLines(a.text);
  });

  it('story excerpts: three printed, the rest counted as independent sources with syndications of one text counted once; a headline link from the pack is never full evidence', async () => {
    const line = (text: string, basis: string) => ({ text, tag: 'Checked', basis });
    const ctx = ask({ accountName: 'Acme Foods', story: [{ label: 'Stories that matter', tag: 'Checked', lines: [line('Acme is opening a DC in Reno.', 'reported by supplychaindive.com, Oct 1, 2026'), line('Acme is opening a DC in Reno.', 'reported by yahoo.com, Oct 1, 2026'), line('Acme named a new COO.', 'reported by prnewswire.com, Sep 2, 2026'), line('Acme is closing its Fresno plant.', 'reported by sec.gov, Aug 1, 2026'), line('Acme bought two reefer carriers.', 'reported by freightwaves.com, Jul 1, 2026')] }] });
    const pack = { rendered: null, contentHash: null, hypothesis: { signals: [{ signal: { title: 'Acme Reno DC', evidence_url: 'https://supplychaindive.com/acme-reno', observed_at: new Date('2026-10-01T10:00:00Z') } }] } };
    const first = item({ key: 'first_touch:dec-9', accountName: 'Acme Foods', token: 'f'.repeat(32), refs: { decisionId: 'dec-9' }, person: { name: 'Ana Ruiz', title: null } });
    const relationship = async () => rel({ person: { email: null, name: 'Ana Ruiz' }, purposeWord: 'prospect, no message from them on record', purpose: null });
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([first]), item: first, ...input }, { askContext: async () => ctx, pack: async () => pack, packet: { relationship, contact: { hubspotContact: null } }, senderEmail: null });
    const L = lines(a.text);
    const at = L.indexOf('Evidence:');
    expect(L.slice(at + 1, at + 4)).toEqual([
      '- Acme is opening a DC in Reno. (reported by supplychaindive.com, Oct 1, 2026)',
      '- Acme named a new COO. (reported by prnewswire.com, Sep 2, 2026)',
      '- Acme is closing its Fresno plant. (reported by sec.gov, Aug 1, 2026)',
    ]);
    // Five story lines and one headline, with one syndication: four independent texts beyond the three printed is two more.
    expect(L[at + 4]).toBe('- 2 more independent sources on record (syndications of one text not counted); open the account for them.');
    expect(a.packet?.evidenceMore).toBe(2);
    expect(a.packet?.evidence.some((e) => /headline link/.test(e.text)), 'the headline is not among the first three').toBe(false);
  });
});

describe('GUI-02: the text and the HTML carry one packet; the digest words match the first line', () => {
  it('every section heading and key line is in both; the packet\'s item words are the item\'s; asOf is the build instant', async () => {
    const pepsi = item({ key: 'first_touch:dec-1', accountName: 'PepsiCo', token: 'a'.repeat(32), title: 'Ready for a first touch: Tom K', person: { name: 'Tom K', title: 'VP' }, refs: { decisionId: 'dec-1' } });
    const pack = { rendered: { queued: { subject: 'Doors', body: 'Tom, the doors.' } }, contentHash: 'h1', emailReady: true, hypothesis: null, persona: { email: 'tom@pepsico.com', name: 'Tom K' } };
    const relationship = async () => rel({ person: { email: 'tom@pepsico.com', name: 'Tom K' } });
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([pepsi]), item: pepsi, ...input }, { askContext: async () => ask({ accountName: 'PepsiCo' }), pack: async () => pack, packet: { relationship, contact: { hubspotContact: null } }, senderEmail: 'casey@yardflow.ai' });
    const p = a.packet as AssignmentPacket;
    expect(p.item).toEqual({ kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch: Tom K', personName: 'Tom K', personTitle: 'VP' });
    expect(p.asOf).toBe(NOW.toISOString());
    expect(lines(a.text)[0]).toBe('PepsiCo: Tom K (VP). Why now: A prepared first touch. Ready for a first touch. As of Oct 10, 2026, 9:00 AM New York.');
    const sections = packetSections(p, { open: 'https://app.example/gap/pack/dec-1' }, { commandsEnabled: true });
    for (const s of sections) {
      if (s.heading) { expect(a.text).toContain(s.heading); expect(a.html).toContain(s.heading.replace(/'/g, '&#39;').replace(/'/g, "'")); }
    }
    for (const key of ['Who:', 'Relationship with Tom K (buyer):', 'Evidence:', 'Possible next move:', 'Prepared material:', 'Controls:', 'Ready to send, to tom@pepsico.com, from casey@yardflow.ai, subject &quot;Doors&quot;:', 'Tom, the doors.', 'Searched:']) expect(a.html).toContain(key);
    expect(renderPacketText(p, { open: 'x' }, { commandsEnabled: false })).not.toMatch(/first line of your reply/);
    expect(renderPacketHtml(p, { open: 'x' }, { commandsEnabled: false })).not.toMatch(/first line of your reply/);
    noCommandLines(a.text);
  });

  it('movesOf never offers an outbound move to an opted-out person, whatever is prepared', () => {
    const it0 = item({ key: 'k', accountName: 'A', token: 'z'.repeat(32) });
    const stopped = rel({ person: { email: 'x@a.com', name: 'X' }, optOut: { at: '2026-10-05T00:00:00Z', words: 'stop', source: 'the suppression list' } });
    const moves = movesOf({ item: it0, move: 'Send the first touch to X.', prepared: { kind: 'email', to: 'x@a.com', subject: 's', body: 'b' }, hold: null, rel: stopped, personName: 'X' });
    expect(moves.map((m) => m.kind)).toEqual(['administrative', 'none']);
    const open = movesOf({ item: it0, move: 'Send the first touch to X.', prepared: { kind: 'email', to: 'x@a.com', subject: 's', body: 'b' }, hold: null, rel: { ...stopped, optOut: null }, personName: 'X' });
    expect(open[0]).toEqual({ label: 'Send the first touch to X', reason: 'a prepared email to x@a.com is below; APPROVE sends it to the send step in the app (CONFIRM + SEND there)', kind: 'outbound' });
  });
});
