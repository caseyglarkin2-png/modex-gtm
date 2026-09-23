import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findSignalsForAccount,
  registerMany,
  registerSignal,
} from '@/lib/gap/signals/registry';
import type { ProjectionResult, ProspectingSignalInput } from '@/lib/gap/signals/projection';

/** Minimal prisma mock covering the surfaces the registry touches. */
function makePrisma() {
  return {
    prospectingSignal: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

function input(overrides: Partial<ProspectingSignalInput> = {}): ProspectingSignalInput {
  return {
    accountName: 'Acme Logistics',
    hubspotCompanyId: '123456',
    personaId: null,
    sourceKind: 'pounce_trigger',
    sourceId: '42',
    type: 'automation_program',
    title: 'Acme opens robotic yard in Ohio',
    summary: null,
    sourceType: 'public_secondary',
    evidenceUrl: 'https://news.example.com/acme',
    evidenceText: null,
    claimClass: null,
    externalOk: null,
    observedAt: new Date('2026-09-10T00:00:00.000Z'),
    confidence: 90,
    freshnessExpiresAt: new Date('2027-01-08T00:00:00.000Z'),
    metadata: { categories: ['autonomy'] },
    registeredBy: 'test-suite',
    ...overrides,
  };
}

describe('registerSignal', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('creates a row when (source_kind, source_id) is unseen and returns created:true', async () => {
    prisma.prospectingSignal.findUnique.mockResolvedValue(null);
    prisma.prospectingSignal.create.mockResolvedValue({ id: 'sig_new' });

    const out = await registerSignal(prisma, input());

    expect(out).toEqual({ created: true, id: 'sig_new' });
    expect(prisma.prospectingSignal.findUnique).toHaveBeenCalledWith({
      where: { source_kind_source_id: { source_kind: 'pounce_trigger', source_id: '42' } },
      select: { id: true },
    });
    expect(prisma.prospectingSignal.create).toHaveBeenCalledTimes(1);
    const data = prisma.prospectingSignal.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      account_name: 'Acme Logistics',
      hubspot_company_id: '123456',
      persona_id: null,
      source_kind: 'pounce_trigger',
      source_id: '42',
      type: 'automation_program',
      title: 'Acme opens robotic yard in Ohio',
      summary: null,
      source_type: 'public_secondary',
      evidence_url: 'https://news.example.com/acme',
      evidence_text: null,
      claim_class: null,
      external_ok: null,
      confidence: 90,
      metadata: { categories: ['autonomy'] },
      registered_by: 'test-suite',
    });
    expect(data.observed_at.toISOString()).toBe('2026-09-10T00:00:00.000Z');
    expect(data.freshness_expires_at.toISOString()).toBe('2027-01-08T00:00:00.000Z');
    // No camelCase leaks into the row.
    expect(Object.keys(data).some((k) => /[A-Z]/.test(k))).toBe(false);
  });

  it('second register of the same (source_kind, source_id) returns created:false and never creates', async () => {
    prisma.prospectingSignal.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'sig_1' });
    prisma.prospectingSignal.create.mockResolvedValue({ id: 'sig_1' });

    const first = await registerSignal(prisma, input());
    const second = await registerSignal(prisma, input({ title: 'a different title, same fact' }));

    expect(first).toEqual({ created: true, id: 'sig_1' });
    expect(second).toEqual({ created: false, id: 'sig_1' });
    expect(prisma.prospectingSignal.create).toHaveBeenCalledTimes(1);
  });

  it('an already-present row means create is called zero times', async () => {
    prisma.prospectingSignal.findUnique.mockResolvedValue({ id: 'sig_existing' });

    const out = await registerSignal(prisma, input());

    expect(out).toEqual({ created: false, id: 'sig_existing' });
    expect(prisma.prospectingSignal.create).toHaveBeenCalledTimes(0);
  });

  it('never updates or upserts (facts are frozen)', async () => {
    prisma.prospectingSignal.findUnique.mockResolvedValue({ id: 'sig_existing' });
    await registerSignal(prisma, input({ confidence: 5 }));
    prisma.prospectingSignal.findUnique.mockResolvedValue(null);
    prisma.prospectingSignal.create.mockResolvedValue({ id: 'sig_2' });
    await registerSignal(prisma, input({ sourceId: '43' }));

    expect(prisma.prospectingSignal.update).not.toHaveBeenCalled();
    expect(prisma.prospectingSignal.upsert).not.toHaveBeenCalled();
  });

  it('rejects a confidence outside 0..100 before touching the database', async () => {
    await expect(registerSignal(prisma, input({ confidence: 101 }))).rejects.toThrow(/confidence/);
    await expect(registerSignal(prisma, input({ confidence: -1 }))).rejects.toThrow(/confidence/);
    expect(prisma.prospectingSignal.findUnique).not.toHaveBeenCalled();
    expect(prisma.prospectingSignal.create).not.toHaveBeenCalled();
  });
});

describe('registerMany', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('counts created, existing and refused, and skips refusals without touching the database', async () => {
    prisma.prospectingSignal.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'sig_dup' })
      .mockResolvedValueOnce(null);
    prisma.prospectingSignal.create
      .mockResolvedValueOnce({ id: 'sig_a' })
      .mockResolvedValueOnce({ id: 'sig_c' });

    const results: ProjectionResult[] = [
      { ok: true, signal: input({ sourceId: 'a' }) },
      { ok: false, reason: 'dismissed_trigger' },
      { ok: true, signal: input({ sourceId: 'b' }) },
      { ok: false, reason: 'not_a_fact' },
      { ok: true, signal: input({ sourceId: 'c' }) },
    ];

    const out = await registerMany(prisma, results);

    expect(out).toEqual({
      created: 2,
      existing: 1,
      refused: [{ reason: 'dismissed_trigger' }, { reason: 'not_a_fact' }],
    });
    expect(prisma.prospectingSignal.findUnique).toHaveBeenCalledTimes(3);
    expect(prisma.prospectingSignal.create).toHaveBeenCalledTimes(2);
    expect(prisma.prospectingSignal.update).not.toHaveBeenCalled();
  });

  it('an empty batch is a no-op', async () => {
    expect(await registerMany(prisma, [])).toEqual({ created: 0, existing: 0, refused: [] });
    expect(prisma.prospectingSignal.findUnique).not.toHaveBeenCalled();
  });
});

describe('findSignalsForAccount', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
    prisma.prospectingSignal.findMany.mockResolvedValue([]);
  });

  it('by default returns every signal for the account, newest observation first', async () => {
    await findSignalsForAccount(prisma, 'Acme Logistics');
    expect(prisma.prospectingSignal.findMany).toHaveBeenCalledWith({
      where: { account_name: 'Acme Logistics' },
      orderBy: { observed_at: 'desc' },
    });
  });

  it('fresh:true filters to unexpired or never-expiring rows as of now', async () => {
    const now = new Date('2026-09-23T12:00:00.000Z');
    await findSignalsForAccount(prisma, 'Acme Logistics', { fresh: true, now });
    expect(prisma.prospectingSignal.findMany).toHaveBeenCalledWith({
      where: {
        account_name: 'Acme Logistics',
        OR: [{ freshness_expires_at: null }, { freshness_expires_at: { gt: now } }],
      },
      orderBy: { observed_at: 'desc' },
    });
  });

  it('returns the rows the database gives back', async () => {
    prisma.prospectingSignal.findMany.mockResolvedValue([{ id: 'sig_1' }]);
    expect(await findSignalsForAccount(prisma, 'Acme Logistics')).toEqual([{ id: 'sig_1' }]);
  });
});
