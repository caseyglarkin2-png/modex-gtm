// @vitest-environment node
/**
 * The relationship state's fixes (Casey, 2026-10-10): a referral in their words follows the person they named and
 * resolves to the account's contacts; a request they redirected is REDIRECTED, never owed by the asker; nothing says
 * an answer is owed when our outbound history (Sent, or HubSpot's logged emails) was not read; the specific Gmail
 * thread is linked when its id is on record, else a search is said to be one.
 */
import { describe, expect, it } from 'vitest';
import { gmailThreadLink, relationshipStateFrom, resolveReferralName, type RelationshipEvent, type RelationshipInputs, type RelationshipReads } from '@/lib/gap/work/relationship-state';

const NOW = new Date('2026-10-10T13:00:00Z');
const PHIL = 'philip.savastano@bostonbeer.com';
const BRIAN = 'brian.kellogg@bostonbeer.com';
const reads = (over: Partial<RelationshipReads> = {}): RelationshipReads => ({ inbox: { read: true, count: 1, detail: null }, sent: { read: false, count: 0, detail: 'no GAP sender configured' }, drafts: { read: false, count: 0, detail: 'no GAP sender configured' }, engagements: { read: true, count: 4, detail: null }, commitments: { read: true, count: 0 }, deals: { read: true, detail: null }, conversations: { read: true, count: 0 }, ...over });
const ev = (over: Partial<RelationshipEvent> & { id: string; at: string; direction: 'inbound' | 'outbound' }): RelationshipEvent => ({ type: 'email', isDraft: false, from: over.direction === 'inbound' ? PHIL : null, to: over.direction === 'outbound' ? [PHIL] : [], subject: null, excerpt: null, purpose: 'buyer_conversation', threadId: null, source: over.direction === 'inbound' ? "GAP's synced inbox" : 'Gmail Sent', ...over });
const ASK = ev({ id: 'm-ask', at: '2026-06-02T11:44:08.000Z', direction: 'inbound', subject: 'Re: [EXTERNAL] Yard flow insights amid leadership change', threadId: '19e8826006435cef', excerpt: 'Hi. Not sure if would work, feel free to send some info and I will take look. Phil' });
const REFER = ev({ id: 'm-refer', at: '2026-06-03T12:00:00.000Z', direction: 'inbound', subject: 'FW: [EXTERNAL] Yard flow insights amid leadership change', threadId: '19e8826006435cef', excerpt: 'Hi Casey. Feel free to reach out to Brian Kellog to see if can work timing. From: Casey Larkin Sent: Tuesday' });
const inputs = (events: RelationshipEvent[], over: Partial<RelationshipInputs> = {}): RelationshipInputs => ({ person: { email: PHIL, name: 'Savastano, Philip' }, accountName: 'The Boston Beer Company', now: NOW, events, engagements: [], commitments: [], deals: [], suppression: { unsubscribed: null, doNotContact: false }, reads: reads(), mailbox: 'casey@yardflow.ai', hubspotContactId: '980', hubspotCompanyId: '55', people: [{ name: 'Brian Kellogg', email: BRIAN }, { name: 'Savastano, Philip', email: PHIL }, { name: 'Cowan, David', email: 'david.cowan@bostonbeer.com' }], othersWritten: [{ at: '2026-10-02T15:00:00.000Z', to: BRIAN, toName: 'Brian Kellogg', subject: 'Re: Call follow up', source: 'HubSpot (logged email)' }], ...over });

