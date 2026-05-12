/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * CJ Logistics America is a confirmed legacy PINC reference (DSC Logistics
 * named PINC for its Mira Loma, CA Logistics Center pre-CJ acquisition).
 * PINC was acquired by Kaleris in 2022. Specifics:
 *   - The DSC Mira Loma deployment is the only publicly documented PINC site
 *     in the CJ Logistics America network.
 *   - CJ Logistics America does NOT have a publicly disclosed enterprise-wide
 *     YMS — meaningfully cleaner runway than at Kenco or DHL Supply Chain.
 *   - The TES function (Technology, Engineering, Systems & Solutions) is the
 *     Korean parent's flagship technology platform; Laura Adams runs the NA
 *     version. OneTrack precedent: 6-year partnership → 40+ sites, 73% safety
 *     event reduction, 11% UPH lift. The productization template Adams owns.
 *
 * Pitch shape: PARTNERSHIP — yard-execution + multi-tenant orchestration
 * layer that enters the CJ Logistics America TES product catalog the same
 * way OneTrack did, distributed across customer engagements as a CJ-branded
 * capability. Not displacement of any specific YMS — none is publicly
 * standardized network-wide. WMS-agnostic by design (Blue Yonder + Korber +
 * SAP EWM run in parallel per customer choice).
 *
 * This intel powers the partnership cold-email framing (see
 * docs/research/laura-adams-cj-logistics-america-dossier.md). The DSC-era
 * PINC reference is internal context only — the memo speaks about "the
 * site-level yard tools you inherited" without naming Kaleris/PINC.
 */

