// @vitest-environment node
/**
 * GUI-05 / GUI-06 (the Gmail action UI audit, 2026-10-10): the relationship reconciled across both sides of the mail.
 * Pinned: Phil's request to send four documents is FULFILLED only when we wrote after it in its thread or under its
 * subject, "a draft exists, unsent" when only a draft followed, UNFULFILLED when nothing followed and Sent was read,
 * UNKNOWN when Sent was not read (said so) or when a later send was not in the request's thread; no repeat send is
 * inferred from the old reply alone. The opt-out is read from their words beside the suppression rows; every person
 * carries the relationship word from the purpose classifier; `searched` names what was read and what was not.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { PURPOSE_WORDS, dateWords, dealsFromSummary, purposeWordOf, relationshipStateFor, relationshipStateFrom, typeEvents, type RelationshipEvent, type RelationshipInputs, type RelationshipReads } from '@/lib/gap/work/relationship-state';

const NOW = new Date('2026-10-10T13:00:00Z');
const PHIL = 'phil.savastano@bostonbeer.com';

const reads = (over: Partial<RelationshipReads> = {}): RelationshipReads => ({
  inbox: { read: true, count: 1, detail: null },
  sent: { read: true, count: 0, detail: null },
  drafts: { read: true, count: 0, detail: null },
  engagements: { read: true, count: 0, detail: null },
  commitments: { read: true, count: 0 },
  deals: { read: true, detail: null },
  conversations: { read: true, count: 0 },
  ...over,
});

const ev = (over: Partial<RelationshipEvent> & { id: string; at: string; direction: 'inbound' | 'outbound' }): RelationshipEvent => ({
  type: 'email', isDraft: false, from: over.direction === 'inbound' ? PHIL : null, to: over.direction === 'outbound' ? [PHIL] : [], subject: null, excerpt: null, purpose: over.direction === 'inbound' ? 'buyer_conversation' : 'buyer_conversation', threadId: null, source: over.direction === 'inbound' ? "GAP's synced inbox" : 'Gmail Sent', ...over,
});

const ASK = ev({ id: 'm-ask', at: '2026-06-10T13:50:48.000Z', direction: 'inbound', subject: 'Re: Call follow up', threadId: 't-1', excerpt: "Casey, can you send the four documents (pilot program, pricing, ROI one-pager, solution overview)? We're all out Thursday." });

const inputs = (events: RelationshipEvent[], over: Partial<RelationshipInputs> = {}): RelationshipInputs => ({
  person: { email: PHIL, name: 'Phil Savastano' },
  accountName: 'The Boston Beer Company',
  now: NOW,
  events,
  engagements: [],
  commitments: [],
  deals: [],
  suppression: { unsubscribed: null, doNotContact: false },
  reads: reads(),
  mailbox: 'casey@yardflow.ai',
  hubspotContactId: '980',
  hubspotCompanyId: '55',
  ...over,
});

describe('GUI-05: the request state (Boston Beer, Phil asked for four documents on Jun 10, 2026)', () => {
  it('FULFILLED when we wrote after it in its thread (the basis names our send and its date)', () => {
    const s = relationshipStateFrom(inputs([ASK, ev({ id: 's-1', at: '2026-06-11T15:00:00.000Z', direction: 'outbound', subject: 'Re: Call follow up', threadId: 't-1' })], { reads: reads({ sent: { read: true, count: 1, detail: null } }) }));
    expect(s.requestState).toBe('fulfilled');
    expect(s.request?.basis).toBe('we wrote Jun 11, 2026 under "Re: Call follow up" (Gmail Sent), after their message of Jun 10, 2026');
    expect(s.request?.fulfilledBy).toEqual({ at: '2026-06-11T15:00:00.000Z', subject: 'Re: Call follow up' });
    expect(s.lastOutbound?.at).toBe('2026-06-11T15:00:00.000Z');
  });

  it('FULFILLED under the same subject with no thread id (a HubSpot-logged send)', () => {
    const s = relationshipStateFrom(inputs([ASK, ev({ id: 'hs-9', at: '2026-06-12T15:00:00.000Z', direction: 'outbound', subject: 'RE: Call follow up', threadId: null, source: 'HubSpot (logged email)' })]));
    expect(s.requestState).toBe('fulfilled');
    expect(s.request?.basis).toContain('(HubSpot (logged email))');
  });

  it('UNFULFILLED when nothing followed and our Sent was read; no repeat send is inferred from the old reply alone', () => {
    const s = relationshipStateFrom(inputs([ASK], { reads: reads({ sent: { read: true, count: 0, detail: null } }) }));
    expect(s.requestState).toBe('unfulfilled');
    expect(s.request?.basis).toBe('nothing from us after their message of Jun 10, 2026: our Sent was read (0 messages to them), HubSpot engagements read');
    expect(s.request?.fulfilledBy).toBeNull();
    expect(s.request?.draft).toBeNull();
  });

  it('UNKNOWN when our Sent was not read, and the basis says so', () => {
    const s = relationshipStateFrom(inputs([ASK], { reads: reads({ sent: { read: false, count: 0, detail: 'no GAP sender configured' } }) }));
    expect(s.requestState).toBe('unknown');
    expect(s.request?.basis).toBe('nothing from us after their message of Jun 10, 2026 in what was read, but our Sent was not read (no GAP sender configured), so this is not known');
    expect(s.searched).toContain('our Sent to them (not read: no GAP sender configured)');
  });

  it('a draft after it is "a draft exists, unsent": the request stays UNFULFILLED and the draft is listed, never counted as a send', () => {
    const s = relationshipStateFrom(inputs([ASK, ev({ id: 'd-1', at: '2026-10-09T10:00:00.000Z', direction: 'outbound', isDraft: true, type: 'draft', subject: 'Re: Call follow up', threadId: 't-1', source: 'Gmail drafts', draftId: 'r-77' })], { reads: reads({ drafts: { read: true, count: 1, detail: null } }) }));
    expect(s.requestState).toBe('unfulfilled');
    expect(s.request?.basis).toBe('a draft exists, unsent (Oct 9, 2026, "Re: Call follow up"); nothing went to them after their message of Jun 10, 2026');
    expect(s.request?.draft).toEqual({ at: '2026-10-09T10:00:00.000Z', subject: 'Re: Call follow up' });
    expect(s.drafts).toEqual([{ at: '2026-10-09T10:00:00.000Z', subject: 'Re: Call follow up', to: PHIL, threadId: 't-1', draftId: 'r-77' }]);
    expect(s.lastOutbound, 'a draft is never the last send').toBeNull();
  });

  it('a later send in another thread under another subject leaves the request UNKNOWN with the send named (your call), never fulfilled', () => {
    const s = relationshipStateFrom(inputs([ASK, ev({ id: 's-2', at: '2026-10-02T15:00:00.000Z', direction: 'outbound', subject: 'Onsite at Primo later this week', threadId: 't-9' })]));
    expect(s.requestState).toBe('unknown');
    expect(s.request?.basis).toBe('we wrote Oct 2, 2026 under "Onsite at Primo later this week" after it, not in the request\'s thread; whether that met the request is your call');
  });

  it('a message of theirs that asks nothing is no request; the last inbound and outbound still read with their dates and purposes', () => {
    const s = relationshipStateFrom(inputs([ev({ id: 'm-1', at: '2026-08-11T09:00:00.000Z', direction: 'inbound', subject: 'Thanks', excerpt: 'Thanks Casey, talk soon.' }), ev({ id: 's-1', at: '2026-08-12T09:00:00.000Z', direction: 'outbound', subject: 'Re: Thanks' })]));
    expect(s.requestState).toBe('none');
    expect(s.request).toBeNull();
    expect(s.lastInbound).toMatchObject({ at: '2026-08-11T09:00:00.000Z', subject: 'Thanks', purpose: 'buyer_conversation' });
    expect(s.lastOutbound).toMatchObject({ at: '2026-08-12T09:00:00.000Z', subject: 'Re: Thanks', source: 'Gmail Sent' });
    expect(s.laterResponse).toBeNull();
    expect(s.answerOwed.owed).toBe(false);
  });

  it('their later response after our send is read as such (an answer is not owed)', () => {
    const s = relationshipStateFrom(inputs([ev({ id: 's-1', at: '2026-09-24T09:00:00.000Z', direction: 'outbound', subject: 'two days, five facilities' }), ev({ id: 'm-2', at: '2026-09-25T09:00:00.000Z', direction: 'inbound', subject: 'Re: two days, five facilities', excerpt: 'Works for us, see you then.' })]));
    expect(s.laterResponse).toEqual({ at: '2026-09-25T09:00:00.000Z', subject: 'Re: two days, five facilities' });
  });
});

describe('GUI-06: the opt-out and the relationship word', () => {
  it('Walmart: "stop" in their own words is the opt-out with its date; the source says whether the suppression list holds it', () => {
    const stop = ev({ id: 'w-1', at: '2026-10-05T13:58:03.000Z', direction: 'inbound', from: 'tim.cooper@walmart.com', subject: 'RE: Leaving this with you', excerpt: 'stop From: Casey Larkin Sent: Monday, October 5, 2026 9:34 AM' });
    const base = inputs([stop], { person: { email: 'tim.cooper@walmart.com', name: 'Tim Cooper' }, accountName: 'Walmart Inc.' });
    const a = relationshipStateFrom(base);
    // Their own words only: the quoted header the stored snippet carries ("From: Casey Larkin Sent: ...") is cut.
    expect(a.optOut).toEqual({ at: '2026-10-05T13:58:03.000Z', words: 'stop', source: 'their message of Oct 5, 2026; NOT yet on the suppression list' });
    const b = relationshipStateFrom({ ...base, suppression: { unsubscribed: { at: '2026-10-05T14:00:00.000Z', reason: 'stop' }, doNotContact: false } });
    expect(b.optOut?.source).toBe('their message of Oct 5, 2026; on the suppression list');
    // The suppression list alone (no message in the window) is still an opt-out.
    const c = relationshipStateFrom(inputs([], { suppression: { unsubscribed: { at: '2026-10-05T14:00:00.000Z', reason: 'stop' }, doNotContact: false } }));
    expect(c.optOut).toEqual({ at: '2026-10-05T14:00:00.000Z', words: 'stop', source: 'the suppression list' });
    expect(relationshipStateFrom(inputs([])).optOut).toBeNull();
  });

  it('the relationship word: the newest meaningful message decides; a vendor pitch says so; no message says prospect; automated only says so', () => {
    expect(purposeWordOf([{ purpose: 'buyer_conversation', at: '2026-06-01T00:00:00Z' }, { purpose: 'vendor_solicitation', at: '2026-07-01T00:00:00Z' }]).word).toBe('vendor pitching us');
    expect(purposeWordOf([]).word).toBe('prospect, no message from them on record');
    expect(purposeWordOf([{ purpose: 'automated', at: '2026-07-01T00:00:00Z' }]).word).toBe('calendar or automated; no message from them in their own words');
    expect(PURPOSE_WORDS.customer_support).toBe('customer');
    expect(PURPOSE_WORDS.internal).toBe('administrative (internal)');
  });

  it('typeEvents: the thread context leaves purposes null; the classifier sets them (an opt-out is their word; a pitch from a stranger is a vendor)', () => {
    const typed = typeEvents([
      { ...ev({ id: 'x-1', at: '2026-10-05T13:58:03.000Z', direction: 'inbound', excerpt: 'stop', subject: 'RE: Leaving this with you' }), purpose: null },
      { ...ev({ id: 'x-2', at: '2026-10-06T13:58:03.000Z', direction: 'inbound', from: 'sam@leadgenagency.io', excerpt: 'We offer appointment setting and SDR services for yard management vendors like YardFlow.', subject: 'Grow your pipeline' }), purpose: null },
    ], { knownPerson: false });
    expect(typed[0].purpose).toBe('buyer_conversation');
    expect(typed[1].purpose).toBe('vendor_solicitation');
  });

  it('meetings, deals and promises ride with their sources; the promise with this person is first; searched names every read and the clock', () => {
    const s = relationshipStateFrom(inputs([ev({ id: 'c-1', at: '2026-09-16T15:00:00.000Z', direction: 'inbound', type: 'conversation', conversation: { kind: 'meeting', title: 'Kenco pilot scope', source: 'vault' } })], {
      engagements: [{ kind: 'meeting', at: '2026-08-20T15:00:00.000Z', title: 'Intro call', body: 'Outcome: agreed to a pilot scope by October.', id: 'e-1' }],
      deals: [{ id: '1001', name: 'YardFlow - Kenco Chattanooga', stage: 'Qualified to buy', nextStep: 'Send pilot scope', closeDate: '2026-10-31', lastActivityAt: '2026-09-16T15:00:00.000Z' }],
      commitments: [{ title: 'Send the ROI one-pager', owner: 'casey@freightroll.com', dueAt: '2026-10-08T13:00:00.000Z', status: 'open', basis: null, person: null }, { title: 'Send Phil the four documents', owner: 'casey@freightroll.com', dueAt: '2026-06-14T13:00:00.000Z', status: 'open', basis: 'Phil: can you send the four documents?', person: { email: PHIL, name: 'Phil Savastano' } }],
      reads: reads({ commitments: { read: true, count: 2 }, conversations: { read: true, count: 1 }, engagements: { read: true, count: 1, detail: null } }),
    }));
    expect(s.meetings.map((m) => [dateWords(m.at), m.kind, m.source])).toEqual([['Sep 16, 2026', 'meeting', "the vault's meeting note"], ['Aug 20, 2026', 'meeting', 'HubSpot']]);
    expect(s.meetings[1].outcome).toBe('Outcome: agreed to a pilot scope by October.');
    expect(s.deals[0]).toMatchObject({ id: '1001', name: 'YardFlow - Kenco Chattanooga', stage: 'Qualified to buy', nextStep: 'Send pilot scope', url: 'https://app.hubspot.com/contacts/3819073/record/0-3/1001' });
    expect(s.promises[0]).toMatchObject({ title: 'Send Phil the four documents', theirs: true });
    expect(s.links).toEqual({ thread: `https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#search/${encodeURIComponent(`from:"${PHIL}"`)}`, hubspotContact: 'https://app.hubspot.com/contacts/3819073/record/0-1/980', hubspotCompany: 'https://app.hubspot.com/contacts/3819073/record/0-2/55' });
    expect(s.searched).toBe(`GAP's synced inbox for ${PHIL} (1 message from them); our Sent to them (0 messages); Gmail drafts to them (0); HubSpot engagements at The Boston Beer Company (1); the commitments ledger (2); open deals (1); the vault's calls and meetings (1); the suppression list; read Oct 10, 2026, 9:00 AM New York`);
  });

  it('dealsFromSummary: not read is said; an incomplete read is said; an alias row answers for its account', () => {
    expect(dealsFromSummary(null, 'Kenco')).toEqual({ deals: [], read: false, detail: 'the in-deals summary was not read this time' });
    expect(dealsFromSummary({ status: 'unavailable', error: 'HubSpot 429', accounts: [] }, 'Kenco')).toEqual({ deals: [], read: false, detail: 'HubSpot 429' });
    const summary = { status: 'complete', accounts: [{ accountName: 'Kenco', alsoRecordedAs: ['Kenco Logistics'], deals: [{ id: '1001', name: 'YardFlow - Kenco Chattanooga', stage: 'Qualified to buy' }] }] };
    expect(dealsFromSummary(summary, 'kenco logistics').deals).toHaveLength(1);
  });
});

describe('GUI-05: the loader over the ledger (the synced inbox, the persona, the suppression row; Sent only through a reader)', () => {
  const seed = () => ledgerDb({
    accounts: [{ name: 'The Boston Beer Company', hubspot_company_id: '55' }],
    personas: [{ id: 980, name: 'Savastano, Philip', title: 'Director of Supply Chain', email: PHIL, account_name: 'The Boston Beer Company', hubspot_contact_id: '980', do_not_contact: false }],
    inbound: [{ id: 'm-ask', thread_id: 't-1', from_email: PHIL, from_name: 'Savastano, Philip', subject: 'Re: Call follow up', snippet: 'Casey, can you send the four documents? We are all out Thursday.', body_text: 'Casey, can you send the four documents? We are all out Thursday.', received_at: new Date('2026-06-10T13:50:48.000Z'), source: 'gmail' }],
  }, NOW);
  const deps = { engagements: vi.fn(async () => ({ items: [], read: true, detail: null })), deals: vi.fn(async () => ({ deals: [], read: true, detail: null })), conversations: vi.fn(async () => []) };

  it('with no Gmail reader (no GAP sender) the request is UNKNOWN and Sent is said not read; the persona names the person and the HubSpot links', async () => {
    const s = await relationshipStateFor(seed().client(), { accountName: 'The Boston Beer Company', email: PHIL, name: 'Savastano, Philip', now: NOW }, { ...deps, thread: null, env: {} });
    expect(s.requestState).toBe('unknown');
    expect(s.request?.basis).toContain('our Sent was not read (no GAP sender configured)');
    expect(s.lastInbound?.purpose).toBe('buyer_conversation');
    expect(s.links.hubspotContact).toBe('https://app.hubspot.com/contacts/3819073/record/0-1/980');
    expect(s.searched).toContain(`GAP's synced inbox for ${PHIL} (1 message from them)`);
    expect(s.searched).toContain('our Sent to them (not read: no GAP sender configured)');
    expect(deps.engagements).toHaveBeenCalledWith('55', NOW);
  });

  it('with a Sent reader that holds our reply in the thread, the request is FULFILLED; a Drafts reader that holds only a draft leaves it unfulfilled with the draft named', async () => {
    const listSent = vi.fn(async () => [{ id: 'g-1', threadId: 't-1', internalDate: new Date('2026-06-11T15:00:00.000Z'), to: `Phil <${PHIL}>`, subject: 'Re: Call follow up', text: 'Attached, Phil.' }]);
    const a = await relationshipStateFor(seed().client(), { accountName: 'The Boston Beer Company', email: PHIL, now: NOW }, { ...deps, thread: { listSent, ownAddresses: new Set(['casey@yardflow.ai']) }, env: {} });
    expect(a.requestState).toBe('fulfilled');
    expect(listSent).toHaveBeenCalledWith(PHIL, expect.any(Number), expect.any(Number));
    const listDrafts = vi.fn(async () => [{ id: 'd-1', threadId: 't-1', internalDate: new Date('2026-10-09T10:00:00.000Z'), to: PHIL, subject: 'Re: Call follow up', text: 'Phil, here they are', isDraft: true }]);
    const b = await relationshipStateFor(seed().client(), { accountName: 'The Boston Beer Company', email: PHIL, now: NOW }, { ...deps, thread: { listSent: async () => [], listDrafts, ownAddresses: new Set(['casey@yardflow.ai']) }, env: {} });
    expect(b.requestState).toBe('unfulfilled');
    expect(b.request?.basis).toContain('a draft exists, unsent (Oct 9, 2026');
    expect(b.drafts).toHaveLength(1);
  });

  it('the suppression row is read for the address; a person with no address says the inbox was not searched', async () => {
    const db = ledgerDb({ accounts: ['Walmart Inc.'], unsubscribed: [{ email: 'tim.cooper@walmart.com', unsubscribed_at: new Date('2026-10-05T14:00:00.000Z'), reason: 'stop' }] }, NOW);
    const s = await relationshipStateFor(db.client(), { accountName: 'Walmart Inc.', email: 'tim.cooper@walmart.com', name: 'Tim Cooper', now: NOW }, { ...deps, thread: null, env: {} });
    expect(s.optOut).toEqual({ at: '2026-10-05T14:00:00.000Z', words: 'stop', source: 'the suppression list' });
    const none = await relationshipStateFor(db.client(), { accountName: 'Walmart Inc.', name: 'Hugo Nobody', now: NOW }, { ...deps, thread: null, env: {} });
    expect(none.searched).toContain('no address on record for Hugo Nobody: the inbox was not searched');
    expect(none.requestState).toBe('none');
  });
});
