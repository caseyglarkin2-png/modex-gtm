import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';

// ── Boundary mocks: network (Gmail send) + the heavy RevOps helpers ──
const mockedSendEmail = vi.fn();
const mockedEnforceOneAccountInvariant = vi.fn(async ({ cc }: { cc?: string[] }) => ({
  ok: true,
  canonicalAccountName: 'Acme Foods',
  scopedAccountNames: ['Acme Foods'],
  normalizedCc: cc ?? [],
}));

vi.mock('@/lib/email/client', () => ({ sendEmail: mockedSendEmail }));
vi.mock('@/lib/revops/one-account-invariant', () => ({ enforceOneAccountInvariant: mockedEnforceOneAccountInvariant }));
vi.mock('@/lib/source-backed/metrics', () => ({ recordSourceBackedMetric: vi.fn(async () => undefined) }));
vi.mock('@/lib/hubspot/deals', () => ({ ensureLocalMeetingDealLink: vi.fn(async () => undefined) }));
vi.mock('@/lib/agent-actions/cache', () => ({ markAgentActionCacheStale: vi.fn(async () => undefined) }));

// ── QUEUE-ONLY comms-awareness pre-send guard ──
// recipientCommsStatus drives the post-evaluateSendGuards block in prodSendDeps.
// Default it to the non-blocking 'new' state so the happy path stays green;
// individual tests override the resolved state.
const mockedRecipientCommsStatus = vi.fn(async () => ({ state: 'new', lastAt: null, detail: '' }));
vi.mock('@/lib/queue/comms-status', () => ({ recipientCommsStatus: mockedRecipientCommsStatus }));

// ── Prisma mock (the only persistence boundary) ──
const mockedPrisma = {
  draftQueueItem: {
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  unsubscribedEmail: {
    findMany: vi.fn(),
    delete: vi.fn(() => ({ catch: vi.fn() })),
  },
  emailLog: {
    create: vi.fn(),
  },
  account: {
    findUnique: vi.fn(),
    updateMany: vi.fn(() => ({ catch: vi.fn() })),
  },
  accountContactCandidate: {
    findMany: vi.fn(),
  },
  activity: {
    create: vi.fn(() => ({ catch: vi.fn() })),
  },
};

const { prodSendDeps } = await import('@/lib/queue/send-deps');
const { sendQueueItem } = await import('@/lib/queue/send');
const { RateLimitedError } = await import('@/lib/queue/errors');

const ITEM = {
  id: 5,
  status: 'approved',
  to_email: 'Alice@Example.com',
  subject: 'Quarterly check-in',
  body: 'Hello there',
  image_url: null,
  account_name: 'Acme Foods',
  persona_name: 'Alice Ops',
  persona_id: null,
  idempotency_key: 'idem-abc-123',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedRecipientCommsStatus.mockResolvedValue({ state: 'new', lastAt: null, detail: '' });
  mockedEnforceOneAccountInvariant.mockResolvedValue({
    ok: true,
    canonicalAccountName: 'Acme Foods',
    scopedAccountNames: ['Acme Foods'],
    normalizedCc: [],
  });
  mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });
  mockedPrisma.draftQueueItem.findUniqueOrThrow.mockResolvedValue({ ...ITEM });
  mockedPrisma.draftQueueItem.update.mockResolvedValue({});
  mockedPrisma.unsubscribedEmail.findMany.mockResolvedValue([]);
  mockedPrisma.accountContactCandidate.findMany.mockResolvedValue([]);
  mockedPrisma.account.findUnique.mockResolvedValue({
    name: 'Acme Foods',
    pipeline_stage: null,
    outreach_status: 'Not started',
    meeting_status: null,
  });
  mockedPrisma.emailLog.create.mockResolvedValue({ id: 777 });
  mockedSendEmail.mockResolvedValue({
    headers: { 'x-message-id': 'msg-1' },
    provider: 'gmail',
    threadId: null,
    hubspotEngagementId: null,
  });
});

describe('prodSendDeps (real deps, mocked prisma + network)', () => {
  it('runs a happy-path send through sendQueueItem with reused performSend phases', async () => {
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    const outcome = await sendQueueItem(5, { deps });

    expect(outcome.status).toBe('sent');

    // claim issues the guarded approved -> sending updateMany
    expect(mockedPrisma.draftQueueItem.updateMany).toHaveBeenCalledWith({
      where: { id: 5, status: 'approved' },
      data: expect.objectContaining({ status: 'sending' }),
    });

    // Gmail send carries the idempotency header equal to the item's key
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    expect(mockedSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'Alice@Example.com',
      headers: { 'X-Queue-Idempotency': 'idem-abc-123' },
    }));

    // side-effects wrote EmailLog with to_email lowercased
    expect(mockedPrisma.emailLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        to_email: 'alice@example.com',
        account_name: 'Acme Foods',
        body_html: expect.stringContaining('Hello there'),
      }),
    }));
  });

  it('blocks an unsubscribed recipient via the reused guards, never sending', async () => {
    mockedPrisma.unsubscribedEmail.findMany.mockResolvedValue([{ email: 'alice@example.com' }]);
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    const outcome = await sendQueueItem(5, { deps });

    expect(outcome.status).toBe('skipped');
    if (outcome.status === 'skipped') {
      expect(outcome.skippedReason).toBe('UNSUBSCRIBED');
    }
    expect(mockedSendEmail).not.toHaveBeenCalled();
    expect(mockedPrisma.emailLog.create).not.toHaveBeenCalled();
  });

  it('maps a 429 at the Gmail send boundary to a RateLimitedError (retryable)', async () => {
    mockedSendEmail.mockRejectedValue(new Error('Gmail send failed (429): rateLimitExceeded'));
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    await expect(deps.send({ ...ITEM })).rejects.toBeInstanceOf(RateLimitedError);
  });

  it('QUEUE-ONLY guard blocks an in_thread recipient even after evaluateSendGuards passes', async () => {
    mockedRecipientCommsStatus.mockResolvedValue({ state: 'in_thread', lastAt: null, detail: '' });
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    const result = await deps.guard({ ...ITEM });

    expect(result).toEqual({ ok: false, reason: 'in_thread' });
    expect(mockedRecipientCommsStatus).toHaveBeenCalledWith('Alice@Example.com', expect.anything());
  });

  it('QUEUE-ONLY guard blocks an unsubscribed recipient surfaced only by comms status', async () => {
    mockedRecipientCommsStatus.mockResolvedValue({ state: 'unsubscribed', lastAt: null, detail: '' });
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    const result = await deps.guard({ ...ITEM });

    expect(result).toEqual({ ok: false, reason: 'unsubscribed' });
  });

  it('QUEUE-ONLY guard allows a brand-new recipient (comms state new)', async () => {
    mockedRecipientCommsStatus.mockResolvedValue({ state: 'new', lastAt: null, detail: '' });
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    const result = await deps.guard({ ...ITEM });

    expect(result).toEqual({ ok: true });
  });
});
