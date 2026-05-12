/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Universal Truckload Services (now ULH) is named in the Kaleris/PINC
 * Daimler case study customer list — a Group-level customer signal, not
 * site-specific. ULH publicly names AccuLinc® WMS + a TMS + a YMS in its
 * technology stack but does NOT name the YMS vendor by brand. PINC/Kaleris
 * is the assumed incumbent at the YMS market-share level. Treat the YMS
 * vendor as discovery, not assertion.
 *
 * Persona context: Jeff Morrish is Director, Supply Chain Business
 * Development at Logistics Insight Corporation (LINC), the value-added/
 * contract-logistics operating subsidiary of ULH. Warren MI base; Central
 * Michigan BS Marketing + Economics; automotive-vertical specialist. The
 * Business Development door at LINC = the pre-sale solution-design seat
 * that shapes the next OEM RFP response, NOT the procurement door (which
 * routes to Patrick Cox VP Operations or to corporate IT).
 *
 * Corporate context: ULH 2025 revenue $1.558B (−15.6% YoY); $(99.9M) net
 * loss; Intermodal segment in recovery with $124.4M impairments + $43.2M
 * restatement-related goodwill impairment. Contract Logistics is ~67% of
 * revenue post-Parsec acquisition (Sept 2024, $193.6M, 2,100 employees,
 * 20+ rail yards in US/Canada). 2024 General Motors Supplier of the Year
 * (third consecutive year). Tim Phillips CEO since Jan 2020; Matthew T.
 * Moroun controls ~73.2% voting equity. Michael H. Rogers CFO from June
 * 1, 2026.
 *
 * LINC operates ~1M sq ft parts sequencing plant for Stellantis east-side
 * Detroit Jeep plant + GM Orion EV value-added assembly at Factory Zero.
 *
 * Pitch shape: PARTNERSHIP — yard-execution + multi-tenant orchestration
 * layer that embeds into the LINC value-added services bid template, the
 * way Kaleris/PINC sits in its own market-leader category. Subsidiary-door
 * (LINC pre-sale) beats holding-co-door (ULH corporate IT procurement).
 * Partnership economics flow through the LINC customer billing, not the
 * ULH corporate tech budget.
 *
 * This intel powers the partnership cold-email framing (see
 * docs/research/jeff-morrish-universal-logistics-holdings-dossier.md). It
 * must not appear in any prospect-facing surface. The memo references "the
 * AccuLinc + TMS + YMS stack you publicly name" / "the records-layer yard
 * tool you operate" — never Kaleris/PINC.
 */

