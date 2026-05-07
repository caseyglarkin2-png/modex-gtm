import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

process.env.CRON_SECRET = 'test-cron-secret';

const mockedPrisma = {
  sendJob: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  sendJobRecipient: {
    update: vi.fn(),
    findMany: vi.fn(),
  },
  emailLog: {
    create: vi.fn(),
  },
  generatedContent: {
    update: vi.fn(),
  },
  accountContactCandidate: {
    findMany: vi.fn(),
  },
};

const mockedSendEmail = vi.fn();
const mockedMarkCronStarted = vi.fn();
const mockedMarkCronSuccess = vi.fn();
const mockedMarkCronFailure = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/email/client', () => ({ sendEmail: mockedSendEmail }));
vi.mock('@/lib/cron-monitor', () => ({
  markCronStarted: mockedMarkCronStarted,
  markCronSuccess: mockedMarkCronSuccess,
  markCronFailure: mockedMarkCronFailure,
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const { GET } = await import('@/app/api/cron/process-send-jobs/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockedMarkCronStarted.mockResolvedValue(undefined);
  mockedMarkCronSuccess.mockResolvedValue(undefined);
  mockedMarkCronFailure.mockResolvedValue(undefined);
});

describe('process send jobs cron', () => {
  it('processes pending recipients and marks job partial on mixed outcomes', async () => {
    mockedPrisma.sendJob.findMany.mockResolvedValue([
      {
        id: 91,
        status: 'pending',
        send_strategy: {
          workflow: {
            surface: 'account_page',
            shell: 'account_outreach',
          },
        },
        recipients: [
          {
            id: 201,
            status: 'pending',
            to_email: 'ops@acme.com',
            subject: 'Subject',
            body_html: '<p>Body</p>',
            account_name: 'Acme Foods',
            campaign_id: 3,
            persona_name: 'Casey',
            generated_content_id: 10,
          },
          {
            id: 202,
            status: 'pending',
            to_email: 'vp@acme.com',
            subject: 'Subject',
            body_html: '<p>Body</p>',
            account_name: 'Acme Foods',
            campaign_id: 3,
            persona_name: 'Taylor',
            generated_content_id: 10,
          },
        ],
      },
    ]);

    mockedSendEmail
      .mockResolvedValueOnce({
        headers: { 'x-message-id': 'msg-1' },
        hubspotEngagementId: 'hs-1',
      })
      .mockRejectedValueOnce(new Error('SMTP timeout'));

    mockedPrisma.emailLog.create.mockResolvedValue({ id: 501 });
    mockedPrisma.sendJobRecipient.update.mockResolvedValue({});
    mockedPrisma.sendJobRecipient.findMany.mockResolvedValue([
      { status: 'sent' },
      { status: 'failed' },
    ]);
    mockedPrisma.generatedContent.update.mockResolvedValue({});
    mockedPrisma.accountContactCandidate.findMany.mockResolvedValue([
      {
        id: 88,
        account_name: 'Acme Foods',
        candidate_key: 'ops@acme.com::vp-ops',
        full_name: 'Casey',
        email: 'ops@acme.com',
        state: 'promoted',
        source: 'company_contacts',
        promoted_persona_id: 17,
        replaced_persona_id: null,
        deferred_reason: null,
      },
    ]);
    mockedPrisma.sendJob.update.mockResolvedValue({});

    const res = await GET(new NextRequest('http://localhost/api/cron/process-send-jobs?secret=test-cron-secret'));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.processed[0]).toEqual({
      jobId: 91,
      status: 'partial',
      sent: 1,
      failed: 1,
      skipped: 0,
    });
    expect(mockedPrisma.sendJob.update).toHaveBeenLastCalledWith({
      where: { id: 91 },
      data: expect.objectContaining({
        status: 'partial',
        sent_count: 1,
        failed_count: 1,
        skipped_count: 0,
      }),
    });
    expect(mockedPrisma.emailLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        metadata: {
          workflow: expect.objectContaining({
            surface: 'account_page',
            shell: 'account_outreach',
            details: expect.objectContaining({
              candidateTrace: expect.objectContaining({
                recipient: expect.objectContaining({
                  candidateId: 88,
                }),
              }),
            }),
          }),
          recipient: {
            sendJobRecipientId: 201,
            cc: [],
            candidateTrace: expect.objectContaining({
              candidateId: 88,
              state: 'promoted',
            }),
            ccCandidateTraces: [],
          },
        },
      }),
    }));
    expect(mockedSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ops@acme.com',
      cc: [],
    }));
    expect(mockedMarkCronSuccess).toHaveBeenCalled();
  });
});
