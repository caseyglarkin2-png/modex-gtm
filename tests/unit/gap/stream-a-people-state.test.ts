// @vitest-environment node
/**
 * C10 (the commercial-context audit, 2026-10-08): answer owed and quietness from both sides of the conversation. A
 * September 24 inbound answered the same day is not answer owed; an October 1 send and a future accepted meeting
 * prevent a went-quiet claim built on the inbound date alone; a draft is never a send; a calendar RSVP and an
 * automatic reply are not them writing.
 */
import { describe, expect, it } from 'vitest';
import { peopleState, type StateEvent } from '@/lib/gap/work/people-state';

const NOW = new Date('2026-10-08T15:00:00Z');
const DAVE = 'dave.kiesling@kencogroup.com';
const CASEY = 'casey@freightroll.com';
const OWN = new Set([CASEY]);

const inbound = (id: string, at: string, purpose: StateEvent['purpose'], extra: Partial<StateEvent> = {}): StateEvent => ({ id, at, direction: 'inbound', type: 'email', isDraft: false, from: DAVE, to: [CASEY], purpose, ...extra });
const sent = (id: string, at: string): StateEvent => ({ id, at, direction: 'outbound', type: 'email', isDraft: false, from: CASEY, to: [DAVE], purpose: 'buyer_conversation' });
const draft = (id: string, at: string): StateEvent => ({ id, at, direction: 'outbound', type: 'draft', isDraft: true, from: CASEY, to: [DAVE], purpose: 'buyer_conversation' });
const accepted = (id: string, at: string, startsAt: string, direction: StateEvent['direction'] = 'inbound'): StateEvent => ({ id, at, direction, type: 'calendar', isDraft: false, from: direction === 'inbound' ? DAVE : CASEY, to: direction === 'inbound' ? [CASEY] : [DAVE], purpose: 'calendar', calendar: { kind: 'accepted', meetingKey: 'yard walk|tue oct 14, 2026 2pm - 3pm (edt)', startsAt } });

describe('C10: answer owed from both sides', () => {
  it('a September 24 inbound answered the same day is not answer owed; unanswered it is, since that day', () => {
    const answered = peopleState([inbound('m-sep24', '2026-09-24T13:00:00Z', 'buyer_conversation'), sent('s-sep24', '2026-09-24T18:30:00Z')], NOW, { ownAddresses: OWN }).get(DAVE)!;
    expect(answered.answerOwed).toEqual({ owed: false, since: null, messageId: null, basis: 'they wrote Sep 24 and we sent Sep 24 after it' });
    expect(answered.lastInboundAt).toBe('2026-09-24T13:00:00Z');
    expect(answered.lastOutboundAt).toBe('2026-09-24T18:30:00Z');
    const unanswered = peopleState([inbound('m-sep24', '2026-09-24T13:00:00Z', 'buyer_conversation')], NOW, { ownAddresses: OWN }).get(DAVE)!;
    expect(unanswered.answerOwed).toEqual({ owed: true, since: '2026-09-24T13:00:00Z', messageId: 'm-sep24', basis: 'they wrote Sep 24; nothing sent since' });
    expect(unanswered.quiet).toEqual({ quiet: true, days: 14, since: '2026-09-24T13:00:00Z', basis: 'no exchange either way in 14 days (last: Sep 24, they wrote)' });
  });

  it('a draft is never a send: the answer stays owed and lastOutboundAt stays what was sent', () => {
    const s = peopleState([sent('s-sep9', '2026-09-09T14:00:00Z'), inbound('m-sep16', '2026-09-16T14:00:00Z', 'buyer_conversation'), draft('d-oct5', '2026-10-05T13:00:00Z')], NOW, { ownAddresses: OWN }).get(DAVE)!;
    expect(s.answerOwed).toMatchObject({ owed: true, messageId: 'm-sep16', basis: 'they wrote Sep 16; our last send was Sep 9, before it' });
    expect(s.lastOutboundAt).toBe('2026-09-09T14:00:00Z');
    expect(s.lastDraftAt).toBe('2026-10-05T13:00:00Z');
  });

  it('a calendar RSVP, an automatic reply and a vendor pitch owe no answer; a support ask does', () => {
    const none = peopleState([accepted('r1', '2026-10-02T12:00:00Z', '2026-10-14T18:00:00Z'), inbound('ooo', '2026-10-03T12:00:00Z', 'automated'), inbound('pitch', '2026-10-04T12:00:00Z', 'vendor_solicitation')], NOW, { ownAddresses: OWN }).get(DAVE)!;
    expect(none.answerOwed).toEqual({ owed: false, since: null, messageId: null, basis: 'nothing of theirs asks for an answer' });
    expect(none.lastInboundAt).toBe('2026-10-04T12:00:00Z');
    expect(peopleState([inbound('sup', '2026-10-06T12:00:00Z', 'customer_support')], NOW, { ownAddresses: OWN }).get(DAVE)!.answerOwed.owed).toBe(true);
    expect(peopleState([], NOW).size).toBe(0);
  });
});

