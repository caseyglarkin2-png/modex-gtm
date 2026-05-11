/**
 * DHL Supply Chain — ABM Microsite Data
 * Quality Tier: B (probable Kaleris customer — DHL/Exel named in Daimler case study list + RFID.com)
 * Pitch shape: partnership
 */

import type { AccountMicrositeData } from '../schema';

export const dhlSupplyChain: AccountMicrositeData = {
  slug: 'dhl-supply-chain',
  accountName: 'DHL Supply Chain',
  parentBrand: 'DHL Group',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 79,

  pageTitle: 'YardFlow for DHL Supply Chain - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across DHL Supply Chain\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'dhl-supply-chain-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Operations',
      company: 'DHL Supply Chain',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Operations',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'dhl-supply-chain-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Operations',
        company: 'DHL Supply Chain',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'VP Operations - DHL Supply Chain',
      variantSlug: 'vp-operations',

      framingNarrative: 'DHL/Exel appears in the PINC/Kaleris customer list via Daimler case study and RFID.com. A 3PL of this scale running fragmented yard protocols at hundreds of sites is leaving customer-facing network consistency on the table. Partnership angle: YardFlow as the yard standardization layer across DHL\'s customer network.',
      openingHook: 'DHL\'s customers measure consistency across every site. A unified yard operating standard is how you deliver that — and differentiate from commoditized 3PL alternatives.',
      stakeStatement: 'Every site that runs a different yard protocol is a customer satisfaction and margin risk. One standard across the network changes both.',

      heroOverride: {
        headline: 'DHL Supply Chain\'s network is ready for a yard standardization partnership.',
        subheadline: 'Very large global logistics network. YardFlow as the yard operating standard across DHL\'s customer-facing sites means consistent gate, dock, and driver journey performance — everywhere.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: '3PL partnership framing. Lead with customer-facing consistency, not internal cost reduction. Verify Exel-era PINC sites in discovery.',
      kpiLanguage: ['customer-facing consistency', 'on-time performance', 'gate-to-dock cycle', 'spotter productivity', 'network variance'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '1,000+ facilities globally; 52,000 NA associates (NA HQ Westerville OH)',
    facilityTypes: ['Contract Logistics Warehouses', 'Distribution Centers', 'Fulfillment Centers', 'Returns Processing Centers'],
    geographicSpread: 'Global; NA HQ Westerville OH; 2026 expansion: 10 new dedicated warehouse sites totaling 7M+ sq ft for data-center logistics',
    dailyTrailerMoves: 'High-volume — modeled at network level across 1,000+ global facilities',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal'],
    avgLoadsPerDay: 'High-volume — 500+ customer-facing engagements per year across consumer, retail, auto-mobility, life sciences, and technology verticals',
  },

  signals: {
    recentNews: [
      '2025 M&A buildout: Inmar Supply Chain Solutions (14 returns centers, Jan 2025), IDS Fulfillment (1.3M sq ft e-commerce DC space, May 2025), CRYOPDP specialty pharma courier (Mar 2025).',
      'DHL ReTurn Network (Oct 2025): 11 purpose-built multi-customer returns facilities — first publicly named multi-tenant network product.',
      '10 new dedicated warehouse sites totaling 7M+ sq ft for data-center logistics announced March 2026.',
      'Boston Dynamics MOU (May 2025): 1,000+ additional Stretch robots for global deployment.',
    ],
    urgencyDriver: 'DHL\'s customers measure consistency across every site. A 3PL managing 1,000+ facilities that each runs a different yard protocol is leaving customer-facing network consistency on the table. The yard standardization conversation for DHL is about differentiating the customer experience, not just reducing internal operating cost.',
  },

  theme: {
    accentColor: '#FFCC00',
  },
};
