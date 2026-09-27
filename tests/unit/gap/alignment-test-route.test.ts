/**
 * Ops closeout 3: GET /api/cron/gap-alignment-test sends ONE harmless internal
 * message through the exact GAP sender path (the Gmail API as the GAP mailbox,
 * casey@yardflow.ai) so the RECEIVED copy's Authentication-Results can prove
 * SPF / DKIM / DMARC alignment. Never scheduled. The recipient is hard-coded
 * internal; no caller can choose it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn(async () => ({ provider: 'gmail' as const, id: 'gm-1', threadId: 'th-1' }));
const audit: any[] = [];
const sender = { value: { userEmail: 'casey@yardflow.ai', serviceAccountJson: '{}' } as null | { userEmail: string; serviceAccountJson: string } };
vi.mock('@/lib/prisma', () => ({
  prisma: {
    gapAuditEvent: {
      findFirst: vi.fn(async ({ where }: any) => audit.find((a) => a.kind === where.kind && a.created_at > where.created_at.gt) ?? null),
      create: vi.fn(async ({ data }: any) => { audit.push({ ...data, created_at: new Date() }); return { id: 'e' }; }),
    },
  },
}));
vi.mock('@/lib/email/gmail-sender', () => ({ sendViaGmail: (...a: unknown[]) => (send as any)(...a) }));
vi.mock('@/lib/gap/execution/gap-sender', () => ({ gapGmailSender: () => sender.value }));

import { GET, ALIGNMENT_TEST_RECIPIENT } from '@/app/api/cron/gap-alignment-test/route';

const req = (url = 'http://localhost/api/cron/gap-alignment-test/', headers: Record<string, string> = { authorization: 'Bearer shh' }) => new Request(url, { headers });

beforeEach(() => {
  audit.length = 0;
  send.mockClear();
  sender.value = { userEmail: 'casey@yardflow.ai', serviceAccountJson: '{}' };
  process.env.CRON_SECRET = 'shh';
  process.env.GAP_OS_ENABLED = 'true';
});

describe('GET /api/cron/gap-alignment-test', () => {
  it('refuses without the cron secret and sends nothing', async () => {
    expect((await GET(req(undefined, {}))).status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends exactly one OPERATOR_ALERT message FROM the GAP mailbox TO the hard-coded internal address, and audits it', async () => {
    const res = await GET(req('http://localhost/api/cron/gap-alignment-test/?to=prospect@acme.example'));
    expect(res.status).toBe(200);
    expect(ALIGNMENT_TEST_RECIPIENT).toBe('casey@freightroll.com');
    expect(send).toHaveBeenCalledTimes(1);
    const payload = (send.mock.calls[0] as any)[0];
    expect(payload).toMatchObject({ to: 'casey@freightroll.com', purpose: 'OPERATOR_ALERT', sender: { userEmail: 'casey@yardflow.ai' } });
    expect(payload.subject).toMatch(/^\[gap-alignment-test\] /);
    expect(await res.json()).toMatchObject({ ok: true, from: 'casey@yardflow.ai', to: 'casey@freightroll.com', gmailMessageId: 'gm-1' });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ kind: 'ops.alignment_test_sent', payload: { to: 'casey@freightroll.com', gmailMessageId: 'gm-1' } });
  });

  it('at most one per hour: a second call is 429 and sends nothing', async () => {
    await GET(req());
    const again = await GET(req());
    expect(again.status).toBe(429);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('no GAP mailbox configured: a named skip, nothing sent from any other identity', async () => {
    sender.value = null;
    const res = await GET(req());
    expect(await res.json()).toEqual({ skipped: true, reason: 'gap_mailbox_not_configured' });
    expect(send).not.toHaveBeenCalled();
  });
});
