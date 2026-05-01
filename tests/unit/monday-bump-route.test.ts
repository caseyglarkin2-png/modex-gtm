import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.CRON_SECRET = 'cron-test-secret';

const mockedSendEmail = vi.fn();
const mockedRateLimit = vi.fn(() => ({ ok: true }));
const mockedMarkCronStarted = vi.fn(() => Promise.resolve());
const mockedMarkCronSkipped = vi.fn(() => Promise.resolve());
const mockedMarkCronSuccess = vi.fn(() => Promise.resolve());
const mockedMarkCronFailure = vi.fn(() => Promise.resolve());

const mockedPrisma = {
  emailLog: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

const mockPrismaClient = vi.fn(() => mockedPrisma);

vi.mock('@prisma/client', () => ({ PrismaClient: mockPrismaClient }));
vi.mock('@/lib/email/client', () => ({ sendEmail: mockedSendEmail }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: mockedRateLimit }));
vi.mock('@/lib/contact-standard', () => ({ firstNameFromEmail: (email: string) => email.split('@')[0] }));
vi.mock('@/lib/cron-monitor', () => ({
  markCronStarted: mockedMarkCronStarted,
  markCronSkipped: mockedMarkCronSkipped,
  markCronSuccess: mockedMarkCronSuccess,
  markCronFailure: mockedMarkCronFailure,
}));

const { POST } = await import('@/app/api/email/monday-bump/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Monday bump route', () => {
  it('includes yardflow.ai campaign recipients in eligibility', async () => {
    const campaignEmail = {
      id: 1,
      to_email: 'recipient@yardflow.ai',
      subject: 'Hello',
      account_name: 'Test Account',
      persona_name: 'Joe Example',
      provider_message_id: 'msg-123',
    };

    mockedPrisma.emailLog.findMany
      .mockResolvedValueOnce([campaignEmail])
      .mockResolvedValueOnce([]);
    mockedSendEmail.mockResolvedValue({ headers: { 'x-message-id': 'msg-123' } });

    const req = new NextRequest('http://localhost/api/email/monday-bump?dryRun=1', {
      method: 'POST',
      headers: { authorization: 'Bearer cron-test-secret' },
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(payload.mode).toBe('dry-run');
    expect(payload.found).toBe(1);
    expect(payload.eligible).toBe(1);
    expect(payload.sample.to).toBe('recipient@yardflow.ai');
  });
});
