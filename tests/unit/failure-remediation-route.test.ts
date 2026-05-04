import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  sendJobRecipient: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  persona: {
    updateMany: vi.fn(),
  },
  activity: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { POST } = await import('@/app/api/revops/failure-remediation/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('failure remediation route', () => {
  it('marks recipients for retry-later action', async () => {
    mockedPrisma.sendJobRecipient.findMany.mockResolvedValue([
      { id: 11, to_email: 'ops@acme.com', account_name: 'Acme', campaign_id: 7, status: 'failed' },
    ]);
    mockedPrisma.sendJobRecipient.updateMany.mockResolvedValue({ count: 1 });
    const res = await POST(new NextRequest('http://localhost/api/revops/failure-remediation', {
      method: 'POST',
      body: JSON.stringify({ action: 'retry-later', recipientIds: [11] }),
    }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockedPrisma.sendJobRecipient.updateMany).toHaveBeenCalled();
  });
});
