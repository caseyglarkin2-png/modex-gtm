/** Red team T9: GET /api/cron/gap-mailbox (auth, flags, dry run vs apply). */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const poll = vi.fn(async () => ({ since: 1, seen: 2, replies: 1 }));
const list = vi.fn(async () => [] as unknown[]);
const sender = { value: { userEmail: 'casey@yardflow.ai', serviceAccountJson: '{}' } as null | { userEmail: string; serviceAccountJson: string } };
vi.mock('@/lib/prisma', () => ({ prisma: { systemConfig: { findUnique: vi.fn(async () => null) }, gapAuditEvent: { findMany: vi.fn(async () => []) } } }));
vi.mock('@/lib/cron-monitor', () => ({ markCronStarted: vi.fn(async () => undefined), markCronSkipped: vi.fn(async () => undefined), markCronSuccess: vi.fn(async () => undefined), markCronFailure: vi.fn(async () => undefined) }));
vi.mock('@/lib/gap/execution/gap-sender', () => ({ gapGmailSender: () => sender.value }));
vi.mock('@/lib/email/gmail-inbox', () => ({ listMailboxMessages: (...a: unknown[]) => (list as any)(...a) }));
vi.mock('@/lib/gap/replies/gap-mailbox', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/replies/gap-mailbox')>()), pollGapMailbox: (...a: unknown[]) => (poll as any)(...a) }));

import { GET } from '@/app/api/cron/gap-mailbox/route';

const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

beforeEach(() => {
  poll.mockClear();
  list.mockClear();
  sender.value = { userEmail: 'casey@yardflow.ai', serviceAccountJson: '{}' };
  process.env.CRON_SECRET = 'shh';
  process.env.GAP_OS_ENABLED = 'true';
});

describe('GET /api/cron/gap-mailbox', () => {
  it('refuses without the cron secret', async () => {
    expect((await GET(req('http://localhost/api/cron/gap-mailbox/?mode=apply'))).status).toBe(401);
    expect(poll).not.toHaveBeenCalled();
  });

  it('skips (200) with GAP off, never reads the mailbox', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await GET(req('http://localhost/api/cron/gap-mailbox/?mode=apply', { authorization: 'Bearer shh' }));
    expect(res.status).toBe(200);
    expect(list).not.toHaveBeenCalled();
    expect(poll).not.toHaveBeenCalled();
  });

  it('an unconfigured GAP mailbox is a named skip, not a silent success', async () => {
    sender.value = null;
    const res = await GET(req('http://localhost/api/cron/gap-mailbox/?mode=apply', { authorization: 'Bearer shh' }));
    expect(await res.json()).toEqual({ skipped: true, reason: 'gap_mailbox_not_configured' });
  });

  it('without ?mode=apply it is a dry run: it reads and classifies, and writes nothing', async () => {
    const res = await GET(req('http://localhost/api/cron/gap-mailbox/', { authorization: 'Bearer shh' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ mode: 'dryrun', seen: 0 });
    expect(list).toHaveBeenCalledTimes(1);
    expect(poll).not.toHaveBeenCalled();
  });

  it('?mode=apply runs the intake against the GAP mailbox', async () => {
    const res = await GET(req('http://localhost/api/cron/gap-mailbox/?mode=apply', { authorization: 'Bearer shh' }));
    expect(await res.json()).toMatchObject({ mode: 'apply', mailbox: 'casey@yardflow.ai', replies: 1 });
    expect(poll).toHaveBeenCalledTimes(1);
    expect((poll.mock.calls[0] as any[])[2].mailbox).toBe('casey@yardflow.ai');
  });
});
