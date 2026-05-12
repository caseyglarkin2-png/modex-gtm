/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * SC Johnson is flagged in the hunt list as a PINC/Kaleris customer, but
 * the attribution is category-of-incumbent inference, not vendor-disclosed
 * evidence. The Kaleris/PINC published reference list does NOT include SC
 * Johnson by name (Kraft Heinz, Bob Evans, Carhartt, Cost Plus, Daimler,
 * Associated Food Stores yes; SC Johnson no). Reading the gap: most likely
 * SC Johnson uses a yard tool of some flavor at Waxdale + Bay City and has
 * chosen not to publicize it, OR uses a different vendor (C3 Solutions or
 * SAP Yard Logistics), OR runs a homegrown / SAP-extension approach. Cold
 * v1 must NOT assert PINC/Kaleris — discovery-then-displace.
 *
 * Persona context: Rick Camacho (Global CSCO since April 2022) — Navy
 * Surface Warfare Officer 1985–1990 → P&G 1990–2005 (15 years) → Reckitt
 * → Coca-Cola HBC → Hershey (CSCO 2017–2018) → Danone NA CSCO 2018–2022 →
 * SC Johnson 2022–present. Standards-and-procedures operator. Naval
 * Academy BS Math + Johns Hopkins MBA. Inclusive, people-first framing.
 *
 * SC Johnson is private (Johnson family, ~$13B revenue, Fisk Johnson CEO).
 * Family ownership = long-horizon capex posture, less quarterly-EPS
 * pressure. Mixed-fleet yard problem at Waxdale (aerosols + hazmat) +
 * Bay City (Ziploc cube-extreme) + ambient liquids + B2B Professional = a
 * structurally harder yard mix than Reckitt/Danone/Hershey.
 *
 * Pitch shape: COEXISTENCE WEDGE (operating-model layer above whatever
 * per-site yard tool actually exists). Discovery-coded — do not assert
 * the specific vendor. Frame as "household-goods CPG networks of this
 * shape typically run a per-site YMS; the network-tier operating-model
 * layer above is the gap we work on."
 *
 * Westfahl seam: Jamie Westfahl (CPO since January 2025, ex-Molson Coors
 * VP Procurement, $3.5B packaging spend). Logistics-carrier procurement
 * sits at the Camacho-Westfahl seam. Joint-sponsor pitch.
 *
 * This intel powers the cold-email discover-then-displace framing (see
 * docs/research/rick-camacho-sc-johnson-dossier.md). It must not appear in
 * any prospect-facing surface. The memo references "whatever per-site yard
 * tool runs at Waxdale and Bay City today" / "the per-site yard tools
 * household-goods CPG networks of this shape typically operate" — never
 * PINC/Kaleris.
 */

