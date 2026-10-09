// @vitest-environment node
/**
 * Knowledge program C1 (2026-10-09): a held meeting or a call is a CONVERSATION and conversations count. The caller
 * sets `conversation` on a StateEvent from the knowledge notes (a vault meeting note, a Fireflies capture whose
 * participants include the person); an accepted calendar RSVP whose meeting has been held counts the same way. Pinned
 * with the Kenco shape: Dave wrote on Sep 16, a meeting was held later on Sep 16: no answer is owed and he is not
 * quiet on Sep 20. A conversation never counts as them writing (lastInboundAt stays what they wrote) and never as a
 * send (lastOutboundAt stays what we sent).
 */
import { describe, expect, it } from 'vitest';
import { peopleState, type StateEvent } from '@/lib/gap/work/people-state';

const DAVE = 'dave.kiesling@kencogroup.com';
const CASEY = 'casey@freightroll.com';
const OWN = new Set([CASEY]);

const inbound = (id: string, at: string, purpose: StateEvent['purpose'] = 'buyer_conversation'): StateEvent => ({ id, at, direction: 'inbound', type: 'email', isDraft: false, from: DAVE, to: [CASEY], purpose });
const sent = (id: string, at: string): StateEvent => ({ id, at, direction: 'outbound', type: 'email', isDraft: false, from: CASEY, to: [DAVE], purpose: 'buyer_conversation' });
const meeting = (id: string, at: string, kind: 'meeting' | 'call' = 'meeting', source = 'vault:40_Meetings/2026-09-16 Kenco.md'): StateEvent => ({ id, at, direction: 'inbound', type: 'meeting', isDraft: false, from: DAVE, to: [CASEY], purpose: null, conversation: { kind, title: 'Kenco discovery', source } });
const rsvp = (id: string, at: string, startsAt: string, kind: 'accepted' | 'cancelled' = 'accepted'): StateEvent => ({ id, at, direction: 'inbound', type: 'calendar', isDraft: false, from: DAVE, to: [CASEY], purpose: 'calendar', calendar: { kind, meetingKey: 'kenco|sep 16', startsAt } });

describe('C1: the Kenco shape', () => {
  const SEP20 = new Date('2026-09-20T15:00:00Z');

  it('a Sep 16 meeting after a Sep 16 inbound: no answer owed, not quiet on Sep 20, the conversation is on the state', () => {
    const s = peopleState([inbound('m-sep16', '2026-09-16T14:00:00Z'), meeting('mt-sep16', '2026-09-16T18:00:00Z')], SEP20, { ownAddresses: OWN }).get(DAVE)!;
    expect(s.lastConversationAt, 'the meeting is the newest conversation').toBe('2026-09-16T18:00:00Z');
    expect(s.answerOwed, 'the meeting after their message answers it').toEqual({ owed: false, since: null, messageId: null, basis: 'they wrote Sep 16 and we met Sep 16 after it' });
    expect(s.quiet, 'quiet counts from the meeting (18:00Z Sep 16 to 15:00Z Sep 20 is 3 whole days)').toEqual({ quiet: false, days: 3, since: '2026-09-16T18:00:00Z', basis: 'last exchange Sep 16 (a meeting), 3 days ago' });
    // The meeting is neither them writing nor a send of ours.
    expect(s.lastInboundAt).toBe('2026-09-16T14:00:00Z');
    expect(s.lastOutboundAt).toBeNull();
  });

  it('the same inbound with no meeting: the answer is owed and the quiet count runs from their message', () => {
    const s = peopleState([inbound('m-sep16', '2026-09-16T14:00:00Z')], SEP20, { ownAddresses: OWN }).get(DAVE)!;
    expect(s.lastConversationAt).toBeNull();
    expect(s.answerOwed).toMatchObject({ owed: true, messageId: 'm-sep16' });
    expect(s.quiet).toMatchObject({ quiet: false, days: 4, basis: 'last exchange Sep 16 (they wrote), 4 days ago' });
  });

  it('a meeting BEFORE their message does not answer it; a call is said as a call; the newest conversation wins', () => {
    const before = peopleState([meeting('mt-sep10', '2026-09-10T18:00:00Z', 'call'), inbound('m-sep16', '2026-09-16T14:00:00Z')], SEP20, { ownAddresses: OWN }).get(DAVE)!;
    expect(before.answerOwed.owed, 'a call before they wrote answers nothing').toBe(true);
    expect(before.lastConversationAt).toBe('2026-09-10T18:00:00Z');
    expect(before.quiet.basis, 'their later message is the last exchange').toBe('last exchange Sep 16 (they wrote), 4 days ago');
    const call = peopleState([inbound('m-sep16', '2026-09-16T14:00:00Z'), meeting('c-sep17', '2026-09-17T18:00:00Z', 'call', 'fireflies:abc')], SEP20, { ownAddresses: OWN }).get(DAVE)!;
    expect(call.answerOwed.basis).toBe('they wrote Sep 16 and we talked Sep 17 after it');
    expect(call.quiet.basis).toBe('last exchange Sep 17 (a call), 2 days ago');
  });

  it('a send after their message keeps the send basis even when a meeting also followed', () => {
    const s = peopleState([inbound('m-sep16', '2026-09-16T14:00:00Z'), meeting('mt', '2026-09-16T18:00:00Z'), sent('s-sep17', '2026-09-17T12:00:00Z')], SEP20, { ownAddresses: OWN }).get(DAVE)!;
    expect(s.answerOwed.basis).toBe('they wrote Sep 16 and we sent Sep 17 after it');
    expect(s.quiet).toMatchObject({ since: '2026-09-17T12:00:00Z', basis: 'last exchange Sep 17 (we wrote), 3 days ago' });
  });
});

