import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  sendJobRecipient: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  sendJob: {
    updateMany: vi.fn(),
  },
  persona: {
    updateMany: vi.fn(),
  },
  unsubscribedEmail: {
    upsert: vi.fn(),
  },
  activity: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { POST } = await import('@/app/api/revops/failure-remediation/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.sendJobRecipient.updateMany.mockResolvedValue({ count: 1 });
  mockedPrisma.sendJob.updateMany.mockResolvedValue({ count: 1 });
  mockedPrisma.persona.updateMany.mockResolvedValue({ count: 1 });
  mockedPrisma.unsubscribedEmail.upsert.mockResolvedValue({ id: 'sub_1' });
  mockedPrisma.activity.create.mockResolvedValue({ id: 1 });
});

describe('failure remediation route', () => {
  it('marks recipients for retry-later action', async () => {
    mockedPrisma.sendJobRecipient.findMany.mockResolvedValue([
      { id: 11, send_job_id: 99, to_email: 'ops@acme.com', account_name: 'Acme', campaign_id: 7, status: 'failed' },
    ]);
    mockedPrisma.sendJobRecipient.updateMany.mockResolvedValue({ count: 1 });
    mockedPrisma.sendJob.updateMany.mockResolvedValue({ count: 1 });
    const res = await POST(new NextRequest('http://localhost/api/revops/failure-remediation', {
      method: 'POST',
      body: JSON.stringify({ action: 'retry-later', recipientIds: [11] }),
    }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockedPrisma.sendJobRecipient.updateMany).toHaveBeenCalled();
  });

  it('suppresses recipients from the account-page remediation flow', async () => {
    mockedPrisma.sendJobRecipient.findMany.mockResolvedValue([
      { id: 12, send_job_id: 100, to_email: 'blocked@acme.com', account_name: 'Acme', campaign_id: 7, status: 'failed' },
    ]);

    const res = await POST(new NextRequest('http://localhost/api/revops/failure-remediation', {
      method: 'POST',
      body: JSON.stringify({ action: 'suppress-recipient', recipientIds: [12] }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockedPrisma.unsubscribedEmail.upsert).toHaveBeenCalled();
    expect(mockedPrisma.persona.updateMany).toHaveBeenCalled();
    expect(mockedPrisma.sendJobRecipient.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [12] } },
      data: {
        status: 'skipped',
        error_message: 'Suppressed from failure remediation',
      },
    });
  });

  it('marks a bad address and invalidates the persona email', async () => {
    mockedPrisma.sendJobRecipient.findMany.mockResolvedValue([
      { id: 13, send_job_id: 101, to_email: 'bad@acme.com', account_name: 'Acme', campaign_id: 7, status: 'failed' },
    ]);

    const res = await POST(new NextRequest('http://localhost/api/revops/failure-remediation', {
      method: 'POST',
      body: JSON.stringify({ action: 'mark-bad-address', recipientIds: [13] }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockedPrisma.persona.updateMany).toHaveBeenCalled();
    expect(mockedPrisma.unsubscribedEmail.upsert).toHaveBeenCalled();
    expect(mockedPrisma.sendJobRecipient.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [13] } },
      data: {
        status: 'skipped',
        error_message: 'Marked bad address from failure remediation',
      },
    });
  });

  it('creates a switch-persona follow-up task', async () => {
    mockedPrisma.sendJobRecipient.findMany.mockResolvedValue([
      { id: 14, send_job_id: 102, to_email: 'ops@acme.com', account_name: 'Acme', campaign_id: 7, status: 'failed' },
    ]);

    const res = await POST(new NextRequest('http://localhost/api/revops/failure-remediation', {
      method: 'POST',
      body: JSON.stringify({ action: 'switch-persona', recipientIds: [14] }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockedPrisma.activity.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        outcome: 'Persona switch requested from failure remediation',
      }),
    }));
  });
});
