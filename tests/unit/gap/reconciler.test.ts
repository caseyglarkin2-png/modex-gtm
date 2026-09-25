import { describe, expect, it, vi } from 'vitest';
import { reconcileBatch, reconcileOne, tallyByEngine, tallyByOutcome, type EngineEvidence, type ReconcilerDeps } from '@/lib/gap/execution/reconciler';

const NOW = new Date('2026-09-24T12:00:00.000Z');

function evidence(overrides: Partial<EngineEvidence> = {}): EngineEvidence {
  return {
    engine: 'hubspot_sequence',
    rawAccountName: 'Acme Logistics',
    contactEmail: 'Jane@Acme.com',
    engineEventId: 'evt_1',
    occurredAt: NOW,
    ...overrides,
  };
}

function deps(overrides: Partial<ReconcilerDeps> = {}): ReconcilerDeps {
  return {
    resolveIdentity: vi.fn(async () => ({ ok: true as const, accountName: 'Acme Logistics', via: 'normalized' as const, confidence: 100 })),
    findAlreadyImported: vi.fn(async () => null),
    findHypothesis: vi.fn(async () => ({ id: 'H1' })),
    findEnrollments: vi.fn(async () => [{ id: 'E1', hypothesis_id: 'H1' }]),
    ...overrides,
  };
}

describe('reconcileOne', () => {
  it('MATCHED: identity resolves, a hypothesis exists, exactly one enrollment matches the contact', async () => {
    const r = await reconcileOne(evidence(), deps());
    expect(r).toEqual({ engine: 'hubspot_sequence', engineEventId: 'evt_1', outcome: 'MATCHED', accountName: 'Acme Logistics', hypothesisId: 'H1', enrollmentId: 'E1' });
  });

  it('ALREADY_IMPORTED: this exact (engine, engineEventId) was reconciled before, and identity/hypothesis are never even looked up', async () => {
    const findAlreadyImported = vi.fn(async () => ({ id: 'E1', hypothesis_id: 'H1' }));
    const resolveIdentity = vi.fn();
    const r = await reconcileOne(evidence(), deps({ findAlreadyImported, resolveIdentity }));
    expect(r).toEqual({ engine: 'hubspot_sequence', engineEventId: 'evt_1', outcome: 'ALREADY_IMPORTED', accountName: null, hypothesisId: 'H1', enrollmentId: 'E1' });
    expect(resolveIdentity).not.toHaveBeenCalled();
  });

  it('IDENTITY_UNRESOLVED: 6A refuses unresolved_company', async () => {
    const resolveIdentity = vi.fn(async () => ({ ok: false as const, reason: 'unresolved_company' as const }));
    const r = await reconcileOne(evidence(), deps({ resolveIdentity }));
    expect(r).toEqual({ engine: 'hubspot_sequence', engineEventId: 'evt_1', outcome: 'IDENTITY_UNRESOLVED', accountName: null, hypothesisId: null, enrollmentId: null, detail: 'unresolved_company' });
  });

  it('AMBIGUOUS: 6A refuses ambiguous_identity, distinct from IDENTITY_UNRESOLVED', async () => {
    const resolveIdentity = vi.fn(async () => ({ ok: false as const, reason: 'ambiguous_identity' as const }));
    const r = await reconcileOne(evidence(), deps({ resolveIdentity }));
    expect(r.outcome).toBe('AMBIGUOUS');
  });

  it('HYPOTHESIS_MISSING: identity resolves but GAP never built a hypothesis for the account', async () => {
    const findHypothesis = vi.fn(async () => null);
    const findEnrollments = vi.fn();
    const r = await reconcileOne(evidence(), deps({ findHypothesis, findEnrollments }));
    expect(r).toEqual({ engine: 'hubspot_sequence', engineEventId: 'evt_1', outcome: 'HYPOTHESIS_MISSING', accountName: 'Acme Logistics', hypothesisId: null, enrollmentId: null });
    expect(findEnrollments).not.toHaveBeenCalled();
  });

  it('UNATTRIBUTED: a hypothesis exists but no enrollment explains this evidence', async () => {
    const findEnrollments = vi.fn(async () => []);
    const r = await reconcileOne(evidence(), deps({ findEnrollments }));
    expect(r).toEqual({ engine: 'hubspot_sequence', engineEventId: 'evt_1', outcome: 'UNATTRIBUTED', accountName: 'Acme Logistics', hypothesisId: 'H1', enrollmentId: null, detail: 'no_enrollment_found' });
  });

  it('UNATTRIBUTED, not a guess: more than one candidate enrollment never auto-picks one', async () => {
    const findEnrollments = vi.fn(async () => [{ id: 'E1', hypothesis_id: 'H1' }, { id: 'E2', hypothesis_id: 'H1' }]);
    const r = await reconcileOne(evidence(), deps({ findEnrollments }));
    expect(r.outcome).toBe('UNATTRIBUTED');
    expect(r.enrollmentId).toBeNull();
    expect(r.detail).toBe('ambiguous_enrollments:2');
  });

  it('contact email is lowercased before the enrollment lookup', async () => {
    const findEnrollments = vi.fn(async () => [{ id: 'E1', hypothesis_id: 'H1' }]);
    await reconcileOne(evidence({ contactEmail: 'Jane@Acme.com' }), deps({ findEnrollments }));
    expect(findEnrollments).toHaveBeenCalledWith('Acme Logistics', 'jane@acme.com');
  });
});