describe('a referral in their words', () => {
  it('REDIRECTED: Phil asked Jun 2, pointed to Brian Kellog(g) Jun 3; we wrote Brian Oct 2 (HubSpot): the request follows Brian and nothing is owed to Phil from it', () => {
    const s = relationshipStateFrom(inputs([ASK, REFER]));
    expect(s.referral).toEqual({ at: '2026-06-03T12:00:00.000Z', subject: 'FW: [EXTERNAL] Yard flow insights amid leadership change', name: 'Brian Kellogg', email: BRIAN, writtenAfter: { at: '2026-10-02T15:00:00.000Z', subject: 'Re: Call follow up', source: 'HubSpot (logged email)' } });
    expect(s.requestState).toBe('redirected');
    expect(s.request?.redirectedTo?.name).toBe('Brian Kellogg');
    expect(s.request?.basis).toBe('on Jun 3, 2026 they pointed to Brian Kellogg; we wrote Brian Kellogg Oct 2, 2026 under "Re: Call follow up" (HubSpot (logged email))');
  });

  it('with nothing to the named person on record: the basis says so when our outbound was read, and "not known" when it was not', () => {
    const read = relationshipStateFrom(inputs([ASK, REFER], { othersWritten: [] }));
    expect(read.request?.basis).toBe("on Jun 3, 2026 they pointed to Brian Kellogg; nothing to Brian Kellogg on record after that (our Sent was not read (no GAP sender configured); HubSpot's logged emails at The Boston Beer Company were read (4 engagements), which is our outbound record here)");
    const unread = relationshipStateFrom(inputs([ASK, REFER], { othersWritten: [], reads: reads({ engagements: { read: false, count: 0, detail: 'no HubSpot company on the account record' } }) }));
    expect(unread.request?.basis).toBe('on Jun 3, 2026 they pointed to Brian Kellogg; whether we wrote Brian Kellogg is not known (our Sent was not read (no GAP sender configured) and HubSpot engagements at The Boston Beer Company were not read (no HubSpot company on the account record), so what we sent is not known)');
  });

  it('their own name or ours is never a referral; a referral before the request leaves the request as it was', () => {
    const self = relationshipStateFrom(inputs([ev({ id: 'x', at: '2026-06-03T12:00:00.000Z', direction: 'inbound', excerpt: 'Please contact Philip Savastano directly. Can you send the deck?' })]));
    expect(self.referral).toBeNull();
    const before = relationshipStateFrom(inputs([REFER, ev({ id: 'later-ask', at: '2026-07-01T12:00:00.000Z', direction: 'inbound', subject: 'Pricing', excerpt: 'Can you send pricing?' })]));
    expect(before.referral?.name).toBe('Brian Kellogg');
    expect(before.requestState).toBe('unknown');
  });

  it('resolveReferralName: a close spelling resolves to the one person at the account; an unknown name stays as written with no address', () => {
    const people = [{ name: 'Brian Kellogg', email: BRIAN }, { name: 'Brianna Stone', email: 'b.stone@x.com' }];
    expect(resolveReferralName('Brian Kellog', people)).toEqual({ name: 'Brian Kellogg', email: BRIAN });
    expect(resolveReferralName('Kellogg, Brian', people)).toEqual({ name: 'Brian Kellogg', email: BRIAN });
    expect(resolveReferralName('Jane Doe', people)).toEqual({ name: 'Jane Doe', email: null });
  });
});

describe('what we sent is only evidence when it was read', () => {
  it('Sent not read and HubSpot not read: an answer is not "owed", it is not known (known: false); with HubSpot read, HubSpot is the outbound record', () => {
    const unread = relationshipStateFrom(inputs([ASK], { reads: reads({ engagements: { read: false, count: 0, detail: 'no HubSpot company on the account record' } }) }));
    expect(unread.outboundRead).toEqual({ read: false, basis: 'our Sent was not read (no GAP sender configured) and HubSpot engagements at The Boston Beer Company were not read (no HubSpot company on the account record), so what we sent is not known' });
    expect(unread.answerOwed.known).toBe(false);
    expect(unread.answerOwed.owed).toBe(false);
    expect(unread.answerOwed.basis).toMatch(/^whether an answer went is not known: /);
    const hub = relationshipStateFrom(inputs([ASK]));
    expect(hub.outboundRead).toEqual({ read: true, basis: "our Sent was not read (no GAP sender configured); HubSpot's logged emails at The Boston Beer Company were read (4 engagements), which is our outbound record here" });
    expect(hub.answerOwed.known).toBe(true);
    const sent = relationshipStateFrom(inputs([ASK], { reads: reads({ sent: { read: true, count: 0, detail: null } }) }));
    expect(sent.outboundRead.basis).toBe("our Sent was read (0 messages to them); HubSpot's logged emails at The Boston Beer Company were read");
    expect(sent.reads.sent.read).toBe(true);
  });
});

describe('the thread link', () => {
  it('a Gmail thread id on their newest message links that thread; a non-Gmail id falls back to a search, said as one', () => {
    const thread = relationshipStateFrom(inputs([ASK]));
    expect(thread.links.thread).toBe('https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#all/19e8826006435cef');
    expect(thread.links.threadKind).toBe('thread');
    const search = relationshipStateFrom(inputs([ev({ id: 'h', at: '2026-06-02T11:44:08.000Z', direction: 'inbound', threadId: 'hs-thread-1', excerpt: 'Hello' })]));
    expect(search.links.thread).toContain('#search/');
    expect(search.links.threadKind).toBe('search');
    expect(gmailThreadLink('19e8826006435cef', null)).toBe('https://mail.google.com/mail/u/0/#all/19e8826006435cef');
  });
});
