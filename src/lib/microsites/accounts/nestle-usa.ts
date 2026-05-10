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
    facilityCount: 'Large distributed manufacturing and distribution network (see dossier)',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'North America (HQ: Arlington, VA)',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Named in Kaleris/PINC Daimler case study customer list — verify active footprint before outreach.',
    ],
    urgencyDriver: 'Network standardization wedge — confirm PINC/Kaleris footprint in discovery.',
  },

  theme: {
    accentColor: '#009FDF',
  },
};
