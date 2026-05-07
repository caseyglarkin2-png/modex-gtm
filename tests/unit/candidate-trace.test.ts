import { describe, expect, it, vi } from 'vitest';
import { buildCandidateTraceLookup, resolveCandidateTrace } from '@/lib/revops/candidate-trace';

describe('candidate trace lookup', () => {
  it('indexes candidate traces by scoped account and by email fallback', async () => {
    const prisma = {
      accountContactCandidate: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 7,
            account_name: 'Acme Foods',
            candidate_key: 'alex@example.com::ops',
            full_name: 'Alex Ops',
            email: 'alex@example.com',
            state: 'promoted',
            source: 'company_contacts',
            promoted_persona_id: 11,
            replaced_persona_id: null,
            deferred_reason: null,
          },
        ]),
      },
    } as unknown as Parameters<typeof buildCandidateTraceLookup>[0];

    const lookup = await buildCandidateTraceLookup(prisma, {
      accountNames: ['Acme Foods'],
      emails: ['alex@example.com'],
    });
    const scoped = resolveCandidateTrace(lookup, {
      email: 'alex@example.com',
      accountName: 'Acme Foods',
    });
    const fallback = resolveCandidateTrace(lookup, {
      email: 'alex@example.com',
      accountName: 'Other Account',
    });

    expect(scoped).toMatchObject({
      candidateId: 7,
      state: 'promoted',
    });
    expect(fallback).toMatchObject({
      candidateId: 7,
      fullName: 'Alex Ops',
    });
  });
});
