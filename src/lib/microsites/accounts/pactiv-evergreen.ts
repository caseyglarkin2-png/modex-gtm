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
    facilityCount: '~95+ combined manufacturing, warehousing, and distribution sites (Pactiv Evergreen: 50+ manufacturing facilities + 42 DCs; combined with Novolex post-April 2025 merger)',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers', 'Mixing Centers'],
    geographicSpread: 'North America (combined HQ: Charlotte, NC; major operating site: Lake Forest, IL; plants include Canandaigua NY, Aberdeen NC, Temple TX, Abilene TX, Bakersfield CA)',
    dailyTrailerMoves: 'High-volume — hub-and-spoke distribution model with regional mixing centers feeding downstream warehouses across ~95 sites',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal'],
    avgLoadsPerDay: 'High-volume — foodservice packaging (trays, containers, cups, cutlery) moving from 50+ manufacturing plants through 42 DCs to restaurant and retail customers',
  },

  signals: {
    recentNews: [
      'Novolex acquired Pactiv Evergreen in a $6.7B combination that closed April 1, 2025 — combined entity now has ~95+ sites, 20,000+ employees, 250+ brands, 39,000+ SKUs.',
      'Pactiv Evergreen PINC deployment documented at 12 facilities (coast-to-coast, per Oct 2019 PINC case study); Novolex legacy yard stack is unconfirmed — two yard operating models running in parallel.',
      'Plant closures: Canton NC (2023), Olmsted Falls OH (2023), Pine Bluff AR sold to Suzano (Oct 2024), Kalamazoo MI (April–June 2025).',
      'Whittington is Chief Transformation Officer at Novolex, running the IMO across the combined entity.',
    ],
    urgencyDriver: 'The Novolex combination created two yard operating models running in parallel across ~95 sites. The IMO\'s job over the next 24 months is to standardize operating SOPs across the combined footprint — yard execution is one of the highest-impact places to establish a single standard quickly, because it doesn\'t require re-engineering inside the plant.',
  },

  theme: {
    accentColor: '#1B6B3A',
  },
};
