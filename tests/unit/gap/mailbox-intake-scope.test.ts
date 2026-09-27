/**
 * Release C review (RevOps) S1 and S7.
 *
 * S1: Gmail lists a mailbox newest first. A window holding more mail than one
 * run reads must drain OLDEST first, or the oldest messages (the ones most
 * likely to be a reply to a GAP send) are skipped as the watermark passes them.
 *
 * S7: a hard bounce is about ONE send. It marks that send's EmailLog rows
 * bounced, never the address's whole history.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/email/gmail-sender', async (orig) => ({
  ...(await orig<typeof import('@/lib/email/gmail-sender')>()),
  accessTokenForSender: vi.fn(async () => 'tok'),
}));

import { listMailboxMessages, MAILBOX_LIST_CAP } from '@/lib/email/gmail-inbox';
import { recordHardBounce } from '@/lib/email/bounce';

const SENDER = { userEmail: 'casey@yardflow.ai', serviceAccountJson: '{}' } as never;

/** Gmail's list: newest first. id n was received at minute n. */
function gmailFetch(total: number) {
  return vi.fn(async (url: string) => {
    const u = new URL(url);
    if (u.pathname.endsWith('/messages')) {
      const size = Number(u.searchParams.get('maxResults'));
      const start = Number(u.searchParams.get('pageToken') ?? '0');
      const ids = Array.from({ length: Math.min(size, total - start) }, (_, i) => ({ id: String(total - 1 - (start + i)) }));
      const next = start + ids.length < total ? String(start + ids.length) : undefined;
      return new Response(JSON.stringify({ messages: ids, nextPageToken: next }), { status: 200 });
    }
    const id = u.pathname.split('/').pop()!;
    return new Response(
      JSON.stringify({ id, threadId: `t${id}`, internalDate: String(Date.UTC(2026, 8, 27, 0, Number(id))), snippet: '', labelIds: ['INBOX'], payload: { headers: [{ name: 'From', value: 'a@b.com' }, { name: 'Subject', value: 's' }], mimeType: 'text/plain', body: { data: '' } } }),
      { status: 200 },
    );
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('S1: the lister drains a backlog oldest first', () => {
  it('with 450 messages in the window and max 200, it returns the OLDEST 200, oldest first', async () => {
    vi.stubGlobal('fetch', gmailFetch(450));
    const out = await listMailboxMessages(SENDER, 0, 200);
    expect(out.map((m) => m.id)).toEqual(Array.from({ length: 200 }, (_, i) => String(i)));
    expect(out.truncated).toBeUndefined();
  });

  it('a window under max returns every message, oldest first', async () => {
    vi.stubGlobal('fetch', gmailFetch(3));
    expect((await listMailboxMessages(SENDER, 0, 200)).map((m) => m.id)).toEqual(['0', '1', '2']);
  });

  it('a window past the listing cap is flagged truncated', async () => {
    vi.stubGlobal('fetch', gmailFetch(MAILBOX_LIST_CAP + 10));
    const out = await listMailboxMessages(SENDER, 0, 5);
    expect(out.truncated).toBe(true);
  });
});

describe('S7: a hard bounce rewrites only the bounced send', () => {
  function db() {
    const logs = [
      { id: 1, to_email: 'x@kroger.com', thread_id: 'thr-gap', hubspot_engagement_id: null, status: 'sent' },
      { id: 2, to_email: 'x@kroger.com', thread_id: 'thr-2025', hubspot_engagement_id: 'eng-old', status: 'opened' },
      { id: 3, to_email: 'x@kroger.com', thread_id: null, hubspot_engagement_id: 'eng-9', status: 'sent' },
    ];
    const updateMany = vi.fn(async ({ where, data }: any) => {
      const hit = logs.filter(
        (l) =>
          (where.hubspot_engagement_id === undefined || l.hubspot_engagement_id === where.hubspot_engagement_id) &&
          (where.thread_id === undefined || where.thread_id.in.includes(l.thread_id)) &&
          (where.to_email === undefined || l.to_email === where.to_email.equals) &&
          l.status !== where.status.not,
      );
      hit.forEach((l) => Object.assign(l, data));
      return { count: hit.length };
    });
    const prisma = {
      persona: { updateMany: vi.fn(async () => ({ count: 1 })) },
      emailLog: { updateMany },
      notification: { findFirst: vi.fn(async () => null), create: vi.fn(async () => ({})) },
    };
    return { logs, prisma, updateMany };
  }

  it('a DSN scoped to the GAP thread marks that send only', async () => {
    const { logs, prisma } = db();
    const r = await recordHardBounce(prisma, { email: 'x@kroger.com', source: 'gap_mailbox_dsn', sourceId: 'm1', emailLogScope: { threadIds: ['thr-gap'] } });
    expect(r.emailLogUpdated).toBe(1);
    expect(logs.map((l) => l.status)).toEqual(['bounced', 'opened', 'sent']);
  });

  it('the webhook scoped to its engagement marks that engagement only', async () => {
    const { logs, prisma } = db();
    await recordHardBounce(prisma, { email: 'x@kroger.com', source: 'hubspot_webhook', sourceId: 'e1', emailLogScope: { engagementId: 'eng-9' } });
    expect(logs.map((l) => l.status)).toEqual(['sent', 'opened', 'bounced']);
  });

  it('with no scope no EmailLog row moves; the person is still marked', async () => {
    const { logs, prisma, updateMany } = db();
    const r = await recordHardBounce(prisma, { email: 'x@kroger.com', source: 'gap_mailbox_dsn', sourceId: 'm2' });
    expect(updateMany).not.toHaveBeenCalled();
    expect(r).toMatchObject({ emailLogUpdated: 0, personaUpdated: 1 });
    expect(logs.map((l) => l.status)).toEqual(['sent', 'opened', 'sent']);
  });
});
