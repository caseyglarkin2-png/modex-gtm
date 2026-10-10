// @vitest-environment node
/**
 * The independent review of October 10 (relationship state): a draft is never evidence that nothing was sent when
 * Sent was not read; the seller's own full name is never a referral; their own next step ("let me check with Dave")
 * is never a referral to us; a lone word that no known person carries is not a referral; a name resolves to the
 * address the correspondence carries; the HubSpot company falls back to the one the deals resolve.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { relationshipStateFor, relationshipStateFrom, type RelationshipEvent, type RelationshipInputs, type RelationshipReads } from '@/lib/gap/work/relationship-state';

const NOW = new Date('2026-10-10T13:00:00Z');
const PHIL = 'philip.savastano@bostonbeer.com';
const reads = (over: Partial<RelationshipReads> = {}): RelationshipReads => ({ inbox: { read: true, count: 1, detail: null }, sent: { read: false, count: 0, detail: 'sent read failed: 503' }, drafts: { read: true, count: 1, detail: null }, engagements: { read: true, count: 2, detail: null }, commitments: { read: true, count: 0 }, deals: { read: true, detail: null }, conversations: { read: true, count: 0 }, ...over });
const ev = (over: Partial<RelationshipEvent> & { id: string; at: string; direction: 'inbound' | 'outbound' }): RelationshipEvent => ({ type: 'email', isDraft: false, from: over.direction === 'inbound' ? PHIL : null, to: over.direction === 'outbound' ? [PHIL] : [], subject: null, excerpt: null, purpose: 'buyer_conversation', threadId: null, source: over.direction === 'inbound' ? "GAP's synced inbox" : 'Gmail Sent', ...over });
const ASK = ev({ id: 'm-ask', at: '2026-06-02T11:44:08.000Z', direction: 'inbound', subject: 'Re: Deck', threadId: '19e8826006435cef', excerpt: 'Can you send the deck?' });
const inputs = (events: RelationshipEvent[], over: Partial<RelationshipInputs> = {}): RelationshipInputs => ({ person: { email: PHIL, name: 'Savastano, Philip' }, accountName: 'The Boston Beer Company', now: NOW, events, engagements: [], commitments: [], deals: [], suppression: { unsubscribed: null, doNotContact: false }, reads: reads(), mailbox: 'casey@yardflow.ai', hubspotContactId: '980', hubspotCompanyId: '55', people: [{ name: 'Cowan, David', email: 'david.cowan@bostonbeer.com' }], othersWritten: [], othersWrote: [{ at: '2026-06-10T14:00:00.000Z', from: 'brian.kellogg@bostonbeer.com', fromName: null, subject: 'Re: Call follow up', source: 'HubSpot (logged email)' }], ...over });

describe('a draft with Sent unread', () => {
  it('is UNKNOWN with the draft named, never UNFULFILLED or "nothing went to them"', () => {
    const s = relationshipStateFrom(inputs([ASK, ev({ id: 'd-1', at: '2026-06-04T10:00:00.000Z', direction: 'outbound', isDraft: true, type: 'draft', subject: 'Re: Deck', threadId: '19e8826006435cef', source: 'Gmail drafts' })]));
    expect(s.requestState).toBe('unknown');
    expect(s.request?.basis).toBe('a draft exists, unsent (Jun 4, 2026, "Re: Deck"); whether anything went to them after their message of Jun 2, 2026 is not known: our Sent was not read (sent read failed: 503)');
    expect(s.request?.basis).not.toMatch(/nothing went to them/);
    expect(s.request?.draft).toEqual({ at: '2026-06-04T10:00:00.000Z', subject: 'Re: Deck' });
    const read = relationshipStateFrom(inputs([ASK, ev({ id: 'd-1', at: '2026-06-04T10:00:00.000Z', direction: 'outbound', isDraft: true, type: 'draft', subject: 'Re: Deck', threadId: '19e8826006435cef', source: 'Gmail drafts' })], { reads: reads({ sent: { read: true, count: 0, detail: null } }) }));
    expect(read.requestState).toBe('unfulfilled');
  });
  it('a request MET and a later referral: the request carries no redirect pointer and the referral still stands on its own (Phil, June 2 and June 3)', () => {
    const s = relationshipStateFrom(inputs([ASK, ev({ id: 'r-1', at: '2026-06-02T15:00:00.000Z', direction: 'outbound', subject: 'Re: Deck', threadId: '19e8826006435cef', source: 'HubSpot (logged email)' }), ev({ id: 'f-1', at: '2026-06-03T12:00:00.000Z', direction: 'inbound', subject: 'FW: Deck', excerpt: 'Hi Casey. Feel free to reach out to Brian Kellog to see if can work timing.' })]));
    expect(s.requestState).toBe('fulfilled');
    expect(s.request?.redirectedTo).toBeNull();
    expect(s.referral).toMatchObject({ name: 'Brian Kellogg', email: 'brian.kellogg@bostonbeer.com' });
  });
});

describe('what is not a referral', () => {
  const say = (excerpt: string) => relationshipStateFrom(inputs([ev({ id: 'x', at: '2026-06-03T12:00:00.000Z', direction: 'inbound', subject: 'Re: Deck', excerpt })]));
  it('the seller by full name, their own next step, a lone unknown word', () => {
    expect(say('Please contact Casey Larkin with the details. Can you send pricing?').referral).toBeNull();
    expect(say('Thanks. Can you send the pricing? Let me check with Dave Cowan and get back to you.').referral).toBeNull();
    expect(say('I will send you a copy Monday.').referral).toBeNull();
    expect(say('I will ask Legal about it.').referral).toBeNull();
    expect(say('Try our new line of products.').referral).toBeNull();
  });
  it('a second-person referral stands, and a name resolves to the address the correspondence carries ("brian.kellogg" is Brian Kellog)', () => {
    const s = say('Hi Casey. Feel free to reach out to Brian Kellog to see if can work timing.');
    expect(s.referral).toMatchObject({ name: 'Brian Kellogg', email: 'brian.kellogg@bostonbeer.com' });
    expect(s.correspondents).toEqual([{ name: null, email: 'brian.kellogg@bostonbeer.com', lastAt: '2026-06-10T14:00:00.000Z' }]);
    const lone = relationshipStateFrom(inputs([ev({ id: 'y', at: '2026-06-03T12:00:00.000Z', direction: 'inbound', subject: 'Re: Deck', excerpt: 'Please loop in David on this.' })]));
    expect(lone.referral).toMatchObject({ name: 'Cowan, David', email: 'david.cowan@bostonbeer.com' });
  });
});

describe('the loader: the HubSpot company falls back to the one the deals resolve; other people\'s logged emails become correspondents', () => {
  it('Kenco with no company on its record: the company comes from companyFor and the engagements are read; a logged email to Dave makes him a correspondent', async () => {
    const db = ledgerDb({ accounts: [{ name: 'Kenco', hubspot_company_id: null }], personas: [] }, NOW).client();
    const engagements = async (companyId: string) => ({ read: true, detail: null, items: companyId === '77' ? [
      { kind: 'email' as const, at: '2026-10-09T14:00:00.000Z', title: '48-minute turns became 24', body: 'Dave,', id: 'e1', from: 'casey@yardflow.ai', to: 'dave.kiesling@kencogroup.com', direction: 'outgoing' as const },
      { kind: 'email' as const, at: '2026-09-24T14:00:00.000Z', title: 'Re: intro', body: 'Hey Casey', id: 'e2', from: 'craig.morrison@kencogroup.com', to: 'casey@yardflow.ai', direction: 'incoming' as const },
    ] : [] });
    const s = await relationshipStateFor(db, { accountName: 'Kenco', email: null, name: null, now: NOW }, { thread: null, engagements, companyFor: async () => '77', commitments: async () => [], conversations: async () => [] });
    expect(s.reads.engagements).toEqual({ read: true, count: 2, detail: 'the company resolved from the deals' });
    expect(s.correspondents).toEqual([{ name: null, email: 'dave.kiesling@kencogroup.com', lastAt: '2026-10-09T14:00:00.000Z' }, { name: null, email: 'craig.morrison@kencogroup.com', lastAt: '2026-09-24T14:00:00.000Z' }]);
    expect(s.links.hubspotCompany).toBe('https://app.hubspot.com/contacts/3819073/record/0-2/77');
    const none = await relationshipStateFor(db, { accountName: 'Kenco', email: null, name: null, now: NOW }, { thread: null, engagements, companyFor: async () => null, commitments: async () => [], conversations: async () => [] });
    expect(none.reads.engagements.detail).toBe('no HubSpot company on the account record and none resolved from the deals');
  });
});
