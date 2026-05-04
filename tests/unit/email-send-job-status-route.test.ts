import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  sendJob: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { GET } = await import('@/app/api/email/send-jobs/[id]/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('email send-job status route', () => {
  it('returns 400 for invalid id', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/email/send-jobs/not-number'),
      { params: Promise.resolve({ id: 'abc' }) },
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when job does not exist', async () => {
    mockedPrisma.sendJob.findUnique.mockResolvedValue(null);

    const res = await GET(
      new NextRequest('http://localhost/api/email/send-jobs/88'),
      { params: Promise.resolve({ id: '88' }) },
    );
    expect(res.status).toBe(404);
  });

  it('returns job payload with recipient counts and generated ids', async () => {
    mockedPrisma.sendJob.findUnique.mockResolvedValue({
      id: 42,
      status: 'partial',
      requested_by: 'Casey',
      total_recipients: 3,
      sent_count: 1,
      failed_count: 1,
      skipped_count: 1,
      error_message: null,
      started_at: null,
      completed_at: null,
      created_at: new Date('2026-05-02T00:00:00.000Z'),
      updated_at: new Date('2026-05-02T00:05:00.000Z'),
      experiment: {
        id: 'exp_1',
        name: 'Subject test',
        primary_metric: 'reply_rate',
        status: 'active',
        variants: [
          { id: 'var_control', variant_key: 'control', subject: 'Control', split_percent: 50, is_control: true },
          { id: 'var_challenger', variant_key: 'challenger', subject: 'Challenger', split_percent: 50, is_control: false },
        ],
      },
      recipients: [
        { id: 1, generated_content_id: 10, experiment_id: 'exp_1', variant_id: 'var_control', variant_key: 'control', account_name: 'Acme', persona_name: null, to_email: 'a@x.com', status: 'sent', error_message: null, provider_message_id: 'm1', hubspot_engagement_id: null, email_log_id: 1, attempted_at: null, sent_at: null, created_at: new Date() },
        { id: 2, generated_content_id: 10, experiment_id: 'exp_1', variant_id: 'var_challenger', variant_key: 'challenger', account_name: 'Acme', persona_name: null, to_email: 'b@x.com', status: 'failed', error_message: 'smtp', provider_message_id: null, hubspot_engagement_id: null, email_log_id: null, attempted_at: null, sent_at: null, created_at: new Date() },
        { id: 3, generated_content_id: 11, experiment_id: null, variant_id: null, variant_key: null, account_name: 'Beta', persona_name: null, to_email: 'c@x.com', status: 'skipped', error_message: null, provider_message_id: null, hubspot_engagement_id: null, email_log_id: null, attempted_at: null, sent_at: null, created_at: new Date() },
      ],
    });

    const res = await GET(
      new NextRequest('http://localhost/api/email/send-jobs/42'),
      { params: Promise.resolve({ id: '42' }) },
    );
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.recipientCounts).toEqual({ sent: 1, failed: 1, skipped: 1 });
    expect(payload.generatedContentIds).toEqual([10, 11]);
    expect(payload.variantCounts).toEqual({ control: 1, challenger: 1, none: 1 });
  });
});
