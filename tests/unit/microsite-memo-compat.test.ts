import { describe, expect, it } from 'vitest';
import {
  buildMemoSectionsFromAccount,
  isAccountHandTuned,
  isMemoSection,
  resolveMemoSections,
} from '@/lib/microsites/memo-compat';
import type { AccountMicrositeData } from '@/lib/microsites/schema';

function makeAccount(overrides: Partial<AccountMicrositeData> = {}): AccountMicrositeData {
  return {
    slug: 'test-account',
    accountName: 'Test Account',
    vertical: 'cpg',
    tier: 'Tier 1',
    band: 'B',
    priorityScore: 80,
    pageTitle: 'Test',
    metaDescription: 'Test',
    sections: [],
    people: [],
    personVariants: [],
    proofBlocks: [],
    network: {
      facilityCount: '47 plants',
      facilityTypes: ['Manufacturing', 'DC'],
      geographicSpread: 'North American',
      dailyTrailerMoves: '2,400/day',
    },
    freight: {
      primaryModes: ['truckload'],
      avgLoadsPerDay: '650',
      detentionCost: '~$3.4M/yr est.',
    },
    signals: {
      urgencyDriver: 'Network consolidation post-M&A pressuring throughput targets.',
    },
    ...overrides,
  };
}

describe('isMemoSection', () => {
  it('recognizes the 5 memo types and rejects legacy ones', () => {
    expect(isMemoSection({ type: 'yns-thesis' })).toBe(true);
    expect(
      isMemoSection({
        type: 'observation',
        headline: 'h',
        composition: [],
        hypothesis: 'h',
      }),
    ).toBe(true);
    expect(
      isMemoSection({
        type: 'hero',
        headline: 'h',
        subheadline: '',
        cta: { type: 'audit', headline: 'h', subtext: '', buttonLabel: 'b' },
      }),
    ).toBe(false);
  });
});

describe('isAccountHandTuned', () => {
  it('only returns true when needsHandTuning is explicitly false', () => {
    expect(isAccountHandTuned(makeAccount({ needsHandTuning: false }))).toBe(true);
    expect(isAccountHandTuned(makeAccount({ needsHandTuning: true }))).toBe(false);
    expect(isAccountHandTuned(makeAccount())).toBe(false); // omitted defaults to needs-tuning
  });
});

describe('buildMemoSectionsFromAccount', () => {
  it('always returns 5 sections in the canonical order', () => {
    const sections = buildMemoSectionsFromAccount(makeAccount());
    expect(sections.map((s) => s.type)).toEqual([
      'yns-thesis',
      'observation',
      'comparable',
      'methodology',
      'about',
    ]);
  });

  it('populates the observation composition from network + freight data', () => {
    const sections = buildMemoSectionsFromAccount(makeAccount());
    const observation = sections.find((s) => s.type === 'observation');
    expect(observation).toBeDefined();
    if (observation?.type !== 'observation') throw new Error('expected observation');
    const labels = observation.composition.map((c) => c.label);
    expect(labels).toContain('Facility footprint');
    expect(labels).toContain('Detention exposure');
  });

  it('uses the urgency-driver signal as the lead hypothesis sentence', () => {
    const sections = buildMemoSectionsFromAccount(
      makeAccount({
        signals: { urgencyDriver: 'Specific urgency message lifted from research.' },
      }),
    );
    const observation = sections.find((s) => s.type === 'observation');
    expect(observation?.type === 'observation' && observation.hypothesis).toMatch(
      /Specific urgency message lifted from research\./,
    );
  });

  it('falls back to a Primo-Brands comparable when no proof blocks are provided', () => {
    const sections = buildMemoSectionsFromAccount(makeAccount({ proofBlocks: [] }));
    const comparable = sections.find((s) => s.type === 'comparable');
    expect(comparable?.type === 'comparable' && comparable.comparableName).toBe('Primo Brands');
  });

  it('uses a matching ProofBlock as the comparable when one is present', () => {
    const sections = buildMemoSectionsFromAccount(
      makeAccount({
        proofBlocks: [
          {
            type: 'metric',
            headline: 'Pre/post deployment metrics',
            quote: { text: 'Real measured impact.', company: 'Acme Customer' },
            stats: [
              { label: 'Detention', value: '−31%', context: 'Pre-deployment baseline' },
              { label: 'Spotter OT', value: '−22%', context: 'Pre-deployment baseline' },
            ],
          },
        ],
      }),
    );
    const comparable = sections.find((s) => s.type === 'comparable');
    expect(comparable?.type === 'comparable' && comparable.comparableName).toBe('Acme Customer');
    expect(comparable?.type === 'comparable' && comparable.metrics).toHaveLength(2);
  });
});

describe('resolveMemoSections', () => {
  it('returns native memo sections when account already has 3+ memo entries', () => {
    const data = makeAccount({
      sections: [
        { type: 'yns-thesis' },
        { type: 'observation', headline: 'h', composition: [], hypothesis: 'h' },
        { type: 'methodology', headline: 'h', sources: [], unknowns: [] },
      ],
    });
    const resolved = resolveMemoSections(data);
    expect(resolved).toHaveLength(3);
    expect(resolved.every(isMemoSection)).toBe(true);
  });

  it('falls back to compat-built memo sections when fewer than 3 are present', () => {
    const data = makeAccount({
      sections: [{ type: 'yns-thesis' }],
    });
    const resolved = resolveMemoSections(data);
    expect(resolved).toHaveLength(5);
    expect(resolved[0].type).toBe('yns-thesis');
    expect(resolved[1].type).toBe('observation');
  });
});
