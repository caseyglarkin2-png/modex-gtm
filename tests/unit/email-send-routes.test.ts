import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';

const mockedSendEmail = vi.fn();
const mockedSendBulk = vi.fn();
const mockedRateLimit = vi.fn(() => ({ ok: true, remaining: 10 }));
const mockedEnforceApprovalGate = vi.fn(async () => ({ allowed: true, policy: { required: false } }));
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
vi.mock('@/lib/revops/send-approvals', () => ({ enforceSendApprovalGate: mockedEnforceApprovalGate }));

const { POST: sendPOST } = await import('@/app/api/email/send/route');
const { POST: sendBulkPOST } = await import('@/app/api/email/send-bulk/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockedEnforceApprovalGate.mockResolvedValue({ allowed: true, policy: { required: false } });
  mockedPrisma.prisma.sendJobRecipient.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.emailLog.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.persona.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.account.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.canonicalContact.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.canonicalAccountLink.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.canonicalConflict.findMany.mockResolvedValue([]);
  mockedPrisma.prisma.generatedContent.findUnique.mockResolvedValue({
    id: 99,
    campaign: { campaign_type: 'trade_show' },
    checklist_state: { completed_item_ids: ['clear_value_prop', 'account_specific_proof', 'cta_specific', 'compliance_checked', 'deliverability_checked'] },
  });
});

describe('Email send API', () => {
  it('blocks an explicitly unsubscribed recipient in single send', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findUnique.mockResolvedValue({ email: 'blocked@example.com' });

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
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('sends when the recipient is not unsubscribed', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findUnique.mockResolvedValue(null);
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
    mockedPrisma.prisma.unsubscribedEmail.findUnique.mockResolvedValue(null);
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

  it('uses persona email when personaId is provided even if canonical identity is noisy', async () => {
    mockedPrisma.prisma.unsubscribedEmail.findUnique.mockResolvedValue(null);
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
});
