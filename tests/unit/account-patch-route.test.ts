import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedAuth = vi.fn();
const mockedDbGetAccounts = vi.fn();
const mockedAccountUpdate = vi.fn();
const mockedActivityCreate = vi.fn();
const mockedTransaction = vi.fn();
const mockedMarkAgentActionCacheStale = vi.fn();

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/db', () => ({ dbGetAccounts: mockedDbGetAccounts }));
vi.mock('@/lib/agent-actions/cache', () => ({
  markAgentActionCacheStale: mockedMarkAgentActionCacheStale,
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: { update: mockedAccountUpdate },
    activity: { create: mockedActivityCreate },
    $transaction: mockedTransaction,
  },
}));

const { PATCH } = await import('@/app/api/accounts/[slug]/route');

function buildRequest(body: unknown) {
  return new NextRequest('http://localhost/api/accounts/boston-beer-company', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('PATCH /api/accounts/[slug] (S4-T1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
    mockedDbGetAccounts.mockResolvedValue([{
      name: 'Boston Beer Company',
      why_now: 'Old why',
      primo_angle: 'Old angle',
      best_intro_path: 'Old path',
      signal_type: 'Old signal',
    }]);
    mockedAccountUpdate.mockResolvedValue({ name: 'Boston Beer Company' });
    mockedTransaction.mockImplementation(async (ops: unknown[]) => ops);
    mockedMarkAgentActionCacheStale.mockResolvedValue(undefined);
  });

  it('returns 401 when the request is unauthenticated', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const res = await PATCH(buildRequest({ why_now: 'New' }), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });
    expect(res.status).toBe(401);
    expect(mockedAccountUpdate).not.toHaveBeenCalled();
  });

  it('returns 404 when the slug does not match an account', async () => {
    mockedDbGetAccounts.mockResolvedValueOnce([{ name: 'Some Other Co' }]);
    const res = await PATCH(buildRequest({ why_now: 'New' }), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });
    expect(res.status).toBe(404);
  });

  it('updates fields, writes one Activity row per changed field, and marks cache stale', async () => {
    const res = await PATCH(buildRequest({ why_now: 'New why', primo_angle: 'New angle' }), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.changed).toEqual([
      { field: 'why_now', newValue: 'New why' },
      { field: 'primo_angle', newValue: 'New angle' },
    ]);
    expect(mockedAccountUpdate).toHaveBeenCalledWith({
      where: { name: 'Boston Beer Company' },
      data: { why_now: 'New why', primo_angle: 'New angle' },
    });
    // Two field changes → two Activity rows wrapped in a transaction.
    expect(mockedTransaction).toHaveBeenCalledTimes(1);
    const txOps = mockedTransaction.mock.calls[0][0] as unknown[];
    expect(txOps).toHaveLength(2);
    expect(mockedActivityCreate).toHaveBeenCalledTimes(2);
    expect(mockedActivityCreate).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        account_name: 'Boston Beer Company',
        activity_type: 'account_field_edit',
        owner: 'casey@freightroll.com',
        outcome: 'why_now',
        next_step: 'New why',
        notes: 'Old why',
      }),
    });
    expect(mockedMarkAgentActionCacheStale).toHaveBeenCalledWith('Boston Beer Company');
  });

  it('treats no-op edits as 200 with empty changed array (no Activity, no cache invalidation)', async () => {
    const res = await PATCH(buildRequest({ why_now: 'Old why' }), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.changed).toEqual([]);
    expect(mockedAccountUpdate).not.toHaveBeenCalled();
    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedMarkAgentActionCacheStale).not.toHaveBeenCalled();
  });

  it('rejects unknown fields via .strict() schema (typo guard)', async () => {
    const res = await PATCH(buildRequest({ wy_now: 'oops' }), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });
    expect(res.status).toBe(400);
    expect(mockedAccountUpdate).not.toHaveBeenCalled();
  });

  it('rejects values exceeding 4000 chars', async () => {
    const longText = 'x'.repeat(4001);
    const res = await PATCH(buildRequest({ why_now: longText }), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });
    expect(res.status).toBe(400);
  });

  it('treats empty string as a clear (null) write', async () => {
    const res = await PATCH(buildRequest({ why_now: null }), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });
    expect(res.status).toBe(200);
    expect(mockedAccountUpdate).toHaveBeenCalledWith({
      where: { name: 'Boston Beer Company' },
      data: { why_now: null },
    });
  });
});
