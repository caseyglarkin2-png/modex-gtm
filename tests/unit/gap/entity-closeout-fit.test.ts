/**
 * Final MMYQB queue review (2026-09-30): two production Scout verdicts were POTENTIAL DIRECT BUYER for an
 * association and a college. ASCM's one "operating claim" said it does NOT operate warehouses or yards; Bates
 * College's was a campus maintenance center. Stored verdicts are re-derived from the stored claims on read.
 */
import { describe, expect, it } from 'vitest';
import { deriveFit, operatingClaims } from '@/lib/gap/entity/fit';
import { loadCandidateQueue } from '@/lib/gap/entity/candidates';

describe('a negated claim is not operating evidence', () => {
  it.each([
    'ASCM discusses warehousing and yard management systems as part of supply-chain education content, but it does not operate warehouses or yards itself.',
    "The company doesn't run its own distribution centers.",
    'Acme no longer operates the Memphis terminal.',
  ])('%s', (c) => expect(operatingClaims([{ claim: c }])).toEqual([]));
  it('an affirmative claim still counts', () => expect(operatingClaims([{ claim: 'Acme operates 12 distribution centers across the US.' }])).toHaveLength(1));
});

describe('"other" needs corroboration, like an operator', () => {
  it('one cited claim for an unclassified organization is UNKNOWN, two are POTENTIAL', () => {
    expect(deriveFit({ entityType: 'other', operating: 1, ambiguous: false, what: 'A private liberal arts college.' })).toEqual({ fit: 'UNKNOWN', why: 'Unclassified, with one cited operating claim: confirm it runs freight facilities before judging fit.' });
    expect(deriveFit({ entityType: 'other', operating: 2, ambiguous: false, what: null }).fit).toBe('POTENTIAL_DIRECT_BUYER');
  });
});

describe('stored web Scout verdicts are re-derived on read', () => {
  it('ASCM stored POTENTIAL on a negated claim reads UNKNOWN today', async () => {
    const prisma = {
      gapWorkSourceMember: { findMany: async () => [{ company: 'Association for Supply Chain Management', title: 'Member', relationship_context: 'MMYQB subscriber', work_source: { id: 's1', name: 'MMYQB' } }] },
      gapAccountCandidate: { findMany: async () => [{ company: 'Association for Supply Chain Management', company_key: 'association for supply chain management', verdict: 'POTENTIAL_DIRECT_BUYER', entity_type: 'other', domain: 'ascm.org', scout: { basis: 'web', why: 'Unclassified, but runs freight facilities (1 cited operating claim).', what: 'A nonprofit offering supply-chain education.', network: [{ claim: 'ASCM discusses warehousing and yard management systems as part of supply-chain education content, but it does not operate warehouses or yards itself.', url: 'https://ascm.org/a.pdf' }], freight: [], unknowns: [] }, decision: 'open', scouted_at: new Date('2026-09-30') }] },
    };
    const q = await loadCandidateQueue(prisma, {});
    expect(q[0]).toMatchObject({ verdict: 'UNKNOWN', why: 'No cited freight operation found; what it runs is not established.' });
  });
});
