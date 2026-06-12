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
  unsubscribedEmail: { findMany: vi.fn(), delete: vi.fn(() => ({ catch: vi.fn() })) },
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
  mockedPrisma.unsubscribedEmail.findMany.mockResolvedValue([]);
  mockedPrisma.account.findUnique.mockResolvedValue(null);
  mockedSendEmail.mockResolvedValue({
    headers: { 'x-message-id': 'msg-1' },
    provider: 'gmail',
    threadId: null,
    hubspotEngagementId: null,
  });
});

describe('campaign_tag flows draft -> EmailLog', () => {
  it('stamps campaign_tag + tracking_id onto the EmailLog at creation', async () => {
    const result = await performSend(prisma, {
      to: 'alice@example.com',
      subject: 'Tour invite',
      bodyHtml: 'Come see the yard',
      accountName: 'Acme Foods',
      personaName: null,
      campaignTag: 'allentown-tour',
    });

    expect(result.ok).toBe(true);
    const createArg = mockedPrisma.emailLog.create.mock.calls[0][0];
    expect(createArg.data.campaign_tag).toBe('allentown-tour');
    // tracking_id is minted in wrapAndSend and threaded onto the row.
    expect(typeof createArg.data.tracking_id).toBe('string');
    expect(createArg.data.tracking_id.length).toBeGreaterThan(0);

    // The minted tracking id rides into the sent HTML as the open pixel.
    const sendArg = mockedSendEmail.mock.calls[0][0];
    expect(sendArg.html).toContain('/api/e/open/?l=');
  });

  it('omits campaign_tag from the row when the send carries none', async () => {
    await performSend(prisma, {
      to: 'bob@example.com',
      subject: 'Hi',
      bodyHtml: 'Hello',
      accountName: 'Acme Foods',
      personaName: null,
    });
    const createArg = mockedPrisma.emailLog.create.mock.calls[0][0];
    expect(createArg.data.campaign_tag).toBeUndefined();
  });
});
