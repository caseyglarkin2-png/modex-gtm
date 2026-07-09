/**
 * Walmart, ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/walmart.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites, no additional facts
 * were invented. This entry exists so /demo/walmart resolves its
 * accountName FK and /for/walmart renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const walmart: AccountMicrositeData = {
  slug: 'walmart',
  accountName: 'Walmart',
  coverFootprint: '12 DCs · 2,114 dock doors',
  vertical: 'retail',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Walmart, Yard Network Audit',
  metaDescription:
    '12 Walmart facilities mapped from public satellite imagery: 2,114 dock doors and room for about 5,250 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Walmart network',
      composition: [
        { label: 'Audited footprint', value: '12 audited DCs of ~150 US distribution centers (164 US distribution facilities per FY2025 10-K)' },
        { label: 'Facility types', value: 'General Merchandise DC · Grocery/Perishable DC · E-commerce Fulfillment Center · Import DC' },
        { label: 'Dock doors (audited sites)', value: '2,114' },
        { label: 'Trailer positions (audited sites)', value: '~5,250' },
        { label: 'Truck gates (audited sites)', value: '12' },
        { label: 'Rail service', value: 'No rail at the audited DCs; every load lands and leaves through a truck gate.' },
        { label: 'Geographic spread', value: 'United States. Roughly 150 DCs feeding about 4,700 US stores; the audited set spans general merchandise, grocery, e-commerce, and import types.' },
      ],
      hypothesis:
        'Walmart moves more freight through its yards than any retailer on earth. Roughly 150 distribution centers feed about 4,700 US stores, and a trailer that idles at the gate is production capacity the whole network never gets back. We mapped 12 of those DCs across general merchandise, grocery, e-commerce, and import: 2,114 dock doors and more than 5,200 trailer positions. YardFlow runs the gate-to-dock handoff as one orchestrated flow.',
      caveat:
        'This entry is generated from our satellite network audit, the same dataset behind the live demo below, not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '12 Walmart facilities, mapped from public satellite imagery',
      accountSlug: 'walmart',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed, overlaid on the live satellite tile.',
      source: 'Walmart runs ~150 US distribution centers (general merchandise, grocery/perishable, e-commerce fulfillment, and import) feeding ~4,700 US stores, plus international DCs. We audited 12 representative US facilities spanning every type.',
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
          source: 'Walmart FY2025 Form 10-K, Item 2 Properties: 164 Walmart U.S. distribution facilities',
          confidence: 'public',
          detail: 'Walmart runs ~150 US distribution centers (general merchandise, grocery/perishable, e-commerce fulfillment, and import) feeding ~4,700 US stores, plus international DCs. We audited 12 representative US facilities spanning every type.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Walmart specifically.',
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
        'If parts of this read wrong against what you see internally at Walmart, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry, flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '12 audited DCs of ~150 US distribution centers (164 US distribution facilities per FY2025 10-K)',
    facilityTypes: ['General Merchandise DC', 'Grocery/Perishable DC', 'E-commerce Fulfillment Center', 'Import DC'],
    geographicSpread: 'United States. Roughly 150 DCs feeding about 4,700 US stores; the audited set spans general merchandise, grocery, e-commerce, and import types.',
    dailyTrailerMoves: 'Not modeled from public data, the audited footprint holds 2,114 dock doors and room for ~5,250 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 2,114 dock doors across 12 sites.',
  },

  signals: {},
};
