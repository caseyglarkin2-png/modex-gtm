import type {
  AccountMicrositeData,
  CTASection,
  CTABlock,
  HeroSection,
  PersonProfile,
  PersonVariant,
  ProblemSection,
  ProofBlock,
  ProofSection,
  MicrositeSection,
} from '@/lib/microsites/schema';

const defaultCta: CTABlock = {
  type: 'meeting',
  headline: 'Book a network audit',
  subtext: 'Review the yard bottleneck and build the rollout plan.',
  buttonLabel: 'Book a Network Audit',
  calendarLink: 'https://calendar.google.com/calendar/u/0/appointments/schedules/example',
};

export function buildHeroSection(overrides: Partial<HeroSection> = {}): HeroSection {
  return {
    type: 'hero',
    sectionId: 'hero',
    narrativeRole: 'opener',
    headline: 'Your yards were not built for this volume.',
    subheadline: 'YardFlow standardizes the gate-to-dock protocol across the network.',
    accountCallout: '50 facilities, 4 temperature zones',
    backgroundTheme: 'dark',
    cta: defaultCta,
    ...overrides,
  };
}

export function buildProblemSection(overrides: Partial<ProblemSection> = {}): ProblemSection {
  return {
    type: 'problem',
    sectionId: 'problem',
    narrativeRole: 'problem',
    sectionLabel: 'The Hidden Constraint',
    headline: 'The yard is where consolidation breaks down',
    narrative: 'Trailer flow degrades before the dock team even knows there is a problem.',
    painPoints: [
      {
        headline: 'Dock contention compounds fast',
        description: 'Volume spikes create invisible queueing and dock conflicts.',
        kpiImpact: 'Higher dwell and detention',
      },
    ],
    ...overrides,
  };
}

export function buildProofSection(overrides: Partial<ProofSection> = {}): ProofSection {
  const block: ProofBlock = {
    type: 'metric',
    stats: [
      { value: '24', label: 'Facilities Live' },
      { value: '48-to-24', label: 'Truck Turn Minutes' },
    ],
  };

  return {
    type: 'proof',
    sectionId: 'proof',
    narrativeRole: 'proof',
    sectionLabel: 'Proof',
    headline: 'Measured results from live deployment',
    blocks: [block],
    ...overrides,
  };
}

export function buildCtaSection(overrides: Partial<CTASection> = {}): CTASection {
  return {
    type: 'cta',
    sectionId: 'cta',
    narrativeRole: 'cta',
    cta: defaultCta,
    closingLine: 'One conversation. A clear rollout path.',
    ...overrides,
  };
}

export function buildPersonProfile(overrides: Partial<PersonProfile> = {}): PersonProfile {
  return {
    personaId: 'fixture-001',
    name: 'Jordan Avery',
    firstName: 'Jordan',
    lastName: 'Avery',
    title: 'Vice President of Supply Chain',
    company: 'Fixture Foods',
    roleInDeal: 'decision-maker',
    seniority: 'VP',
    function: 'Supply Chain',
    ...overrides,
  };
}

export function buildPersonVariant(overrides: Partial<PersonVariant> = {}): PersonVariant {
  const person = overrides.person ?? buildPersonProfile();

  return {
    person,
    fallbackLane: 'ops',
    label: `${person.name} - operations`,
    variantSlug: 'jordan-avery',
    framingNarrative: 'This view speaks directly to the throughput and service-level risk Jordan owns.',
    openingHook: 'You cannot standardize throughput if every yard runs a different protocol.',
    stakeStatement: 'The cost of delay is hiding between the gate and the dock.',
    toneShift: 'Operator to operator. Lead with throughput and variance.',
    kpiLanguage: ['throughput', 'dwell', 'dock utilization'],
    ...overrides,
  };
}

export function buildAccountMicrositeFixture(
  overrides: Partial<AccountMicrositeData> = {},
): AccountMicrositeData {
  const people = overrides.people ?? [buildPersonProfile()];
  const personVariants = overrides.personVariants ?? [buildPersonVariant({ person: people[0] })];
  const sections: MicrositeSection[] = overrides.sections ?? [
    buildHeroSection(),
    buildProblemSection(),
    buildProofSection(),
    buildCtaSection(),
  ];

  return {
    slug: 'fixture-foods',
    accountName: 'Fixture Foods',
    parentBrand: 'Fixture Group',
    vertical: 'cpg',
    tier: 'Tier 1',
    band: 'A',
    priorityScore: 95,
    pageTitle: 'YardFlow for Fixture Foods',
    metaDescription: 'Fixture microsite for testing.',
    sections,
    people,
    personVariants,
    proofBlocks: buildProofSection().blocks,
    network: {
      facilityCount: '12',
      facilityTypes: ['Plants', 'Distribution Centers'],
      geographicSpread: 'US',
      dailyTrailerMoves: '500+',
    },
    freight: {
      primaryModes: ['Truckload'],
      avgLoadsPerDay: '120',
    },
    signals: {
      urgencyDriver: 'Peak season volume increases hidden yard costs.',
    },
    theme: {
      accentColor: '#06B6D4',
    },
    ...overrides,
  };
}