/**
 * Universal Logistics Holdings / LINC — ABM Microsite Data
 * Quality Tier: B (Universal Truckload Services named in Daimler/PINC case
 *                  study at the Group level; ULH publicly names AccuLinc
 *                  WMS + a YMS in tech stack but does NOT name the YMS
 *                  vendor by brand)
 * Pitch shape: PARTNERSHIP — yard-execution layer that embeds into the
 *              LINC value-added services bid template
 * Angle: YARD MANAGEMENT (plant-side OEM yard operations at LINC sites;
 *        multi-OEM multi-customer 3PL operating model; greenfield Parsec
 *        rail-terminal integration; finished-vehicle marshalling and
 *        parts-sequencing flows at automotive plants) — NOT driver
 *        experience
 * Stakeholder vocabulary: pre-sale solutions-design register
 *        (Morrish\'s LINC Business Development seat; Automotive Logistics
 *        conference circuit; OEM RFP response language) — bid templates,
 *        plant-side operating models, GM Supplier of the Year credibility,
 *        partnership economics through customer billing
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const universalLogisticsHoldings: AccountMicrositeData = {
  slug: 'universal-logistics-holdings',
  accountName: 'Universal Logistics Holdings',
  coverHeadline: 'The yard-execution layer for LINC\'s bid template',
  titleEmphasis: 'LINC\'s bid template',
  coverFootprint: 'Intermodal + dedicated + truck',
  parentBrand: 'Universal Logistics Holdings (Moroun-controlled)',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 70,

  pageTitle: 'YardFlow for ULH / Logistics Insight Corporation - The Yard-Execution Layer for LINC\'s Value-Added Services Bid Template',
  metaDescription:
    'How a multi-tenant yard-execution layer embeds into the Logistics Insight Corporation (LINC) value-added services operating standard — complementing the AccuLinc WMS + TMS + YMS stack ULH publicly names, and entering the next OEM RFP response as a differentiated capability inside the GM Supplier of the Year operating reputation.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the ULH / LINC operating model',
      composition: [
        { label: 'Three reporting segments (2025 10-K)', value: 'Contract Logistics — ~67% of 2025 revenue, the largest segment. Includes LINC value-added services at customer plants (sequencing, kitting, sub-assembly), dedicated contract carriage, AND Parsec rail terminal services (acquired Sept 2024, ~$1B+ annualized post-Parsec); Intermodal — drayage/rail-served container moves (the 2025 problem child with $124.4M goodwill + customer-relationship impairments, no remaining goodwill on the books, "recovery taking longer than anticipated"); Trucking — truckload brokerage + asset-based truckload via agent network and company fleet' },
        { label: 'LINC plant-side operations (Morrish\'s home)', value: 'Logistics Insight Corporation operates value-added services inside customer plants. Stellantis east-side Detroit Jeep plant: LINC runs a ~1M sq ft parts sequencing plant; GM Orion EV / Factory Zero: LINC operates the value-added assembly facility supporting EV production. Each contract has its own technology spec, increasingly shaped by what LINC brings to the pursuit' },
        { label: 'Parsec rail-terminal acquisition (Sept 30, 2024)', value: '$193.6M cash; 2,100 employees; 20+ rail yards in US/Canada; ~$230M TTM revenue at acquisition. Joins Contract Logistics. New yard-management surface in the ULH portfolio — rail terminal yards are a structurally different operating problem than plant-side LINC yards or truckload drayage yards' },
        { label: 'Parsec rail-terminal integration (the cross-segment surface)', value: 'Parsec brings 20+ rail terminal yards into a Contract Logistics segment whose existing yard surface was plant-side LINC. Rail terminal yard operations (intermodal lift sequencing, container in-gate / out-gate flow, hostler dispatch, demurrage clocks) is a different operating shape than LINC plant-side (line-side replenishment, returnable-container loops, plant-takt sequencing) — but a single execution layer that orchestrates both is the kind of post-acquisition synergy the 2025 Contract Logistics segment leadership is incentivized to deliver. Tying a Parsec rail-in to a LINC plant-in on the same execution surface is the operating-model artifact the integration program needs and the records-layer YMS does not produce' },
        { label: 'LINC bid-template productization (the repeatable motion)', value: 'LINC is on its third decade of embedding partner technology into the value-added services bid template — identify a plant-side operating need, validate the lift inside one OEM contract, productize as a LINC-branded capability inside the next OEM pursuit response, bill through to the OEM as part of the value-added services contract. AccuLinc WMS, the TMS, and the YMS records layer all entered the operating model that way. Yard execution + multi-tenant orchestration is the next obvious adjacency in that pipeline — the layer above the records-layer tools, designed for the multi-OEM multi-customer plant-side operating model LINC runs every day' },
        { label: 'Existing yard-tech layer', value: 'ULH publicly names AccuLinc® WMS + a TMS + a YMS in its technology stack — i.e., yard management already exists in the operating model. Specific YMS vendor is not publicly named. ELD-driven visibility and tender automation are publicly named investment areas. The records-layer yard tool exists; the execution + multi-tenant orchestration layer for the LINC plant-side and Parsec rail-terminal operating models is the gap' },
        { label: 'Customer position', value: '2024 General Motors Supplier of the Year (third consecutive year — also 2022, 2023). "Supports every one of the largest automaker manufacturers on their pickup truck and SUV plants." Strategically tied to Stellantis (Crown Enterprises related-party logistics + LINC east-side Detroit operation) and GM (Orion EV / Factory Zero value-added assembly)' },
        { label: 'Capital posture', value: '2025 revenue $1.558B (−15.6% YoY); net loss $(99.9M); intermodal segment in recovery. ~$150M capex planned for 2026 — capital discipline is the operating theme. New CFO Michael H. Rogers from June 1, 2026 succeeding Jude Beres through a period of internal-control remediation and segment repositioning. Apollo-comparable PE-rational decision math (Moroun family-controlled, NASDAQ controlled company, ~73.2% voting equity)' },
      ],
      hypothesis:
        'The interesting thing about ULH is not whether the company needs yard tools — ULH publicly names AccuLinc + a TMS + a YMS, the records-layer tools are in production, the case for site-level yard automation closed decades ago. The interesting thing is that ULH/LINC is a 3PL operator, not an end-shipper, and that flips the question. The corporate ULH category fight against the YMS market is a procurement evaluation against the market leader — routed to ULH corporate IT, decided on category criteria, capped against the ~$150M 2026 capex envelope under capital-discipline framing. That is not the path. The LINC plant-side operating model is the other path: LINC operates inside customer plants, the yard at every one of those operations is plant-side — sequencing centers, sub-assembly plants, parts-marshalling yards, returnable-container loops — and the yard is the operating system the OEM is buying from LINC, not from a corporate IT line item.\n\nLINC\'s day job is exactly this. LINC has spent its third decade embedding partner technology into the plant-side operating model and billing it through to the OEM as part of the value-added services contract — AccuLinc WMS, the TMS, the YMS records layer all entered the bid template that way. The pre-sale solutions-design seat Morrish holds is the seat that decides what the next bid template carries. Productizing the yard-execution and multi-tenant orchestration layer into the LINC bid template means many LINC plant-side customer engagements gain access to that operating model as a LINC-branded capability — multi-tenant from the data model up (LINC operates Stellantis east-side Detroit and GM Orion EV simultaneously with different operating models per OEM), shaped for the GM Supplier of the Year operating reputation, and billed through to the OEM as part of value-added services pricing rather than as a corporate tech line item.\n\nThree forward pressures compound the timing, and they are not always open at the same time. First, Contract Logistics is the segment ULH is leaning into post-Parsec (~$1B+ annualized; ~67% of 2025 revenue) — margin compression is the watch-item but the volume base is the largest by far and the segment is in the bid-pursuit phase, not the cost-cut phase. Second, ULH is GM Supplier of the Year for the third consecutive year — OEMs are starting to ask about real-time gate-to-dock orchestration, driver-facing workflows, and shipper-visible feeds in the next RFP response, and Morrish\'s pre-sale solutions-design seat is the surface where that question gets answered. Third, the Parsec rail-terminal integration creates a third yard surface (rail terminal yards) that has its own operating model distinct from LINC plant-side and from truckload drayage — and tying Parsec rail moves to LINC plant moves on the same execution surface is the cross-segment synergy artifact the integration program needs to deliver in 2026. Productization across LINC\'s OEM customer base is what turns one operating-model proof into a 1-to-many distribution play across plant contracts the same way the existing WMS estate already became.',
      pullQuote: 'LINC operates inside customer plants; the yard at every one of those operations is plant-side — and the yard is the operating system.',
      caveat:
        'This is built from ULH 2025 10-K disclosures, the Parsec acquisition announcement, ULH technology page positioning, Morrish\'s LINC public-facing role, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: what the existing YMS at ULH actually is at depth (the public technology page names AccuLinc + a TMS + a YMS but not the YMS vendor specifically), how the Parsec rail-terminal operating model is being integrated against the LINC plant-side operating model, and which OEM RFP cadence is most actionable for a yard-execution-layer pursuit response.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the LINC operating layer',
      artifact: {
        imageSrc: '/artifacts/universal-logistics-holdings-coverage-map.svg',
        imageAlt: 'LINC operating-layer coverage map. Seven tiles representing the ULH / Logistics Insight Corporation operating layers that ride into the value-added services bid template. AccuLinc WMS, TMS, YMS records, Parsec rail terminals, LINC plant-side, and Trucking are covered. The Execution Orchestration tile is unfilled, marked with a ULH navy hairline outline.',
        caption: 'LINC operating-layer coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public ULH 10-K + Parsec acquisition + ULH technology page + GM Supplier of the Year disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. They are years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level operating model on top of their existing site-level yard systems. The read-across for ULH / LINC is not direct — ULH is a 3PL operating plant-side at automotive customers, not a CPG end-shipper — but it is the read-across that matters at this account: the operating-model proof is what LINC needs to put in front of the next OEM RFP response. Productizing the yard-execution layer into the LINC bid template means many LINC plant-side customer engagements gain access to that operating model as a LINC-branded capability — billed through to the OEM as part of value-added services. If the operating model lands on the operationally hardest CPG freight in the country, the productization read-across to LINC\'s plant-side automotive customer base is the easier lift. The partnership-economics question, in one line: is yard-execution discipline a LINC-branded capability the bid template sells through to the OEM as part of value-added services pricing, or a separately sourced line item on a corporate tech budget peer 3PLs all underbid identically.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The strongest pilot at ULH / LINC is one LINC-operated plant site — likely the Stellantis east-side Detroit Jeep parts sequencing plant or the GM Orion EV / Factory Zero value-added assembly facility — as a 90-day operating-model pilot with a joint readout into the next OEM pursuit response. The follow-on is one Parsec rail-terminal site to demonstrate the cross-segment operating layer tying rail moves to plant moves. Single-plant pilot footprint matches LINC\'s natural unit of work (one plant contract, one operating model).',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'ulh-2025-10k',
          source: 'ULH 2025 10-K + segment disclosures',
          confidence: 'public',
          detail: 'Three reporting segments: Contract Logistics (~67% of 2025 revenue, includes LINC value-added services + Parsec), Intermodal (drayage/rail-served container, the 2025 impairment driver), Trucking (TL brokerage + asset-based TL). 2025 revenue $1.558B (−15.6% YoY); net loss $(99.9M); diluted EPS $(3.79); $124.4M intermodal impairment + $43.2M restatement-related goodwill impairment; ~$150M capex planned for 2026.',
        },
        {
          id: 'ulh-parsec-acquisition',
          source: 'ULH Parsec acquisition disclosure (September 30, 2024)',
          confidence: 'public',
          detail: '$193.6M cash; ~2,100 employees; 20+ rail yards in US/Canada; ~$230M TTM revenue at acquisition. Parsec joins Contract Logistics segment. Annualized post-Parsec Contract Logistics revenue >$1B.',
        },
        {
          id: 'linc-operations',
          source: 'Logistics Insight Corporation public operations disclosures',
          confidence: 'public',
          detail: 'LINC operates value-added services inside customer plants. Public references: ~1M sq ft parts sequencing plant for Stellantis east-side Detroit; GM Orion EV / Factory Zero value-added assembly facility; Crown Enterprises (Moroun-related) doubled a 500,000 sq ft logistics and sub-assembly facility for Stellantis\' new Jeep plant. LINC\'s day job: design and operate plant-side operating models for OEM customers.',
        },
        {
          id: 'ulh-tech-stack',
          source: 'ULH technology stack disclosures',
          confidence: 'public',
          detail: 'AccuLinc® WMS named publicly. TMS and YMS named in the public technology positioning but not by vendor brand. ELD-driven visibility + tender automation publicly named as investment areas to lift tender acceptance and reduce dwell. Implication: yard management already exists in the operating model; the execution and multi-tenant orchestration layer is the gap.',
        },
        {
          id: 'ulh-gm-supplier-of-year',
          source: 'GM Supplier of the Year (third consecutive: 2022, 2023, 2024)',
          confidence: 'public',
          detail: 'ULH named 2024 GM Supplier of the Year, announced April 2025. Three-year streak. GM\'s value-added operations at LINC sites are publicly tied to the award.',
        },
        {
          id: 'ulh-leadership',
          source: 'ULH executive disclosures',
          confidence: 'public',
          detail: 'Tim Phillips President and CEO since January 10, 2020 (previously EVP Transportation + President Universal Intermodal Services); Matthew T. Moroun Chairman, ~73.2% voting equity via family trusts (NASDAQ-defined controlled company); Michael H. Rogers CFO from June 1, 2026 (succeeding Jude Beres); Patrick Cox VP Operations (corporate-level, ULH-wide).',
        },
        {
          id: 'morrish-tenure-record',
          source: 'Jeff Morrish tenure record — Logistics Insight Corporation / LINC (LinkedIn + Central Michigan alumni records + Automotive Logistics conference appearances)',
          confidence: 'public',
          detail: 'Director, Supply Chain Business Development at Logistics Insight Corporation (LINC), the value-added/contract-logistics operating subsidiary of ULH. Warren MI base (same campus as ULH corporate). BS Marketing + Economics, Central Michigan University. Automotive-vertical specialist; recurring Automotive Logistics conference presence. The seat is the pre-sale solutions-design door inside LINC — the function that designs the operating model a new OEM customer signs up for and that decides which partner technologies enter the value-added services bid template for the next plant-side pursuit. The tenure shape matters because it explains why LINC bid-template additions move at solutions-design cadence rather than at corporate IT procurement cadence.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on plant-side yard cycle variance, dwell-time distributions, and detention-cost ranges in automotive plant-side operating contexts. These describe the conditions most plant-side 3PL operations operate under, not ULH/LINC specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant — most directly applicable to ULH/LINC via the "operating-model proof for the next OEM RFP response" read-across.',
        },
      ],
      unknowns: [
        'What the existing YMS at ULH is at depth — the public technology page names AccuLinc + a TMS + a YMS but not the YMS vendor specifically. The category-of-incumbent assumption is one of the major enterprise yard-management vendors, but the specific vendor is not confirmed at ULH',
        'How the Parsec rail-terminal operating model is being integrated against the LINC plant-side operating model — and where the cross-segment yard-orchestration opportunities sit',
        'Which OEM RFP cadence is most actionable for a yard-execution-layer pursuit response in 2026 — Stellantis, GM, Ford, Toyota all have active LINC engagements at different cadences',
        'How the partnership economics would flow through the LINC value-added services bid pricing — billable through to the OEM as part of the operating model, not a line item on ULH corporate tech budget',
        'Whether the LINC President (name unverified) or EVP Contract Logistics (name unverified) is the right executive sponsor seat if a pilot becomes a strategic-partnership conversation',
        'Whether Trent Gustafson (Director, Supply Chain Business Development, ULH-corporate counterpart) is the right lateral handoff or whether Patrick Cox (VP Operations) is the right procurement-coded escalation if Morrish delegates',
        'What internal review the LINC bid template runs before a new partner technology enters the value-added services product catalog — pre-sale solutions-design has the seat, but the pass/fail thresholds, the OEM-customer notification gates, and the price-into-the-contract treatment for catalog additions are not externally visible and shape whether a yard-execution-layer entry can be sequenced into an active pursuit or has to wait for the next bid window',
        'How LINC contractually treats partner-technology productization across multi-OEM engagements — whether yard-execution-layer entry into the bid template requires per-customer commercial amendment, per-pursuit scoping, or rolls into existing value-added services agreements at LINC discretion (and whether GM, Stellantis, and the other OEM customers each treat the inheritance of a new LINC capability differently)',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a 3PL plant-side partnership engagement. ULH / LINC is distinctive in this round because the question is not whether yard tools belong in the 3PL operating model (they do, at the records layer — ULH names AccuLinc + a TMS + a YMS publicly) but whether the yard-execution and multi-tenant orchestration layer above the records layer is the right next entry in the LINC value-added services bid template — sold to OEMs alongside sequencing, kitting, and sub-assembly. Jeff, the pre-sale solutions-design seat at LINC is the seat that decides what the next OEM RFP response carries, and the GM Supplier of the Year three-year streak is the operating reputation the next entry has to be worthy of; the memo is shaped to that pattern, not to a corporate IT procurement cadence. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and the operating-model proof is what LINC needs to put in front of the next OEM RFP response.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Jeff — the part most worth pushing back on is whether the LINC bid-template productization motion that carried AccuLinc, the TMS, and the YMS records layer into the value-added services contract is currently in single-next-adjacency mode, or whether the catalog is taking concurrent entries — and where yard-execution and multi-tenant orchestration lands in that sequence against the GM Supplier of the Year three-year operating reputation. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts: a partnership-scoping conversation against the pre-sale solutions-design seat, a 90-day operating-model pilot at one LINC plant site (Stellantis east-side Detroit or GM Orion EV / Factory Zero), or a joint scoping session with the next OEM pursuit team — not necessarily a vendor demo.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'universal-logistics-001',
      name: 'Jeff Morrish',
      firstName: 'Jeff',
      lastName: 'Morrish',
      title: 'Director, Supply Chain Business Development',
      company: 'Logistics Insight Corporation (Universal Logistics Holdings)',
      email: 'jmorrish@universallogistics.com',
      roleInDeal: 'decision-maker',
      seniority: 'Director',
      function: 'Operations',
      currentMandate:
        'Director, Supply Chain Business Development at Logistics Insight Corporation (LINC) — the value-added/contract-logistics operating subsidiary of ULH. Warren MI base (same campus as ULH corporate). BS Marketing + Economics, Central Michigan University. Automotive-vertical specialist; Automotive Logistics conference circuit. Pre-sale solution-design seat: the function that designs the operating model a new customer signs up for, and that decides what tools are in the standard playbook when LINC wins the next plant-side contract.',
      bestIntroPath:
        'Direct outreach to the LINC Business Development seat with partnership-coded, pursuit-aware framing. NOT routed to ULH corporate IT (where a yard pitch goes into a category fight against the YMS market leader). Subsidiary-door (LINC pre-sale) beats holding-co-door (ULH corporate). If Morrish delegates or routes: Trent Gustafson (Director, Supply Chain Business Development, ULH corporate counterpart) is the cleanest lateral handoff; Patrick Cox (VP Operations) is more procurement-coded. Executive sponsor for strategic partnership: the President of LINC (name unverified) or EVP Contract Logistics (corporate counterpart, name unverified).',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'universal-logistics-001',
        name: 'Jeff Morrish',
        firstName: 'Jeff',
        lastName: 'Morrish',
        title: 'Director, Supply Chain Business Development',
        company: 'Logistics Insight Corporation (Universal Logistics Holdings)',
        email: 'jmorrish@universallogistics.com',
        roleInDeal: 'decision-maker',
        seniority: 'Director',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Jeff Morrish - Director, Supply Chain Business Development, LINC',
      variantSlug: 'jeff-morrish',

      framingNarrative:
        'Jeff, the LINC bid template is the document that has carried partner technology into the value-added services contract for three decades — AccuLinc WMS, the TMS, the YMS records layer all entered the operating model through the same pre-sale solutions-design seat you hold today, and each was billed through to the OEM as part of the value-added services contract rather than sourced as a corporate-IT line item. The yard-execution and multi-tenant orchestration layer is the natural next entry in that same template — multi-tenant from the data model up (LINC operates Stellantis east-side Detroit and GM Orion EV simultaneously with different plant-side operating models per OEM), shaped for the GM Supplier of the Year three-year operating reputation, and integration-shaped against the records-layer YMS already in production rather than against it. The next visible differentiator OEMs are starting to ask about in the RFP response — real-time gate-to-dock orchestration, driver-facing workflows, shipper-visible feeds — is the layer above the records-layer YMS, and the bid template is the surface where that capability gets carried into the next pursuit.',
      openingHook:
        'The LINC bid-template pattern, one layer over. AccuLinc, the TMS, and the YMS records layer all entered the value-added services contract through the same pre-sale solutions-design door. Yard execution and multi-tenant orchestration is the next entry — multi-tenant by design (Stellantis east-side Detroit and GM Orion EV operating models in parallel), partnership economics through customer billing rather than corporate IT, plant-side operating-model-shaped KPIs from day one.',
      stakeStatement:
        'Three windows are open simultaneously, and they are not always open together. The Parsec rail-terminal integration is in the synergy-delivery phase post-Sept 2024 ($193.6M, 2,100 employees, 20+ rail yards US/Canada) — tying Parsec rail moves to LINC plant moves on the same execution surface is the cross-segment artifact the integration program needs in 2026. The GM Supplier of the Year three-year streak is fresh credibility the next OEM RFP response can lean on, and OEMs are asking about gate-to-dock orchestration + shipper-visible feeds + driver-facing workflows in the next round. The ~$150M 2026 capex envelope under capital-discipline framing closes the corporate-IT YMS replacement path for the right reasons — and opens the partnership path that flows through LINC customer billing, embedded in value-added services pricing, sold as a LINC-branded capability inside the GM Supplier of the Year operating reputation.',

      heroOverride: {
        headline: 'The yard-execution layer for LINC\'s value-added services bid template.',
        subheadline:
          'Multi-tenant by design (LINC operates plants for Stellantis, GM, and others simultaneously with different plant-side operating models per OEM). Embeddable into the value-added services bid template alongside AccuLinc, the TMS, and the YMS records layer that already entered the operating model the same way. Partnership economics through LINC customer billing, not the ULH corporate tech budget. After Parsec — the natural next plant-side capability LINC can bid into the next OEM RFP response.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Pre-sale solutions-design / engineering register, automotive-vertical-fluent. Morrish lives between solutions engineering, ops, and the customer; his currency is what he can put in front of the next OEM RFP. Acknowledge the existing AccuLinc + TMS + YMS stack respectfully — the records-layer tools function. Position the wedge as the layer above (execution + multi-tenant orchestration), not as replacement. Avoid the 2025 financial loss / impairments in opening outreach — it is true, it is relevant strategically, but it is not the right peer-to-peer opener. Hold for the second conversation when the topic is operating leverage. Partnership-coded, not vendor-coded.',
      kpiLanguage: [
        'value-added services bid template entry',
        'multi-OEM multi-customer 3PL operating model',
        'plant-side execution + multi-tenant orchestration',
        'GM Supplier of the Year operating reputation',
        'partnership economics through customer billing',
        'pre-sale solution-design seat',
        'OEM RFP response differentiator',
        'cross-segment yard orchestration (LINC plant + Parsec rail)',
        '90-day operating-model pilot at one plant site',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite as the operating-model proof — but the ULH/LINC-specific read-across is "operating-model proof for the next OEM RFP response," not "ULH itself is Primo-shaped." Productization across LINC\'s OEM customer base is what turns one operating-model proof into a 1-to-many distribution play across plant contracts. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if the conversation moves to peer reference.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Contract Logistics (~67% of 2025 revenue) including LINC value-added operations at OEM plants + Parsec rail terminal services (Sept 2024 acquisition, $193.6M, 20+ rail yards US/Canada, ~2,100 employees); Intermodal drayage; Trucking — ~$1B+ annualized contract logistics revenue post-Parsec',
    facilityTypes: ['Plant-Side Value-Added Operations (LINC at Stellantis east-side Detroit Jeep plant ~1M sq ft parts sequencing; GM Orion EV / Factory Zero)', 'Rail Terminals (Parsec 20+ yards)', 'Truckload Terminals', 'Intermodal Ramps'],
    geographicSpread: 'North America (HQ: Warren MI; heaviest density in Michigan / Midwest auto-supplier corridor; Parsec rail yards across US/Canada; Southern California ports for intermodal/drayage; Mexico, Canada, Colombia per corporate description)',
    dailyTrailerMoves: 'High-volume — modeled at network level across LINC plant-side yards, 20+ Parsec rail terminals, and truckload/intermodal operations',
    fleet: 'Private fleet signal confirmed (yes) — supports every major automaker on pickup truck and SUV plants',
  },

  freight: {
    primaryModes: ['Plant-Side Value-Added Logistics (LINC)', 'Truckload', 'Intermodal', 'Drayage', 'Rail Terminal Services (Parsec)'],
    avgLoadsPerDay: 'High-volume — GM Supplier of the Year 2022/2023/2024; "supports every one of the largest automaker manufacturers on their pickup truck and SUV plants"; ~$1B+ annualized contract logistics revenue post-Parsec',
    specialRequirements: [
      'Plant-side OEM yard operations (parts sequencing, kitting, sub-assembly, returnable-container loops, line-side replenishment to plant takt time)',
      'Multi-OEM multi-customer 3PL operating model (Stellantis, GM, Ford, Toyota plant-side simultaneously with different operating models)',
      'Rail terminal yard operations (Parsec) distinct from plant-side LINC and from truckload drayage',
      'Finished-vehicle marshalling and dealer-convoy outbound at certain plant contracts',
    ],
  },

  signals: {
    recentNews: [
      'Parsec rail terminal operator acquired September 30, 2024 ($193.6M cash; 2,100 employees; 20+ rail yards in US/Canada; ~$230M TTM revenue at acquisition). Joins Contract Logistics — new yard surface in the portfolio.',
      'ULH 2025 revenue $1.558B (−15.6% YoY); net loss $(99.9M); intermodal impairments $124.4M + restatement-related goodwill impairment $43.2M. ~$150M 2026 capex planned — capital discipline is the operating theme.',
      'Michael H. Rogers appointed CFO effective June 1, 2026 — succeeding Jude Beres through internal-control remediation and segment repositioning.',
      'GM Supplier of the Year 2024 (announced April 2025) — third consecutive year (also 2022, 2023). LINC plant-side value-added operations are publicly tied to the award.',
      'LINC operates ~1M sq ft parts sequencing plant for Stellantis east-side Detroit Jeep plant; GM Orion EV / Factory Zero value-added assembly facility — strategic positions for any operating-model bid template.',
    ],
    urgencyDriver:
      'Contract Logistics is the segment ULH is leaning into post-Parsec (~67% of 2025 revenue at $1B+ annualized) — and the next OEM RFP response is the surface where a LINC value-added services bid template gets re-cut for what differentiated capability LINC can put in front of the customer. GM Supplier of the Year three years running is the operating reputation; the next visible differentiator OEMs are asking about is the real-time gate-to-dock orchestration + driver-facing workflows + shipper-visible feeds layer above the records-layer YMS that ULH already names publicly. The cleanest path is partnership economics through the LINC customer billing — embedded in value-added services pricing — not procurement against the YMS market leader at corporate IT.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Parsec', body: 'Sept 2024 · $193.6M · 2,100 employees · 20+ rail yards US/Canada · joins Contract Logistics.' },
    { mark: 'GM Supplier of the Year', body: '2022 · 2023 · 2024 — three consecutive years. LINC plant-side value-added operations are publicly tied to the award.' },
    { mark: 'Existing stack', body: 'AccuLinc WMS + TMS + YMS named publicly. Records layer exists; the execution + multi-tenant orchestration layer above is the gap.' },
    { mark: 'Morrish on the seat', body: 'LINC Business Development — the pre-sale solution-design door that decides what tools are in the next OEM RFP response.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · operating-model proof for the next OEM RFP response.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Jeff Morrish. The LINC value-added services bid template — the document that decides what tools are in the standard playbook for the next OEM plant contract — is the surface the next five minutes is about. GM Supplier of the Year three years running is the operating reputation; what follows is the layer above the records-layer YMS that ULH already names publicly, designed for the multi-OEM multi-customer plant-side operating model LINC runs every day.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#1E3A5F',
  },
};
