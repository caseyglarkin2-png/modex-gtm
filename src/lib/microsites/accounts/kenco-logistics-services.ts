/**
 * Kenco Logistics Services — ABM Microsite Data
 * Quality Tier: B (Tier 3 Band D, logistics-3pl vertical)
 *
 * Pitch shape: OPERATOR-FRAME — Kenco runs other companies' yards. The
 * unit of analysis is whether yard-execution-as-a-service-line becomes
 * a productizable Kenco competence versus a line item peer 3PLs all
 * under-deliver on equally.
 *
 * Angle: INNOVATION LAB PRODUCTIZATION + 75-YR FAMILY-OWNED OPERATOR
 * DISCIPLINE as the signature thread. Kristi Montgomery's $40M+
 * identified savings / $75M+ customer savings record is the public
 * template for how new capabilities enter the Kenco operating standard
 * (pilot in the 10,000 sq ft Chattanooga test-warehouse → productize
 * for the customer base → distribute as a Kenco-branded service across
 * the ~141-facility managed estate). The Primo comparable applies via
 * the read-across — Kenco's shipper customers look operationally like
 * Primo's peer group, productization across that customer base is what
 * turns one operating-model proof into a 1-to-many distribution play.
 *
 * Stakeholder vocabulary: innovation-leader / operator-frame register
 * (Kristi's 35-year tenure since 1990, family-operator culture since
 * 1950, the productization pattern she has run for a decade) —
 * candidate-evaluation, not vendor-pitch. Operator-frame, not vendor.
 */

import type { AccountMicrositeData } from '../schema';

