// @vitest-environment node
/**
 * C07, C08 and the read side of C47 (the commercial-context audit, 2026-10-08): the bounded thread context over the
 * stored InboundMessage rows and an injected Gmail reader. The Kenco September thread with its quoted history, a
 * HubSpot copy of one of the Gmail messages, two copies of one RSVP, an October 1 send and an October 5 draft.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { buildTimeline, classifyMailType, collapseCalendarResponses, excerptOf, loadThreadContext, mergeProvenance, meetingKeyOf, parseCalendarStart, type OutboundMail, type StoredInbound } from '@/lib/gap/context/thread-context';

const NOW = new Date('2026-10-08T15:00:00Z');
const DAVE = 'dave.kiesling@kencogroup.com';
const CASEY = 'casey@freightroll.com';
const OWN = new Set([CASEY]);

const ROADMAP = 'We will keep Open Dock at the ungated locations and pilot Blue Yonder YMS where the WMS is migrating. Please cancel for now and reconnect toward the end of October during 2027 budgeting.';
const NESTED = `${ROADMAP}\n\nThanks,\nDave\n\nOn Tue, Sep 9, 2026 at 10:12 AM Casey Larkin <${CASEY}> wrote:\n> Dave, we would love to buy you 20 minutes to walk the Nashville yard.\n> On Mon, Sep 8, 2026 Dave Kiesling wrote:\n>> Send me what you have on gate automation.\n`;
const OUTLOOK = `Yes, Thursday works for us.\n\n________________________________\nFrom: Casey Larkin <${CASEY}>\nSent: Monday, September 15, 2026 9:00 AM\nTo: Dave Kiesling\nSubject: Yard walk\n\nDoes Thursday work?`;

const row = (o: Partial<StoredInbound> & Record<string, unknown>): StoredInbound & Record<string, unknown> => ({ id: 'unset', received_at: NOW, thread_id: 't-kenco', from_email: DAVE, from_name: 'Dave Kiesling', subject: 'Re: YardFlow and the 2027 roadmap', snippet: null, body_text: null, source: 'gmail', rfc_message_id: null, hubspot_engagement_id: null, thread: { account_name: 'Kenco Logistics' }, ...o });
const RSVP = 'Accepted: Yard walk @ Tue Oct 14, 2026 2pm - 3pm (EDT) (casey@freightroll.com)';

function world(extra: Array<Record<string, unknown>> = []) {
  return ledgerDb({
    threads: [{ id: 't-kenco', account_name: 'Kenco Logistics', subject: 'Re: YardFlow and the 2027 roadmap' }],
    inbound: [
      row({ id: 'g-sep16', rfc_message_id: '<sep16@kencogroup.com>', body_text: NESTED, received_at: new Date('2026-09-16T14:00:00Z') }),
      row({ id: 'hs:7001', source: 'hubspot', hubspot_engagement_id: '7001', rfc_message_id: '<sep16@kencogroup.com>', body_text: NESTED, received_at: new Date('2026-09-16T14:00:05Z') }),
      row({ id: 'hs:7002', source: 'hubspot', hubspot_engagement_id: '7002', rfc_message_id: '<sep15b@kencogroup.com>', body_text: OUTLOOK, subject: 'RE: Yard walk', received_at: new Date('2026-09-15T15:00:00Z') }),
      row({ id: 'g-rsvp1', rfc_message_id: '<rsvp1@google.com>', subject: RSVP, snippet: 'Dave Kiesling has accepted this invitation.', received_at: new Date('2026-10-02T12:00:00Z') }),
      row({ id: 'g-rsvp2', rfc_message_id: '<rsvp2@google.com>', subject: RSVP, snippet: 'Dave Kiesling has accepted this invitation.', received_at: new Date('2026-10-02T12:00:03Z') }),
      ...extra,
    ],
  }, NOW);
}

const sent: OutboundMail[] = [{ id: 'g-oct1', threadId: 't-kenco', internalDate: new Date('2026-10-01T16:00:00Z'), to: `Dave Kiesling <${DAVE}>`, subject: 'Re: YardFlow and the 2027 roadmap', text: 'Understood on October. I will reconnect the last week of the month.' }];
const drafts: OutboundMail[] = [{ id: 'g-draft-oct5', threadId: 't-kenco', internalDate: new Date('2026-10-05T13:00:00Z'), to: DAVE, subject: 'Re: YardFlow and the 2027 roadmap', text: 'Dave, ahead of budgeting: three numbers from the Nashville walk.' }];

describe('C07: the author\'s own text, bounded, with the quoted history cut', () => {
  it('a nested September thread keeps Dave\'s words; our quoted "we would love to buy" and his earlier quoted ask are not buyer statements', () => {
    const e = excerptOf(NESTED);
    expect(e.excerpt).toBe(`${ROADMAP}\n\nThanks,\nDave`);
    expect(e.quotedBelow).toBe(true);
    expect(e.excerpt).not.toMatch(/love to buy|gate automation/);
    expect(excerptOf(OUTLOOK)).toEqual({ excerpt: 'Yes, Thursday works for us.', quotedBelow: true });
    expect(excerptOf('> what you sent\n> earlier\n\nFine by me.')).toEqual({ excerpt: 'Fine by me.', quotedBelow: true });
    expect(excerptOf(null, 'a snippet only')).toEqual({ excerpt: 'a snippet only', quotedBelow: false });
    expect(excerptOf('x'.repeat(2000)).excerpt).toHaveLength(1503);
  });

  it('the stored read: events, participants, and coverage that says complete only when nothing was cut and Sent was read', async () => {
    const w = world();
    const ctx = await loadThreadContext(w.client(), { email: DAVE, now: NOW }, { ownAddresses: OWN, listSent: async () => sent, listDrafts: async () => drafts });
    expect(ctx.participants).toEqual([DAVE]);
    expect(ctx.coverage.map((c) => [c.source, c.completeness, c.reachable, c.omittedReason])).toEqual([
      ['gmail', 'complete', true, null],
      ['hubspot_engagement', 'complete', true, null],
    ]);
    expect(ctx.coverage[0].query).toMatch(/^stored inbound for address dave\.kiesling@kencogroup\.com, newest 50; sent to dave\.kiesling@kencogroup\.com over 120 days$/);
    expect(ctx.coverage[0].watermark).toBe('2026-10-05T13:00:00.000Z');
    const sep16 = ctx.events.find((e) => e.id === 'g-sep16')!;
    expect(sep16.excerpt).toBe(`${ROADMAP}\n\nThanks,\nDave`);
    expect(sep16.quotedBelow).toBe(true);
    expect(sep16).toMatchObject({ direction: 'inbound', type: 'email', provider: 'gmail', threadId: 't-kenco', from: DAVE });
  });

  it('a truncated read reports partial with the cut; an unreadable store reports unknown and no events, never no activity', async () => {
    const w = world();
    const cut = await loadThreadContext(w.client(), { email: DAVE, now: NOW, limit: 2 }, { ownAddresses: OWN, listSent: async () => [] });
    expect(cut.events.length).toBeLessThanOrEqual(2);
    expect(cut.coverage[0]).toMatchObject({ completeness: 'partial', omittedReason: 'read cut at 2 newest rows' });
    expect(cut.coverage[1]).toMatchObject({ completeness: 'partial' });
    const broken = await loadThreadContext({ inboundMessage: { findMany: async () => { throw new Error('ECONNRESET'); } } }, { email: DAVE, now: NOW }, { listSent: async () => sent });
    expect(broken.events).toEqual([]);
    expect(broken.coverage.map((c) => [c.source, c.reachable, c.completeness, c.omittedReason])).toEqual([['gmail', false, 'unknown', 'ECONNRESET'], ['hubspot_engagement', false, 'unknown', 'ECONNRESET']]);
    const noSender = await loadThreadContext(w.client(), { threadId: 't-kenco', now: NOW });
    expect(noSender.coverage[0]).toMatchObject({ completeness: 'partial', omittedReason: 'sent not read: no Gmail reader given' });
    expect(noSender.events.every((e) => e.direction === 'inbound')).toBe(true);
    const failing = await loadThreadContext(w.client(), { accountName: 'Kenco Logistics', now: NOW }, { listSent: async () => { throw new Error('401'); } });
    expect(failing.coverage[0]).toMatchObject({ completeness: 'partial', omittedReason: `sent read failed for ${DAVE}: 401` });
    expect(failing.events.length).toBeGreaterThan(0);
  });
});

describe('C08: draft, sent, received and calendar mail', () => {
  it('a draft is never a contact; the October 1 send is outbound email; two RSVP copies are one accepted calendar event with both provider ids', async () => {
    const w = world();
    const ctx = await loadThreadContext(w.client(), { email: DAVE, now: NOW }, { ownAddresses: OWN, listSent: async () => sent, listDrafts: async () => drafts });
    const draft = ctx.events.find((e) => e.id === 'g-draft-oct5')!;
    expect(draft).toMatchObject({ type: 'draft', isDraft: true, direction: 'outbound', from: CASEY, to: [DAVE], at: '2026-10-05T13:00:00.000Z' });
    const oct1 = ctx.events.find((e) => e.id === 'g-oct1')!;
    expect(oct1).toMatchObject({ type: 'email', isDraft: false, direction: 'outbound', to: [DAVE], providerIds: ['gmail:g-oct1'] });
    const rsvps = ctx.events.filter((e) => e.type === 'calendar');
    expect(rsvps).toHaveLength(1);
    expect(rsvps[0]).toMatchObject({ id: 'g-rsvp1', direction: 'inbound', calendar: { kind: 'accepted', meetingKey: 'yard walk|tue oct 14, 2026 2pm - 3pm (edt)', startsAt: '2026-10-14T18:00:00.000Z' } });
    expect(rsvps[0].providerIds).toEqual(['gmail:g-rsvp1', 'rfc:<rsvp1@google.com>', 'gmail:g-rsvp2', 'rfc:<rsvp2@google.com>']);
    expect(ctx.events.map((e) => e.id)).toEqual(['hs:7002', 'g-sep16', 'g-oct1', 'g-rsvp1', 'g-draft-oct5']);
  });

  it('calendar typing: invitation, update, declined, tentative, cancelled; a plain subject is email; a draft stays a draft whatever its subject', () => {
    expect(classifyMailType({ subject: 'Invitation: Yard walk @ Tue Oct 14, 2026 2pm - 3pm (EDT) (dave@kencogroup.com)', from: 'calendar-notification@google.com' }).calendar?.kind).toBe('invitation');
    expect(classifyMailType({ subject: 'Updated invitation: Yard walk @ Wed Oct 15, 2026 2pm - 3pm (EDT)', from: DAVE }).calendar?.kind).toBe('update');
    expect(classifyMailType({ subject: 'Declined: Yard walk @ Tue Oct 14, 2026 2pm - 3pm (EDT)', from: DAVE }).calendar?.kind).toBe('declined');
    expect(classifyMailType({ subject: 'Tentatively accepted: Yard walk', from: DAVE }).calendar?.kind).toBe('tentative');
    expect(classifyMailType({ subject: 'Canceled event: Yard walk @ Tue Oct 14, 2026', from: DAVE }).calendar?.kind).toBe('cancelled');
    expect(classifyMailType({ subject: 'Hearing notice', from: 'x@y.com', headers: { 'Content-Type': 'text/calendar; method=REQUEST' } }).type).toBe('calendar');
    expect(classifyMailType({ subject: 'Re: YardFlow and the 2027 roadmap', from: DAVE })).toEqual({ type: 'email', isDraft: false, calendar: null });
    expect(classifyMailType({ subject: 'Accepted: Yard walk', from: CASEY, isDraft: true })).toEqual({ type: 'draft', isDraft: true, calendar: null });
    expect(meetingKeyOf('Accepted: Yard walk @ Tue Oct 14, 2026 2pm - 3pm (EDT) (casey@freightroll.com)')).toEqual({ meetingKey: 'yard walk|tue oct 14, 2026 2pm - 3pm (edt)', startsAt: '2026-10-14T18:00:00.000Z' });
    expect(parseCalendarStart('Fri Nov 6, 2026 9:30am - 10am (PST)')).toBe('2026-11-06T17:30:00.000Z');
    expect(parseCalendarStart('sometime next week')).toBeNull();
  });

  it('collapse keys on sender, answer and meeting: a decline after an accept stays its own event; another meeting stays its own', () => {
    const base = buildTimeline([
      row({ id: 'a', subject: RSVP, received_at: new Date('2026-10-02T12:00:00Z') }),
      row({ id: 'b', subject: RSVP.replace('Accepted', 'Declined'), received_at: new Date('2026-10-03T12:00:00Z') }),
      row({ id: 'c', subject: RSVP.replace('Yard walk', 'Budget review'), received_at: new Date('2026-10-03T13:00:00Z') }),
      row({ id: 'd', subject: RSVP, received_at: new Date('2026-10-02T12:00:09Z') }),
    ], []);
    expect(collapseCalendarResponses(base).map((e) => [e.id, e.calendar?.kind, e.providerIds.length])).toEqual([['a', 'accepted', 2], ['b', 'declined', 1], ['c', 'accepted', 1]]);
  });
});

describe('C47 (read side): one email through Gmail and HubSpot is one event with two provenance links', () => {
  it('merges by RFC Message-ID, then by a shared provider id; never by subject', async () => {
    const w = world();
    const ctx = await loadThreadContext(w.client(), { threadId: 't-kenco', now: NOW }, { listSent: async () => [] });
    const sep16 = ctx.events.filter((e) => e.providerIds.includes('rfc:<sep16@kencogroup.com>'));
    expect(sep16).toHaveLength(1);
    expect(sep16[0]).toMatchObject({ id: 'g-sep16', provider: 'gmail', at: '2026-09-16T14:00:00.000Z' });
    expect(sep16[0].providerIds).toEqual(['gmail:g-sep16', 'rfc:<sep16@kencogroup.com>', 'hubspot:7001']);
    // Same subject, different message: two events.
    const sameSubject = ctx.events.filter((e) => e.subject === 'Re: YardFlow and the 2027 roadmap');
    expect(sameSubject.map((e) => e.id)).toEqual(['g-sep16']);
    expect(ctx.events.find((e) => e.id === 'hs:7002')).toMatchObject({ provider: 'hubspot', excerpt: 'Yes, Thursday works for us.', providerIds: ['hubspot:7002', 'rfc:<sep15b@kencogroup.com>'] });
    // A gmail row that already carries the engagement id (the poller linked it) shares a provider id with the HubSpot row.
    const merged = mergeProvenance(buildTimeline([row({ id: 'g-x', hubspot_engagement_id: '9', received_at: new Date('2026-09-01T00:00:00Z') }), row({ id: 'hs:9', source: 'hubspot', hubspot_engagement_id: '9', received_at: new Date('2026-09-01T00:00:01Z') })], []));
    expect(merged.map((e) => [e.id, e.providerIds])).toEqual([['g-x', ['gmail:g-x', 'hubspot:9']]]);
    // A provenance link row recorded by the GAP mailbox adds the Gmail id to a HubSpot-stored event.
    const w2 = world();
    w2.store.gapAuditEvent.push({ id: 'ev1', kind: 'inbound.provenance_linked', subject_type: 'inbound_message', subject_id: 'hs:7002', actor: 'cron:gap-mailbox', payload: { providerId: 'gmail:g-sep15b' }, created_at: NOW });
    const ctx2 = await loadThreadContext(w2.client(), { threadId: 't-kenco', now: NOW }, { listSent: async () => [] });
    expect(ctx2.events.find((e) => e.id === 'hs:7002')?.providerIds).toEqual(['hubspot:7002', 'rfc:<sep15b@kencogroup.com>', 'gmail:g-sep15b']);
  });
});
