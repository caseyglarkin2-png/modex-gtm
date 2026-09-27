/**
 * Release C review (RevOps) S1 and S7.
 *
 * S1 (re-review B1/S1): Gmail lists a mailbox newest first. The lister must
 * return one COMPLETE window, oldest first, narrowing its upper bound rather
 * than silently dropping the oldest ids past the listing cap.
 *
 * S7: a hard bounce is about ONE send. It marks that send's EmailLog rows
 * bounced, never the address's whole history.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/email/gmail-sender', async (orig) => ({
  ...(await orig<typeof import('@/lib/email/gmail-sender')>()),
  accessTokenForSender: vi.fn(async () => 'tok'),
}));

import { getMailboxMessage, listMailboxIds, MAILBOX_LIST_CAP } from '@/lib/email/gmail-inbox';
import { recordHardBounce } from '@/lib/email/bounce';

const SENDER = { userEmail: 'casey@yardflow.ai', serviceAccountJson: '{}' } as never;

/** Gmail's list over `after:` / `before:` (epoch seconds): newest first. id n was received at BASE + 60n seconds. */
const BASE = Math.floor(Date.UTC(2026, 8, 27) / 1000);
function gmailFetch(total: number) {
  return vi.fn(async (url: string) => {
    const u = new URL(url);
    if (u.pathname.endsWith('/messages')) {
      const q = u.searchParams.get('q') ?? '';
      const after = Number(/after:(\d+)/.exec(q)?.[1] ?? '0');
      const before = Number(/before:(\d+)/.exec(q)?.[1] ?? String(Number.MAX_SAFE_INTEGER));
      const all = Array.from({ length: total }, (_, n) => n).filter((n) => BASE + 60 * n > after && BASE + 60 * n < before).reverse();
      const size = Number(u.searchParams.get('maxResults'));
      const start = Number(u.searchParams.get('pageToken') ?? '0');
      const page = all.slice(start, start + size).map((n) => ({ id: String(n) }));
      const next = start + page.length < all.length ? String(start + page.length) : undefined;
      return new Response(JSON.stringify({ messages: page, nextPageToken: next }), { status: 200 });
    }
    const id = u.pathname.split('/').pop()!;
    return new Response(
      JSON.stringify({ id, threadId: `t${id}`, internalDate: String((BASE + 60 * Number(id)) * 1000), snippet: '', labelIds: ['INBOX'], payload: { headers: [{ name: 'From', value: 'a@b.com' }, { name: 'Subject', value: 's' }], mimeType: 'text/plain', body: { data: '' } } }),
      { status: 200 },
    );
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('re-review B1/S1: the lister returns one COMPLETE window, oldest first', () => {
  it('a window under the cap: every id, oldest first, running to now', async () => {
    vi.stubGlobal('fetch', gmailFetch(450));
    const out = await listMailboxIds(SENDER, BASE - 1, BASE + 60 * 1000);
    expect(out.windowEnd).toBeNull();
    expect(out.ids).toEqual(Array.from({ length: 450 }, (_, i) => String(i)));
  });

  it('past the listing cap it narrows the upper bound: the OLDEST mail is never dropped', async () => {
    const total = MAILBOX_LIST_CAP + 10;
    vi.stubGlobal('fetch', gmailFetch(total));
    const out = await listMailboxIds(SENDER, BASE - 1, BASE + 60 * total);
    expect(out.windowEnd).not.toBeNull();
    expect(out.ids[0]).toBe('0');
    expect(out.ids.length).toBeLessThanOrEqual(MAILBOX_LIST_CAP);
    // Complete: every message received before windowEnd is listed, in order.
    const expected = Array.from({ length: total }, (_, n) => n).filter((n) => BASE + 60 * n < out.windowEnd!).map(String);
    expect(out.ids).toEqual(expected);
  });

  it('getMailboxMessage reads one message in full', async () => {
    vi.stubGlobal('fetch', gmailFetch(3));
    const m = await getMailboxMessage(SENDER, '2');
    expect(m).toMatchObject({ id: '2', threadId: 't2', fromEmail: 'a@b.com' });
    expect(m.receivedAt.getTime()).toBe((BASE + 120) * 1000);
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
