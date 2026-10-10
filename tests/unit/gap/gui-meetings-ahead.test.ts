// @vitest-environment node
/**
 * The adversarial audit of the October 10 morning: a HubSpot meeting dated after now is NOT a held meeting. The Kenco
 * packet said "Meetings and calls: Oct 14, 2026 meeting ... Next Steps" four days before that meeting. Pinned: a HubSpot
 * meeting or call ahead of now is excluded from `meetings` and is the next meeting (the earliest one ahead) when the
 * people state names none; a calendar meeting ahead from the people state keeps precedence; one dated before now stays
 * a held meeting with its outcome.
 */
import { describe, expect, it } from 'vitest';
import { relationshipStateFrom, type RelationshipEvent, type RelationshipInputs, type RelationshipReads } from '@/lib/gap/work/relationship-state';

const NOW = new Date('2026-10-10T13:00:00Z');
const DAVE = 'dave.kiesling@kencogroup.com';
const reads: RelationshipReads = { inbox: { read: true, count: 1, detail: null }, sent: { read: true, count: 1, detail: null }, drafts: { read: true, count: 0, detail: null }, engagements: { read: true, count: 3, detail: null }, commitments: { read: true, count: 0 }, deals: { read: true, detail: null }, conversations: { read: true, count: 0 } };
const ev = (over: Partial<RelationshipEvent> & { id: string; at: string; direction: 'inbound' | 'outbound' }): RelationshipEvent => ({ type: 'email', isDraft: false, from: over.direction === 'inbound' ? DAVE : null, to: over.direction === 'outbound' ? [DAVE] : [], subject: '48-minute turns became 24', excerpt: null, purpose: 'buyer_conversation', threadId: null, source: over.direction === 'inbound' ? "GAP's synced inbox" : 'Gmail Sent', ...over });
const EMAILS = [ev({ id: 'o-1', at: '2026-10-09T14:00:00.000Z', direction: 'outbound' }), ev({ id: 'i-1', at: '2026-10-09T18:30:00.000Z', direction: 'inbound' })];
const engagements: RelationshipInputs['engagements'] = [
  { kind: 'meeting', at: '2026-07-16T15:00:00.000Z', title: 'Discovery', body: 'Outcome: the yard pain at two sites.', id: 'm-1' },
  { kind: 'meeting', at: '2026-08-05T15:00:00.000Z', title: 'Demo', body: 'Outcome: asked for pricing.', id: 'm-2' },
  { kind: 'meeting', at: '2026-10-20T15:00:00.000Z', title: 'Pilot review', body: '', id: 'm-4' },
  { kind: 'meeting', at: '2026-10-14T15:00:00.000Z', title: 'Next Steps', body: 'Agenda: next steps.', id: 'm-3' },
];
const inputs = (over: Partial<RelationshipInputs> = {}): RelationshipInputs => ({ person: { email: DAVE, name: 'Dave Kiesling' }, accountName: 'Kenco', now: NOW, events: EMAILS, engagements, commitments: [], deals: [], suppression: { unsubscribed: null, doNotContact: false }, reads, mailbox: 'casey@yardflow.ai', hubspotContactId: null, hubspotCompanyId: '77', ...over });

describe('a HubSpot meeting ahead of now is the next meeting, never a held one', () => {
  it('Kenco: Oct 14 "Next Steps" (and Oct 20) are excluded from meetings; the next meeting is Oct 14; Jul 16 and Aug 5 stay held', () => {
    const s = relationshipStateFrom(inputs());
    expect(s.meetings.map((m) => [m.at, m.title, m.source])).toEqual([
      ['2026-08-05T15:00:00.000Z', 'Demo', 'HubSpot'],
      ['2026-07-16T15:00:00.000Z', 'Discovery', 'HubSpot'],
    ]);
    expect(s.meetings.some((m) => m.title === 'Next Steps' || m.title === 'Pilot review')).toBe(false);
    expect(s.nextMeetingAt).toBe('2026-10-14T15:00:00.000Z');
    expect(s.meetings[0].outcome).toBe('Outcome: asked for pricing.');
  });

  it('a HubSpot call ahead is not held either; one dated before now stays a held call', () => {
    const s = relationshipStateFrom(inputs({ engagements: [{ kind: 'call', at: '2026-10-11T15:00:00.000Z', title: 'Scheduled call', body: '', id: 'c-2' }, { kind: 'call', at: '2026-10-09T15:00:00.000Z', title: 'Held call', body: 'Talked dwell.', id: 'c-1' }] }));
    expect(s.meetings.map((m) => [m.at, m.kind, m.title])).toEqual([['2026-10-09T15:00:00.000Z', 'call', 'Held call']]);
    expect(s.nextMeetingAt).toBe('2026-10-11T15:00:00.000Z');
  });

  it('the people state\'s next meeting (an accepted calendar invitation ahead) keeps precedence over a later HubSpot one', () => {
    const accepted = ev({ id: 'cal-1', at: '2026-10-08T10:00:00.000Z', direction: 'inbound', type: 'calendar', purpose: 'calendar', subject: 'Accepted: Site walk', calendar: { kind: 'accepted', meetingKey: 'Site walk|Oct 12', startsAt: '2026-10-12T15:00:00.000Z' } });
    const s = relationshipStateFrom(inputs({ events: [...EMAILS, accepted] }));
    expect(s.nextMeetingAt).toBe('2026-10-12T15:00:00.000Z');
    expect(s.meetings.some((m) => m.title === 'Next Steps')).toBe(false);
  });

  it('with nothing ahead the next meeting stays null and every past HubSpot meeting is held', () => {
    const s = relationshipStateFrom(inputs({ engagements: engagements.slice(0, 2) }));
    expect(s.nextMeetingAt).toBeNull();
    expect(s.meetings).toHaveLength(2);
  });
});