describe('reconcileBatch', () => {
  it('one dep throwing for one piece of evidence never stops the batch: it reports UNATTRIBUTED with the error, the rest proceed normally', async () => {
    const findHypothesis = vi.fn(async (accountName: string) => {
      if (accountName === 'Boom Co') throw new Error('db exploded');
      return { id: 'H1' };
    });
    const resolveIdentity = vi.fn(async (input: { rawName?: string | null }) => ({
      ok: true as const,
      accountName: input.rawName === 'Boom Co' ? 'Boom Co' : 'Acme Logistics',
      via: 'normalized' as const,
      confidence: 100,
    }));
    const results = await reconcileBatch(
      [evidence({ engineEventId: 'e1' }), evidence({ engineEventId: 'e2', rawAccountName: 'Boom Co' })],
      deps({ findHypothesis, resolveIdentity }),
    );
    expect(results[0].outcome).toBe('MATCHED');
    expect(results[1].outcome).toBe('UNATTRIBUTED');
    expect(results[1].detail).toContain('db exploded');
  });
});

describe('tallyByOutcome / tallyByEngine', () => {
  it('tallies every outcome key even at zero, and groups by engine', () => {
    const results = [
      { engine: 'hubspot_sequence' as const, engineEventId: 'e1', outcome: 'MATCHED' as const, accountName: 'A', hypothesisId: 'H1', enrollmentId: 'E1' },
      { engine: 'gmail_direct' as const, engineEventId: 'e2', outcome: 'HYPOTHESIS_MISSING' as const, accountName: 'B', hypothesisId: null, enrollmentId: null },
    ];
    expect(tallyByOutcome(results)).toEqual({ MATCHED: 1, ALREADY_IMPORTED: 0, UNATTRIBUTED: 0, IDENTITY_UNRESOLVED: 0, HYPOTHESIS_MISSING: 1, AMBIGUOUS: 0 });
    expect(tallyByEngine(results)).toEqual({
      hubspot_sequence: { MATCHED: 1, ALREADY_IMPORTED: 0, UNATTRIBUTED: 0, IDENTITY_UNRESOLVED: 0, HYPOTHESIS_MISSING: 0, AMBIGUOUS: 0 },
      gmail_direct: { MATCHED: 0, ALREADY_IMPORTED: 0, UNATTRIBUTED: 0, IDENTITY_UNRESOLVED: 0, HYPOTHESIS_MISSING: 1, AMBIGUOUS: 0 },
    });
  });
});
