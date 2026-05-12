/**
 * Georgia-Pacific — ABM Microsite Data
 * Quality Tier: Tier 2 Band B (Phase 9 A+ uplift)
 * Pitch shape: three-segment multi-customer-flow yard-ops wedge above the
 * Market-Based Management five-dimensions operating scaffold. Same mill
 * ships rolls of Quilted Northern toward retail-DC appointments, pallets of
 * OSB toward contractor walk-in, and fluff pulp toward industrial converters
 * with port cutoff windowing — three customer types, three appointment
 * regimes, three dock-arbitration rules. Five of the five dimensions of MBM
 * (Vision · Virtue & Talents · Knowledge Processes · Decision Rights ·
 * Incentives) already run inside the building. The yard is the one
 * operating surface where the discipline has not yet been pushed into a
 * measurable network standard. Leadership-transition timing reinforces the
 * shape: Christian Fischer retired Oct 2025 after 35 years; Mark Luetters
 * (Koch EVP, nine years running G-P building products) interim; permanent
 * CEO named within 2026. The yard-layer operating standard is the kind a
 * permanent CEO ratifies on entry. Framed observationally — G-P is
 * privately held inside Koch, so public material is thinner than for a
 * public-co peer.
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS, AUDIO_BRIEF_SRC } from '../audio-brief';

export const georgiaPacific: AccountMicrositeData = {
  slug: 'georgia-pacific',
  accountName: 'Georgia-Pacific',
  coverHeadline: 'The yard layer above Market-Based Management',
  titleEmphasis: 'above Market-Based Management',
  coverFootprint: '~150 sites · dual-flow under Koch MBM',
  parentBrand: 'Georgia-Pacific (Koch Industries)',
  vertical: 'building-materials',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: 'Georgia-Pacific · The yard layer when one mill ships to retail and to contractors at the same time',
  metaDescription:
    'Georgia-Pacific runs ~150 facilities across consumer tissue (Quilted Northern, Angel Soft, Brawny), building products (plywood, OSB, gypsum), and Cellulose specialty fibers under Koch ownership. At the dual-flow sites, the yard arbitrates between two customer types with different appointment cadences and carrier mixes — and the operating layer above that arbitration is the unsolved seam in an otherwise MBM-measured operating company.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Georgia-Pacific facility network',
      composition: [
        { label: 'US facility footprint', value: '~150 mills, plants, converting sites, and distribution centers across the US; ~30,000 employees. HQ Atlanta GA. Wholly-owned subsidiary of Koch Industries since the 2005 acquisition ($21B at the time).' },
        { label: 'Three-segment outbound structure', value: 'Consumer products — Quilted Northern, Angel Soft, Brawny, Sparkle, Vanity Fair, Dixie tableware — shipped toward retail DCs and foodservice distributors on tight appointment-window cadence. Building products — plywood, OSB, lumber, gypsum (DensGlass, DensDeck), Plytanium, Wood I Beam — shipped toward contractor channels and building-products distributors on a walk-in / distributor-appointment mix. GP Cellulose — the third segment, often understated — runs bleached pulp and specialty fibers (fluff, dissolving, viscose-grade) toward industrial converters and tissue / nonwoven / textile producers on industrial-buyer cadence with port and steamship-line windowing layered in. Three customer types, three appointment regimes, one operating company.' },
        { label: 'GP Cellulose footprint', value: 'Four pulp mills — Brunswick GA (softwood kraft + fluff), Crossett AR (tissue + retained pulp), Leaf River MS (southern bleached softwood kraft), Port Hudson LA (specialty fluff and viscose-grade). Outbound runs domestic rail + truck and export through Gulf and South-Atlantic ports. The cadence is industrial — converter purchase orders against multi-week lead times — and at the gate it reads differently from either retail-DC appointment freight or contractor walk-in freight on the same yard.' },
        { label: 'Anchor mill examples', value: 'Brewton AL (paper/bleached board); Naheola AL (paper); Crossett AR (tissue operations retained after the 2019 bleached-board shutdown — ~500 retained jobs); Palatka FL (paper; $83M expansion + 400,000 sq ft warehouse breaking ground February 2026); Green Bay WI (tissue/towel capacity additions). Plywood/OSB and gypsum sites are distributed across the South and West.' },
        { label: 'Recent capex and M&A', value: 'Anchor Packaging acquisition closed October 2025 (Northeast Arkansas; sustainable food packaging). ~$550M sustainable-packaging capacity build completed 2025. Palatka $83M expansion plus warehouse breaks ground Feb 2026. The capex cadence inside Koch is described publicly as $7–12B/yr across the portfolio for acquisitions and facility upgrades through 2027.' },
        { label: 'Digital and AI posture', value: 'Point A supply-chain innovation center opened in Atlanta (2018). Public partnerships with SAS on AWS — more than 15,000 production ML models in service of plant operating settings. Computer-vision QA on inbound wood and fiber. Driver-facing mobile app for purchase-order entry and load weighing. GenAI piloted for manufacturing decision-support.' },
        { label: 'MBM operating context — five dimensions', value: 'Market-Based Management is Koch\'s codified operating philosophy and the most operationally measured framework in American industry. Five dimensions: Vision (the value-creation thesis pushed to every business unit), Virtue & Talents (hiring and developing principled entrepreneurs at every level), Knowledge Processes (turning data into actionable insight — the philosophical home of 15,000+ production ML models), Decision Rights (pushing authority to the people closest to the work and the information), and Incentives (compensation aligned to value created, not effort expended). MBM is set up to surface variance at the operating layer; the layer above the dock that would make that variance measurable across dual-flow + Cellulose sites is the seam.' },
        { label: 'Dual-flow under MBM', value: 'Inside an MBM operating company, the unit closest to the work owns the decision. At a single-flow plant that decentralization works cleanly. At a dual-flow site that loads consumer-products outbound on retail-DC appointment cadence and building-products outbound on contractor walk-in cadence through the same gate fleet, the question is which unit owns the dock-arbitration decision — and what the network operating standard above it should look like when Knowledge Processes already touches every plant setting. The gate is the one operating surface where MBM\'s decision-rights structure has not yet been pushed into a measurable standard.' },
        { label: 'Leadership transition', value: 'Christian Fischer retired October 2025 after 35 years at G-P / Koch. Mark Luetters — Koch EVP, nine years running G-P building products, the operating leader who knows the contractor-and-distributor side of the dual flow — named interim president and CEO. Permanent CEO is to be named within 2026. A new operating leader ratifies operating standards rather than inheriting them; the yard layer is the kind of standard a permanent CEO gets to author on entry.' },
      ],
      hypothesis:
        'The analytically distinctive thing about Georgia-Pacific is not the dual flow on its own — it is that the dual flow runs inside an MBM operating company that has already pushed Knowledge Processes and Decision Rights deeper into the plant than almost any peer. Most CPG networks ship one customer type; most building-products networks ship one customer type; G-P ships three. Consumer tissue and tableware run toward retail DCs on tight appointment cadence. Building products run toward contractor walk-in and distributor pickup on a looser appointment regime. GP Cellulose runs bleached pulp and specialty fibers toward industrial converters on multi-week-lead-time cadence with port and steamship-line cutoff timing layered in. The driver mobile app for inbound weighing sits at the gate. What it does not, on its own, decide is which dock door the driver belongs to when the same mill is loading rolls of Quilted Northern toward a Walmart DC appointment window, pallets of OSB toward a regional distributor that runs walk-in, and a containerload of fluff pulp against an export cutoff that does not share a calendar with either. The mill-to-converting-to-DC chain compounds the problem — every inter-node trailer move is a yard event at both ends, and the multi-cadence gate problem repeats at three site types.\n\nThat structural complexity has been there as long as G-P has run consumer paper, building products, and Cellulose under the same roof; what is new is the throughput pressure. The ~$550M sustainable-packaging capacity build closed in 2025; the Anchor Packaging acquisition closed in October 2025; the Palatka FL paper-mill expansion plus a 400,000 sq ft warehouse breaks ground February 2026. Throughput is climbing at the plants where capex is landing first, and throughput-out-the-door becomes trailer-into-the-yard. Inside an MBM operating company, the unit closest to the work owns the decision — which works cleanly at a single-flow plant and gets harder to express as a network standard at a dual-flow site with a third Cellulose-side cadence stacked on top.\n\nThe third pressure is the MBM operating context itself, and it is the one that gives this analysis its shape. The five dimensions of Market-Based Management — Vision, Virtue & Talents, Knowledge Processes, Decision Rights, Incentives — already touch every operating surface inside the building. Knowledge Processes is the philosophical home of fifteen thousand production ML models tuning plant settings; Decision Rights is the framework that pushed metric ownership deep into the plant a generation ago. Five of the five dimensions have landed inside the four walls. The one operating surface where the five-dimensions discipline has not yet been pushed into a measurable network standard is the yard — the gate-to-dock layer that arbitrates between three customer-type cadences inside the same dock fleet. MBM is set up to see the variance; the layer above the gate that would make it deterministic across the network has not been built yet. The leadership transition reinforces the timing: Christian Fischer retired October 2025 after 35 years; Mark Luetters (Koch EVP, nine years running G-P building products, the operating leader who knows the contractor-and-distributor half of the dual flow) is interim; a permanent CEO is to be named within 2026. The yard layer is the kind of operating standard a permanent CEO gets to ratify on entry rather than inherit mid-cycle.',
      pullQuote:
        'MBM is set up to see the variance. The yard layer above the gate is the one operating surface where it has not yet landed.',
      caveat:
        'Georgia-Pacific is privately held inside Koch Industries, which means the public-record material is meaningfully thinner than for a public-company peer of the same size. The facility count (~150), the brand footprint, the recent capex projects (Palatka, Green Bay, the sustainable-packaging build, the Anchor Packaging acquisition), and the AI/digital posture are all publicly disclosed; the internal yard operating standard, the dock-arbitration policy at any specific dual-flow site, the status of any Koch Engineered Solutions internal-logistics review of the yard layer, and the post-2019 network shape after the Crossett partial decommissioning are not. We may be wrong about parts of the picture above — the most useful thing to push back on is which dual-flow sites in the network actually handle both customer types in the same yard today, whether the gate-side digital posture (the driver app, the inbound CV QA) already feeds an operating layer above the sites that we cannot see, and how the Palatka warehouse breaking ground in February 2026 is changing the operating model on that mill\'s yard.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the five dimensions',
      artifact: {
        imageSrc: '/artifacts/georgia-pacific-coverage-map.svg',
        imageAlt: 'Market-Based Management coverage map. Six tiles representing the five MBM dimensions plus the operating surface above the dual-flow yard. Vision, Virtue & Talents, Knowledge Processes, Decision Rights, and Incentives are covered. The Yard Network Ops tile is unfilled, marked with a Georgia-Pacific amber hairline outline.',
        caption: 'MBM five-dimensions coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Koch Industries Market-Based Management literature, Georgia-Pacific digital-supply-chain disclosures (Point A, SAS/AWS, 15,000+ ML models), and the dual-flow + Cellulose three-segment structure. Site-level yard vendors redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point that can\'t be recovered with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be — and they run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, with a network-level yard operating model layered on top of their existing site-level systems. The shape similarities to Georgia-Pacific are real where they exist: multi-site network, heavy freight (rolls of tissue and pallets of OSB both push weight envelopes hard, the way a water trailer does), category-leading volume, and the same fundamental question of how a network agrees with itself on what good looks like at the yard layer. Where Primo is single-customer-type, Georgia-Pacific is the multi-customer-type case — same mill, consumer-bound retail freight, contractor-bound building-products freight, and industrial-bound Cellulose freight, three appointment regimes, three carrier mixes, three dock-arbitration rules. The operating-model read-across covers what happens inside a yard for any one flow; the arbitration-between-flows layer is Georgia-Pacific-specific and not modeled by the Primo comparable. The freight transfers; the multi-customer wrinkle is its own design conversation — and the right place to read the translation is back through MBM\'s five dimensions: Primo is the public proof that a network operating layer slots cleanly above mature site-level systems without contesting Decision Rights at the unit doing the work, which is exactly the entry condition a yard-layer standard at Georgia-Pacific needs to meet to ratify into the MBM map rather than relitigate it.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '-50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot candidates at Georgia-Pacific are different in kind: (1) a tissue mill on the consumer-flow side — Brewton, Green Bay, or the Palatka complex once the new warehouse is online — where appointment-window discipline against a retailer DC schedule is the dominant variance driver; (2) a major plywood/OSB plant on the building-products side where contractor-bound walk-in carriers and distributor-bound appointment carriers compete for the same dock doors. The most analytically interesting pilot would be a site that runs both — if such a site exists in the network at material scale — because the dual-flow dock arbitration is where the operating layer above the yard pays back fastest. We would expect the network to make sense of itself within two to four quarters of either pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'gp-public-footprint',
          source: 'Georgia-Pacific public network and brand disclosures',
          confidence: 'public',
          detail: 'Anchors the ~150 facility figure, the ~30,000 employee base, the Atlanta HQ, the consumer brand portfolio (Quilted Northern, Angel Soft, Brawny, Sparkle, Vanity Fair, Dixie), and the building-products brand portfolio (DensGlass, DensDeck, Plytanium, Wood I Beam, Ply-Bead, etc.).',
          url: 'https://www.gp.com/',
        },
        {
          id: 'gp-koch-acquisition',
          source: 'Koch Industries acquisition of Georgia-Pacific (Nov 2005)',
          confidence: 'public',
          detail: 'Closed for ~$21B; took G-P private. Established the Koch Industries operating context — Market-Based Management, the internal-engineering and internal-logistics consulting structure — that the yard layer sits under.',
          url: 'https://www.sec.gov/Archives/edgar/data/41077/000119312505225697/dex991.htm',
        },
        {
          id: 'gp-crossett-2019',
          source: 'Crossett AR partial decommissioning (2019)',
          confidence: 'public',
          detail: 'Permanent shutdown of bleached-board operations, the extrusion plant, the woodyard, the pulp mill, and a significant portion of the energy complex at Crossett (October 2019). Approximately 530 jobs eliminated; tissue operations retained with ~500 employees. Bleached-board demand for the Dixie business was redirected to Naheola and Brewton AL plus St. Marys GA extrusion.',
          url: 'https://talkbusiness.net/2019/06/georgia-pacific-to-lay-off-655-workers-by-closing-crossett-hope-facilities/',
        },
        {
          id: 'gp-palatka-2026',
          source: 'Georgia-Pacific Palatka FL expansion (announcement 2025; construction Feb 2026)',
          confidence: 'public',
          detail: '$83M project at the existing Palatka paper mill, including a 400,000 sq ft warehouse. Construction scheduled to begin February 2026. Material throughput uplift on the consumer-products side; the warehouse build is a yard-layer redesign opportunity.',
          url: 'https://www.areadevelopment.com/newsItems/5-23-2025/georgia-pacific-palatka-florida.shtml',
        },
        {
          id: 'gp-sustainable-packaging-2025',
          source: 'Georgia-Pacific sustainable-packaging capacity build (completed 2025) and Anchor Packaging acquisition (Oct 2025)',
          confidence: 'public',
          detail: '~$550M sustainable-packaging capacity expansion completed in 2025. Anchor Packaging acquired in late 2025, adding a Northeast Arkansas manufacturing footprint focused on sustainable food packaging.',
          url: 'https://news.gp.com/',
        },
        {
          id: 'gp-digital-supply-chain',
          source: 'Georgia-Pacific digital and AI supply-chain disclosures (SAS/AWS, Point A, GenAI pilots)',
          confidence: 'public',
          detail: 'Point A center for supply-chain innovation opened in Atlanta (2018). G-P runs more than 15,000 production ML models on SAS Viya on AWS to tune plant operating settings. Computer-vision QA on inbound wood and fiber. Driver-facing mobile app for purchase-order entry and inbound weighing. GenAI piloted for manufacturing decision-support.',
          url: 'https://www.sas.com/en_gb/customers/georgia-pacific.html',
        },
        {
          id: 'koch-portfolio-capex',
          source: 'Koch Industries portfolio capex disclosures (2025–2027)',
          confidence: 'public',
          detail: 'Koch publicly targets $7–12B/yr for acquisitions and facility upgrades across the portfolio through 2027. Sets the parent-company capex cadence within which Georgia-Pacific\'s 2025–2026 projects sit.',
        },
        {
          id: 'gp-leadership-transition',
          source: 'Christian Fischer retirement + Mark Luetters interim appointment (Oct 2025) — public tenure record',
          confidence: 'public',
          detail: 'Christian Fischer retired October 2025 after ~35 years at Georgia-Pacific / Koch (CEO since 2018). Mark Luetters, a Koch EVP with nine years running G-P building products, was named interim president and CEO at that transition; a permanent CEO is to be named within 2026. Luetters\' nine-year run on the contractor-and-distributor side is the operating-leader half of the dual flow — the one closest to the customer-type that the consumer-products side cannot fully predict from a retail-DC appointment frame.',
        },
        {
          id: 'koch-mbm-five-dimensions',
          source: 'Koch Industries Market-Based Management — published five-dimensions framework',
          confidence: 'public',
          detail: 'Charles Koch\'s Market-Based Management is a codified operating philosophy with five dimensions: Vision, Virtue & Talents, Knowledge Processes, Decision Rights, and Incentives. The framework is the published operating context inside which Georgia-Pacific (and the broader Koch portfolio) is run. The five dimensions are the analytical scaffold used in the observation section and the artifact section to locate the yard layer as the one operating surface where the discipline has not yet been pushed into a measurable network standard.',
          url: 'https://www.kochindustries.com/our-philosophy',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site manufacturing networks operate under, not Georgia-Pacific specifically.',
        },
        {
          id: 'primo-operating-data',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Which Georgia-Pacific sites today actually handle both consumer-products outbound flow and building-products outbound flow in the same yard at material scale — versus sites that are functionally single-flow despite the dual-business structure of the parent',
        'Whether the gate-side digital posture (the driver app, the inbound CV QA, the SAS-driven plant models) already feeds an operating layer above the sites that we cannot see from the public record',
        'Whether Koch Engineered Solutions or Optimized Process Designs has touched the yard layer at Georgia-Pacific through an internal-consulting engagement, and what the conclusion was',
        'How the dock-door arbitration logic at a dual-flow site is decided today — by site policy, by appointment-system logic, by gatehouse judgment, or by a Koch-network operating standard',
        'How the Palatka FL expansion (Feb 2026 ground-breaking) is changing the yard operating model on that specific mill — and whether the 400,000 sq ft warehouse build is being designed against an explicit yard-layer spec',
        'How the post-2019 Crossett network shape (bleached-board demand redistributed to Naheola, Brewton, and St. Marys) has changed inbound and outbound trailer patterns at the receiving mills',
        'Where the MBM Decision Rights line currently sits for dock arbitration at a multi-flow site — site operator, transportation function, the consumer-products P&L vs. the building-products P&L vs. the GP Cellulose P&L, or a Koch-network operating committee — and whether that line is the same at Palatka, Brewton, and Brunswick today',
        'Whether the Knowledge Processes dimension already ingests gate-and-dock event data into the same SAS / AWS stack that tunes plant settings, or whether yard variance currently terminates at the site-level dispatch screen and never reaches the network-level scorecard the way plant-setting variance does',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Georgia-Pacific is distinctive in this round for two related reasons. The first is the three-segment outbound structure: the same operating company ships rolls of Quilted Northern toward retail DCs on appointment cadence, pallets of OSB toward contractor walk-in, and fluff pulp toward industrial converters with export cutoff windowing — three customer types, three appointment regimes, often inside the same site. The second is the Market-Based Management operating context. MBM\'s five dimensions — Vision, Virtue & Talents, Knowledge Processes, Decision Rights, and Incentives — already touch every operating surface inside the building; Knowledge Processes is the philosophical home of fifteen thousand production ML models, and Decision Rights pushed metric ownership deep into the plant a generation ago. Five of the five dimensions have landed inside the four walls. The yard is the one operating surface where the five-dimensions discipline has not yet been pushed into a measurable network standard, and that is what this memo is sizing — the layer above the dual-flow + Cellulose gate where MBM\'s posture for surfacing variance has not yet met the operating standard that would make the variance deterministic across the network. The Primo comparable covers the operating-model shape for any one flow; the multi-customer arbitration above three cadences is the G-P-specific design conversation that pre-dates and post-dates the comparable.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Ryan — the part most worth pushing back on is whether the MBM Decision Rights line for dock arbitration at a dual-flow site already sits with a unit that has a network operating standard to ratify against, or whether it stops at site-level routine today; and whether the Knowledge Processes stack that runs fifteen thousand production ML models on plant settings already ingests gate-and-dock event data in a way the network-level operator can act on, or whether yard variance terminates at the dispatch screen the way it does at most peers. Those two answers reshape the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting — and ideally one that lands before the permanent-CEO appointment closes the window where the yard-layer standard gets ratified rather than inherited mid-cycle.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-036',
      name: 'Ryan Hutcherson',
      firstName: 'Ryan',
      lastName: 'Hutcherson',
      title: 'Senior Vice President, Supply Chain',
      company: 'Georgia-Pacific',
      email: 'ryan.hutcherson@gapac.com',
      linkedinUrl: 'https://www.linkedin.com/in/ryan-hutcherson-87302b64',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Supply Chain',
      currentMandate: 'Senior supply-chain leader at Georgia-Pacific. Sits over the network spanning consumer products (tissue/towel/tableware) and building products (plywood/OSB/gypsum) — the dual-customer-flow business that makes the yard-arbitration question distinctive at G-P relative to a single-flow CPG or single-flow building-products peer.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-037',
      name: 'Jeremy Finley',
      firstName: 'Jeremy',
      lastName: 'Finley',
      title: 'Vice President, Supply Chain',
      company: 'Georgia-Pacific',
      email: 'jeremy.finley@gapac.com',
      linkedinUrl: 'https://www.linkedin.com/in/jeremy-finley-975464b',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Supply Chain',
      currentMandate: 'Named VP-level supply-chain leader at Georgia-Pacific. Operates inside the Koch Industries Market-Based Management posture that pushes metric ownership down the organization.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-038',
      name: 'Kathryn Sherman',
      firstName: 'Kathryn',
      lastName: 'Sherman',
      title: 'Supply Chain Manager',
      company: 'Georgia-Pacific',
      email: 'kathryn.sherman@gapac.com',
      linkedinUrl: 'https://www.linkedin.com/in/katiesherman',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Distribution / Supply Chain',
      currentMandate: 'Named Georgia-Pacific supply-chain operator. Distribution / supply-chain remit covers the consumer-products side of the network where retail-DC appointment cadence dominates.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-039',
      name: 'Wes Bunkley',
      firstName: 'Wes',
      lastName: 'Bunkley',
      title: 'Director, Wood Products Logistics',
      company: 'Georgia-Pacific',
      email: 'wes.bunkley@gapac.com',
      linkedinUrl: 'https://www.linkedin.com/in/wes-bunkley-30935b1a',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Transportation / Logistics',
      currentMandate: 'Direct logistics lead on the building-products side at Georgia-Pacific. Wood products logistics covers plywood, OSB, and lumber — the contractor- and distributor-bound flow that runs against a different appointment-and-carrier mix than the consumer-products side.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-040',
      name: 'John Pratt',
      firstName: 'John',
      lastName: 'Pratt',
      title: 'Export Logistics Manager',
      company: 'Georgia-Pacific',
      email: 'john.pratt@gapac.com',
      linkedinUrl: 'https://www.linkedin.com/in/johnhpratt',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Transportation',
      currentMandate: 'Named logistics manager with Georgia-Pacific footprint, export-side. Adds international-flow visibility to the domestic network picture.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-036',
        name: 'Ryan Hutcherson',
        firstName: 'Ryan',
        lastName: 'Hutcherson',
        title: 'Senior Vice President, Supply Chain',
        company: 'Georgia-Pacific',
        email: 'ryan.hutcherson@gapac.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Ryan Hutcherson — Senior Vice President, Supply Chain',
      variantSlug: 'ryan-hutcherson',

      framingNarrative:
        'Ryan, Georgia-Pacific is one of the only operating companies of its scale that runs consumer tissue, contractor-bound building products, and GP Cellulose pulp / specialty fibers through the same network — sometimes through the same site. The five dimensions of Market-Based Management already touch every operating surface inside the building: Knowledge Processes is the philosophical home of fifteen thousand production ML models tuning plant settings, and Decision Rights pushed metric ownership deep into the plant a generation ago. The yard is the one operating surface where the five-dimensions discipline has not yet been pushed into a measurable network standard. With Christian Fischer retired in October 2025 after thirty-five years and a permanent CEO to be named within 2026, the dual-flow plus Cellulose yard-arbitration layer is the kind of operating standard the next permanent operating leader gets to ratify on entry rather than inherit mid-cycle.',
      openingHook:
        'Five of the five dimensions of MBM already run inside the building. The driver app at the gate, the SAS plant models behind the walls, the Point A center in Atlanta — Knowledge Processes is doing exactly what the framework asks of it. The dock-arbitration logic at a site that loads Quilted Northern toward a retail-DC appointment, OSB toward a distributor walk-in, and fluff pulp against an export cutoff is the operating surface the same five dimensions have not yet been pushed into. That asymmetry is what the analysis below works through.',
      stakeStatement:
        'Throughput is climbing where the capex is landing first — Palatka in February 2026, the sustainable-packaging build that closed in 2025, the Anchor Packaging integration that closed in October 2025. Throughput-out-the-door becomes trailer-into-the-yard. At a site running three customer-type cadences through one dock fleet, an undecided dock door is not one appointment missed — it is a retail-DC window, a contractor pickup, and a port cutoff competing for the same five minutes of resolution. The MBM Decision Rights line for that resolution is the lever that scales with the throughput uplift rather than gets squeezed by it; ratifying that line into a network operating standard is a thing a permanent CEO authors on entry, not something an interim leader carries through a transition.',

      heroOverride: {
        headline: 'The yard layer above the five dimensions.',
        subheadline:
          'Quilted Northern toward a retail-DC appointment, OSB toward a contractor walk-in, fluff pulp against a port cutoff — same mill, same gate fleet. Five of the five dimensions of Market-Based Management already run inside the building. The operating layer above the gate is the one where they have not yet been pushed into a measurable network standard.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer supply-chain-operator framing inside the MBM vocabulary the company actually uses. Lead with the five dimensions of Market-Based Management — Vision, Virtue & Talents, Knowledge Processes, Decision Rights, Incentives — as the operating scaffold the framework is already running on, and locate the yard layer as the one surface where the discipline has not yet been pushed into a measurable network standard. Treat MBM as context, not as flattery; the framework is well-understood inside G-P and the right register is matter-of-fact. Acknowledge the digital posture (Point A, SAS, 15,000 ML models, the driver app, CV QA) as Knowledge Processes doing its job. Name the three-segment outbound structure (consumer-products + building-products + GP Cellulose) explicitly — the Cellulose third segment is the one most peers under-weight in the dual-flow read of G-P, and Ryan sits over all three.',
      kpiLanguage: [
        'MBM Decision Rights at the dock',
        'Knowledge Processes at the gate',
        'multi-cadence dock arbitration',
        'gate-to-dock dwell',
        'retail-DC appointment adherence',
        'contractor walk-in throughput',
        'GP Cellulose export cutoff adherence',
        'multi-site yard operating standard',
        'detention spend',
        'network operating standard ratification',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same heavy-trailer freight economics, same multi-site network shape, already running a network-level operating layer on top of site-level yard systems. Be explicit that Primo is single-customer-type and the three-segment (consumer + building products + Cellulose) wrinkle is Georgia-Pacific-specific. The translation that matters is integration shape: Primo is the proof that a network operating layer slots cleanly above mature site-level systems without contesting Decision Rights at the unit doing the work — which is the entry condition a yard-layer standard inside an MBM operating company has to meet.',
    },
    {
      person: {
        personaId: 'P-037',
        name: 'Jeremy Finley',
        firstName: 'Jeremy',
        lastName: 'Finley',
        title: 'Vice President, Supply Chain',
        company: 'Georgia-Pacific',
        email: 'jeremy.finley@gapac.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Jeremy Finley — Vice President, Supply Chain',
      variantSlug: 'jeremy-finley',

      framingNarrative:
        'Jeremy, the question worth working through at Georgia-Pacific is what changes when the operating layer above the yard runs to a single standard at sites that ship to two different customer types out of the same gate. The inside of the building has been digitized hard; the dock-arbitration layer between consumer-bound and contractor-bound outbound is the seam that hasn\'t been built the same way.',
      openingHook:
        'A driver app that handles inbound weighing, fifteen thousand production ML models tuning plant settings, CV QA on the fiber stream — the digital posture inside the building is real and credible. The unsolved seam is the gate-to-dock layer at a site that loads two customer types on different cadences against the same fleet of doors.',
      stakeStatement:
        'Palatka breaks ground on a 400,000 sq ft warehouse in February 2026; the sustainable-packaging build closed in 2025; Anchor Packaging integrates in late 2025. The capex is landing in places that change the trailer pattern at the yard. That is the moment the operating standard above the sites compounds, not the moment to leave it implicit.',

      heroOverride: {
        headline: 'Two customer types, one dock fleet, no operating layer above it yet.',
        subheadline:
          'Consumer tissue toward retail DCs and building products toward contractor and distributor channels run through the same Georgia-Pacific yards. The operating layer that arbitrates between them is the unsolved seam.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer supply-chain framing. Acknowledge the digital base — Point A, SAS, the driver app — as real work that earned the company the right to ask the next question. The yard layer is that next question, framed as a continuation of the operating philosophy, not as a critique of the build-out so far.',
      kpiLanguage: [
        'dual-flow dock arbitration',
        'retail-DC appointment adherence',
        'contractor walk-in throughput',
        'gate-to-dock dwell',
        'multi-site operating standard',
        'detention spend',
        'inbound CV-QA cadence',
        'carrier scorecard variance',
      ],
      proofEmphasis:
        'Primo as the public comparable for shape, weight-out-before-cube-out freight economics, and a network-level operating model layered on top of mature site-level yard systems. Name the dual-customer-type case as the part Primo does not cover.',
    },
    {
      person: {
        personaId: 'P-038',
        name: 'Kathryn Sherman',
        firstName: 'Kathryn',
        lastName: 'Sherman',
        title: 'Supply Chain Manager',
        company: 'Georgia-Pacific',
        email: 'kathryn.sherman@gapac.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Distribution / Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Kathryn Sherman — Supply Chain Manager',
      variantSlug: 'kathryn-sherman',

      framingNarrative:
        'Kathryn, the consumer-products side of Georgia-Pacific runs against retail-DC appointment cadence that the rest of the network does not. The yard layer at a tissue mill that also handles contractor-bound building-products outbound has to arbitrate between two appointment regimes and two carrier mixes inside the same gate fleet. That is the analytically distinctive thing about the G-P yard against either a single-flow CPG or a single-flow building-products peer.',
      openingHook:
        'Retail-DC appointment windows are tighter than contractor walk-in windows, and the carrier mix is different. At a Georgia-Pacific dual-flow site, both compete for the same doors. The operating layer that decides which gets which is the unsolved seam in an otherwise heavily-digitized network.',
      stakeStatement:
        'The Palatka FL warehouse build (Feb 2026 ground-breaking) and the sustainable-packaging capacity that closed in 2025 are both consumer-products throughput uplifts. Throughput-out-the-door becomes trailer-into-the-yard. At a dual-flow site, that pressure shows up at the doors first.',

      heroOverride: {
        headline: 'Retail-DC appointments and contractor walk-ins competing for the same doors.',
        subheadline:
          'Georgia-Pacific\'s consumer side runs against retail-DC appointment discipline; the building-products side runs against a different cadence. At dual-flow sites, the dock-arbitration layer is the unsolved seam.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer distribution-operator framing. Lead with the operating texture — appointment-window discipline, carrier-mix variance, dock-door arbitration — that lands at the supply-chain-manager level. Be direct about the dual-flow wedge as the distinctive thing.',
      kpiLanguage: [
        'retail-DC appointment adherence',
        'dock-to-stock cycle',
        'gate-to-dock dwell',
        'dual-flow door arbitration',
        'carrier scorecard',
        'detention spend',
        'walk-in throughput',
      ],
      proofEmphasis:
        'Primo is the public comparable on shape and freight economics; flag the dual-customer-type case as Georgia-Pacific-specific.',
    },
    {
      person: {
        personaId: 'P-039',
        name: 'Wes Bunkley',
        firstName: 'Wes',
        lastName: 'Bunkley',
        title: 'Director, Wood Products Logistics',
        company: 'Georgia-Pacific',
        email: 'wes.bunkley@gapac.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Transportation / Logistics',
      },
      fallbackLane: 'logistics',
      label: 'Wes Bunkley — Director, Wood Products Logistics',
      variantSlug: 'wes-bunkley',

      framingNarrative:
        'Wes, wood products logistics is the cleaner half of the dual-flow at Georgia-Pacific — contractor- and distributor-bound outbound, flatbed-heavy, weight-out-before-cube-out trailer economics. Where it gets analytically interesting is the sites where wood-products outbound shares yard infrastructure with consumer-products outbound. The dock-arbitration logic at those sites runs against two appointment regimes at once, and the operating standard above the gate is the unsolved seam.',
      openingHook:
        'OSB and plywood freight runs heavy, runs flatbed, and ships against a contractor and distributor cadence that is different in shape from the retail-DC appointment side of the network. At a mill where both share the same dock fleet, the door-assignment logic is genuinely harder than at a single-flow plant.',
      stakeStatement:
        'Capex is landing on the consumer-products side first (Palatka, the sustainable-packaging build, Anchor Packaging) — which means throughput on that side of the dual-flow is climbing while the wood-products outbound cadence has to find dock time against a faster appointment-window opposing flow. That is the moment the arbitration layer matters most.',

      heroOverride: {
        headline: 'Wood-products outbound competing for dock time with consumer-products outbound.',
        subheadline:
          'At Georgia-Pacific dual-flow sites, OSB and plywood loads run on a contractor/distributor cadence while tissue and towel loads run on a retail-DC appointment cadence. The dock-arbitration layer above that is the unsolved seam.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator framing on the wood-products side. Direct about freight texture — flatbed mix, contractor and distributor pickup variance, weight-driven trailer economics — and where it interacts with the consumer-products outbound at shared sites.',
      kpiLanguage: [
        'flatbed dock cycle',
        'contractor pickup variance',
        'distributor-side carrier mix',
        'dual-flow door arbitration',
        'gate-to-dock dwell',
        'detention spend',
        'on-time pickup',
      ],
      proofEmphasis:
        'Primo as the public comparable for heavy-trailer freight economics and multi-site network operating model; the dual-customer-type wedge is the G-P-specific layer the comparable does not cover.',
    },
    {
      person: {
        personaId: 'P-040',
        name: 'John Pratt',
        firstName: 'John',
        lastName: 'Pratt',
        title: 'Export Logistics Manager',
        company: 'Georgia-Pacific',
        email: 'john.pratt@gapac.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Transportation',
      },
      fallbackLane: 'logistics',
      label: 'John Pratt — Export Logistics Manager',
      variantSlug: 'john-pratt',

      framingNarrative:
        'John, export adds a third cadence on top of the dual-flow at Georgia-Pacific — port-windowing and steamship-line cutoff timing run against both the consumer-products retail-DC appointment side and the building-products contractor/distributor pickup side. At a mill that loads outbound for all three, the dock-arbitration layer is the seam the operating model above the yard would close.',
      openingHook:
        'Export-bound loads run against port and steamship-line cutoff windows that don\'t share a calendar with the domestic appointment regimes. At a Georgia-Pacific mill that ships consumer-products domestic, building-products domestic, and export, the yard is arbitrating across three cadences inside one dock fleet.',
      stakeStatement:
        'The Palatka warehouse build, the sustainable-packaging expansion, and the Anchor Packaging integration are all consumer-products throughput uplifts on the domestic side. Export cadence has to find dock time against that rising domestic flow without missing a port window. That is the moment the operating layer above the yard matters.',

      heroOverride: {
        headline: 'Export windows, retail-DC appointments, and contractor pickups in the same yard.',
        subheadline:
          'Georgia-Pacific\'s export-bound outbound runs against port cutoff timing that doesn\'t share a calendar with the domestic appointment regimes. The dock-arbitration layer above all three is the unsolved seam.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator on the export side. Direct about port-windowing, steamship-line cutoff dynamics, and how they interact with domestic dock cadence at shared mills. Treat the dual-flow domestic question as the broader analytical context.',
      kpiLanguage: [
        'port cutoff adherence',
        'export dock cycle',
        'gate-to-dock dwell',
        'multi-cadence door arbitration',
        'detention spend',
        'on-time port arrival',
        'steamship-line scorecard',
      ],
      proofEmphasis:
        'Primo as the public comparable for multi-site network operating-model shape; the multi-cadence (domestic dual-flow + export) wrinkle is the Georgia-Pacific-specific layer the comparable does not cover.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured at comparable manufacturing operations' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at manufacturing facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.',
        role: 'Operations Director',
        company: 'Fortune 500 Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '~150 US facilities (mills, plants, converting sites, distribution centers); ~30,000 employees',
    facilityTypes: ['Paper Mills', 'Tissue & Towel Plants', 'Plywood & OSB Mills', 'Gypsum Plants', 'Distribution Centers', 'Sustainable-Packaging Plants'],
    geographicSpread:
      'United States (HQ Atlanta GA). Anchor sites include Brewton AL and Naheola AL (paper), Crossett AR (tissue, post-2019 partial decommissioning), Palatka FL (paper; $83M expansion + 400,000 sq ft warehouse breaks ground Feb 2026), Green Bay WI (tissue/towel investment), plus distributed plywood, OSB, lumber, and gypsum operations across the South and West. Anchor Packaging adds a Northeast Arkansas sustainable-packaging footprint (acquired Oct 2025).',
    dailyTrailerMoves: 'High-volume — dual-flow at sites that ship both consumer-products retail-bound freight and building-products contractor- and distributor-bound freight',
    fleet: 'Private fleet plus contract carriers; flatbed-heavy on the wood-products side, dry van on the consumer-products side, plus intermodal',
  },

  freight: {
    primaryModes: ['Truckload', 'Flatbed (wood products)', 'Intermodal/Rail', 'LTL'],
    avgLoadsPerDay: 'High-volume — distributed across consumer tissue/towel (Quilted Northern, Angel Soft, Brawny, Sparkle, Vanity Fair, Dixie tableware) and building products (plywood, OSB, lumber, DensGlass and DensDeck gypsum, Plytanium, Wood I Beam)',
  },

  signals: {
    eventAttendance: 'Past attendee list',
    recentNews: [
      'CEO transition: Christian Fischer retired October 2025 after 35 years at G-P / Koch. Mark Luetters (Koch EVP; nine years running G-P building products) named interim president and CEO. A permanent long-term CEO is expected to be named within 2026.',
      'Palatka FL paper-mill expansion: $83M project plus 400,000 sq ft warehouse, construction breaks ground February 2026.',
      '~$550M sustainable-packaging capacity build completed in 2025.',
      'Anchor Packaging acquisition closed October 2025 — Northeast Arkansas sustainable food packaging footprint added.',
      'Crossett AR partial decommissioning (October 2019) eliminated bleached-board operations and ~530 jobs; tissue operations retained with ~500 employees. Bleached-board demand redirected to Naheola, Brewton AL, and St. Marys GA.',
      'Koch Industries (parent) publicly targets $7–12B/yr for portfolio acquisitions and facility upgrades through 2027.',
      'Point A supply-chain innovation center (Atlanta, opened 2018) and 15,000+ production ML models on SAS/AWS reflect a heavily-digitized in-building operating posture; the gate-to-dock layer above the sites is the unsolved seam.',
    ],
    supplyChainInitiatives: [
      'Three-segment operating company — consumer tissue/towel, building products, and GP Cellulose under one supply chain — creates the three-cadence yard-arbitration question (retail-DC appointment + contractor walk-in + industrial converter with port cutoff windowing) at sites that ship more than one.',
      'Koch Industries Market-Based Management — Vision · Virtue & Talents · Knowledge Processes · Decision Rights · Incentives — is the parent-company operating context. Five of the five dimensions already run inside the building; the yard is the operating surface above the gate where the discipline has not yet been pushed into a measurable network standard.',
      'Heavy Knowledge Processes posture inside the building (SAS + AWS, 15,000+ ML models, computer-vision inbound QA, driver-facing mobile app for purchase-order entry and load weighing) — the gate-to-dock layer at the site, and the network operating standard above the sites, is the unsolved seam.',
    ],
    urgencyDriver:
      'Throughput is climbing where the recent capex is landing first — the Palatka expansion (Feb 2026 ground-breaking, 400,000 sq ft warehouse), the sustainable-packaging build that closed in 2025, the Anchor Packaging integration that closed in late 2025. At a dual-flow site, additional throughput on the consumer-products side compresses dock time for the building-products outbound running against a different appointment regime. The yard-layer operating standard is the lever that scales with that throughput uplift rather than gets squeezed by it.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'MBM five dimensions', body: 'Vision · Virtue & Talents · Knowledge Processes · Decision Rights · Incentives. Five of five already run inside the building. The yard is the operating surface above the gate where the same discipline has not yet been pushed into a measurable network standard.' },
    { mark: 'Knowledge Processes proof', body: '15,000+ production ML models on SAS / AWS tuning plant settings · CV QA on inbound wood and fiber · driver app for inbound weighing. Knowledge Processes doing exactly what the framework asks of it.' },
    { mark: 'Three-segment outbound', body: 'Tissue / towel / tableware to retail DCs · plywood / OSB / gypsum to contractor walk-in and distributors · GP Cellulose pulp and specialty fibers to industrial converters with port cutoff windowing · sometimes the same mill.' },
    { mark: 'Capex landing now', body: 'Palatka $83M + 400,000 sq ft warehouse breaks ground Feb 2026 · $550M sustainable-packaging build closed 2025 · Anchor Packaging integrated Oct 2025.' },
    { mark: 'Leadership transition', body: 'Fischer retired Oct 2025 after 35 yrs · Luetters interim (9 yrs running building products) · permanent CEO named in 2026. The yard layer is a standard a permanent CEO ratifies on entry, not inherits mid-cycle.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight, single-customer-type (the multi-customer wrinkle is G-P-specific).' },
  ],

  audioBrief: {
    src: AUDIO_BRIEF_SRC,
    intro:
      'This brief is for the Georgia-Pacific supply-chain leadership team. The five dimensions of Market-Based Management — Vision, Virtue & Talents, Knowledge Processes, Decision Rights, Incentives — already run inside every wall of the building, and Knowledge Processes is the philosophical home of the fifteen thousand production ML models that tune plant settings. The five minutes that follow are about the one operating surface above the gate where the same five-dimensions discipline has not yet been pushed into a measurable network standard.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#B45309',
    backgroundVariant: 'dark',
  },
};