export const kencoLogisticsServices: AccountMicrositeData = {
  slug: 'kenco-logistics-services',
  accountName: 'Kenco Logistics Services',
  coverHeadline: 'The next Innovation Lab productization at Kenco',
  titleEmphasis: 'Innovation Lab productization',
  coverFootprint: '~141 sites · 43M sq ft',
  parentBrand: 'Kenco',
  vertical: 'logistics-3pl',
  tier: 'Tier 3',
  band: 'D',
  priorityScore: 61,

  pageTitle: 'Kenco Logistics Services · Yard execution as the next Innovation Lab productization candidate',
  metaDescription:
    'How yard-execution-as-a-service-line enters the Kenco Innovation Lab pipeline — the same pilot-to-productize pattern that has paid back $40M+ identified savings and $75M+ customer savings under Kristi Montgomery — and distributes across the ~141-facility managed estate as a Kenco-branded capability.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Kenco-operated network',
      composition: [
        { label: 'Innovation Lab productization template', value: '10,000 sq ft live test-warehouse in Chattanooga (expanded 2019); $40M+ identified savings since launch; $75M+ customer savings under Kristi Montgomery (with Kenco since 1990; in the innovation-leader role since 2015). The public pattern: pilot a capability inside the controlled live-warehouse environment → prove it under real operational stress → distribute across the customer base as a Kenco-branded service inside contract-logistics service-level reporting. The repeatable Kenco walk' },
        { label: '2025 Drexel Canadian multi-client acquisition', value: 'Drexel Industries\' 3PL business acquired May 2025 (close date May 1, 2025) — four London ON multi-client warehouses, 820K sq ft, ~100 associates. By design four multi-client distribution spaces in a campus-like environment equidistant from Toronto, Detroit, and Buffalo. The Canadian operating standard is being scoped fresh post-close — the cheapest moment for a new operating-standard layer to enter at integration speed instead of after' },
        { label: '2025 Contract Packaging Division launch', value: 'Launched July 2025 under GVP Rob Doyle — retail-ready, e-commerce fulfillment, promotional, labeling, compliance. End-to-end customer-wrap thesis adds dock-and-stage steps inside the same facility footprint at customer engagements. A second greenfield specification window for the yard layer the new lane sits on top of, opened the same quarter as the Drexel integration window' },
        { label: '75-year family-owned operator discipline', value: 'Privately held, family-operated since 1950 — 75 consecutive years of 3PL operation as of 2025. Pritzker Private Capital growth-investment partnership behind the recent M&A cadence. The operator-frame is structural, not rhetorical: every decision about what enters the Kenco operating standard runs through a closely-held family-operator culture, not a quarterly-earnings cycle. The productization pattern compounds because the operator runs the same business across decades, not the same plan across quarters' },
        { label: 'Facilities under management', value: '~141 distribution facilities across North America; 43M+ sq ft warehouse space; 90+ distribution centers across the U.S. and Canada; 7,500 employees; operates in 33 U.S. states with growing Canadian footprint' },
        { label: 'Customers', value: '390+ customer relationships served across the network; multi-industry (CPG, retail, industrial, e-commerce, returns); Inbound Logistics Top 10 3PL — 12 consecutive years (2025); first-ever Inc. 5000 ranking 2025' },
      ],
      hypothesis:
        'The interesting thing about the Kenco yard math is that it is not Kenco\'s yard. Every one of the ~141 facilities under Kenco management belongs to a shipper customer, runs against a shipper-specific scope of work, and is graded on service-level metrics the shipper writes into the contract. That makes the unit of analysis different from a CPG end-shipper or a Tier-1 carrier network: Kenco is the operator, the freight discipline is delivered as a service, and the yard between the gate and the dock is the surface where service-level performance is most visible to the customer and most opaque to the operator running it. Kenco has built the surrounding capabilities at the highest tier in the industry — the Innovation Lab has paid for itself many times over ($40M+ identified, $75M+ customer savings under Kristi Montgomery), the Inbound Logistics Top 10 placement is now twelve consecutive years, the Drexel acquisition added 820K sq ft of multi-client Canadian capacity, the Contract Packaging Division opened a new lane of end-to-end customer wrap-around in July 2025. What none of those programs touch directly is the yard layer above the WMS.\n\nThe Innovation Lab productization template is the right way to read the rest of this. The repeatable Kenco motion is documented across more than a decade of capability launches: pilot a capability inside a controlled 10,000 sq ft live test-warehouse environment in Chattanooga, prove it under real operational stress, then distribute it across the customer base as a Kenco-branded service inside contract-logistics service-level reporting. $40M+ identified and $75M+ customer savings is the canonical proof — the pattern that has paid back many times over and become the public template for how new capabilities enter the Kenco operating standard. Yard-execution-as-a-service-line is the natural next entry in that template: it sits at the layer above WMS and below TMS that no peer 3PL has productized, it generates exactly the operating-KPI shape Kenco\'s service-level reporting already measures (dwell, gate-to-dock, dock contention, shipper-specific appointment arbitration), and it travels across customer engagements the same way every prior Innovation Lab productization did — pilot, prove, distribute.\n\nTwo things make the operator-frame question urgent at Kenco specifically, and they are not always open together. First, the multi-client distribution model Kenco runs at scale — the Drexel campus in London ON is by design four multi-client warehouses, the broader network includes multi-customer DCs that already share docks across shipper fleets — is the operating context where yard discipline compounds fastest. A multi-client yard with three shipper fleets behind one gate has three times the appointment-window arbitration load of a dedicated-customer yard, three times the carrier-protocol variance, and three times the surface area where one shipper\'s detention bill becomes another shipper\'s dock contention. Second, the 75-year family-operator discipline is the cultural reason productization compounds at Kenco specifically: a closely-held family-operator culture runs the same business across decades, which is why pilot-to-productize at the Innovation Lab pays back $40M+ in customer-base distribution, not in a single-cycle quarterly win. The question for Kenco leadership is not whether the yard runs cleanly enough today; it is whether yard-execution-as-a-service-line becomes a Kenco-branded capability the customer doesn\'t source separately, or whether it stays a line item every peer 3PL under-delivers on equally.',
      pullQuote: 'The competitive question is not whether the freight moves; it is whether yard-execution discipline becomes a Kenco-branded capability or stays a line item peer 3PLs all under-deliver on equally.',
      caveat:
        'This is built from Kenco public disclosures, the 2025 Drexel and Contract Packaging announcements, Innovation Lab press, Kristi Montgomery\'s public profile and conference appearances, the Inbound Logistics Top 10 placement history, and reasonable inference about how the multi-client distribution model maps to yard execution. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: which Kenco-operated yards are running multi-tenant contention most acutely, where shipper-customer service-level pressure on yard performance has already shown up in renewals, and whether the Innovation Lab has formally scoped yard-execution as a productization candidate.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the Kenco operating standard',
      artifact: {
        imageSrc: '/artifacts/kenco-logistics-services-coverage-map.svg',
        imageAlt: 'Kenco operating-standard coverage map. Six tiles representing the capabilities productized through the Kenco operating standard. The Innovation Lab, Drexel CA Multi-Client acquisition, Contract Packaging Division, ~141 distribution facilities, and Inbound Logistics Top 10 placement are covered. The Yard-Execution-as-Service-Line tile is unfilled, marked with a Kenco navy hairline outline.',
        caption: 'Kenco operating-standard coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public Kenco Group + Innovation Lab + Drexel acquisition + Contract Packaging Division + Inbound Logistics Top 10 disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water maxes gross vehicle weight before it maxes cube, it is low-margin (every minute of yard waste is a margin point you can\'t recover with price), and it ships across multi-temp lanes with refillable-return logistics. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be, because the category cost them first. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The read-across to Kenco is not "Kenco is shaped like Primo" — Kenco is a 3PL operator, not a CPG end-shipper. The read-across is: Primo\'s pilot landed inside a CPG anchor whose freight peer 3PLs also handle, and the yard discipline that produced Primo\'s numbers is exactly the operating standard Kenco could productize for shipper customers across the ~141-facility managed network. Many of Kenco\'s most demanding shipper customers — the food-and-beverage anchors, the retail consumer-vertical accounts, the multi-client e-commerce DC tenants — look operationally like Primo\'s peer group. If a network operating model works on the per-case-hardest freight in CPG, putting that operating model inside the Kenco service standard means many Kenco customer engagements gain access to it as a Kenco-branded capability instead of a separately sourced shipper tool. The directly-shaped reference — a Tier-1 CPG anchor running this operating model across 237 facilities on a multi-year, contracted term — is available for peer call when the productization conversation gets specific. The competitive question, in one line: is yard-execution-as-a-service-line a Kenco-branded capability the Innovation Lab productizes and distributes across the customer base (per-site SaaS plus rebill into customer service-level reporting, multi-tenant revenue share at the multi-client DCs, white-label inside customer engagements) the same commercial shape every prior Innovation Lab productization already travels under — or a per-customer line item that every peer 3PL on the IL Top 10 list under-delivers on equally.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot candidates at Kenco are different in kind from end-shipper pilots: (1) the Innovation Lab in Chattanooga as a controlled test bed before any live-customer deployment — that is the public template for how new capabilities enter the Kenco operating standard, and yard-execution fits the same productization pattern as the existing Innovation Lab program; (2) one Drexel-acquired multi-client warehouse in London ON, because the campus is by design four multi-customer facilities with shared-gate appointment-window arbitration already in scope, and the Canadian operating standard is being scoped fresh post-close. We would expect the productization read to make sense inside two to four quarters once the lab pilot reads as expected.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'kenco-public',
          source: 'Kenco Group public disclosures + corporate site',
          confidence: 'public',
          detail: 'Anchors the ~141 distribution facilities figure, 43M+ sq ft, 90+ DC count, 390+ customer relationships, 7,500 employees, 33 U.S. states + Canadian footprint, 75-year operating history (privately held, family-operated since 1950), Chattanooga TN HQ.',
          url: 'https://kencogroup.com/',
        },
        {
          id: 'kenco-drexel-2025',
          source: 'Kenco / Drexel Industries 3PL acquisition (May 2025)',
          confidence: 'public',
          detail: 'Close date May 1, 2025; announced May 5, 2025. Four London ON multi-client warehouses, 820K sq ft, ~100 associates transitioning. Multi-client distribution spaces in a campus-like environment equidistant from Toronto, Detroit, and Buffalo. Pritzker Private Capital-backed expansion.',
          url: 'https://kencogroup.com/news/kenco-expands-canadian-footprint-with-acquisition-of-drexel-industries-3pl-business/',
        },
        {
          id: 'kenco-contract-packaging',
          source: 'Kenco Contract Packaging Division launch (July 2025)',
          confidence: 'public',
          detail: 'Strategic investment covering secondary packaging — retail-ready, e-commerce fulfillment, promotional, labeling, compliance. GVP Rob Doyle leads; 100+ years combined packaging expertise on the founding team. Positions Kenco as an end-to-end supply chain partner rather than warehouse-only.',
          url: 'https://kencogroup.com/news/kenco-strengthens-contract-packaging-capabilities/',
        },
        {
          id: 'kenco-innovation-lab',
          source: 'Kenco Innovation Lab + Kristi Montgomery public profile',
          confidence: 'public',
          detail: '10,000 sq ft live-warehouse R&D facility in Chattanooga; expanded 2019. $40M+ identified savings since launch under Kristi Montgomery. $75M+ customer savings cited in public profiles. Recipient of Supply Chain Xchange Outstanding Women in Supply Chain Award and SDCE Lifetime Achievement Award; recurring industry-conference speaker.',
          url: 'https://kencogroup.com/innovation-technology/',
        },
        {
          id: 'kenco-montgomery-tenure',
          source: 'Kristi Montgomery tenure record — Kenco Logistics Services (LinkedIn + Kenco corporate profile + SupplyChainBrain bylined author page)',
          confidence: 'public',
          detail: 'With Kenco since 1990 — 35+ year tenure. Moved into the Vice President, Innovation, Research & Development role and began leading the Innovation Lab in 2015. Recognized with the Supply Chain Xchange Outstanding Women in Supply Chain Award and the SDCE Lifetime Achievement Award. Recurring speaker at FreightWaves, SupplyChainBrain, DC Velocity, and industry events. The tenure shape matters because it explains why Innovation-Lab-internal productization moves at family-operator cadence rather than vendor-procurement cadence — and why the entry sequence runs through the Innovation seat rather than enterprise procurement.',
          url: 'https://www.linkedin.com/in/kristilmontgomery/',
        },
        {
          id: 'kenco-il-top10',
          source: 'Inbound Logistics Top 10 3PL ranking — 2025 (12th consecutive year)',
          confidence: 'public',
          detail: 'Industry peer benchmark for competitive set framing: the IL Top 10 is the cohort Kenco competes against for shipper-customer renewals, and the surface where capability differentiation shows up in win/loss reviews. 12 consecutive years on the list as of 2025; first-ever Inc. 5000 ranking 2025.',
          url: 'https://kencogroup.com/news/kenco-inbound-logistics-top-10-3pl-list-2025/',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges in multi-tenant 3PL operating contexts. These describe the conditions most contract-logistics networks operate under, not Kenco specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant — most directly applicable to Kenco via the "Kenco\'s shipper customers look operationally like Primo\'s peer group" read-across, not as Kenco\'s own internal metrics.',
        },
      ],
      unknowns: [
        'Whether yard-execution has been formally scoped inside the Innovation Lab pipeline, or whether the lab\'s current focus areas (automation, robotics, sensor tech) sit upstream and downstream of the yard layer without crossing it',
        'Which Kenco-operated yards run the highest multi-tenant contention today — the Drexel-acquired campus is by-design multi-client, but the broader managed network includes multi-customer DCs of varying tenant density and the worst-yards list is not public',
        'How shipper-customer service-level pressure on yard performance is showing up in renewal cycles — whether yard KPIs are being added to contract scope at re-up, and by which customer segments first',
        'How the Contract Packaging Division\'s end-to-end customer-wrap thesis interacts with yard execution — packaging adds dock-and-stage steps inside the same facility footprint, which compounds yard sequencing decisions',
        'Whether productization of yard-execution as a Kenco capability is a Kristi Montgomery / Innovation Lab conversation, a Shanon Weber / Group VP Operations conversation, or both — and what the right entry point looks like',
        'What KPI thresholds the Innovation Lab productization scorecard requires for a candidate to graduate from controlled-lab validation into customer-base distribution — the $40M+ identified / $75M+ customer savings track record is the public reference point, but the internal pass/fail thresholds and review cadence are not',
        'How the partnership economics would be structured if yard-execution becomes a Kenco-branded service offering (per-site SaaS plus rebill into customer service-level reporting, multi-tenant revenue share at the multi-client DCs, white-label inside customer engagements)',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a partnership engagement, not an end-shipper procurement engagement. Kristi, your Innovation Lab is the only seat in the IL Top 10 with a thirty-five-year operator tenure behind a decade of pilot-to-productize wins that read in customer-base savings, not vendor receipts; the memo is shaped to that pattern, not to a vendor-procurement cadence. Kenco is distinctive in this round because the question is not whether yard discipline matters in 3PL operations (it always has) but whether the network-level yard-execution layer is the right next capability to productize through the Innovation Lab and distribute across the ~141-facility managed estate as a Kenco-branded service. The water comparable is intentional. Primo Brands runs the operationally hardest CPG freight in the country, and many of Kenco\'s most demanding shipper customers look operationally like Primo\'s peer group. Productizing the yard-execution layer into the Kenco operating standard means many Kenco customer engagements gain it as a Kenco-branded capability rather than as a separately sourced shipper tool — the kind of differentiation that shows up in renewal and win/loss against the rest of the IL Top 10.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Kristi — the part most worth pushing back on is whether the Innovation Lab pilot-to-productize motion you have run since 2015 — the one that has paid back $40M+ identified and $75M+ in customer savings — currently scopes yard-execution as a candidate, or whether the lab\'s current focus areas sit upstream and downstream of the yard layer without crossing it. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts: an Innovation Lab scoping conversation against the productization scorecard, a controlled lab pilot configured to read in customer-base savings the same way prior productizations have, a Drexel London ON multi-client scoping session, or a peer call with the directly-shaped 237-facility reference — not necessarily a vendor demo.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-061',
      name: 'Kristi Montgomery',
      firstName: 'Kristi',
      lastName: 'Montgomery',
      title: 'Vice President of Innovation, Research & Development',
      company: 'Kenco Logistics Services',
      email: 'kristi.montgomery@kencogroup.com',
      linkedinUrl: 'https://www.linkedin.com/in/kristilmontgomery/',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Innovation / Strategy',
      currentMandate: 'Runs the Kenco Innovation Lab (10,000 sq ft live test-warehouse in Chattanooga). $40M+ identified savings since the lab launched; $75M+ customer savings under her tenure. With Kenco since 1990 — 35+ year tenure; moved into the innovation-leader role and began leading the lab in 2015. Recipient of Supply Chain Xchange Outstanding Women in Supply Chain Award and SDCE Lifetime Achievement Award. Recurring industry-conference speaker on logistics innovation, AI, and emerging supply chain technology.',
      bestIntroPath: 'Direct outreach framed as Innovation Lab productization candidate — yard-execution-as-a-service-line as the next capability that fits the lab\'s pilot → productize → customer-base distribution pattern. Conference / industry-event ecosystem also works.',
    },
    {
      personaId: 'P-062',
      name: 'Shanon Weber',
      firstName: 'Shanon',
      lastName: 'Weber',
      title: 'Group Vice President, Operations',
      company: 'Kenco Logistics Services',
      email: 'shanon.weber@kencogroup.com',
      linkedinUrl: 'https://www.linkedin.com/in/shanon-weber-a7b9328',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Operations',
      currentMandate: 'Group VP Operations across the Kenco managed-services portfolio — ~141 facilities, 390+ customer relationships, multi-client DCs, the Drexel-acquired Canadian campus. Operations seam where shipper-customer service-level pressure on yard performance lands first.',
      bestIntroPath: 'Direct outreach into the operations org; warm ecosystem intro via 3PL industry network also works.',
    },
    {
      personaId: 'P-063',
      name: 'Jason Minghini',
      firstName: 'Jason',
      lastName: 'Minghini',
      title: 'Engineering leader, Kenco Group',
      company: 'Kenco Logistics Services',
      email: 'jason.minghini@kencogroup.com',
      linkedinUrl: 'https://www.linkedin.com/in/jason-minghini-mba-806b4812',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Engineering / Solutions',
      currentMandate: 'Engineering / solutions-design leader at Kenco — the team that scopes warehouse automation, dock layout, and facility builds for new customer engagements. The yard outside the dock is typically the last surface to be specified and the first to operate manually after go-live.',
      bestIntroPath: 'LinkedIn / solutions-design ecosystem outreach',
    },
    {
      personaId: 'P-064',
      name: 'Emmanuel (Pete) Bradley',
      firstName: 'Emmanuel',
      lastName: '(Pete) Bradley',
      title: 'Operations executive',
      company: 'Kenco Logistics Services',
      email: 'emmanuel.bradley@kencogroup.com',
      linkedinUrl: 'https://www.linkedin.com/in/emmanuel-pete-bradley-9b90b128',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Operations',
      currentMandate: 'Large-scale distribution and operations leader at Kenco — daily execution layer across managed warehouses and DCs.',
      bestIntroPath: 'LinkedIn / ecosystem outreach',
    },
    {
      personaId: 'P-065',
      name: 'Andre Pereira',
      firstName: 'Andre',
      lastName: 'Pereira',
      title: 'General Manager, Kenco Group',
      company: 'Kenco Logistics Services',
      email: 'andre.pereira@kencogroup.com',
      linkedinUrl: 'https://www.linkedin.com/in/andr%C3%A9-luiz-pereira',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Customer Operations',
      currentMandate: 'General Manager at a Kenco-managed facility — operational layer closest to daily yard execution, where the customer relationship and the daily yard run through the same person.',
      bestIntroPath: 'LinkedIn / ecosystem outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-061',
        name: 'Kristi Montgomery',
        firstName: 'Kristi',
        lastName: 'Montgomery',
        title: 'Vice President of Innovation, Research & Development',
        company: 'Kenco Logistics Services',
        email: 'kristi.montgomery@kencogroup.com',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Innovation / Strategy',
      },
      fallbackLane: 'executive',
      label: 'Kristi Montgomery - VP Innovation, Research & Development',
      variantSlug: 'kristi-montgomery',

      framingNarrative:
        'Kristi, you have run the Innovation Lab productization motion end-to-end already — pilot a capability inside the controlled 10,000 sq ft Chattanooga live-warehouse environment, prove it under real operational stress, then distribute it across the Kenco customer base as a Kenco-branded service inside contract-logistics service-level reporting. $40M+ identified savings since the lab launched and $75M+ in customer savings under your tenure is the canonical proof. With Kenco since 1990 and in the innovation-leader role since 2015, you have run the pilot-to-productize pattern for a decade — at family-operator cadence, not vendor-procurement cadence, which is the reason it has compounded. The yard-execution and multi-tenant orchestration layer above the WMS is the natural next entry in that same operating-standard catalog — multi-tenant from the data model up (which the 3PL operating model requires), generating the operating-KPI shape Kenco\'s service-level reporting already measures (dwell, gate-to-dock, dock contention, shipper-specific appointment arbitration), and traveling across customer engagements the same 1-to-many way every prior Innovation Lab productization did.',
      openingHook:
        'The Innovation Lab is the public template for how new capabilities enter the Kenco operating standard. $40M+ identified · $75M+ customer savings · ten years of pilot-to-productize · the canonical Kenco walk. Yard-execution-as-a-service-line is the next productization entry — multi-tenant from the data model up, partnership-economics-shaped (per-site SaaS plus rebill, white-label embed in contract-logistics service-level reporting), Innovation-Lab-scorecard KPIs from day one. The Drexel London ON multi-client campus is the cleanest live-customer pilot once the lab pilot reads clean.',
      stakeStatement:
        'The IL Top 10 cohort is the same cohort every year, and the differentiation surface in shipper-customer renewals is narrow. Lean shipper inventory has turned yard variance into a service-level metric that ladders into renewal scoring, and yard-execution productization is the kind of capability that shows up in win/loss reviews against the rest of the peer set. The Drexel integration window (May 2025) and the Contract Packaging Division greenfield (July 2025) are open simultaneously — two operating-standard specification windows in a single year, the cheapest moments for a new layer to enter at integration speed instead of after.',

      heroOverride: {
        headline: 'After ten years of Innovation Lab productization — yard execution is the next entry in the Kenco operating standard.',
        subheadline:
          'Multi-tenant from the data model up. Partnership-economics-shaped (per-site SaaS plus rebill, white-label embed in contract-logistics service-level reporting). Productization, not procurement. Distributed across customer engagements, not bought for a single site. The Drexel May 2025 integration window, the Contract Packaging Division July 2025 greenfield, and the family-operator productization rhythm your team is already running at can absorb the next adjacency.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Innovation-leader register. Kristi has been running pilot-to-productize for a decade; frame the conversation as candidate evaluation against the Innovation Lab\'s actual scoping criteria, not as a vendor pitch. Reference the lab\'s public track record ($40M+ identified, $75M+ customer savings) and the 35-year operator tenure as the operating context, not as flattery. Productization path — pilot → operating standard → customer-base distribution — should be explicit, not implicit. Family-operator cadence is structural, not rhetorical: acknowledge the compounding effect across decades.',
      kpiLanguage: ['productization candidate', 'Innovation Lab pilot scope', 'customer-base distribution', 'service-level differentiation', 'multi-tenant dock orchestration', 'shipper-customer renewal scoring', 'per-site SaaS plus rebill', 'family-operator cadence'],
      proofEmphasis:
        'Primo is the *public* comparable to cite as the operating-model proof. The read-across applies as Kenco\'s shipper customers look operationally like Primo\'s peer group, and productization across that customer base is what turns one operating-model proof into a 1-to-many distribution play the same way every prior Innovation Lab capability already became.',
    },
    {
      person: {
        personaId: 'P-062',
        name: 'Shanon Weber',
        firstName: 'Shanon',
        lastName: 'Weber',
        title: 'Group Vice President, Operations',
        company: 'Kenco Logistics Services',
        email: 'shanon.weber@kencogroup.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Shanon Weber - Group Vice President, Operations',
      variantSlug: 'shanon-weber',

      framingNarrative:
        'Shanon, the operations layer across ~141 Kenco-managed facilities is where shipper-customer service-level pressure on yard performance lands first — before it reaches Innovation, before it reaches Solutions Design, before it shows up in a renewal cycle. Multi-client DCs concentrate that pressure: three shipper fleets behind one gate is three times the appointment-window arbitration load, and the Drexel-acquired London ON campus added four multi-client warehouses inside one acquisition close. The operating-standard question is whether yard execution stays a per-site negotiation or becomes a network-level Kenco capability the customer doesn\'t source separately.',
      openingHook:
        'Lean shipper-customer inventory positions have turned yard variance into a service-level metric, not just an operations one. The multi-client DCs in the network — including the Drexel-acquired campus closed in May 2025 — are the surface where that pressure compounds fastest. A network-level yard operating standard applied at the managed-services layer is a decision Operations makes once and deploys across the relevant subset of facilities.',
      stakeStatement:
        'Yard-execution variance at a Kenco-managed yard is a Kenco service-level metric, not a shipper internal cost — and at multi-client DCs it is one shipper\'s detention bill against another shipper\'s dock contention. The differentiation surface against the rest of the IL Top 10 is narrow; yard execution is one of the surfaces still open.',

      heroOverride: {
        headline: 'Yard execution as a network-level Kenco operating standard.',
        subheadline:
          'The operations layer across ~141 managed facilities is where shipper-customer service-level pressure on yard performance lands first. Multi-client DCs concentrate that pressure. A yard operating standard applied at the managed-services tier moves the conversation from per-site negotiation to network-level Kenco capability.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operations register. Shanon owns the daily execution layer across the managed-services portfolio; lead with multi-tenant dock arbitration, multi-client DC contention, shipper-specific carrier-protocol variance. The Innovation Lab productization framing is upstream of operations — acknowledge it but don\'t lead with it.',
      kpiLanguage: ['multi-tenant dock orchestration', 'shipper-specific appointment-window arbitration', 'service-level renewal scoring', 'managed-services operating standard', 'carrier-protocol variance', 'multi-client DC contention'],
      proofEmphasis:
        'Primo is the *public* operating-model proof; the directly-shaped 237-facility CPG-anchor reference is available for peer call if the operations conversation gets specific about how the operating standard rolls out across the managed estate.',
    },
    {
      person: {
        personaId: 'P-063',
        name: 'Jason Minghini',
        firstName: 'Jason',
        lastName: 'Minghini',
        title: 'Engineering leader, Kenco Group',
        company: 'Kenco Logistics Services',
        email: 'jason.minghini@kencogroup.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Engineering / Solutions',
      },
      fallbackLane: 'ops',
      label: 'Jason Minghini - Engineering leader',
      variantSlug: 'jason-minghini',

      framingNarrative:
        'Jason, the engineering and solutions-design layer at Kenco specifies warehouse automation, dock layout, and facility configuration for each customer engagement. The yard outside the dock is typically the last surface to be specified in the solution design and the first to operate manually after go-live. Integrating a yard-execution layer into the solutions-design scope at engagement specification is materially cheaper than retrofit, and the operating-standard window opens widest when a new customer-engagement scope or an acquired-network integration is being written for the first time.',
      openingHook:
        'The Drexel-acquired Canadian operating standard is being scoped fresh post-close (May 2025), and the Contract Packaging Division (July 2025) adds dock-and-stage steps inside the same facility footprint at customer engagements. Two greenfield specification windows in a single year, both open for a new operating-standard layer at the yard.',
      stakeStatement:
        'After go-live, the yard-execution layer is the last surface to digitize and the most expensive surface to retrofit. The window to enter the engagement specification at integration speed — not after — is now.',

      heroOverride: {
        headline: 'Yard execution inside the Kenco solutions-design scope.',
        subheadline:
          'The Drexel-acquired Canadian operating standard and the Contract Packaging Division\'s new engagement footprint are two specification windows open simultaneously. Integrating the yard-execution layer into the solutions-design scope at engagement spec is materially cheaper than retrofit after go-live.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Solutions-design / engineering register. Frameworks, costed assumptions, scoped trade-offs. The yard is the surface that gets specified last and operates manually first — name that pattern directly and position the layer as something that enters engagement spec, not bolts on after.',
      kpiLanguage: ['engagement specification', 'operating-standard layer', 'multi-tenant dock orchestration', 'solutions-design scope', 'retrofit cost vs. integration cost', 'greenfield specification window'],
      proofEmphasis:
        'Primo is the public operating-model proof; the directly-shaped 237-facility reference is available for peer call when the solutions-design conversation gets specific about productization economics inside the Kenco service standard.',
    },
    {
      person: {
        personaId: 'P-064',
        name: 'Emmanuel (Pete) Bradley',
        firstName: 'Emmanuel',
        lastName: '(Pete) Bradley',
        title: 'Operations executive',
        company: 'Kenco Logistics Services',
        email: 'emmanuel.bradley@kencogroup.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Emmanuel (Pete) Bradley - Operations executive',
      variantSlug: 'emmanuel-pete-bradley',

      framingNarrative:
        'Emmanuel, large-scale distribution operations across Kenco-managed warehouses and DCs is the layer where shipper-customer service-level performance is delivered or missed daily. Multi-client DCs concentrate the most contention: shared gates, divergent carrier protocols per shipper, appointment-window arbitration decided in the moment. A network-level yard operating standard applied at the managed-services tier is a decision the operations org makes once and deploys across the multi-client subset of facilities first.',
      openingHook:
        'The yard between the gate and the dock is where shipper-customer service-level performance is delivered or missed daily — and at multi-client DCs it is where one shipper\'s detention bill becomes another shipper\'s dock contention. The operating-standard decision sits at the managed-services layer Kenco owns directly.',
      stakeStatement:
        'Yard-execution variance at managed facilities is a Kenco service-level surface, not a shipper internal cost. Lean shipper inventory has turned that variance into renewal-scoring evidence, not a recoverable buffer.',

      heroOverride: {
        headline: 'A yard operating standard at the managed-services tier.',
        subheadline:
          'Large-scale distribution at Kenco runs against shipper-specific carrier protocols, dock rules, and yard tolerances. A yard operating standard applied at the managed-services tier removes the per-customer protocol negotiation from daily operations and concentrates the contention-management problem at the multi-client DCs where it compounds fastest.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operations register. Lead with multi-client DC contention, shipper-specific carrier-protocol variance, dock arbitration in the moment. The productization framing from Innovation is upstream of daily operations — acknowledge but don\'t lead.',
      kpiLanguage: ['multi-tenant dock orchestration', 'carrier-protocol variance', 'appointment-window arbitration', 'service-level renewal scoring', 'managed-services operating standard'],
      proofEmphasis:
        'Primo is the public comparable; the directly-shaped 237-facility reference is available for peer call when the operations conversation gets specific.',
    },
    {
      person: {
        personaId: 'P-065',
        name: 'Andre Pereira',
        firstName: 'Andre',
        lastName: 'Pereira',
        title: 'General Manager, Kenco Group',
        company: 'Kenco Logistics Services',
        email: 'andre.pereira@kencogroup.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Customer Operations',
      },
      fallbackLane: 'ops',
      label: 'Andre Pereira - General Manager',
      variantSlug: 'andre-pereira',

      framingNarrative:
        'Andre, the GM layer at a Kenco-managed facility owns both the customer relationship and the daily yard operation through the same person — which means the yard is the place where customer-experience surface and operations execution intersect most directly. The site-level view on what changes when the yard runs on a network operating standard rather than radio dispatch and tribal knowledge is the conversation that turns a productization thesis into a deployment plan.',
      openingHook:
        'At the GM tier, the yard is where carrier delays become customer service issues, and where a digital execution layer replaces the radio dispatch and paper log that currently mediate the two. The customer relationship runs through the same person who owns the daily operation — the operating-standard decision is felt at the site level before it shows up anywhere else.',
      stakeStatement:
        'Yard-execution variance at the GM\'s site is felt in customer service issues immediately and in the renewal conversation eventually. The operating-standard decision sits with the managed-services tier above Andre\'s site, but the proof site for whether the standard works is the one Andre runs.',

      heroOverride: {
        headline: 'The site where the operating standard is felt first.',
        subheadline:
          'At the GM tier, the yard is the surface where the customer relationship and daily operations intersect. A network-level yard operating standard applied at the managed-services tier reaches the site where Andre runs the customer relationship through the daily yard — and proves out (or doesn\'t) at the site-level operating reality.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Site-GM register. Daily operating reality, customer-relationship interface, the specific way radio dispatch and paper logs mediate between yard and dock today. Lead with the site-level felt experience of the operating-standard change, not the corporate productization frame.',
      kpiLanguage: ['daily yard reality', 'customer-experience surface', 'radio-to-digital transition', 'site-level operating standard', 'gate-to-dock cycle'],
      proofEmphasis:
        'Primo is the public comparable; the site-level read of what changes in daily operations is the value Andre brings to the conversation, not the network-level numbers.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '~141 distribution facilities across North America; 43M+ sq ft warehouse space; 90+ DCs across U.S. and Canada',
    facilityTypes: ['Contract Warehouses', 'Distribution Centers', 'Multi-Client DCs', 'Cross-Docks', 'Managed Transportation Hubs', 'Contract Packaging Operations', 'Innovation Lab (Chattanooga, 10,000 sq ft)'],
    geographicSpread:
      'North America — 33 U.S. states with growing Canadian footprint. HQ Chattanooga TN. May 2025 Drexel acquisition added a four-warehouse multi-client campus in London ON (820K sq ft) equidistant from Toronto, Detroit, and Buffalo NY',
    dailyTrailerMoves: 'High-volume — modeled at the network level across ~141 managed facilities; multi-client DCs concentrate shipper-fleet contention behind shared gates',
    fleet: 'Customer-dependent: Kenco operates managed yards for 390+ shipper customer relationships across multiple verticals',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal'],
    avgLoadsPerDay: 'High-volume — distributed across 390+ customer relationships spanning CPG, retail, industrial, e-commerce, returns, and contract packaging',
  },

  signals: {
    recentNews: [
      'Drexel Industries 3PL acquisition (close date May 1, 2025; announced May 5, 2025) — four London ON multi-client warehouses, 820K sq ft, ~100 associates; Kenco\'s anchor Canadian campus equidistant from Toronto, Detroit, and Buffalo.',
      'Contract Packaging Division launched July 2025 under GVP Rob Doyle — retail-ready, e-commerce, promotional, labeling, compliance. End-to-end customer-wrap thesis adds dock-and-stage steps inside the same facility footprint.',
      'Inbound Logistics Top 10 3PL — 2025 (12th consecutive year). First-ever Inc. 5000 ranking 2025.',
      '75-year operating anniversary 2025; Pritzker Private Capital growth investment behind the recent M&A cadence; 7,500 employees; privately held, family-operated since 1950.',
      'Kenco Innovation Lab — 10,000 sq ft Chattanooga test-warehouse; $40M+ identified savings since launch; $75M+ customer savings under Kristi Montgomery (VP Innovation R&D since 2015, with Kenco since 1990).',
    ],
    supplyChainInitiatives: [
      'Yard-execution-as-a-service-line productization candidate inside the Innovation Lab pilot → operating-standard → customer-base distribution pattern',
      'Multi-client DC operating standard across the Drexel-acquired London ON campus and the broader multi-customer subset of the network',
      'Service-level differentiation against the IL Top 10 peer set in shipper-customer renewal cycles',
    ],
    urgencyDriver:
      'Two specification windows are open simultaneously and they are not always open. First, the Drexel-acquired Canadian operating standard is being scoped fresh post-close (May 2025), which is the cheapest moment for a new operating-standard layer to enter. Second, the Contract Packaging Division (July 2025) adds dock-and-stage steps inside the same facility footprint at customer engagements — a greenfield specification window for the yard layer the new lane sits on top of. Underneath both is the Innovation Lab productization pattern that has paid back $40M+ identified and $75M+ in customer savings — the public template for how new capabilities enter the Kenco operating standard.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Innovation Lab', body: '10,000 sq ft Chattanooga · $40M+ identified · $75M+ customer savings · Kristi Montgomery since 2015 · with Kenco since 1990.' },
    { mark: '2025 Drexel acquisition', body: 'Four London ON multi-client warehouses · 820K sq ft · close May 1, 2025 · Canadian operating standard scoped fresh.' },
    { mark: 'Contract Packaging Division', body: 'Launched July 2025 · GVP Rob Doyle · dock-and-stage steps inside the same facility footprint.' },
    { mark: 'IL Top 10 cohort', body: '12 consecutive years on the Inbound Logistics Top 10 3PL list. The peer set is the same set every year.' },
    { mark: '75-year operator discipline', body: 'Privately held, family-operated since 1950. Productization compounds at decade cadence, not quarter cadence.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Kristi Montgomery. The Innovation Lab productization pattern your team has run for a decade — pilot a capability inside the 10,000 sq ft Chattanooga live-warehouse environment, prove it under real operational stress, distribute it across the Kenco customer base as a Kenco-branded service — is the pattern that has paid back $40M+ identified and $75M+ in customer savings. The five minutes that follow are about the yard-execution layer fitting that same template.',
    chapters: [
      { id: 'thesis', label: 'I. Kenco runs other companies\' yards', start: 0 },
      { id: 'what-lab-made', label: 'II. What the Innovation Lab productized', start: 65 },
      { id: 'unfilled-tile', label: 'III. The unfilled layer in the operating standard', start: 130 },
      { id: 'two-windows', label: 'IV. Drexel and Contract Packaging — two windows open at once', start: 195 },
      { id: 'productize-not-procure', label: 'V. Productize, don\'t procure', start: 260 },
    ],
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#1C4E80',
    backgroundVariant: 'dark',
  },
};
