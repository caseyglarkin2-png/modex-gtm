/**
 * Boston Beer Company — ABM Microsite Data
 * Quality Tier: B (probable PINC customer — Boston Brewing named in HID/RFID.com PINC customer list)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const bostonBeerCompany: AccountMicrositeData = {
  slug: 'boston-beer-company',
  accountName: 'Boston Beer Company',
  parentBrand: 'Boston Beer Company',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 73,

  pageTitle: 'YardFlow for Boston Beer Company - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Boston Beer Company\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'boston-beer-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Operations',
      company: 'Boston Beer Company',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Operations / Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'boston-beer-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Operations',
        company: 'Boston Beer Company',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Operations / Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'VP Operations - Boston Beer Company',
      variantSlug: 'vp-operations',

      framingNarrative: 'Boston Brewing is named in the HID/RFID.com PINC/Kaleris passive RFID customer list. Multi-site brewery and distribution network with production-yard complexity. Verify site history before PINC assertion — then use a production-yard modernization angle.',
      openingHook: 'Boston Beer\'s multi-site brewery network runs the same production-yard complexity as the largest beverage manufacturers. Here\'s what one operating standard changes.',
      stakeStatement: 'Production-yard variance at a multi-site brewery compounds into schedule slippage, carrier detention, and dock contention — at every site that runs a different protocol.',

      heroOverride: {
        headline: 'Boston Beer Company\'s brewery network is ready for a production-yard standardization conversation.',
        subheadline: 'Multi-site brewery and distribution. One yard operating standard across gate, dock, and driver journey standardizes throughput and reduces detention across the network.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Beverage manufacturing operator framing. Verify PINC site history before naming it in outreach.',
      kpiLanguage: ['production-yard throughput', 'truck turn time', 'detention cost', 'dock utilization', 'network variance'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '4 company-owned breweries (Breinigsville/Fogelsville PA, Cincinnati OH, Jamaica Plain Boston MA, Milton DE Dogfish Head) + contract brewing via City Brewing (LaCrosse WI, Memphis TN, Latrobe PA, Irwindale CA)',
    facilityTypes: ['Breweries', 'Contract Brewing Sites'],
    geographicSpread: 'North America (HQ: Boston, MA; largest brewery: Breinigsville/Fogelsville PA; Cincinnati OH; Milton DE; City Brewing contract sites)',
    dailyTrailerMoves: 'High-volume — 95% internal production in Q1 2026 (up from 85%), increasing PA and Cincinnati yard load; three-tier alcoholic beverage distribution mandates wholesaler-to-retailer flow',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL'],
    avgLoadsPerDay: 'High-volume — Sam Adams, Twisted Tea, Truly, Angry Orchard, Dogfish Head, Hard MTN Dew, Sun Cruiser brand mix; distributor inventory at 4.5 weeks on hand at end of Q1 2026',
    specialRequirements: ['Three-tier distribution (alcoholic beverage law mandate)', 'Glass + aluminum + can SKU mix', 'Wholesaler appointment cadence differs from direct-DC CPG patterns'],
  },

  signals: {
    recentNews: [
      'Phil Savastano promoted to CSCO October 20, 2025 — new CSCO window is the highest-leverage timing for a vendor pitch.',
      'Q1 2026: 95% internal production (up from 85%), gross margin +100 bps from procurement + brewery efficiencies.',
      'City Brewing (LaCrosse WI, Memphis TN, Latrobe PA, Irwindale CA) contract brewing relationships add multi-site yard coordination.',
    ],
    urgencyDriver: 'Boston Beer shifted from 85% to 95% internal production in Q1 2026 — more volume moving through PA and Cincinnati yards that were sized for a different brand and SKU mix. A CSCO who came up running the PA brewery for 18 months knows exactly what the yard looks like from the floor; the conversation starts at the operating-model level, not the category-introduction level.',
  },

  theme: {
    accentColor: '#8B1A1A',
  },
};
