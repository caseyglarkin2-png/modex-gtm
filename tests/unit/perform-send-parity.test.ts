import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';

const mockedSendEmail = vi.fn();
const mockedRecordSourceBackedMetric = vi.fn(async () => undefined);
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
  emailLog: {
    create: vi.fn(),
  },
  generatedContent: {
    update: vi.fn(() => ({ catch: vi.fn() })),
  },
  account: {
    findUnique: vi.fn(),
    updateMany: vi.fn(() => ({ catch: vi.fn() })),
  },
  persona: {
    findMany: vi.fn(),
  },
  accountContactCandidate: {
    findMany: vi.fn(),
  },
  activity: {
    create: vi.fn(() => ({ catch: vi.fn() })),
  },
};

vi.mock('@/lib/email/client', () => ({ sendEmail: mockedSendEmail }));
vi.mock('@/lib/revops/one-account-invariant', () => ({ enforceOneAccountInvariant: mockedEnforceOneAccountInvariant }));
vi.mock('@/lib/source-backed/metrics', () => ({ recordSourceBackedMetric: mockedRecordSourceBackedMetric }));
vi.mock('@/lib/hubspot/deals', () => ({ ensureLocalMeetingDealLink: vi.fn(async () => undefined) }));
vi.mock('@/lib/agent-actions/cache', () => ({ markAgentActionCacheStale: vi.fn(async () => undefined) }));

const { performSend } = await import('@/lib/email/perform-send');

// Cast: performSend takes a full PrismaClient, the mock is a structural subset.
const prisma = mockedPrisma as unknown as Parameters<typeof performSend>[0];

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
  mockedPrisma.emailLog.create.mockResolvedValue({ id: 123 });
});

describe('performSend parity', () => {
  it('for an account recipient: wraps HTML, lowercases to_email, advances pipeline, logs activity', async () => {
    mockedPrisma.unsubscribedEmail.findMany.mockResolvedValue([]);
    mockedSendEmail.mockResolvedValue({
      headers: { 'x-message-id': 'msg-1' },
      provider: 'gmail',
      threadId: null,
      hubspotEngagementId: null,
    });
    mockedPrisma.account.findUnique.mockResolvedValue({
      name: 'Acme Foods',
      pipeline_stage: null,
      outreach_status: 'Not started',
      meeting_status: null,
    });

    const result = await performSend(prisma, {
      to: 'Alice@Example.com',
      subject: 'Quarterly check-in',
      bodyHtml: 'Hello there',
      accountName: 'Acme Foods',
      personaName: 'Alice Ops',
    });

    expect(result.ok).toBe(true);

    // (a) sendEmail called exactly once with wrapped HTML
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    const sendArg = mockedSendEmail.mock.calls[0][0];
    expect(sendArg.html).toContain('<!DOCTYPE html>');
    expect(sendArg.html).toContain('Hello there');

    // (b) emailLog.create called with to_email LOWERCASED
    expect(mockedPrisma.emailLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        to_email: 'alice@example.com',
        account_name: 'Acme Foods',
      }),
    }));

    // (c) pipeline advanced via account.updateMany
    expect(mockedPrisma.account.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { name: 'Acme Foods' },
      data: expect.objectContaining({ outreach_status: 'Contacted' }),
    }));

    // (d) Activity row created
    expect(mockedPrisma.activity.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        account_name: 'Acme Foods',
        activity_type: 'Email',
      }),
    }));
  });

  it('returns { ok: false, block } for an unsubscribed recipient and does NOT send', async () => {
    mockedPrisma.unsubscribedEmail.findMany.mockResolvedValue([{ email: 'blocked@example.com' }]);

    const result = await performSend(prisma, {
      to: 'blocked@example.com',
      subject: 'Test',
      bodyHtml: 'Hello',
      accountName: 'Acme Foods',
      personaName: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.block.code).toBe('UNSUBSCRIBED');
    }
    expect(mockedSendEmail).not.toHaveBeenCalled();
    expect(mockedPrisma.emailLog.create).not.toHaveBeenCalled();
  });
});
