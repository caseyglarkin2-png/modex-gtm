/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Kraft Heinz is a confirmed PINC/Kaleris incumbent per the Kaleris–Kraft Heinz
 * Case Study (PDF, Jan 2025; kaleris.com/wp-content/uploads/2025/01/Kaleris-KraftHeinz-Case-Study.pdf)
 * and the Kaleris YMS Archives page. Specifics:
 *   - PINC relationship dates to 2006 at the Stockton, CA 24/7 mixing center (~20-year incumbent)
 *   - Rollout to 12 additional distribution facilities across six campus locations (2007–2009)
 *   - Cited wins: 50% reduction in truck and driver resources at pilot site; elimination of
 *     manual yard checks and overflow lots; reduction in demurrage and detention charges
 *   - Five man-hours per day of manual yard checks eliminated at the Stockton pilot site
 *
 * This intel powers the "displacement" cold-email framing (see
 * docs/research/flavio-torres-kraft-heinz-dossier.md and the cold-email kit at
 * docs/outreach/2026-q2-pinc-displacement-15-cold-emails.md). It must
 * not appear in any prospect-facing surface — including proofBlocks
 * which feed memo-compat's fallback comparable section.
 */

/**
 * Kraft Heinz — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — case study PDF)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const kraftHeinz: AccountMicrositeData = {
  slug: 'kraft-heinz',
  accountName: 'Kraft Heinz',
  parentBrand: 'The Kraft Heinz Company',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 89,

  pageTitle: 'YardFlow for Kraft Heinz - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Kraft Heinz\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'kraft-heinz-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'Kraft Heinz',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'kraft-heinz-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'Kraft Heinz',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - Kraft Heinz',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'Kraft Heinz moved from clipboard-and-spreadsheet yard management to Kaleris and proved 50% reduction in truck and driver resources. The question now is whether site-level YMS visibility is the same as a network operating model.',
      openingHook: 'You already ran the yard automation playbook at the site level. Here\'s what a network-wide standard changes.',
      stakeStatement: 'Demurrage, detention, and manual yard checks don\'t stop at one site — they compound across every facility that still runs its own protocol.',

      heroOverride: {
        headline: 'Kraft Heinz proved site-level yard automation. YardFlow closes the network gap.',
        subheadline: 'Your Kaleris deployment reduced truck and driver resources by 50% at the site level. YardFlow standardizes gate, dock, driver journey, and exceptions across the whole network.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Peer-to-peer operator framing. Acknowledge the existing Kaleris deployment — this is displacement from fragmented site tools to a network operating model.',
      kpiLanguage: ['truck turn time', 'detention cost', 'demurrage', 'dock utilization', 'driver resources'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '~30 U.S. plants (~70 globally); DeKalb IL automated DC (775,000 sq ft, opens 2027)',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'North America (dual HQ: Chicago, IL / Pittsburgh, PA; plants in Holland MI, Davenport IA, Stockton CA, DeKalb IL, Pittsburgh PA, and ~25 more U.S. sites)',
    dailyTrailerMoves: 'High-volume — modeled at the network level across 30 U.S. plants',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal'],
    avgLoadsPerDay: 'High-volume — distributed across ambient, refrigerated, and frozen product lines',
  },

  signals: {
    recentNews: [
      '$3B U.S. manufacturing modernization announced May 2025 — touches ~30 U.S. facilities.',
      'DeKalb IL automated DC ($400M, 775,000 sq ft) targets >60% of foodservice volume; opening 2027.',
      'Kraft Heinz Lighthouse (Microsoft control tower) is Torres\' signature digital initiative; yard network ops is the unfilled tile.',
      'Agile@Scale program cut inventory ~20% — leaner inventory makes yard variance a working-capital lever.',
    ],
    urgencyDriver: 'The operating-system discipline Torres applied at AB InBev — uniform standards across every site — has not yet reached the yard. Site-level YMS at 12 campuses is not the same as a network operating model. The DeKalb greenfield (opens 2027) is the highest-leverage single deployment site in the U.S. portfolio.',
  },

  theme: {
    accentColor: '#C8102E',
  },
};
