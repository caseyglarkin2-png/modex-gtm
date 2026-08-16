/**
 * A send path must never DESTROY suppression evidence.
 *
 * MEASURED 2026-08-16. `performSend` handled an unsubscribed internal address by
 * calling `prisma.unsubscribedEmail.delete({ where: { email } }).catch(() => {})`
 * and then sending. Two things are wrong with that and only one is obvious.
 *
 * The obvious one: it deletes the record of a decision. `allowBypass` only
 * matches internal addresses - casey@, FROM_EMAIL, @freightroll.com,
 * @yardflow.ai - so the blast radius is our own mailboxes rather than
 * prospects, which is why this is debt and not a P0. But an unsubscribe row is
 * the evidence that somebody asked to stop hearing from us, and a send path is
 * the last place that should be allowed to erase one.
 *
 * The subtle one: `.catch(() => {})`. The delete could fail every single time
 * and the code would behave identically, so nothing downstream could ever
 * notice the difference between "erased" and "silently failed to erase". A
 * write whose failure is unobservable is not a write anybody can reason about.
 *
 * SKIPPING AND DELETING ARE THE SAME SEND AND DIFFERENT RECORDS. The bypass
 * still needs to send - that is the point of an internal allowlist - so this
 * asserts the send still happens AND the row survives. A test that only checked
 * "did it send" would pass against both the bug and the fix.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';

const mockedSendEmail = vi.fn();
const mockedEnforceOneAccountInvariant = vi.fn(async ({ cc }: { cc?: string[] }) => ({
  ok: true,
  canonicalAccountName: 'Acme Foods',
  scopedAccountNames: ['Acme Foods'],
  normalizedCc: cc ?? [],
}));

const mockedPrisma = {
  unsubscribedEmail: {
    findMany: vi.fn(),
    delete: vi.fn(() => ({ catch: vi.fn() })),
  },
  emailLog: { create: vi.fn() },
  generatedContent: { update: vi.fn(() => ({ catch: vi.fn() })) },
  account: { findUnique: vi.fn(), updateMany: vi.fn(() => ({ catch: vi.fn() })) },
  persona: { findMany: vi.fn() },
  accountContactCandidate: { findMany: vi.fn() },
  activity: { create: vi.fn(() => ({ catch: vi.fn() })) },
};

vi.mock('@/lib/email/client', () => ({ sendEmail: mockedSendEmail }));
vi.mock('@/lib/revops/one-account-invariant', () => ({ enforceOneAccountInvariant: mockedEnforceOneAccountInvariant }));
vi.mock('@/lib/source-backed/metrics', () => ({ recordSourceBackedMetric: vi.fn(async () => undefined) }));
vi.mock('@/lib/hubspot/deals', () => ({ ensureLocalMeetingDealLink: vi.fn(async () => undefined) }));
vi.mock('@/lib/agent-actions/cache', () => ({ markAgentActionCacheStale: vi.fn(async () => undefined) }));

const { performSend } = await import('@/lib/email/perform-send');
const prisma = mockedPrisma as unknown as Parameters<typeof performSend>[0];

const INTERNAL = 'casey@freightroll.com';

beforeEach(() => {
  vi.clearAllMocks();
  mockedEnforceOneAccountInvariant.mockResolvedValue({
    ok: true,
    canonicalAccountName: 'Acme Foods',
    scopedAccountNames: ['Acme Foods'],
    normalizedCc: [],
  });
  mockedPrisma.persona.findMany.mockResolvedValue([]);
  mockedPrisma.accountContactCandidate.findMany.mockResolvedValue([]);
  mockedPrisma.emailLog.create.mockResolvedValue({ id: 1 });
  mockedPrisma.account.findUnique.mockResolvedValue({
    name: 'Acme Foods', pipeline_stage: null, outreach_status: 'Not started', meeting_status: null,
  });
  mockedSendEmail.mockResolvedValue({
    headers: { 'x-message-id': 'msg-1' }, provider: 'gmail', threadId: null, hubspotEngagementId: null,
  });
  // The internal address IS on the unsubscribe list. This is the whole setup.
  mockedPrisma.unsubscribedEmail.findMany.mockResolvedValue([{ email: INTERNAL }]);
});

describe('an internal bypass does not erase the unsubscribe record', () => {
  it('sends, because that is what the internal allowlist is for', async () => {
    const result = await performSend(prisma, {
      to: INTERNAL,
      subject: 'Internal check',
      bodyHtml: 'Hello',
      accountName: 'Acme Foods',
      personaName: 'Casey',
    });
    expect(result.ok).toBe(true);
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
  });

  it('NEVER deletes the unsubscribe row', async () => {
    await performSend(prisma, {
      to: INTERNAL,
      subject: 'Internal check',
      bodyHtml: 'Hello',
      accountName: 'Acme Foods',
      personaName: 'Casey',
    });
    // The specific assertion, not "it worked": the evidence must survive the send.
    expect(mockedPrisma.unsubscribedEmail.delete).not.toHaveBeenCalled();
  });

  it('still BLOCKS an unsubscribed external address', async () => {
    // The control. Without it, a gate that deleted nothing because it refused
    // to send anything at all would satisfy the assertion above.
    const external = 'buyer@homedepot.com';
    mockedPrisma.unsubscribedEmail.findMany.mockResolvedValue([{ email: external }]);
    const result = await performSend(prisma, {
      to: external,
      subject: 'Cold outreach',
      bodyHtml: 'Hello',
      accountName: 'Acme Foods',
      personaName: 'Buyer',
    });
    expect(result.ok).toBe(false);
    expect(mockedSendEmail).not.toHaveBeenCalled();
    expect(mockedPrisma.unsubscribedEmail.delete).not.toHaveBeenCalled();
  });
});
