/**
 * X05b (GAP OS sales execution engine, 2026-10-08): the briefing cron route. Thin by design: auth, the flags, the GAP
 * mailbox, then src/lib/gap/work/briefing-send.ts decides. Pinned: 401 without the cron secret; a flag off answers the
 * skip payload and reads nothing; an unconfigured GAP mailbox is a skip in words; a skipped result marks the cron
 * skipped with the reason; a sent result marks success; the send goes through sendViaGmail (never sendEmail).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  send: vi.fn(),
  settings: vi.fn(),
  started: vi.fn(async () => undefined),
  success: vi.fn(async () => undefined),
  skipped: vi.fn(async () => undefined),
  failure: vi.fn(async () => undefined),
  sendViaGmail: vi.fn(),
  loadWorkDay: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'route-prisma' } }));
vi.mock('@/lib/cron-monitor', () => ({ markCronStarted: h.started, markCronSuccess: h.success, markCronSkipped: h.skipped, markCronFailure: h.failure }));
vi.mock('@/lib/gap/work/briefing-send', () => ({ sendMorningBriefing: h.send }));
vi.mock('@/lib/gap/work/settings', () => ({ loadSellerSettings: h.settings }));
vi.mock('@/lib/gap/work/load-day', () => ({ loadWorkDay: h.loadWorkDay }));
vi.mock('@/lib/email/gmail-sender', () => ({ sendViaGmail: h.sendViaGmail }));
vi.mock('@/lib/email/gmail-inbox', () => ({ listSentTo: vi.fn(async () => []) }));

const { GET } = await import('@/app/api/cron/gap-briefing/route');
const req = (auth = true) => new Request('http://localhost/api/cron/gap-briefing', { headers: auth ? { authorization: 'Bearer s' } : {} });

describe('X05b: the briefing cron route', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 's';
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    process.env.GAP_BRIEFING_ENABLED = 'true';
    process.env.GAP_GMAIL_USER_EMAIL = 'casey@yardflow.ai';
    process.env.GAP_GOOGLE_REFRESH_TOKEN = 'rt';
    h.send.mockReset();
    h.settings.mockReset();
    h.settings.mockResolvedValue({ briefingTo: 'casey@freightroll.com', briefingHourNy: 7, commandSenders: [], mode: 'prepare', targets: {} });
    h.skipped.mockClear();
    h.success.mockClear();
    h.failure.mockClear();
  });

  it('401 without the secret; the flag off skips and reads no settings', async () => {
    expect((await GET(req(false))).status).toBe(401);
    process.env.GAP_BRIEFING_ENABLED = 'false';
    expect(await (await GET(req())).json()).toEqual({ skipped: true, reason: 'GAP_BRIEFING_ENABLED=false' });
    expect(h.settings).not.toHaveBeenCalled();
    expect(h.send).not.toHaveBeenCalled();
  });

  it('an unconfigured GAP mailbox is a skip in words', async () => {
    delete process.env.GAP_GMAIL_USER_EMAIL;
    expect(await (await GET(req())).json()).toEqual({ skipped: true, reason: 'gap_mailbox_not_configured' });
    expect(h.send).not.toHaveBeenCalled();
  });

  it('a skipped result marks the cron skipped with the reason; a sent result marks success; the wire is sendViaGmail with the GAP sender', async () => {
    h.send.mockResolvedValue({ skipped: true, reason: 'before_hour', day: '2026-10-08', hourNy: 5 });
    expect(await (await GET(req())).json()).toMatchObject({ skipped: true, reason: 'before_hour' });
    expect(h.skipped).toHaveBeenCalledWith('gap-briefing', expect.objectContaining({ reason: 'before_hour' }));
    h.send.mockResolvedValue({ sent: true, day: '2026-10-08', to: 'casey@freightroll.com', gmailMessageId: 'g', gmailThreadId: 't', items: 3, recoveredFromSent: false });
    const res = await GET(req());
    expect(await res.json()).toMatchObject({ sent: true, items: 3 });
    expect(h.success).toHaveBeenCalledTimes(1);
    const [, input, deps] = h.send.mock.calls[1];
    expect(input.sender).toMatchObject({ userEmail: 'casey@yardflow.ai' });
    expect(input.settings.briefingTo).toBe('casey@freightroll.com');
    expect(deps.send).toBe(h.sendViaGmail);
  });

  it('a thrown send marks the failure and answers 500', async () => {
    h.send.mockRejectedValue(new Error('gmail 503'));
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect(h.failure).toHaveBeenCalledTimes(1);
  });
});
