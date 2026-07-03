/**
 * Tractor Supply Company — ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/tractor-supply.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites — no additional facts
 * were invented. This entry exists so /demo/tractor-supply resolves its
 * accountName FK and /for/tractor-supply renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const tractorSupply: AccountMicrositeData = {
  slug: 'tractor-supply',
  accountName: 'Tractor Supply Company',
  coverFootprint: '10 DCs · 1,119 dock doors',
  vertical: 'retail',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Tractor Supply Company — Yard Network Audit',
  metaDescription:
    '10 Tractor Supply Company facilities mapped from public satellite imagery: 1,119 dock doors and room for about 2,390 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Tractor Supply Company network',
      composition: [
        { label: 'Audited footprint', value: '10 audited DCs, all operating DCs (an 11th in Nampa ID under construction, operations expected Q4 2026)' },
        { label: 'Facility types', value: 'Distribution Center' },
        { label: 'Dock doors (audited sites)', value: '1,119' },
        { label: 'Trailer positions (audited sites)', value: '~2,390' },
        { label: 'Truck gates (audited sites)', value: '10' },
        { label: 'Rail service', value: '1 of 10 audited DCs rail-served; nine of ten sit behind a truck gate and seven keep a staffed booth.' },
        { label: 'Geographic spread', value: 'United States, from the 900,000 sq ft Navarre flagship to DCs in Texas, Arizona, and Arkansas; rural, open-field sites where trailers stage outside the fence.' },
      ],
      hypothesis:
        'Tractor Supply self-distributes to its stores from a national network of large regional distribution centers. We mapped all 10 operating DCs, from the 900,000 square foot Navarre flagship to facilities in Texas, Arizona and Arkansas, holding 1,119 dock doors and room for about 2,390 trailers. The yards are tightly run. Nine of the 10 sit behind a truck gate and 7 keep a staffed booth, and every one sits on rural, open-field land where trailers stage outside the fence. YardFlow turns those manual gate stops into one orchestrated gate-to-dock flow across the whole network.',
      caveat:
        'This entry is generated from our satellite network audit — the same dataset behind the live demo below — not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '10 Tractor Supply Company facilities, mapped from public satellite imagery',
      accountSlug: 'tractor-supply',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed — overlaid on the live satellite tile.',
      source: 'Audited all 10 operating distribution centers; an 11th DC in Nampa ID is under construction, with operations expected Q4 2026.',
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
          source: 'Tractor Supply FY2025 Form 10-K, Item 2 Properties (SEC, filed 2026-02-19)',
          confidence: 'public',
          detail: 'Audited all 10 operating distribution centers; an 11th DC in Nampa ID is under construction, with operations expected Q4 2026.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Tractor Supply Company specifically.',
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
        'If parts of this read wrong against what you see internally at Tractor Supply Company, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry — flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '10 audited DCs, all operating DCs (an 11th in Nampa ID under construction, operations expected Q4 2026)',
    facilityTypes: ['Distribution Center'],
    geographicSpread: 'United States, from the 900,000 sq ft Navarre flagship to DCs in Texas, Arizona, and Arkansas; rural, open-field sites where trailers stage outside the fence.',
    dailyTrailerMoves: 'Not modeled from public data — the audited footprint holds 1,119 dock doors and room for ~2,390 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 1,119 dock doors across 10 sites.',
  },

  signals: {},
};
