import { describe, expect, it } from 'vitest';
import { resolveReader } from '@/lib/microsites/reader-context';
import type { AccountMicrositeData, PersonProfile, PersonVariant } from '@/lib/microsites/schema';

function makePerson(overrides: Partial<PersonProfile> = {}): PersonProfile {
  return {
    personaId: 'p-1',
    name: 'Dan Poland',
    firstName: 'Dan',
    lastName: 'Poland',
    title: 'VP Supply Chain',
    function: 'Supply Chain',
    seniorityBand: 'VP',
    ...overrides,
  } as PersonProfile;
}

function makeVariant(overrides: Partial<PersonVariant> = {}): PersonVariant {
  return {
    person: makePerson(),
    fallbackLane: 'CSCO',
    label: 'Dan Poland — VP Supply Chain',
    variantSlug: 'dan-poland',
    framingNarrative: 'f',
    openingHook: 'o',
    stakeStatement: 's',
    toneShift: 't',
    kpiLanguage: ['detention'],
    ...overrides,
  } as PersonVariant;
}

function makeAccount(variants: PersonVariant[] = []): AccountMicrositeData {
  return {
    slug: 'campbells',
    accountName: "Campbell's",
    vertical: 'cpg',
    tier: 'Tier 1',
    band: 'A',
    priorityScore: 90,
    pageTitle: 't',
    metaDescription: 'd',
    sections: [],
    people: [],
    personVariants: variants,
    proofBlocks: [],
    network: {
      facilityCount: '20 plants',
      facilityTypes: ['Manufacturing'],
      geographicSpread: 'NA',
      dailyTrailerMoves: '500',
    },
    freight: { primaryModes: ['truckload'], avgLoadsPerDay: '500', detentionCost: '$2M' },
    signals: {},
  };
}

describe('resolveReader', () => {
  it('returns null when no ?p= is present', () => {
    expect(resolveReader(makeAccount([makeVariant()]), undefined)).toBeNull();
    expect(resolveReader(makeAccount([makeVariant()]), '')).toBeNull();
  });

  it('returns null for unknown person slugs (anti-selling default — degrade to universal)', () => {
    const data = makeAccount([makeVariant()]);
    expect(resolveReader(data, 'nope')).toBeNull();
  });

  it('case-insensitive match against variantSlug', () => {
    const data = makeAccount([makeVariant({ variantSlug: 'dan-poland' })]);
    const reader = resolveReader(data, 'Dan-Poland');
    expect(reader).not.toBeNull();
    expect(reader?.personSlug).toBe('dan-poland');
  });

  it('builds the eyebrow with name + title', () => {
    const data = makeAccount([
      makeVariant({
        person: makePerson({ name: 'Dan Poland', title: 'VP Supply Chain' }),
      }),
    ]);
    const reader = resolveReader(data, 'dan-poland');
    expect(reader?.eyebrow).toBe('Prepared for Dan Poland · VP Supply Chain');
  });

  it('takes the first value when ?p= is repeated', () => {
    const data = makeAccount([makeVariant()]);
    const reader = resolveReader(data, ['dan-poland', 'other-slug']);
    expect(reader?.variant.variantSlug).toBe('dan-poland');
  });

  it('drops eyebrow title when person.title is missing', () => {
    const data = makeAccount([
      makeVariant({
        person: makePerson({ name: 'Jamie Doe', title: undefined as unknown as string }),
      }),
    ]);
    const reader = resolveReader(data, 'dan-poland');
    expect(reader?.eyebrow).toBe('Prepared for Jamie Doe');
  });
});
