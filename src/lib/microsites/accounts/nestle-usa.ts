/**
 * Nestle USA — ABM Microsite Data
 * Quality Tier: B (probable Kaleris customer — named in Daimler case study customer list)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const nestleUsa: AccountMicrositeData = {
  slug: 'nestle-usa',
  accountName: 'Nestle USA',
  parentBrand: 'Nestle',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 82,

  pageTitle: 'YardFlow for Nestle USA - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Nestle USA\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'nestle-usa-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'Nestle USA',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'nestle-usa-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'Nestle USA',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - Nestle USA',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'Nestle appears in the PINC/Kaleris customer list across a large distributed manufacturing and distribution network. The question is whether the current footprint is network-wide or site-specific — and whether the yard operating model has kept pace with the network.',
      openingHook: 'Nestle\'s network is a near-perfect YardFlow ICP. The conversation starts with what the yard looks like across your largest facilities.',
      stakeStatement: 'A large distributed network without one yard operating standard accumulates variance — in turn time, detention spend, and gate-to-dock cycle — across every site.',

      heroOverride: {
        headline: 'Nestle USA\'s network is the right size for a yard standardization conversation.',
        subheadline: 'Large distributed manufacturing and distribution network. One yard operating standard across every site changes the math on detention, dock utilization, and driver throughput.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Network-level framing. Verify PINC/Kaleris footprint in discovery before naming it in outreach.',
      kpiLanguage: ['network standardization', 'truck turn time', 'detention cost', 'dock utilization', 'gate-to-dock cycle'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '~20 U.S. factories across 28 states (frozen meals, frozen pizza, coffee, creamers, candy, beverages); Glendale AZ greenfield factory + DC opened mid-2024 as the 20th factory',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'North America (corp HQ: Arlington, VA; supply-chain HQ: Solon, OH; key plants in Jonesboro AR, Gaffney SC, Anderson IN, Glendale AZ, Suffolk VA)',
    dailyTrailerMoves: 'High-volume — modeled at the network level across 20 U.S. factories',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'High-volume — multi-temperature complexity: frozen (Stouffer\'s, DiGiorno, Hot Pockets), ambient (Coffee mate, Toll House), refrigerated (fresh creamers)',
  },

  signals: {
    recentNews: [
      'Gaffney SC $150M expansion announced Nov 2024 for Stouffer\'s, Hot Pockets, Lean Cuisine, Tombstone, CPK, Jack\'s, DiGiorno.',
      'Glendale AZ new $675M beverage factory + DC opened mid-2024 — net-new yard with SOP being defined now.',
      'Solon OH restructuring (216 layoffs Jan 2024) shifted production to Gaffney and Jonesboro — same dock surface, more trailers at surviving facilities.',
      'Nestlé Group SAP S/4HANA Cloud upgrade scaling to ~90% of 335 global factories; the yard between gate and dock is the data gap the digital core doesn\'t address.',
    ],
    urgencyDriver: 'Volume that left Solon in 2024 landed at Gaffney and Jonesboro — more trailers through the same dock surface at those sites. The Glendale AZ greenfield opened mid-2024 with SOPs still being defined. A network operating standard across 20 U.S. factories is the natural next step to the SAP S/4HANA digital core Nestlé is scaling globally.',
  },

  theme: {
    accentColor: '#009FDF',
  },
};
