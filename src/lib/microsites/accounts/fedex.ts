/**
 * FedEx — ABM Microsite Data
 *
 * Pitch shape: CARRIER-FRAME INVERSION. FedEx is a carrier, not a shipper.
 * The pitch is about yard hand-offs as a service-promise constraint, not
 * yard tools for a shipper. Network 2.0 is rewriting the operating
 * procedure at ~30% of NA facilities and FedEx Freight separates June 1,
 * 2026 — both rewrites land first on the yard. The Tier-1 CPG anchor's
 * freight (Primo Brands as public comparable for the larger bottled-water
 * network) is the kind of freight FedEx Freight COULD pick up — the
 * question for FedEx is whether their yard hand-offs at service centers
 * leak the same minutes Primo's pilot recovered on the shipper side.
 *
 * Active context (May 2026):
 *   - FedEx Freight spinoff separates June 1, 2026 (Form 10 filed Jan 2026,
 *     Investor Day Apr 8, 2026). Standalone NYSE listing as FDXF. John Smith
 *     incoming CEO of FedEx Freight. ~$600M IT upgrade ahead of separation.
 *   - Network 2.0: ~360 facilities operating optimized; ~25% of eligible NA
 *     volume currently flowing through Network 2.0; target 65% by 2026 peak.
 *     Plan: 475+ station closures by end of 2027 (~30% of NA footprint).
 *     ~115 additional facilities scheduled to roll in before 2026 peak.
 *   - FedEx Freight LTL: ~323 terminals + ~13 relay locations (~360 service
 *     centers); ~26,000 dock doors network-wide; recent adds in Phoenix
 *     (218 doors), Indianapolis-area (125 doors), Sioux Falls (76 doors).
 *   - Tricolor air network rebuild + Dexterity AI sortation rollout in
 *     parallel with Network 2.0.
 *   - Raj Subramaniam CEO at parent; Scott Temple President FedEx Supply
 *     Chain (sourced from LinkedIn + FedEx leadership page).
 */

import { AUDIO_BRIEF_CHAPTERS, AUDIO_BRIEF_SRC } from '../audio-brief';
import type { AccountMicrositeData } from '../schema';

