/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * The Home Depot has no publicly disclosed enterprise YMS spanning the
 * ~200+ HD facilities or the ~1,050+ SRS/GMS branch federation. Coverage
 * emphasizes WMS, TMS, "ship from best location" order routing, robotics,
 * and the Pro-delivery handheld — not YMS. The Relay program (2025) is a
 * de facto yard product running on store parking-lot real estate without
 * an underlying purpose-built yard system. SRS and GMS each came in with
 * their own WMS, dispatching, and driver management; HD's federated yard-
 * and-dock visibility problem is structurally larger than at any single-
 * brand retail peer.
 *
 * Persona context: John Deaton (EVP Supply Chain & Product Development
 * since November 1, 2021) — 19-year HD tenure, ex-Ernst & Young → Office
 * Depot officer roles → joined HD 2007 as VP Supply Chain Development.
 * He PERSONALLY led the rollout of the 19 RDCs beginning in 2007 — the
 * foundational replenishment architecture HD still runs on. Promotion
 * track: VP Supply Chain Development → SVP Brand & Product Development
 * (2011) → SVP Supply Chain (2017) → SVP U.S. Retail Operations (early
 * 2021) → EVP Supply Chain & Product Development (Nov 1, 2021). BBA
 * Georgia State (Operations Management + Decision Sciences, honors);
 * Atlanta-rooted; entire HD career inside the Atlanta SSC orbit. EVP-
 * level owner of the $500M cost-savings initiative (announced June 2023
 * IAC, completed FY2024). Long-tenure operator, architecture-literate,
 * cost-disciplined, quietly public — does not headline industry trade
 * shows. Sales register: "you built the network · now run it hot."
 *
 * The CFO-on-the-record framing is Richard McPhail (EVP & CFO): the
 * December 9, 2025 strategic update told investors the MDO/DFC/FDC
 * buildout is "essentially complete." The capex curve is past peak; the
 * throughput-per-asset chapter is starting. FY2026 guidance: sales +2.5–
 * 4.5%; comp sales flat to +2%; capex ~2.5% of sales (~$4.1B); EPS flat
 * to +4%. Market is soft; margin defense and throughput-per-existing-
 * asset are the strategic posture.
 *
 * Pro-customer TAM (Mingledorff's announcement, March 24, 2026; closed
 * May 11, 2026): HVAC distribution represents a ~$100B TAM addition,
 * lifting the total Pro-customer TAM to ~$1.2 trillion. Pro-customer
 * sales today are roughly $90B of the $165B FY total (~55% of sales).
 *
 * Pitch shape: COEXISTENCE WEDGE (network-tier operating-model layer
 * above whatever per-site / per-archetype yard tooling exists today
 * across RDC, FDC, MDO, DFC, and the SRS/GMS federation). Operator-to-
 * operator register — peer-to-peer with the architect of the RDC layer.
 * The wedge is the layer above the archetypes, not replacement of them.
 */

/**
 * The Home Depot — ABM Microsite Data
 * Quality Tier: 1 Band A (retail — Pro-customer growth story + post-
 *               buildout "run it hot" pivot is the timing seam)
 * Pitch shape: coexistence wedge — network-tier operating-model layer
 *              above whatever runs per-archetype today
 * Angle: YARD MANAGEMENT (multi-channel dock arbitration, archetype-
 *        tier coordination, Pro-channel service-level defense at the
 *        yard tier) — NOT driver experience
 * Stakeholder vocabulary: long-tenure operator register (Deaton's
 *        19-year HD tenure + RDC-rollout architect lineage + $500M
 *        cost-savings discipline) — throughput-per-asset, network
 *        utilization, Pro-channel reliability, federation-friendly
 *        deployment
 */

import type { AccountMicrositeData } from '../schema';

