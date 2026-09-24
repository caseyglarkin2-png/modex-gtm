import { describe, expect, it, vi } from 'vitest';
import { assembleRoutingInputs } from '@/lib/gap/routing/inputs';
import { staticSuppressionReader } from '@/lib/gap/routing/suppression-read';

/**
 * 6A-T5: assembleRoutingInputs gets an OPTIONAL identity-resolution fallback
 * for when the exact account lookup misses. It is dependency-injected and
 * undefined by default, so every existing caller (and the ~900-line
 * routing-inputs.test.ts fixture suite) is byte-identical to before this
 * ticket: no dep given means no behavior change, proven by the first test
 * below with a minimal prisma stub that has no identity delegates at all.
 */

const NOW = new Date('2026-09-23T12:00:00.000Z');

function minimalPrisma(overrides: Record<string, unknown> = {}) {
  return {
    account: { findUnique: vi.fn(async () => null) },
    persona: { findUnique: vi.fn(async () => null) },
    ...overrides,
  };
}

describe('assembleRoutingInputs identity fallback (6A-T5)', () => {
  it('without a resolveAccountName dep, an unmatched name still skips account_not_found immediately (byte-identical default)', async () => {
    const prisma = minimalPrisma();
    const resolveAccountName = vi.fn();

    const result = await assembleRoutingInputs(prisma, {
      accountName: 'Niagara Bottling, Llc',
      personaId: 1,
      now: NOW,
      suppression: staticSuppressionReader('clear'),
    });

    expect(result).toEqual({ skip: 'account_not_found' });
    expect(resolveAccountName).not.toHaveBeenCalled();
    expect(prisma.account.findUnique).toHaveBeenCalledTimes(1);
  });

  it('with a resolveAccountName dep, a resolvable name is retried under its canonical spelling', async () => {
    const account = { name: 'Niagara Bottling', hubspot_company_id: null, pipeline_stage: 'targeted' };
    const persona = { id: 1, account_name: 'Niagara Bottling', do_not_contact: false, email: 'p@example.com' };
    let calls = 0;
    const prisma = minimalPrisma({
      account: {
        findUnique: vi.fn(async ({ where }: { where: { name: string } }) => {
          calls += 1;
          return where.name === 'Niagara Bottling' ? account : null;
        }),
      },
      persona: { findUnique: vi.fn(async () => persona) },
    });
    const resolveAccountName = vi.fn(async () => ({
      ok: true as const,
      accountName: 'Niagara Bottling',
      via: 'normalized' as const,
      confidence: 70,
    }));

    const result = await assembleRoutingInputs(
      prisma,
      { accountName: 'Niagara Bottling, Llc', personaId: 1, now: NOW, suppression: staticSuppressionReader('clear') },
      { resolveAccountName },
    );

    expect(resolveAccountName).toHaveBeenCalledWith(prisma, { rawName: 'Niagara Bottling, Llc' });
    expect(calls).toBe(2); // the original miss, then the retry under the resolved name
    expect(result).not.toEqual({ skip: 'account_not_found' });
  });

  it('with a resolveAccountName dep that itself refuses, still skips account_not_found (never throws)', async () => {
    const prisma = minimalPrisma();
    const resolveAccountName = vi.fn(async () => ({ ok: false as const, reason: 'unresolved_company' as const }));

    const result = await assembleRoutingInputs(
      prisma,
      { accountName: 'Nobody Has Heard Of This', personaId: 1, now: NOW, suppression: staticSuppressionReader('clear') },
      { resolveAccountName },
    );

    expect(result).toEqual({ skip: 'account_not_found' });
  });
});
