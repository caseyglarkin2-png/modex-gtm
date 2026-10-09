// @vitest-environment node
/**
 * C47 (the commercial-context audit, 2026-10-08): the same email seen through Gmail and HubSpot is ONE stored
 * message with two provenance links, deduplicated by RFC Message-ID and then by provider ids, never by subject. A
 * retry or an overlapping page adds no row, no bell and no second ingest, and the disposition key stays one.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { matchesWhere } from './fixtures/where';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import { PROVENANCE_LINKED_KIND } from '@/lib/gap/context/thread-context';
import { loadThreadContext } from '@/lib/gap/context/thread-context';

const mockedIngest = vi.fn(async () => ({ ok: true, action: 'none', enrollments: [], itemsStopped: 0, reason: 'not_enrolled' }));
vi.mock('@/lib/gap/replies/ingest', () => ({ ingestReply: mockedIngest }));

const { pollHubSpotReplies, LINKED_TYPE, searchIncomingEmailsFromHubSpot } = await import('@/lib/gap/replies/hubspot-poller');
const { storeInbound } = await import('@/lib/gap/replies/gap-mailbox');

const NOW = new Date('2026-10-08T15:00:00Z');
const DAVE = 'dave.kiesling@kencogroup.com';
const RFC = '<sep16@kencogroup.com>';
const BODY = 'We will keep Open Dock at the ungated locations. Please reconnect toward the end of October during 2027 budgeting.';

/** The poller's prisma surface over the shared ledger fixture: notifications and a transaction on top of ledgerDb. */
function pollerPrisma(d: ReturnType<typeof ledgerDb>) {
  const notifications: Array<Record<string, unknown>> = [];
  const base = d.client();
  const db: Record<string, unknown> = {
    ...base,
    __notifications: notifications,
    persona: { findMany: async () => [{ id: 1, email: DAVE, account_name: 'Kenco Logistics', name: 'Dave Kiesling', hubspot_contact_id: '217664765537' }] },
    notification: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => notifications.find((n) => matchesWhere(n, where)) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        notifications.push({ id: notifications.length + 1, ...data });
        return data;
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(db),
  };
  return db;
}

const engagement = (id: string, rfcMessageId: string | null, subject = 'Re: YardFlow and the 2027 roadmap') => ({ id, fromEmail: DAVE, toEmail: 'casey@yardflow.ai', subject, text: BODY, html: null, timestamp: new Date('2026-09-16T14:00:00Z'), createdAt: new Date('2026-09-16T14:00:10Z'), rfcMessageId });