export const theHomeDepot: AccountMicrositeData = {
  slug: 'the-home-depot',
  accountName: 'The Home Depot',
  coverHeadline: 'Four archetypes coordinating one Pro-customer operating model',
  titleEmphasis: 'one Pro-customer operating model',
  coverFootprint: '2,300 stores · 4 DC archetypes',
  parentBrand: 'The Home Depot',
  vertical: 'retail',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 88,

  pageTitle: 'YardFlow for The Home Depot — The Network-Tier Layer Above the Archetypes',
  metaDescription:
    'The Home Depot runs four distribution-center archetypes (RDC, FDC, MDO, DFC) plus a ~1,050-branch SRS/GMS Pro ecosystem feeding stores, contractor job-sites, and B2C delivery from the same dock infrastructure. The capex chapter is essentially complete; the throughput-per-asset chapter starts at the yard layer above the archetypes.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about The Home Depot network',
      composition: [
        { label: 'Store footprint', value: '~2,300 stores across the U.S., Canada, and Mexico — the demand surface every distribution archetype feeds. ~$165B FY2025 total sales; ~3.2% YoY; ~55% of customers are Pros and the Pro share of sales is roughly $90B of the $165B' },
        { label: 'Pro-customer TAM stack', value: 'Pre-SRS Pro-customer TAM ~$700B. SRS Distribution closed September 2024 ($18.25B EV — HD\'s largest deal ever) lifted SKU breadth and added the Pro-distribution branch footprint. GMS closed by SRS September 2025 ($5.5B) added drywall, ceilings, and steel-framing distribution. Mingledorff\'s HVAC closed May 11, 2026 (42 locations across five southeastern states) added ~$100B in HVAC distribution TAM. The combined Pro-customer TAM today is ~$1.2 trillion — and the Pro share is the growth lane the network was rebuilt for' },
        { label: 'Four-archetype DC scoreboard', value: 'RDC (Rapid Deployment Center) ~19 sites, ~550K sq ft each — high-velocity, short-dwell store replenishment, appointment-driven inbound from suppliers, outbound to stores. FDC (Flatbed Distribution Center) 17 open · ~40 planned, ~800K–1M sq ft each, rail-served, ~32 flatbeds staged simultaneously, designed for 65–75 flatbed turns/day for same- or next-day Pro jobsite delivery. MDO (Market Delivery Operations) ~160 cross-docks at ~75K sq ft each staging big-and-bulky (appliances, furniture, large home goods) for B2C and Pro delivery. DFC (Direct Fulfillment Center) ~20 customer-proximate sites stocking ~100K SKUs of extended e-commerce assortment. Four operating profiles, three demand channels, one set of dock doors per site' },
        { label: 'Rapid Deployment Centers (RDCs)', value: 'High-velocity store replenishment — short dwell, appointment-driven, dock cadence built around inbound from suppliers and outbound to stores. The foundational layer (rollout began 2007 — the architecture HD still runs on)' },
        { label: 'Flatbed Distribution Centers (FDCs)', value: '17 sites open, ~40 planned; ~1M sq ft each, rail-served; ~32 flatbeds staged at a time; designed for 65–75 flatbed turns/day per site. Lumber and building-materials bulk for the Pro channel; same- or next-day to job-sites. The FDC is a yard-management product by design — drive-through buildings loading from both sides while trailers roll through' },
        { label: 'Market Delivery Operations (MDOs)', value: '~160 cross-dock facilities staging big-and-bulky (appliances, furniture, large home goods) for B2C and Pro delivery — mixed inbound, mixed outbound, mixed appointment vs. drop. The multi-channel arbitration site by design — Saturday B2C delivery, same-day Pro pickup, and inbound store replenishment share the same dock doors' },
        { label: 'Direct Fulfillment Centers (DFCs)', value: '~20 customer-proximate sites stocking ~100K SKUs of extended e-commerce assortment; pick-pack-ship cadence sitting next to retail-grade trailer flow' },
        { label: 'SRS/GMS Pro-ecosystem stack rows', value: 'SRS Distribution acquired September 2024 ($18.25B EV) — ~750 branches across 47 states, 2,500 sales reps, ~4,000 owned flatbed trucks (a private fleet in contrast to HD\'s mostly outsourced linehaul). GMS acquired by SRS September 2025 ($5.5B) — ~300 distribution centers + ~100 tool rental / service centers, primarily drywall + ceilings + steel framing. Mingledorff\'s HVAC closed May 11, 2026 — 42 locations across five southeastern states, ~$100B HVAC distribution TAM addition. Combined SRS/GMS/Mingledorff\'s ecosystem: ~1,050+ specialty Pro-distribution branches, each with its own WMS, dispatching, and driver-management heritage. A second supply chain federation now sitting inside the enterprise, layered on top of the HD core' },
        { label: 'One Supply Chain program', value: 'CFO Richard McPhail confirmed at the December 9, 2025 strategic update that the MDO/DFC/FDC buildout is "essentially complete" — the capex curve is past its peak. Capex guides to ~2.5% of sales (~$4.1B at midpoint) in FY2026; the program now pivots to utilization and gross-margin extraction. Same- or next-day delivery is 55% of in-stock as of December 2025, up from ~17% in 2022 — more than triple in three years. The marginal gain from here is operational, not infrastructural' },
        { label: 'Relay program seam', value: 'Launched 2025 in Atlanta as a Pro-channel flatbed pre-positioning play — drivers pre-stage loaded flatbed trailers in store parking lots overnight, then dispatch to jobsites the next morning. Expanded into 18 incremental markets through 2025–2026. This is a de facto yard product running on store parking-lot real estate without a purpose-built yard system underneath it — trailer-to-store-to-jobsite handoffs need real-time visibility into which trailer is at which store, what is loaded, when it left, condition on arrival, and driver handoff between linehaul and last-mile' },
        { label: 'Pro channel acceleration', value: 'Pro-customer reliability is the share-of-wallet currency — Pros do not tolerate wrong-trailer, wrong-time, wrong-yard delivery. The post-SRS / post-GMS / post-Mingledorff\'s Pro mix is the volume growth lane the FDC architecture was sized for; the yard layer is the seam that translates that volume into Pro share-of-wallet capture or carrier-experience leakage' },
      ],
      hypothesis:
        'The interesting thing about The Home Depot yard math is what One Supply Chain has and has not solved. The planning layer is now coherent — the network knows what inventory should be where, the four archetypes are built, and the CFO told investors at the December 2025 strategic update that the capex curve is past its peak. Same- or next-day delivery has gone from ~17% in 2022 to 55% of in-stock as of December 2025. The build is done. What is not coherent is the yard layer underneath each archetype, because each archetype is doing a fundamentally different job out of the same physical dock infrastructure. An MDO is the clearest case: the same building stages an appliance for a Saturday B2C delivery window, a kitchen-cabinet pallet for a Pro contractor pickup, and inbound store replenishment for the nearest RDC. Three channels, three appointment cadences, three downstream service-level commitments, one set of dock doors. The yard is where they arbitrate — and at FDCs designed for 65–75 flatbed turns/day, every minute shaved off dock dwell translates directly into either more loads/day or fewer trailers needed to hit the same Pro volume.\n\nRDCs and FDCs each have their own version of the problem — RDC trailer flow is dense and short-dwell against store delivery windows, FDC flatbed staging is heavy and rail-fed against same-day contractor cycles — but the multi-channel mix at the MDO is the seam that bends hardest, and it bends harder every quarter as the Pro channel grows. The SRS Distribution and GMS acquisitions did not just add SKU breadth; they added Pro-side trailer flow at scale, sitting on top of an already-mixed dock environment. The Mingledorff\'s HVAC close in May 2026 lifted the Pro-customer TAM to ~$1.2 trillion and put another distribution vertical on top of the same operating model. Layered underneath that, the Relay program — flatbed trailers pre-positioned in store parking lots overnight, dispatched to jobsites the next morning — is a yard product running on store real estate without a yard system underneath it. The trailer-to-store-to-jobsite handoff Relay relies on is, in its current form, a visibility gap dressed as an operational elegance.\n\nThe federation question makes the yard layer load-bearing in a way no single-archetype answer can address. ~200+ HD-core facilities plus ~1,050+ SRS / GMS / Mingledorff\'s Pro-distribution branches now sit inside one enterprise, each with its own WMS, dispatching, and driver-management heritage. The planning layer can route a load to the right archetype across that federation. The yard layer at the receiving end still arbitrates which door it lands at, in what order, against which channel\'s clock — and that arbitration is largely site-by-site judgment running on tooling that was built when MDOs only did appliances and FDCs only did lumber. The post-buildout chapter Richard McPhail named publicly — utilization, gross-margin extraction, throughput-per-existing-asset — is operationally the yard chapter, whether the public framing labels it that way or not. Pro-channel reliability at scale is the share-of-wallet currency; it is earned at the dock door against a clock the network sets and the carrier scorecard catches first.',
      pullQuote: 'Three channels, three appointment cadences, three downstream service-level commitments, one set of dock doors.',
      caveat:
        'This is built from public Home Depot disclosures, the December 2025 strategic-update record, the FY2025 10-K and quarterly investor reporting, trade-press coverage on the FDC / MDO / DFC buildout, and the SRS / GMS / Mingledorff\'s acquisition record. The most useful thing you can do with this is push back on the parts that do not match what the network looks like internally — particularly whether multi-channel dock arbitration at the MDO is already systematized or still operator-judgment, whether the post-SRS / post-GMS / post-Mingledorff\'s Pro mix has stressed yard cadence at specific sites, how the Relay trailer-to-store-to-jobsite handoff is currently instrumented, and how One Supply Chain reporting treats the yard layer today.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the network',
      artifact: {
        imageSrc: '/artifacts/the-home-depot-coverage-map.svg',
        imageAlt: 'Network coverage map. Six tiles representing The Home Depot distribution archetypes plus the Pro-customer ecosystem. RDC store replenishment, FDC flatbed Pro jobsite, MDO big-and-bulky cross-dock, DFC e-commerce fulfillment, and the SRS Pro Ecosystem (~1,050 branches) are covered. The Yard Network Ops tile is unfilled, marked with a Home Depot burnt-orange hairline outline.',
        caption: 'Network coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public Home Depot + SRS + GMS + Mingledorff\'s disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the multi-flow gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network feeding stores, foodservice, and direct-to-consumer, and they have layered a network-level yard operating model on top of the site-level yard systems each plant already had. The Home Depot operating profile is shaped differently — retail rather than CPG, multi-channel rather than multi-temp — but the underlying problem rhymes: multiple flow types arbitrating across shared dock infrastructure, where the site-by-site answer is not the same as a network answer. If a network can run this operating model on water — weight-out before cube-out, returns flow on top of forward flow, premium SKUs sharing the dock with ambient — the read-across to multi-channel retail (B2C delivery, contractor pickup, store replenishment sharing the same MDO) is the easier lift, not the harder one. The freight category is different; the network-coordination-across-flows shape is the same — and the post-buildout pivot Richard McPhail named publicly (the utilization-and-gross-margin-extraction chapter) is precisely the chapter Primo is already running, where the network operating model above existing site-level tooling is where the operating leverage compounds.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot targets at Home Depot are different in kind: (1) a flagship Atlanta-region FDC where flatbed staging cycles against same-day contractor windows and where the yard-layer constraint on Pro-channel growth shows up as schedule slip rather than dwell — Relay is already operational in Atlanta, so the trailer-to-store-to-jobsite handoff is visible from the first week; (2) a high-volume MDO with mixed channel mix — appliance B2C plus Pro pickup plus inbound store replenishment all running through the same dock infrastructure, where the multi-channel arbitration cost is the cleanest measurement of the network-tier operating model. We would expect the network to make sense of itself within two to four quarters of the pilot, with the first 60-day proof landing inside the cost-savings cadence Deaton\'s organization is already accountable for.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'thd-10k',
          source: 'The Home Depot 10-K and quarterly investor reporting (FY2024–FY2025)',
          confidence: 'public',
          detail: 'Anchors the ~2,300-store footprint, the One Supply Chain program cadence, and the CFO\'s December 2025 strategic-update framing that the MDO/DFC/FDC buildout is "essentially complete" and the program is pivoting to utilization. FY2025 total sales ~$164.7B (+3.2%); net earnings $14.2B; FY2026 guidance: sales +2.5–4.5%, comp sales flat to +2%, capex ~2.5% of sales (~$4.1B), EPS flat to +4%.',
          url: 'https://ir.homedepot.com/',
        },
        {
          id: 'thd-fdc',
          source: 'The Home Depot Flatbed Distribution Center (FDC) network disclosures',
          confidence: 'public',
          detail: '17 FDCs open with ~40 planned, ~1M sq ft each, rail-served, ~32 flatbeds staged simultaneously, designed for 65–75 flatbed turns/day, same- or next-day Pro delivery. First FDC opened in Dallas in 2020.',
          url: 'https://corporate.homedepot.com/news/company/supply-chain-unveils-first-flatbed-distribution-center-fdc',
        },
        {
          id: 'thd-mdo-dfc',
          source: 'One Supply Chain — MDO/DFC build-out reporting',
          confidence: 'public',
          detail: '~160 Market Delivery Operations (cross-dock for big-and-bulky), ~20 Direct Fulfillment Centers (extended e-commerce assortment, ~100K SKUs). The MDO is the multi-channel arbitration site by design. Same- or next-day delivery 55% of in-stock as of December 2025 (up from ~17% in 2022).',
          url: 'https://www.supplychaindive.com/news/home-depot-distribution-delivery-speed-strategy/808125/',
        },
        {
          id: 'thd-srs-gms-mingledorffs',
          source: 'SRS Distribution (Sep 2024, $18.25B EV), GMS (Sep 2025, $5.5B by SRS), Mingledorff\'s HVAC (May 11, 2026 by SRS)',
          confidence: 'public',
          detail: 'SRS: ~750 branches, 47 states, 2,500 sales reps, ~4,000 owned flatbed trucks. GMS: ~300 DCs + ~100 tool rental / service centers (drywall + ceilings + steel framing). Mingledorff\'s: 42 locations across five southeastern states, ~$100B HVAC distribution TAM addition. Combined ~1,050+ specialty Pro-distribution branches. Total Pro-customer TAM lifted to ~$1.2 trillion. Strategic pro/trade volume additions that compound multi-channel dock pressure at MDOs and FDCs and create a federated yard-and-dock visibility surface across the enterprise.',
          url: 'https://ir.homedepot.com/news-releases/2026/05-11-2026-133053552',
        },
        {
          id: 'thd-relay-program',
          source: 'The Home Depot Relay program (2025)',
          confidence: 'public',
          detail: 'Flatbed trailer pre-positioning play — drivers pre-stage loaded flatbed trailers in store parking lots overnight, dispatched to jobsites the next morning. Launched in Atlanta as initial test market; expanded into 18 incremental markets through 2025–2026. A yard product running on store parking-lot real estate without a purpose-built yard system underneath it. Trailer-to-store-to-jobsite handoffs need real-time visibility into trailer location, load contents, departure / arrival, condition, and driver handoff between linehaul and last-mile.',
        },
        {
          id: 'thd-500m-cost-program',
          source: 'The Home Depot $500M cost-savings program (June 2023 IAC, completed FY2024)',
          confidence: 'public',
          detail: 'John Deaton was the named EVP-level owner of the $500M cost-savings initiative announced at the June 2023 Investor and Analyst Conference, framed around optimizing forecasting and labor management and leveraging technology and robotics. Delivered on schedule. Sets the precedent that Deaton\'s organization delivers measurable run-rate savings on the cost-savings cadence the company underwrites publicly.',
        },
        {
          id: 'deaton-tenure-record',
          source: 'John Deaton public career record — Office Depot → The Home Depot 2007–present',
          confidence: 'public',
          detail: '19-year HD tenure (joined 2007 as VP Supply Chain Development). PERSONALLY led the rollout of the 19 Rapid Deployment Centers — the foundational replenishment architecture HD still runs on today. Promotion track: VP Supply Chain Development 2007 → SVP Brand & Product Development 2011 → SVP Supply Chain 2017 → SVP U.S. Retail Operations 2021 → EVP Supply Chain & Product Development November 1, 2021. Education: BBA Georgia State University (Operations Management + Decision Sciences, honors). Atlanta-rooted — entire HD career inside the Atlanta SSC orbit. Long-tenure operator pattern: architecture-literate, cost-disciplined, quietly public (does not headline trade shows).',
          url: 'https://corporate.homedepot.com/bio/john-deaton-executive-vice-president-supply-chain-product-development',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + retail-logistics yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on multi-channel cross-dock dwell, appointment-vs-drop arbitration, and detention-cost ranges. Describes the conditions multi-channel retail DCs operate under, not Home Depot specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether multi-channel dock arbitration at high-mix MDOs is systematized today or still operator-judgment with appointment-system support',
        'How the post-SRS and post-GMS Pro mix has changed trailer cadence at the FDCs that serve overlapping geographies',
        'How One Supply Chain reporting treats yard-layer metrics — whether dwell, turn time, and dock-utilization variance ladder into the program scorecard at the network tier',
        'Which MDO and FDC sites have already hit channel-mix saturation (the ones where channel B is taking dock time from channel A), and whether that surfaces as a tracked metric',
        'How the RDC layer coordinates with MDO and FDC inbound when the same supplier feeds multiple archetypes in the same market',
        'How carrier-experience and on-time-pickup metrics roll into the Pro-channel scorecard, and which yards drive the worst carrier scores against Pro service-level commitments',
        'How the Relay trailer-to-store-to-jobsite handoff is currently instrumented as the program scales beyond the initial Atlanta + 18 incremental markets — whether the visibility layer for "which trailer is at which store, loaded with what, dispatched when" is system-resident or runs on dispatcher knowledge today',
        'How the federated yard-and-dock visibility problem across the ~200+ HD-core facilities and the ~1,050+ SRS / GMS / Mingledorff\'s Pro-distribution branches is currently coordinated — whether a network-tier visibility layer exists across that federation, or whether each subsidiary still runs its own yard cadence with its own WMS and dispatching heritage',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Home Depot is distinctive in this round because the network is unusual in retail: four distribution-center archetypes (RDC, FDC, MDO, DFC) feeding three demand channels (stores, contractor job-sites, B2C delivery) from the same dock infrastructure, with the multi-channel mix at the MDO growing harder every quarter as the Pro side compounds — and a ~1,050-branch SRS / GMS / Mingledorff\'s Pro-distribution federation layered on top of the HD core. John, the through-line in your stack — Office Depot officer roles, then nineteen years at Home Depot from VP Supply Chain Development in 2007 through EVP since November 2021, the architect of the 19-RDC rollout that the network still runs on, the EVP-level owner of the $500M cost-savings program delivered on schedule at the June 2023 IAC framing — is exactly the operator profile that turns a four-archetype yard mix into one network-tier operating standard, and the post-buildout chapter Richard McPhail named publicly in December 2025 is operationally the yard chapter whether the public framing labels it that way or not. The planning layer is solved at the program tier; the yard layer where the arbitration physically happens is the unsolved seam. The water comparable is intentional: if a network operating model lands on the freight category where weight, margin, multi-temp, and returns flow all run at once, the read-across to multi-channel retail is the easier lift, not the harder one.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'John — the part most worth pushing back on is whether the standards-and-procedures discipline you carried through the 19-RDC rollout in 2007, the $500M cost-savings program in 2023, and the One Supply Chain capex chapter that closed in 2025 has reached the yard layer above the four archetypes yet, or whether site-by-site judgment still arbitrates the multi-channel mix at the MDO and the Pro-channel cadence at the FDC. That answer reshapes the rest of this. If parts of this read wrong against what you see internally for Home Depot — particularly whether multi-channel dock arbitration at the MDOs is already systematized, how the SRS / GMS / Mingledorff\'s Pro-channel additions have stressed yard cadence at specific sites, how the Relay trailer-to-store-to-jobsite handoff is currently instrumented as the program scales, or how One Supply Chain reporting treats the yard layer today — that lands harder than another meeting request. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-031',
      name: 'John Deaton',
      firstName: 'John',
      lastName: 'Deaton',
      title: 'Executive Vice President – Supply Chain & Product Development',
      company: 'The Home Depot',
      email: 'john.deaton@homedepot.com',
      linkedinUrl: 'https://corporate.homedepot.com/bio/john-deaton-executive-vice-president-supply-chain-product-development',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain',
      currentMandate:
        'EVP Supply Chain & Product Development since November 1, 2021. 19-year HD tenure (joined 2007 as VP Supply Chain Development; personally led the 19-RDC rollout, the foundational replenishment architecture HD still runs on). Promotion track: VP Supply Chain Development 2007 → SVP Brand & Product Development 2011 → SVP Supply Chain 2017 → SVP U.S. Retail Operations 2021 → EVP Supply Chain & Product Development Nov 2021. EVP-level owner of the $500M cost-savings program (announced June 2023 IAC, completed FY2024). BBA Georgia State (Operations Management + Decision Sciences, honors). Atlanta-rooted; entire HD career inside the Atlanta SSC orbit. Long-tenure operator pattern: architecture-literate, cost-disciplined, quietly public.',
      bestIntroPath:
        'Direct outreach to the EVP Supply Chain & Product Development seat with a peer-to-peer network-operator framing — Deaton is the architect of the RDC layer that the network still runs on, so the wedge is the layer above the archetypes, not replacement of them. Atlanta SSC pitch (20-minute strategic conversation) lands harder than a trade-show booth visit. If delegated: target SVP Logistics / SVP Transportation & Delivery (John Drake) or SVP Distribution & Fulfillment (Amit Kalra). Long-tenure-operator pattern — leads with operating substance, discounts vendor abstractions and transformation-flavored language.',
    },
    {
      personaId: 'P-032',
      name: 'John Drake',
      firstName: 'John',
      lastName: 'Drake',
      title: 'Senior Vice President – Supply Chain',
      company: 'The Home Depot',
      email: 'john.drake@homedepot.com',
      linkedinUrl: 'https://corporate.homedepot.com/bio/john-drake-senior-vice-president-supply-chain',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Transportation / Delivery',
      currentMandate: 'Official transportation and direct-to-customer delivery owner.',
      bestIntroPath: 'Executive outreach',
    },
    {
      personaId: 'P-033',
      name: 'Amit Kalra',
      firstName: 'Amit',
      lastName: 'Kalra',
      title: 'Senior Vice President – Supply Chain',
      company: 'The Home Depot',
      email: 'amit.kalra@homedepot.com',
      linkedinUrl: 'https://corporate.homedepot.com/bio/amit-kalra-senior-vice-president-supply-chain',
      roleInDeal: 'influencer',
      seniority: 'VP',
      function: 'Distribution / Fulfillment',
      currentMandate: 'Official distribution and fulfillment operations owner.',
      bestIntroPath: 'Executive outreach',
    },
    {
      personaId: 'P-034',
      name: 'Richard McPhail',
      firstName: 'Richard',
      lastName: 'McPhail',
      title: 'Executive Vice President & Chief Financial Officer',
      company: 'The Home Depot',
      email: 'richard.mcphail@homedepot.com',
      linkedinUrl: 'https://corporate.homedepot.com/',
      roleInDeal: 'routing-contact',
      seniority: 'C-level',
      function: 'Finance / Strategy',
      currentMandate: 'EVP & CFO of The Home Depot; on record at the December 9, 2025 strategic update that the MDO/DFC/FDC buildout is "essentially complete" and the program is pivoting to utilization and gross-margin extraction. FY2026 guidance: sales +2.5–4.5%; comp sales flat to +2%; capex ~2.5% of sales (~$4.1B); EPS flat to +4%.',
      bestIntroPath: 'Conference / investor-relations outreach',
    },
    {
      personaId: 'P-035',
      name: 'Erin Donnelly',
      firstName: 'Erin',
      lastName: 'Donnelly',
      title: 'Senior Director, Supply Chain Development',
      company: 'The Home Depot',
      email: 'erin.donnelly@homedepot.com',
      linkedinUrl: 'https://www.linkedin.com/in/erin-donnelly-ga',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Supply Chain Strategy',
      currentMandate: 'Named supply-chain development leader for transformation lane.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-076',
      name: 'Jacquelyn Singleton',
      firstName: 'Jacquelyn',
      lastName: 'Singleton',
      title: 'Supply Chain Professional',
      company: 'The Home Depot',
      roleInDeal: 'routing-contact',
      seniority: 'Manager',
      function: 'Supply Chain',
      currentMandate: 'Engaged with FreightRoll outreach. Active signal makes this a warm routing path into Home Depot supply chain.',
      bestIntroPath: 'Direct - engaged contact',
    },
    {
      personaId: 'P-077',
      name: 'Joseph Orndoff',
      firstName: 'Joseph',
      lastName: 'Orndoff',
      title: 'Supply Chain Professional',
      company: 'The Home Depot',
      roleInDeal: 'routing-contact',
      seniority: 'Manager',
      function: 'Supply Chain',
      currentMandate: 'Engaged with FreightRoll outreach. Second warm signal at Home Depot strengthens the routing path.',
      bestIntroPath: 'Direct - engaged contact',
    },
    {
      personaId: 'P-078',
      name: 'Robert Grazian',
      firstName: 'Robert',
      lastName: 'Grazian',
      title: 'Senior Director, Supply Chain',
      company: 'The Home Depot',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain',
      currentMandate: 'Senior Director level at Home Depot supply chain. Decision-maker authority for yard operations tooling.',
      bestIntroPath: 'LinkedIn / warm route via engaged contacts',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-031',
        name: 'John Deaton',
        firstName: 'John',
        lastName: 'Deaton',
        title: 'Executive Vice President – Supply Chain & Product Development',
        company: 'The Home Depot',
        email: 'john.deaton@homedepot.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'John Deaton - Executive Vice President – Supply Chain & Product Development',
      variantSlug: 'john-deaton',

      framingNarrative:
        'John, you have run One Supply Chain end-to-end — Ernst & Young consulting, the Office Depot officer years, then nineteen years at Home Depot from VP Supply Chain Development in 2007 through EVP since November 2021. You personally led the 19-RDC rollout in 2007 that the network still runs on, then the SVP Supply Chain seat in 2017 through the FDC architecture sized for 65–75 flatbed turns/day, then the EVP-level ownership of the $500M cost-savings program delivered on schedule at the June 2023 IAC framing. The four-archetype network is yours — RDC, FDC, MDO, DFC — and the SRS / GMS / Mingledorff\'s Pro-distribution federation sitting on top of it is the second supply chain your organization now coordinates with. Richard told investors at the December 2025 strategic update that the buildout is essentially complete. The next chapter — the one McPhail framed publicly as utilization and gross-margin extraction — is operationally the yard chapter, and it lands on the layer above the archetypes you built. That layer is operator-frame work, not vendor-procurement work, and the architect of the RDC layer is the operator who can land it.',
      openingHook:
        'You built the network. The next chapter is running it hot. The yard layer above the four archetypes is the throughput-per-asset tier of the chapter Richard just named.',
      stakeStatement:
        'Pro-customer reliability is the share-of-wallet currency, and the Pro-customer TAM lifted to ~$1.2 trillion at the May 2026 Mingledorff\'s close. Same-day / next-day delivery is 55% of in-stock as of December 2025 — more than triple in three years — and the marginal gain from here is operational, not infrastructural. FY2026 guidance is comp-sales flat to +2% and EPS flat to +4% in a soft housing market; the cost-savings cadence your organization is already accountable for runs through yard turn-time, demurrage, and Pro-channel on-time-pickup. The Relay program is a yard product running on store parking-lot real estate today; as it scales beyond the 18 incremental markets, the trailer-to-store-to-jobsite handoff gets harder, not easier. The ~1,050-branch SRS / GMS / Mingledorff\'s Pro-distribution federation is a federated yard-and-dock visibility problem at a scale most enterprises never face. One Supply Chain owns the planning layer across all of it; the yard layer is the unsolved seam, and it is where the next 3 years of supply-chain ROI either compound as operating leverage or leak as carrier-scorecard variance.',

      heroOverride: {
        headline: 'John, you built the network. The next chapter starts at the dock door.',
        subheadline:
          'One Supply Chain put the four archetypes in the field — and a ~1,050-branch SRS / GMS / Mingledorff\'s Pro-distribution federation on top of them. The yard layer above the archetypes is the throughput-per-asset tier of the post-buildout chapter Richard McPhail named publicly in December 2025.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer, network-operator framing. Deaton has seen every vendor pitch since the RDC rollout in 2007; skip the education and lead with operating substance. He owns the One Supply Chain program — do not pitch him on the program. Position the wedge as the layer below the archetypes, not as replacement for them. Acknowledge the buildout as the win it is — and acknowledge that he, specifically, built it. Architecture-literate (he can read a network diagram; show one). Cost-disciplined (quantify run-rate savings and payback period — he owned the $500M program and expects vendors to think like that). Quietly public — does not headline trade shows; respect the IAC framing and the investor-relations register. Atlanta SSC bias — local pitch over conference floor.',
      kpiLanguage: [
        'throughput per asset',
        'multi-channel dock arbitration',
        'archetype-tier coordination',
        'cross-archetype trailer cadence',
        'Pro-channel service-level coverage',
        'dock-door utilization across mixed flow',
        'network-tier yard reporting',
        'federation-friendly deployment',
        'Relay trailer-to-store-to-jobsite handoff',
        'run-rate savings on cost-savings cadence',
      ],
      proofEmphasis:
        'Primo is the public comparable — same network-coordination-across-flows shape, on the hardest CPG freight, already running the network-tier operating layer above existing site-level tooling. The 48-to-24 minute turn-time delta and the dock-office-headcount-held-flat result are the operator-language proof points. The "24 facilities live · >200 contracted" rollout cadence is the proof that the operating model ships at scale across heterogeneous sites — the read-across to the ~200+ HD-core + ~1,050+ SRS / GMS / Mingledorff\'s federation is the easier scaling problem, not the harder one. The directly-shaped reference (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
    {
      person: {
        personaId: 'P-032',
        name: 'John Drake',
        firstName: 'John',
        lastName: 'Drake',
        title: 'Senior Vice President – Supply Chain',
        company: 'The Home Depot',
        email: 'john.drake@homedepot.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Transportation / Delivery',
      },
      fallbackLane: 'logistics',
      label: 'John Drake - Senior Vice President – Supply Chain',
      variantSlug: 'john-drake',

      framingNarrative:
        'John, the transportation side of One Supply Chain is the side that feels the yard variance first — Pro-channel service-level commitments do not bend when an MDO dock door is held by appliance B2C delivery for a second tour.',
      openingHook:
        'The carrier scorecard already knows which MDOs and FDCs cost on-time-pickup. The question is whether the network sees the same variance the carriers do, in a way the Pro-channel service-level commitments can be defended against as the post-SRS / post-GMS / post-Mingledorff\'s Pro mix keeps growing.',
      stakeStatement:
        'Pro-channel service levels (same-day, next-day jobsite delivery) are sold at the network tier and earned at the yard tier. When dock arbitration at the MDO or staging cadence at the FDC slips, the carrier scorecard catches it before the program scorecard does.',

      heroOverride: {
        headline: 'John, the transportation network feels the yard variance before the program scorecard does.',
        subheadline:
          'Pro-channel service levels are earned at the dock door. Multi-channel MDOs and rail-fed FDCs are where the schedule either holds or slips.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Drake reads carrier scorecards weekly. Lead with the metrics he already tracks — on-time pickup, dwell variance, carrier satisfaction — and connect them to the multi-channel dock arbitration story.',
      kpiLanguage: [
        'on-time pickup',
        'carrier scorecard variance',
        'dwell at the MDO',
        'flatbed staging cycle at the FDC',
        'Pro-channel service-level adherence',
        'detention spend',
      ],
      proofEmphasis:
        'The 48-to-24 minute turn-time delta and the dock-office-headcount-held-flat result from Primo are the operator-language proof points. Drake will read them as a peer would.',
    },
    {
      person: {
        personaId: 'P-033',
        name: 'Amit Kalra',
        firstName: 'Amit',
        lastName: 'Kalra',
        title: 'Senior Vice President – Supply Chain',
        company: 'The Home Depot',
        email: 'amit.kalra@homedepot.com',
        roleInDeal: 'influencer',
        seniority: 'VP',
        function: 'Distribution / Fulfillment',
      },
      fallbackLane: 'executive',
      label: 'Amit Kalra - Senior Vice President – Supply Chain',
      variantSlug: 'amit-kalra',

      framingNarrative:
        'Amit, the distribution side of the network is where the multi-channel mix lives — and where it gets harder every quarter the Pro side compounds.',
      openingHook:
        'An MDO is not one operating model — it is three operating models sharing dock doors. B2C appliance delivery on a Saturday window, Pro contractor pickup on a same-day clock, and inbound store replenishment from the supplier — all arbitrating against the same physical infrastructure. The site-level answer is operator judgment; the network-tier answer is the unsolved seam.',
      stakeStatement:
        'Distribution efficiency at the archetype tier is solved by the One Supply Chain buildout. Multi-channel arbitration inside the archetype, especially at high-mix MDOs, is the next-tier constraint — and it tightens every time the Pro mix grows.',

      heroOverride: {
        headline: 'Amit, four distribution archetypes. Three demand channels. One dock per door. The arbitration is the seam.',
        subheadline:
          'MDOs were built for big-and-bulky. They now stage Pro pickup and inbound replenishment alongside it. The yard layer is where the channel mix gets reconciled — or doesn\'t.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Kalra owns the distribution side; talk to him about the dock door, not the program. Lead with the MDO arbitration story specifically.',
      kpiLanguage: [
        'dock-door utilization by channel',
        'channel-mix saturation',
        'cross-channel dwell variance',
        'appointment vs. drop ratio',
        'staging cadence',
        'cross-archetype coordination',
      ],
      proofEmphasis:
        'Primo\'s multi-flow operating model — forward flow, returns flow, multi-temp on the same dock — is the directly-rhyming shape. Different freight category, same arbitration problem.',
    },
    {
      person: {
        personaId: 'P-034',
        name: 'Richard McPhail',
        firstName: 'Richard',
        lastName: 'McPhail',
        title: 'Executive Vice President & Chief Financial Officer',
        company: 'The Home Depot',
        email: 'richard.mcphail@homedepot.com',
        roleInDeal: 'routing-contact',
        seniority: 'C-level',
        function: 'Finance / Strategy',
      },
      fallbackLane: 'cfo',
      label: 'Richard McPhail - Executive Vice President & Chief Financial Officer',
      variantSlug: 'richard-mcphail',

      framingNarrative:
        'Richard, you said on the record at the December 2025 strategic update that the MDO/DFC/FDC buildout is essentially complete and the next chapter is utilization. The yard layer is the utilization tier.',
      openingHook:
        'The One Supply Chain capex curve is past its peak. The return on that build now depends on how hard each archetype can be utilized — which is a yard-layer question at the dock door, not a planning-layer question at the program. The Pro-channel growth coming out of SRS, GMS, and Mingledorff\'s is the demand side of that equation; the multi-channel arbitration at the MDO is the supply side.',
      stakeStatement:
        'Utilization is earned in minutes at the dock door. Multi-channel MDOs that arbitrate well absorb Pro-channel growth as operating leverage; ones that do not bend the gross-margin curve the program was built to lift.',

      heroOverride: {
        headline: 'Richard, the capex chapter is closing. The utilization chapter starts at the dock door.',
        subheadline:
          'Multi-channel dock arbitration at the MDO is the utilization tier of One Supply Chain. The yard layer is where the Pro-channel growth either compounds as operating leverage or leaks as variance.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Strategic, board-level, fact-grounded. McPhail is a numbers reader; the analysis already cites him correctly. Position the yard layer as the operating-leverage tier inside the utilization chapter he has already named publicly.',
      kpiLanguage: [
        'asset utilization',
        'gross-margin extraction from capex base',
        'operating leverage on Pro-channel growth',
        'detention and demurrage spend',
        'labor cost per trailer at the archetype tier',
        'network-tier yard reporting',
      ],
      proofEmphasis:
        'The per-site profit impact and headcount-held-flat results from Primo are the CFO-language proof points. McPhail reads in operating leverage, not features.',
    },
    {
      person: {
        personaId: 'P-035',
        name: 'Erin Donnelly',
        firstName: 'Erin',
        lastName: 'Donnelly',
        title: 'Senior Director, Supply Chain Development',
        company: 'The Home Depot',
        email: 'erin.donnelly@homedepot.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Supply Chain Strategy',
      },
      fallbackLane: 'ops',
      label: 'Erin Donnelly - Senior Director, Supply Chain Development',
      variantSlug: 'erin-donnelly',

      framingNarrative:
        'Erin, supply chain development at Home Depot is the team that owns what comes after One Supply Chain. The yard layer below the archetypes is one of the open seams.',
      openingHook:
        'The MDO, DFC, and FDC archetypes are built. The next-tier program work is the operating model above them — how the network coordinates across archetypes when the same supplier feeds three of them in the same market, how Pro-channel service levels get defended at the dock door, and how multi-channel arbitration at the MDO becomes a system instead of a per-site judgment call.',
      stakeStatement:
        'Supply chain development owns the bridge between what the network has built and what it needs to operate at scale. The yard layer is one of the surfaces where that bridge is not yet built.',

      heroOverride: {
        headline: 'Erin, the archetypes are built. The operating model above them is the next-tier development work.',
        subheadline:
          'Multi-channel dock arbitration at the MDO. Cross-archetype coordination at the market tier. Pro-channel service-level adherence at the yard tier. These are program-design questions, not site-design questions.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Program-level, development-team framing. Donnelly thinks in operating models and rollout plans, not site-by-site operations. Position the wedge as the operating-model tier above the archetypes.',
      kpiLanguage: [
        'network-tier operating model',
        'archetype coordination',
        'rollout cadence',
        'program-tier yard reporting',
        'channel-mix policy',
        'standardized dock-door arbitration',
      ],
      proofEmphasis:
        'The "24 facilities live · >200 contracted" rollout cadence from Primo is the program-language proof point. The operating model has shipped at scale; the question is what it looks like on retail multi-channel.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured across live deployments at a comparable multi-flow network' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted rollout cadence across comparable operating profiles' },
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at comparable multi-channel facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'The yard used to be where we lost visibility. Now it is where we gain control over every trailer in the network.',
        role: 'Operations Director',
        company: 'National multi-channel distributor',
      },
    },
  ],

  network: {
    facilityCount: '~2,300 stores · ~19 RDCs · 17 FDCs (~40 planned) · ~160 MDOs · ~20 DFCs · plus ~1,050+ SRS/GMS/Mingledorff\'s Pro-distribution branches',
    facilityTypes: ['Rapid Deployment Centers (RDCs)', 'Flatbed Distribution Centers (FDCs)', 'Market Delivery Operations (MDOs)', 'Direct Fulfillment Centers (DFCs)', 'SRS/GMS/Mingledorff\'s Pro-Distribution Branches'],
    geographicSpread: 'United States, Canada, Mexico (HD-core); 47 states + Canada + Latin America (SRS); southeastern U.S. (Mingledorff\'s HVAC)',
    dailyTrailerMoves: 'High-volume — distributed across four distribution archetypes feeding three demand channels, plus the SRS/GMS/Mingledorff\'s ~1,050-branch Pro-distribution federation',
    fleet: '3PL and contract-carrier mix for HD core (flatbed at FDC, dry van at RDC/MDO, parcel/LTL at DFC); SRS adds ~4,000 owned flatbed trucks — a private fleet, a different operating model from the HD-core outsourced linehaul',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Flatbed', 'Intermodal/Rail'],
    avgLoadsPerDay: 'High-volume — distributed across building-materials bulk (FDC), big-and-bulky cross-dock (MDO), high-velocity store replenishment (RDC), e-commerce fulfillment (DFC), and the SRS/GMS/Mingledorff\'s ~1,050-branch Pro-distribution federation',
  },

  signals: {
    recentNews: [
      'CFO Richard McPhail confirmed at the December 9, 2025 strategic update that the MDO/DFC/FDC buildout is "essentially complete"; the program pivots to utilization and gross-margin extraction. FY2026 guidance: sales +2.5–4.5%; comp sales flat to +2%; capex ~2.5% of sales (~$4.1B); EPS flat to +4%.',
      'Same- or next-day delivery is 55% of in-stock as of December 2025 — more than triple from ~17% in 2022. The marginal gain from here is operational, not infrastructural.',
      'SRS Distribution acquisition closed September 2024 ($18.25B EV — HD\'s largest deal ever) — added ~750 branches, 2,500 sales reps, ~4,000 owned flatbed trucks, and the roofing + building-materials Pro-channel volume on top of the FDC network.',
      'GMS wallboard acquisition closed September 2025 ($5.5B by SRS) — ~300 DCs + ~100 tool rental / service centers, drywall + ceilings + steel framing.',
      'SRS-led Mingledorff\'s HVAC acquisition closed May 11, 2026 — 42 locations across five southeastern states, ~$100B HVAC distribution TAM addition, lifting the Pro-customer TAM to ~$1.2 trillion.',
      'Relay program (launched 2025) — flatbed trailer pre-positioning at store parking lots overnight, dispatched to jobsites the next morning. Expanded from Atlanta into 18 incremental markets through 2025–2026.',
      '17 FDCs operating at ~1M sq ft each, ~32 flatbeds staged simultaneously, designed for 65–75 flatbed turns/day per site; same- or next-day Pro-channel delivery is the service-level commitment.',
    ],
    supplyChainInitiatives: [
      'One Supply Chain — the program that built the four-archetype network (RDC, FDC, MDO, DFC). The yard layer below each archetype, and the federated yard-and-dock visibility surface across the ~1,050-branch SRS/GMS/Mingledorff\'s Pro ecosystem, is the unsolved tier.',
    ],
    urgencyDriver:
      'The capex chapter of One Supply Chain is closing; the utilization chapter is starting. CFO Richard McPhail named the pivot publicly at the December 2025 strategic update — throughput-per-existing-asset is the next 3 years of supply-chain ROI. Multi-channel dock arbitration at the MDO is the operating-leverage tier of that next chapter, and Pro-channel growth from SRS, GMS, and Mingledorff\'s keeps tightening the constraint while the Pro-customer TAM is now ~$1.2 trillion. The Relay program is a yard product running on store real estate today; as it scales beyond the 18 incremental markets, the trailer-to-store-to-jobsite handoff needs an underlying system. The federated yard-and-dock visibility surface across HD core + SRS + GMS + Mingledorff\'s is unfinished business.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'The archetypes', body: '~2,300 stores · ~19 RDCs · 17 FDCs · ~160 MDOs · ~20 DFCs · ~1,050+ SRS/GMS/Mingledorff\'s branches.' },
    { mark: 'CFO on the record', body: 'Dec 2025 strategic update · MDO/DFC/FDC buildout "essentially complete" · program pivots to utilization.' },
    { mark: 'Pro-channel stack', body: 'SRS Sep 2024 · $18.25B · GMS Sep 2025 · $5.5B · Mingledorff\'s HVAC May 11, 2026 · 42 locations.' },
    { mark: 'Pro-customer TAM', body: '~$90B of $165B FY today · pre-SRS Pro TAM ~$700B · ~$1.2T post-Mingledorff\'s.' },
    { mark: 'Deaton\'s lineage', body: 'Architect of the 19-RDC rollout 2007 · EVP-level owner of the $500M cost-savings program 2023 · 19 years at HD.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same shape, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/the-home-depot.m4a',
    intro:
      "Forty-two minutes, dictated for the commute or the office walk. The same five beats this memo walks in print, in audio. Skip into any chapter below; the page won't move.",
    chapters: [
      { id: 'thesis', label: 'The layer above the archetypes', start: 0 },
      { id: 'four-archetypes', label: 'Four archetypes, one set of dock doors', start: 505 },
      { id: 'primo-proof', label: 'If it lands on water, it lands on retail', start: 1010 },
      { id: 'methodology', label: 'How this analysis was built', start: 1515 },
      { id: 'run-it-hot', label: 'You built the network — now run it hot', start: 2020 },
    ],
    generatedAt: '2026-05-14T22:00:00Z',
  },

  theme: {
    accentColor: '#C2410C',
    backgroundVariant: 'dark',
  },

  showcase: true,
  showcaseOrder: 2,
  layoutPreset: 'retail',
};
