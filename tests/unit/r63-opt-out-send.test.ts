/**
 * R63 BLOCKER (reviewer B, verified by the lead on the scratch database): the floating "Compose email" button opened
 * the legacy composer, and POST /api/email/send sent to Doug Scratch at Walmart, whose "stop" reply was on file but
 * not yet recorded (personas.do_not_contact still false): 200 "Email sent". GAP's own gate stops on that reply; the
 * legacy path never read replies.
 *
 * performSend (the one legacy send authority) now reads the recipient's replies the way GAP's stop rules do
 * (gap/replies/opt-out.ts over replies/classify.ts) and refuses when an opt-out reply from that address is on file,
 * recorded or not, with the reason in words the composer shows. A person's ordinary reply, an automatic notice and a
 * bounce do not block; the unsubscribed blocker is unchanged.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';

const mockedSendEmail = vi.fn();
const mockedEnforceOneAccountInvariant = vi.fn(async (_p: unknown, { cc }: { cc?: string[] }) => ({ ok: true, canonicalAccountName: 'Walmart Scratch Co r63', scopedAccountNames: ['Walmart Scratch Co r63'], normalizedCc: cc ?? [] }));
const inbound: Array<Record<string, unknown>> = [];

const mockedPrisma = {
  inboundMessage: { findMany: vi.fn(async (q: { where: { from_email: { equals: string } } }) => inbound.filter((m) => String(m.from_email).toLowerCase() === q.where.from_email.equals.toLowerCase())) },
  unsubscribedEmail: { findMany: vi.fn(async () => [] as Array<{ email: string }>), delete: vi.fn(() => ({ catch: vi.fn() })) },
  emailLog: { create: vi.fn(async () => ({ id: 1 })) },
  generatedContent: { update: vi.fn(() => ({ catch: vi.fn() })) },
  account: { findUnique: vi.fn(async () => ({ name: 'Walmart Scratch Co r63', pipeline_stage: null, outreach_status: 'Not started', meeting_status: null })), updateMany: vi.fn(() => ({ catch: vi.fn() })) },
  persona: { findMany: vi.fn(async () => []) },
  accountContactCandidate: { findMany: vi.fn(async () => []) },
  activity: { create: vi.fn(() => ({ catch: vi.fn() })) },
};

vi.mock('@/lib/email/client', () => ({ sendEmail: mockedSendEmail }));
vi.mock('@/lib/revops/one-account-invariant', () => ({ enforceOneAccountInvariant: mockedEnforceOneAccountInvariant }));
vi.mock('@/lib/source-backed/metrics', () => ({ recordSourceBackedMetric: vi.fn(async () => undefined) }));
vi.mock('@/lib/hubspot/deals', () => ({ ensureLocalMeetingDealLink: vi.fn(async () => undefined) }));
vi.mock('@/lib/agent-actions/cache', () => ({ markAgentActionCacheStale: vi.fn(async () => undefined) }));

const { performSend } = await import('@/lib/email/perform-send');
const { serializeSendBlocker } = await import('@/lib/email/send-blockers');
const prisma = mockedPrisma as unknown as Parameters<typeof performSend>[0];

const DOUG = 'doug@walmart-scratch-co-r63.example.com';
const reply = (body: string, over: Record<string, unknown> = {}) => ({ subject: 'Re: trailer turns at your sites', snippet: body.slice(0, 80), body_text: body, from_email: DOUG, from_name: 'Doug Scratch', received_at: new Date('2026-10-05T14:00:00Z'), ...over });
const send = () => performSend(prisma, { to: DOUG, subject: 'r63-B test', bodyHtml: 'Hello', accountName: 'Walmart Scratch Co r63', personaName: 'Doug Scratch' });

beforeEach(() => {
  vi.clearAllMocks();
  inbound.length = 0;
  mockedEnforceOneAccountInvariant.mockImplementation(async (_p: unknown, { cc }: { cc?: string[] }) => ({ ok: true, canonicalAccountName: 'Walmart Scratch Co r63', scopedAccountNames: ['Walmart Scratch Co r63'], normalizedCc: cc ?? [] }));
  mockedSendEmail.mockResolvedValue({ headers: { 'x-message-id': 'msg-1' }, provider: 'gmail', threadId: null, hubspotEngagementId: null });
});

describe('R63: an opt-out reply on file refuses the legacy send', () => {
  it('Doug replied "stop" (unrecorded): refused with the reason in words, nothing sent', async () => {
    inbound.push(reply('stop'));
    const r = await send();
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.block).toEqual({
      code: 'RECIPIENT_OPTED_OUT_BY_REPLY',
      status: 409,
      error: 'Doug Scratch replied "stop" on Oct 5, 2026. Nobody emails them from here. Record it as do not contact from their reply.',
      message: 'Doug Scratch replied "stop" on Oct 5, 2026. Nobody emails them from here. Record it as do not contact from their reply.',
      details: { reason: 'recipient_opted_out_by_reply' },
    });
    // What the composer shows: the response's error text, never a silent success.
    expect(serializeSendBlocker(r.block).error).toMatch(/^Doug Scratch replied "stop" on Oct 5, 2026\./);
    expect(mockedSendEmail).not.toHaveBeenCalled();
    expect(mockedPrisma.emailLog.create).not.toHaveBeenCalled();
  });

  it('an opt-out anywhere in their replies blocks, even behind a later ordinary reply; a cc that opted out blocks too', async () => {
    inbound.push(reply('Please remove me from your list.'), reply('Thanks, got it.', { received_at: new Date('2026-10-06T14:00:00Z') }));
    expect((await send()).ok).toBe(false);
    inbound.length = 0;
    inbound.push(reply('stop', { from_email: 'ann@walmart-scratch-co-r63.example.com', from_name: 'Ann Scratch' }));
    const cc = await performSend(prisma, { to: DOUG, cc: ['ann@walmart-scratch-co-r63.example.com'], subject: 'x', bodyHtml: 'Hello', accountName: 'Walmart Scratch Co r63', personaName: 'Doug Scratch' });
    expect(cc.ok === false && cc.block.code).toBe('RECIPIENT_OPTED_OUT_BY_REPLY');
    expect(cc.ok === false && cc.block.error).toMatch(/^Ann Scratch replied "stop"/);
  });

  it("a person's ordinary reply, an automatic notice and a bounce do not block", async () => {
    inbound.push(
      reply('Can you send the case study by Friday?'),
      reply('I am out of the office until Monday with limited access to email.', { subject: 'Automatic reply: trailer turns' }),
      reply('Delivery to the following recipient failed permanently.', { from_email: DOUG, subject: 'Delivery Status Notification (Failure)' }),
    );
    const r = await send();
    expect(r.ok).toBe(true);
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
  });

  it('the unsubscribed blocker is unchanged and still checked first', async () => {
    mockedPrisma.unsubscribedEmail.findMany.mockResolvedValueOnce([{ email: DOUG }]);
    inbound.push(reply('stop'));
    const r = await send();
    expect(r.ok === false && r.block.code).toBe('UNSUBSCRIBED');
    expect(r.ok === false && r.block.message).toBe(`Cannot send to ${DOUG} - recipient has unsubscribed.`);
  });
});
