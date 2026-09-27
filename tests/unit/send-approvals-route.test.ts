import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  sendApprovalRequest: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
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
  mockedPrisma.sendApprovalRequest.findUnique.mockResolvedValue({ id: 'sar_1', status: 'pending' });
  mockedPrisma.sendApprovalRequest.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'sar_1',
    status: data.status,
    approved_by: data.approved_by ?? null,
    comment: data.comment ?? null,
    resolved_at: new Date('2026-05-04T00:00:00.000Z'),
    updated_at: new Date('2026-05-04T00:00:00.000Z'),
  }));
});

describe('send approvals route', () => {
  it('approves as the signed-in person', async () => {
    authMock.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
    const res = await patch({ id: 'sar_1', action: 'approve', comment: 'approved' });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.approval.status).toBe('approved');
    expect(mockedPrisma.sendApprovalRequest.update.mock.calls[0][0].data.approved_by).toBe('casey@freightroll.com');
  });

  it('ignores an actor supplied in the body: the approver is the session, never the client', async () => {
    authMock.mockResolvedValue({ user: { email: 'jake@freightroll.com' } });
    const res = await patch({ id: 'sar_1', action: 'approve', actor: 'casey@freightroll.com' });

    expect(res.status).toBe(200);
    expect(mockedPrisma.sendApprovalRequest.update.mock.calls[0][0].data.approved_by).toBe('jake@freightroll.com');
  });

  it('refuses an unauthenticated request before reading or writing anything', async () => {
    authMock.mockResolvedValue(null);
    const res = await patch({ id: 'sar_1', action: 'approve', actor: 'casey@freightroll.com' });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
    expect(mockedPrisma.sendApprovalRequest.findUnique).not.toHaveBeenCalled();
    expect(mockedPrisma.sendApprovalRequest.update).not.toHaveBeenCalled();
  });

  it('refuses a session with no email', async () => {
    authMock.mockResolvedValue({ user: { name: 'someone' } });
    const res = await patch({ id: 'sar_1', action: 'approve' });

    expect(res.status).toBe(401);
    expect(mockedPrisma.sendApprovalRequest.update).not.toHaveBeenCalled();
  });
});
