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

// ── QUEUE-ONLY reply-pause pre-send guard ──
// newestInboundFrom drives the post-evaluateSendGuards reply-pause in prodSendDeps.
// Default it to null (no inbound reply) so the happy path stays green; individual
// tests override the resolved value. Inbound-only: a sequence follow-up's own
// outbound thread must NOT trip this — only a real reply FROM the recipient does.
const mockedNewestInboundFrom = vi.fn(async (_email: string): Promise<Date | null> => null);
vi.mock('@/lib/email/gmail-inbox', () => ({ newestInboundFrom: mockedNewestInboundFrom }));

// ── Per-identity send: owner's stored Gmail refresh token ──
// Default null (no per-user token) so the happy path falls back to the Casey
// env token exactly as today. Individual tests override per owner. The resolved
// `sender` is threaded through wrapAndSend → sendEmail, so we assert on the
// (mocked) sendEmail payload's `sender` field.
const mockedGetRefreshTokenFor = vi.fn(async (_prisma: unknown, _email: string): Promise<string | null> => null);
vi.mock('@/lib/email/gmail-token-store', () => ({ getRefreshTokenFor: mockedGetRefreshTokenFor }));

// ── Prisma mock (the only persistence boundary) ──
const mockedPrisma = {
  draftQueueItem: {
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  experimentVariant: {
    findFirst: vi.fn(),
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
  created_at: new Date('2026-06-01T00:00:00Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedNewestInboundFrom.mockResolvedValue(null);
  mockedGetRefreshTokenFor.mockResolvedValue(null);
  mockedEnforceOneAccountInvariant.mockResolvedValue({
    ok: true,
    canonicalAccountName: 'Acme Foods',
    scopedAccountNames: ['Acme Foods'],
    normalizedCc: [],
  });
  mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });
  mockedPrisma.draftQueueItem.findUniqueOrThrow.mockResolvedValue({ ...ITEM });
  mockedPrisma.draftQueueItem.update.mockResolvedValue({});
  mockedPrisma.experimentVariant.findFirst.mockResolvedValue(null);
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

  it('reply-pause: blocks when the recipient replied AFTER this item was queued', async () => {
    // Inbound reply post-dates created_at (2026-06-01) — pause and skip the send.
    mockedNewestInboundFrom.mockResolvedValue(new Date('2026-06-03T00:00:00Z'));
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    const result = await deps.guard({ ...ITEM });

    expect(result).toEqual({ ok: false, reason: 'replied' });
    expect(mockedNewestInboundFrom).toHaveBeenCalledWith('Alice@Example.com');
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('reply-pause: allows when there is no inbound reply (null) — e.g. a follow-up whose own outbound thread exists', async () => {
    mockedNewestInboundFrom.mockResolvedValue(null);
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    const result = await deps.guard({ ...ITEM });

    expect(result).toEqual({ ok: true });
  });

  it('reply-pause: allows when the only inbound reply pre-dates the queue time', async () => {
    // Reply from before we queued (2026-06-01) must NOT pause this send.
    mockedNewestInboundFrom.mockResolvedValue(new Date('2026-05-20T00:00:00Z'));
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    const result = await deps.guard({ ...ITEM });

    expect(result).toEqual({ ok: true });
  });

  it('applies the assigned variant subject at send and records the variant in EmailLog metadata', async () => {
    mockedPrisma.experimentVariant.findFirst.mockResolvedValue({
      variant_key: 'B',
      subject: 'VARIANT SUBJ',
      opening: null,
      cta: null,
      is_control: false,
    });
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    await deps.send({ ...ITEM, experiment_id: 'exp_1', variant_key: 'B' });

    // variant loaded for this item's experiment + key
    expect(mockedPrisma.experimentVariant.findFirst).toHaveBeenCalledWith({
      where: { experiment_id: 'exp_1', variant_key: 'B' },
    });
    // applied subject reaches the Gmail send boundary
    expect(mockedSendEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: 'VARIANT SUBJ' }));

    // side effects record the variant in EmailLog.metadata via workflowMetadata
    await deps.runSideEffects(
      { ...ITEM, experiment_id: 'exp_1', variant_key: 'B' },
      { providerMessageId: 'msg-1', threadId: null },
    );
    const logArg = mockedPrisma.emailLog.create.mock.calls[0][0];
    expect(logArg.data.metadata?.workflow?.queue).toEqual({
      variantKey: 'B',
      experimentId: 'exp_1',
    });
  });

  it('uses the base subject when the item has no experiment, and never loads a variant', async () => {
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    await deps.send({ ...ITEM });

    expect(mockedPrisma.experimentVariant.findFirst).not.toHaveBeenCalled();
    expect(mockedSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Quarterly check-in' }),
    );
  });

  it('Case A: owner with a stored refresh token sends AS themselves (sender threaded)', async () => {
    // jake owns this item and has a per-user token → send as jake.
    mockedGetRefreshTokenFor.mockResolvedValue('jake-rt');
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    await deps.send({ ...ITEM, owner: 'jake@freightroll.com' });

    expect(mockedGetRefreshTokenFor).toHaveBeenCalledWith(prisma, 'jake@freightroll.com');
    expect(mockedSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        sender: { refreshToken: 'jake-rt', userEmail: 'jake@freightroll.com' },
      }),
    );
  });

  it('Case B: owner without a stored token falls back to the Casey env token (sender undefined)', async () => {
    // No per-user token → sender omitted → env/Casey behavior, exactly as today.
    mockedGetRefreshTokenFor.mockResolvedValue(null);
    const prisma = mockedPrisma as any;
    const deps = prodSendDeps(prisma);

    await deps.send({ ...ITEM, owner: 'jake@freightroll.com' });

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    expect(mockedSendEmail.mock.calls[0][0].sender).toBeUndefined();
  });
});
