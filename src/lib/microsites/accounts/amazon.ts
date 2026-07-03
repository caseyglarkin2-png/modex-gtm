/**
 * Amazon — ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/amazon.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites — no additional facts
 * were invented. This entry exists so /demo/amazon resolves its
 * accountName FK and /for/amazon renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const amazon: AccountMicrositeData = {
  slug: 'amazon',
  accountName: 'Amazon',
  coverFootprint: '16 sites · 1,890 dock doors',
  vertical: 'retail',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Amazon — Yard Network Audit',
  metaDescription:
    '16 Amazon facilities mapped from public satellite imagery: 1,890 dock doors and room for about 3,825 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Amazon network',
      composition: [
        { label: 'Audited footprint', value: '16 audited sites of 116 large US fulfillment centers (MWPVL, 2025 Q1)' },
        { label: 'Facility types', value: 'Fulfillment Center · Inbound Cross-Dock (IXD) · Sortation Center · Air Hub' },
        { label: 'Dock doors (audited sites)', value: '1,890' },
        { label: 'Trailer positions (audited sites)', value: '~3,825' },
        { label: 'Truck gates (audited sites)', value: '17' },
        { label: 'Rail service', value: 'None of the 16 audited sites touch rail; every trailer enters and leaves through a truck gate.' },
        { label: 'Geographic spread', value: 'United States. Audited set spans robotics fulfillment centers, an inbound cross-dock, a sortation center, and the Amazon Air hub at CVG.' },
      ],
      hypothesis:
        'Amazon runs the most heavily gated freight network we have mapped. We audited 16 of its largest US sites, a mix of robotics fulfillment centers, an inbound cross-dock, a sortation center, and the Amazon Air hub at CVG, holding 1,890 dock doors and room for about 3,825 trailers. Fifteen of the sixteen gate the yard and twelve run a staffed guard booth, and none touch rail, so every trailer enters through a controlled checkpoint and leaves by truck. YardFlow turns those checkpoints into one orchestrated gate-to-dock flow across every node.',
      caveat:
        'This entry is generated from our satellite network audit — the same dataset behind the live demo below — not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '16 Amazon facilities, mapped from public satellite imagery',
      accountSlug: 'amazon',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed — overlaid on the live satellite tile.',
      source: 'Amazon runs 116 large US fulfillment centers (MWPVL, 2025 Q1) plus sortation centers, inbound cross-docks, and the Amazon Air hub network, feeding thousands of delivery stations. We audited 16 of the largest freight sites.',
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
          source: 'MWPVL International Amazon distribution network analysis (2025 Q1)',
          confidence: 'public',
          detail: 'Amazon runs 116 large US fulfillment centers (MWPVL, 2025 Q1) plus sortation centers, inbound cross-docks, and the Amazon Air hub network, feeding thousands of delivery stations. We audited 16 of the largest freight sites.',
          url: 'https://www.mwpvl.com/html/amazon_com.html',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Amazon specifically.',
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
        'If parts of this read wrong against what you see internally at Amazon, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry — flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '16 audited sites of 116 large US fulfillment centers (MWPVL, 2025 Q1)',
    facilityTypes: ['Fulfillment Center', 'Inbound Cross-Dock (IXD)', 'Sortation Center', 'Air Hub'],
    geographicSpread: 'United States. Audited set spans robotics fulfillment centers, an inbound cross-dock, a sortation center, and the Amazon Air hub at CVG.',
    dailyTrailerMoves: 'Not modeled from public data — the audited footprint holds 1,890 dock doors and room for ~3,825 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 1,890 dock doors across 16 sites.',
  },

  signals: {},
};
