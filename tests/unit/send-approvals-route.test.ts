import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  sendApprovalRequest: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { PATCH } = await import('@/app/api/revops/send-approvals/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('send approvals route', () => {
  it('updates approval status', async () => {
    mockedPrisma.sendApprovalRequest.findUnique.mockResolvedValue({ id: 'sar_1', status: 'pending' });
    mockedPrisma.sendApprovalRequest.update.mockResolvedValue({
      id: 'sar_1',
      status: 'approved',
      approved_by: 'Casey',
      comment: 'approved',
      resolved_at: new Date('2026-05-04T00:00:00.000Z'),
      updated_at: new Date('2026-05-04T00:00:00.000Z'),
    });

    const res = await PATCH(new NextRequest('http://localhost/api/revops/send-approvals', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'sar_1', action: 'approve', actor: 'Casey', comment: 'approved' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.approval.status).toBe('approved');
  });
});
