import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';
process.env.SOURCE_APPROVAL_GATE_ENABLED = 'true';

const mockedSendEmail = vi.fn();
const mockedSendBulk = vi.fn();
const mockedRateLimit = vi.fn(() => ({ ok: true, remaining: 10 }));
const mockedRequiresApprovalForSend = vi.fn(async () => ({ approved: true, status: 'approved', reviewId: 'mer_1' }));
const mockedRecordSourceBackedMetric = vi.fn(async () => undefined);
const mockedEnforceOneAccountInvariant = vi.fn(async ({ cc }: { cc?: string[] }) => ({
  ok: true,
  canonicalAccountName: 'Acme Foods',
  scopedAccountNames: ['Acme Foods'],
  normalizedCc: cc ?? [],
}));
const mockedPrisma = {
  prisma: {
    unsubscribedEmail: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    emailLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    generatedContent: {
      findUnique: vi.fn(),
      update: vi.fn(() => ({ catch: vi.fn() })),
    },
    account: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    persona: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    canonicalContact: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    canonicalAccountLink: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    canonicalConflict: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    canonicalCompany: {
      upsert: vi.fn(),
    },
    accountContactCandidate: {
      findMany: vi.fn(),
    },
    systemConfig: {
      upsert: vi.fn(),
    },
    sendJobRecipient: {
      findMany: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
};
mockedPrisma.prisma.$transaction.mockImplementation(async (callback: (tx: typeof mockedPrisma.prisma) => Promise<unknown>) => callback(mockedPrisma.prisma));

vi.mock('@/lib/rate-limit', () => ({ rateLimit: mockedRateLimit }));
vi.mock('@/lib/email/client', () => ({ sendEmail: mockedSendEmail, sendBulk: mockedSendBulk }));
vi.mock('@/lib/prisma', () => mockedPrisma);
vi.mock('@/lib/revops/generated-content-approval', () => ({ requiresApprovalForSend: mockedRequiresApprovalForSend }));
vi.mock('@/lib/revops/one-account-invariant', () => ({ enforceOneAccountInvariant: mockedEnforceOneAccountInvariant }));
vi.mock('@/lib/source-backed/metrics', () => ({ recordSourceBackedMetric: mockedRecordSourceBackedMetric }));

const { POST: sendPOST } = await import('@/app/api/email/send/route');
const { POST: sendBulkPOST } = await import('@/app/api/email/send-bulk/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockedRequiresApprovalForSend.mockResolvedValue({ approved: true, status: 'approved', reviewId: 'mer_1' });
  mockedEnforceOneAccountInvariant.mockResolvedValue({
    ok: true,
    canonicalAccountName: 'Acme Foods',
    scopedAccountNames: ['Acme Foods'],
    normalizedCc: [],
  });
  mockedPrisma.prisma.sendJobRecipient.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.emailLog.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.persona.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.account.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.canonicalContact.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.canonicalAccountLink.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.canonicalConflict.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.accountContactCandidate.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.generatedContent.findUnique.mockResolvedValue({
    id: 99,
    account_name: 'Acme Foods',
    campaign: { campaign_type: 'trade_show' },
    checklist_state: { completed_item_ids: ['clear_value_prop', 'account_specific_proof', 'cta_specific', 'compliance_checked', 'deliverability_checked'] },
  });
});

describe('Email send API', () => {
  it('blocks an explicitly unsubscribed recipient in single send', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([{ email: 'blocked@example.com' }]);

    const body = JSON.stringify({
      to: 'blocked@example.com',
      subject: 'Test subject',
      bodyHtml: 'Hello',
    });
    const req = new NextRequest('http://localhost/api/email/send', {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendPOST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe('UNSUBSCRIBED');
    expect(payload.code).toBe('UNSUBSCRIBED');
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('sends when the recipient is not unsubscribed', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([]);
    mockedSendEmail.mockResolvedValue({ headers: { 'x-message-id': 'abc123' }, provider: 'gmail' });
    mockedPrisma.prisma.account.findUnique.mockResolvedValue(null);
    mockedPrisma.prisma.emailLog.create.mockResolvedValue({});

    const body = JSON.stringify({
      to: 'alice@example.com',
      subject: 'Test send',
      bodyHtml: 'Hello there',
    });
    const req = new NextRequest('http://localhost/api/email/send', {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendPOST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.prisma.emailLog.create).toHaveBeenCalled();
    expect(mockedPrisma.prisma.generatedContent.update).not.toHaveBeenCalled();
  });

  it('increments generated content send count for single one-pager sends', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([]);
    mockedSendEmail.mockResolvedValue({ headers: { 'x-message-id': 'abc123' }, provider: 'gmail' });
    mockedPrisma.prisma.account.findUnique.mockResolvedValue(null);
    mockedPrisma.prisma.emailLog.create.mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        to: 'alice@example.com',
        subject: 'Test send',
        bodyHtml: 'Hello there',
        generatedContentId: 42,
      }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendPOST(req);

    expect(res.status).toBe(200);
    expect(mockedPrisma.prisma.emailLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ generated_content_id: 42 }),
    }));
    expect(mockedPrisma.prisma.generatedContent.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { external_send_count: { increment: 1 } },
    });
  });

  it('records approval-block telemetry when generated content is not approved', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([]);
    mockedRequiresApprovalForSend.mockResolvedValueOnce({
      approved: false,
      status: 'missing',
      reviewId: 'mer_missing',
    });

    const req = new NextRequest('http://localhost/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        to: 'alice@example.com',
        subject: 'Test send',
        bodyHtml: 'Hello there',
        accountName: 'Acme Foods',
        generatedContentId: 99,
      }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendPOST(req);
    const payload = await res.json();

    expect(res.status).toBe(409);
    expect(payload.code).toBe('APPROVAL_REQUIRED');
    expect(mockedRecordSourceBackedMetric).toHaveBeenCalledWith(expect.objectContaining({
      metric: 'approval_blocks',
      endpoint: '/api/email/send',
    }));
  });

  it('records CC sanitization drops when CC includes primary recipient', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([]);
    mockedEnforceOneAccountInvariant.mockResolvedValueOnce({
      ok: true,
      canonicalAccountName: 'Acme Foods',
      scopedAccountNames: ['Acme Foods'],
      normalizedCc: ['alice@example.com', 'ops@example.com'],
    });
    mockedSendEmail.mockResolvedValue({ headers: { 'x-message-id': 'abc123' }, provider: 'gmail' });
    mockedPrisma.prisma.account.findUnique.mockResolvedValue(null);
    mockedPrisma.prisma.emailLog.create.mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        to: 'alice@example.com',
        cc: ['alice@example.com', 'ops@example.com'],
        subject: 'Test send',
        bodyHtml: 'Hello there',
        accountName: 'Acme Foods',
      }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendPOST(req);
    expect(res.status).toBe(200);
    expect(mockedSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'alice@example.com',
      cc: ['ops@example.com'],
    }));
    expect(mockedRecordSourceBackedMetric).toHaveBeenCalledWith(expect.objectContaining({
      metric: 'cc_sanitization_drops',
      endpoint: '/api/email/send',
      value: 1,
    }));
  });

  it('uses persona email when personaId is provided even if canonical identity is noisy', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([]);
    mockedSendEmail.mockResolvedValue({ headers: { 'x-message-id': 'abc123' }, provider: 'gmail' });
    mockedPrisma.prisma.account.findUnique.mockResolvedValue(null);
    mockedPrisma.prisma.emailLog.create.mockResolvedValue({});
    mockedPrisma.prisma.persona.findUnique.mockResolvedValue({
      id: 7,
      name: 'Alex Ops',
      email: 'alex@example.com',
      email_valid: true,
      do_not_contact: false,
      account_name: 'Acme Foods',
    });
    mockedPrisma.prisma.persona.findMany.mockResolvedValue([
      {
        id: 7,
        account_name: 'Acme Foods',
        name: 'Alex Ops',
        normalized_name: 'alex ops',
        email: 'alex@example.com',
        email_valid: true,
        company_domain: 'acme.com',
        hubspot_contact_id: null,
        do_not_contact: false,
        quality_score: 90,
      },
      {
        id: 8,
        account_name: 'Beta Foods',
        name: 'Alex Ops',
        normalized_name: 'alex ops',
        email: 'alex@example.com',
        email_valid: true,
        company_domain: 'beta.com',
        hubspot_contact_id: null,
        do_not_contact: false,
        quality_score: 88,
      },
    ]);
    mockedPrisma.prisma.accountContactCandidate.findMany.mockResolvedValue([
      {
        id: 16,
        account_name: 'Acme Foods',
        candidate_key: 'alex@example.com::vp-ops',
        full_name: 'Alex Ops',
        email: 'send@example.com',
        state: 'promoted',
        source: 'company_contacts',
        promoted_persona_id: 7,
        replaced_persona_id: null,
        deferred_reason: null,
      },
    ]);
    mockedPrisma.prisma.account.findMany.mockResolvedValue([
      { name: 'Acme Foods', hubspot_company_id: null },
      { name: 'Beta Foods', hubspot_company_id: null },
    ]);

    const req = new NextRequest('http://localhost/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        to: 'wrong@example.com',
        personaId: 7,
        subject: 'Test send',
        bodyHtml: 'Hello there',
      }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendPOST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'alex@example.com' }));
  });
});

