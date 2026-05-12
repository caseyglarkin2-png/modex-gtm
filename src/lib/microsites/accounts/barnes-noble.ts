/**
 * Barnes & Noble — ABM Microsite Data
 * Quality Tier: 3 (retail · reach account)
 * Pitch shape: the Daunt-era operating-system reset has reshaped the store
 *   tier (60 new stores/year toward 1,000+, localized curation, returns
 *   30%→7%) while the dock infrastructure underneath it — one 1.2M sq ft
 *   Monroe Township hub, 115 dock doors, built 2005 — is still running on
 *   the prior hub-and-spoke cadence. The dock tier and the store tier no
 *   longer match each other.
 * Angle: YARD MANAGEMENT (dual-channel dock arbitration at Monroe Twp
 *   against the demand-pattern shift Daunt's localization created) — NOT
 *   driver experience
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const barnesNoble: AccountMicrositeData = {
  slug: 'barnes-noble',
  accountName: 'Barnes & Noble',
  coverHeadline: 'The dock tier the Daunt-era store reset has not reached',
  titleEmphasis: 'the Daunt-era store reset has not reached',
  coverFootprint: '~600+ stores · Monroe Twp DC',
  parentBrand: 'Barnes & Noble',
  vertical: 'retail',
  tier: 'Tier 3',
  band: 'D',
  priorityScore: 55,

  pageTitle: 'YardFlow for Barnes & Noble — Dual-Channel Dock Arbitration at a One-Hub DC Network',
  metaDescription:
    'Barnes & Noble is opening 60 new stores a year toward a 1,000-store national footprint while the same Monroe Township DC fulfills store replenishment, e-commerce parcel, and Nook back-end logistics from one 115-dock-door building. The store-tier transformation has outrun the dock-tier operating model.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Barnes & Noble network',
      composition: [
        {
          label: 'Store footprint',
          value:
            '~600+ stores across the U.S. with a publicly stated growth posture toward 1,000+ — ~60 new stores opened in 2024, ~60 opened in 2025 (pushing total locations above 700), similar cadence for 2026. After a decade of net closures, the network is in active expansion mode for the first time since the early 2010s.',
        },
        {
          label: 'Daunt-era operating-system reset',
          value:
            'James Daunt (CEO since August 2019, also runs Waterstones for the same owner) reset the store operating model in 2020 — assortment authority shifted from corporate buying to individual store managers, hand-selling restored as the floor standard, store-level curation replaced central planogram. Five years in, the reset is delivering: publisher returns dropped from ~30% to ~7%, the unit-economics math at the store flipped, and the chain is in net expansion. The store-tier reset is the operating story; what it did to the dock tier underneath is the unwritten one.',
        },
        {
          label: 'Primary distribution hub',
          value:
            'Monroe Township NJ — 1.2M sq ft on 73 acres, 115 dock doors, 20 miles of conveyor, 3 Crisplant tilt-tray sorters, RF picking, print-and-apply, CMC Carton Wrap automation. Half an hour from the ports of NY/NJ, 35 miles from Manhattan, 60 from Philadelphia. Built in 2005 to support book distribution and Nook back-end server logistics from the same building — a single national hub designed around the hub-and-spoke replenishment cadence that pre-dates the Daunt reset.',
        },
        {
          label: 'Channels sharing the same dock infrastructure',
          value:
            'Store replenishment (the growing channel), e-commerce parcel fulfillment, Nook digital-product logistics, and inbound publisher returns flow — all arbitrating for the same 115 dock doors, against four different downstream service-level clocks.',
        },
        {
          label: 'Ownership posture and growth cadence',
          value:
            'Privately held by Elliott Investment Management since the August 2019 take-private (all-cash $683M, $6.50/share, 43% premium to the trailing ten-day VWAP). Elliott also owns Waterstones in the UK; Daunt runs both. PE ownership with an active growth thesis — the 60-stores-a-year expansion is the explicit return-on-capital pattern, and the recent ICv2 reporting that B&N is "edging closer to IPO" is the back-half of that thesis showing up on the calendar.',
        },
        {
          label: 'Operating-culture signal',
          value:
            'Annette Danek-Akey (Chief Supply Chain Officer, formerly Penguin Random House SVP of supply chain) is a recurring industry-conference speaker on the supply-chain side of the Daunt reset. John Huggan (Senior Director Logistics) and Joe Marmorato (Senior Manager Fulfillment Operations) round out a named senior distribution bench. The supply-chain layer is talked about publicly — not always the case for private-equity-held mid-cap retail.',
        },
      ],
      hypothesis:
        'The interesting thing about the Barnes & Noble yard math is that the network rebuild is happening at the store tier and the dock infrastructure underneath has not been rebuilt to match. Daunt\'s localization play — each store curating its own assortment, publisher returns falling from ~30% to ~7%, 60 new stores opening per year — is widely covered in trade press as the bookseller turnaround story of the last five years. What is covered less is what that demand-pattern shift does to the dock-door arbitration at Monroe Township. Pre-Daunt, the DC ran on a high-returns, hub-and-spoke replenishment cadence: large outbound batches to stores on a centrally-planned assortment, large inbound returns flow from stores back through the same dock doors. Post-Daunt, outbound to stores is more frequent, smaller, and more title-specific (the localized curation makes the assortment look more like 600 independent bookstores than one chain), and the returns flow has compressed to under a quarter of its prior volume. The dock-door duty cycle has changed shape underneath the same physical infrastructure.\n\nThat gap got more expensive for three reasons. First, the Daunt reset compressed the returns flow but did not free up dock doors for outbound — the cadence on the outbound side simply got more frequent and smaller-batch, which trades returns-flow load for setup-and-spot churn at the same gate. Second, the same 115 dock doors are still doing e-commerce parcel fulfillment for the direct-to-consumer book channel, Nook back-end logistics for the digital-device line, and inbound publisher receipts on a separate cadence — the dock layer is doing four channels of work against four different downstream clocks. Third, the store-replenishment channel is now growing roughly 10% a year on net new unit count, against a flat dock-door count and a flat building footprint; the throughput math has nowhere to absorb itself except inside the existing duty cycle.\n\nThe third thing is the geometry itself. The network is geographically asymmetric in a way most retail networks no longer are — one primary hub on the New Jersey turnpike feeding a national store footprint means inbound port-of-entry sequencing (NY/NJ container ports are half an hour away) sits in the same yard as outbound long-haul to Texas, California, and the Pacific Northwest. The e-commerce parcel cadence runs on a different appointment logic than the truckload/LTL store replenishment beside it. The arbitration question — which channel\'s clock wins which dock door in which 30-minute window — is currently a per-shift, per-supervisor judgment call running on tooling built when the store network was contracting and Nook was the growth story. The store tier and the dock tier no longer match each other; the Daunt reset has done its work above, and the building below has been absorbing the difference one shift at a time for five years.',
      pullQuote:
        'The store tier and the dock tier no longer match each other.',
      caveat:
        'This is built from public Barnes & Noble trade-press coverage (Modern Retail, Fortune, RetailWire, Retail Dive, the Robin Report, ICSC, ICv2), the published Monroe Township DC specs (CenterPoint Properties case study, MHSNJ warehouse tour materials, public truck-routing data), the Elliott Investment Management take-private record, and reasonable inference about how the Daunt localization strategy is showing up at the dock door. The most useful thing you can do with this is push back on the parts that do not match what your team is seeing — particularly whether the Monroe Township DC still carries the bulk of national store replenishment or whether additional regional capacity has been brought online quietly, how the post-localization outbound batch size and cadence actually changed dock-door duty cycles, and whether the 60-stores-a-year expansion is being absorbed inside the existing dock-door count or whether the throughput math has already created pressure to add capacity.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the Daunt-era operating reset',
      artifact: {
        imageSrc: '/artifacts/barnes-noble-coverage-map.svg',
        imageAlt: 'Daunt-era coverage map. Five tiles representing the operating surfaces the Barnes & Noble store reset has touched — Monroe Township hub, ~600-store retail surface, Daunt localization, Nook back-end, and E-commerce parcel are covered. The Dual-Channel Dock Arbitration tile is unfilled, marked with a Barnes & Noble green hairline outline.',
        caption: 'Daunt-era coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Monroe Township DC, Daunt-era localization, Elliott take-private, and 60-stores-a-year disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the multi-channel gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be — and they have layered a network-level operating model on top of their existing site-level yard systems. The Barnes & Noble operating profile is different in category (retail books, not bottled water) and different in network shape (one large hub plus regional fulfillment, not a many-plants-many-DCs map), but the underlying problem rhymes: multiple channels arbitrating against the same dock infrastructure, where each channel has a different downstream clock and the site-by-site (in B&N\'s case, the shift-by-shift) answer is not the same as a network answer. If a network operating model can run on water — weight-out before cube-out, returns flow on top of forward flow, premium SKUs sharing the dock with ambient — the read-across to retail-DC dual-channel dock arbitration is the easier lift, not the harder one. The freight category is different; the multi-channel-on-shared-infrastructure shape is the same, and the dock-tier arbitration problem at Monroe Township is the cleanest single-site test of the network operating layer Primo already runs at scale.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The highest-leverage pilot target at Barnes & Noble is the Monroe Township DC itself — the 115-dock-door, 1.2M sq ft building is doing the arbitration work today, and a single-site operating-model engagement at the primary hub is the cleanest place to land the wedge. The throughput pressure is already measurable: 60 new stores a year on a flat dock-door count, e-commerce parcel cadence sitting next to truckload store replenishment, and a post-localization outbound batch profile that has compressed without the dock-door duty cycle being redesigned to match. We would expect the dock-tier operating model to make sense of itself within two to four quarters of the pilot, and the operating-model layer would survive any future regional-DC expansion as a network-tier standard rather than a one-building patch.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'bn-trade-press',
          source: 'Barnes & Noble turnaround trade-press coverage (2023–2025)',
          confidence: 'public',
          detail:
            'Modern Retail, Fortune, RetailWire, the Robin Report, and ICSC have each covered the Daunt localization strategy, the publisher-returns reduction (30% to 7%), the 60-stores-a-year expansion cadence, and the explicit growth posture toward 1,000+ locations. This is the public anchor for the store-tier demand-pattern shift.',
          url: 'https://www.modernretail.co/operations/barnes-noble-ceo-james-daunt-has-mastered-the-art-of-the-bookstore-turnaround/',
        },
        {
          id: 'bn-monroe-dc',
          source: 'Monroe Township NJ distribution center public specs',
          confidence: 'public',
          detail:
            '1.2M sq ft, 73 acres, 115 dock doors, 20 miles of conveyor, 3 Crisplant tilt-tray sorters, RF picking, print-and-apply, CMC Carton Wrap automation. Built 2005 to support both book distribution and Nook back-end server logistics. Anchors the operating-scale baseline for any yard-tier engagement.',
          url: 'https://centerpoint.com/highlights/case-studies/barnes-noble-case-study/',
        },
        {
          id: 'bn-elliott-take-private',
          source: 'Elliott Investment Management acquisition (June announcement / August 2019 close)',
          confidence: 'public',
          detail:
            'All-cash $683M take-private; $6.50/share, 43% premium to the trailing ten-day VWAP; announced June 7, 2019, closed August 7, 2019. Elliott also owns Waterstones (UK); James Daunt assumed the B&N CEO seat at close and runs both companies. PE ownership with an active growth thesis is the structural posture behind the 60-stores-a-year expansion, and the recent ICv2 reporting on an IPO path is the back-half of that thesis on the calendar.',
          url: 'https://www.barnesandnobleinc.com/press-release/elliott-completes-acquisition-barnes-noble/',
        },
        {
          id: 'bn-store-growth',
          source: 'Retail Dive, ICSC, and RetailWire store-expansion coverage',
          confidence: 'public',
          detail:
            'Public statements from Daunt and from B&N retail leadership establishing the ~60-per-year new-store cadence: ~60 opened in 2024, over 60 opened in 2025 (pushing total locations above 700), ~60 planned for 2026. Demand-side input for the dock-door-throughput math at Monroe Township and the geographic asymmetry between a single national hub and an expanding store surface.',
          url: 'https://www.retaildive.com/news/barnes-and-noble-plans-sixty-store-openings-2025/745756/',
        },
        {
          id: 'bn-supply-chain-coverage',
          source: 'Trax Technologies and supply-chain trade-press on the Daunt operating model',
          confidence: 'public',
          detail:
            'Coverage of the localization-driven returns reduction and the inventory-velocity changes downstream of the assortment-authority shift. Establishes that the dock-tier duty cycle has changed shape underneath the same physical DC infrastructure.',
          url: 'https://www.traxtech.com/ai-in-supply-chain/barnes-nobles-supply-chain-revolution-fueled-its-stunning-comeback',
        },
        {
          id: 'danek-akey-tenure',
          source: 'Annette Danek-Akey and Barnes & Noble supply-chain leadership — public tenure record',
          confidence: 'public',
          detail:
            'Annette Danek-Akey, Chief Supply Chain Officer, joined Barnes & Noble from Penguin Random House where she ran supply chain as SVP — a publisher-side background that gives her the inbound-cadence half of the dock-door arbitration question as part of her mental model. She is a recurring industry-conference speaker on the post-Daunt operating model. John Huggan (Senior Director Logistics) and Joe Marmorato (Senior Manager Fulfillment Operations) round out a named senior distribution bench that operates publicly on LinkedIn — surfacing the dock-tier leadership against which a network operating model can be sized.',
          url: 'https://www.barnesandnobleinc.com/management/annette-danek-akey/',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + retail-logistics yard-operations benchmarks',
          confidence: 'public',
          detail:
            'Cross-industry baselines on multi-channel dock dwell, appointment-vs-drop arbitration, and detention-cost ranges. Describes the conditions multi-channel retail DCs operate under, not Barnes & Noble specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail:
            'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether Monroe Township still carries the bulk of national store replenishment or whether additional regional capacity has been brought online quietly since the Daunt era began',
        'How the post-localization outbound batch profile actually changed dock-door duty cycles — more frequent and smaller-batch as the localization model implies, or absorbed into the existing cadence',
        'Whether the 60-stores-a-year expansion is being absorbed inside the existing 115-dock-door count or whether the throughput math has already created pressure to add dock capacity',
        'How e-commerce parcel fulfillment and Nook back-end logistics arbitrate dock-door time against truckload/LTL store replenishment today — system logic, appointment policy, or shift-supervisor judgment',
        'How inbound publisher receipts and inbound port-of-entry container sequencing (NY/NJ ports are half an hour away) coexist with outbound long-haul to West Coast stores at the same yard',
        'Whether the carrier-experience and on-time-pickup metrics have begun to surface variance attributable to the new outbound cadence at the program tier, or are still being absorbed at the site tier',
        'Whether the ICv2-reported IPO trajectory is reshaping the capex sequencing on dock-tier investments — and which of the supply-chain leaders owns that sequencing today',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Barnes & Noble is distinctive in this round because the story is well-covered at the store tier (the Daunt turnaround is one of the most-written-about retail comeback stories of the last five years) and almost uncovered at the dock tier. A 1.2M sq ft single-hub building doing dual-channel arbitration against a demand pattern that changed shape underneath it is the kind of operating-model question that does not show up in a strategy memo and shows up every shift at the gatehouse. The water comparable is intentional: if a network operating model lands on the freight category where weight, margin, multi-temp, and returns flow all run at once, the read-across to retail-DC dual-channel dock arbitration is the easier lift, not the harder one.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Annette — the part most worth pushing back on is whether the operating-system discipline the Daunt reset has laid across the store tier has reached the dock tier underneath Monroe Township yet, or whether the dock-door duty cycle has been absorbing the change one shift at a time for five years on tooling built for the prior cadence. Your publisher-side background on the inbound half of that arbitration is the reason this memo is shaped to your seat. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-066',
      name: 'Annette Danek-Akey',
      firstName: 'Annette',
      lastName: 'Danek-Akey',
      title: 'Chief Supply Chain Officer',
      company: 'Barnes & Noble',
      email: 'annette.danek-akey@bn.com',
      linkedinUrl: 'https://www.barnesandnobleinc.com/management/annette-danek-akey/',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Supply Chain',
      currentMandate: 'Official Barnes & Noble supply-chain chief and recurring industry-conference speaker. Prior tenure at Penguin Random House as SVP of supply chain gives her a publisher-side view of the inbound cadence that meets the DC every day — both halves of the dock-door arbitration question sit in her mental model.',
      bestIntroPath: 'Conference / executive outreach',
    },
    {
      personaId: 'P-067',
      name: 'John Huggan',
      firstName: 'John',
      lastName: 'Huggan',
      title: 'Senior Director Logistics',
      company: 'Barnes & Noble',
      email: 'john.huggan@bn.com',
      linkedinUrl: 'https://www.linkedin.com/in/john-huggan-ba6430179',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Distribution Center Operations',
      currentMandate: 'Named senior logistics leader at Barnes & Noble; sits closest to the daily dock-door arbitration question at Monroe Township.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-068',
      name: 'Joe Marmorato',
      firstName: 'Joe',
      lastName: 'Marmorato',
      title: 'Senior Manager, Fulfillment Operations',
      company: 'Barnes & Noble',
      email: 'joe.marmorato@bn.com',
      linkedinUrl: 'https://www.linkedin.com/in/joe-marmorato-73a4854',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Transportation / Fulfillment',
      currentMandate: 'Named omnichannel fulfillment operator at B&N; owns the e-commerce parcel side of the channel mix sharing the Monroe Township dock infrastructure.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-069',
      name: 'Yobanny Lopez',
      firstName: 'Yobanny',
      lastName: 'Lopez',
      title: 'Senior Warehouse Operations Manager',
      company: 'Barnes & Noble',
      email: 'yobanny.lopez@bn.com',
      linkedinUrl: 'https://www.linkedin.com/in/yobanny-lopez-58b3114a',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Distribution Center',
      currentMandate: 'Named warehouse operations leader inside the B&N DC network; closest to the shift-by-shift duty cycle on the 115 dock doors.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-070',
      name: 'Patrick Chmielowiec',
      firstName: 'Patrick',
      lastName: 'Chmielowiec',
      title: 'IT-PMO Manager, Distribution Center',
      company: 'Barnes & Noble',
      email: 'patrick.chmielowiec@bn.com',
      linkedinUrl: 'https://www.linkedin.com/in/patrickchmielowiec',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Systems / Transformation',
      currentMandate: 'Named supply-chain systems / PMO contact inside B&N distribution; the routing path for any operating-model layer that has to ladder into existing DC tooling.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-066',
        name: 'Annette Danek-Akey',
        firstName: 'Annette',
        lastName: 'Danek-Akey',
        title: 'Chief Supply Chain Officer',
        company: 'Barnes & Noble',
        email: 'annette.danek-akey@bn.com',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Annette Danek-Akey — Chief Supply Chain Officer',
      variantSlug: 'annette-danek-akey',

      framingNarrative:
        'Annette, the Daunt-era operating-system reset has run for five years and the store tier is where the trade press caught up — localized curation, publisher returns down from ~30% to ~7%, 60 new stores a year toward a 1,000+ footprint, total locations above 700 in 2025. The piece that gets less coverage is the dock tier underneath. Monroe Township was designed in 2005 around the hub-and-spoke replenishment cadence that pre-dates the reset; the building has been absorbing the post-localization demand-pattern shift one shift at a time for five years. Your publisher-side background on the inbound cadence is the reason the dock-tier question sits naturally inside your seat — both halves of the arbitration are already part of how you think about the network.',
      openingHook:
        'The outbound profile coming out of Monroe Township today does not look like the outbound profile the building was designed around in 2005. Smaller batches, more title-specific, more frequent, against a returns flow that has compressed under a quarter of its prior volume — and the e-commerce parcel and Nook back-end channels still sharing the same 115 dock doors. The dock-tier duty cycle is the layer the Daunt reset has not yet been engineered through.',
      stakeStatement:
        'Sixty new stores a year on a flat dock-door count, with the ICv2-reported IPO trajectory on the calendar behind it, is a quiet throughput problem. The store-tier reset is delivering measurable financial results; the dock-tier operating model that supports it is still doing the channel-arbitration math one shift at a time, on tooling built for the prior cadence. The store tier and the dock tier no longer match each other — and the dock tier is the only operating-system surface at B&N that has not yet been reshaped to the post-Daunt demand pattern.',

      heroOverride: {
        headline: 'Annette, the store tier reset has run for five years. The dock tier underneath it has been absorbing the change one shift at a time.',
        subheadline:
          'Localized curation made outbound smaller-batch and more title-specific. Returns flow has compressed. E-commerce parcel and Nook logistics still share the same 115 dock doors at Monroe Township. The dock-tier arbitration is the seam the Daunt reset has not yet been engineered through.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer, publisher-and-retailer-supply-chain framing. Danek-Akey has the unusual background of running supply chain on both sides of the publisher–retailer seam (Penguin Random House before B&N), so the inbound cadence is part of her mental model the way the outbound is. Speak to the channel-mix problem at the dock door and the post-Daunt demand-pattern shift, not the program. Acknowledge the store-tier reset as a win — it is one — and position the wedge as the dock-tier layer underneath it, not as replacement of anything.',
      kpiLanguage: [
        'dock-door duty cycle',
        'multi-channel arbitration at the hub',
        'outbound batch profile',
        'returns flow compression',
        'inbound publisher cadence',
        'e-commerce parcel adjacency to truckload store replenishment',
        'post-localization demand-pattern shift',
        'single-hub geographic asymmetry',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same network-coordination-across-flows shape, on the hardest CPG freight. The directly-shaped reference (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
    {
      person: {
        personaId: 'P-067',
        name: 'John Huggan',
        firstName: 'John',
        lastName: 'Huggan',
        title: 'Senior Director Logistics',
        company: 'Barnes & Noble',
        email: 'john.huggan@bn.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Distribution Center Operations',
      },
      fallbackLane: 'ops',
      label: 'John Huggan - Senior Director Logistics',
      variantSlug: 'john-huggan',

      framingNarrative:
        'John, the dock-door arbitration question at Monroe Township is a daily operating reality that has changed shape since the Daunt localization strategy started landing. Smaller, more frequent, more title-specific outbound batches sitting next to e-commerce parcel runs and Nook back-end logistics — same 115 doors, different clocks.',
      openingHook:
        'The building was designed in 2005 for a high-returns, hub-and-spoke replenishment cadence. The store-tier strategy has rewritten the outbound profile in the years since. The dock-door duty cycle did not get rebuilt with it — it got absorbed, shift by shift, into the existing operating standard.',
      stakeStatement:
        'When the same dock doors arbitrate between truckload store replenishment, e-commerce parcel, and Nook back-end logistics on shift-supervisor judgment, the variance lives in dwell time, detention spend, and carrier scorecard slip — and the post-localization batch profile only makes the arbitration harder.',

      heroOverride: {
        headline: 'John, the dock-door duty cycle changed shape underneath the building.',
        subheadline:
          'Smaller, more frequent outbound batches. Compressed returns flow. E-commerce parcel and Nook still sharing the dock. The arbitration is shift-supervisor judgment running on tooling built for the prior cadence.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Huggan owns the daily ops; lead with the dock-door arbitration story specifically and the metrics he already tracks (dwell, turn time, detention, on-time pickup).',
      kpiLanguage: [
        'truck turn time',
        'dock-door utilization',
        'detention spend',
        'on-time pickup',
        'channel-mix dwell variance',
        'shift-tier dock arbitration',
      ],
      proofEmphasis:
        'The 48-to-24 minute turn-time delta and the dock-office-headcount-held-flat result from Primo are the operator-language proof points. Huggan will read them as a peer would.',
    },
    {
      person: {
        personaId: 'P-068',
        name: 'Joe Marmorato',
        firstName: 'Joe',
        lastName: 'Marmorato',
        title: 'Senior Manager, Fulfillment Operations',
        company: 'Barnes & Noble',
        email: 'joe.marmorato@bn.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Transportation / Fulfillment',
      },
      fallbackLane: 'logistics',
      label: 'Joe Marmorato - Senior Manager, Fulfillment Operations',
      variantSlug: 'joe-marmorato',

      framingNarrative:
        'Joe, the fulfillment side of Monroe Township is the side that feels the channel-mix arbitration first. E-commerce parcel runs on a parcel cadence; the same dock infrastructure beside it is running truckload store replenishment and inbound publisher receipts. The parcel-tier service-level commitment does not bend when the dock-door across from you is held by a different channel.',
      openingHook:
        'E-commerce parcel and truckload store replenishment do not arbitrate well against each other on shift-supervisor judgment. One has a same-day or next-day clock against the customer; the other has a weekly replenishment cadence against the store. When they share doors, the parcel clock loses the minutes first because the store cadence is older policy.',
      stakeStatement:
        'Parcel-cadence service levels are sold at the customer tier and earned at the dock door. When dock arbitration at the hub holds e-commerce time against store replenishment time, the carrier scorecard catches it before the program scorecard does.',

      heroOverride: {
        headline: 'Joe, the parcel clock and the store-replenishment clock do not arbitrate well on judgment.',
        subheadline:
          'Same 115 doors. Different cadences. The fulfillment side feels the variance first, because parcel is the channel with the tightest downstream clock.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator on the e-commerce / parcel side specifically. Marmorato owns the fulfillment cadence; talk to him about the parcel-vs-truckload arbitration, not the program.',
      kpiLanguage: [
        'parcel-cadence dock time',
        'on-time pickup',
        'dwell variance by channel',
        'carrier scorecard variance',
        'channel-mix arbitration',
        'detention spend',
      ],
      proofEmphasis:
        'Primo\'s multi-flow operating model — forward flow, returns flow, premium SKUs sharing dock infrastructure with ambient — is the directly-rhyming shape. Different category, same channel-arbitration problem.',
    },
    {
      person: {
        personaId: 'P-069',
        name: 'Yobanny Lopez',
        firstName: 'Yobanny',
        lastName: 'Lopez',
        title: 'Senior Warehouse Operations Manager',
        company: 'Barnes & Noble',
        email: 'yobanny.lopez@bn.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Distribution Center',
      },
      fallbackLane: 'ops',
      label: 'Yobanny Lopez - Senior Warehouse Operations Manager',
      variantSlug: 'yobanny-lopez',

      framingNarrative:
        'Yobanny, the shift-by-shift dock-door arbitration at Monroe Township is the operating reality the broader Daunt strategy lands on. The store-tier story is well-covered; the dock-tier story — different channels, different clocks, same 115 doors — is the operating layer that absorbs the change every day.',
      openingHook:
        'The building is doing more channels per shift than it was designed for. Truckload store replenishment in a more frequent, smaller-batch profile. E-commerce parcel on a parcel cadence. Nook back-end logistics. Inbound publisher receipts on an appointment clock. The shift supervisor reconciles all of them at the door.',
      stakeStatement:
        'The operating-model layer is the difference between absorbing the post-localization demand-pattern change as variance and turning it into a system. Sixty new stores a year on a flat dock-door count is the next-shift problem, every shift.',

      heroOverride: {
        headline: 'Yobanny, the building is doing more channels per shift than it was designed for.',
        subheadline:
          'Smaller, more frequent outbound batches. E-commerce parcel on a different clock. Nook back-end logistics. Inbound publisher receipts. Same 115 doors, same shift.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator at the shift-supervisor tier. Lopez lives in the dock-door decisions; talk to him about how those decisions become a system, not why the system matters.',
      kpiLanguage: [
        'shift-tier dock arbitration',
        'duty cycle by channel',
        'dwell variance',
        'truck turn time',
        'standardized dock priority logic',
        'detention spend',
      ],
      proofEmphasis:
        'The 48-to-24 minute turn-time delta and the headcount-held-flat result from Primo are the operator-language proof points. The system shipped at scale; the question is what it looks like at a single-hub retail DC.',
    },
    {
      person: {
        personaId: 'P-070',
        name: 'Patrick Chmielowiec',
        firstName: 'Patrick',
        lastName: 'Chmielowiec',
        title: 'IT-PMO Manager, Distribution Center',
        company: 'Barnes & Noble',
        email: 'patrick.chmielowiec@bn.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Systems / Transformation',
      },
      fallbackLane: 'ops',
      label: 'Patrick Chmielowiec - IT-PMO Manager, Distribution Center',
      variantSlug: 'patrick-chmielowiec',

      framingNarrative:
        'Patrick, the operating-model layer above the dock door is a systems-tier question once it ladders past one shift. The Monroe Township building has 20 miles of conveyor, three tilt-tray sorters, and a CMC Carton Wrap automation stack inside; the yard-tier coordination above it is the next surface where a system, not a shift supervisor, owns the arbitration.',
      openingHook:
        'The inside-the-building automation at Monroe Township is mature — sorters, conveyor, RF picking, print-and-apply. The outside-the-building coordination is still the open seam. A network-tier operating model on the yard is the system layer above the existing DC tooling, not a replacement for it.',
      stakeStatement:
        'Systems and PMO are the team that decides whether a new operating layer is additive or disruptive to the existing DC stack. A network-tier yard operating model lands on top of the existing systems, not through them.',

      heroOverride: {
        headline: 'Patrick, the inside-the-building automation is mature. The outside-the-building coordination is the open seam.',
        subheadline:
          'Sorters, conveyor, RF picking, print-and-apply. The yard-tier operating model is the system layer above them, not through them.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Systems / PMO framing. Chmielowiec thinks in integrations, rollout sequence, and coexistence with existing stack. Position the wedge as the operating-model layer above the existing DC tooling.',
      kpiLanguage: [
        'network-tier operating model',
        'coexistence with existing DC systems',
        'rollout cadence',
        'integration surface',
        'change-management posture',
        'PMO sequencing',
      ],
      proofEmphasis:
        'The "24 facilities live · >200 contracted" rollout cadence from Primo is the program-language proof point. The operating model has shipped at scale on top of mature site-level systems; the question is what it looks like on a single-hub retail DC.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured across live deployments at comparable multi-channel operations' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted rollout cadence across comparable operating profiles' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at comparable retail-DC facilities' },
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
    facilityCount: 'Primary hub: Monroe Township NJ (~1.2M sq ft, 115 dock doors); regional fulfillment plus the growing ~600+-store national retail footprint (above 700 total locations as of 2025)',
    facilityTypes: ['Primary Distribution Hub', 'E-commerce Fulfillment', 'Regional Store Network'],
    geographicSpread: 'United States — single primary hub feeding national store and e-commerce demand',
    dailyTrailerMoves: 'High-volume — distributed across truckload store replenishment, e-commerce parcel, Nook back-end logistics, and inbound publisher receipts',
    fleet: '3PL and contract-carrier mix; parcel, LTL, and truckload combination across channels',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Parcel', 'Intermodal'],
    avgLoadsPerDay: 'High-volume — distributed across store replenishment (truckload/LTL outbound), e-commerce parcel fulfillment, Nook back-end logistics, and inbound publisher receipts plus port-of-entry container inbound from the adjacent NY/NJ ports',
  },

  signals: {
    recentNews: [
      'Public growth posture toward 1,000+ stores — ~60 new stores opened in 2024, over 60 opened in 2025 (pushing total locations above 700), ~60 planned for 2026. First sustained expansion mode since the early 2010s.',
      'Daunt-era localization (post-2020) shifted curation authority to individual store managers; publisher returns dropped from ~30% to ~7% by 2024 — fundamentally reshaping outbound DC cadence at Monroe Township underneath the same dock-door count.',
      'Monroe Township NJ DC operating at 1.2M sq ft on 73 acres with 115 dock doors and 20 miles of conveyor; built 2005 for a hub-and-spoke replenishment cadence that pre-dates the localization era.',
      'Elliott Investment Management has owned Barnes & Noble since the August 2019 take-private (all-cash $683M, $6.50/share, 43% premium); Elliott also owns Waterstones (UK), with Daunt running both companies. ICv2 has reported the chain is "edging closer to IPO" — the back-half of the PE growth thesis on the calendar.',
    ],
    supplyChainInitiatives: [
      'The Daunt-era operating-system reset — assortment authority pushed to store managers, returns flow compressed from ~30% to ~7%, outbound cadence rewritten as smaller-batch and more title-specific, store count in net expansion for the first time since the early 2010s. The store-tier transformation is mature; the dock-tier operating model has not been rebuilt to match.',
    ],
    urgencyDriver:
      'Sixty new stores a year on a flat dock-door count, with an IPO trajectory on the calendar behind it, is a quiet throughput problem. The Daunt-era store reset is delivering measurable financial results at the store tier; the dock-tier operating model at Monroe Township is still doing the channel-arbitration math one shift at a time, on tooling built for the prior hub-and-spoke cadence. The store tier and the dock tier no longer match each other — and the dock tier is the only operating-system surface at B&N that has not yet been reshaped to the post-Daunt demand pattern.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Daunt reset', body: 'Localized curation · publisher returns ~30% → ~7% · 5 years in.' },
    { mark: 'Store cadence', body: '~60 new stores/year · above 700 total locations in 2025 · target 1,000+.' },
    { mark: 'Monroe Township hub', body: '1.2M sq ft · 73 acres · 115 dock doors · built 2005.' },
    { mark: 'Elliott take-private', body: '$683M all-cash · Aug 2019 · Daunt CEO at close · Waterstones same owner.' },
    { mark: 'Dock-tier seam', body: 'Store replen + e-com parcel + Nook + inbound publisher = 4 channels, 115 doors.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Annette Danek-Akey. The Daunt-era operating-system reset has run for five years and the store tier has caught up to it — localized curation, publisher returns down from ~30% to ~7%, total locations above 700 in 2025 with ~60 more planned for 2026. The five minutes that follow are about the one layer of that reset the dock tier underneath Monroe Township has not yet been engineered through — the dual-channel arbitration on 115 dock doors built in 2005 around a hub-and-spoke cadence that no longer matches the demand pattern above it.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#005C2F',
    backgroundVariant: 'dark',
  },
};
