import { describe, it, expect, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { evaluateRecipientEligibility, isRoleMailbox, getEmailDomain } from '@/lib/email/recipient-guard';

// A minimal prisma stub: emailLog.count resolves to whatever the test needs for
// the bounce + frequency lookups. Default: no bounces, no recent sends.
function mockPrisma(counts: { bounce?: number; recent?: number; throws?: boolean } = {}): PrismaClient {
  return {
    emailLog: {
      count: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        if (counts.throws) throw new Error('db down');
        return where.bounce_type ? (counts.bounce ?? 0) : (counts.recent ?? 0);
      }),
    },
  } as unknown as PrismaClient;
}

describe('recipient guard', () => {
  it('allows a normal individual mailbox with no bounce and no recent sends', async () => {
    const result = await evaluateRecipientEligibility(mockPrisma(), 'alice@example.com');
    expect(result.ok).toBe(true);
    expect(result.domain).toBe('example.com');
  });

  it('rejects invalid email addresses without a domain', async () => {
    const result = await evaluateRecipientEligibility(mockPrisma(), 'bad-email');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Invalid email domain');
  });

  it('blocks role and machine mailboxes (never an individual)', async () => {
    for (const addr of ['info@acme.com', 'sales@acme.com', 'support@acme.com', 'no-reply@acme.com', 'postmaster@acme.com', 'careers@acme.com', 'sales.us@acme.com']) {
      const r = await evaluateRecipientEligibility(mockPrisma(), addr);
      expect(r.ok, addr).toBe(false);
      expect(r.reason, addr).toMatch(/role or shared mailbox/i);
    }
  });

  it('allows a named person even when the name contains a role-ish token', async () => {
    for (const addr of ['john.sales@acme.com', 'salesperson@acme.com', 'infante@acme.com', 'contactor@acme.com']) {
      const r = await evaluateRecipientEligibility(mockPrisma(), addr);
      expect(r.ok, addr).toBe(true);
    }
  });

  it('blocks a previously hard-bounced address', async () => {
    const r = await evaluateRecipientEligibility(mockPrisma({ bounce: 1 }), 'alice@example.com');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/hard.?bounced/i);
  });

  it('blocks when the per-person frequency cap is exceeded', async () => {
    const r = await evaluateRecipientEligibility(mockPrisma({ recent: 8 }), 'alice@example.com');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/frequency cap/i);
  });

  it('bypasses all checks for internal domains (trusted test/CC sends)', async () => {
    const r = await evaluateRecipientEligibility(mockPrisma({ bounce: 5, recent: 99 }), 'sales@freightroll.com');
    expect(r.ok).toBe(true);
  });

  it('fails OPEN on a database error (backstop, not the only gate)', async () => {
    const r = await evaluateRecipientEligibility(mockPrisma({ throws: true }), 'alice@example.com');
    expect(r.ok).toBe(true);
  });

  it('isRoleMailbox and getEmailDomain are exported and correct', () => {
    expect(getEmailDomain('a@b.com')).toBe('b.com');
    expect(isRoleMailbox('info')).toBe(true);
    expect(isRoleMailbox('john')).toBe(false);
  });
});