describe('C10: quiet is descriptive and counts both sides and the calendar', () => {
  it('an October 1 send and an accepted October 14 meeting prevent a went-quiet claim built on the September 16 inbound alone', () => {
    const s = peopleState([inbound('m-sep16', '2026-09-16T14:00:00Z', 'buyer_conversation'), sent('s-oct1', '2026-10-01T16:00:00Z'), accepted('r1', '2026-10-02T12:00:00Z', '2026-10-14T18:00:00Z'), draft('d-oct5', '2026-10-05T13:00:00Z')], NOW, { ownAddresses: OWN }).get(DAVE)!;
    expect(s.quiet).toEqual({ quiet: false, days: 6, since: '2026-10-01T16:00:00Z', basis: 'last exchange Oct 1 (we wrote); a meeting is ahead on Oct 14' });
    expect(s.nextMeetingAt).toBe('2026-10-14T18:00:00Z');
    expect(s.answerOwed.owed).toBe(false);
    // The same inbound with no send and no meeting: quiet, 22 days, from the inbound.
    const alone = peopleState([inbound('m-sep16', '2026-09-16T14:00:00Z', 'buyer_conversation')], NOW, { ownAddresses: OWN }).get(DAVE)!;
    expect(alone.quiet).toEqual({ quiet: true, days: 22, since: '2026-09-16T14:00:00Z', basis: 'no exchange either way in 22 days (last: Sep 16, they wrote)' });
    // A meeting we accepted counts; a cancelled meeting does not; a past meeting does not.
    expect(peopleState([inbound('m', '2026-09-16T14:00:00Z', 'buyer_conversation'), accepted('r2', '2026-10-02T12:00:00Z', '2026-10-14T18:00:00Z', 'outbound')], NOW, { ownAddresses: OWN }).get(DAVE)!.nextMeetingAt).toBe('2026-10-14T18:00:00Z');
    const cancelled: StateEvent = { id: 'c', at: '2026-10-03T12:00:00Z', direction: 'inbound', type: 'calendar', isDraft: false, from: DAVE, to: [CASEY], purpose: 'calendar', calendar: { kind: 'cancelled', meetingKey: 'yard walk|tue oct 14, 2026 2pm - 3pm (edt)', startsAt: '2026-10-14T18:00:00Z' } };
    const afterCancel = peopleState([inbound('m', '2026-09-16T14:00:00Z', 'buyer_conversation'), accepted('r1', '2026-10-02T12:00:00Z', '2026-10-14T18:00:00Z'), cancelled], NOW, { ownAddresses: OWN }).get(DAVE)!;
    expect(afterCancel.nextMeetingAt).toBeNull();
    expect(afterCancel.quiet.quiet).toBe(true);
    expect(peopleState([accepted('r0', '2026-09-01T12:00:00Z', '2026-09-10T18:00:00Z')], NOW, { ownAddresses: OWN }).get(DAVE)!).toMatchObject({ nextMeetingAt: null, quiet: { quiet: false, days: null, basis: 'no exchange on record either way' } });
    // Under the threshold is not quiet, said with the days.
    expect(peopleState([sent('s', '2026-10-01T16:00:00Z')], NOW, { ownAddresses: OWN }).get(DAVE)!.quiet).toEqual({ quiet: false, days: 6, since: '2026-10-01T16:00:00Z', basis: 'last exchange Oct 1 (we wrote), 6 days ago' });
    expect(peopleState([sent('s', '2026-10-01T16:00:00Z')], NOW, { ownAddresses: OWN, quietDays: 5 }).get(DAVE)!.quiet.quiet).toBe(true);
  });

  it('outstanding commitments attach to the person whose message they came from, or the person named; resolved ones leave', () => {
    const s = peopleState([inbound('m-sep16', '2026-09-16T14:00:00Z', 'buyer_conversation', { providerIds: ['gmail:m-sep16', 'rfc:<sep16@kencogroup.com>'] })], NOW, {
      ownAddresses: OWN,
      commitments: [
        { id: 'c1', text: 'Reconnect at the end of October', dueAt: '2026-10-28', owner: 'seller', sourceId: 'rfc:<sep16@kencogroup.com>' },
        { id: 'c2', text: 'Send the Nashville numbers', dueAt: null, owner: 'seller', sourceId: 'note-7', person: DAVE },
        { id: 'c3', text: 'Done already', dueAt: null, owner: 'seller', sourceId: 'm-sep16' },
        { id: 'c4', text: 'Somebody else', dueAt: null, owner: 'buyer', sourceId: 'other' },
      ],
      resolvedCommitmentIds: new Set(['c3']),
    }).get(DAVE)!;
    expect(s.commitments.map((c) => c.id)).toEqual(['c1', 'c2']);
  });
});