export const fedex: AccountMicrositeData = {
  slug: 'fedex',
  accountName: 'FedEx',
  coverHeadline: 'Yard hand-offs as the service-promise constraint',
  titleEmphasis: 'service-promise constraint',
  coverFootprint: '~360 hubs · ~360 SCs · ~26K doors',
  parentBrand: 'FedEx',
  vertical: 'logistics-3pl',
  tier: 'Tier 3',
  band: 'D',
  priorityScore: 53,

  pageTitle: 'FedEx · Yard hand-offs as the service-promise constraint',
  metaDescription:
    'Two structural rewrites land on the same yards at the same time: Network 2.0 is consolidating ~30% of the NA facility footprint and FedEx Freight separates June 1, 2026 as a standalone NYSE-listed LTL carrier. The yard between the gate and the dock is where the published transit-time promise becomes the realized one — and where carrier-side dwell pricing power is decided on every shipper trailer.',

  sections: [
    { type: 'yns-thesis', headlineOverride: 'Yard hand-offs as the service-promise constraint for the carrier' },
    {
      type: 'observation',
      headline: 'What we observed about the FedEx operating context',
      composition: [
        { label: 'Network 2.0 consolidation status', value: '~360 facilities running Network 2.0-optimized today (~25% of eligible NA average daily volume); 65% target by 2026 peak; 475+ station closures planned by end of 2027 — roughly 30% of the NA facility footprint. ~115 additional facilities scheduled to roll in before 2026 peak. Stated savings target: ~$2B by end of 2027' },
        { label: 'FedEx Freight spin timeline', value: 'Separation on track for June 1, 2026 with NYSE listing under FDXF — Form 10 filed January 2026, inaugural FedEx Freight Investor Day held April 8, 2026, John Smith incoming CEO. Parcel and LTL operating agreements separating early spring 2026; ~$600M IT investment ahead of separation. First standalone earnings cycle lands inside FY26 calendar' },
        { label: 'LTL operating footprint at separation', value: '~323 LTL terminals + ~13 relay locations (~360 service centers) as of mid-2025; ~26,000 dock doors network-wide; recent capacity adds in Phoenix (218 doors), Greenwood IN (125 doors, Indianapolis area), Sioux Falls SD (76 doors). The dock-door inventory is the carrier-side counterpart to every shipper trailer arrival' },
        { label: 'Tricolor + Dexterity AI sortation', value: 'Tricolor air-network rebuild aligning aircraft capacity to service tiers, running in parallel with Network 2.0 ground consolidation. Dexterity AI sortation cited at +13% trailer utilization and >99% sortation accuracy at deployed hubs — the inside-the-hub gains are real; the gate-to-sort-belt yard queue feeding them is the one execution surface the AI does not yet reach' },
        { label: 'CEO frame (Raj Subramaniam)', value: 'Three-part transformation framing on the record at 2026 Investor Day: Network 2.0 ground-air integration, Tricolor air-network rebuild, FedEx Freight spin. FY2029 adjusted free cash flow target ~$6B; capex falling toward ~4% of revenue. ~10% P&D cost reduction in rolled-out Network 2.0 markets' },
        { label: 'Yard-execution surface', value: 'Every Network 2.0 consolidated hub absorbs volume from multiple closed predecessor stations; service-center yards arbitrate parcel cross-dock and LTL trailer flow on overlapping infrastructure during the transition. Once the predecessor station closes, the surviving hub yard is the entire queue — at hub scale that queue is measured in minutes and managed manually with radio and clipboard at most sites' },
        { label: 'Tier-1 CPG anchor as freight comparable', value: 'A 237-facility CPG network — North America\'s largest bottled-water producer — moves a multi-year contracted freight flow that maps directly into the LTL plus dedicated profile FedEx Freight competes for. Carrier-side yard dwell on that shipper\'s trailers is set by how the destination service center sequences gate-to-dock' },
      ],
      hypothesis:
        'The interesting thing about FedEx right now is that two structural rewrites are happening on the same physical yards at the same time, and neither rewrite has a yard-execution layer in scope. Network 2.0 closes 475+ stations by 2027 and routes that volume through ~360 consolidated hubs; FedEx Freight separates June 1, 2026 and starts running its terminal network as a standalone public company under its own service-level math. Both programs assume the yard between the gate and the dock will absorb the new flow shape. In the FedEx Ground operating model, the yard is the queue depth that determines whether the next sort cycle starts on time — at hub scale that queue is measured in minutes and managed manually with radio and clipboard at most sites. In the FedEx Freight operating model, the yard is where the published LTL transit time becomes the realized one — a 90-minute hand-off at the destination service center is the difference between a hit and a miss on the carrier scorecard the shipper is reading.\n\nThe unit of analysis here is not "should FedEx buy a YMS." Some facilities already have site-level yard tools; the records-layer pieces (vehicle and asset tracking, gate logs, dwell-and-detention reporting) exist in parts of the network. The unit of analysis is whether the execution and orchestration layer above those records is the right next thing to standardize across the consolidated Network 2.0 hubs and the soon-to-be-standalone FedEx Freight service-center network. The Dexterity AI sortation deployment already showed what AI inside the hub does for trailer utilization (+13%) and sortation accuracy (>99%) — the gate-to-sort-belt queue feeding those gains is the one execution surface the inside-the-hub AI does not yet reach.\n\nThat gap got more expensive in the last twelve months for three reasons. First, consolidation makes the yard a single-point-of-failure in a way it never was when overlapping stations absorbed each other\'s exceptions; once the overlapping station closes, the yard at the surviving hub is the entire queue. Second, the spin separates the cost-of-yard-failure from the cost-of-yard-fix — FedEx Freight\'s service-level math now belongs to its own P&L and its own NYSE filings, which sharpens the math on every minute of avoidable dwell and turns dock-door utilization into a public investor-readable number. Third, the shipper-side comparable is now public. The 237-facility CPG anchor — the largest bottled-water producer in North America — pulled its average truck turn time from 48 minutes to 24 by putting a network operating model on top of its site-level yard tooling. That shipper\'s trailers cross FedEx Freight service-center yards on the LTL leg and FedEx Ground hubs on the parcel leg. The minutes the shipper recovered on its own yards are the same minutes FedEx is currently absorbing on the carrier side of the same hand-off. The forward-looking piece is the cleanest. The next ~115 facilities being optimized into Network 2.0 between now and 2026 peak are the cheapest place to land a standard yard-execution layer, because the operating procedure at each one is being rewritten anyway. The post-spin FedEx Freight service-center network is the second cleanest, because the new public company has every reason to standardize the operating layer above its existing yard-records tooling before the first standalone earnings cycle.',
      pullQuote: 'The yard is where the published transit time becomes the realized one — and where carrier-side dwell pricing power is decided on every shipper trailer.',
      caveat:
        'This is built from FedEx public disclosures, the Form 10 filing, the April 2026 Investor Day materials, public Network 2.0 reporting through May 2026, the FedEx Freight separation announcements, and inference about how the consolidated-hub yard flow sequences against the LTL service-center yard flow. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that do not match what your team is seeing: where existing site-level yard tooling already covers the records layer cleanly, how the Network 2.0 consolidation is changing trailer arrival patterns at the surviving hubs, whether the FedEx Freight separation timeline leaves room for an execution-layer addition before the first standalone earnings cycle under John Smith, and which service centers carry the worst carrier-scorecard signal today.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the service-promise stack',
      artifact: {
        imageSrc: '/artifacts/fedex-coverage-map.svg',
        imageAlt: 'Service-promise coverage map. Six tiles representing the operating layers under the FedEx published transit-time promise. Network 2.0 Hub Optimization, FedEx Freight LTL, Ground Network, Express Hub, and FedEx Freight Spin June 2026 are covered. The Yard Hand-Off Orchestration tile is unfilled, marked with a FedEx purple hairline outline.',
        caption: 'Service-promise coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public FedEx + FedEx Freight + Form 10 + Network 2.0 + Tricolor disclosures. Shipper trailer attribution redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'The CPG anchor whose freight crosses FedEx yards every day',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point that cannot be recovered with price), multi-temp at the premium SKU layer, and complicated by refill returns logistics. Primo is years ahead of every other CPG category on yard automation and digitization, and they layered a network-level yard operating model on top of their existing site-level yard systems. The reason that matters here is that Primo is a public, named comparable for the operating profile of the larger 237-facility bottled-water network whose trailers cross FedEx Freight service centers and FedEx Ground hubs every day. The shipper-side pilot pulled average truck turn time from 48 minutes to 24 and held dock-office headcount flat while absorbing more volume. Those minutes were absorbed on the shipper\'s yard. On the carrier side of the same hand-off — the destination service center where the trailer arrives, queues, gets a door, gets unloaded, and turns — the question for FedEx is whether the yard discipline that travelled with the trailer to the gate continues across the dock, or stops there. The framing inversion matters. FedEx is not the shipper in this comparable. FedEx is the carrier whose service-level promise to that shipper (and to every shipper whose freight crosses the same service centers) lives or dies in the same yard minutes the shipper has already learned how to recover. If a network operating model can run on water — the hardest CPG freight in the country — the read-across to FedEx Freight\'s carrier-side yard, where the freight has already arrived and the dock-to-dock cadence is the only variable left, is the easier lift, not the harder one. The shipper-side discipline becomes carrier-side dwell pricing power the moment the trailer hits the gate at a service center that knows how to sequence it; that is the seam where the same recovered minute becomes a carrier-scorecard line item the shipper is willing to pay a premium against rather than absorb as detention.',
      metrics: [
        { label: 'Avg truck turn time (shipper-side pilot)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact (shipper-side pilot)', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. For FedEx the two highest-leverage pilot configurations are different in kind. The first is a Network 2.0 consolidated hub currently being optimized — greenfield operating procedure, no existing yard process to displace, the consolidation absorbs the volume from multiple closed predecessor stations and the yard is the single queue that decides whether the next sort cycle starts on time. The second is a FedEx Freight service center on a high-volume LTL lane carrying the kind of freight a 237-facility CPG anchor moves, where the carrier-side dwell minute is the visible drag on the published transit-time promise and the standalone-company math is sharpest on each recovered minute. We would expect either configuration to produce a measurable carrier-scorecard signal within two quarters and a network operating model proposal across the relevant hubs within four.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'fedex-freight-spin',
          source: 'FedEx Freight spinoff disclosures (Form 10 + Investor Day)',
          confidence: 'public',
          detail: 'Form 10 registration statement filed January 2026; inaugural FedEx Freight Investor Day held April 8, 2026; separation on track for June 1, 2026 with NYSE listing under FDXF. John Smith incoming CEO of FedEx Freight. Parcel and LTL operating agreements separating in early spring 2026; ~$600M IT investment ahead of separation. The first standalone earnings cycle lands inside FY26 calendar.',
          url: 'https://investors.fedex.com/news-and-events/investor-news/investor-news-details/2026/FedEx-Announces-Filing-of-Form-10-Registration-Statement-for-Planned-Spin-Off-of-FedEx-Freight/default.aspx',
        },
        {
          id: 'fedex-network-2',
          source: 'FedEx Network 2.0 public reporting',
          confidence: 'public',
          detail: '~360 facilities operating Network 2.0-optimized as of early 2026 (~25% of eligible NA average daily volume); 65% target by 2026 peak; 475+ station closures planned by end of 2027 (~30% of NA footprint). ~115 additional facilities scheduled to roll in before 2026 peak. Stated savings target: ~$2B by end of 2027. ~10% P&D cost reduction cited in rolled-out markets.',
          url: 'https://www.supplychaindive.com/news/fedex-network-2-station-closures-2026/812251/',
        },
        {
          id: 'fedex-freight-footprint',
          source: 'FedEx Freight LTL network disclosures',
          confidence: 'public',
          detail: 'Approximately 323 LTL terminals plus 13 relay locations (~360 service centers) as of mid-2025; ~26,000 dock doors network-wide. Recent terminal openings: Phoenix (218 doors), Greenwood IN (125 doors, Indianapolis area), Sioux Falls SD (76 doors). The dock-door count is the inventory the standalone-company service-level math is built against.',
        },
        {
          id: 'fedex-investor-day-2026',
          source: 'FedEx Corporation 2026 Investor Day (Raj Subramaniam)',
          confidence: 'public',
          detail: 'Three-part transformation framing on the record: Network 2.0 ground-air integration, Tricolor air-network rebuild, FedEx Freight spin. AI deployment in hubs (Dexterity AI sortation) cited at +13% trailer utilization and >99% sortation accuracy. FY2029 adjusted free cash flow target ~$6B; capex falling toward ~4% of revenue.',
          url: 'https://newsroom.fedex.com/newsroom/global-english/fedex-corporation-hosts-2026-investor-day',
        },
        {
          id: 'fedex-freight-investor-day',
          source: 'FedEx Freight inaugural Investor Day (April 8, 2026)',
          confidence: 'public',
          detail: 'Inaugural FedEx Freight Investor Day held April 8, 2026 in advance of the June 1, 2026 separation. Standalone-company positioning, ~$600M IT modernization investment, and dock-door / terminal footprint disclosures anchored at this event. Incoming CEO John Smith and the FDXF executive leadership team outlined the standalone operating-model math.',
          url: 'https://newsroom.fedex.com/newsroom/global-english/fedex-freight-hosts-inaugural-investor-day-ahead-of-planned-spinoff-from-fedex',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance, dock-cycle distributions, and detention-cost ranges for LTL and parcel hub operating contexts. These describe the conditions most carrier networks operate under, not FedEx specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Numbers are referenceable in a peer call when relevant. For FedEx the most useful framing of the Primo numbers is as the shipper-side counterpart to the carrier-side yard hand-off at the destination service center.',
        },
        {
          id: 'tier1-anchor-network',
          source: 'Tier-1 CPG anchor operating data (un-name-able, contractually)',
          confidence: 'measured',
          detail: '237-facility CPG network — North America\'s largest bottled-water producer — running the network-level yard operating model across multi-year contracted term. Directly-shaped reference for peer call if the conversation moves to operating-model proof on freight that crosses FedEx yards every day.',
        },
        {
          id: 'temple-tenure',
          source: 'Scott Temple — FedEx Supply Chain leadership record',
          confidence: 'public',
          detail: 'Scott Temple is President of FedEx Supply Chain — confirmed via FedEx corporate leadership page (fedex.com/en-us/about/leadership/scott-temple.html) and Temple\'s LinkedIn profile. Owns the contract-logistics and managed-transportation arm that sits at the seam between FedEx and the enterprise shippers whose freight crosses Ground hubs and Freight service centers every day. The carrier-side yard hand-off is the part of that seam where the published transit-time promise either holds or slips.',
          url: 'https://www.fedex.com/en-us/about/leadership/scott-temple.html',
        },
      ],
      unknowns: [
        'Which Network 2.0 consolidated hubs are currently absorbing the most exception flow from closed predecessor stations, and which of those are scheduled for optimization in the next ~115 facilities to be rolled in before 2026 peak',
        'How the FedEx Freight spin governance is sequencing operating-standard decisions under John Smith — whether yard-execution standardization belongs to the pre-spin parent timeline or to the post-spin FDXF management team, and where in the ~$600M IT investment envelope an execution-layer addition would land',
        'Where the existing site-level yard tooling already covers the records layer cleanly inside FedEx, and which service centers run mostly on radio and clipboard today',
        'How carrier-scorecard performance is reported into FedEx Freight\'s national accounts seam, and which service centers are driving the worst scorecards on shipper trailers that look like the 237-facility CPG anchor profile',
        'Whether the Tricolor air-network rebuild is creating new yard-flow shapes at the air-ground integrated hubs that the Network 2.0 yard plan has not yet absorbed',
        'How the gate-to-sort-belt queue feeding the Dexterity AI sortation hubs is currently sequenced — and whether the inside-the-hub AI gains (+13% trailer utilization, >99% sortation accuracy) are being held back by the yard-queue upstream',
        'How the LTL service-center yard handles the post-USPS-handoff parcel residual at the consolidated hubs, given the rolling changes in parcel-LTL hand-off conventions across the industry in 2025–2026',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a carrier-side network engagement. FedEx is distinctive in this round because the pitch shape is inverted. FedEx is the carrier, not the shipper. The Primo Brands comparable is intentional precisely because the freight in the comparable crosses FedEx yards every day on the way to the consignee — the question for FedEx is not whether the operating model works (the shipper-side pilot already proved it does) but whether the carrier-side yard hand-off at the destination service center is leaking the same minutes the shipper-side pilot recovered, and whether those recovered minutes become carrier-side dwell pricing power on the next contract renewal. Two structural rewrites are open at once: Network 2.0 is rewriting ~30% of the NA facility footprint with ~115 facilities still scheduled to optimize before 2026 peak, and FedEx Freight separates June 1, 2026 into a standalone public company under John Smith with ~$600M of pre-separation IT investment in flight. Both windows close after they pass. The cheapest moment to add an execution-and-orchestration layer to the operating standard is during the rewrite, not after.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Scott — the contract-logistics and managed-transportation seam your office owns is the part of the network where the published transit-time promise and the realized one diverge most visibly on enterprise-shipper scorecards, and where the carrier-side yard hand-off either continues the discipline a Tier-1 shipper has already invested in or stops it at the gate. The part most worth pushing back on is whether the Network 2.0 hubs absorbing the most exception flow today are also the ones FedEx Supply Chain\'s enterprise-shipper accounts are reading worst on the scorecard, whether the FedEx Freight spin sequencing under John Smith has already foreclosed an execution-layer decision until after the first standalone earnings cycle, or whether the gate-to-sort-belt queue feeding the Dexterity AI hubs is the rate-limiter on the inside-the-hub gains your customers are seeing on the scorecard. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-071',
      name: 'Scott Temple',
      firstName: 'Scott',
      lastName: 'Temple',
      title: 'President, FedEx Supply Chain',
      company: 'FedEx',
      email: 'scott.temple@fedex.com',
      linkedinUrl: 'https://www.linkedin.com/in/scotttemple2',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Operations / Supply Chain',
      currentMandate: 'President of FedEx Supply Chain — confirmed via FedEx corporate leadership page and LinkedIn. Owns the contract-logistics and managed-transportation arm at the seam between FedEx and the enterprise shippers whose freight crosses Ground hubs and Freight service centers every day. The carrier-side yard hand-off is the part of that seam where the published transit-time promise either holds or slips, and where Network 2.0 consolidation gains and Dexterity AI sortation gains either land on the customer scorecard or get held back by the yard queue upstream.',
      bestIntroPath: 'LinkedIn / exec outreach — direct outreach to the FedEx Supply Chain President seat. If delegated, the contract-logistics ops leadership at the operating-company level below, or a Vice President in Customer Operations on the named-account portfolio, are the right alternates.',
    },
    {
      personaId: 'P-072',
      name: 'Ray Hatton',
      firstName: 'Ray',
      lastName: 'Hatton',
      title: 'Vice President, FedEx Supply Chain',
      company: 'FedEx',
      email: 'ray.hatton@fedex.com',
      linkedinUrl: 'https://www.linkedin.com/in/ray-hatton-18411356',
      roleInDeal: 'routing-contact',
      seniority: 'C-level',
      function: 'Operations',
      currentMandate: 'Named VP-level FedEx Supply Chain operator.',
      bestIntroPath: 'LinkedIn / exec outreach',
    },
    {
      personaId: 'P-073',
      name: 'Jose A. Touzon',
      firstName: 'Jose',
      lastName: 'A. Touzon',
      title: 'Vice President, Customer Operations',
      company: 'FedEx',
      email: 'jose.touzon@fedex.com',
      linkedinUrl: 'https://www.linkedin.com/in/jose-a-touzon-7763423',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Customer Operations',
      currentMandate: 'Public profile says he leads FedEx supply-chain operations for technology and industrial clients in North America.',
      bestIntroPath: 'LinkedIn / exec outreach',
    },
    {
      personaId: 'P-074',
      name: 'Douglas Spamer',
      firstName: 'Douglas',
      lastName: 'Spamer',
      title: 'Managing Director - Linehaul / Transportation, FedEx Ground',
      company: 'FedEx',
      email: 'douglas.spamer@fedex.com',
      linkedinUrl: 'https://www.linkedin.com/in/douglas-spamer-65794a30',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Linehaul / Transportation',
      currentMandate: 'Direct linehaul and transportation signal inside FedEx Ground.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-075',
      name: 'Jake Pyke',
      firstName: 'Jake',
      lastName: 'Pyke',
      title: 'Senior Manager - Linehaul Operations',
      company: 'FedEx',
      email: 'jake.pyke@fedex.com',
      linkedinUrl: 'https://www.linkedin.com/in/jake-pyke-5738a5185',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Terminal / Network Operations',
      currentMandate: 'Named linehaul operations manager for network-ops lane.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-071',
        name: 'Scott Temple',
        firstName: 'Scott',
        lastName: 'Temple',
        title: 'President, FedEx Supply Chain',
        company: 'FedEx',
        email: 'scott.temple@fedex.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Operations / Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Scott Temple - President, FedEx Supply Chain',
      variantSlug: 'scott-temple',

      framingNarrative:
        'Scott, the FedEx Supply Chain seat is the part of the corporate network where the published transit-time promise meets the enterprise-shipper scorecard most directly — contract logistics and managed transportation sit on top of Ground hubs and Freight service centers, and the carrier-side yard hand-off at each one of those facilities is where the shipper\'s own yard-operating-model investment either continues across the dock or stops at the gate. Network 2.0 is consolidating ~30% of the NA facility footprint into ~360 optimized hubs, FedEx Freight separates June 1, 2026 under John Smith with ~$600M of pre-separation IT investment in flight, and Dexterity AI sortation is showing what inside-the-hub AI returns at +13% trailer utilization and >99% sortation accuracy. The yard between the gate and the sort belt is the one execution surface that does not yet have a network operating layer on it — and it is the one your enterprise-shipper accounts are reading on the scorecard.',
      openingHook:
        'The 237-facility CPG anchor — North America\'s largest bottled-water producer — pulled its average truck turn time from 48 minutes to 24 by running a network operating model above its site-level yard tooling. Those trailers cross FedEx Freight service centers and Network 2.0 hubs on the way to the consignee. The minutes that anchor recovered on the shipper side are the same minutes the carrier-side hand-off is currently absorbing — and the same minutes that, on the carrier side, become dwell pricing power on the next contract renewal.',
      stakeStatement:
        'Two structural rewrites are open simultaneously and they are not always open. Network 2.0 is rewriting the operating procedure at ~115 more facilities between now and 2026 peak; FedEx Freight\'s service-level math becomes a standalone NYSE filing on June 1, 2026 under John Smith, with ~$600M of pre-separation IT investment in flight. The yard-execution layer is cheaper to add during the rewrite than after it — and the standalone-company P&L sharpens the math on every minute of avoidable carrier-side dwell.',

      heroOverride: {
        headline: 'Yard hand-offs as the service-promise constraint — for the carrier this time.',
        subheadline:
          'Network 2.0 closes 475+ stations by 2027 and routes that volume through ~360 consolidated hubs. FedEx Freight separates June 1, 2026 with ~26,000 dock doors across ~360 service centers, ~$600M of pre-separation IT investment in flight, and John Smith stepping in as CEO. Both rewrites land on the same yard.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer carrier-side framing. Acknowledge the existing yard-records tooling estate respectfully — site-level YMS where it exists is doing the records job, and the Dexterity AI sortation hubs are already producing real inside-the-hub gains. The wedge is the execution and orchestration layer above the records layer, sized for the Network 2.0 consolidation and the FedEx Freight separation. Frame yard discipline as carrier-side dwell pricing power, not shipper-side cost-out. Anti-sales register; no booking CTA; no savings promise.',
      kpiLanguage: ['published-vs-realized transit time', 'service-center yard dwell', 'consolidated-hub queue depth', 'carrier scorecard', 'dock-door utilization', 'detention pricing power', 'gate-to-sort-belt queue'],
      proofEmphasis:
        'Primo is the public comparable to cite — the operating model already proven on the hardest CPG freight. The directly-shaped 237-facility CPG anchor is the credibility flex if peer-reference becomes the topic. Both look like the freight FedEx Freight wants on its trailers — and the trailers FedEx Supply Chain\'s enterprise-shipper accounts already arbitrate against.',
    },
    {
      person: {
        personaId: 'P-072',
        name: 'Ray Hatton',
        firstName: 'Ray',
        lastName: 'Hatton',
        title: 'Vice President, FedEx Supply Chain',
        company: 'FedEx',
        email: 'ray.hatton@fedex.com',
        roleInDeal: 'routing-contact',
        seniority: 'C-level',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Ray Hatton - Vice President',
      variantSlug: 'ray-hatton',

      framingNarrative:
        'Ray sits at the VP-level operations layer where the Network 2.0 consolidation math becomes a facility-by-facility execution number. The yard at the surviving consolidated hub is the queue that absorbs the volume from the closed predecessor stations — and the first execution surface where consolidation decisions show up as a daily operations number rather than a slide. The Tier-1 CPG anchor whose freight crosses these hubs every day already runs the operating model on its own yards; the carrier-side counterpart is the open seam.',
      openingHook:
        '~360 facilities are running Network 2.0-optimized today; another ~115 are scheduled in before 2026 peak. Every one of those rewrites is a moment when the yard-operating procedure is open. After peak it is closed again until the next consolidation cycle.',
      stakeStatement:
        'Consolidation collapses the overlapping-station safety net. Once the predecessor station closes, the yard at the surviving hub is the entire queue. The minute of dwell that used to be absorbed across two facilities now sits on one — and the carrier scorecard signal lands at the consolidated hub.',

      heroOverride: {
        headline: 'The consolidated-hub yard is the queue Network 2.0 just made single-point-of-failure.',
        subheadline:
          '~360 Network 2.0 facilities live today; 475+ station closures planned by end of 2027; ~30% of the NA footprint rewriting its yard procedure on the way through. The shipper-side comparable already pulled drop-and-hook turn time from 48 minutes to 24 on the trailers crossing these hubs.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator inside the consolidation. Acknowledge the existing yard-records tooling estate at the sites that have it. The wedge is the orchestration layer that absorbs the post-consolidation queue depth, sized for the next ~115 facilities to be optimized. Anti-sales register; no booking CTA; no savings promise.',
      kpiLanguage: ['consolidated-hub queue depth', 'service-center yard dwell', 'next-sort-cycle adherence', 'carrier scorecard', 'dock-door utilization', 'exception flow absorption'],
      proofEmphasis:
        'Primo is the public comparable for the operating model. The 237-facility CPG anchor whose trailers cross these hubs every day is the directly-shaped reference if peer-reference becomes the topic.',
    },
    {
      person: {
        personaId: 'P-073',
        name: 'Jose A. Touzon',
        firstName: 'Jose',
        lastName: 'A. Touzon',
        title: 'Vice President, Customer Operations',
        company: 'FedEx',
        email: 'jose.touzon@fedex.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Customer Operations',
      },
      fallbackLane: 'ops',
      label: 'Jose A. Touzon - Vice President',
      variantSlug: 'jose-a-touzon',

      framingNarrative:
        'Jose owns the customer-operations seam where contractual service-level reporting meets the technology and industrial shipper accounts. Carrier-side yard dwell at the destination service center is the variable that sits between FedEx\'s published transit-time promise and the realized one — and the carrier scorecard the shipper is reading is built from those minutes. The pre-dock yard is the one execution surface where the scan starts later than the trailer arrived.',
      openingHook:
        'The 237-facility CPG anchor that crosses these service centers every day already proved the operating model recovers the dwell minute on the shipper side. The carrier-side counterpart sits inside the contractual scorecard your client portfolio is measured against.',
      stakeStatement:
        'After the FedEx Freight spin separates June 1, every service-center yard minute belongs to a standalone P&L and a standalone NYSE filing. The cost-of-yard-failure and the cost-of-yard-fix line up on the same balance sheet for the first time.',

      heroOverride: {
        headline: 'The published transit time and the realized one diverge inside the service-center yard.',
        subheadline:
          'FedEx Freight separates June 1, 2026. ~26,000 dock doors across ~360 service centers handle the carrier-side dwell that the shipper-side comparable has already learned how to recover.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator inside the customer-scorecard seam. Lead with the published-vs-realized transit-time framing and the carrier-scorecard math. Acknowledge the existing yard-records tooling estate; the wedge is the orchestration layer above it. Anti-sales register; no booking CTA; no savings promise.',
      kpiLanguage: ['published-vs-realized transit time', 'carrier scorecard', 'service-center yard dwell', 'customer-experience surface', 'detention pricing power', 'contractual SLA exposure'],
      proofEmphasis:
        'Primo is the public comparable. The 237-facility CPG anchor is the directly-shaped reference: same freight, same hand-off, shipper side already solved — carrier side is the open seam.',
    },
    {
      person: {
        personaId: 'P-074',
        name: 'Douglas Spamer',
        firstName: 'Douglas',
        lastName: 'Spamer',
        title: 'Managing Director - Linehaul / Transportation, FedEx Ground',
        company: 'FedEx',
        email: 'douglas.spamer@fedex.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Linehaul / Transportation',
      },
      fallbackLane: 'logistics',
      label: 'Douglas Spamer - Managing Director - Linehaul / Transportation',
      variantSlug: 'douglas-spamer',

      framingNarrative:
        'Douglas runs the linehaul and transportation layer where Ground hubs and Freight service centers meet on scheduled lane departures. Every linehaul run starts and ends in a yard — origin yard queue depth determines whether the trailer makes its departure window, destination yard state determines whether the freight hits the next outbound cycle. With Network 2.0 collapsing the overlapping-station safety net and FedEx Freight separating in June, the linehaul-yard handshake at each end of the lane carries more weight per minute than it did a year ago.',
      openingHook:
        '~26,000 dock doors across ~360 FedEx Freight service centers handle the LTL leg of freight that, for the largest CPG shippers in the country, has already been yard-disciplined on the shipper side. The 237-facility CPG anchor — North America\'s largest bottled-water producer — recovered 24 minutes per drop-and-hook trailer cycle on its own yards. The carrier-side end of the same hand-off is where the next minute lives.',
      stakeStatement:
        'After June 1, 2026, FedEx Freight\'s service-level math becomes a standalone NYSE filing under FDXF. Linehaul on-time-arrival becomes a per-quarter public number, not a parent-company line item. The yard at each end of the lane is the variable that decides whether the published number and the realized number agree.',

      heroOverride: {
        headline: 'Linehaul cadence at both ends of the lane — the carrier-side yard math after the spin.',
        subheadline:
          'FedEx Freight separates June 1, 2026 with ~323 terminals + ~13 relay locations and ~26,000 dock doors. The shipper-side comparable already pulled drop-and-hook turn time from 48 minutes to 24 on its own yards. The carrier-side end of the same hand-off is the open seam.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator inside the linehaul-yard handshake. Frame the conversation around lane-departure adherence and the post-spin per-quarter public service-level math. Acknowledge the existing yard-records tooling at the service centers that have it; the wedge is the orchestration layer above the records layer. Anti-sales register; no booking CTA; no savings promise.',
      kpiLanguage: ['lane-departure adherence', 'linehaul on-time arrival', 'service-center yard dwell', 'carrier scorecard', 'detention pricing power', 'published-vs-realized transit time'],
      proofEmphasis:
        'Primo is the public comparable. The 237-facility CPG anchor is the directly-shaped reference: same trailers, same lane shape, shipper side already disciplined — carrier side is the open seam.',
    },
    {
      person: {
        personaId: 'P-075',
        name: 'Jake Pyke',
        firstName: 'Jake',
        lastName: 'Pyke',
        title: 'Senior Manager - Linehaul Operations',
        company: 'FedEx',
        email: 'jake.pyke@fedex.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Terminal / Network Operations',
      },
      fallbackLane: 'ops',
      label: 'Jake Pyke - Senior Manager - Linehaul Operations',
      variantSlug: 'jake-pyke',

      framingNarrative:
        'Jake sits at the terminal-and-network-operations layer where trailer arrivals, sort cycles, and lane departures are sequenced to the minute. The yard between the ramp gate and the hub sort belt is the queue that decides whether the next sort cycle starts on time — at terminal scale, that queue is measured in minutes and managed manually with radio and clipboard. Network 2.0 consolidation puts more of that queue on fewer hubs, and the overlapping-station safety net that used to absorb exceptions is closing.',
      openingHook:
        '~360 facilities are running Network 2.0-optimized today; ~115 more before 2026 peak. Every one of those is a moment when the gate-to-sort-belt queue procedure is being rewritten anyway. The shipper-side comparable already proved the operating model recovers the minute.',
      stakeStatement:
        'Once the predecessor station closes, the yard at the surviving consolidated hub is the entire queue. The minute of dwell that used to be absorbed across two facilities now sits on one — and the next-sort-cycle adherence number at the consolidated hub is the one Operations sees first.',

      heroOverride: {
        headline: 'Gate-to-sort-belt queue depth after the consolidation absorbs the volume.',
        subheadline:
          '~360 Network 2.0 hubs live; ~115 more before 2026 peak. The yard between the ramp and the sort belt is the queue that decides whether the next cycle starts on time. The shipper-side comparable already learned how to manage that queue with software, not radio.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator inside the hub sort-cycle. Frame the conversation around gate-to-sort-belt queue depth and next-sort-cycle adherence. Acknowledge the existing yard-records tooling estate; the wedge is the orchestration layer that absorbs the post-consolidation queue. Anti-sales register; no booking CTA; no savings promise.',
      kpiLanguage: ['gate-to-sort-belt queue depth', 'next-sort-cycle adherence', 'consolidated-hub absorption', 'carrier scorecard', 'dock-door utilization', 'exception flow'],
      proofEmphasis:
        'Primo is the public comparable. The 237-facility CPG anchor is the directly-shaped reference for what the operating model looks like on hard freight.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured across live deployments' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at 3pl / logistics facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'Our customers see the difference. Carrier check-in went from 45 minutes to under 10. That changes the economics of every load.',
        role: 'Operations Director',
        company: 'National 3PL Provider',
      },
    },
  ],

  network: {
    facilityCount: '~360 Network 2.0-optimized Ground/Express hubs operating today (target: 65% of eligible NA volume by 2026 peak); ~323 FedEx Freight terminals + ~13 relay locations (~360 LTL service centers); ~26,000 dock doors network-wide',
    facilityTypes: ['Network 2.0 Consolidated Hubs', 'Ground/Express Integrated Hubs', 'FedEx Freight LTL Service Centers', 'Relay Locations'],
    geographicSpread: 'North America (Memphis HQ; FedEx Freight HQ Memphis; standalone NYSE listing planned as FDXF June 1, 2026)',
    dailyTrailerMoves: 'High-volume — modeled at the network level across ~360 Network 2.0 hubs and ~360 FedEx Freight service centers; ~115 additional Network 2.0 facilities scheduled to optimize before 2026 peak',
    fleet: 'Large private fleet (200K+ vehicles) plus contracted linehaul; FedEx Freight operates the dedicated LTL trailer fleet that separates with the spin',
  },

  freight: {
    primaryModes: ['LTL (FedEx Freight)', 'Ground Parcel', 'Express Parcel', 'Linehaul Truckload'],
    avgLoadsPerDay: 'High-volume — distributed across Network 2.0 consolidated hubs (parcel + cross-dock) and FedEx Freight LTL service centers',
    peakSeason: 'Q4 holiday peak — Network 2.0 65%-of-volume target is benchmarked to 2026 peak',
  },

  signals: {
    recentNews: [
      'FedEx Freight spin-off on track for June 1, 2026 — Form 10 filed January 2026; standalone NYSE listing under FDXF; inaugural Investor Day held April 8, 2026; John Smith incoming CEO; ~$600M IT modernization investment ahead of separation.',
      'Network 2.0: ~360 facilities running optimized today (~25% of eligible NA average daily volume); 65% target by 2026 peak; 475+ station closures planned by end of 2027 (~30% of NA footprint); ~115 additional facilities scheduled before 2026 peak; ~$2B savings target; ~10% P&D cost reduction in rolled-out markets.',
      'FedEx Freight LTL footprint at separation: ~323 terminals + ~13 relay locations (~360 service centers); ~26,000 dock doors network-wide; recent capacity adds in Phoenix (218 doors), Indianapolis-area (125 doors), Sioux Falls (76 doors).',
      'FedEx 2026 Investor Day (Raj Subramaniam): three-part transformation framing (Network 2.0, Tricolor air, FedEx Freight spin); FY2029 adjusted free cash flow target ~$6B; capex toward ~4% of revenue.',
      'Dexterity AI sortation deployment cited at +13% trailer utilization and >99% sortation accuracy at deployed hubs — inside-the-hub AI gains real; gate-to-sort-belt yard queue feeding them is the upstream rate-limiter.',
    ],
    supplyChainInitiatives: [
      'Network 2.0 ground-air consolidation — 475+ station closures planned by end of 2027; routing volume through ~360 optimized hubs; ~115 facilities scheduled before 2026 peak',
      'FedEx Freight separation (June 1, 2026) — standalone public LTL carrier under John Smith; ~360 service centers and ~26,000 dock doors; ~$600M pre-separation IT investment',
      'Tricolor air-network rebuild — aligning aircraft capacity to service tiers in parallel with Network 2.0',
      'Dexterity AI sortation rollout — inside-the-hub trailer utilization and sortation accuracy gains',
    ],
    urgencyDriver:
      'Two structural rewrites are open simultaneously and they are not always open. Network 2.0 is rewriting the operating procedure at ~115 more facilities between now and 2026 peak; FedEx Freight separates June 1, 2026 into a standalone NYSE-listed public company under John Smith with ~$600M of pre-separation IT investment in flight. The cheapest moment to add an execution-and-orchestration layer to the operating standard is during the rewrite, not after — and the standalone-company P&L sharpens the math on every minute of avoidable carrier-side dwell once the first earnings cycle lands.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Network 2.0', body: '~360 facilities optimized today · 475+ stations closing by 2027 · ~115 more before 2026 peak.' },
    { mark: 'FedEx Freight spin', body: 'June 1, 2026 · NYSE: FDXF · John Smith CEO · ~$600M pre-separation IT investment.' },
    { mark: 'LTL footprint at separation', body: '~323 terminals + ~13 relay locations · ~26,000 dock doors network-wide.' },
    { mark: 'Inside-the-hub AI', body: 'Dexterity AI sortation · +13% trailer utilization · >99% accuracy. Gate-to-sort-belt queue is the upstream rate-limiter.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same trailers crossing FedEx yards.' },
  ],

  audioBrief: {
    src: AUDIO_BRIEF_SRC,
    intro:
      'This brief is for Scott Temple. The shipper-side pilot that pulled average truck turn time from 48 minutes to 24 ran on trailers that cross FedEx yards every day. The five minutes that follow are about the carrier-side end of the same hand-off — yard hand-offs as the service-promise constraint, with Network 2.0 rewriting ~30% of the NA footprint and FedEx Freight separating June 1, 2026.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#4D148C',
    backgroundVariant: 'dark',
  },


};
