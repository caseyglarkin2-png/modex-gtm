/**
 * Pactiv Evergreen — ABM Microsite Data
 * Quality Tier: B (probable PINC customer — job post references PINC in yard/dock/trailer context)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const pactivEvergreen: AccountMicrositeData = {
  slug: 'pactiv-evergreen',
  accountName: 'Pactiv Evergreen',
  parentBrand: 'Novolex / Pactiv Evergreen',
  vertical: 'industrial',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 72,

  pageTitle: 'YardFlow for Pactiv Evergreen - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Pactiv Evergreen\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'pactiv-evergreen-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'Pactiv Evergreen',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain / Manufacturing',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'pactiv-evergreen-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'Pactiv Evergreen',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain / Manufacturing',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - Pactiv Evergreen',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'Pactiv Evergreen runs 50+ manufacturing facilities and 42 distribution centers with a PINC operational signal from a Mooresville, NC warehouse role. A network this large with fragmented yard protocols accumulates variance at every site. Verify where PINC remains active before naming it in outreach.',
      openingHook: 'Pactiv Evergreen\'s 50+ manufacturing facilities and 42 distribution centers are the right size for a network yard standardization conversation.',
      stakeStatement: 'A manufacturing and packaging network this large without one yard operating standard is accumulating detention, dock contention, and turn-time variance at every site.',

      heroOverride: {
        headline: 'Pactiv Evergreen\'s 90+ facility network is ready for one yard operating standard.',
        subheadline: '50+ manufacturing facilities. 42 distribution centers. One yard protocol across gate, dock, trailer placement, and exception handling changes the network-wide math on detention and throughput.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Manufacturing operator framing. Lead with network scale and yard complexity. Verify PINC footprint in discovery.',
      kpiLanguage: ['trailer placement', 'dock setup', 'turn time', 'detention cost', 'network variance'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '50+ manufacturing facilities, 42 distribution centers',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'North America (HQ: Lake Forest, IL)',
    dailyTrailerMoves: 'see dossier',
    peakMultiplier: 'see dossier',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Mooresville, NC job post references PINC in yard management / trailer placement / dock setup context.',
      '50+ manufacturing facilities and 42 DCs confirmed via company profile.',
    ],
    urgencyDriver: 'Manufacturing yard orchestration wedge — verify PINC footprint; then standardize across network.',
  },

  theme: {
    accentColor: '#1B6B3A',
  },
};
