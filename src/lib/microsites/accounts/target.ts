/**
 * Target, ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/target.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites, no additional facts
 * were invented. This entry exists so /demo/target resolves its
 * accountName FK and /for/target renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const target: AccountMicrositeData = {
  slug: 'target',
  accountName: 'Target',
  coverFootprint: '24 sites · 2,961 dock doors',
  vertical: 'retail',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Target, Yard Network Audit',
  metaDescription:
    '24 Target facilities mapped from public satellite imagery: 2,961 dock doors and room for about 8,640 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Target network',
      composition: [
        { label: 'Audited footprint', value: '24 audited sites, all identifiable US facilities (FY2024 10-K lists 66 supply-chain facilities incl. sortation)' },
        { label: 'Facility types', value: 'Regional Distribution Center · Food Distribution Center · Import Warehouse · Flow Center' },
        { label: 'Dock doors (audited sites)', value: '2,961' },
        { label: 'Trailer positions (audited sites)', value: '~8,640' },
        { label: 'Truck gates (audited sites)', value: '26' },
        { label: 'Rail service', value: 'Only 1 of 24 audited sites touches rail; nearly every load in or out moves by truck through 26 gates.' },
        { label: 'Geographic spread', value: 'United States. Coastal import warehouses feeding 15 regional DCs, 4 food DCs, and a flow center on a tight replenishment clock.' },
      ],
      hypothesis:
        'Target moves almost all of its inbound through a coastal import network that feeds regional distribution centers, then pushes to stores on a tight replenishment clock, so a trailer stuck at the gate ripples straight to the shelf. We mapped all 24 of Target\'s identifiable US facilities: 4 import warehouses, 15 regional DCs, 4 food DCs, and a flow center, totaling 2,961 dock doors and roughly 8,640 trailer positions across 1,907 acres. Only one of those 24 sites touches rail, so nearly every load in or out moves by truck through 26 gates. YardFlow turns that gate-to-dock handoff into one orchestrated move across the whole network.',
      caveat:
        'This entry is generated from our satellite network audit, the same dataset behind the live demo below, not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '24 Target facilities, mapped from public satellite imagery',
      accountSlug: 'target',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed, overlaid on the live satellite tile.',
      source: 'Audited all 24 identifiable facilities.',
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'satellite-audit',
          source: 'YardFlow satellite network audit (June 2026)',
          confidence: 'public',
          detail: 'Dock doors, trailer positions, truck gates, rail service, and acreage measured site-by-site from public satellite imagery. The full audited dataset renders in the live network demo on this page.',
        },
        {
          id: 'network-count',
          source: 'Target FY2024 Form 10-K, Item 2 Properties: 66 supply chain facilities (distribution, sortation, and other)',
          confidence: 'public',
          detail: 'Audited all 24 identifiable facilities.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Target specifically.',
        },
      ],
      unknowns: [
        'Actual detention cost and carrier mix without TMS data',
        'Spotter and gate staffing per site',
        'Which sites concentrate the exception volume today',
        'Internal yard systems already in place at individual sites',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis built from our satellite audit of the network, not a sales asset, it is the same shape of memo we would circulate internally before sizing a network engagement.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally at Target, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry, flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '24 audited sites, all identifiable US facilities (FY2024 10-K lists 66 supply-chain facilities incl. sortation)',
    facilityTypes: ['Regional Distribution Center', 'Food Distribution Center', 'Import Warehouse', 'Flow Center'],
    geographicSpread: 'United States. Coastal import warehouses feeding 15 regional DCs, 4 food DCs, and a flow center on a tight replenishment clock.',
    dailyTrailerMoves: 'Not modeled from public data, the audited footprint holds 2,961 dock doors and room for ~8,640 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 2,961 dock doors across 24 sites.',
  },

  signals: {},
};
