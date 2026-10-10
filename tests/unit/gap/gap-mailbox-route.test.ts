/** Red team T9: GET /api/cron/gap-mailbox (auth, flags, dry run vs apply). */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const poll = vi.fn(async () => ({ since: 1, seen: 2, replies: 1 }));
const list = vi.fn(async () => ({ ids: [] as string[], windowEnd: null }));
const fetchOne = vi.fn(async () => { throw new Error('unexpected fetch'); });
const sender = { value: { userEmail: 'casey@yardflow.ai', serviceAccountJson: '{}' } as null | { userEmail: string; serviceAccountJson: string } };
vi.mock('@/lib/prisma', () => ({ prisma: { systemConfig: { findUnique: vi.fn(async () => null) }, gapAuditEvent: { findMany: vi.fn(async () => []) } } }));
vi.mock('@/lib/cron-monitor', () => ({ markCronStarted: vi.fn(async () => undefined), markCronSkipped: vi.fn(async () => undefined), markCronSuccess: vi.fn(async () => undefined), markCronFailure: vi.fn(async () => undefined) }));
vi.mock('@/lib/gap/execution/gap-sender', () => ({ gapGmailSender: () => sender.value }));
const reconcile = vi.fn(async () => ({ checked: 1, reconciled: 0, stillUnknown: [{ idempotencyKey: 'k', recipient: 'joey.maggard@kroger.com', claimedAt: '2026-09-27T00:00:00.000Z', reason: 'not_in_sent' }] }));
vi.mock('@/lib/email/gmail-inbox', () => ({ listMailboxIds: (...a: unknown[]) => (list as any)(...a), getMailboxMessage: (...a: unknown[]) => (fetchOne as any)(...a), listSentTo: vi.fn() }));
vi.mock('@/lib/gap/execution/unknown-send-reconcile', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/execution/unknown-send-reconcile')>()), reconcileUnknownSends: (...a: unknown[]) => (reconcile as any)(...a) }));
vi.mock('@/lib/gap/replies/gap-mailbox', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/replies/gap-mailbox')>()), pollGapMailbox: (...a: unknown[]) => (poll as any)(...a) }));
const mirrorRetry = vi.fn(async () => ({ tried: 0, mirrored: 0, failed: 0, exhausted: [] as string[] }));
vi.mock('@/lib/gap/disposition/mirror-retry', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/disposition/mirror-retry')>()), retryDispositionMirrors: (...a: unknown[]) => (mirrorRetry as any)(...a) }));

import { GET } from '@/app/api/cron/gap-mailbox/route';
import { markCronFailure, markCronSuccess } from '@/lib/cron-monitor';

const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

beforeEach(() => {
  vi.mocked(markCronFailure).mockClear();
  vi.mocked(markCronSuccess).mockClear();
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
    expect(await res.json()).toMatchObject({ mode: 'apply', mailbox: 'casey@yardflow.ai', replies: 1, unknownSends: { stillUnknown: [{ reason: 'not_in_sent' }] } });
    expect(poll).toHaveBeenCalledTimes(1);
    // Ops closeout 13B: the unknown-outcome send is named in the cron status, not hidden.
    expect(vi.mocked(markCronSuccess).mock.calls[0][1]).toMatchObject({ message: expect.stringContaining('1 unknown-outcome send(s)') });
    expect((poll.mock.calls[0] as any[])[2].mailbox).toBe('casey@yardflow.ai');
    expect(markCronSuccess).toHaveBeenCalledTimes(1);
    expect(markCronFailure).not.toHaveBeenCalled();
  });

  it('R5 review (finding 5a): a disposition that exhausted the HubSpot mirror retries keeps the result from reading ok, and the cron status names it', async () => {
    mirrorRetry.mockResolvedValueOnce({ tried: 0, mirrored: 0, failed: 0, exhausted: ['d1'] });
    const res = await GET(req('http://localhost/api/cron/gap-mailbox/?mode=apply', { authorization: 'Bearer shh' }));
    expect(await res.json()).toMatchObject({ ok: false, mode: 'apply', mirrorRetries: { exhausted: ['d1'] } });
    expect(vi.mocked(markCronSuccess).mock.calls[0][1]).toMatchObject({ message: expect.stringContaining('1 disposition(s) exhausted the HubSpot mirror retries') });
    // A clean pass: no ok:false.
    const clean = await (await GET(req('http://localhost/api/cron/gap-mailbox/?mode=apply', { authorization: 'Bearer shh' }))).json();
    expect(clean.ok).toBeUndefined();
  });

  it('Release C review S2: intake errors mark the cron run FAILED, never a quiet success', async () => {
    poll.mockResolvedValueOnce({ since: 1, seen: 3, replies: 0, errors: ['p1: db timeout'] } as never);
    const res = await GET(req('http://localhost/api/cron/gap-mailbox/?mode=apply', { authorization: 'Bearer shh' }));
    expect(await res.json()).toMatchObject({ ok: false, errors: ['p1: db timeout'] });
    expect(markCronFailure).toHaveBeenCalledTimes(1);
    expect(String((vi.mocked(markCronFailure).mock.calls[0] as any[])[1].error.message)).toContain('p1: db timeout');
    expect(markCronSuccess).not.toHaveBeenCalled();
  });
});
