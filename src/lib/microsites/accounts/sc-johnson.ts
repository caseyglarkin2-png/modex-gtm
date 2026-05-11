/**
 * SC Johnson — ABM Microsite Data
 * Quality Tier: C (possible PINC customer — seed account, no source-backed evidence yet)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const scJohnson: AccountMicrositeData = {
  slug: 'sc-johnson',
  accountName: 'SC Johnson',
  parentBrand: 'SC Johnson',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 65,

  pageTitle: 'YardFlow for SC Johnson - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across SC Johnson\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'sc-johnson-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'SC Johnson',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain / Manufacturing',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'sc-johnson-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'SC Johnson',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain / Manufacturing',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - SC Johnson',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'SC Johnson is a large private CPG enterprise with a distributed manufacturing network. No direct PINC/Kaleris source evidence yet — do not assert competitor usage in outreach. Lead with network standardization fit and manufacturing yard orchestration angle.',
      openingHook: 'SC Johnson\'s global household goods manufacturing network is a strong fit for a yard standardization conversation.',
      stakeStatement: 'A distributed private-enterprise manufacturing network without one yard operating standard accumulates untracked variance at every site.',

      heroOverride: {
        headline: 'SC Johnson\'s manufacturing network is ready for a yard standardization conversation.',
        subheadline: 'Distributed household goods manufacturing. One yard operating standard across gate, dock, and driver journey changes the network-wide math on throughput and detention.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'CPG manufacturing operator framing. Do not mention PINC/Kaleris until direct evidence is found.',
      kpiLanguage: ['manufacturing yard throughput', 'truck turn time', 'detention cost', 'dock utilization', 'network variance'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Waxdale (Sturtevant WI, 2.2M sq ft, world\'s largest single aerosol-producing facility, 60M cases/year) + Bay City MI (Ziploc, ~500 acres, 6 production buildings) + Brantford ON ($50M Glade expansion, Mar 2024) + Toluca MX + global plants',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'North America (HQ: Racine, WI; flagship plant: Sturtevant WI; Bay City MI; Brantford ON; Toluca MX) + global',
    dailyTrailerMoves: 'High-volume — Waxdale produces 60M cases/year; outbound includes hazmat-classified aerosols (DOT-regulated routing), cube-heavy home storage (Ziploc), and ambient liquid cleaners',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'High-volume — Waxdale\'s 430M aerosol cans/year and Bay City\'s billions of Ziploc bags create structurally high trailer counts for the revenue base; hazmat aerosol classification adds yard staging complexity',
    specialRequirements: ['DOT hazmat for aerosols (Glade, Raid, Off!, Pledge)', 'Cube-heavy home storage (Ziploc cubes out before weight limit)', 'Mixed hazmat + ambient + liquid outbound on shared yard surface'],
  },

  signals: {
    recentNews: [
      'Brantford ON $50M Glade investment announced March 2024 — expanding manufacturing + warehousing + distribution at the Canadian site.',
      'Bay City MI Ziploc hub recently added 56,000 sq ft; runs on 100% wind energy.',
      'Jamie Westfahl joined as Chief Procurement Officer January 2025 (ex-Molson Coors VP Procurement, $3.5B packaging responsibility) — new CPO-CSCO pairing within their first three years in seat.',
    ],
    urgencyDriver: 'SC Johnson\'s outbound trailer population is not uniform — hazmat aerosols, cube-heavy plastics, ambient liquid cleaners, and B2B Professional-channel loads share the same yard surface at Waxdale. That mixed-fleet yard problem is structurally harder to solve with per-site point tools than with a network operating standard that distinguishes trailer types across gate, dock, and staging.',
  },

  theme: {
    accentColor: '#00539C',
  },
};
