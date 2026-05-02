import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  generatedContent: {
    findMany: vi.fn(),
  },
  sendJob: {
    create: vi.fn(),
  },
};

const mockedRateLimit = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: mockedRateLimit }));

const { POST } = await import('@/app/api/email/send-bulk-async/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockedRateLimit.mockReturnValue({ ok: true });
});

describe('email send-bulk-async route', () => {
  it('rejects when guard warnings are not acknowledged', async () => {
    const req = new NextRequest('http://localhost/api/email/send-bulk-async', {
      method: 'POST',
      body: JSON.stringify({
        guardWarningsAcknowledged: false,
        items: [{
          generatedContentId: 10,
          accountName: 'Acme Foods',
          subject: 'Hi',
          bodyHtml: '<p>Hi</p>',
          recipients: [{ to: 'ops@acme.com' }],
        }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('rejects missing generated content ids', async () => {
    mockedPrisma.generatedContent.findMany.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/email/send-bulk-async', {
      method: 'POST',
      body: JSON.stringify({
        guardWarningsAcknowledged: true,
        items: [{
          generatedContentId: 99,
          accountName: 'Acme Foods',
          subject: 'Hi',
          bodyHtml: '<p>Hi</p>',
          recipients: [{ to: 'ops@acme.com' }],
        }],
      }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toContain('Missing generated content rows: 99');
  });

  it('creates send job and deduplicates recipient rows', async () => {
    mockedPrisma.generatedContent.findMany.mockResolvedValue([
      { id: 10, campaign_id: 7, account_name: 'Acme Foods' },
    ]);
    mockedPrisma.sendJob.create.mockResolvedValue({
      id: 401,
      status: 'pending',
      total_recipients: 1,
      created_at: new Date('2026-05-02T00:00:00.000Z'),
    });

    const req = new NextRequest('http://localhost/api/email/send-bulk-async', {
      method: 'POST',
      body: JSON.stringify({
        guardWarningsAcknowledged: true,
        requestedBy: 'Casey',
        items: [{
          generatedContentId: 10,
          accountName: 'Acme Foods',
          subject: 'Subject',
          bodyHtml: '<p>Body</p>',
          recipients: [{ to: 'OPS@ACME.COM' }, { to: 'ops@acme.com' }],
        }],
      }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedPrisma.sendJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        total_recipients: 1,
        recipients: {
          createMany: {
            data: [
              expect.objectContaining({
                generated_content_id: 10,
                campaign_id: 7,
                account_name: 'Acme Foods',
                to_email: 'ops@acme.com',
                subject: 'Subject',
              }),
            ],
          },
        },
      }),
      select: {
        id: true,
        status: true,
        total_recipients: true,
        created_at: true,
      },
    });
  });
});
