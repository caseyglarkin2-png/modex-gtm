/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * GXO Logistics is the world's largest pure-play contract logistics provider
 * — post-Wincanton (Apr 2024, £762M) the only 3PL of its scale with no
 * asset-based trucking business. That distinction is structural: the unit
 * of analysis is operating standard, not asset utilization. The pitch is
 * NOT displacement — site-level yard-management deployments exist at
 * portions of the NA / UK network and operate as systems of record where
 * deployed. YardFlow positions as the execution + multi-tenant
 * orchestration layer above the records layer.
 *
 * Pitch shape: PARTNERSHIP — yard-execution layer enters the GXO operating
 * standard the same way Agility Robotics Digit, Apptronik Apollo, Reflex
 * Robotics, and Dexory did. GXO Direct is the first publicly named
 * multi-tenant network product (since 2018, expanded with PFSweb 2024 and
 * the new midsize-customer service mid-2025). GXO IQ — the Google Cloud /
 * Snowflake AI-first platform launched June 2025 — is the operating
 * surface the yard-execution layer plugs into; the AI agent "GIL" is the
 * customer-facing surface but the orchestration substrate is what matters
 * for the yard layer.
 *
 * Stakeholder decision: Michael Jacobs (President, Americas & Asia
 * Pacific) is the NA operator-frame seat — effective November 3, 2025,
 * succeeding Jorge Guanter. Three-decade supply-chain background (Ferguson
 * SVP Supply Chain, Keurig worldwide distribution, Toys "R" Us global
 * supply chain in 33 countries); Ferguson role specifically included
 * "robotics and automation productivity improvements and AI-leveraged
 * demand forecasting" — i.e., the productization rhythm matches. Patrick
 * Kelleher (CEO, since Aug 19 2025) is upstream — global, ex-DHL Supply
 * Chain NA CEO, the executive who oversaw the Boston Dynamics Stretch and
 * Locus partnerships at DHL — but the regional operator-frame seat for
 * NA is Jacobs. Kelleher's prior role at DHL is the reason the
 * partnership-productization motion translates exactly; cite that as
 * shared context, not as the routing.
 *
 * Two windows are open simultaneously and they are not always open:
 * (1) Jacobs's first-90-days operating-standard scoping window for the
 * Americas region (Nov 2025 effective date), which is the cheapest
 * moment for a new layer to enter at scoping speed instead of after;
 * (2) the Wincanton integration is still in active SOP rewrite (Q1 2026
 * earnings call: $60M run-rate synergies on track for year-end 2026,
 * "further opportunities" called out by Suchinski), which means operating
 * standards are being rewritten across the UK side concurrently — the
 * cleanest moment in a decade for a new layer to enter at integration
 * speed rather than after.
 *
 * This intel powers the partnership cold-email framing. It must not
 * appear in any prospect-facing surface — including proofBlocks which
 * feed memo-compat's fallback comparable section.
 */

/**
 * GXO Logistics — ABM Microsite Data
 * Quality Tier: A (world's largest pure-play contract logistics; post-
 *                  Wincanton scale; documented partner-productization
 *                  motion under Kelleher's prior DHL tenure; Jacobs's
 *                  first-90-days NA operating-standard window open now)
 * Pitch shape: PARTNERSHIP — yard-execution layer that enters the GXO
 *              operating standard the way Agility Robotics, Apptronik,
 *              Reflex, and Dexory did; distributed across customer
 *              engagements as a GXO-branded capability inside contract-
 *              logistics service-level reporting; multi-tenant from the
 *              data model up (which GXO Direct already requires)
 * Angle: YARD MANAGEMENT — multi-tenant dock orchestration, GXO Direct
 *        multi-customer DC contention, shipper-specific appointment-window
 *        arbitration, Wincanton-integration SOP standardization. NOT
 *        driver experience.
 * Stakeholder vocabulary: operator / supply-chain register
 *        (Jacobs's three-decade supply chain tenure across Ferguson,
 *        Keurig, Toys "R" Us; Ferguson scope explicitly named
 *        robotics + automation productivity and AI-leveraged forecasting)
 *        — frameworks, productization pipeline, costed assumptions,
 *        named comparison technologies. Not transformation register.
 */

import type { AccountMicrositeData } from '../schema';