/**
 * CJ Logistics America — ABM Microsite Data
 * Quality Tier: A (confirmed legacy PINC at DSC Mira Loma; no enterprise-wide
 *                  YMS publicly standardized — meaningfully clean runway)
 * Pitch shape: PARTNERSHIP — yard-execution layer that enters the TES
 *              product catalog the way OneTrack did, distributed across
 *              customer engagements
 * Angle: YARD MANAGEMENT (multi-tenant 3PL multi-customer DC orchestration,
 *        WMS-agnostic execution layer, greenfield embed at Elwood + the
 *        NEXUS Korea-US capex sites) — NOT driver experience
 * Stakeholder vocabulary: engineering / solutions-design register
 *        (Adams' Purdue Industrial Management + Lucent + ~20-year 3PL
 *        tenure) — frameworks, integration architecture, costed
 *        assumptions, productization pipeline
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const cjLogisticsAmerica: AccountMicrositeData = {
  slug: 'cj-logistics-america',
  accountName: 'CJ Logistics America',
  coverHeadline: 'The next TES product-catalog entry after OneTrack',
  titleEmphasis: 'after OneTrack',
  coverFootprint: '~70+ NA · 30M+ sq ft',
  parentBrand: 'CJ Logistics Corp (Seoul)',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 83,

  pageTitle: 'YardFlow for CJ Logistics America - The Yard-Execution Layer for the TES Product Catalog',
  metaDescription:
    'How the multi-tenant yard-execution layer enters the CJ Logistics America Technology, Engineering, Systems & Solutions (TES) catalog — the same productization path OneTrack walked from one site to 40+ — and lands at the Elwood IL mega-center + NEXUS Project greenfield yards at $457M capex scale.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the CJ Logistics America operating model',
      composition: [
        { label: 'Network scale', value: '~70+ NA locations (warehousing, transportation, freight forwarding, corporate); ~30M sq ft+ warehousing footprint at the 2020 DSC integration baseline, meaningfully larger today after multiple 2024–2026 expansions' },
        { label: 'TES function as the technology gatekeeper', value: 'TES (Technology, Engineering, Systems & Solutions) is the Korean parent\'s flagship technology platform, landed in NA under Laura Adams as SVP. Her January 2025 promotion explicitly added Continuous Improvement to the remit — i.e., the operating-KPI scorecard for what TES productizes' },
        { label: 'TES productization thread', value: 'The repeatable TES motion is documented across multiple partner technologies: identify a customer-side operating gap, pilot at one site with KPIs aligned to the Continuous Improvement scorecard, validate the lift in the 30–90 day window, scale across the multi-tenant network, productize as a CJ-branded capability inside the TES catalog, distribute across customer engagements. Yard execution and multi-tenant orchestration is the next obvious adjacency in that pipeline — the operating layer above whatever site-level yard tools any given customer inherited' },
        { label: 'WMS-agnostic by stated architecture', value: 'Blue Yonder WMS (primary), Korber WMS (under active implementation with Derrion Miller), SAP EWM (where customers require), customer-dictated others. The published TES architecture principle is WMS-agnostic — anything that demands WMS exclusivity is filtered out by design' },
        { label: 'Existing yard-tech layer', value: 'Legacy site-level yard tools exist at parts of the network (most notably the Mira Loma intermodal site inherited through the DSC integration); no enterprise-wide YMS has been publicly disclosed. That is unusual for a 3PL of this scale — meaningfully cleaner runway than at peers with entrenched network-wide YMS estates' },
        { label: '2024–2026 facility expansions', value: 'Gainesville GA (270,000 sq ft cold storage, opened 2024); New Century KS (291,000 sq ft cold storage, opened Q3 2025, conveyor-bridge to Upfield manufacturing, serves 85% of US within two days); Elwood IL (1.1M sq ft second-site mega-center, jointly funded with Korea Ocean Business Corporation under a $457M investment program, full ops H1 2026); three additional strategic US hubs announced; ~1.07M sq ft new industrial space leased south of Dallas' },
        { label: 'OneTrack precedent (the numeric template)', value: '6-year partnership · 40+ CJ Logistics America locations · 73% reduction in potential safety events (up to 98% at some sites) · 11% average UPH increase · 60% product damage reduction · Romeoville inventory-resolution from hours to minutes · Feb 2025 GlobeNewswire expansion announcement into predictive analytics and quality use cases. The numeric shape any next TES catalog entry will be benchmarked against' },
      ],
      hypothesis:
        'The interesting thing about CJ Logistics America is not whether the company needs yard tools at the four walls. There are site-level yard tools at parts of the network today (most visibly at the Mira Loma intermodal site inherited through the DSC integration), and operations continue. The interesting thing is that CJ Logistics America is a 3PL operator, not an end-shipper, and that flips the question. In a 3PL operating model every facility is a customer-facing yard, and what a customer buys from CJ is operating discipline they cannot replicate themselves. The structural distance between a records-layer yard tool at a single site and a multi-tenant orchestration layer that runs across an entire customer-facing network is the gap most peer 3PLs under-deliver against in identical fashion — and it is exactly the kind of operating-system gap the TES function exists to productize.\n\nThe TES function under Adams\' SVP-plus-Continuous-Improvement remit is structurally the right buyer for that gap. TES does not buy point tools; TES productizes operating capability for the customer base. The motion is documented and repeated: identify a customer-side need, pilot a partner technology, validate the KPIs against the Continuous Improvement scorecard, scale across the network, productize as a CJ-branded capability, distribute across customer engagements. OneTrack is the canonical precedent — 6 years, 40+ sites, 73% safety event reduction, 11% UPH lift, 60% product damage reduction, Feb 2025 expansion announcement into predictive analytics and quality. The yard-execution and multi-tenant orchestration layer is the obvious next entry in that catalog: it is multi-tenant from the data model up (which a 3PL operating model requires), it generates Continuous-Improvement-scorecard-shaped KPIs (dwell, gate-to-dock, dock contention, detention), and it travels across customer engagements the same way OneTrack did.\n\nTwo things make the timing distinctive, and they are not always open at the same time. First, the WMS-agnostic architecture principle Adams has stated on the record is a discriminating differentiator: legacy enterprise YMS tools are typically anchored to a single WMS estate, and a 3PL operating Blue Yonder + Korber + SAP EWM simultaneously per customer choice cannot adopt one without re-engineering against customer-dictated stacks. A multi-tenant execution layer that integrates by API rather than WMS exclusivity meets the stated architecture as written. Second, the Elwood Phase 2 mega-center (1.1M sq ft, H1 2026) and the three additional strategic US hubs announced are greenfield — and the cost of specifying network-tier yard orchestration into a TES-engineered greenfield at the design phase is materially lower than retrofitting it after the building goes live. Productization across the customer base is what turns one TES catalog entry into a 1-to-many distribution play the way OneTrack already became.',
      pullQuote:
        'The competitive question is not whether the freight moves; it is whether yard-execution discipline becomes a CJ-branded capability or stays a line item peer 3PLs all under-deliver on equally.',
      caveat:
        'This is built from CJ Logistics America public press releases, the OneTrack partnership announcements, the Korea Ocean Business Corporation joint-investment disclosures, Adams\' on-record interviews (Inbound Logistics May 2025, Robotics 24/7), and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: which sites are most receptive to entering the TES product catalog right now, whether the Elwood Phase 2 yard-ops design has been scoped yet, and how the cold-chain sites (Gainesville, New Century) are handling multi-customer trailer arbitration today.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the TES operating layer',
      artifact: {
        imageSrc: '/artifacts/cj-logistics-america-coverage-map.svg',
        imageAlt: 'TES operating-layer coverage map. Six tiles representing the CJ Logistics America operating layers under the TES product catalog. TES Solutions Design, OneTrack, WMS-Agnostic Stack, Elwood IL Phase 2, and 3 Strategic US Hubs are covered. The Yard Network Ops tile is unfilled, marked with a CJ Logistics red hairline outline.',
        caption: 'TES operating-layer coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public CJ Logistics America + TES + OneTrack + Korea Ocean Business Corporation disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America — bottled water at full weight, low margin, multi-temp at the premium SKU layer, with refill-returns flow. They are years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level operating model on top of their existing site-level yard systems. The read-across for CJ Logistics America is not direct — CJ Logistics is not a CPG end-shipper — but it is the read-across that matters at this account: many of CJ Logistics\' most demanding shipper customers run multi-site networks shaped like Primo, and they need the operating layer above their site-level yard tech. Productizing the yard-execution layer into the TES catalog means many CJ Logistics customer engagements gain access to that operating model as a CJ-branded capability — the same productization shape OneTrack walked from one site to 40+. If the operating model lands on the operationally hardest CPG freight in the country, the read-across to CJ Logistics\' multi-customer DCs is the easier lift — and it is what turns a single end-shipper deal into a 1-to-many distribution play across the CJ customer network. The operator-frame question, in one line: is yard-execution discipline a CJ-branded capability the TES catalog sells across the customer base, or a per-customer line item that peer 3PLs all under-deliver on equally.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The strongest pilot configurations at CJ Logistics America are different from end-shipper pilots: (1) one TES-pipeline site running a multi-customer DC, configured as a single-site OneTrack-cadence pilot with KPIs that match the Feb 2025 expansion-announcement format; (2) the Elwood Phase 2 mega-center as a greenfield yard-ops embed at go-live (H1 2026 timing makes the design conversation actionable now); (3) one of the new cold-chain sites (Gainesville GA or New Century KS) where multi-customer trailer contention is most acute against TES-aligned KPIs.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'cj-logistics-america-public',
          source: 'CJ Logistics America public communications + executive disclosures',
          confidence: 'public',
          detail: 'Anchors the ~70+ NA facility footprint, the executive structure (Kevin Coleman CEO since 2022; Brad Nuffer COO; Laura Adams SVP Technology, Engineering, Systems & Solutions and Continuous Improvement since January 2025), the WMS-agnostic architecture principle, and the DSC Logistics legacy integration (acquisition announced 2018, completed 2020, fully rebranded 2021).',
          url: 'https://www.cjlogisticsamerica.com/',
        },
        {
          id: 'cj-onetrack-partnership',
          source: 'CJ Logistics America + OneTrack partnership disclosures (Feb 2025 GlobeNewswire)',
          confidence: 'public',
          detail: '6-year partnership; deployed at 40+ CJ Logistics America locations; 73% reduction in potential safety events (up to 98% at some sites); 11% average UPH increase; 60% reduction in product damage; Romeoville facility inventory resolution from hours to minutes. Feb 2025 announcement explicitly recommits to expansion ("predictive analytics and quality use cases"). The published productization template TES has executed.',
        },
        {
          id: 'cj-kobc-investment',
          source: 'Korea Ocean Business Corporation joint-investment disclosure (June 2023)',
          confidence: 'public',
          detail: '$457M joint investment program with CJ Logistics for US logistics centers. Elwood IL (1.1M sq ft) broke ground Oct 2024, full operations H1 2026 — second CJ facility in Elwood; engineered for TES automation from day one. Additional NEXUS Project facilities tied to Korea-US trade lane.',
        },
        {
          id: 'cj-2024-2025-expansions',
          source: 'CJ Logistics America 2024–2025 facility additions',
          confidence: 'public',
          detail: 'Gainesville GA (270,000 sq ft cold storage, opened 2024); New Century KS (291,000 sq ft cold storage, opened Q3 2025, conveyor-bridge to Upfield, serves 85% of US within two days); ~1.07M sq ft new industrial space leased south of Dallas; three additional strategic US hubs announced (The Loadstar). The cold-chain build-out is the explicit growth vector with a dedicated Cold Chain Business Development Leader hired Jan 2025.',
        },
        {
          id: 'cj-tech-stack',
          source: 'CJ Logistics America technology stack disclosures (Robotics 24/7 + SVT Robotics coverage)',
          confidence: 'public',
          detail: 'Blue Yonder WMS (primary), Korber WMS (active implementation under Derrion Miller, Sr. Manager WMS), SAP EWM (where customers require). SVT Robotics SOFTBOT Platform as vendor-agnostic integration layer for AMRs, automated lift trucks, voice, vision. Stated WMS-agnostic architecture principle.',
        },
        {
          id: 'adams-inbound-logistics',
          source: 'Laura Adams Inbound Logistics feature (May 2025) + 2023 Women in Supply Chain Award',
          confidence: 'public',
          detail: 'Adams\' public framing of AI as a safety/engagement/skill-development lever first, productivity second. Her on-record position on TES architecture and the productization-through-pilots motion that scaled OneTrack to 40+ sites.',
        },
        {
          id: 'adams-tenure-record',
          source: 'Laura Adams tenure record — DSC Logistics → CJ Logistics America (LinkedIn + DSC executive disclosures + Purdue / UCLA Anderson alumni records)',
          confidence: 'public',
          detail: '~20-year tenure inside the DSC Logistics / CJ Logistics America organization; multi-role progression from engineering project management through solutions design into the TES SVP seat. Purdue BS Industrial Management; UCLA Anderson MBA. Pre-DSC at Lucent Technologies as Engineering Project Manager. January 2025 promotion explicitly added Continuous Improvement to the TES remit. The tenure shape matters because it explains why TES-internal productization moves at OneTrack cadence rather than vendor-procurement cadence.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges in multi-tenant 3PL operating contexts. These describe the conditions most contract-logistics networks operate under, not CJ Logistics America specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant — most directly applicable to CJ Logistics via the "CJ\'s shipper customers look operationally like Primo" read-across.',
        },
      ],
      unknowns: [
        'Which of the 70+ NA sites are most receptive to entering the TES product catalog right now, given the active OneTrack expansion and the Continuous Improvement scorecard',
        'Whether the Elwood Phase 2 yard-ops design has been scoped yet — and how the NEXUS Project hubs are being designed at the yard layer (greenfield embed vs. retrofit later)',
        'How shipper-specific appointment-window arbitration is handled today at the cold-chain sites (Gainesville GA, New Century KS) and any multi-customer DCs already in production — system logic, operator judgment, or per-customer per-site policy',
        'How the productization economics would be structured (per-site SaaS + customer rebill, white-label embed in TES product catalog, multi-tenant revenue share) and how that maps to the OneTrack commercial template',
        'Whether the Korean parent (CJ Logistics Corp / TES Innovation Center in Seoul) requires awareness or approval for partner-technology additions of this shape, and whether that changes the entry sequence',
        'Whether Blake Martin (Director Engineering, TES) or Derrion Miller (Sr. Manager WMS) is the right technical-scoping partner if Adams delegates the integration architecture conversation',
        'What KPI thresholds the TES Continuous Improvement scorecard requires for a partner-technology pilot to graduate from one-site validation into network productization — the OneTrack numeric template (73% safety, 11% UPH, 60% damage) is a public reference, but the internal pass/fail thresholds and review cadence for net-new catalog entries are not',
        'How CJ Logistics America\'s customer contracts treat embedded technology layered above customer-dictated WMS estates — whether catalog-entry productization requires per-customer commercial amendment, per-engagement scoping, or rolls into existing 3PL service agreements at TES discretion',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a 3PL partnership engagement, not a single-site procurement engagement. CJ Logistics America is distinctive in this round because the question is not whether yard tools belong in the 3PL operating model (they do, at the records layer at parts of the network) but whether the yard-execution and multi-tenant orchestration layer above the records layer is the right next addition to the TES product catalog — the same productization path OneTrack has already taken from one site to 40+ inside CJ. Laura, your team is the only TES seat in NA that has run that pattern end-to-end at the cadence the Continuous Improvement scorecard now formalizes; the memo is shaped to that pattern, not to a vendor-procurement cadence. The water comparable is intentional. Primo Brands runs the operationally hardest CPG freight in the country, and many of CJ Logistics\' most demanding shipper customers look operationally like Primo. Productizing the yard-execution layer into the TES catalog means many customer engagements gain it as a CJ-branded capability rather than as a separately sourced shipper tool.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Laura — the part most worth pushing back on is whether the TES productization motion you ran end-to-end with OneTrack (6 years, 40+ sites, 73% safety / 11% UPH / 60% damage, Feb 2025 catalog expansion into predictive and quality) is currently scoped to a single next-adjacency pipeline, or whether the catalog is taking concurrent entries — and where yard-execution lands in that sequence if so. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts: a TES scoping session against the Continuous Improvement scorecard, a 90-day OneTrack-cadence pilot conversation at one customer-funded site, or an integration architecture review with Blake Martin and Derrion Miller — not necessarily a vendor demo.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'cj-logistics-001',
      name: 'Laura Adams',
      firstName: 'Laura',
      lastName: 'Adams',
      title: 'SVP, Technology, Engineering, Systems & Solutions and Continuous Improvement',
      company: 'CJ Logistics America',
      email: 'laura.adams@cjlogisticsamerica.com',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Operations',
      currentMandate:
        'Runs TES — the Korean parent\'s flagship technology platform — for the NA arm, with Continuous Improvement added to the remit at her January 2025 SVP promotion. ~20 years inside the DSC Logistics / CJ Logistics America organization; Purdue BS Industrial Management + UCLA Anderson MBA; pre-DSC at Lucent Technologies as Engineering Project Manager. Architect of the OneTrack productization (6-year partnership, 40+ sites, 73% safety event reduction). 2023 Women in Supply Chain Award recipient. Public stance on the WMS-agnostic architecture principle: technology must respect the customer\'s WMS choice.',
      bestIntroPath:
        'Direct outreach to the TES SVP seat. Productization-coded framing — not vendor-demo framing. If delegated, Blake Martin (Director Engineering, TES) is the right technical scoping partner, or Derrion Miller (Sr. Manager WMS) for integration architecture. Do not bypass Adams to Brad Nuffer (COO) or Kevin Coleman (CEO) without her introduction — TES is the partnership-vetting function by job description, and around-her routing breaks the productization motion.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'cj-logistics-001',
        name: 'Laura Adams',
        firstName: 'Laura',
        lastName: 'Adams',
        title: 'SVP, Technology, Engineering, Systems & Solutions and Continuous Improvement',
        company: 'CJ Logistics America',
        email: 'laura.adams@cjlogisticsamerica.com',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Laura Adams - SVP, TES + Continuous Improvement',
      variantSlug: 'laura-adams',

      framingNarrative:
        'Laura, you have run the TES productization motion end-to-end already — identify a customer-side need, pilot a partner technology, validate KPIs against the Continuous Improvement scorecard, scale across the network, productize as a CJ-branded capability, distribute across customer engagements. OneTrack is the canonical proof: 6 years, 40+ sites, 73% safety event reduction, 11% UPH lift, 60% damage reduction, Feb 2025 catalog expansion into predictive analytics and quality. The yard-execution and multi-tenant orchestration layer is the natural next entry in that same catalog — multi-tenant from the data model up (which the 3PL operating model requires), WMS-agnostic by integration shape (which the architecture principle you stated on the record requires), and generating exactly the Continuous-Improvement-scorecard KPIs the January 2025 scope expansion now owns.',
      openingHook:
        'The OneTrack pattern, one layer over. 6 years · 40+ sites · 73% safety / 11% UPH / 60% damage · Feb 2025 catalog expansion. The yard-execution layer is the next TES product-catalog entry — multi-tenant from the data model up, WMS-agnostic by design (Blue Yonder + Korber + SAP EWM in parallel, no re-engineering), Continuous-Improvement-scorecard-shaped KPIs from day one.',
      stakeStatement:
        'Three windows are open simultaneously, and they are not always open together. Elwood Phase 2 (1.1M sq ft, H1 2026) and the three additional strategic US hubs are TES-engineered greenfields where embedding network-tier orchestration at the design phase is materially cheaper than retrofitting. The cold-chain sites (Gainesville GA, New Century KS) are multi-customer by definition and have shipper-specific appointment-window arbitration already in production today. And the OneTrack Feb 2025 expansion shows the catalog is in active-entry mode, not closed — the productization rhythm your team is already running at can absorb the next adjacency without disrupting the existing pipeline.',

      heroOverride: {
        headline: 'After OneTrack — the yard-execution layer is the next TES product-catalog entry.',
        subheadline:
          'Multi-tenant from the data model up. WMS-agnostic by design. Productization, not procurement. The Elwood Phase 2 mega-center, the NEXUS Project hubs, and the new cold-chain sites are greenfield yard-ops design windows open now — the OneTrack pattern, one layer over.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Engineering / solutions-design register. Adams designs and productizes for a living; ~20 years of 3PL tenure + Purdue Industrial Management + Lucent engineering means marketing language is discounted in real time and frameworks + integration architecture + costed assumptions are rewarded. Acknowledge the existing site-level yard tools respectfully — the records-layer tools function; the question is the execution and multi-tenant orchestration layer above them. Reference the WMS-agnostic principle explicitly — that is her stated architecture position. Make the productization path explicit (pilot → site → TES catalog → customer-base distribution), not implicit. Multi-tenancy first; do not lead with single-site dedicated-customer pilots.',
      kpiLanguage: [
        'TES product-catalog entry',
        'multi-tenant data model',
        'WMS-agnostic execution layer',
        'shipper-specific appointment-window arbitration',
        'productization cadence',
        'Continuous Improvement KPI attribution',
        'greenfield yard-ops embed at Elwood + NEXUS',
        'per-site SaaS + customer rebill',
        'OneTrack-cadence pilot template',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite as the operating-model proof — but the CJ Logistics-specific read-across is "CJ Logistics\' shipper customers look operationally like Primo," not "CJ Logistics itself is Primo-shaped." Productization across CJ Logistics\' customer base is what turns one operating-model proof into a 1-to-many distribution play. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '~70+ North America locations; ~30M sq ft+ warehousing baseline at the 2020 DSC integration, materially larger today; Elwood IL 1.1M sq ft second-site mega-center coming online H1 2026; three additional strategic US hubs announced',
    facilityTypes: [
      'Contract Logistics Warehouses (multi-customer + dedicated)',
      'Cold Storage Facilities (Gainesville GA, New Century KS)',
      'Multi-Customer Distribution Centers',
      'Intermodal Sites (Mira Loma CA legacy DSC site)',
      'NEXUS Project Hubs (Korea-US trade lane)',
    ],
    geographicSpread: 'North America (HQ: Des Plaines IL; Mira Loma CA intermodal legacy site; Gainesville GA cold storage 2024; New Century KS cold storage Q3 2025; Elwood IL 1.1M sq ft H1 2026; ~1.07M sq ft new industrial space leased south of Dallas)',
    dailyTrailerMoves: 'High-volume — 500+ active customer engagements across food & beverage, healthcare and medical supplies, tire and automotive, CPG, retail, e-commerce; new Elwood IL mega-center going live H1 2026 under the Korea Ocean Business Corporation $457M investment program',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL', 'Cold-Chain', 'Freight Forwarding'],
    avgLoadsPerDay: 'High-volume — food, CPG, and consumer goods dominant; WMS-agnostic architecture (Blue Yonder + Korber + SAP EWM run in parallel per customer choice) means yard-tech must integrate without WMS exclusivity',
    specialRequirements: [
      'Multi-customer dock orchestration (shared yard, different shipper fleets, different appointment windows)',
      'Cold storage logistics (Gainesville GA, New Century KS — pharmaceutical / healthcare growth vector)',
      'WMS-agnostic integration (Blue Yonder + Korber + SAP EWM in parallel)',
      'NEXUS Project Korea-US trade lane volumes at Elwood',
    ],
  },

  signals: {
    recentNews: [
      'Laura Adams promoted to SVP TES + Continuous Improvement in January 2025 — Continuous Improvement scope addition is the operating-KPI scorecard for what TES productizes.',
      'OneTrack expansion announcement (Feb 2025 GlobeNewswire): 6-year partnership, 40+ sites, 73% safety event reduction, 11% UPH lift, 60% product damage reduction — expanding into predictive analytics and quality use cases.',
      'Elwood IL 1.1M sq ft second-site mega-center going live H1 2026 — second CJ facility in Elwood; Korea Ocean Business Corporation $457M joint investment program.',
      'New Century KS cold storage (291,000 sq ft) opened Q3 2025 — conveyor-bridge to Upfield manufacturing; serves 85% of US within two days.',
      'New Cold Chain Business Development Leader hired January 2025 — cold chain is the explicit growth vector for pharma / healthcare.',
      'Adams\' on-record WMS-agnostic architecture position (Robotics 24/7) — discriminating differentiator vs. WMS-anchored legacy YMS tools.',
    ],
    urgencyDriver:
      'Three windows are open simultaneously and they are not always open. First, the Elwood Phase 2 mega-center (1.1M sq ft, H1 2026) and the additional NEXUS Project hubs are greenfield yard-ops design opportunities where embedding network-tier orchestration at the design phase is materially cheaper than retrofitting later. Second, the OneTrack expansion (Feb 2025 announcement) shows the TES productization cadence is in active expansion mode — the catalog is taking new entries, not closed. Third, Adams\' January 2025 Continuous Improvement scope addition means the operating-KPI scorecard for what TES productizes is now explicit, and yard-execution KPIs (dwell, gate-to-dock cycle, dock contention) are exactly the category Continuous Improvement programs need ammunition for.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'OneTrack precedent', body: '6-year partnership · 40+ sites · 73% safety event reduction · 11% UPH lift · Feb 2025 expansion announcement.' },
    { mark: 'Greenfield window', body: 'Elwood IL Phase 2 · 1.1M sq ft · H1 2026 · Korea Ocean Business Corporation $457M co-investment.' },
    { mark: 'Adams on the record', body: 'WMS-agnostic by design. Blue Yonder + Korber + SAP EWM run in parallel per customer choice.' },
    { mark: 'Continuous Improvement', body: 'Adams\' January 2025 SVP scope addition · the operating-KPI scorecard for what TES productizes.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Laura Adams. The productization pattern your team ran for six years with OneTrack — one site to 40+, 73% safety event reduction, 11% UPH lift, Feb 2025 expansion announcement — is the pattern the next five minutes builds on. What follows is the yard-execution layer as the next entry in the TES product catalog.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#B91C1C',
  },
};
