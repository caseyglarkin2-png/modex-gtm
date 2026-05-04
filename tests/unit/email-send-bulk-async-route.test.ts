import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  generatedContent: {
    findMany: vi.fn(),
  },
  emailLog: {
    findMany: vi.fn(),
  },
  sendJobRecipient: {
    findMany: vi.fn(),
  },
  experiment: {
    create: vi.fn(),
  },
  sendJob: {
    create: vi.fn(),
  },
  activity: {
    create: vi.fn(),
  },
};

const mockedRateLimit = vi.fn();
const mockedEnforceApprovalGate = vi.fn<(
  ...args: unknown[]
) => Promise<{ allowed: boolean; policy: { required: boolean }; approval?: { id: string } }>>(
  async () => ({ allowed: true, policy: { required: false } }),
);

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: mockedRateLimit }));
vi.mock('@/lib/revops/send-approvals', () => ({ enforceSendApprovalGate: mockedEnforceApprovalGate }));

const { POST } = await import('@/app/api/email/send-bulk-async/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockedRateLimit.mockReturnValue({ ok: true });
  mockedEnforceApprovalGate.mockResolvedValue({ allowed: true, policy: { required: false } });
  mockedPrisma.emailLog.findMany.mockResolvedValue([]);
  mockedPrisma.sendJobRecipient.findMany.mockResolvedValue([]);
  mockedPrisma.activity.create.mockResolvedValue({ id: 1 });
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
      {
        id: 10,
        campaign_id: 7,
        account_name: 'Acme Foods',
        version_metadata: {},
        campaign: { campaign_type: 'trade_show' },
        checklist_state: { completed_item_ids: ['clear_value_prop', 'account_specific_proof', 'cta_specific', 'compliance_checked', 'deliverability_checked'] },
      },
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
          recipients: [
            { to: 'OPS@ACME.COM', readinessScore: 90, readinessTier: 'high', stale: false },
            { to: 'ops@acme.com', readinessScore: 90, readinessTier: 'high', stale: false },
          ],
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
        send_strategy: expect.any(Object),
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

  it('creates experiment variants and persists assignments on recipients', async () => {
    mockedPrisma.generatedContent.findMany.mockResolvedValue([
      {
        id: 10,
        campaign_id: 7,
        account_name: 'Acme Foods',
        version_metadata: {},
        campaign: { campaign_type: 'trade_show' },
        checklist_state: { completed_item_ids: ['clear_value_prop', 'account_specific_proof', 'cta_specific', 'compliance_checked', 'deliverability_checked'] },
      },
    ]);
    mockedPrisma.experiment.create.mockResolvedValue({
      id: 'exp_1',
      primary_metric: 'reply_rate',
      variants: [
        { id: 'var_control', variant_key: 'control', subject: 'Control {{account}}', opening: 'Control opening', cta: 'Control cta' },
        { id: 'var_challenger', variant_key: 'challenger', subject: 'Challenger {{account}}', opening: 'Challenger opening', cta: 'Challenger cta' },
      ],
    });
    mockedPrisma.sendJob.create.mockResolvedValue({
      id: 402,
      status: 'pending',
      total_recipients: 2,
      created_at: new Date('2026-05-04T00:00:00.000Z'),
    });

    const req = new NextRequest('http://localhost/api/email/send-bulk-async', {
      method: 'POST',
      body: JSON.stringify({
        guardWarningsAcknowledged: true,
        requestedBy: 'Casey',
        experiment: {
          name: 'Subject test',
          primaryMetric: 'reply_rate',
          split: { control: 50, challenger: 50 },
          variants: [
            { variantKey: 'control', subject: 'Control {{account}}', opening: 'Control opening', cta: 'Control cta', split: 50, isControl: true },
            { variantKey: 'challenger', subject: 'Challenger {{account}}', opening: 'Challenger opening', cta: 'Challenger cta', split: 50, isControl: false },
          ],
        },
        items: [{
          generatedContentId: 10,
          accountName: 'Acme Foods',
          subject: 'Fallback Subject',
          bodyHtml: '<p>Body</p>',
          recipients: [
            { to: 'ops1@acme.com', readinessScore: 92, readinessTier: 'high', stale: false },
            { to: 'ops2@acme.com', readinessScore: 88, readinessTier: 'high', stale: false },
          ],
        }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockedPrisma.experiment.create).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.sendJob.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        experiment_id: 'exp_1',
        primary_metric: 'reply_rate',
        recipients: {
          createMany: {
            data: expect.arrayContaining([
              expect.objectContaining({
                experiment_id: 'exp_1',
                variant_id: expect.any(String),
                variant_key: expect.any(String),
              }),
            ]),
          },
        },
      }),
    }));
  });

  it('rejects recipients below readiness floor', async () => {
    mockedPrisma.generatedContent.findMany.mockResolvedValue([
      {
        id: 10,
        campaign_id: 7,
        account_name: 'Acme Foods',
        version_metadata: {},
        campaign: { campaign_type: 'trade_show' },
        checklist_state: { completed_item_ids: ['clear_value_prop', 'account_specific_proof', 'cta_specific', 'compliance_checked', 'deliverability_checked'] },
      },
    ]);

    const req = new NextRequest('http://localhost/api/email/send-bulk-async', {
      method: 'POST',
      body: JSON.stringify({
        guardWarningsAcknowledged: true,
        items: [{
          generatedContentId: 10,
          accountName: 'Acme Foods',
          subject: 'Hi',
          bodyHtml: '<p>Hi</p>',
          recipients: [{ to: 'ops@acme.com', readinessScore: 40, readinessTier: 'low', stale: true }],
        }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('blocks when approval policy requires reviewer action', async () => {
    mockedPrisma.generatedContent.findMany.mockResolvedValue([
      {
        id: 10,
        campaign_id: 7,
        account_name: 'Acme Foods',
        version_metadata: {},
        campaign: { campaign_type: 'trade_show' },
        checklist_state: { completed_item_ids: ['clear_value_prop', 'account_specific_proof', 'cta_specific', 'compliance_checked', 'deliverability_checked'] },
      },
    ]);
    mockedEnforceApprovalGate.mockResolvedValue({
      allowed: false,
      policy: { required: true },
      approval: { id: 'sar_1' },
    });

    const req = new NextRequest('http://localhost/api/email/send-bulk-async', {
      method: 'POST',
      body: JSON.stringify({
        guardWarningsAcknowledged: true,
        items: [{
          generatedContentId: 10,
          accountName: 'Acme Foods',
          subject: 'Hi',
          bodyHtml: '<p>Hi</p>',
          recipients: [{ to: 'ops@acme.com', readinessScore: 92, readinessTier: 'high', stale: false }],
        }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
