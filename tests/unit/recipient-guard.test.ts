import { describe, it, expect } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { evaluateRecipientEligibility } from '@/lib/email/recipient-guard';

const dummyPrisma = {} as PrismaClient;

describe('recipient guard', () => {
  it('allows valid email domains', async () => {
    const result = await evaluateRecipientEligibility(dummyPrisma, 'alice@example.com');
    expect(result.ok).toBe(true);
    expect(result.domain).toBe('example.com');
  });

  it('rejects invalid email addresses without a domain', async () => {
    const result = await evaluateRecipientEligibility(dummyPrisma, 'bad-email');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Invalid email domain');
  });
});
