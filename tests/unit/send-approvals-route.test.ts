import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  sendApprovalRequest: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
};
/** One in-memory approval row: update writes it; updateMany writes it only when its where still matches. */
let row: Record<string, unknown>;
const apply = (data: Record<string, unknown>) => {
  for (const [k, v] of Object.entries(data)) if (v !== undefined) row[k] = v;
};
const authMock = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: () => authMock() }));

const { PATCH } = await import('@/app/api/revops/send-approvals/route');

function patch(body: unknown) {
  return PATCH(new NextRequest('http://localhost/api/revops/send-approvals', {
    method: 'PATCH',
    body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  row = { id: 'sar_1', status: 'pending', approved_by: null, comment: null, resolved_at: null, updated_at: new Date('2026-05-04T00:00:00.000Z') };
  mockedPrisma.sendApprovalRequest.findUnique.mockImplementation(async () => ({ ...row }));
  mockedPrisma.sendApprovalRequest.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    apply(data);
    return { ...row };
  });
  mockedPrisma.sendApprovalRequest.updateMany.mockImplementation(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
    if (where.id !== row.id || (where.status !== undefined && where.status !== row.status)) return { count: 0 };
    apply(data);
    return { count: 1 };
  });
});

describe('send approvals route', () => {
  it('approves as the signed-in person', async () => {
    authMock.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
    const res = await patch({ id: 'sar_1', action: 'approve', comment: 'approved' });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.approval.status).toBe('approved');
    expect(row.approved_by).toBe('casey@freightroll.com');
  });

  it('ignores an actor supplied in the body: the approver is the session, never the client', async () => {
    authMock.mockResolvedValue({ user: { email: 'caseyglarkin2@gmail.com' } });
    const res = await patch({ id: 'sar_1', action: 'approve', actor: 'casey@freightroll.com' });

    expect(res.status).toBe(200);
    expect(row.approved_by).toBe('caseyglarkin2@gmail.com');
  });

  it('a signed-in non-owner cannot approve (HUMAN_APPROVED_1TO1 means Casey)', async () => {
    authMock.mockResolvedValue({ user: { email: 'jake@freightroll.com' } });
    const res = await patch({ id: 'sar_1', action: 'approve', actor: 'casey@freightroll.com' });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });
    expect(mockedPrisma.sendApprovalRequest.update).not.toHaveBeenCalled();
    expect(mockedPrisma.sendApprovalRequest.updateMany).not.toHaveBeenCalled();
  });

  it.each(['rejected', 'approved'])('a %s request cannot be approved or rejected again', async (status) => {
    authMock.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
    row.status = status;
    for (const action of ['approve', 'reject']) {
      const res = await patch({ id: 'sar_1', action });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'not_pending', status });
    }
    expect(mockedPrisma.sendApprovalRequest.update).not.toHaveBeenCalled();
    expect(mockedPrisma.sendApprovalRequest.updateMany).not.toHaveBeenCalled();
  });

  it('a comment on a resolved request leaves its status alone', async () => {
    authMock.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
    row.status = 'rejected';
    const res = await patch({ id: 'sar_1', action: 'comment', comment: 'note' });
    expect(res.status).toBe(200);
    expect(row.status).toBe('rejected');
    expect(row.comment).toBe('note');
  });

  it('refuses an unauthenticated request before reading or writing anything', async () => {
    authMock.mockResolvedValue(null);
    const res = await patch({ id: 'sar_1', action: 'approve', actor: 'casey@freightroll.com' });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
    expect(mockedPrisma.sendApprovalRequest.findUnique).not.toHaveBeenCalled();
    expect(mockedPrisma.sendApprovalRequest.update).not.toHaveBeenCalled();
    expect(mockedPrisma.sendApprovalRequest.updateMany).not.toHaveBeenCalled();
  });

  it('refuses a session with no email', async () => {
    authMock.mockResolvedValue({ user: { name: 'someone' } });
    const res = await patch({ id: 'sar_1', action: 'approve' });

    expect(res.status).toBe(401);
    expect(mockedPrisma.sendApprovalRequest.update).not.toHaveBeenCalled();
    expect(mockedPrisma.sendApprovalRequest.updateMany).not.toHaveBeenCalled();
  });

  it('ops closeout: approve and reject racing on one pending request: exactly one wins, the other is not_pending', async () => {
    authMock.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
    // Both requests read the row before either writes (the race the pre-check alone cannot close).
    let waiting: Array<() => void> = [];
    mockedPrisma.sendApprovalRequest.findUnique.mockImplementation(async () => {
      const snapshot = { ...row };
      await new Promise<void>((resolve) => {
        waiting.push(resolve);
        if (waiting.length === 2) { waiting.forEach((r) => r()); waiting = []; }
      });
      return snapshot;
    });
    const [a, b] = await Promise.all([patch({ id: 'sar_1', action: 'approve' }), patch({ id: 'sar_1', action: 'reject' })]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);
    const loser = a.status === 409 ? a : b;
    expect((await loser.json()).error).toBe('not_pending');
    const winner = a.status === 200 ? 'approved' : 'rejected';
    expect(row.status).toBe(winner);
    expect(mockedPrisma.sendApprovalRequest.update).not.toHaveBeenCalled();
  });
});
