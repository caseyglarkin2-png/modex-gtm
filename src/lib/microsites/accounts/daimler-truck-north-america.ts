/**
 * Daimler Truck North America — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — named case study PDF)
 * Pitch shape: modernization
 */

import type { AccountMicrositeData } from '../schema';

export const daimlerTruckNorthAmerica: AccountMicrositeData = {
  slug: 'daimler-truck-north-america',
  accountName: 'Daimler Truck North America',
  parentBrand: 'Daimler Truck',
  vertical: 'industrial',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 80,

  pageTitle: 'YardFlow for Daimler Truck North America - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Daimler Truck North America\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'daimler-truck-na-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Manufacturing',
      company: 'Daimler Truck North America',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Manufacturing / Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'daimler-truck-na-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Manufacturing',
        company: 'Daimler Truck North America',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Manufacturing / Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'VP Manufacturing - Daimler Truck North America',
      variantSlug: 'vp-manufacturing',

      framingNarrative: 'Daimler Truck proved RFID-based yard visibility via PINC/Kaleris and achieved a 50% reduction in yard drivers across the network. The modernization question is whether hardware-heavy visibility equals network orchestration.',
      openingHook: 'RFID in the yard tells you where trailers are. YardFlow tells you what happens next — at every gate, dock, and lane across the network.',
      stakeStatement: 'A 50% yard-driver reduction proves the yard matters. The next gain is in the orchestration layer RFID alone can\'t provide.',

      heroOverride: {
        headline: 'Daimler Truck proved yard visibility. YardFlow adds network orchestration.',
        subheadline: 'Your PINC/Kaleris deployment cut yard drivers by 50%. YardFlow standardizes the driver journey, dock assignment, and exception handling across every manufacturing site.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Manufacturing operator framing. Respect the existing RFID investment — position as orchestration layer on top of visibility, not replacement.',
      kpiLanguage: ['yard driver reduction', 'truck turn time', 'dock throughput', 'gate-to-dock cycle', 'operating cost per facility'],
    },
  ],

  proofBlocks: [
    {
      type: 'case-result',
      headline: 'Kaleris case study: Daimler achieved 50% reduction in yard drivers across the network',
      quote: {
        text: 'PINC/Kaleris passive RFID YMS implemented across hundreds of sites; Daimler Trucks achieved 50% reduction in yard drivers and lower operating costs.',
        company: 'Kaleris + HID/RFID.com case studies, 2025',
      },
    },
  ],

  network: {
    facilityCount: 'Multi-site manufacturing and parts network (see dossier)',
    facilityTypes: ['Manufacturing Plants', 'Parts Distribution Centers'],
    geographicSpread: 'North America (HQ: Portland, OR)',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Flatbed', 'Specialized/Heavy Haul', 'Parts LTL'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Named in Kaleris Daimler case study — RFID YMS across manufacturing network.',
      'Confirmed Kaleris customer; RTLS-is-not-orchestration wedge applies.',
    ],
    urgencyDriver: 'Modernization wedge — RFID/RTLS visibility versus true network workflow orchestration.',
  },

  theme: {
    accentColor: '#0078D4',
  },
};
