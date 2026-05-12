/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Westrock Coffee is a confirmed CURRENT Kaleris (PINC) YMS customer per
 * the Inbound Logistics "Yard Management: Grounds for Improvement"
 * feature, January 2026, pp. 179–181, with J.T. Hinson (Director of
 * Freight Logistics) on the record. Specifics:
 *   - Kaleris YMS in production at the Concord NC operation (legacy S&D
 *     Coffee & Tea, acquired by Westrock Feb 2020 for $405M)
 *   - Use cases: shared move-request queue across the three-site Concord
 *     footprint; proximity-based driver workflow; real-time visibility
 *     replacing phone coordination
 *   - Yard grew from 120–130 trailers to ~400 trailers under the
 *     deployment ("five county-spread locations" per hunt list)
 *   - Cited wins: 3–4 phone calls per trailer move → 0; green-coffee
 *     trailer staging from miles away → ~100 yards from the roaster,
 *     acceptance-to-roasting cycle from ~45–50 min → ~15 min (~70% cycle-
 *     time improvement); driver fuel + time saved via proximity-based
 *     move selection; same-resources-more-output
 *   - Hinson on record: "If it's used properly, with supervisors and
 *     managers holding teams accountable, you'll actually have software,
 *     not shelfware."
 *   - PINC AE Lauber is named in the same article (PINC was acquired by
 *     Kaleris in 2022)
 *
 * Persona context: Hinson is the tech-ops hybrid promoted from inside —
 * Distribution Operations Technology Supervisor (2019–2020) → Logistics
 * Manager (2020–2022) → Director of Freight Logistics (2022–present).
 * Completing UNCG Bryan School SCIS degree mid-career — reads the
 * textbook AND runs the yard. Adoption-first; bias toward physical re-
 * design over UI re-design (the most-cited win is moving the green-coffee
 * staging area, not a screen).
 *
 * Operational backdrop: Westrock Coffee Company (NASDAQ: WEST) — Conway
 * AR campus fully operational as of 2026 (CEO Scott Ford: "from
 * construction mode into regular daily operations"). 2026 EBITDA guidance
 * $90M–$100M (29–44% YoY growth) — the operating-leverage year. Conway
 * facilities: $70M DC (Dec 2023, 530K sq ft, 72 dock doors); roast-to-RTD
 * facility ($315M+, ~570K sq ft, June 2024); single-serve "Clark"
 * facility (525K sq ft, July 2025).
 *
 * NOT to be confused with Smurfit Westrock (the paper/packaging
 * conglomerate, NYSE: SW) — different industry, different ticker.
 *
 * Pitch shape: MODERNIZATION (operating model above the working Kaleris
 * deployment + the multi-state operating-model gap as Conway ramps).
 * Hinson got promoted on the back of this implementation; threatening it
 * threatens him; praising it puts you on his side. The unanswered
 * question is the network-tier operating model across Concord NC + Conway
 * AR + Little Rock AR as the Conway campus ramps toward the 2026 EBITDA
 * number.
 *
 * This intel powers the cold-email modernization framing (see
 * docs/research/j-t-hinson-westrock-coffee-dossier.md). It must not appear
 * in any prospect-facing surface. The memo references "the yard tooling
 * you already operate at the Concord NC footprint" / "the existing site-
 * level yard system Westrock Coffee inherited from S&D and continues to
 * use" — never Kaleris/PINC.
 */

/**
 * Westrock Coffee — ABM Microsite Data
 * Quality Tier: A (confirmed CURRENT Kaleris customer per Inbound Logistics
 *                  feature with J.T. Hinson on the record, January 2026)
 * Pitch shape: modernization — network-tier operating model above the
 *              site-level yard system Concord NC inherited from S&D and
 *              continues to use, across the multi-state Concord + Conway +
 *              Little Rock footprint
 * Angle: YARD MANAGEMENT (network-tier coordination across the three-state
 *        operating footprint; Conway campus yard-ops design at the new
 *        roast-to-RTD + single-serve + DC nodes; green-coffee + RTD +
 *        single-serve cadence interleaving) — NOT driver experience (the
 *        existing site system already replaced phone coordination)
 * Stakeholder vocabulary: tech-ops hybrid register
 *        (Hinson\'s Distribution Operations Technology Supervisor →
 *        Logistics Manager → Director arc; UNCG SCIS degree mid-career;
 *        "software vs. shelfware" worldview) — adoption discipline, daily-
 *        use rate, physical operating model over UI, cognitive load saved
 *        per shift
 */

import type { AccountMicrositeData } from '../schema';

export const westrockCoffee: AccountMicrositeData = {
  slug: 'westrock-coffee',
  accountName: 'Westrock Coffee',
  coverHeadline: 'The network layer above Conway roast-to-RTD',
  titleEmphasis: 'Conway roast-to-RTD',
  coverFootprint: 'Concord + Conway + Little Rock',
  parentBrand: 'Westrock Coffee Company',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 84,

  pageTitle: 'YardFlow for Westrock Coffee - The Network-Tier Layer Above the Concord Yard Operating Model',
  metaDescription:
    'How a network-tier yard operating model lands on top of the site-level yard system that already runs at the Concord NC operation — extending the published "software not shelfware" adoption win across the Conway AR roast-to-RTD + single-serve + DC nodes and the Little Rock corporate footprint as the campus ramps toward the 2026 EBITDA guidance.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Westrock Coffee network',
      composition: [
        { label: 'Concord NC operation (legacy S&D)', value: 'Three-node footprint per public reporting — main facility + remote yard ~2 miles away + additional roasting plant ~8 miles away; broader characterization as "five county-spread locations" including spoke storage. Yard grew from 120–130 trailers to ~400 trailers under the existing site-level yard deployment. The operating system at Concord is the running record of how site-level yard discipline can absorb ~3× trailer growth without breaking' },
        { label: 'Concord scoreboard', value: 'The numbers on the public record from the Concord operation: trailer count 120–130 → ~400 (~3× growth absorbed without scaling phone coordination); 3–4 phone calls per trailer move → 0; green-coffee staging from miles away → ~100 yards from the roaster; acceptance-to-roasting cycle ~45–50 min → ~15 min (~70% reduction). The scoreboard the site-level deployment posted, on record, in the operator\'s own words — and the credit is at the site' },
        { label: 'Conway AR campus (2023–2025 greenfield)', value: 'Roast-to-RTD facility ($315M+, ~570,000 sq ft, opened June 2024 ahead of schedule — largest roast-to-RTD facility in NA); Conway DC ($70M, 530,000 sq ft, 72 dock doors, 36-ft clear height, ESFR, ~30-acre site, opened December 2023, ~2.2 miles from manufacturing); single-serve "Clark" facility (525,000 sq ft, K-cup format, opened July 2025, capable of millions of single-serve cups daily). Stated full-capacity employment ~900 across the campus' },
        { label: 'Conway roast-to-RTD seam', value: 'The cross-facility seam inside the Conway campus is where the operating-leverage math actually compounds: green-coffee inbound arrives at the DC (72 dock doors, ~2.2 miles from manufacturing), shuttles to the roast-to-RTD facility (~570K sq ft, largest roast-to-RTD in NA) for roasting and RTD canning, with single-serve "Clark" K-cup outbound (525K sq ft) and DC outbound running on competing cadences. Four product cadences (green-coffee inbound + RTD outbound + K-cup outbound + extract concentrate) and a fifth in commercialization (first high-protein beverage, Q4 2025) sharing one campus dock surface across three buildings ~2.2 miles apart' },
        { label: 'Little Rock / North Little Rock AR', value: 'Original HQ and manufacturing footprint — the corporate seat and the original Westrock Coffee operating geography that pre-dates the Conway ramp and the S&D Concord acquisition' },
        { label: 'Existing yard-tech layer', value: 'Site-level yard system at the Concord NC operation has been in production through the trailer-count tripling; documented wins include phone-coordination replacement, proximity-based driver-workflow, ~70% acceptance-to-roasting cycle-time reduction (~45–50 min → ~15 min) after staging redesign. The network-tier operating model coordinating Concord NC + Conway AR + Little Rock AR as the campus ramps is unsolved — a 2019-era site configuration running across a 2026-scale multi-state multi-cadence network' },
        { label: 'Operating-leverage year', value: '2026 Adjusted EBITDA guidance $90M–$100M (29–44% YoY growth) — CEO Scott Ford described the moment as moving "from construction mode into regular daily operations." First high-protein beverage in commercialization for a leading CPG brand disclosed Q4 2025. Coffee sourcing ~150M lbs green coffee/year + ~25M lbs tea/year across 35 origin countries' },
        { label: 'Product cadence mix', value: 'Roasted whole bean and ground coffee (retail) + K-cup single-serve pods + extract concentrate + ready-to-drink canned/bottled coffee and tea + energy beverages + first high-protein beverage in commercialization. Foodservice + retail + private-label channels run with distinctly different cadence and appointment patterns; single-serve and RTD lines at Conway introduce a fourth cadence' },
      ],
      hypothesis:
        'The interesting thing about the Westrock Coffee yard math is what site-level success has not yet done. The site-level yard system at the Concord NC operation worked. It absorbed the trailer-count growth from 120–130 to ~400 across the five county-spread locations; it replaced phone-based move coordination with shared visibility; it took the green-coffee trailer staging from miles away to ~100 yards from the roaster and dropped acceptance-to-roasting from ~45–50 minutes to ~15 minutes. The "software not shelfware" adoption discipline that produced those wins is the worldview of the operator who runs Concord — and at the site level, that part of the conversation is closed.\n\nWhat is unsolved is the layer that did not exist when the Concord deployment was specified. The Conway AR campus is fully operational as of 2026 — roast-to-RTD opened June 2024, the DC opened December 2023, single-serve "Clark" opened July 2025 — standing up a second major operating geography on a yard surface separate from the Concord operating model. Little Rock AR is the third operating geography. The 2026 EBITDA guidance ($90M–$100M, 29–44% YoY growth) is the operating-leverage year, and operating leverage in a network this shape runs through the yard, where green-coffee inbound, RTD canning outbound, single-serve K-cup packaging, extract concentrate, and the first high-protein beverage in commercialization compete for trailer movements across three states, three buildings ~2.2 miles apart at Conway, and four-going-on-five product cadences.\n\nThe site-level system at Concord can identify where a trailer is at Concord. It cannot orchestrate which trailer should leave Conway DC next against the roast-to-RTD facility\'s green-coffee demand, sequence Clark K-cup outbound against the same campus dock surface, or coordinate cross-state inventory positioning as Conway ramps. That gap is the modernization wedge — and the operator who put "software not shelfware" on the public record at Concord is exactly the operator who recognizes the gap between a 2019-era site configuration and a 2026-scale multi-state, multi-cadence network operating model.',
      pullQuote: 'At the site level, that part of the conversation is closed.',
      caveat:
        'This is built from Westrock Coffee public disclosures, the Inbound Logistics yard-management feature documenting the Concord operation, the Conway campus opening announcements, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: how the Conway-side yard SOPs are coordinating today against the Concord operating model, where the cross-campus green-coffee + RTD + single-serve cadence interleaving is biting hardest in the operating-leverage ramp, and whether the existing site-level yard configuration at Concord has been extended to Conway or remains Concord-only.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the network',
      artifact: {
        imageSrc: '/artifacts/westrock-coffee-coverage-map.svg',
        imageAlt: 'Network coverage map for Westrock Coffee. Six tiles representing the operating footprint across three states: Concord NC (legacy S&D, ~400 trailers), Conway DC (530K sq ft, 72 doors), Conway roast-to-RTD (~570K sq ft, June 2024), Clark K-Cup (525K sq ft, July 2025), and Little Rock (HQ + original manufacturing) are covered at the site level. The Yard Network Ops tile above the three states is unfilled, marked with a Westrock Coffee accent hairline outline.',
        caption: 'Network coverage map · Concord + Conway + Little Rock · 1 tile unfilled.',
        source: 'Composition modeled from Westrock Coffee public disclosures, the Inbound Logistics yard-management feature (January 2026), and the Conway campus opening announcements. The unfilled tile is the network-tier operating model above the site-level layer.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization, and they have layered a network-tier operating model on top of their existing site-level yard systems. The Westrock Coffee operating profile is shape-similar — multi-site, multi-cadence (roasted coffee + single-serve K-cup + RTD + extract concentrate + the first high-protein beverage in commercialization), multi-state, with mature site-level yard discipline already in place at the Concord operation — but at coffee-and-tea freight economics rather than bottled water. If a network operating model can run on water — the hardest CPG freight in the country — the read-across to a multi-state, multi-cadence Westrock Coffee network running on operating-leverage math is the easier lift. Primo runs the operating layer Conway roast-to-RTD is shaped to host — same coordinates, harder freight.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The cleanest first pilot at Westrock Coffee is the Conway AR campus — three major facilities (roast-to-RTD, DC, single-serve) standing up simultaneously is the cross-cadence yard problem the network-tier layer most directly addresses, and the operating-leverage ramp is the timing driver. The follow-on is extending into the Concord NC operation, where the existing site-level system continues to run as the records layer and the network-tier layer above coordinates across-state with Conway. Little Rock AR is the third leg.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'westrock-coffee-public-network',
          source: 'Westrock Coffee Company public disclosures + investor relations',
          confidence: 'public',
          detail: 'Anchors the Little Rock AR HQ + Conway AR campus + Concord NC legacy S&D operation footprint. CEO Scott Ford co-founded the company in 2009; NASDAQ: WEST. Sourcing ~150M lbs green coffee + ~25M lbs tea annually from 35 origin countries; offices in 10 countries. 2026 Adjusted EBITDA guidance $90M–$100M (29–44% YoY growth).',
          url: 'https://www.westrockcoffee.com/',
        },
        {
          id: 'westrock-coffee-yard-feature',
          source: 'Inbound Logistics, "Yard Management: Grounds for Improvement" (January 2026, pp. 179–181)',
          confidence: 'public',
          detail: 'Documents the site-level yard system in production at the Concord NC operation. Cited results: yard grew from 120–130 trailers to ~400 across the three-site Concord footprint; phone-based coordination replaced with shared move-request queue; proximity-based driver workflow; green-coffee staging redesign cut acceptance-to-roasting cycle from ~45–50 min to ~15 min (~70%). J.T. Hinson on the record: "If it\'s used properly, with supervisors and managers holding teams accountable, you\'ll actually have software, not shelfware."',
        },
        {
          id: 'westrock-conway-campus',
          source: 'Westrock Coffee Conway AR campus disclosures',
          confidence: 'public',
          detail: 'Three major facilities: Conway DC ($70M, 530,000 sq ft, 72 dock doors, 36-ft clear height, ESFR sprinklers, ~30-acre site, opened late December 2023, ~2.2 miles from manufacturing); roast-to-RTD facility ($315M+, ~570,000 sq ft, opened June 2024 ahead of schedule, largest roast-to-RTD facility in NA); single-serve "Clark" facility (525,000 sq ft, K-cup format, opened July 2025, capable of millions of single-serve cups daily). Stated full-capacity employment ~900 across the campus.',
        },
        {
          id: 'westrock-2026-guidance',
          source: 'Westrock Coffee 2026 investor guidance',
          confidence: 'public',
          detail: 'Adjusted EBITDA guidance $90M–$100M for 2026 (29–44% YoY growth) — operating-leverage year. CEO Scott Ford framing: transition from "construction mode into regular daily operations." First high-protein beverage in commercialization for a leading CPG brand disclosed Q4 2025.',
        },
        {
          id: 'hinson-career-record',
          source: 'J.T. Hinson public career record + LinkedIn',
          confidence: 'public',
          detail: 'Distribution Operations Technology Supervisor (2019–2020) → Logistics Manager (2020–2022) → Director of Freight Logistics (2022–present) inside the S&D / Westrock Coffee organization — full career arc inside the Concord NC operation, promoted on the back of the implementation that posted the published scoreboard. Currently completing UNCG Bryan School of Business & Economics, Supply Chain Management & Information Systems (minor: Economics; 2019–2026 cohort). Industry-conference attendance footprint (Food Shippers of America; major spring materials-handling show).',
          url: 'https://www.linkedin.com/in/j-t-hinson-5a3622133',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges in multi-site beverage manufacturing operating contexts. These describe the conditions most coffee-and-tea processing networks operate under, not Westrock Coffee specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'How the Conway-side yard SOPs are coordinating today against the Concord NC operating model — whether the existing site-level system has been extended to Conway or whether Conway runs on a separate standard',
        'Where the cross-campus green-coffee + RTD + single-serve cadence interleaving is biting hardest as the Conway campus ramps toward the 2026 EBITDA guidance',
        'How the first high-protein beverage in commercialization (disclosed Q4 2025) is being scheduled against the existing roast-to-RTD + single-serve + extract production cadences',
        'How the Conway DC (72 dock doors, ~2.2 miles from manufacturing) currently handles inbound packaging waves against outbound finished-goods cadence',
        'Whether the staffing transition (Matt Smith remains EVP Global Supply Chain & Sustainability; Will Ford status as Chief Operating Officer / Group President of Operations unverified after his late-2025 LinkedIn signal) has shifted the operating-model sponsorship inside the company',
        'How the foodservice + retail + private-label channel cadences are being arbitrated at the campus dock surface — whether channel-specific dock-prioritization is currently surfaced into the operating system or resolved at the dock',
        'Whether the Concord-to-Conway green-coffee positioning is currently planned at the network layer or arbitrated load-by-load — i.e., whether the operator standing at the Conway roast-to-RTD dock can see the Concord inbound queue against Conway\'s roast demand window',
        'How the published "software not shelfware" adoption discipline that produced the Concord scoreboard is being instrumented at Conway — whether daily-use-rate measurement carried across to the new geography or stayed with the operating model that built it',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Westrock Coffee is distinctive in this round because the case for site-level yard discipline at the Concord NC operation is not in dispute and should not be relitigated; it was won across the trailer-count tripling from 120–130 to ~400, the "software not shelfware" worldview is documented on the public record, and the operator who carried that work from Distribution Operations Technology Supervisor through Logistics Manager into the Director of Freight Logistics seat is the same operator reading this brief. The unsolved problem is the network-tier operating model coordinating Concord NC + Conway AR + Little Rock AR as the Conway campus ramps toward the 2026 EBITDA guidance, with green coffee + RTD + single-serve + the first high-protein beverage in commercialization running on four-going-on-five different cadences across the campus dock surface. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and the read-across to a multi-state, multi-cadence Westrock Coffee network running on operating-leverage math is the easier lift.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'J.T. — the part most worth pushing back on is whether the operating-model discipline you carried from Distribution Operations Technology Supervisor through Logistics Manager into the Director seat — the same discipline the UNCG Bryan School SCIS coursework names by its right name and the Concord scoreboard receipts — has reached the network layer above the Conway campus yet, or whether it stopped at the site where it was built. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'westrock-coffee-001',
      name: 'J.T. Hinson',
      firstName: 'J.T.',
      lastName: 'Hinson',
      title: 'Director, Freight Logistics',
      company: 'Westrock Coffee',
      email: 'jt.hinson@westrockcoffee.com',
      linkedinUrl: 'https://www.linkedin.com/in/j-t-hinson-5a3622133',
      roleInDeal: 'decision-maker',
      seniority: 'Director',
      function: 'Logistics / Supply',
      currentMandate:
        'Director of Freight Logistics at Westrock Coffee since 2022. Career trajectory entirely inside the S&D / Westrock Coffee organization: Distribution Operations Technology Supervisor (2019–2020) → Logistics Manager (2020–2022) → Director (2022–present). Champion of the existing yard system implementation at the Concord NC operation that absorbed ~3× trailer-count growth. Currently completing UNCG Bryan School of Business & Economics SCIS degree mid-career — reads the textbook and runs the yard. Public worldview: "software not shelfware" — adoption discipline measured by daily-use rate, not go-live milestones.',
      bestIntroPath:
        'Direct outreach to the Director of Freight Logistics seat with peer-tone, adoption-first framing — NOT influencer-tone. Concord NC is the home turf; Conway AR is the operating-leverage growth surface. If Hinson delegates, the right escalations are Matt Smith (EVP Global Supply Chain & Sustainability — upstream-network and sustainability scope, useful as a senior reference) or C.J. Thompson (Logistics Manager / Transportation Manager, Little Rock AR — Arkansas peer or upstream counterpart). Will Ford (Chief Operating Officer / Group President of Operations) status is unverified after his late-2025 LinkedIn signal — do not lead outreach with his name.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'westrock-coffee-001',
        name: 'J.T. Hinson',
        firstName: 'J.T.',
        lastName: 'Hinson',
        title: 'Director, Freight Logistics',
        company: 'Westrock Coffee',
        email: 'jt.hinson@westrockcoffee.com',
        roleInDeal: 'decision-maker',
        seniority: 'Director',
        function: 'Logistics / Supply',
      },
      fallbackLane: 'logistics',
      label: 'J.T. Hinson - Director, Freight Logistics',
      variantSlug: 'j-t-hinson',

      framingNarrative:
        'J.T., "software not shelfware" is your line, on the public record, and it is the worldview of an operator who has watched tools die from neglect and measures vendors by daily-use rate, not feature lists. The site-level system at Concord NC absorbed the ~3× trailer-count growth from 120–130 to ~400 because the operating model wrapped around the software — phone coordination went to zero, the green-coffee staging redesign cut acceptance-to-roasting from ~45–50 min to ~15 min, the proximity-based move workflow stuck because the discipline was there. That is the scoreboard, in your words, and the credit is at Concord. The unsolved layer is the one Conway AR built underneath while Concord was working: a second operating geography with three buildings ~2.2 miles apart running on four-going-on-five cadences, and a network-tier operating model above three states (Concord + Conway + Little Rock) that does not yet exist because it could not have existed when the Concord system was specified in 2019. The cross-cadence yard problem at Conway is different in kind from the Concord cadence the existing site configuration was sized for — and the same "software not shelfware" discipline that built the Concord scoreboard is what the network layer has to be built on, or the network layer becomes shelfware too.',
      openingHook:
        '"Software not shelfware" is your line. The Concord scoreboard — 120–130 → ~400 trailers, ~45–50 min → ~15 min acceptance-to-roasting, phone coordination → 0 — is what that discipline produced at the site level, and the credit is yours. The layer that did not exist when Concord was specified is the network-tier operating model above Concord + Conway + Little Rock as the campus ramps into 2026. The risk in not building it on the same adoption discipline is that the layer above the sites turns into the exact thing your line names.',
      stakeStatement:
        'CEO Scott Ford described the moment publicly as moving "from construction mode into regular daily operations." 2026 EBITDA guidance $90M–$100M (29–44% YoY growth) is the operating-leverage year — and operating leverage in a network this shape runs through the yard, where the Conway DC (72 dock doors, ~2.2 miles from manufacturing), the roast-to-RTD facility (~570K sq ft), and the Clark K-Cup facility (525K sq ft) interleave green-coffee inbound, RTD outbound, and single-serve outbound on different cadences across one campus dock surface. The existing site-level system at Concord is the records layer; the network-tier operating model above three states is the lever the EBITDA ramp actually runs through.',

      heroOverride: {
        headline: '"Software not shelfware" — applied above the sites.',
        subheadline:
          'The Concord scoreboard is on record: 120–130 → ~400 trailers, acceptance-to-roasting ~45–50 min → ~15 min, phone coordination → 0. The unsolved layer is the network-tier operating model coordinating Concord + Conway + Little Rock as the campus ramps into the 2026 operating-leverage year, with green-coffee inbound + RTD outbound + K-cup outbound + the first high-protein beverage in commercialization sharing one campus dock surface across three buildings ~2.2 miles apart.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Tech-ops hybrid register, adoption-first. Hinson reads daily-use-rate language faster than go-live-milestone language; he measures vendors by the operating-model wrap around the software, not by the screens. Acknowledge the existing site-level yard system as the work that produced the published wins — the credit is his. Position the wedge as the layer above (network-tier operating model across Concord + Conway + Little Rock), not as replacement. Reference the physical-redesign-over-UI bias explicitly — the most-cited Inbound Logistics win is moving the green-coffee staging area, not a screen. Peer-tone, not influencer-tone. Specific by site name (Concord NC, Conway AR, Little Rock AR), specific by facility (roast-to-RTD facility, "Clark" single-serve facility, Conway DC at 72 dock doors).',
      kpiLanguage: [
        'network-tier operating model',
        'adoption discipline / daily-use rate',
        '"software not shelfware"',
        'cross-campus green-coffee + RTD + single-serve cadence interleaving',
        'campus dock-surface arbitration (Conway 72 dock doors)',
        'operating-leverage attribution to the 2026 EBITDA ramp',
        'multi-state operating-model coordination (Concord + Conway + Little Rock)',
        'first high-protein beverage scheduling against existing cadences',
        'cognitive load saved per shift',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same multi-site, multi-cadence shape, harder freight (water), already running the network-tier layer above existing site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic — same multi-state, multi-cadence beverage-adjacent operating model with documented network-tier-above-site-system deployment.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Concord NC legacy S&D operation (three-node footprint: main facility + remote yard ~2 miles away + additional roasting plant ~8 miles away; broader characterization "five county-spread locations") + Conway AR campus (DC 530,000 sq ft + roast-to-RTD ~570,000 sq ft + single-serve "Clark" 525,000 sq ft) + Little Rock / North Little Rock AR (original HQ + manufacturing) + Malaysia + Rwanda + offices in 10 countries',
    facilityTypes: ['Coffee Roasting Plants', 'Ready-to-Drink Manufacturing (Conway roast-to-RTD facility)', 'Single-Serve K-Cup Manufacturing (Conway "Clark" facility)', 'Distribution Centers (Conway DC, 72 dock doors)', 'Coffee Extract / Instant Manufacturing (Malaysia)'],
    geographicSpread: 'North America / Global (HQ: Little Rock AR; major ops: Concord NC, Conway AR; Malaysia for extract/instant Asia-Pacific channel; East Africa coffee origin via Rwanda Trading Company)',
    dailyTrailerMoves: '~400 trailers across the Concord NC yard network (up from 120–130 under the existing site-level deployment); Conway DC runs 72 dock doors; Conway roast-to-RTD operating at full ramp; "Clark" single-serve facility live since July 2025',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL', 'Cross-Campus Green-Coffee Inbound (Conway)', 'RTD Finished Goods Outbound', 'K-Cup Single-Serve Outbound'],
    avgLoadsPerDay: 'High-volume — sourcing ~150M lbs green coffee + ~25M lbs tea annually from 35 origin countries; Conway campus in full operational ramp as of 2026; first high-protein beverage in commercialization for a leading CPG brand (disclosed Q4 2025)',
    specialRequirements: [
      'Multi-cadence campus dock surface (green coffee inbound + RTD outbound + single-serve outbound + extract concentrate + high-protein beverage)',
      'Cross-state operating-model coordination (Concord NC + Conway AR + Little Rock AR)',
      'Foodservice + retail + private-label channels run with distinctly different cadence and appointment patterns',
      'Three-node Concord footprint (main + remote yard 2 miles + roasting plant 8 miles)',
    ],
  },

  signals: {
    recentNews: [
      'Conway AR campus fully operational as of 2026 — CEO Scott Ford described the transition publicly as moving "from construction mode into regular daily operations."',
      'Adjusted EBITDA guidance $90M–$100M for 2026 (29–44% YoY growth) — the operating-leverage year.',
      '$70M Conway DC (530,000 sq ft, 72 dock doors, 36-ft clear height, ESFR, ~30-acre site) opened December 2023; roast-to-RTD facility ($315M+, ~570,000 sq ft) opened June 2024 ahead of schedule; single-serve "Clark" facility (525,000 sq ft) opened July 2025.',
      'First high-protein beverage in commercialization for a leading CPG brand disclosed Q4 2025 — fifth product cadence on the Conway campus dock surface.',
      'Site-level yard system at the Concord NC operation absorbed trailer-count tripling from 120–130 to ~400 with documented wins (phone coordination → 0, ~70% green-coffee acceptance-to-roasting cycle reduction).',
      'J.T. Hinson on record in Inbound Logistics (January 2026): "If it\'s used properly, with supervisors and managers holding teams accountable, you\'ll actually have software, not shelfware." The adoption-first worldview defining the operating sponsor.',
    ],
    urgencyDriver:
      'The Conway AR campus is fully operational as of 2026 — three major facilities (DC, roast-to-RTD, single-serve "Clark") standing up in two years, plus a first high-protein beverage in commercialization disclosed Q4 2025. The site-level yard system at the Concord NC operation has done what it was bought to do (~3× trailer growth absorbed, phone coordination replaced, green-coffee staging redesign), and the existing operating model is the proven foundation. The unsolved layer is the network-tier coordination across Concord NC + Conway AR + Little Rock AR as the campus ramps into the 2026 EBITDA guidance, with multi-cadence dock-surface arbitration becoming the operating lever the EBITDA number runs through.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Conway campus', body: 'Roast-to-RTD 570K sq ft · DC 530K sq ft · single-serve "Clark" 525K sq ft · 2023–2025.' },
    { mark: 'Operating-leverage year', body: '2026 Adjusted EBITDA $90M–$100M · 29–44% YoY · "construction mode to daily operations."' },
    { mark: 'Concord scoreboard', body: '120–130 → ~400 trailers · acceptance-to-roasting ~45–50 min → ~15 min.' },
    { mark: 'Hinson on the record', body: '"You\'ll actually have software, not shelfware." Site-level discipline is the foundation. The layer above three states is unsolved.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for J.T. Hinson. The site-level yard discipline you put on the record at Concord — "software not shelfware," ~3× trailer growth absorbed, ~70% acceptance-to-roasting cycle reduction — is the foundation the next five minutes builds on. What follows is the layer above three states the Conway ramp now needs.',
    chapters: [
      { id: 'thesis', label: 'I. The Concord scoreboard is on record', start: 0 },
      { id: 'what-conway-built', label: 'II. What Conway built underneath', start: 65 },
      { id: 'roast-to-rtd-seam', label: 'III. The roast-to-RTD seam', start: 130 },
      { id: 'network-not-site', label: 'IV. Why the next layer is above the sites', start: 195 },
      { id: 'software-not-shelfware', label: 'V. What the next adoption discipline earns', start: 260 },
    ],
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#6B3A2A',
  },
};