describe('C47: one email through Gmail and HubSpot is one message', () => {
  it('HubSpot after Gmail: the Gmail row gains the engagement id, no second row, no bell, no second ingest; a retry changes nothing', async () => {
    const d = ledgerDb({ inbound: [{ id: 'g-sep16', thread_id: 't-kenco', rfc_message_id: RFC, from_email: DAVE, from_name: 'Dave Kiesling', subject: 'Re: YardFlow and the 2027 roadmap', body_text: BODY, received_at: new Date('2026-09-16T14:00:00Z'), source: 'gmail', hubspot_engagement_id: null }] }, NOW);
    const prisma = pollerPrisma(d);
    const search = async () => [engagement('7001', RFC)];
    const first = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false, since: new Date('2026-09-01T00:00:00Z') }, { searchIncomingEmails: search });
    expect(first).toMatchObject({ seen: 1, created: 0, existing: 0, merged: 1, unknownSender: 0 });
    expect(d.store.inboundMessage).toHaveLength(1);
    expect(d.store.inboundMessage[0]).toMatchObject({ id: 'g-sep16', hubspot_engagement_id: '7001' });
    const notes = prisma.__notifications as Array<Record<string, unknown>>;
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ type: LINKED_TYPE, source_id: 'hs:7001', read: true });
    expect(LINKED_TYPE).not.toContain('reply');
    expect(mockedIngest).not.toHaveBeenCalled();
    // The retry (an overlapping page) reads the marker and lands nothing.
    const second = await pollHubSpotReplies(pollerPrisma(d), { now: NOW, dryRun: false, since: new Date('2026-09-01T00:00:00Z') }, { searchIncomingEmails: search });
    expect(second).toMatchObject({ seen: 1, created: 0, existing: 0, merged: 1 });
    expect(d.store.inboundMessage).toHaveLength(1);
    expect(d.store.gapAuditEvent).toHaveLength(0);
    // The thread context reads one event with both provenance ids.
    const ctx = await loadThreadContext(d.client(), { threadId: 't-kenco', now: NOW }, { listSent: async () => [] });
    expect(ctx.events.map((e) => e.providerIds)).toEqual([['gmail:g-sep16', 'hubspot:7001', `rfc:${RFC}`]]);
  });

  it('a second engagement for a row already linked to another engagement is a provenance row, not a second message; a dry run counts and writes nothing', async () => {
    const d = ledgerDb({ inbound: [{ id: 'g-sep16', thread_id: 't-kenco', rfc_message_id: RFC, from_email: DAVE, subject: 'x', body_text: BODY, received_at: new Date('2026-09-16T14:00:00Z'), source: 'gmail', hubspot_engagement_id: '7001' }] }, NOW);
    const dry = await pollHubSpotReplies(pollerPrisma(d), { now: NOW, dryRun: true, since: new Date('2026-09-01T00:00:00Z') }, { searchIncomingEmails: async () => [engagement('7002', RFC)] });
    expect(dry).toMatchObject({ merged: 1, created: 0 });
    expect(d.store.gapAuditEvent).toHaveLength(0);
    await pollHubSpotReplies(pollerPrisma(d), { now: NOW, dryRun: false, since: new Date('2026-09-01T00:00:00Z') }, { searchIncomingEmails: async () => [engagement('7002', RFC)] });
    expect(d.store.inboundMessage).toHaveLength(1);
    expect(d.store.gapAuditEvent.map((r) => [r.kind, r.subject_id, r.payload.providerId])).toEqual([[PROVENANCE_LINKED_KIND, 'g-sep16', 'hubspot:7002']]);
  });

  it('a different message with the same subject and no RFC id is still its own row (never a merge by subject)', async () => {
    const d = ledgerDb({ inbound: [{ id: 'g-sep16', thread_id: 't-kenco', rfc_message_id: RFC, from_email: DAVE, subject: 'Re: YardFlow and the 2027 roadmap', body_text: BODY, received_at: new Date('2026-09-16T14:00:00Z'), source: 'gmail', hubspot_engagement_id: null }] }, NOW);
    const report = await pollHubSpotReplies(pollerPrisma(d), { now: NOW, dryRun: false, since: new Date('2026-09-01T00:00:00Z') }, { searchIncomingEmails: async () => [engagement('7003', null), engagement('7004', '<other@kencogroup.com>')] });
    expect(report).toMatchObject({ created: 2 });
    expect(report.merged).toBeUndefined();
    expect(d.store.inboundMessage.map((r) => r.id).sort()).toEqual(['g-sep16', 'hs:7003', 'hs:7004']);
  });

  it('Gmail after HubSpot: the GAP mailbox points the Gmail copy at the HubSpot row and records the Gmail id as its second provenance link, once', async () => {
    const d = ledgerDb({ inbound: [{ id: 'hs:7001', thread_id: 'hs-thread:217664765537', rfc_message_id: RFC, from_email: DAVE, subject: 'Re: YardFlow and the 2027 roadmap', body_text: BODY, received_at: new Date('2026-09-16T14:00:00Z'), source: 'hubspot', hubspot_engagement_id: '7001' }] }, NOW);
    const m = { id: 'g-sep16', threadId: 't-kenco', rfcMessageId: RFC, fromEmail: DAVE, fromName: 'Dave Kiesling', subject: 'Re: YardFlow and the 2027 roadmap', snippet: BODY.slice(0, 80), bodyText: BODY, rawText: BODY, bodyHtml: '', deliveryStatus: null, labelIds: ['INBOX'], receivedAt: new Date('2026-09-16T14:00:00Z'), headers: {} } satisfies MailboxMessage;
    const report = { inboundMessagesCreated: 0 } as Parameters<typeof storeInbound>[2];
    expect(await storeInbound(d.client(), m, report)).toBe('hs:7001');
    expect(await storeInbound(d.client(), m, report)).toBe('hs:7001');
    expect(report.inboundMessagesCreated).toBe(0);
    expect(d.store.inboundMessage).toHaveLength(1);
    expect(d.store.gapAuditEvent.map((r) => [r.kind, r.subject_type, r.subject_id, r.payload.providerId])).toEqual([[PROVENANCE_LINKED_KIND, 'inbound_message', 'hs:7001', 'gmail:g-sep16']]);
    const ctx = await loadThreadContext(d.client(), { email: DAVE, now: NOW }, { listSent: async () => [] });
    expect(ctx.events.map((e) => [e.id, e.providerIds])).toEqual([['hs:7001', ['hubspot:7001', `rfc:${RFC}`, 'gmail:g-sep16']]]);
    // A message with no RFC id and a new Gmail id is stored as its own row.
    expect(await storeInbound(d.client(), { ...m, id: 'g-other', rfcMessageId: null }, report)).toBe('g-other');
    expect(report.inboundMessagesCreated).toBe(1);
  });

  it('the HubSpot search asks for hs_email_message_id and maps it to rfcMessageId', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const client = { crm: { objects: { emails: { searchApi: { doSearch: async (args: Record<string, unknown>) => { calls.push(args); return { results: [{ id: '7001', properties: { hs_timestamp: '2026-09-16T14:00:00.000Z', hs_email_from_email: DAVE, hs_email_message_id: ` ${RFC} ` } }] }; } } } } } };
    const out = await searchIncomingEmailsFromHubSpot({ since: new Date('2026-09-01T00:00:00Z'), limit: 10 }, client as never);
    expect((calls[0].properties as string[]).includes('hs_email_message_id')).toBe(true);
    expect(out[0]).toMatchObject({ id: '7001', rfcMessageId: RFC });
  });
});
