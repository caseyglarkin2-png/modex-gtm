/**
 * NFI Industries, ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/nfi.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites, no additional facts
 * were invented. This entry exists so /demo/nfi resolves its
 * accountName FK and /for/nfi renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const nfi: AccountMicrositeData = {
  slug: 'nfi',
  accountName: 'NFI Industries',
  coverFootprint: '14 sites · 1,673 dock doors',
  vertical: 'logistics-3pl',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for NFI Industries, Yard Network Audit',
  metaDescription:
    '14 NFI Industries facilities mapped from public satellite imagery: 1,673 dock doors and room for about 3,709 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the NFI Industries network',
      composition: [
        { label: 'Audited footprint', value: '14 audited sites of 300+ North American facilities' },
        { label: 'Facility types', value: 'Distribution Center · Cross-Dock · Import Warehouse · Port Logistics' },
        { label: 'Dock doors (audited sites)', value: '1,673' },
        { label: 'Trailer positions (audited sites)', value: '~3,709' },
        { label: 'Truck gates (audited sites)', value: '14' },
        { label: 'Rail service', value: 'No rail at the audited sites; 10 of 14 sit behind a truck gate but only 4 run a staffed booth.' },
        { label: 'Geographic spread', value: 'North America. Audited set spans Lehigh Valley cross-docks, Inland Empire import DCs, and Port of Savannah logistics terminals.' },
      ],
      hypothesis:
        'NFI runs freight yards on behalf of the retailers and manufacturers it serves, across more than 300 North American facilities. We core-sampled 14 of its largest and most yard-intensive sites, from Lehigh Valley cross-docks to Inland Empire import DCs and Port of Savannah logistics terminals, holding 1,673 dock doors and room for about 3,709 trailers. Control across the network is uneven. Ten of the 14 sit behind a truck gate, but only 4 run a staffed booth, and several sit open to the road. YardFlow puts one gate-to-dock standard across every yard NFI operates, no matter whose freight is moving through it.',
      caveat:
        'This entry is generated from our satellite network audit, the same dataset behind the live demo below, not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '14 NFI Industries facilities, mapped from public satellite imagery',
      accountSlug: 'nfi',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed, overlaid on the live satellite tile.',
      source: 'NFI operates 300+ North American facilities; we audited 14 of the largest and most yard-intensive (dedicated DCs, port logistics, Port of Savannah import warehouses, a fulfillment center). The rest follow the same gate/dock archetypes.',
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
          source: 'NFI Industries: 300+ North American facilities (Inbound Logistics Top 100 3PL profile)',
          confidence: 'public',
          detail: 'NFI operates 300+ North American facilities; we audited 14 of the largest and most yard-intensive (dedicated DCs, port logistics, Port of Savannah import warehouses, a fulfillment center). The rest follow the same gate/dock archetypes.',
          url: 'https://www.nfiindustries.com/about-nfi/news/nfi-named-a-2020-top-100-3pl-provider-by-inbound-logistics/',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not NFI Industries specifically.',
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
        'If parts of this read wrong against what you see internally at NFI Industries, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry, flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '14 audited sites of 300+ North American facilities',
    facilityTypes: ['Distribution Center', 'Cross-Dock', 'Import Warehouse', 'Port Logistics'],
    geographicSpread: 'North America. Audited set spans Lehigh Valley cross-docks, Inland Empire import DCs, and Port of Savannah logistics terminals.',
    dailyTrailerMoves: 'Not modeled from public data, the audited footprint holds 1,673 dock doors and room for ~3,709 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 1,673 dock doors across 14 sites.',
  },

  signals: {},
};
