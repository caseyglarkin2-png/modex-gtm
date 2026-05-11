/**
 * UNFI (legacy SuperValu) — ABM Microsite Data
 * Quality Tier: B (probable PINC customer — SuperValu named in RFID.com + Daimler case study list)
 * Pitch shape: modernization
 */

import type { AccountMicrositeData } from '../schema';

export const unfi: AccountMicrositeData = {
  slug: 'unfi',
  accountName: 'UNFI',
  parentBrand: 'United Natural Foods, Inc.',
  vertical: 'grocery',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 80,

  pageTitle: 'YardFlow for UNFI - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across UNFI\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'unfi-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'UNFI',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain / Distribution',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'unfi-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'UNFI',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain / Distribution',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - UNFI',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'SuperValu was named in the PINC/Kaleris RFID customer list and the Daimler case study. UNFI\'s acquisition of SuperValu creates a strong modernization story: legacy SuperValu PINC yards plus UNFI\'s own large distribution network now need one standard. Verify active yards before asserting PINC usage.',
      openingHook: 'The SuperValu acquisition brought a legacy yard footprint into UNFI\'s distribution network. Here\'s what modernizing that looks like across the consolidated network.',
      stakeStatement: 'Legacy acquisition yards running different protocols from the UNFI core network is where the consolidation payback is still sitting uncaptured.',

      heroOverride: {
        headline: 'UNFI\'s SuperValu consolidation created a yard standardization opportunity across the combined network.',
        subheadline: 'Large wholesale grocery distribution network. Modernizing the legacy SuperValu yard footprint to one UNFI standard changes the throughput and detention math across the combined DC network.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Grocery distribution operator framing. Lead with consolidation modernization story. Verify active PINC yards in discovery.',
      kpiLanguage: ['network consolidation', 'dock throughput', 'truck turn time', 'detention cost', 'distribution center utilization'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '52 distribution centers across the US and Canada (down from 56 at Bushway\'s CSCO appointment in Dec 2021; count will be lower again by FY27 as consolidation continues)',
    facilityTypes: ['Distribution Centers', 'Wholesale Grocery Warehouses'],
    geographicSpread: 'North America (HQ: Providence, RI; serving ~30,000 customer locations; legacy SuperValu DCs concentrated in Midwest/Plains, legacy UNFI DCs on East and West coasts)',
    dailyTrailerMoves: 'High-volume — wholesale grocery distribution serving 30,000+ locations across natural/organic, conventional grocery, foodservice, and military channels; ~250,000+ SKUs across ambient, refrigerated, and frozen',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Private Fleet'],
    avgLoadsPerDay: 'High-volume — DC network serving supermarkets, natural food stores, and independents; 2025 closures (Fort Wayne IN Feb 2025, two Central region DCs) push more volume through fewer receiving facilities',
  },

  signals: {
    recentNews: [
      '52 DCs as of June 2024 (down from 56 at Bushway\'s CSCO appointment Dec 2021); further consolidation planned through FY27.',
      '2025 closures: Fort Wayne IN (Feb 2025) + two Central region consolidations; Sturtevant WI and Allentown PA closures in 2026.',
      'New capacity: Manchester PA opened Q1 FY25; Sarasota FL scheduled H1 FY26 — "fewer, larger, more automated" pattern.',
      'Bushway dual mandate (President Natural/Organic/Specialty/Fresh + CSCO) means supply chain decisions don\'t have to clear a separate commercial P&L sponsor.',
    ],
    urgencyDriver: 'The SuperValu acquisition brought PINC RFID-generation yard tooling into the network overnight alongside UNFI\'s own DC footprint. Each DC closure forces a yard-protocol decision at the receiving facility — inbound trailer pools change shape with every consolidation event. A network-level yard operating standard is the modernization layer that makes the "fewer, larger, more automated" DC strategy actually deliver its throughput promise.',
  },

  theme: {
    accentColor: '#007A33',
  },
};