describe('Bulk email send API', () => {
  it('skips unsubscribed recipients and sends to the rest', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([{ email: 'skip@example.com' }]);
    mockedSendBulk.mockResolvedValue([{ status: 'fulfilled', value: { headers: { 'x-message-id': 'bulk-1' } } }]);
    mockedPrisma.prisma.emailLog.create.mockResolvedValue({});

    const body = JSON.stringify({
      recipients: [
        { to: 'skip@example.com', readinessScore: 90, readinessTier: 'high', stale: false },
        { to: 'send@example.com', readinessScore: 90, readinessTier: 'high', stale: false },
      ],
      subject: 'Bulk subject',
      bodyHtml: 'Bulk send body',
      generatedContentId: 99,
    });
    const req = new NextRequest('http://localhost/api/email/send-bulk', {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendBulkPOST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.sent).toBe(1);
    expect(payload.failed).toBe(0);
    expect(payload.total).toBe(2);
    expect(payload.skipped).toEqual([
      { to: 'skip@example.com', reason: 'Recipient explicitly unsubscribed' },
    ]);
    expect(mockedSendBulk).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.prisma.emailLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ generated_content_id: 99 }),
    }));
    expect(mockedPrisma.prisma.generatedContent.update).toHaveBeenCalledWith({
      where: { id: 99 },
      data: { external_send_count: { increment: 1 } },
    });
  });

  it('returns a hard-block response when no bulk recipients remain sendable', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([{ email: 'skip@example.com' }]);

    const req = new NextRequest('http://localhost/api/email/send-bulk', {
      method: 'POST',
      body: JSON.stringify({
        recipients: [
          { to: 'skip@example.com', readinessScore: 90, readinessTier: 'high', stale: false },
        ],
        subject: 'Bulk subject',
        bodyHtml: 'Bulk send body',
        generatedContentId: 99,
      }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendBulkPOST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.code).toBe('NO_SENDABLE_RECIPIENTS');
    expect(payload.skipped).toEqual([
      { to: 'skip@example.com', reason: 'Recipient explicitly unsubscribed' },
    ]);
  });

  it('skips malformed recipient emails instead of failing the entire bulk payload', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([]);
    mockedSendBulk.mockResolvedValue([{ status: 'fulfilled', value: { headers: { 'x-message-id': 'bulk-2' } } }]);
    mockedPrisma.prisma.emailLog.create.mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/email/send-bulk', {
      method: 'POST',
      body: JSON.stringify({
        recipients: [
          { to: 'not-an-email', readinessScore: 20, readinessTier: 'low', stale: false },
          { to: 'send@example.com', readinessScore: 90, readinessTier: 'high', stale: false },
        ],
        subject: 'Bulk subject',
        bodyHtml: 'Bulk send body',
        generatedContentId: 99,
      }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendBulkPOST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.sent).toBe(1);
    expect(payload.failed).toBe(0);
    expect(payload.total).toBe(2);
    expect(payload.skipped).toEqual([
      { to: 'not-an-email', reason: 'Invalid recipient email address' },
    ]);
  });

  it('persists account-page workflow metadata on bulk sends for attribution', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findMany.mockResolvedValue([]);
    mockedSendBulk.mockResolvedValue([{ status: 'fulfilled', value: { headers: { 'x-message-id': 'bulk-3' } } }]);
    mockedPrisma.prisma.emailLog.create.mockResolvedValue({});
    mockedPrisma.prisma.persona.findMany.mockResolvedValue([
      {
        id: 7,
        name: 'Alex Ops',
        email: 'send@example.com',
        account_name: 'Acme Foods',
      },
    ]);
    mockedPrisma.prisma.accountContactCandidate.findMany.mockResolvedValue([
      {
        id: 16,
        account_name: 'Acme Foods',
        candidate_key: 'send@example.com::vp-ops',
        full_name: 'Alex Ops',
        email: 'send@example.com',
        state: 'promoted',
        source: 'company_contacts',
        promoted_persona_id: 7,
        replaced_persona_id: null,
        deferred_reason: null,
      },
    ]);

    const req = new NextRequest('http://localhost/api/email/send-bulk', {
      method: 'POST',
      body: JSON.stringify({
        recipients: [
          { to: 'send@example.com', personaId: 7, personaName: 'Alex Ops', readinessScore: 90, readinessTier: 'high', stale: false },
        ],
        subject: 'Bulk subject',
        bodyHtml: 'Bulk send body',
        accountName: 'Acme Foods',
        generatedContentId: 99,
        workflowMetadata: {
          surface: 'account_page',
          shell: 'account_outreach',
          variant: 'one_pager_asset',
          recipientSetKey: 'operators',
          selectedRecipientIds: [7],
          assetId: 99,
          assetVersion: 3,
        },
      }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await sendBulkPOST(req);

    expect(res.status).toBe(200);
    expect(mockedPrisma.prisma.emailLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        generated_content_id: 99,
        metadata: {
          workflow: expect.objectContaining({
            surface: 'account_page',
            shell: 'account_outreach',
            variant: 'one_pager_asset',
            recipientSetKey: 'operators',
            selectedRecipientIds: [7],
            assetId: 99,
            assetVersion: 3,
            details: expect.objectContaining({
              candidateTrace: expect.objectContaining({
                recipient: expect.objectContaining({
                  candidateId: 16,
                }),
              }),
            }),
          }),
          recipient: expect.objectContaining({
            personaId: 7,
            personaName: 'Alex Ops',
            readinessScore: 90,
            readinessTier: 'high',
            stale: false,
            candidateTrace: expect.objectContaining({
              candidateId: 16,
              state: 'promoted',
            }),
          }),
        },
      }),
    }));
  });
});