export const gxo: AccountMicrositeData = {
  slug: 'gxo',
  accountName: 'GXO Logistics',
  coverHeadline: 'The yard-execution layer above the GXO operating standard',
  titleEmphasis: 'above the GXO operating standard',
  coverFootprint: '1,000+ sites · 150K+ team',
  parentBrand: 'GXO Logistics, Inc. (NYSE: GXO)',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 85,

  pageTitle: 'YardFlow for GXO Logistics - The Yard-Execution Layer Above the GXO Operating Standard',
  metaDescription:
    'How the multi-tenant yard-execution layer enters the GXO Logistics operating standard — the same productization path Agility Robotics Digit, Apptronik Apollo, Reflex, and Dexory took into the GXO catalog — and distributes across 1,000+ customer-facing facilities as a GXO-branded capability inside contract-logistics service-level reporting.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the GXO operating model',
      composition: [
        { label: 'Network scale', value: '1,000+ facilities globally; 200M+ sq ft; 150,000+ team members post-Wincanton; world\'s largest pure-play contract logistics provider since the Apr 2024 Wincanton close. NA HQ in Greenwich CT; Americas & Asia Pacific seat based in Dallas under Jacobs (effective Nov 3, 2025)' },
        { label: 'Pure-play distinction (the structural differentiator)', value: 'Spun off from XPO Aug 2, 2021 as the world\'s largest pure-play contract logistics provider — no asset-based trucking, no LTL fleet, no brokerage. That distinction is structural: the unit of analysis at GXO is operating standard across customer-facing facilities, not asset utilization across a truck fleet. It is the part of the 3PL identity peer operators with mixed truck-and-warehouse models cannot replicate without divestiture' },
        { label: 'Operator-frame productization template', value: 'The repeatable GXO motion is documented across multiple partner technologies: identify a customer-side need → pilot a partner technology at one site → validate KPIs against the operating-standard scorecard → scale across the multi-tenant network → embed into the GXO operating standard → distribute across customer engagements as a GXO-branded capability inside contract-logistics service-level reporting. Agility Robotics Digit (industry-first humanoid commercial deployment + first humanoid Robots-as-a-Service agreement); Apptronik Apollo (multi-phase R&D initiative); Reflex Robotics (second humanoid RaaS pilot); Dexory (AI-powered inventory robotics, Oosterhout NL pilot now expanding to U.S. and Europe). The productization walks every partner technology takes' },
        { label: 'GXO Direct — multi-tenant by definition', value: 'Multi-customer shared-warehousing fulfillment platform; launched 2018; expanded with PFSweb (PFS) acquisition to add a midsize-customer service tier mid-2025. Nationwide network of multi-tenant sites with shared infrastructure, overhead, equipment, and workforce. Multi-shipper trailer fleets behind shared gates under shipper-specific appointment-window arbitration — by-definition the multi-tenant yard problem GXO\'s legacy single-tenant tools were not designed for. GXO IQ now powers GXO Direct customers in the U.S.' },
        { label: 'GXO IQ — the AI-first orchestration substrate', value: 'Launched June 2025; built on Google Cloud and Snowflake; informed by 20+ years of operational data; suite of proprietary AI algorithms orchestrating inventory distribution and movement, order picking, packing, shipping, and staffing in real time. Customer-facing surface is "GIL," a persona-based interactive AI agent. The platform is the orchestration substrate the next operating-standard layer plugs into — and the yard-execution layer is the multi-tenant data model GXO IQ does not yet reach below the dock door' },
        { label: 'Wincanton integration in active SOP rewrite', value: 'Completed Apr 29, 2024 at £762M. Added 16M+ sq ft of UK contract logistics. Q1 2026 earnings call (May 7 2026): $60M run-rate cost synergies on track for year-end 2026; CFO Suchinski noted "further opportunities" as Wincanton integrates into the bigger GXO. Operating standards are being rewritten across the UK side concurrently — the cleanest moment in a decade for a new layer to enter at integration speed rather than after. Clipper Logistics (Oct 2022, +50 sites, +10M sq ft, +~10K employees across UK, Germany, Poland) is the precedent that proved the integration motion at scale' },
        { label: 'Leadership window (the timing the rest of this hinges on)', value: 'Patrick Kelleher CEO since Aug 19, 2025 — 33 years global supply chain at DHL Supply Chain, most recently CEO of DHL Supply Chain North America; the executive who oversaw the Boston Dynamics Stretch and Locus deployments at DHL, which is the exact partnership-productization motion this account requires. Michael Jacobs President Americas & Asia Pacific since Nov 3, 2025 — three decades of supply chain operations spanning consumer packaged goods, retail, and industrial; at Ferguson Enterprises he led the supply chain transformation that explicitly included robotics, automation productivity, and AI-leveraged demand forecasting; prior worldwide distribution and e-commerce fulfillment at Keurig and global supply chain at Toys "R" Us across 33 countries. Both seats are in their first-90-days operating-standard scoping window — the cheapest moment for a new layer to enter the standard at scoping speed instead of after' },
        { label: 'Existing yard-tech layer', value: 'Site-level yard-management deployments exist in parts of the NA and UK networks (vehicle/asset tracking, gate logs, dwell-and-detention reporting where deployed) and function as systems of record. The multi-tenant execution and orchestration layer above the records layer is unsolved — and GXO Direct\'s shared-warehousing model is by-definition a multi-tenant yard surface the legacy single-tenant tools were never designed for' },
      ],
      hypothesis:
        'The interesting thing about GXO Logistics is not whether yard tools belong in the operating model. There are records-layer yard deployments in parts of the NA and UK networks today, and operations continue. The interesting thing is that GXO is a pure-play contract logistics operator — no asset-based trucking, no LTL fleet, no brokerage — and that flips the unit of analysis. Every facility under management is a customer-facing yard by definition. GXO Direct multi-tenant DCs are by-definition shared-gate environments where different shipper fleets compete for the same docks under shipper-specific appointment rules. The 16M+ sq ft of UK contract logistics added through Wincanton is in active SOP integration into the bigger GXO operating standard right now. The single-tenant yard tools that exist in the network today were specified for a different operating model — one customer per site, gate-and-locate records, dwell-and-detention reporting — and they sit at the system-of-record layer rather than the execution-and-multi-tenant-orchestration layer above it. That gap is the operating-system gap the GXO operating standard exists to close, not by procuring a point tool but by productizing operating capability for the customer base.\n\nThe partner-technology productization template is the right way to read the rest of this. The repeatable motion under the GXO operating standard is documented across multiple partner technologies: identify a customer-side operating gap, pilot a partner technology at one site, validate the lift, scale across the multi-tenant network, embed into the operating standard, distribute across customer engagements as a GXO-branded capability inside contract-logistics service-level reporting. Agility Robotics is the canonical proof — pilot to industry-first commercial humanoid deployment and the first humanoid Robots-as-a-Service agreement. Apptronik walked the same path with a multi-phase R&D initiative around Apollo. Reflex Robotics walked it as the second humanoid RaaS agreement. Dexory walked it from a pilot at Oosterhout NL to expanding U.S. and European deployment for AI-powered inventory robotics. The yard-execution and multi-tenant orchestration layer is the obvious next entry in that catalog: it is multi-tenant from the data model up (which GXO Direct already requires), it generates the operating-KPI shape the operating-standard scorecard already measures (dwell, gate-to-dock, dock contention, shipper-specific appointment arbitration), and it travels across customer engagements the same way Digit, Apollo, Reflex, and Dexory did.\n\nThree things make the timing distinctive at GXO specifically, and they are not always open at the same time. First, Jacobs\'s first-90-days operating-standard scoping window for the Americas region opened in November 2025 — three decades of supply-chain operations behind a Ferguson tenure that explicitly named robotics, automation productivity, and AI-leveraged forecasting as the productization rhythm. The mandate is shaped to absorb the next adjacency. Second, Kelleher arrived from the exact partnership-productization motion this account requires — DHL Supply Chain NA, where the Boston Dynamics Stretch and Locus deployments became the public template for how partner technology enters a 3PL operating standard at scale. The familiar pattern is the cheap part of the conversation. Third, the Wincanton integration is in active SOP rewrite right now — Q1 2026 earnings call noted $60M run-rate synergies on track for year-end and "further opportunities" called out by the CFO. Operating standards are being rewritten across the UK side concurrently, which is the cleanest moment in a decade for a new layer to enter at integration speed rather than after. The unit of analysis is not "does GXO need a YMS" — GXO has yard tech where it needs records. The unit of analysis is whether the yard-execution layer is the right next entry in the operating-standard catalog at GXO Direct\'s multi-tenant surface, and whether it productizes the same 1-to-many way Agility, Apptronik, Reflex, and Dexory did.',
      pullQuote: 'The yard problem is not internal — it is customer-facing. Every facility you operate is a customer\'s yard.',
      caveat:
        'This is built from GXO Logistics public press releases, SEC filings, Q1 2026 earnings disclosures (May 7 2026), the public partnership track record (Agility Robotics, Apptronik, Reflex, Dexory), the Wincanton and Clipper acquisition disclosures, GXO Direct and GXO IQ launch materials, and the public executive disclosures for Kelleher and Jacobs. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: which GXO Direct multi-tenant sites are running shared-gate contention most acutely, where the Wincanton-integration SOP rewrite is most receptive to a new layer at the yard, and how the GXO IQ orchestration substrate plans to extend below the dock door.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the GXO operating standard',
      artifact: {
        imageSrc: '/artifacts/gxo-coverage-map.svg',
        imageAlt: 'GXO operating-standard coverage map. Six tiles representing the partner technologies and platforms that have entered the GXO operating-standard catalog. GXO IQ, Agility Robotics, Apptronik Apollo, Reflex Robotics, and GXO Direct are covered. The Yard Network Ops tile is unfilled, marked with a GXO red hairline outline.',
        caption: 'GXO operating-standard coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public GXO Logistics + GXO IQ + GXO Direct + partnership disclosures (Agility Robotics, Apptronik, Reflex, Dexory). Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America — bottled water at full weight, low margin, multi-temp at the premium SKU layer, with refill-returns flow. They are years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The read-across for GXO Logistics is not direct — GXO is not a CPG end-shipper — but it is the read-across that matters at this account: many of GXO\'s most demanding shipper customers (the consumer-vertical anchor accounts, the food-and-beverage shippers, the multi-tenant GXO Direct DC tenants) look operationally like Primo. They run multi-site networks with mature site-level yard tech already in place and they need the operating layer above it. Productizing the yard-execution layer into the GXO operating standard means many GXO customer engagements gain access to that operating model as a GXO-branded capability — the same way Agility Robotics Digit is now a GXO capability the customer doesn\'t source separately, the same way Apptronik Apollo and Reflex are becoming GXO capabilities, the same way Dexory inventory robotics expanded from one Oosterhout pilot to U.S. and European deployment. If the operating model lands on the operationally hardest CPG freight in the country, the productization read-across to GXO\'s shipper customer base is the easier lift — and it is what turns a single end-shipper deal into a 1-to-many distribution play across GXO\'s customer network. The partnership-economics question, in one line: is the yard-execution layer a GXO-branded capability the operating-standard catalog distributes across customer engagements (per-site SaaS plus rebill, multi-tenant revenue share at GXO Direct, white-label embed inside contract-logistics service-level reporting), the same commercial shape Agility and Apptronik already travel under — or a per-customer line item that peer 3PLs all under-deliver on equally.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The strongest pilot configurations at GXO are different from end-shipper pilots: (1) one GXO Direct multi-customer DC where shipper-specific appointment-window arbitration is the visible pain — by-definition multi-tenant, by-definition the cleanest A/B against single-tenant legacy tools; (2) one Wincanton-side UK site currently in active SOP integration, where operating-standard rewrite is already in motion; (3) one Americas-region site Jacobs identifies inside his first-90-days operating-standard scoping window, configured as a single-site pilot with KPIs that match the operating-standard scorecard format. We would expect the network to make sense of itself within two to four quarters of that first pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'gxo-public-press',
          source: 'GXO Logistics public press releases + SEC filings',
          confidence: 'public',
          detail: 'Anchors the 1,000+ global facilities figure, 200M+ sq ft, 150,000+ team members post-Wincanton, the Aug 2, 2021 XPO spin-off, the world\'s-largest-pure-play-contract-logistics positioning, and the Greenwich CT headquarters.',
          url: 'https://gxo.com/',
        },
        {
          id: 'gxo-wincanton-completion',
          source: 'GXO completes Wincanton acquisition (Apr 29, 2024)',
          confidence: 'public',
          detail: '£762M cash offer; added 16M+ sq ft of UK contract logistics; expected £45M (≈$60M) full annual net run-rate cost synergies by year three of integration. Made GXO sole shareholder of Wincanton. Q1 2026 earnings call confirmed $60M synergies on track for year-end 2026.',
          url: 'https://gxo.com/news_article/gxo-completes-acquisition-of-wincanton/',
        },
        {
          id: 'gxo-clipper-precedent',
          source: 'Clipper Logistics acquisition (Oct 2022)',
          confidence: 'public',
          detail: 'Closed October 2022 after UK regulatory clearance. Added 50+ sites, 10M sq ft, ~10,000 employees across the UK, Germany, and Poland. The precedent that proved the GXO integration motion at scale and the public reference point for the in-progress Wincanton SOP rewrite.',
          url: 'https://gxo.com/news_article/gxo-received-uk-regulatory-clearance-for-clipper-acquisition/',
        },
        {
          id: 'gxo-q1-2026-earnings',
          source: 'GXO Q1 2026 earnings call (May 7 2026)',
          confidence: 'public',
          detail: 'Q1 2026 revenue $3.3B, up 11%; adjusted EBITDA $200M, up 23%; adjusted diluted EPS $0.50, up 72%. Full-year 2026 adjusted EBITDA guidance raised to $935M–$975M. Wincanton synergies of $60M on track for year-end 2026; CFO Suchinski noted "further opportunities" in the broader integration.',
        },
        {
          id: 'gxo-iq-launch',
          source: 'GXO IQ launch (June 26 2025)',
          confidence: 'public',
          detail: 'First-of-its-kind AI-first platform for logistics; built on Google Cloud and Snowflake; informed by 20+ years of operational data; proprietary AI algorithms orchestrating inventory distribution and movement, order picking, packing, shipping, and staffing in real time. Customer-facing interface is "GIL," a persona-based interactive AI agent. Now powering GXO Direct in the U.S.; widely commercially available H2 2025.',
          url: 'https://gxo.com/news_article/gxo-launches-gxo-iq-a-first-of-its-kind-ai-first-platform-to-power-global-supply-chain-operations/',
        },
        {
          id: 'gxo-direct-multi-tenant',
          source: 'GXO Direct multi-tenant shared warehousing',
          confidence: 'public',
          detail: 'Launched 2018; nationwide network of multi-tenant sites; shared infrastructure, overhead, equipment, and workforce; transparent pay-as-you-grow pricing. Expanded mid-2025 with the PFSweb (PFS) acquisition to add a midsize-customer service tier. Multi-shipper trailer fleets behind shared gates under shipper-specific appointment-window arbitration — the multi-tenant yard problem in productized form.',
          url: 'https://gxo.com/supply-chain-mgmt/gxo-direct-shared-warehousing/',
        },
        {
          id: 'gxo-robotics-partnerships',
          source: 'GXO robotics partnership track record (Agility, Apptronik, Reflex, Dexory)',
          confidence: 'public',
          detail: 'Agility Robotics Digit: industry-first formal commercial humanoid deployment + first humanoid Robots-as-a-Service agreement; pilot successfully completed peak season with no service-level impact. Apptronik Apollo: multi-phase R&D initiative around dexterous humanoid for tote and box handling. Reflex Robotics: second humanoid RaaS pilot, general-purpose humanoid startup. Dexory: AI-powered inventory robotics, Oosterhout NL pilot expanding to U.S. and European deployment. The public template for how partner technology enters the GXO operating standard.',
        },
        {
          id: 'kelleher-tenure',
          source: 'Patrick Kelleher CEO appointment (effective Aug 19 2025)',
          confidence: 'public',
          detail: '33 years of global supply chain experience at DHL Supply Chain (Deutsche Post DHL Group). Most recently CEO, North America at DHL Supply Chain — the executive who oversaw the Boston Dynamics Stretch and Locus deployments, which is the exact partnership-productization motion required at GXO. Previously global chief development officer and CEO Americas for Williams Lea Tag under DHL ownership. Oversaw four M&A transactions in his prior year at DHL. Based at Greenwich CT global HQ.',
          url: 'https://gxo.com/news_article/gxo-announces-patrick-kelleher-as-chief-executive-officer/',
        },
        {
          id: 'jacobs-tenure',
          source: 'Michael Jacobs President Americas & Asia Pacific appointment (effective Nov 3 2025)',
          confidence: 'public',
          detail: 'Three decades of supply chain operations across consumer packaged goods, retail, and industrial. Most recently SVP Supply Chain at Ferguson Enterprises, where his scope explicitly included "transforming supply chain — improving service, increasing productivity through robotics and automation, and enhancing demand forecasting and product transit predictability by leveraging AI." Prior: worldwide distribution and e-commerce fulfillment at Keurig (best-in-class operating levels); global supply chain operations at Toys "R" Us across 33 countries. Succeeds Jorge Guanter. Based in Dallas. The regional operator-frame seat for the Americas operating standard.',
          url: 'https://gxo.com/news_article/gxo-announces-organizational-changes-to-accelerate-growth/',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges in multi-tenant 3PL operating contexts. These describe the conditions most contract-logistics networks operate under, not GXO specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant — most directly applicable to GXO via the "GXO\'s shipper customers look operationally like Primo" read-across, not as GXO\'s own internal metrics.',
        },
      ],
      unknowns: [
        'Which GXO Direct multi-tenant sites are running shared-gate contention most acutely today, and where the multi-shipper appointment-window arbitration load is heaviest',
        'Whether the Wincanton-integration SOP rewrite has reached the yard layer at the UK sites, or whether yard-side standardization is sequenced behind the warehouse-side integration',
        'Whether GXO IQ\'s orchestration substrate is intended to extend below the dock door (yard, gate, appointment, trailer) in a future release, or whether the yard is by-design out of scope for the platform as launched',
        'How shipper-specific appointment-window arbitration is handled today at the GXO Direct multi-customer sites — system logic, operator judgment, or per-customer per-site policy',
        'Which Americas-region sites Jacobs identifies inside his first-90-days operating-standard scoping window as candidates for new partner-technology pilots',
        'How the partnership economics would be structured for productization (per-site SaaS plus rebill, multi-tenant revenue share at GXO Direct, white-label embed inside contract-logistics service-level reporting) — Wincanton synergy capture is the relevant cost-out metric for the integrated network',
        'What KPI thresholds the GXO operating-standard scorecard requires for a partner-technology pilot to graduate from one-site validation into customer-base productization — the Agility Robotics walk (pilot → industry-first commercial humanoid + first humanoid RaaS) and the Apptronik walk (multi-phase R&D initiative) are public reference points, but the internal pass/fail thresholds and review cadence for net-new operating-standard entries are not',
        'How GXO\'s customer contracts treat embedded partner technology layered into contract-logistics service-level reporting — whether operating-standard productization for a yard-execution layer requires per-customer commercial amendment, per-engagement scoping, or rolls into existing master service agreements at the operating-standard layer the way Agility Digit and Apptronik Apollo already do',
        'Whether Kelleher\'s arrival from DHL Supply Chain NA (the Boston Dynamics Stretch and Locus deployments) means the partner-productization motion at GXO will accelerate to match the DHL cadence, or whether it will remain at the pre-Kelleher pace',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a partnership engagement, not a single-site procurement engagement. GXO Logistics is distinctive in this round because the question is not whether yard tech belongs in the 3PL operating model (it already does, at the system-of-record layer where deployed) but whether the yard-execution and multi-tenant orchestration layer above the records layer is the right next addition to the GXO operating standard — the same productization path Agility Robotics, Apptronik, Reflex, and Dexory have already taken inside GXO. Michael, your seat is the regional operator-frame seat for the Americas operating standard, in its first-90-days scoping window; the memo is shaped to that pattern, not to a vendor-procurement cadence. The water comparable is intentional. Primo Brands runs the operationally hardest CPG freight in the country, and many of GXO\'s most demanding shipper customers — the consumer-vertical anchors, the food-and-beverage shippers, the multi-tenant GXO Direct DC tenants — look operationally like Primo. Productizing the yard-execution layer into the GXO operating standard means many customer engagements gain it as a GXO-branded capability rather than as a separately sourced shipper tool.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Michael — the part most worth pushing back on is whether the partner-productization motion the GXO operating standard has run end-to-end with Agility, Apptronik, Reflex, and Dexory is currently scoped to a single next-adjacency pipeline, or whether the catalog is taking concurrent entries inside your first-90-days Americas scoping window — and where the yard-execution layer lands in that sequence if so. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts: an Americas-region operating-standard scoping session against the partnership scorecard, a GXO Direct multi-tenant site pilot conversation, or a working session that loops in the Wincanton-side integration team if the UK SOP rewrite has reached the yard — not necessarily a vendor demo.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'gxo-001',
      name: 'Michael Jacobs',
      firstName: 'Michael',
      lastName: 'Jacobs',
      title: 'President, Americas & Asia Pacific',
      company: 'GXO Logistics',
      email: 'michael.jacobs@gxo.com',
      linkedinUrl: 'https://www.linkedin.com/in/michael-jacobs-bb31a78/',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Operations',
      currentMandate:
        'Regional operator-frame seat for the Americas & Asia Pacific operating standard. Three decades of supply chain operations spanning consumer packaged goods, retail, and industrial. Most recently SVP Supply Chain at Ferguson Enterprises — where his scope explicitly included transforming supply chain through robotics, automation productivity, and AI-leveraged demand forecasting and transit predictability. Prior worldwide distribution and e-commerce fulfillment at Keurig (best-in-class operating levels) and global supply chain operations at Toys "R" Us across 33 countries. Effective November 3, 2025; based in Dallas. Reports up to CEO Patrick Kelleher.',
      bestIntroPath:
        'Direct outreach to the Americas & Asia Pacific seat — productization-coded framing inside the first-90-days operating-standard scoping window, not vendor-demo framing. Secondary path: reference the partnership-productization motion Patrick Kelleher ran end-to-end at DHL Supply Chain NA (Boston Dynamics Stretch, Locus) as shared context, since the same pattern translates exactly to GXO. Do not bypass Jacobs to the global CEO without his introduction — the Americas seat is the regional operating-standard seat by job description, and around-him routing breaks the productization motion.',
    },
    {
      personaId: 'gxo-002',
      name: 'Patrick Kelleher',
      firstName: 'Patrick',
      lastName: 'Kelleher',
      title: 'Chief Executive Officer',
      company: 'GXO Logistics',
      email: 'patrick.kelleher@gxo.com',
      linkedinUrl: 'https://www.linkedin.com/in/patrick-kelleher-gxo/',
      roleInDeal: 'influencer',
      seniority: 'C-level',
      function: 'Executive',
      currentMandate:
        'CEO since August 19, 2025; based at Greenwich CT global HQ. 33 years global supply chain experience at DHL Supply Chain. Most recently CEO, North America at DHL Supply Chain — the executive who oversaw the Boston Dynamics Stretch and Locus deployments, which is the exact partnership-productization motion required at GXO. Previously global chief development officer and CEO Americas for Williams Lea Tag under DHL ownership. Oversaw four M&A transactions in his prior year at DHL.',
      bestIntroPath:
        'Do not lead routing at CEO — the regional operator-frame seat (Jacobs) is the right entry. Reference Kelleher\'s prior tenure as shared context for why the partnership-productization motion translates exactly, since he ran the same pattern at DHL with Stretch and Locus.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'gxo-001',
        name: 'Michael Jacobs',
        firstName: 'Michael',
        lastName: 'Jacobs',
        title: 'President, Americas & Asia Pacific',
        company: 'GXO Logistics',
        email: 'michael.jacobs@gxo.com',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Michael Jacobs - President, Americas & Asia Pacific',
      variantSlug: 'michael-jacobs',

      framingNarrative:
        'Michael, the partnership-productization motion the GXO operating standard already runs end-to-end — identify a customer-side need, pilot a partner technology at one site, validate the lift, scale across the multi-tenant network, embed into the operating standard, distribute across customer engagements as a GXO-branded capability inside contract-logistics service-level reporting — is the motion Agility Robotics walked (industry-first commercial humanoid + first humanoid Robots-as-a-Service), Apptronik walked (multi-phase R&D initiative for Apollo), Reflex walked (second humanoid RaaS pilot), and Dexory walked (Oosterhout NL pilot expanding to U.S. and Europe). The yard-execution and multi-tenant orchestration layer is the natural next entry in that same operating-standard catalog — multi-tenant from the data model up (which GXO Direct already requires), generating exactly the operating-KPI shape the operating-standard scorecard already measures (dwell, gate-to-dock, dock contention, shipper-specific appointment arbitration), and traveling across customer engagements the same 1-to-many way the partner-technology catalog already does. Your Ferguson tenure named robotics + automation productivity + AI-leveraged forecasting as the productization rhythm explicitly. The pattern is familiar; the opening is the timing.',
      openingHook:
        'The partner-productization pattern, one layer over. Agility · industry-first commercial humanoid + first humanoid RaaS · Apptronik · multi-phase Apollo R&D · Reflex · second humanoid RaaS · Dexory · Oosterhout to U.S./EU. The yard-execution layer is the next operating-standard entry — multi-tenant from the data model up (GXO Direct requires it), partnership-economics-shaped (per-site SaaS plus rebill, multi-tenant revenue share, white-label embed in contract-logistics service-level reporting), operating-standard-scorecard KPIs from day one. First-90-days Americas scoping window opens now.',
      stakeStatement:
        'Three windows are open simultaneously, and they are not always open together. First, your own first-90-days operating-standard scoping window for the Americas region is open now (effective Nov 3 2025) — the cheapest moment in your tenure for a new layer to enter at scoping speed instead of after. Second, the Wincanton integration is in active SOP rewrite right now — Q1 2026 earnings called out $60M run-rate synergies on track and "further opportunities" inside the broader integration; operating standards are being rewritten across the UK side concurrently. Third, GXO IQ is the orchestration substrate the next operating-standard layer plugs into; the yard-execution layer is the multi-tenant data model GXO IQ does not yet reach below the dock door. The productization rhythm the GXO operating standard is already running at can absorb the next adjacency without disrupting the existing humanoid and inventory-robotics pipelines.',

      heroOverride: {
        headline: 'After Agility, Apptronik, Reflex, and Dexory — the yard-execution layer is the next entry in the GXO operating standard.',
        subheadline:
          'Multi-tenant from the data model up (which GXO Direct already requires). Partnership-economics-shaped (per-site SaaS plus rebill, multi-tenant revenue share at GXO Direct, white-label embed in contract-logistics service-level reporting). Productization, not procurement. Distributed across customer engagements, not bought for a single site. Your first-90-days Americas scoping window, the Wincanton integration SOP rewrite, and the GXO IQ orchestration substrate are open now — the partner-productization pattern, one layer over.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator / supply-chain register. Jacobs has run global supply chain operations across three decades and three categories (consumer packaged goods, retail, industrial); the Ferguson tenure named the productization rhythm explicitly (robotics + automation productivity + AI-leveraged forecasting). Acknowledge the existing yard-tech estate respectfully — the records-layer tools function as designed, the question is the execution and multi-tenant orchestration layer above them. Reference the Agility / Apptronik / Reflex / Dexory walks as shared context for the productization motion, not as flattery. Frameworks, costed assumptions, named comparison technologies. Multi-tenancy first; GXO Direct\'s shared-warehousing model is the right surface to lead with, not single-customer dedicated sites. Make the productization path explicit (pilot → site → operating standard → customer-base distribution), not implicit. Kelleher\'s prior tenure at DHL Supply Chain NA — where he ran the Boston Dynamics Stretch and Locus deployments — is shared context, not the routing path; cite it when it earns the citation.',
      kpiLanguage: [
        'multi-tenant dock orchestration',
        'shipper-specific appointment-window arbitration',
        'GXO Direct multi-tenant data model',
        'partnership-productization path',
        'operating-standard embed',
        'customer-experience surface',
        'first-90-days Americas scoping window',
        'Wincanton-integration SOP rewrite',
        'per-site SaaS plus rebill',
        'multi-tenant revenue share',
        'contract-logistics service-level reporting',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite as the operating-model proof — but the GXO-specific read-across is "GXO\'s shipper customers look operationally like Primo," not "GXO itself is Primo-shaped." Productization across GXO\'s customer base is what turns one operating-model proof into a 1-to-many distribution play. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount:
      '1,000+ facilities globally; 200M+ sq ft; 150,000+ team members post-Wincanton; world\'s largest pure-play contract logistics provider since the Apr 2024 Wincanton close. NA HQ Greenwich CT; Americas & Asia Pacific seat based in Dallas. UK is largest single market (303 warehouses, 42M sq ft pre-Wincanton; +16M sq ft Wincanton; +10M sq ft Clipper). GXO Direct: nationwide U.S. multi-tenant shared-warehousing network expanded with PFSweb',
    facilityTypes: [
      'Dedicated Customer Sites',
      'GXO Direct Multi-Tenant DCs',
      'E-commerce Fulfillment Centers',
      'Reverse Logistics Facilities',
      'Wincanton UK Contract Logistics Sites (16M+ sq ft)',
      'Clipper Logistics Omni-channel Retail Sites (UK / Germany / Poland)',
      'Cold-Chain and Specialty Logistics Sites',
    ],
    geographicSpread:
      'Global — UK (largest market post-Wincanton, 303 warehouses, 42M+ sq ft), United States, Continental Europe (France, Germany, Italy, Netherlands, Poland, Spain), Asia Pacific. NA HQ Greenwich CT; Americas & Asia Pacific seat Dallas. UK acquisitions: Wincanton (Apr 2024, £762M); Clipper Logistics (Oct 2022)',
    dailyTrailerMoves:
      'High-volume — modeled at network level across 1,000+ global facilities; multi-tenant yards behind shared gates at GXO Direct multi-customer DCs; different shipper trailer fleets compete for the same docks under shipper-specific appointment-window rules',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal', 'Parcel / Last-Mile (where engaged)', 'Cold-Chain Logistics'],
    avgLoadsPerDay:
      'High-volume — distributed across consumer goods, retail, e-commerce, technology, manufacturing, healthcare, and industrial customer engagements. GXO is a pure-play contract logistics provider — no asset-based trucking, no LTL fleet, no brokerage; loads-per-day is modeled at the customer-facing site layer, not at an internal asset fleet',
    specialRequirements: [
      'Multi-tenant dock orchestration at GXO Direct shared-warehousing sites',
      'Wincanton-integration SOP rewrite across UK contract logistics',
      'GXO IQ orchestration substrate integration (Google Cloud + Snowflake; "GIL" AI agent customer-facing surface)',
      'Pure-play structure — no asset-based trucking; unit of analysis is operating standard, not asset utilization',
    ],
  },

  signals: {
    recentNews: [
      'Q1 2026 earnings (May 7 2026): revenue $3.3B up 11%; adjusted EBITDA $200M up 23%; adjusted diluted EPS $0.50 up 72%; full-year 2026 adjusted EBITDA guidance raised to $935M–$975M; Wincanton synergies of $60M on track for year-end 2026.',
      'Michael Jacobs appointed President Americas & Asia Pacific (effective Nov 3 2025) — three decades of supply chain operations; Ferguson SVP Supply Chain background explicitly included robotics, automation productivity, and AI-leveraged forecasting; based in Dallas; succeeds Jorge Guanter.',
      'Patrick Kelleher appointed CEO (effective Aug 19 2025) — 33 years at DHL Supply Chain; most recently CEO DHL Supply Chain North America; oversaw Boston Dynamics Stretch and Locus deployments; based Greenwich CT.',
      'GXO IQ AI-first platform launched June 26 2025 — Google Cloud + Snowflake; persona-based AI agent "GIL"; informed by 20+ years of operational data; now powering GXO Direct in the U.S.; widely commercially available H2 2025.',
      'Wincanton acquisition completed Apr 29 2024 at £762M — added 16M+ sq ft of UK contract logistics; made GXO sole shareholder of Wincanton; $60M run-rate synergies expected by year-end 2026.',
      'Agility Robotics multi-year agreement — industry-first formal commercial humanoid deployment + first humanoid Robots-as-a-Service agreement; Digit deployment successful through peak season with no service-level impact.',
      'Apptronik Apollo multi-phase R&D initiative — dexterous humanoid for tote and box handling, working side by side with warehouse team members.',
      'Reflex Robotics pilot (second humanoid RaaS agreement) — general-purpose humanoid startup; live operations pilot.',
      'Dexory AI-powered inventory robotics — Oosterhout NL pilot expanding to U.S. and European deployment for automatic inventory reporting.',
      'GXO Direct enhanced solution for U.S. midsize companies — unifies the PFSweb (PFS) acquired services platform with GXO Direct\'s multi-tenant warehousing solution.',
    ],
    supplyChainInitiatives: [
      'Yard-execution layer productization candidate inside the partner-technology pilot → operating-standard → customer-base distribution pattern',
      'Multi-tenant yard orchestration across GXO Direct shared-warehousing sites and Wincanton-integrated UK contract logistics',
      'Operating-standard differentiation in the pure-play contract logistics category against asset-based 3PL competitors',
    ],
    urgencyDriver:
      'Three windows are open simultaneously and they are not always open. First, Jacobs\'s first-90-days operating-standard scoping window for the Americas region opened Nov 3, 2025 — the cheapest moment in his tenure for a new layer to enter at scoping speed instead of after; his Ferguson background (robotics + automation productivity + AI-leveraged forecasting) is the productization rhythm explicitly. Second, the Wincanton integration is in active SOP rewrite right now — Q1 2026 earnings called out $60M synergies on track and "further opportunities" in the broader integration; operating standards are being rewritten across the UK side concurrently. Third, GXO IQ is the AI-first orchestration substrate the next operating-standard layer plugs into; the yard-execution layer is the multi-tenant data model the platform does not yet reach below the dock door, and Kelleher\'s arrival from DHL Supply Chain NA (where he ran the Boston Dynamics Stretch and Locus partnerships) means the partner-productization motion is structurally familiar to the new CEO.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Productization template', body: 'Agility · industry-first commercial humanoid + first humanoid RaaS · Apptronik · multi-phase Apollo R&D · Reflex · second humanoid RaaS · Dexory · Oosterhout to U.S./EU.' },
    { mark: 'Wincanton integration', body: 'Apr 2024 close · £762M · 16M+ sq ft UK · $60M run-rate synergies on track for year-end 2026 · CFO Suchinski: "further opportunities."' },
    { mark: 'GXO IQ substrate', body: 'Launched June 2025 · Google Cloud + Snowflake · "GIL" AI agent · powering GXO Direct U.S. · the orchestration substrate the next operating-standard layer plugs into.' },
    { mark: 'Leadership window', body: 'Kelleher CEO Aug 19 2025 · ex-DHL Supply Chain NA CEO · ran Stretch + Locus. Jacobs Pres. Americas & Asia Pacific Nov 3 2025 · ex-Ferguson SVP Supply Chain · Dallas.' },
    { mark: 'Pure-play distinction', body: 'World\'s largest pure-play contract logistics provider since spin-off Aug 2 2021. No asset-based trucking. Unit of analysis is operating standard, not asset utilization.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/gxo.m4a',
    intro:
      'This brief is for Michael Jacobs. The partner-productization pattern the GXO operating standard already runs end-to-end — identify a customer-side need, pilot a partner technology at one site, embed it into the operating standard, distribute across the customer base — is the pattern that put Agility Digit into the industry\'s first commercial humanoid deployment, Apptronik Apollo into a multi-phase R&D initiative, Reflex into the second humanoid RaaS pilot, and Dexory from one Oosterhout NL pilot into expanding U.S. and European deployment. The thirty-seven minutes that follow are about the yard-execution layer fitting that same template.',
    chapters: [
      { id: 'yard-is-the-layer', label: 'The yard is the layer, not the tool', start: 0 },
      { id: 'after-agility-apptronik', label: 'After Agility, Apptronik, Reflex, Dexory — the next entry in the catalog', start: 449 },
      { id: 'shippers-like-primo', label: 'GXO\'s shipper customers look operationally like Primo', start: 899 },
      { id: 'how-this-was-built', label: 'How this analysis was built', start: 1348 },
      { id: 'push-back', label: 'The part most worth pushing back on', start: 1797 },
    ],
    generatedAt: '2026-05-14T22:30:00Z',
  },

  theme: {
    accentColor: '#E11D27',
  },
};
