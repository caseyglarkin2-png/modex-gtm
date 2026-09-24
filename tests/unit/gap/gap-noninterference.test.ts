/**
 * SF16 remainder (spec section 13, GAP OS RUNTIME 6B-T1): a dedicated
 * snapshot suite pinning the exact prisma call shape `addOne` and
 * `approveBatch` produce for a PLAIN, non-GAP item. GAP_OS_ENABLED is unset
 * throughout this file.
 *
 * `approveBatch`'s non-GAP shape is already comprehensively pinned by
 * `tests/unit/gap/approve-batch-guard.test.ts` (a literal `toEqual` on its
 * updateMany call list); the case here is a light corroborating check, not a
 * duplicate. `addOne`'s partial field checks in `tests/unit/queue-actions.test.ts`
 * (to_email, owner) leave the rest of the `create` payload unpinned -- a
 * future GAP change could add, rename or drop a field on the plain path
 * without any existing test catching it. This file closes that gap: it
 * asserts the COMPLETE `draftQueueItem.create` data object, field by field,
 * for an input with no GAP fields at all.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedAuth = vi.fn();

const mockedPrisma = {
  unsubscribedEmail: { findUnique: vi.fn() },
  emailLog: { findFirst: vi.fn() },
  draftQueueItem: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  gapCompile: { findMany: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/email/gmail-inbox', () => ({ threadExistsWith: vi.fn(async () => ({ exists: false, lastAt: null })) }));
vi.mock('@/lib/queue/send', () => ({ sendQueueItem: vi.fn() }));
vi.mock('@/lib/queue/send-deps', () => ({ prodSendDeps: vi.fn(() => ({})) }));

const { addOne, approveBatch } = await import('@/app/discovery/queue-actions');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('gap-noninterference: addOne', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GAP_OS_ENABLED;
    mockedPrisma.unsubscribedEmail.findUnique.mockResolvedValue(null);
    mockedPrisma.emailLog.findFirst.mockResolvedValue(null);
    mockedPrisma.draftQueueItem.findFirst.mockResolvedValue(null);
    mockedPrisma.draftQueueItem.create.mockResolvedValue({ id: 7 });
  });

  it('a plain, non-GAP add produces EXACTLY this create payload -- no extra field, no missing field', async () => {
    await addOne(
      {
        toEmail: 'Person@Example.com',
        accountName: 'Acme Logistics',
        subject: 'Quick question on your yard',
        body: 'Hello there',
        source: 'casey',
      },
      'casey@freightroll.com',
    );

    expect(mockedPrisma.draftQueueItem.create).toHaveBeenCalledTimes(1);
    const call = mockedPrisma.draftQueueItem.create.mock.calls[0][0];
    const { idempotency_key, ...rest } = call.data;
    expect(typeof idempotency_key).toBe('string');
    expect(idempotency_key).toMatch(UUID_RE);
    expect(rest).toEqual({
      to_email: 'person@example.com',
      account_name: 'Acme Logistics',
      persona_name: null,
      persona_id: null,
      subject: 'Quick question on your yard',
      body: 'Hello there',
      image_url: null,
      campaign_tag: null,
      source: 'casey',
      owner: 'casey@freightroll.com',
      created_by: 'casey@freightroll.com',
    });
    expect(call.select).toEqual({ id: true });
    // Pinned negatively: nothing GAP-shaped ever appears on the plain path.
    expect('sequence_version_id' in call.data).toBe(false);
    expect('step_index' in call.data).toBe(false);
  });
});

describe('gap-noninterference: approveBatch (corroborating check; full pin lives in approve-batch-guard.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GAP_OS_ENABLED;
    mockedAuth.mockResolvedValue({ user: { email: 'rep@freightroll.com', role: 'rep' } });
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });
  });

  it('a plain batch approval never reads the GAP compile table and updates exactly the two ids', async () => {
    const res = await approveBatch([10, 20]);

    expect(res).toStrictEqual({ ok: true, approved: 2 });
    expect(mockedPrisma.gapCompile.findMany).not.toHaveBeenCalled();
    expect(mockedPrisma.draftQueueItem.findMany).not.toHaveBeenCalled();
    expect(mockedPrisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(2);
    expect(mockedPrisma.draftQueueItem.updateMany.mock.calls.map((c) => c[0].where.id)).toEqual([10, 20]);
  });
});
