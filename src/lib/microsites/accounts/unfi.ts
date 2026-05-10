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
    facilityCount: 'Large distribution network (see dossier)',
    facilityTypes: ['Distribution Centers', 'Wholesale Grocery Warehouses'],
    geographicSpread: 'North America (HQ: Providence, RI)',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Private Fleet'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'SuperValu named in HID/RFID.com PINC customer list and Kaleris Daimler case study. Verify active yards post-UNFI acquisition.',
    ],
    urgencyDriver: 'Modernization wedge — SuperValu/UNFI consolidation creates yard standardization story across combined distribution network.',
  },

  theme: {
    accentColor: '#007A33',
  },
};
