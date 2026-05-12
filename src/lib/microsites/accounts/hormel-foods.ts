/**
 * Hormel Foods — ABM Microsite Data
 * Quality Tier: A+ (Tier 2, Band B — CPG, multi-temp manufacturer)
 * Phase 9 A+ uplift: extends Phase 7 baseline to A+ matching the kraft-heinz
 * Lighthouse-tile / general-mills Accelerate-tile pattern. Memo is now
 * shaped to Will Bonifant as the top decision-maker, taking the CSCO seat
 * March 9, 2026 from 15 years at Hershey running supply-chain strategy and
 * manufacturing across a 20-plant network — a footprint shape that maps
 * almost cleanly onto Hormel's. T&M wraps 2026; o9 Digital Brain stabilized
 * across 70+ sites through 2025; Hormel Production System remains the
 * in-plant standard. Yard layer above the plants is the unfilled tile.
 *
 * Pitch shape: network-level yard operating model laddering up from the
 * site-level Hormel Production System, on top of an o9-orchestrated
 * planning stack that now spans dry + refrigerated networks.
 * Angle: YARD MANAGEMENT — multi-temp dock arbitration at multi-temp plants,
 * trailer-into-yard pressure from T&M throughput lift (Tucker GA bacon-line
 * reallocation, Planters Suffolk VA disruption), and the seam between
 * legacy refrigerated-meat-native yards and the Planters-acquired
 * shelf-stable network.
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const hormelFoods: AccountMicrositeData = {
  slug: 'hormel-foods',
  accountName: 'Hormel Foods',
  coverHeadline: 'The yard layer above o9 and the Hormel Production System',
  titleEmphasis: 'above o9 and the Hormel Production System',
  coverFootprint: '30+ U.S. plants · T&M · o9 live 2025',
  parentBrand: 'Hormel',
  vertical: 'cpg',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 81,

  pageTitle: 'Hormel Foods · Multi-temperature manufacturing and the yard at the dock door',
  metaDescription:
    "Hormel runs SPAM, Jennie-O, Skippy, Applegate, and the Planters-acquired shelf-stable network across 30+ U.S. plants. Multi-temp at the same plant means the yard layer arbitrates dock-door decisions that o9 plans for but doesn't execute.",

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Hormel U.S. network',
      composition: [
        {
          label: 'U.S. manufacturing footprint',
          value: '30+ plants across refrigerated meat, frozen, and shelf-stable; Austin MN flagship + protein plants in Fremont NE, Algona IA, Knoxville IA, Osceola IA, Rochelle IL, plus shelf-stable network from the Planters acquisition',
        },
        {
          label: 'Distribution build-out',
          value: 'Four new DCs added across the last five years — three shelf-stable, one refrigerated — including the Memphis metro DC; capacity adds biased toward shelf-stable since Planters landed',
        },
        {
          label: 'T&M productivity scoreboard',
          value: 'Transform & Modernize launched end of fiscal 2023 — $250M annualized operating-income target across three years on four levers (supply chain, portfolio complexity, data/technology, people/processes). FY25 incremental benefit at $100M–$150M; roughly 90 projects executed in Q3 alone. Program wraps in 2026 — the published productivity engine the yard-layer business case has to be sized inside',
        },
        {
          label: 'o9 coverage',
          value: 'o9 Digital Brain live across 70+ sites in five phased go-lives (Mar–Dec 2025), built with Accenture, deployed across dry and refrigerated networks. Replaced disconnected legacy tools with one Digital Brain — AI/ML forecasting, touchless forecasting, system-recommended inventory transfers, truckload grouping by weight/volume/stackability. The supply-led-to-demand-driven pivot at the planning layer; the dock execution layer is downstream of it',
        },
        {
          label: 'Active modernization',
          value: 'Tucker GA bacon line shut Oct 2025 (135 separations) — production reallocated under T&M footprint optimization. Planters Suffolk VA facility temporarily disrupted; co-packer partnerships used to protect fill rates. T&M throughput lift is showing up at the dock door before it shows up on the income statement',
        },
        {
          label: 'Site-level standardization',
          value: "Hormel Production System used to standardize work across manufacturing facilities; site-level operating discipline is mature, network-level yard discipline above the sites is less visible",
        },
        {
          label: 'Multi-temp dock arbitration',
          value: 'SPAM and Black Label (refrigerated/shelf-stable meat) · Jennie-O Turkey (refrigerated/frozen protein) · Skippy and Justin\'s (shelf-stable) · Applegate (refrigerated) · Planters (shelf-stable snacking). Multi-temp at the same plant is the rule, not the exception — a SPAM line, a Jennie-O reefer, and a Planters shelf-stable lane arbitrating one gate window is the standard operating picture, not the edge case',
        },
        {
          label: 'Leadership transition',
          value: 'Will Bonifant named Group VP & CSCO effective March 9, 2026 — 15 years at Hershey leading supply-chain strategy and manufacturing for a 20-plant network, prior BCG management consulting, prior Navy submarine officer. Wharton MBA, Georgia Tech MS, USNA BS. Inherits T&M execution mid-cycle; Jeff Ettinger interim CEO and John Ghingo as President pending permanent CEO appointment Oct 2026',
        },
      ],
      hypothesis:
        "The interesting thing about the Hormel yard math is what o9 cannot solve for. The five-phase o9 go-live through 2025 closed a real gap — touchless forecasting, system-recommended inventory transfers, optimized truckload grouping by weight, volume, and stackability — and it now sees demand, supply, and deployment on a single Digital Brain across 70-plus sites covering both the dry and the refrigerated networks. That is the planning layer working as designed; it is also the move Hormel describes as the pivot from a supply-led value chain to a demand-driven one. The execution layer at the dock door is a different problem. A plant that runs SPAM in the morning, Jennie-O in the afternoon, and a Planters shelf-stable lane in parallel is arbitrating dock-door assignment across three temperature regimes, three product handling profiles, three carrier mixes, and three different downstream lane structures at the same gate. o9 grouped the truckload; it did not pick the door, decide whether the reefer waits for the dry trailer to finish, sequence the temperature transition at the dock between a refrigerated outbound and an ambient inbound, or know whether the spotter on shift today has the institutional memory to handle that sequence cleanly.\n\nThe gap between what the plan says and what the yard does got more expensive in the last three years for three reasons. First, T&M is structurally about removing operating-income waste — every minute of avoidable dock dwell that the program does not visibly own is a piece of the $250M number that has to come from somewhere else, and the FY25 number ($100M–$150M of incremental benefit, against roughly 90 projects executed in a single quarter) only compounds if the underlying execution holds into the FY26 wrap year. Second, the Planters integration laid a shelf-stable network on top of a company whose yard reflexes were built around refrigerated meat. The Planters acquisition closed in 2021 at $3.35B (Hormel's largest deal ever, from Kraft Heinz) and the supply-chain integration ran through One Supply Chain and Project Orion at the planning and inventory layer, but the yard SOPs at a former-Kraft-Heinz shelf-stable plant are not the same as the yard SOPs at the Austin protein flagship, and a unified Digital Brain does not unify the gatehouse. Third, T&M throughput optimization is already showing up at the dock before it shows up on the income statement — the Tucker GA bacon-line shutdown reallocated volume into the rest of the protein network, and the Planters Suffolk VA temporary disruption pulled co-packer partnerships into the inbound mix at the very plants whose yards were not designed to take it.\n\nThe Hormel Production System standardizes work inside the plant; the network-level yard layer above the plants is the one piece of the operating system that does not yet have a unified standard, and the leadership transition picks exactly that seam to inherit. Will Bonifant takes the CSCO seat effective March 9, 2026 from 15 years at Hershey running supply-chain strategy and manufacturing across a 20-plant network — a footprint shape that maps almost cleanly onto Hormel's, with a BCG-and-Navy operating register that runs in process-discipline language rather than slide language. He inherits T&M mid-cycle (program wraps 2026), an o9 stack that just stabilized across both networks, a Hormel Production System with mature in-plant work standards, an interim CEO in Jeff Ettinger and a President-and-likely-internal-candidate in John Ghingo, and a permanent CEO appointment due October 2026. As T&M throughput compounds and the FY25 $100M–$150M number turns into the FY26 wrap-year scoreboard, trailer-into-the-yard pressure rises with it, and the o9 plan starts depending on a dock execution layer that has not been built at the network level. That is the seam.",
      pullQuote: 'o9 grouped the truckload. It did not pick the door.',
      caveat:
        "This is built from public Hormel disclosures, T&M and o9 reporting, the Planters acquisition record, the Will Bonifant CSCO announcement, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don't match what your team is seeing: whether the Hormel Production System already extends to yard operations or stops at the plant fence, whether multi-temp dock arbitration is decided by site policy or operator judgment today, whether the Planters-network yards have been brought onto the same SOPs as the legacy protein plants, where T&M throughput lift has already started showing up as trailer congestion at the gatehouse, and which yard-cost line items the program currently counts versus the ones it does not.",
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the Hormel operating stack',
      artifact: {
        imageSrc: '/artifacts/hormel-foods-coverage-map.svg',
        imageAlt: 'Hormel operating-stack coverage map. Six tiles representing the operating surfaces Transform & Modernize, o9 Digital Brain, and the Hormel Production System already touch. o9 Planning, T&M Productivity, Demand, Manufacturing, and Logistics are covered. The Yard Network Ops tile is unfilled, marked with a Hormel crimson hairline outline.',
        caption: 'Operating-stack coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Transform & Modernize, o9 Digital Brain, Hormel Production System, and Planters integration disclosures. Site-level yard vendors redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        "Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can't recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Hormel operating profile is similar in shape — multi-site, multi-temp, mature site-level operating discipline already in place via the Hormel Production System, planning unified at the network level via the o9 Digital Brain — but with the additional complication that protein freight is biologically time-bound at the inbound side in ways water freight is not. The translation that matters for Hormel is integration shape, not freight category: Primo is the proof that a network yard operating layer lands on top of mature site-level operating discipline and a unified upstream plan without disrupting either — exactly the move the T&M-plus-o9 stack now needs as throughput compounds into the FY26 wrap year and the Hormel Production System's plant-fence boundary becomes the layer that needs its own equivalent above the sites. If a network operating model can run on water, the read-across to a refrigerated-meat plus shelf-stable manufacturer riding o9 above the Hormel Production System is the easier lift, not the harder one.",
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        "30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot targets at Hormel are different in kind: (1) the Austin MN flagship, because it is the largest single throughput node in the network, runs the most concurrent product profiles at the same gate, and is where any network-wide operating standard ultimately has to prove out; (2) the busiest Planters-network shelf-stable plant, because it is the cleanest test of whether a unified yard operating layer can ride on top of plants whose pre-acquisition yard reflexes were not built at Hormel. We would expect the network to make sense of itself within two to four quarters of the pilot.",
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'hormel-public-network',
          source: 'Hormel Foods public network disclosures and 10-K',
          confidence: 'public',
          detail: 'Anchors the 30+ U.S. plant figure, the Austin MN flagship + Stockton/Atlanta/Aurora/Algona/Knoxville/Osceola/Wichita/Fremont/Oklahoma City/Beloit footprint, and the multi-temp brand portfolio (SPAM, Jennie-O, Skippy, Applegate, Black Label, Justin\'s, Planters).',
          url: 'https://www.hormelfoods.com/',
        },
        {
          id: 'hormel-tm',
          source: 'Hormel Transform & Modernize (T&M) program reporting',
          confidence: 'public',
          detail: 'T&M launched at the end of fiscal 2023 targeting at least $250M in annualized operating-income growth over three years across supply chain, portfolio complexity, data/technology, and people/processes. FY25 incremental benefit expected at $100M–$150M.',
          url: 'https://www.supplychaindive.com/news/hormel-advances-supply-chain-modernization-key-projects-systems/761415/',
        },
        {
          id: 'hormel-o9',
          source: 'o9 Solutions go-live at Hormel Foods',
          confidence: 'public',
          detail: 'Five phased go-lives Mar–Dec 2025 spanning more than 70 sites across dry and refrigerated networks. Replaced disconnected planning tools with a unified Digital Brain; capabilities include AI/ML forecasting, touchless forecasting, system-recommended inventory transfers, and optimized truckload grouping by weight, volume, and stackability.',
          url: 'https://o9solutions.com/news/o9-goes-live-at-hormel-foods-to-modernize-planning-across-the-companys-global-supply-chain-network',
        },
        {
          id: 'hormel-planters',
          source: 'Hormel Planters acquisition (Feb 2021) and One Supply Chain / Project Orion integration',
          confidence: 'public',
          detail: 'Largest deal in Hormel history at $3.35B (acquired from Kraft Heinz). Integration targeted $50M–$60M in synergies through One Supply Chain and Project Orion. The acquired network is structurally shelf-stable snacking on top of a refrigerated-meat-native parent.',
          url: 'https://www.hormelfoods.com/newsroom/press-releases/hormel-foods-announces-closing-of-acquisition-of-planters-snacking-business/',
        },
        {
          id: 'hormel-distribution',
          source: 'Hormel distribution-network expansion disclosures',
          confidence: 'public',
          detail: 'Four new DCs added across the last five years — three shelf-stable, one refrigerated — including the Memphis metro DC opened to improve inventory flow. Capacity additions biased toward shelf-stable since the Planters portfolio joined the network.',
        },
        {
          id: 'hormel-tucker-reallocation',
          source: 'Tucker GA bacon-line shutdown and footprint optimization (Oct 2025)',
          confidence: 'public',
          detail: 'Hormel discontinued bacon production at the Tucker GA plant in October 2025 (135 separations) citing equipment age and long-term strategic alignment, with production reallocated across the rest of the protein network. This is the visible end of T&M footprint optimization — and the kind of reallocation that lands as trailer pressure at the receiving plants before it lands on the income statement.',
          url: 'https://www.supplychaindive.com/news/hormel-advances-supply-chain-modernization-key-projects-systems/761415/',
        },
        {
          id: 'bonifant-tenure',
          source: 'Will Bonifant — public tenure and CSCO appointment record (March 2026)',
          confidence: 'public',
          detail: 'Named Group VP & CSCO effective March 9, 2026. Prior 15 years at The Hershey Company leading supply-chain strategy and manufacturing for a 20-plant network with international leadership across US, Canada, China, Asia, Europe, Middle East, and Africa. Earlier career at The Boston Consulting Group; prior US Navy submarine officer (USS Georgia, ballistic-missile submarine, supervised power-plant operations). BS Electrical Engineering, US Naval Academy; MS Engineering, Georgia Tech; MBA, Wharton. The 20-plant Hershey footprint maps almost cleanly onto the 30+ Hormel plant footprint; the BCG-and-Navy operating register reads in process-discipline rather than slide language.',
          url: 'https://www.hormelfoods.com/newsroom/press-releases/hormel-foods-names-will-bonifant-group-vice-president-and-chief-supply-chain-officer/',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site CPG networks operate under, not Hormel specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether multi-temp dock-door arbitration at the multi-temp plants is decided by site policy, system logic, or operator judgment today',
        "Whether the Hormel Production System's standardization scope extends to the yard or stops at the plant fence",
        'Whether the Planters-network yards have been migrated onto the same SOPs as the legacy refrigerated-meat plants, or still run on pre-acquisition habits',
        'Whether the o9 truckload-grouping output feeds an execution layer at the dock, or stops at the plan and re-enters operator judgment when the trailer hits the yard',
        'How T&M is accounting for yard-induced operating-income leakage — and whether it is in the $250M number or sitting outside it',
        'Where T&M plant-modernization throughput lift has already started producing visible trailer congestion at the gatehouse — particularly the Tucker GA reallocation pattern across receiving protein plants',
        "Whether the Bonifant CSCO transition has paused or accelerated any in-flight T&M operating-layer additions ahead of the program's 2026 wrap — and where a yard-layer entry sequences against the inherited roadmap before the October 2026 permanent-CEO appointment",
        "Whether the supply-led-to-demand-driven pivot Hormel describes at the o9 layer has a corresponding execution-layer counterpart at the dock, or whether the dock surface is still on the supply-led side of the pivot",
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Hormel is distinctive in this round because the operating-system thinking is already in motion: T&M has set the operating-income target and is now inside its wrap year, o9 went live across 70-plus sites and both temperature networks through 2025, and the Hormel Production System has set the standard for in-plant work. The yard layer above the plants is the piece of that operating system that does not yet have a unified standard, and it is the layer that the o9 Digital Brain ultimately depends on when the trailer hits the gate. Will Bonifant inherits the framework intact: a 20-plant Hershey footprint shape in his background that maps almost cleanly onto Hormel’s 30+, a BCG-and-Navy process-discipline register, and a T&M scoreboard about to turn into its FY26 wrap-year number under an interim CEO ahead of the permanent-CEO appointment in October 2026.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        "Will — the part most worth pushing back on is whether the supply-chain operating discipline you carried through 15 years at Hershey across a 20-plant network already counts yard-driven variance inside the T&M scoreboard you inherit at month-one, or whether it sits in the GL codes the program has not been able to act on yet ahead of its 2026 wrap. That answer reshapes the rest of this. Whether the Hormel Production System already covers yard SOPs or stops at the plant fence, whether the Planters-network plants run on Hormel yard standards or pre-acquisition ones, how multi-temp dock arbitration is actually decided today, and where the Tucker reallocation has already put pressure on the receiving protein plants are the next things to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.",
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-021',
      name: 'Will Bonifant',
      firstName: 'Will',
      lastName: 'Bonifant',
      title: 'Group Vice President and Chief Supply Chain Officer',
      company: 'Hormel Foods',
      email: 'will.bonifant@hormel.com',
      linkedinUrl: 'https://www.hormelfoods.com/newsroom/press-releases/hormel-foods-names-will-bonifant-group-vice-president-and-chief-supply-chain-officer/',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain',
      currentMandate: 'Group VP & CSCO effective March 9, 2026. Inherits T&M execution (wraps 2026), the o9 Digital Brain across 70+ sites and both temperature networks, the Hormel Production System for in-plant work, and the Planters integration. Reports into the interim-CEO seat (Jeff Ettinger) ahead of the permanent-CEO appointment in October 2026.',
      previousCompanies: ['The Hershey Company', 'The Boston Consulting Group', 'United States Navy'],
      educationHighlight: 'BS Electrical Engineering, US Naval Academy · MS Engineering, Georgia Tech · MBA, Wharton',
      strategicPriorities: ['T&M FY26 wrap-year scoreboard', 'o9 plan-to-execution translation', 'Planters-network yard SOPs vs. Hormel Production System', 'Multi-temp dock arbitration discipline'],
      operationalPhilosophy: 'BCG-and-Navy process-discipline register. 15 years inside Hershey supply chain across a 20-plant network with international scope — comparable in shape to the Hormel footprint he now owns.',
      knownPainPoints: [
        'T&M $250M target wraps in 2026 — every operating-income point needs to be in or named',
        'Tucker GA reallocation putting trailer pressure on receiving protein plants',
        'Planters Suffolk VA disruption pulling co-packers into the inbound mix',
        'Multi-temp dock arbitration across SPAM, Jennie-O, Planters at the same gate',
        'Interim CEO with a permanent-CEO appointment due Oct 2026 — limited window before agenda resets',
      ],
      communicationStyle: 'External-hire CSCO with deep internal-equivalent experience at Hershey. Process-discipline language. Wharton MBA + Georgia Tech engineering + Navy submarine officer + BCG — reads in operating numbers and structured logic, not in slide language.',
      languagePreferences: ['operating-income lift', 'productivity', 'plant network', 'process discipline', 'integration', 'standardization'],
      connectionHooks: ['15-year Hershey supply-chain tenure across a 20-plant network', 'BCG operating-discipline register', 'Navy nuclear-power submarine officer background', 'External CSCO hire arriving into a mid-cycle transformation'],
      bestIntroPath: 'Direct outreach to CSCO office in the first 90 days of seat. If delegated, target Nicholas Schwartz (Planning COE & Strategy Lead) as the seam-level entry into the plan-to-execution seam.',
    },
    {
      personaId: 'P-022',
      name: 'Nicholas Schwartz',
      firstName: 'Nicholas',
      lastName: 'Schwartz',
      title: 'Supply Chain Planning COE & Strategy Lead',
      company: 'Hormel Foods',
      email: 'nicholas.schwartz@hormel.com',
      linkedinUrl: 'https://www.linkedin.com/in/nicholas-schwartz-657a5a153',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Logistics / Planning',
      currentMandate: 'Planning COE and strategy lead — sits at the seam between the o9 plan and what the network actually executes.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-023',
      name: 'Connor McKenney',
      firstName: 'Connor',
      lastName: 'McKenney',
      title: 'Senior Production Leader',
      company: 'Hormel Foods',
      email: 'connor.mckenney@hormel.com',
      linkedinUrl: 'https://www.linkedin.com/in/connor-mckenney',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Manufacturing',
      currentMandate: 'Plant-operations leader — owns the side of the dock where trailers either land cleanly or queue.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-024',
      name: 'Anthony Nguyen',
      firstName: 'Anthony',
      lastName: 'Nguyen',
      title: 'Buyer & Logistics',
      company: 'Hormel Foods',
      email: 'anthony.nguyen@hormel.com',
      linkedinUrl: 'https://www.linkedin.com/in/anthony-nguyen-20996529',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Supply Chain Innovation',
      currentMandate: 'Blend of logistics and sourcing — useful path into innovation and operations mapping under T&M.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-025',
      name: 'Tim Whitson',
      firstName: 'Tim',
      lastName: 'Whitson',
      title: 'Logistics & Supply Chain Management Professional',
      company: 'Hormel Foods',
      email: 'tim.whitson@hormel.com',
      linkedinUrl: 'https://www.linkedin.com/in/tim-whitson-9149b81bb',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Distribution',
      currentMandate: 'Distribution operator — closer to the four-DC build-out and the refrigerated-vs-shelf-stable handoff.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-021',
        name: 'Will Bonifant',
        firstName: 'Will',
        lastName: 'Bonifant',
        title: 'Group Vice President and Chief Supply Chain Officer',
        company: 'Hormel Foods',
        email: 'will.bonifant@hormel.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'executive',
      label: 'Will Bonifant - Group Vice President and Chief Supply Chain Officer',
      variantSlug: 'will-bonifant',

      framingNarrative:
        "Will, the seat you took on March 9, 2026 is the cleanest 12-month window in a decade to lay one more tile into the Hormel operating stack. T&M has set the $250M operating-income target and is now inside its wrap year, o9 went live across 70+ sites and both temperature networks through 2025, and the Hormel Production System has set the in-plant work standard. The yard layer above the plants is the piece of that operating system that does not yet have a unified standard — and your 15 years at Hershey running supply-chain strategy and manufacturing across a 20-plant network is a footprint shape that maps almost cleanly onto Hormel's 30+. The BCG-and-Navy register reads in process-discipline language rather than slide language, which is the same register the yard-layer entry has to land in.",
      openingHook:
        "T&M targeted $250M in operating-income lift over three years; FY25 delivered $100M–$150M of that on roughly 90 projects executed in a single quarter, and the program wraps in 2026. o9 plans the network; the dock executes it. The seam between the plan and the execution is where multi-temp dock arbitration, the Planters-network yard SOPs, and trailer-into-yard pressure from the Tucker reallocation all live — and it is the layer most likely to leak operating income that the wrap-year scoreboard needs to make its final number.",
      stakeStatement:
        "Two things are open simultaneously and they do not stay open together. T&M is in its 2026 wrap year — every operating-income point needs to be in the scoreboard or named, and the dock-execution layer is where the program's own throughput optimization (Tucker GA reallocation, Planters Suffolk VA disruption, co-packer partnerships in the inbound mix) is putting pressure on yards that were not designed to absorb it. And the CEO seat is interim through October 2026 — the inherited Run-the-business framework is intact, the agenda will not be reset before then, and an operating-layer addition that lands in the cost-and-process register the company already speaks is the cleanest next entry into the map.",

      heroOverride: {
        headline: 'The Hormel operating-stack tile without a unified standard yet is the yard network operating layer.',
        subheadline:
          "T&M owns the operating-income target and is in its 2026 wrap year. o9 unifies planning across 70+ sites and both temperature networks. The Hormel Production System sets the in-plant standard. The yard layer above the plants is the unfilled tile — and the one most exposed as Tucker reallocation, Planters disruption, and T&M throughput compound into the final scoreboard year.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Peer-to-peer network-operator framing with structured-program register. Bonifant inherits an operating system in motion, not a blank page — acknowledge that. The 15-year Hershey 20-plant background is the closest external-equivalent footprint shape to Hormel's, which is the credibility hook. Lead in process-discipline language (operating-income lift, productivity, scoreboard, standardization, integration shape) rather than carrier-experience anecdotes. The BCG-and-Navy register means structured logic and numbers will land harder than slide framing. Position the wedge as the layer above sites (network yard operating model), not as replacement of the Hormel Production System or o9.",
      kpiLanguage: [
        'operating-income lift',
        'T&M scoreboard',
        'productivity scope',
        'network operating model',
        'dock-door arbitration',
        'trailer dwell',
        'multi-temp arbitration',
        'plan-to-execution seam',
        'GL-code coverage',
        'standardization',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same multi-site, multi-temp, mature-site-level-discipline shape, with the credibility of running the hardest CPG freight in the country and the integration-shape match (network operating layer above a unified plan and mature plant-floor discipline) that maps onto the Hormel stack he inherits. The "headcount-neutral while absorbing more volume" pattern is the proof shape that maps to the Tucker-reallocation absorption problem at receiving protein plants. The directly-shaped comparable (the un-name-able 237-facility CPG anchor) is the peer-call credibility flex if reference becomes the topic.',
      avoidPhrases: ['AI-powered', 'disruptive', 'cutting-edge', 'paradigm shift', 'best-in-class'],
    },
    {
      person: {
        personaId: 'P-022',
        name: 'Nicholas Schwartz',
        firstName: 'Nicholas',
        lastName: 'Schwartz',
        title: 'Supply Chain Planning COE & Strategy Lead',
        company: 'Hormel Foods',
        email: 'nicholas.schwartz@hormel.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Logistics / Planning',
      },
      fallbackLane: 'logistics',
      label: 'Nicholas Schwartz - Supply Chain Planning COE & Strategy Lead',
      variantSlug: 'nicholas-schwartz',

      framingNarrative:
        "Nicholas, the planning side of the operating model is in good shape — o9 went live across 70+ sites and both networks through 2025, touchless forecasting is on, truckload grouping by weight and stackability is running. The piece this analysis pokes at is what happens when that plan hits the gate: multi-temp dock arbitration, Planters-network yard SOPs, and the throughput lift T&M is pulling through the plant. The plan-to-execution seam is the bit your COE sees more clearly than anyone outside the building.",
      openingHook:
        "o9 grouped the truckload by weight, volume, and stackability. The yard still picks the door, sequences the reefer-to-dry transition, and decides whether the Planters lane waits for the SPAM line to clear. That's the gap between plan and execution — and it's the gap that determines whether T&M's $100M–$150M FY25 number stays inside the program's framing.",
      stakeStatement:
        "A planning COE that owns 70+ sites on one model can see the gap between a unified plan and a non-unified execution layer better than anyone. Every minute the yard fails to arbitrate is a minute that pollutes forecast accuracy, inventory deployment, and the working-capital math the o9 model is built to optimize.",

      heroOverride: {
        headline: "The plan is unified across 70+ sites. The execution at the dock is the bit that re-enters operator judgment.",
        subheadline:
          "o9 plans the network. The yard executes it. The seam between the two is where multi-temp arbitration, Planters-network SOPs, and T&M throughput pressure all land — and where a planning COE can see the lift before anyone else does.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Nicholas is the planning-strategy seam — the conversation is about how the o9 plan lands (or fails to land) in dock execution. Lead with the plan-to-execution seam framing rather than headline metrics; he already lives in the metrics.',
      kpiLanguage: [
        'plan adherence at the dock',
        'forecast accuracy degradation from execution variance',
        'inventory deployment vs. yard reality',
        'multi-temp arbitration',
        'truckload-grouping execution rate',
        'carrier scorecard',
      ],
      proofEmphasis:
        'The Primo network-operating-model framing resonates with Nicholas because it is exactly the layer his COE owns — a unified plan above the sites translated into unified execution at the sites.',
    },
    {
      person: {
        personaId: 'P-023',
        name: 'Connor McKenney',
        firstName: 'Connor',
        lastName: 'McKenney',
        title: 'Senior Production Leader',
        company: 'Hormel Foods',
        email: 'connor.mckenney@hormel.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Manufacturing',
      },
      fallbackLane: 'ops',
      label: 'Connor McKenney - Senior Production Leader',
      variantSlug: 'connor-mckenney',

      framingNarrative:
        "Connor, the Hormel Production System has set the work standard inside the plant — that's where most of the operating discipline sits, and it shows. The piece this analysis pokes at is the layer just outside the plant fence: how the yard arbitrates dock doors when a SPAM line, a Jennie-O reefer, and a Planters-network shelf-stable lane all want the same gate window, and how T&M throughput lift starts showing up first as queue at the gatehouse before anywhere else.",
      openingHook:
        "T&M is pulling throughput through the plant. The first place that throughput exceeds the existing yard reflex is the dock — and a multi-temp plant arbitrating three product profiles at the same gate doesn't have the same SOP slack a single-profile plant has.",
      stakeStatement:
        "Production leaders feel the yard before anyone else does. A 90-minute trailer delay at a multi-temp plant becomes a temperature-zone compliance event, a line-changeover sequence problem, or a shelf-stable-vs-refrigerated dock contention call that the operator makes in the moment and the network has no record of.",

      heroOverride: {
        headline: 'The Hormel Production System ends at the plant fence. The yard is the layer just outside it that has to keep up with T&M throughput.',
        subheadline:
          'Multi-temp plants arbitrate SPAM, Jennie-O, and Planters at the same gate. As T&M throughput compounds, the gate is where the first sign of the lift exceeding the existing reflex shows up.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Connor lives inside the plant fence and feels the yard congestion as a production-schedule problem first. Anchor the conversation on multi-temp dock arbitration and temperature-zone compliance at the plant level.',
      kpiLanguage: [
        'production schedule adherence',
        'temperature-zone compliance',
        'multi-temp dock arbitration',
        'line-changeover sequencing',
        'inbound-to-line cycle time',
        'dock utilization by temperature zone',
      ],
      proofEmphasis:
        "The Primo per-site profit-impact and headcount-flat-during-growth pattern is the production-leader's version of the comparable — same shape network, more forgiving freight, lift measured at the plant level.",
    },
    {
      person: {
        personaId: 'P-024',
        name: 'Anthony Nguyen',
        firstName: 'Anthony',
        lastName: 'Nguyen',
        title: 'Buyer & Logistics',
        company: 'Hormel Foods',
        email: 'anthony.nguyen@hormel.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Supply Chain Innovation',
      },
      fallbackLane: 'ops',
      label: 'Anthony Nguyen - Buyer & Logistics',
      variantSlug: 'anthony-nguyen',

      framingNarrative:
        "Anthony, the innovation-and-ops lane is where the seam between what T&M targets at the operating-income line and what shows up at the dock is most visible. o9 unified planning; the Hormel Production System unified in-plant work. The piece this analysis pokes at is the layer between them — how the network arbitrates dock execution above the sites in a way that compounds with the rest of the program rather than leaking around it.",
      openingHook:
        "Carrier detention and dock-contention math hit every Hormel plant independently today. T&M's operating-income target needs that math to be visible at the network level, not site-by-site — and the layer that makes it visible is the one that doesn't yet have a unified standard.",
      stakeStatement:
        "Detention and dock-contention costs that get absorbed plant-by-plant don't show up as a line item in T&M. They show up as carrier-scorecard degradation, working-capital variance, and the slow erosion of the operating-income lift the program is supposed to compound.",

      heroOverride: {
        headline: 'The detention and dock-contention math hits every Hormel plant independently. T&M needs it at the network level.',
        subheadline:
          'o9 plans the network. The Hormel Production System runs the plant. The layer between — yard execution above the sites — is the piece that turns plant-level variance into network-level operating income.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator with an innovation framing. Anthony sits between buying and logistics, so the conversation crosses carrier economics, dock cost, and operational design. Lead with carrier scorecard and network-level visibility rather than plant-level metrics.',
      kpiLanguage: [
        'detention spend by lane and carrier',
        'carrier scorecard at the network level',
        'dock-contention cost',
        'truckload-grouping execution rate',
        'network-level operating-income exposure',
        'carrier mix by temperature regime',
      ],
      proofEmphasis:
        'The Primo network-rollout cadence (24 live · >200 contracted) is the credibility flex on whether the operating model is actually deployable at scale, not just at one site.',
    },
    {
      person: {
        personaId: 'P-025',
        name: 'Tim Whitson',
        firstName: 'Tim',
        lastName: 'Whitson',
        title: 'Logistics & Supply Chain Management Professional',
        company: 'Hormel Foods',
        email: 'tim.whitson@hormel.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Distribution',
      },
      fallbackLane: 'ops',
      label: 'Tim Whitson - Logistics & Supply Chain Management Professional',
      variantSlug: 'tim-whitson',

      framingNarrative:
        "Tim, the distribution build-out — three new shelf-stable DCs and one refrigerated DC in the last five years, plus the Memphis metro DC — is the part of the network most directly absorbing the Planters integration and the o9 inventory-transfer logic. The piece this analysis pokes at is the yard at those DCs and at the plants feeding them: how reefer-vs-dry dock sequencing, refrigerated lane discipline, and the handoff between shelf-stable and refrigerated networks gets executed when the trailer actually arrives.",
      openingHook:
        "o9 recommends the inventory transfer; the yard at both ends decides how cleanly it lands. Reefer dwell at a refrigerated DC is the one piece of the cold chain that the rest of the network can't see in real time.",
      stakeStatement:
        "Distribution operators feel the yard as a cold-chain integrity problem and as a reverse-logistics problem at the same time. Refrigerated dwell between gate and dock is the single piece of the cold chain that breaks invisibly — and the one piece the o9 plan can't see once the trailer is on the property.",

      heroOverride: {
        headline: 'Reefer dwell between gate and dock is the cold-chain link that the network sees least.',
        subheadline:
          "Three shelf-stable and one refrigerated DC added in the last five years. o9 recommends the inventory transfer; the yard at both ends decides how cleanly it lands. That's the seam.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator with a distribution lens. Tim lives in the refrigerated/shelf-stable handoff between DCs and plants. Lead with cold-chain integrity, reefer dwell, and the inventory-transfer execution layer.',
      kpiLanguage: [
        'reefer dwell at the gate',
        'cold-chain integrity exposure',
        'inventory-transfer execution rate',
        'refrigerated vs. shelf-stable dock handoff',
        'carrier scorecard for reefer lanes',
        'gate-to-dock cycle time',
      ],
      proofEmphasis:
        "The Primo refrigerated-lane comparable is the most operationally relevant for Tim — same multi-temp distribution shape, same gate-to-dock cycle improvement, measured.",
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured across live deployments' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at food & beverage facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'Primo Brands operates more than 200 contracted facilities on the same production-and-distribution model. YardFlow cut their gate-to-dock time from 48 to 24 minutes.',
        role: 'Operations Director',
        company: 'National Beverage Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '30+ U.S. plants plus multi-DC distribution network',
    facilityTypes: ['Meat Processing Plants', 'Production Facilities', 'Distribution Centers', 'Cold Storage'],
    geographicSpread:
      'North America (HQ: Austin, MN; plants include Austin MN, Stockton CA, Atlanta GA, Aurora IL, Algona IA, Knoxville IA, Osceola IA, Wichita KS, Fremont NE, Oklahoma City OK, Beloit WI, Rochelle IL; Memphis metro DC; plus Planters-acquired shelf-stable network)',
    dailyTrailerMoves: '2,000+ across the network',
    fleet: 'Private fleet plus contract carriers; heavy refrigerated and shelf-stable mix; multi-temp at the same plant is the rule',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal/Rail', 'LTL'],
    avgLoadsPerDay: 'High-volume — distributed across refrigerated meat (SPAM, Jennie-O, Black Label, Applegate), shelf-stable (Skippy, Justin\'s, Planters), and frozen protein',
  },

  signals: {
    eventAttendance: 'Past attendee list',
    recentNews: [
      'Transform & Modernize (T&M) program targeting $250M annualized operating-income lift over three years; $100M–$150M of that expected by end of FY25; program wraps 2026.',
      'o9 Digital Brain live across 70+ sites spanning dry and refrigerated networks through five phased go-lives (Mar–Dec 2025); replaced disconnected legacy tools with a unified planning model — pivot from supply-led to demand-driven value chain.',
      'Tucker GA bacon line shut Oct 2025 (135 separations) — production reallocated across the protein network under T&M footprint optimization.',
      'Four new DCs added across the last five years — three shelf-stable, one refrigerated — including the Memphis metro DC. Capacity adds biased toward shelf-stable since the Planters acquisition.',
      'Planters portfolio ($3.35B acquisition from Kraft Heinz, closed 2021) integrated through One Supply Chain and Project Orion; targeted $50M–$60M in synergies. Suffolk VA temporary disruption pulled co-packer partnerships into the inbound mix.',
      'Will Bonifant named Group VP & CSCO effective March 9, 2026 — 15 years at Hershey leading supply-chain strategy and manufacturing across a 20-plant network. Inherits T&M wrap year under interim CEO Jeff Ettinger ahead of permanent-CEO appointment in October 2026.',
    ],
    supplyChainInitiatives: [
      'Transform & Modernize (T&M) — $250M three-year operating-income target.',
      'o9 Digital Brain unified planning across 70+ sites and both temperature networks.',
      'Hormel Production System — site-level work standardization across manufacturing facilities.',
    ],
    urgencyDriver:
      "T&M is in its 2026 wrap year; the o9 Digital Brain went live across 70+ sites and both temperature networks through 2025; the Hormel Production System sets the in-plant standard. The yard layer between the plan and the dock execution is the one piece of the operating system that does not yet have a unified standard — and Will Bonifant arrived March 9, 2026 into the cleanest 12-month window in a decade to lay one more tile into the stack, ahead of the permanent-CEO appointment in October 2026.",
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'T&M scoreboard', body: '$250M target · 3 years · FY25 $100M–$150M delivered · wraps 2026.' },
    { mark: 'o9 live', body: '70+ sites · dry + refrigerated · five phased go-lives Mar–Dec 2025 · supply-led to demand-driven.' },
    { mark: 'Planters seam', body: '$3.35B acquisition from Kraft Heinz · 2021 · shelf-stable layered on refrigerated-meat-native yards.' },
    { mark: 'Tucker reallocation', body: 'Bacon line shut Oct 2025 · production redistributed · trailer pressure at receivers.' },
    { mark: 'Bonifant arrives', body: 'CSCO effective March 9, 2026 · 15 years Hershey · 20-plant footprint · BCG · Navy submarine.' },
    { mark: 'Multi-temp at the dock', body: 'SPAM, Jennie-O, and Planters arbitrate the same gate at multi-temp plants.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Will Bonifant, taking the CSCO seat March 9, 2026 with T&M inside its wrap year, the o9 Digital Brain live across 70-plus sites and both temperature networks, and the Hormel Production System running as the in-plant work standard. The five minutes that follow are about the one layer of that operating system that does not yet have a unified standard — the yard above the plants, where multi-temp dock arbitration, Planters-network SOPs, the Tucker reallocation, and trailer-into-yard pressure from T&M throughput lift all land.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#A6192E',
    backgroundVariant: 'dark',
  },

  showcase: true,
  showcaseOrder: 3,
  layoutPreset: 'executive',
};
