/**
 * Kimberly-Clark — ABM Microsite Data
 * Quality Tier: B (probable PINC customer — named in 2009 Yard Hound press release; manual review required)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const kimberlyClark: AccountMicrositeData = {
  slug: 'kimberly-clark',
  accountName: 'Kimberly-Clark',
  parentBrand: 'Kimberly-Clark Corporation',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 78,

  pageTitle: 'YardFlow for Kimberly-Clark - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Kimberly-Clark\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'kimberly-clark-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'Kimberly-Clark',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'kimberly-clark-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'Kimberly-Clark',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - Kimberly-Clark',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'Kimberly-Clark appears in legacy PINC client lists from 2009. A global CPG manufacturing and distribution network of this size accumulates yard variance at scale. Verify active footprint before naming PINC in outreach.',
      openingHook: 'Kimberly-Clark\'s distributed CPG network is the right profile for a network standardization conversation — starting with the highest-volume facilities.',
      stakeStatement: 'Legacy PINC deployment or not, a global manufacturing network without one yard operating standard is leaving throughput and detention money on the table at every site.',

      heroOverride: {
        headline: 'Kimberly-Clark\'s CPG network is ready for a yard standardization conversation.',
        subheadline: 'Global manufacturing and distribution footprint. One yard operating standard changes dock utilization, detention spend, and driver throughput across the network.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'CPG operator framing. Lead with network-level impact. Verify PINC footprint in discovery before naming legacy tools.',
      kpiLanguage: ['network standardization', 'truck turn time', 'detention cost', 'dock utilization', 'gate-to-dock cycle'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '~15–20 North America manufacturing facilities (Personal Care + Consumer Tissue + K-C Professional); ~50 globally [~15–20 NA figure reflects post-Powering Care closures; public estimate]',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'North America (HQ: Irving, TX; key plants in Beech Island SC, Mobile AL, Loudon TN, Owensboro KY, Maumelle AR)',
    dailyTrailerMoves: 'High-volume — K-C\'s cube-heavy products (diapers, tissue, feminine care) move in far more trailers per ton than tonnage-heavy peers; yard turn-time savings compound harder here',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'High-volume — cube-heavy outbound (diapers cube out at ~25–30% of weight limit); heavy inbound pulp and recycled fiber by rail and truck to tissue mills',
  },

  signals: {
    recentNews: [
      'Powering Care restructuring: Marinette WI mill closures (Cold Spring and Lakeview) announced; volume consolidating into surviving facilities.',
      'International Personal Care spin-off announced 2024, executing 2025–2026 — NA-focused entity will have more visible yard KPIs, not fewer.',
      'HQ relocated Neenah WI → Irving TX in 2023–2024.',
    ],
    urgencyDriver: 'The Powering Care consolidation is loading more trailers through surviving K-C yards right now. Facilities absorbing Marinette volume are running the same dock layout with higher throughput demand. The cube-heavy product mix (diapers, tissue) means yard turn-time savings at K-C compound faster than at food-CPG peers at the same revenue scale.',
  },

  theme: {
    accentColor: '#005EB8',
  },
};
