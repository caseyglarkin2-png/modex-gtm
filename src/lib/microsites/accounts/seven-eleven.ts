/**
 * 7-Eleven — ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/seven-eleven.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites — no additional facts
 * were invented. This entry exists so /demo/seven-eleven resolves its
 * accountName FK and /for/seven-eleven renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const sevenEleven: AccountMicrositeData = {
  slug: 'seven-eleven',
  accountName: '7-Eleven',
  coverFootprint: '11 sites · 460 dock doors',
  vertical: 'grocery',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for 7-Eleven — Yard Network Audit',
  metaDescription:
    '11 7-Eleven facilities mapped from public satellite imagery: 460 dock doors and room for about 836 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the 7-Eleven network',
      composition: [
        { label: 'Audited footprint', value: '11 audited partner facilities of ~40 fresh-food CDCs and commissaries plus McLane grocery DCs' },
        { label: 'Facility types', value: 'Combined Distribution Center · Fresh Food Commissary · Grocery DC' },
        { label: 'Dock doors (audited sites)', value: '460' },
        { label: 'Trailer positions (audited sites)', value: '~836' },
        { label: 'Truck gates (audited sites)', value: '13' },
        { label: 'Rail service', value: 'No rail at any audited facility; every case moves by truck through a dock, and most of these yards sit open to the road.' },
        { label: 'Geographic spread', value: 'United States. Partner-operated distribution: E.A. Sween fresh-food commissaries and McLane grocery DCs feeding ~13,000 US stores.' },
      ],
      hypothesis:
        '7-Eleven sells fresh food and grocery out of stores it does not stock itself. The distribution runs through partners: E.A. Sween fresh-food commissaries and McLane grocery DCs that pick, stage, and truck to the stores. We mapped 11 of those facilities across the country, holding 460 dock doors and room for about 836 trailers, with no rail at any of them. Every case moves by truck through a dock, and most of these yards sit open to the road. YardFlow gives the operator running them one gate-to-dock view across the whole network.',
      caveat:
        'This entry is generated from our satellite network audit — the same dataset behind the live demo below — not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '11 7-Eleven facilities, mapped from public satellite imagery',
      accountSlug: 'seven-eleven',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed — overlaid on the live satellite tile.',
      source: '7-Eleven\'s ~13,000 US stores are supplied through partner-operated distribution: E.A. Sween fresh-food combined distribution centers plus McLane grocery DCs. We audited 11 representative US facilities.',
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
          source: 'Logistics Viewpoints: 7-Eleven and Exel deliver fresh food daily (partner CDC network)',
          confidence: 'public',
          detail: '7-Eleven\'s ~13,000 US stores are supplied through partner-operated distribution: E.A. Sween fresh-food combined distribution centers plus McLane grocery DCs. We audited 11 representative US facilities.',
          url: 'https://logisticsviewpoints.com/2014/10/08/7-eleven-and-exel-deliver-fresh-food-daily/',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not 7-Eleven specifically.',
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
        'If parts of this read wrong against what you see internally at 7-Eleven, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry — flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '11 audited partner facilities of ~40 fresh-food CDCs and commissaries plus McLane grocery DCs',
    facilityTypes: ['Combined Distribution Center', 'Fresh Food Commissary', 'Grocery DC'],
    geographicSpread: 'United States. Partner-operated distribution: E.A. Sween fresh-food commissaries and McLane grocery DCs feeding ~13,000 US stores.',
    dailyTrailerMoves: 'Not modeled from public data — the audited footprint holds 460 dock doors and room for ~836 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 460 dock doors across 11 sites.',
  },

  signals: {},
};