describe('C1: the calendar and the quiet threshold', () => {
  const OCT8 = new Date('2026-10-08T15:00:00Z');

  it('an RSVP they accepted whose meeting has been held is a conversation; a cancelled one is not; a future one is a meeting ahead, not a conversation', () => {
    const held = peopleState([inbound('m-sep1', '2026-09-01T14:00:00Z'), rsvp('r1', '2026-09-10T12:00:00Z', '2026-09-16T18:00:00Z')], OCT8, { ownAddresses: OWN }).get(DAVE)!;
    expect(held.lastConversationAt).toBe('2026-09-16T18:00:00Z');
    expect(held.answerOwed.owed, 'the held meeting answered the Sep 1 message').toBe(false);
    expect(held.quiet, 'quiet counts from the meeting: 21 days by Oct 8').toEqual({ quiet: true, days: 21, since: '2026-09-16T18:00:00Z', basis: 'no exchange either way in 21 days (last: Sep 16, a meeting)' });
    const cancelled = peopleState([inbound('m-sep1', '2026-09-01T14:00:00Z'), rsvp('r1', '2026-09-10T12:00:00Z', '2026-09-16T18:00:00Z'), rsvp('r2', '2026-09-12T12:00:00Z', '2026-09-16T18:00:00Z', 'cancelled')], OCT8, { ownAddresses: OWN }).get(DAVE)!;
    expect(cancelled.lastConversationAt, 'a cancelled meeting was not held').toBeNull();
    expect(cancelled.answerOwed.owed).toBe(true);
    const ahead = peopleState([inbound('m-sep1', '2026-09-01T14:00:00Z'), rsvp('r1', '2026-10-02T12:00:00Z', '2026-10-14T18:00:00Z')], OCT8, { ownAddresses: OWN }).get(DAVE)!;
    expect(ahead.lastConversationAt).toBeNull();
    expect(ahead.nextMeetingAt).toBe('2026-10-14T18:00:00Z');
    expect(ahead.answerOwed.owed, 'a meeting ahead answers nothing yet').toBe(true);
  });

  it('a conversation older than the threshold reads quiet from it, not from nothing', () => {
    const s = peopleState([meeting('mt', '2026-09-01T18:00:00Z')], OCT8, { ownAddresses: OWN }).get(DAVE)!;
    expect(s.quiet).toEqual({ quiet: true, days: 36, since: '2026-09-01T18:00:00Z', basis: 'no exchange either way in 36 days (last: Sep 1, a meeting)' });
    expect(s.answerOwed, 'they never wrote').toEqual({ owed: false, since: null, messageId: null, basis: 'they have not written' });
    expect(s.lastInboundAt).toBeNull();
  });
});
