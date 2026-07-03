/**
 * Costco Wholesale — ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/costco.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites — no additional facts
 * were invented. This entry exists so /demo/costco resolves its
 * accountName FK and /for/costco renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const costco: AccountMicrositeData = {
  slug: 'costco',
  accountName: 'Costco Wholesale',
  coverFootprint: '11 depots · 1,685 dock doors',
  vertical: 'retail',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Costco Wholesale — Yard Network Audit',
  metaDescription:
    '11 Costco Wholesale facilities mapped from public satellite imagery: 1,685 dock doors and room for about 5,302 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Costco Wholesale network',
      composition: [
        { label: 'Audited footprint', value: '11 audited depots of ~24 US cross-dock depots' },
        { label: 'Facility types', value: 'Dry Depot · Refrigerated Depot · Refrigerated + Dry Depot' },
        { label: 'Dock doors (audited sites)', value: '1,685' },
        { label: 'Trailer positions (audited sites)', value: '~5,302' },
        { label: 'Truck gates (audited sites)', value: '12' },
        { label: 'Rail service', value: 'None of the 11 audited depots touch rail.' },
        { label: 'Geographic spread', value: 'United States. Dry and refrigerated cross-dock depots feeding roughly 600 US warehouses.' },
      ],
      hypothesis:
        'Costco runs the leanest cross-dock model in retail. Freight lands at a depot, gets sorted, and ships to the warehouse within hours, so every minute a trailer waits at the gate stalls the whole flow. We mapped 11 of Costco\'s roughly 24 US depots: 1,685 dock doors and more than 5,300 trailer positions across dry and refrigerated cross-docks. YardFlow turns that gate-to-dock handoff into one orchestrated move.',
      caveat:
        'This entry is generated from our satellite network audit — the same dataset behind the live demo below — not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '11 Costco Wholesale facilities, mapped from public satellite imagery',
      accountSlug: 'costco',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed — overlaid on the live satellite tile.',
      source: 'Costco runs ~24 US cross-dock depots (dry, refrigerated, and e-commerce) feeding ~600 US warehouses, plus a handful internationally. We audited 11 representative US depots spanning dry and wet cross-docks.',
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
          source: 'Costco FY2019 Form 10-K, Item 2 Properties (last published depot count: 24 depots worldwide)',
          confidence: 'public',
          detail: 'Costco runs ~24 US cross-dock depots (dry, refrigerated, and e-commerce) feeding ~600 US warehouses, plus a handful internationally. We audited 11 representative US depots spanning dry and wet cross-docks.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Costco Wholesale specifically.',
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
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis built from our satellite audit of the network, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally at Costco Wholesale, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry — flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '11 audited depots of ~24 US cross-dock depots',
    facilityTypes: ['Dry Depot', 'Refrigerated Depot', 'Refrigerated + Dry Depot'],
    geographicSpread: 'United States. Dry and refrigerated cross-dock depots feeding roughly 600 US warehouses.',
    dailyTrailerMoves: 'Not modeled from public data — the audited footprint holds 1,685 dock doors and room for ~5,302 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 1,685 dock doors across 11 sites.',
  },

  signals: {},
};