/**
 * SC Johnson — ABM Microsite Data
 * Quality Tier: C (probable yard-tech category-of-incumbent; SC Johnson
 *                  NOT publicly named in Kaleris/PINC reference list; cold
 *                  v1 must NOT assert specific vendor)
 * Pitch shape: coexistence wedge — operating-model layer above whatever
 *              per-site yard tool exists, discover-then-displace framing
 * Angle: YARD MANAGEMENT (mixed-fleet yard at every plant — hazmat
 *        aerosols + cube-extreme Ziploc + ambient liquids + B2B
 *        Professional; Waxdale criticality concentration; RDC mass-retail
 *        chargeback pressure; Brantford ON consolidation) — NOT driver
 *        experience
 * Stakeholder vocabulary: standards-and-procedures operator register
 *        (Camacho\'s Navy SWO + P&G + Hershey + Danone career stack;
 *        Westfahl-Camacho procurement-supply-chain seam) — operating
 *        discipline, throughput-per-dock, mass-retail OTIF, cross-industry
 *        comparables
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const scJohnson: AccountMicrositeData = {
  slug: 'sc-johnson',
  accountName: 'SC Johnson',
  coverHeadline: 'The network layer above the per-site yard tools',
  titleEmphasis: 'above the per-site yard tools',
  coverFootprint: 'Waxdale · Bay City · Brantford · Toluca',
  parentBrand: 'S.C. Johnson & Son, Inc.',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 70,

  pageTitle: 'YardFlow for SC Johnson - The Network-Tier Layer Above the Per-Site Yard Tools',
  metaDescription:
    'How a network-tier yard operating model lands on top of whatever per-site tools SC Johnson runs today at Waxdale, Bay City, Brantford, Toluca, and the RDC layer — turning the structurally hard mixed-fleet yard (hazmat aerosols + cube-extreme Ziploc + ambient liquids + B2B Professional) into one operating standard across the household-goods network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the SC Johnson network',
      composition: [
        { label: 'Manufacturing footprint anchor', value: 'Waxdale (Sturtevant WI) — 2.2 million sq ft, opened 1955, the largest and fastest single-site aerosol-producing facility in the world. 15 finished-goods manufacturing lines + components plant; 430 million aerosol cans/year; 60 million cases/year; some lines at 500 aerosols/minute. ~700–850 team members. Waxdale carries an outsized fraction of the brand portfolio (Glade, Raid, Off!, Pledge, Scrubbing Bubbles, Windex)' },
        { label: 'Other anchor plants', value: 'Bay City MI (Ziploc home storage hub, ~500 acres, six production buildings, billions of bags/year, 56,000 sq ft addition, 100% wind energy carbon-neutral) + Brantford ON ($50M Glade investment announced March 2024, expanding warehousing and distribution + consolidating Canadian DC centers) + Toluca MX (significant Latin America-serving plant, zero-manufacturing-waste for five consecutive years)' },
        { label: 'Mixed-fleet yard pattern', value: 'Outbound trailers are not uniform: hazmat aerosols (Glade, Raid, Off!, Pledge, Scrubbing Bubbles — DOT-regulated routing, parking, and dock-door rules) + cube-extreme home storage (Ziploc cubes out before weight limit, similar inverse problem to diaper trailers) + ambient liquid cleaners (Windex, Drano, method — weight-heavy standard CPG truckload) + B2B Professional channel (different appointment systems than retail). Mixed-fleet yard at every plant' },
        { label: 'RDC network', value: 'Regional DCs serving mass retail (Walmart, Target, Costco, Sam\'s, Kroger, Amazon). Historical RDC references include Ontario CA, Woodland CA, Fort Worth TX, Forest Park GA (current 2026 exact list unverified). MABD penalties at mass-retail accounts tightened materially through 2024–2025' },
        { label: 'Existing yard-tech layer', value: 'Household-goods CPG networks of SC Johnson\'s shape typically run a per-site yard tool; the specific vendor at SC Johnson is not publicly disclosed. The network-tier operating-model layer above whatever per-site tool runs at Waxdale, Bay City, Brantford, Toluca, and the RDC layer is the gap — and almost certainly unsolved regardless of which per-site vendor is in production' },
        { label: 'Ownership posture', value: 'Privately held, controlled by the Johnson family (Fisk Johnson Chairman and CEO, fifth-generation). ~$13B revenue (2025); ~13,000 employees globally. Long-horizon capex posture — multi-decade family-stewardship time, not quarterly-EPS pressure. EPR/sustainability advocacy (Fisk testified to US Senate Committee on Environment & Public Works March 2024)' },
      ],
      hypothesis:
        'The interesting thing about the SC Johnson yard math is that the mixed-fleet outbound is structurally harder than any of the household-goods CPG peers Rick Camacho ran supply chain at before (Reckitt, Hershey, Danone). Aerosols + ambient liquids + Ziploc cube-extreme + B2B Professional is a four-modality outbound — and no two trailers in the yard have the same constraints. Hazmat aerosols have DOT-regulated routing and dock-door rules that constrain yard flexibility; Ziploc cubes out at a fraction of weight limit so trailer count is disproportionately high for tonnage; ambient liquids run standard CPG truckload economics; B2B Professional channel runs on different appointment cadence than retail. Per-site yard tools handle these mixes with site-specific rules — what gets lost is network-level standardization across the mix.\n\nTwo things change the math in 2026. First, the Brantford Canadian DC consolidation (announced March 2024) is the canonical yard-bottleneck-creation event — same demand, fewer DCs, more trailers per surviving yard. Second, the Westfahl seam: Jamie Westfahl joined as CPO in January 2025 from Molson Coors with $3.5B packaging-procurement responsibility. Logistics-carrier procurement (carrier rates, carrier-experience metrics, demurrage and detention spend, 3PL contract terms) sits exactly at the Camacho-Westfahl seam — both within their first three years in seat, both with cross-functional incentive to make the carrier-experience number visible at the network level.\n\nThe Waxdale criticality concentration is the structural risk: one plant carrying an outsized fraction of the brand portfolio means yard disruption at Waxdale ripples through Glade, Raid, Off!, Pledge, Scrubbing Bubbles, and Windex simultaneously. The criticality concentration here is much higher than at more-distributed networks like Kraft Heinz or General Mills, and the operating-model layer above the per-site tool is the lever that protects single-site risk without adding capex.',
      pullQuote: 'No two trailers in the yard have the same constraints.',
      caveat:
        'This is built from SC Johnson public disclosures, Fisk Johnson\'s sustainability and EPR advocacy, the Brantford / Bay City expansion press materials, Camacho\'s public career record, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whatever per-site yard tool runs at Waxdale and Bay City today, where the Brantford Canadian DC consolidation is creating the most pressure at surviving sites, and how the Westfahl-Camacho procurement-supply-chain seam currently coordinates carrier-experience metrics across the network.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level operating model on top of their existing site-level yard systems. The SC Johnson operating profile is shape-similar — multi-site, multi-channel, mature per-site yard tools where they exist, regional DCs feeding mass retail — but with a structurally harder mixed-fleet outbound (hazmat aerosols + cube-extreme Ziploc + ambient liquids + B2B Professional) than water. If a network operating model can run on water — the hardest CPG freight in the country — the read-across to a four-modality household-goods outbound network running on Waxdale criticality concentration is the easier lift, not the harder one.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot targets at SC Johnson are different in kind: (1) Waxdale Sturtevant WI as the criticality-concentration site, where the network-tier operating layer most directly protects the outsized brand-portfolio exposure; (2) one RDC node where the mixed-fleet outbound (hazmat aerosols + Ziploc + ambient liquids) interleaves with mass-retail MABD windows, so the operating-model impact lands directly in the carrier-experience metric Westfahl owns. We would expect the network to make sense of itself within two to four quarters of the pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'scj-public-network',
          source: 'SC Johnson public disclosures and corporate leadership page',
          confidence: 'public',
          detail: 'Anchors Waxdale (Sturtevant WI 2.2M sq ft, world\'s largest single-site aerosol producer, 430M cans/year, 60M cases/year), Bay City MI Ziploc hub, Brantford ON $50M Glade expansion, Toluca MX. Rick Camacho as Global CSCO since April 2022; Jamie Westfahl as CPO since January 2025. Fisk Johnson Chairman and CEO.',
          url: 'https://www.scjohnson.com/',
        },
        {
          id: 'scj-brantford-expansion',
          source: 'SC Johnson Brantford ON $50M investment (March 2024)',
          confidence: 'public',
          detail: 'New Glade PlugIns Scented Oil production lines + method personal-care lines; expanded warehousing and distribution footprint in Brantford "combining existing centers in Canada." Canadian DC network consolidation — same demand, fewer DCs, more trailers per surviving yard.',
        },
        {
          id: 'scj-yard-tech-uncertainty',
          source: 'Published yard-tech category reference lists',
          confidence: 'public',
          detail: 'Household-goods CPG networks of SC Johnson\'s shape typically run a per-site yard tool. The major published vendor reference lists in the yard-management category do not include SC Johnson by name. Most likely: SC Johnson runs a per-site yard tool of some flavor and has chosen not to publicize it, or uses one of the alternate enterprise yard-management vendors, or runs a homegrown / SAP-extension approach. Treat as discovery question, not assertion.',
        },
        {
          id: 'scj-sustainability-epr',
          source: 'Fisk Johnson + SC Johnson sustainability disclosures',
          confidence: 'public',
          detail: 'Fisk Johnson testified to US Senate Committee on Environment & Public Works in March 2024 on Extended Producer Responsibility for plastic packaging. SC Johnson met 2025 goal of 25% recycled plastic; targeting 60% recycled content by 2030. Highest percentage of reusable plastic packaging in Global Commitment\'s household and personal-care sector (12%). Yard idle hours and hostler diesel are Scope 1 lines not currently captured at the granularity Fisk\'s advocacy implies.',
        },
        {
          id: 'camacho-public-record',
          source: 'Rick Camacho public career record',
          confidence: 'public',
          detail: 'US Navy Surface Warfare Officer 1985–1990; P&G 1990–2005 (Group Manager Supply Chain); Reckitt Benckiser VP Logistics & Planning NA 2005–2009 + Regional Supply Director East Asia 2009–2010; Coca-Cola HBC 2010–2013; Hershey VP Supply Chain AEMEA → VP Global Supply Chain Operations → VP CSCO 2013–2018; Danone NA CSCO 2018–2022; SC Johnson Global CSCO since April 2022. BS Math (US Naval Academy); MBA International Finance (Johns Hopkins). Featured in Supply Chain Magazine "Top 10 Supply Chain Leaders in Chicago" 2024–2025.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, multi-fleet dwell distributions, and detention-cost ranges including hazmat-classified outbound. These describe the conditions most multi-site CPG networks operate under, not SC Johnson specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whatever per-site yard tool runs at Waxdale, Bay City, Brantford, and Toluca today — vendor, vintage, integration depth (the public record does not name a vendor at SC Johnson; this is the central discovery question)',
        'How the Brantford Canadian DC consolidation is playing out across surviving Canadian sites — and which is absorbing the most volume',
        'How the mixed-fleet yard problem (hazmat + Ziploc + ambient + B2B Professional) is currently arbitrated at the Waxdale dock surface — site policy, system logic, or operator judgment',
        'How carrier-experience metrics for the cube-heavy Ziploc lanes and the hazmat aerosol lanes currently surface at the Westfahl-Camacho procurement-supply-chain seam',
        'Where the RDC network currently has the worst MABD chargeback exposure to mass-retail customers, and which yard surfaces drive it',
        'Whether yard idle hours and hostler diesel are currently captured at the granularity Fisk Johnson\'s EPR / sustainability advocacy implies they should be, and whether there is appetite to publish them',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. SC Johnson is distinctive in this round because the mixed-fleet outbound (hazmat aerosols + cube-extreme Ziploc + ambient liquids + B2B Professional) is structurally harder than any of the household-goods CPG networks the CSCO has run before — and the network-tier operating-model layer above whatever per-site tool runs at Waxdale and Bay City today is the lever that turns four-modality yard complexity into one operating standard. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and if a network operating model lands on water, a four-modality household-goods network with Waxdale criticality concentration is the easier lift, not the harder one.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for SC Johnson — particularly whatever per-site yard tool runs at Waxdale and Bay City today, where the Brantford Canadian DC consolidation is creating the most pressure at surviving sites, or how the Westfahl-Camacho procurement-supply-chain seam coordinates carrier-experience metrics across the network — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'sc-johnson-001',
      name: 'Rick Camacho',
      firstName: 'Rick',
      lastName: 'Camacho',
      title: 'Global Chief Supply Chain Officer',
      company: 'SC Johnson',
      email: 'rcamacho@scj.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain',
      currentMandate:
        'Global CSCO since April 2022. 35+ years operations leadership: Navy Surface Warfare Officer 1985–1990; P&G 1990–2005 (15 years); Reckitt Benckiser (NA + East Asia) 2005–2010; Coca-Cola HBC 2010–2013; Hershey VP CSCO 2017–2018; Danone NA CSCO 2018–2022; SC Johnson Global CSCO 2022–present. Four-continent operator (NA, Europe, Middle East, Africa, East Asia). BS Math (US Naval Academy); MBA International Finance (Johns Hopkins). Standards-and-procedures operator; inclusive, people-first framing.',
      bestIntroPath:
        'Direct outreach to the Global CSCO seat with a discovery-coded operating-model framing — DO NOT assert a specific per-site yard vendor. Westfahl-Camacho joint-sponsor pitch is the strongest configuration (carrier-experience metrics + procurement seam). If Camacho delegates: SC Johnson Professional VP Supply Chain or the Director of Logistics & Customer Service are the right alternates. Long-tenure, low-public-profile operator pattern — leads with operating substance, discounts brand-building flattery.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'sc-johnson-001',
        name: 'Rick Camacho',
        firstName: 'Rick',
        lastName: 'Camacho',
        title: 'Global Chief Supply Chain Officer',
        company: 'SC Johnson',
        email: 'rcamacho@scj.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Rick Camacho - Global Chief Supply Chain Officer',
      variantSlug: 'rick-camacho',

      framingNarrative:
        'Rick, the standards-and-procedures discipline you carried from the Navy SWO foundation through 15 years at P&G, then Reckitt, Coca-Cola HBC, Hershey, and Danone, into SC Johnson — is exactly the discipline that turns four-modality yard complexity (hazmat aerosols + cube-extreme Ziploc + ambient liquids + B2B Professional) into one network-tier operating standard. Per-site yard tools where they exist do what they were bought to do; the operating-model layer above them that runs every yard the same way is the gap, and it has the long-horizon family-ownership capex window that public-CPG peers cannot match.',
      openingHook:
        'Household-goods CPG networks of SC Johnson\'s shape — Waxdale\'s aerosol throughput, Bay City\'s Ziploc cube, the RDC layer feeding mass retail — typically run a per-site yard tool. Whatever you actually run per site, the network-tier operating-model layer above it is the layer that closes the gate-in → dock-in seam across plants and RDCs and turns the structurally hard mixed-fleet outbound into one standard. The Brantford Canadian DC consolidation is loading more trailers through surviving yards right now. The Westfahl seam puts carrier-experience metrics into the procurement-supply-chain shared ledger.',
      stakeStatement:
        'Waxdale carries an outsized fraction of the brand portfolio — one plant\'s yard variance ripples through Glade, Raid, Off!, Pledge, Scrubbing Bubbles, and Windex simultaneously. Mass-retail MABD penalties at Walmart, Target, Costco, Sam\'s, Kroger, and Amazon have tightened materially through 2024–2025 — and DC operating cost is one of the few levers that does not trade off against merchandising. The network-tier operating-model layer is the no-capex throughput lever for a family-ownership long-horizon investment.',

      heroOverride: {
        headline: 'One operating standard across four-modality yard complexity.',
        subheadline:
          'Per-site yard tools where they exist at Waxdale, Bay City, Brantford, and Toluca do what they were bought to do. The network-tier layer that turns hazmat aerosols + cube-extreme Ziploc + ambient liquids + B2B Professional into one operating standard — across plants and the RDC layer feeding mass retail — is the lever the long-horizon family-ownership capex window is well-shaped to fund.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Standards-and-procedures operator register, four-continent / multi-industry literacy. Camacho ran Reckitt, Hershey, Danone; he reads cross-industry comparables faster than category narrative and discounts vendor abstractions and transformation-flavored language. Acknowledge the per-site yard tools where they exist without asserting the specific vendor — discovery-coded. Position the wedge as the layer above (operating-model standardization across the mixed-fleet outbound), not as replacement of whatever runs per-site. Long-horizon framing — family-ownership capex posture, not quarterly-EPS flash. Inclusive, people-first language — yard standardization decisions that look like job-eliminations will not land at SC Johnson; team-empowerment + asset-utilization-without-headcount-cuts will.',
      kpiLanguage: [
        'network-tier operating model',
        'mixed-fleet yard standardization (hazmat + cube + ambient + B2B Professional)',
        'Waxdale criticality concentration',
        'MABD penalty exposure at mass retail',
        'cross-industry operating discipline',
        'family-ownership long-horizon capex window',
        'carrier-experience metric at the Westfahl-Camacho seam',
        'Brantford Canadian DC consolidation pressure',
        'Scope 1 yard-idle attribution to EPR commitments',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same multi-site, multi-channel shape, harder freight (water at full weight, low margin, multi-temp at the premium SKU layer, with refill returns), already running the network-tier layer above existing site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic — multi-OpCo household-goods-scale network with mass-retail outbound and the same structural mixed-fleet problem.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Waxdale (Sturtevant WI, 2.2M sq ft, world\'s largest single-site aerosol producer, 60M cases/year, 430M aerosol cans/year, ~700–850 team members) + Bay City MI (Ziploc home storage hub, ~500 acres, six production buildings, billions of Ziploc bags/year, 100% wind energy) + Brantford ON ($50M Glade expansion + Canadian DC consolidation, March 2024) + Toluca MX (Latin America-serving plant, zero-manufacturing-waste 5 consecutive years) + regional DCs (historical references: Ontario CA, Woodland CA, Fort Worth TX, Forest Park GA) + global plants across Europe (Mijdrecht NL, Frimley UK), Asia, Latin America',
    facilityTypes: ['Aerosol Manufacturing (Waxdale)', 'Home Storage Manufacturing (Bay City)', 'Glade / Personal Care Manufacturing (Brantford ON)', 'Latin America Manufacturing (Toluca MX)', 'Regional Distribution Centers'],
    geographicSpread: 'Global (HQ: Racine WI, family seat since 1886; flagship plant: Sturtevant WI; Bay City MI; Brantford ON; Toluca MX; plus global plants in Europe, Asia, Latin America)',
    dailyTrailerMoves: 'High-volume — Waxdale produces 60M cases/year + 430M aerosol cans/year; Bay City produces billions of Ziploc bags/year. Outbound trailer count is disproportionately high for tonnage (Ziploc cube-out) and disproportionately constrained for routing (aerosol hazmat rules)',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL', 'Hazmat / DOT-Regulated Outbound (aerosols)', 'B2B Professional Channel'],
    avgLoadsPerDay: 'High-volume — four-modality outbound (hazmat aerosols + cube-extreme Ziploc + ambient liquids + B2B Professional) at every plant; carriers running SC Johnson lanes earn less per cube-mile and face more routing restrictions than carriers running easier CPG freight',
    specialRequirements: [
      'DOT hazmat for aerosols (Glade, Raid, Off!, Pledge, Scrubbing Bubbles — affects routing, carrier selection, dock-door placement, yard parking rules)',
      'Cube-extreme home storage (Ziploc cubes out at ~25–30% of weight limit, inverse problem to dense beverage trailers)',
      'Mixed hazmat + ambient + liquid + B2B Professional on shared yard surface at every plant',
      'Mass-retail MABD compliance (Walmart, Target, Costco, Sam\'s, Kroger, Amazon)',
      'Multi-country regulatory regimes (NA + Canada + Mexico + Europe + Asia)',
    ],
  },

  signals: {
    recentNews: [
      'Brantford ON $50M Glade investment announced March 2024 — new Glade PlugIns Scented Oil + method personal care lines, plus consolidation of existing Canadian DC centers.',
      'Bay City MI Ziploc plant: 56,000 sq ft addition; 100% wind energy, carbon-neutral; central hub for SC Johnson Home Storage business; exports to seven countries.',
      'Jamie Westfahl joined as Chief Procurement Officer January 2025 from Molson Coors (ex-VP Procurement, $3.5B packaging responsibility, $100-person team). Charlotte NC-based — geographic split with Camacho\'s Racine WI org. Logistics-carrier procurement sits at the Camacho-Westfahl seam.',
      'Fisk Johnson testified to US Senate Committee on Environment & Public Works in March 2024 advocating for Extended Producer Responsibility for plastic packaging. SC Johnson met 2025 25% recycled plastic goal; targeting 60% by 2030.',
      'WPP Media won SC Johnson\'s NA media account January 2026 — corporate-side reshuffling signal.',
    ],
    urgencyDriver:
      'SC Johnson\'s outbound trailer population is structurally not uniform — hazmat aerosols, cube-heavy Ziploc plastics, ambient liquid cleaners, and B2B Professional-channel loads share the same yard surface at every plant. Per-site yard tools where they exist handle this with site-specific rules; the network-tier operating model above them is the gap. The Brantford Canadian DC consolidation (announced March 2024) is loading more trailers through surviving Canadian sites right now. Mass-retail MABD penalty pressure at Walmart, Target, Costco, Sam\'s, Kroger, and Amazon has tightened materially through 2024–2025 — DC operating cost is one of the few levers that does not trade off against merchandising. The family-ownership long-horizon capex posture plays particularly well to a network-tier operating-model investment that takes 18–36 months to fully land and pays back through the decade.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Waxdale concentration', body: 'World\'s largest single-site aerosol plant · 2.2M sq ft · 430M cans/year · 60M cases/year · outsized brand-portfolio exposure.' },
    { mark: 'Four-modality outbound', body: 'Hazmat aerosols + cube-extreme Ziploc + ambient liquids + B2B Professional on shared yard surface at every plant.' },
    { mark: 'Brantford pressure', body: '$50M Glade investment · Canadian DC consolidation · March 2024 · more trailers through surviving yards.' },
    { mark: 'Family-ownership window', body: 'Fifth-generation Johnson family · ~$13B private · long-horizon capex posture, not quarterly-EPS pressure.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Rick Camacho. The standards-and-procedures discipline you carried from the Navy SWO foundation through P&G, Reckitt, Coca-Cola HBC, Hershey, and Danone is the discipline that turns a four-modality mixed-fleet outbound into one operating standard. The five minutes that follow are about the network-tier layer above the per-site yard tools at Waxdale, Bay City, Brantford, and Toluca — the lever the long-horizon family-ownership capex window is well-shaped to fund.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#00539C',
  },
};
