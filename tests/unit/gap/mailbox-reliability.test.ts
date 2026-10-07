/**
 * Ops closeout (item 13C/13D): Gmail reads are bounded, and a thread Gmail no
 * longer has is UNKNOWN, never "no reply".
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/email/gmail-sender', async (orig) => ({
  ...(await orig<typeof import('@/lib/email/gmail-sender')>()),
  accessTokenForSender: vi.fn(async () => 'token'),
}));

import { GmailThreadMissingError, getGmailThreadMessages, getMailboxMessage, listSentTo } from '@/lib/email/gmail-inbox';
import { DRAFTED, DRAFT_VANISHED } from '@/lib/gap/execution/draft-ledger';
import { reconcileDraft } from '@/lib/gap/execution/draft-reconcile';
import { findManyFrom } from './fixtures/where';

const SENDER = { userEmail: 'casey@yardflow.ai', serviceAccountJson: '{}' } as never;
afterEach(() => vi.unstubAllGlobals());

describe('13D: a missing Gmail thread', () => {
  it('getGmailThreadMessages throws GmailThreadMissingError on 404 (it used to answer an empty thread)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })));
    await expect(getGmailThreadMessages('t-gone', SENDER)).rejects.toBeInstanceOf(GmailThreadMissingError);
  });

});

describe('13C: Gmail message reads are bounded', () => {
  it('getMailboxMessage passes an abort signal (a hung Gmail read cannot hold the cron)', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ id: 'm1', threadId: 't1', internalDate: '0', snippet: '', labelIds: ['INBOX'], payload: { headers: [{ name: 'From', value: 'a@b.com' }], mimeType: 'text/plain', body: { data: '' } } }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await getMailboxMessage(SENDER, 'm1');
    const init = fetchMock.mock.calls.find((c) => String(c[0]).includes('/messages/m1'))?.[1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('the thread read is bounded too', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ messages: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await getGmailThreadMessages('t1', SENDER);
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  // The follow-up stop reads the message, never the subject alone: the thread read carries each message's snippet.
  it('the thread read carries each message\'s opening text (the snippet), so a reply is classified by what it says', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ messages: [{ id: 'm1', labelIds: ['INBOX'], internalDate: '1759500000000', snippet: 'I am out of the office until Monday.', payload: { headers: [{ name: 'From', value: 'Joey <joey@kroger.example.com>' }, { name: 'Subject', value: 'Re: Doors versus spots' }] } }] }), { status: 200 })));
    expect(await getGmailThreadMessages('t1', SENDER)).toEqual([expect.objectContaining({ id: 'm1', subject: 'Re: Doors versus spots', snippet: 'I am out of the office until Monday.' })]);
  });
});

describe('13D: reconciliation keeps its meaning', () => {
  it('a deleted first-touch draft whose one-message thread went with it follows the vanish path (not stuck gmail_unreadable)', async () => {
    const audit: any[] = [
      { id: 'e1', kind: DRAFTED, subject_type: 'routing_decision', subject_id: 'dec-1', created_at: new Date('2026-09-20T00:00:00Z'), payload: { routingDecisionId: 'dec-1', recipient: 'joey.maggard@kroger.com', personaId: 1886, gmailDraftId: 'r-0', gmailThreadId: 't-0', stepIndex: 0, senderIdentity: 'casey@yardflow.ai', createdAt: '2026-09-20T00:00:00Z' } },
    ];
    const prisma: any = {
      gapAuditEvent: {
        findMany: vi.fn(async (a: any) => findManyFrom(audit, a)),
        create: vi.fn(async ({ data }: any) => { audit.push({ id: `n${audit.length}`, created_at: new Date(), ...data }); return { id: 'x' }; }),
      },
      $executeRaw: vi.fn(async () => 1),
      $transaction: vi.fn(async (fn: any) => fn(prisma)),
    };
    const r = await reconcileDraft(prisma, { decisionId: 'dec-1', gmailDraftId: 'r-0', actor: 'casey', now: new Date('2026-09-27T00:00:00Z') }, {
      gapSender: () => SENDER,
      getDraftState: async () => ({ exists: false }),
      getThread: async () => { throw new GmailThreadMissingError('t-0'); },
    });
    expect(r.ok).toBe(true);
    expect(audit.some((e) => e.kind === DRAFT_VANISHED)).toBe(true);
  });
});

describe('closeout review: the Sent-folder read sees trashed mail too', () => {
  it('listSentTo includes spam and trash (a first touch sent then trashed is still a first touch)', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ messages: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await listSentTo(SENDER, 'joey.maggard@kroger.com', 1, 2);
    const u = new URL(String(fetchMock.mock.calls[0][0]));
    expect(u.searchParams.get('includeSpamTrash')).toBe('true');
    expect(u.searchParams.get('q')).toContain('in:sent to:joey.maggard@kroger.com');
  });
});
