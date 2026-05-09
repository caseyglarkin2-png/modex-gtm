import { describe, expect, it } from 'vitest';
import { buildMemoCoverLetter } from '@/lib/microsites/cover-letter';
import type {
  AccountMicrositeData,
  PersonProfile,
  PersonVariant,
  ProofBlock,
} from '@/lib/microsites/schema';

function makeAccount(overrides: Partial<AccountMicrositeData> = {}): AccountMicrositeData {
  return {
    slug: 'dannon',
    accountName: 'Dannon',
    vertical: 'cpg',
    tier: 'Tier 1',
    band: 'A',
    priorityScore: 95,
    pageTitle: 't',
    metaDescription: 'd',
    sections: [],
    people: [],
    personVariants: [],
    proofBlocks: [],
    network: {
      facilityCount: '13 plants',
      facilityTypes: ['Manufacturing'],
      geographicSpread: 'North American',
      dailyTrailerMoves: '500/day',
    },
    freight: {
      primaryModes: ['truckload'],
      avgLoadsPerDay: '650',
      detentionCost: '~$3.4M/yr est.',
    },
    signals: {
      urgencyDriver:
        'Post-Activia integration noise still showing up in plant-network handoffs.',
    },
    ...overrides,
  };
}

function makeVariant(overrides: Partial<PersonVariant> = {}): PersonVariant {
  const person: PersonProfile = {
    personaId: 'p-1',
    name: 'Dan Poland',
    firstName: 'Dan',
    lastName: 'Poland',
    title: 'VP Supply Chain',
    company: 'Dannon',
    roleInDeal: 'decision-maker',
    seniority: 'VP',
    function: 'Supply Chain',
  } as PersonProfile;

  return {
    person,
    fallbackLane: 'CSCO',
    label: 'Dan Poland — VP Supply Chain',
    variantSlug: 'dan-poland',
    framingNarrative: 'f',
    openingHook: 'o',
    stakeStatement: 's',
    toneShift: 't',
    kpiLanguage: ['detention', 'spotter overtime'],
    ...overrides,
  } as PersonVariant;
}

describe('buildMemoCoverLetter', () => {
  it('builds a generic cover letter when no person variant is provided', () => {
    const { subject, body } = buildMemoCoverLetter(makeAccount());
    expect(subject).toBe('Dannon yard layer — private analysis');
    expect(body.startsWith('Hi —')).toBe(true);
    expect(body).toContain('https://yardflow.ai/for/dannon');
    expect(body).not.toContain('?p=');
  });

  it('reader-aware mode: addresses the person by first name and uses ?p=', () => {
    const { subject, body } = buildMemoCoverLetter(makeAccount(), {
      variant: makeVariant(),
    });
    expect(subject).toBe('Dannon yard layer — private analysis');
    expect(body.startsWith('Dan —')).toBe(true);
    expect(body).toContain('https://yardflow.ai/for/dannon?p=dan-poland');
  });

  it('uses signals.urgencyDriver as the lead observation when present', () => {
    const { body } = buildMemoCoverLetter(makeAccount());
    expect(body).toContain('Post-Activia integration noise');
  });

  it('falls back to a network+mode-derived observation when urgency is missing', () => {
    const { body } = buildMemoCoverLetter(
      makeAccount({ signals: { urgencyDriver: undefined } }),
    );
    expect(body).toMatch(/13 plants.*truckload/);
  });

  it('avoids "AI cover letter" tells', () => {
    const { body } = buildMemoCoverLetter(makeAccount(), { variant: makeVariant() });
    // Tone smoke-test: forbid the worst offenders.
    expect(body).not.toMatch(/I hope this email finds you well/i);
    expect(body).not.toMatch(/I came across/i);
    expect(body).not.toMatch(/hop on a (call|quick chat)/i);
    expect(body).not.toMatch(/let me know a time/i);
    // No bullet points (markdown or unicode).
    expect(body).not.toMatch(/^[\-•·]\s/m);
  });

  it('prefers Primo Brands as the comparable when present in proofBlocks', () => {
    const proofBlock: ProofBlock = {
      type: 'metric',
      headline: 'Primo Brands deployment',
      stats: [{ label: 'Detention', value: '−31%' }],
      quote: { text: 'q', company: 'Primo Brands' },
    };
    const { body } = buildMemoCoverLetter(makeAccount({ proofBlocks: [proofBlock] }));
    expect(body).toContain('Primo Brands did');
  });

  it('falls back to a different proof block when Primo is absent', () => {
    const proofBlock: ProofBlock = {
      type: 'case-result',
      headline: 'Acme Beverages deployment',
      quote: { text: 'q', company: 'Acme Beverages' },
    };
    const { body } = buildMemoCoverLetter(makeAccount({ proofBlocks: [proofBlock] }));
    expect(body).toContain('Acme Beverages did');
    expect(body).not.toContain('Primo Brands');
  });

  it('uses the default comparable when no proof blocks are present', () => {
    const { body } = buildMemoCoverLetter(makeAccount({ proofBlocks: [] }));
    expect(body).toContain('Primo Brands did');
  });

  it('honors authorName + authorEmail overrides for the sign-off', () => {
    const { body } = buildMemoCoverLetter(makeAccount(), {
      authorName: 'Jamie',
      authorEmail: 'jamie@yardflow.example',
    });
    const signoffLines = body.trim().split('\n').slice(-2);
    expect(signoffLines).toEqual(['Jamie', 'jamie@yardflow.example']);
  });

  it('strips trailing slash from baseUrl override', () => {
    const { body } = buildMemoCoverLetter(makeAccount(), {
      baseUrl: 'https://staging.yardflow.example/',
    });
    expect(body).toContain('https://staging.yardflow.example/for/dannon');
    expect(body).not.toContain('yardflow.example//for');
  });

  it('appends a period to urgencyDriver if it lacks terminal punctuation', () => {
    const { body } = buildMemoCoverLetter(
      makeAccount({
        signals: { urgencyDriver: 'A driver without punctuation' },
      }),
    );
    expect(body).toContain('A driver without punctuation.');
  });

  it('keeps the cover letter inside a 110-180 word range', () => {
    const { body } = buildMemoCoverLetter(makeAccount(), { variant: makeVariant() });
    const words = body.split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(110);
    expect(words.length).toBeLessThanOrEqual(180);
  });
});
