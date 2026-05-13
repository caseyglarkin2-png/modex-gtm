/**
 * Honda — ABM Microsite Data
 * Quality Tier: A+ (Tier 3, Band D — automotive, JIT-native manufacturer)
 * Pitch shape: JIT-extension wedge framed against the Ohio EV Hub flex-line
 * as the operating-system thread that survived the March 2026 reversal.
 * Honda spent ~$1B retooling Marysville Auto Plant, East Liberty Auto Plant,
 * and Anna Engine Plant for the Ohio EV Hub through 2024-2025, then in March
 * 2026 cancelled the all-EV roadmap (¥2.5 trillion / ~$15.7B in losses) and
 * pivoted Marysville and East Liberty back to flex-line production of ICE,
 * hybrid, and BEV variants on the same lines. The L-H Battery JV in
 * Jeffersonville OH (~$3.5B build, ownership consolidated to Honda via the
 * Feb 2026 sale-and-leaseback at W4.2 trillion / ~$2.9B) began battery
 * production on schedule in late 2025 to feed IPU sub-assembly at
 * Marysville. Sony Honda Mobility cancelled AFEELA 1 production March 25,
 * 2026; the East Liberty trial-build line redirected.
 *
 * Phase 10 A+ uplift: Ohio EV Hub flex-line is the operating-system thread
 * that survives the reversal, cell inbound staging, and AFEELA cancellation
 * — the yard layer above the dock is the seam the operating system has not
 * yet been pushed into. Adds: coverage-map artifact (5 plant tiles +
 * YARD NETWORK OPS unfilled in Honda red #CC0000); composition rows
 * extended (Ohio EV Hub flex-line + post-EV-reversal + L-H Battery JV +
 * AFEELA cancellation); Primo-to-JIT-extension closing on the comparable;
 * supply-chain leader tenure source + new methodology unknowns; Jim Small
 * first-name-personalized about + signOff; personVariants[0] rewrite;
 * marginalia (5-6 items); audio brief override.
 *
 * Public anchors:
 *  - 13 plants in North America; 700 OEM suppliers; $35B+ in NA parts purchases (2025)
 *  - Marysville Regional Logistics Centre (RLC): 200,000 sq ft, ~2,500 part
 *    numbers, ~130 employees, handles imported material from Japan
 *  - Honda Trading Group coordinates global parts logistics; on the inbound-
 *    lane side of the yard handoff into the assembly plants
 *  - "Flexibility for Tomorrow" was the 2025 NA supplier-conference theme
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';


export const honda: AccountMicrositeData = {
  slug: 'honda',
  accountName: 'Honda',
  coverHeadline: 'The yard layer above the Ohio EV Hub flex-line',
  titleEmphasis: 'above the Ohio EV Hub flex-line',
  coverFootprint: '13 NA plants · post-reversal flex',
  parentBrand: 'Honda',
  vertical: 'automotive',
  tier: 'Tier 3',
  band: 'D',
  priorityScore: 63,

  pageTitle: "Honda · JIT assembly in the middle of a flex-line reversal — the yard layer above the Ohio EV Hub",
  metaDescription:
    "Honda retooled Marysville, East Liberty, and Anna for the Ohio EV Hub through 2024-2025, then in March 2026 reversed the all-EV roadmap and pivoted the same plants back to flex-line ICE/hybrid/BEV production. The L-H Battery JV in Jeffersonville is live. The yard between 700 inbound suppliers and the assembly dock is the one operating layer the flex-line reversal didn't touch.",

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Honda U.S. network',
      composition: [
        {
          label: 'U.S. plant footprint',
          value: 'Marysville Auto Plant (Marysville OH — flagship, now flex-line ICE/hybrid/BEV after the March 2026 reversal; first BEV based on the Acura Performance EV Concept was scheduled here for late 2025), East Liberty Auto Plant (East Liberty OH — flex-line, scheduled to assemble Sony Honda Mobility AFEELA 1 starting fall 2025 before the March 2026 cancellation redirected the trial-build line), Anna Engine Plant (Anna OH — retooled inside the Ohio EV Hub envelope), Honda Manufacturing of Alabama (Lincoln AL — Odyssey, Pilot, Passport, Ridgeline, V6 engines), Honda Manufacturing of Indiana (Greensburg IN — Civic, CR-V Hybrid). ~13 plants total in North America.',
        },
        {
          label: 'Ohio EV Hub flex-line architecture',
          value: '~$1B retooling investment across Marysville, East Liberty, and Anna through 2024-2025 to set up flexible production capable of building ICE, hybrid, and BEV on the same lines. Same body shop, same paint shop, same assembly trim line; the variant arbitration happens inside the line, not between lines. ~300 associates at Marysville upskilled for IPU (battery module + controlling hardware/software) sub-assembly to feed the assembly side at both Marysville and East Liberty. The flex-line architecture is the operating-system thread that runs through everything the reversal did and did not touch.',
        },
        {
          label: 'Post-EV-reversal operating context',
          value: 'Honda cancelled its all-EV roadmap and the 0 Series rollout in March 2026 — estimated ¥2.5 trillion (~$15.7B) in losses — and pivoted Marysville and East Liberty back to ICE-and-hybrid as the volume product on the existing flex-line architecture. The retool capex stays capitalized; the variant mix the lines now arbitrate across is different than the one they were retooled for. ICE plus hybrid plus a smaller BEV slice, on the same line, fed by the same 700-supplier inbound network. The flex-line worked exactly as designed — it absorbed the strategy reshuffle the way it was supposed to absorb a model-year changeover.',
        },
        {
          label: 'L-H Battery JV cell-inbound node',
          value: 'L-H Battery Company (LG Energy Solution + Honda JV) in Jeffersonville OH — ~$3.5B build, 2,200 jobs, pouch-type lithium-ion. Mass production began on schedule in late 2025; building ownership consolidated to Honda for ~₩4.2 trillion (~$2.9B) in February 2026 with LG continuing to operate under a lease. Cells feed the Marysville IPU sub-assembly that supplies both Ohio assembly plants. The Jeffersonville-to-Marysville cell lane is single-source, weight-heavy, hazmat-classified, and load-bearing for the BEV slice of every flex line it feeds — a freight profile that did not exist in the operating model two years ago.',
        },
        {
          label: 'Sony Honda Mobility AFEELA cancellation',
          value: 'Sony Honda Mobility cancelled AFEELA 1 production on March 25, 2026; the East Liberty trial-build line had been scheduled to assemble first AFEELA units starting fall 2025. The redirect leaves a fresh-paint operating pattern at East Liberty that has not yet hardened into the post-reversal flex-line cadence the rest of the plant will settle into. The trial-build line cleared scope is unusually narrow — the dock-side operating habits, milkrun choreography, and inbound staging routine at that line are still being authored, not inherited.',
        },
        {
          label: 'Inbound supplier base',
          value: '~700 OEM suppliers across North America feeding 13 plants. ~$35B in North American parts purchases in 2025 to support more than 1.52 million Honda and Acura vehicles. Honda Trading Group coordinates a meaningful share of imported-parts logistics; the Marysville Regional Logistics Centre (200,000 sq ft, ~2,500 part numbers, ~130 employees across three shifts) is the Japan-import anchor for the Ohio assembly network.',
        },
        {
          label: 'Operating philosophy',
          value: 'Honda was the second JIT-at-scale operating system in North America (after Toyota). Andon-cord stop authority, kaizen continuous-improvement discipline, and standardized-work practice are deep at the plant level. The 2025 NA supplier theme was "Flexibility for Tomorrow" — flex-line production at Marysville and East Liberty is the operational expression of that thesis, and the yard layer above the dock is the one operating surface where the same discipline has not yet been pushed into a measurable network standard.',
        },
      ],
      hypothesis:
        "The interesting thing about Honda's yard math is that the operating-system thread runs through everything the strategy reshuffle did and did not touch — and the Ohio EV Hub flex-line is the thread itself. Through 2024 and into early 2025 the obvious framing would have been the Ohio EV Hub greenfield: Marysville retooled, East Liberty retooled, Anna retooled, a $1B campus-wide build-out designed to extend the JIT discipline into a new variant set with no legacy displacement cost. That framing changed shape in March 2026. Honda took an estimated ¥2.5 trillion in losses, cancelled the all-EV roadmap, and pivoted the same flex lines back to ICE and hybrid as the volume product. The flex-line architecture is intact. The cell inbound from the L-H Battery JV in Jeffersonville started on schedule in late 2025. The IPU sub-assembly at Marysville is staffed and trained. What changed is the variant mix the flex line now has to arbitrate across — ICE plus hybrid plus a smaller BEV slice, on the same line, fed by the same 700-supplier inbound network, with the same Honda Trading Group lanes and the same Marysville RLC handling the Japan-import side. The flex-line did its job — it absorbed the strategy reshuffle the way it was supposed to absorb a model-year changeover.\n\nInside the plant, Honda's JIT discipline is built to absorb that kind of mix change. Line-side rack discipline, andon-cord authority, and kaizen-iterated standardized work are mature. Inside the gatehouse, the same maturity holds. Between the gate and the dock — the yard layer — the operating system has been operating below the visibility threshold the rest of the production discipline runs to. Schedulers run on radios, gate guards know which carriers run which milkruns, dock priority gets arbitrated locally and shift-by-shift. That is the same execution architecture most North American assembly yards use, and at most manufacturers it is good enough. At a Honda assembly plant running flex-line production with line-side inventory measured in hours, it is the one layer of the JIT chain still on the pre-Production-System standard. The kanban-pull signal works because the part is there. The kanban signal cannot pull a part that hasn't reached the dock.\n\nThe variance budget got tighter in the last three years for two compounding reasons. First, the flex-line mix change — ICE plus hybrid plus BEV on one line means more SKUs, more carriers, more milkrun routes, and more dock-door arbitration decisions per shift than the same plant made before. Second, the cell-inbound flow from Jeffersonville OH into the Marysville IPU sub-assembly opened up a single-source, weight-heavy, hazmat-classified lane that did not exist in the operating model two years ago and is now load-bearing for the whole BEV slice of every flex line it feeds. The AFEELA-1 cancellation on March 25, 2026 redirected the East Liberty trial-build line and left a fresh-paint operating pattern that has not yet hardened. The opportunity isn't replacing Honda's JIT discipline; nobody is going to replace it. The opportunity is extending it — standardized work, sequenced flow, andon-equivalent stop authority — to the yard layer above the dock, while the post-reversal operating pattern is still settling and the cost of standardizing is lowest. Marysville is the highest-leverage single site in the portfolio: flagship assembly, the IPU sub-assembly is parked here, the cell inbound from Jeffersonville lands here, and the flex-line mix arbitration is hardest here. East Liberty is the second-highest because the AFEELA-1 line redirect leaves a fresh-paint operating pattern that has not yet hardened.",
      pullQuote: "The kanban signal cannot pull a part that hasn't reached the dock.",
      caveat:
        "This is built from public Honda disclosures (the Ohio EV Hub investment record, the LG-H Battery JV timeline and the February 2026 sale-and-leaseback, the March 2026 EV-roadmap reversal and AFEELA production cancellation, and the 2025 supplier-conference disclosures), automotive trade-press coverage, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don't match what your team is seeing: whether the post-March-2026 flex-line variant mix is actually showing up as dock-door arbitration cost at Marysville and East Liberty, how the L-H Battery cell inbound from Jeffersonville is being staged today (segregated lanes, dedicated dock, or co-mingled with conventional parts inbound), how the AFEELA-1 production cancellation is reshaping the East Liberty trial-build operating pattern, where the Marysville RLC handoff into the assembly-plant receiving yards lives in current operating practice, and how much of the yard-execution scope falls inside Honda Trading Group's lane-planning remit versus the receiving plant's gate operations.",
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the Ohio EV Hub flex-line',
      artifact: {
        imageSrc: '/artifacts/honda-coverage-map.svg',
        imageAlt: 'Honda Ohio EV Hub flex-line coverage map. Six tiles representing the Honda North American operating footprint. Marysville Auto, East Liberty Auto, Anna Engine, Lincoln AL HMA, and the L-H Battery JV in Jeffersonville are covered. The Yard Network Ops tile is unfilled, marked with a Honda red hairline outline.',
        caption: 'Honda Ohio EV Hub flex-line coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Honda Ohio EV Hub investment disclosures, L-H Battery JV announcements, and the March 2026 EV-roadmap reversal record. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        "Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you can't recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by refillable-format return logistics. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Honda operating profile is a different vertical with the same structural shape: multi-site, multi-supplier, multi-input, with mature in-plant operating discipline already in place and the network-level yard layer above the sites as the unsolved seam. The freight comparison runs the opposite direction from the usual read-across — Primo's freight is harder per case, but a Honda flex-line plant has a tighter tolerance per minute than any beverage plant in the country. If a network operating model can run on water — the operationally hardest CPG freight — the read-across to a JIT-flex automotive network is a different vertical with the same shape, not a harder lift. The hard-freight discipline translates down to the JIT-assembly cadence; if a bottled-water network can dock-turn in 24 minutes, the line-side delivery window is the same physics. The shape Primo built above its plants is the same shape Honda's JIT discipline would extend above the dock: standardized work, sequenced flow, and stop-authority at the layer that today still runs on radios.",
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        "30-60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot targets at Honda are different in kind: (1) Marysville Auto Plant, because it is the flagship, the IPU sub-assembly is parked there, the L-H Battery cell inbound from Jeffersonville lands there, and the flex-line variant-mix arbitration is hardest there — making it the site where any network-wide standard ultimately has to prove out under the tightest JIT tolerance in the portfolio; (2) East Liberty Auto Plant, because the AFEELA-1 production cancellation in late March 2026 redirected the trial-build line and the operating pattern at the dock has not yet hardened, which makes it the cleanest place in the network to set a new yard-layer standard before the post-reversal flex-line cadence settles. The operating model makes sense of itself across the rest of the assembly footprint (Anna, Greensburg IN, Lincoln AL) within two to four quarters of the pilot.",
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'honda-public-network',
          source: 'Honda public manufacturing and supply-chain disclosures',
          confidence: 'public',
          detail: 'Anchors the 13-plant North American footprint (Marysville OH, East Liberty OH, Anna OH, Greensburg IN, Lincoln AL, and the rest), the ~700 OEM supplier base, the $35B in 2025 North American parts purchases, and the Marysville Regional Logistics Centre profile (200,000 sq ft, ~2,500 part numbers, ~130 employees).',
          url: 'https://hondainamerica.com/',
        },
        {
          id: 'honda-ev-hub',
          source: 'Honda Ohio EV Hub investment disclosures',
          confidence: 'public',
          detail: '~$1B retooling investment across Marysville Auto Plant, East Liberty Auto Plant, and Anna Engine Plant through 2024-2025 to enable flexible production of ICE, hybrid, and BEV on the same lines. ~300 associates at Marysville upskilled for IPU sub-assembly to feed both Ohio assembly plants. The flex-line architecture is the operating-system thread that survived the March 2026 reversal intact.',
          url: 'https://hondanews.com/en-US/electrification/releases/release-e4e72a01e246a738c5d003060c00bc34-honda-ev-hub-prepares-for-new-level-of-flexible-production-in-reimagined-manufacturing-environment',
        },
        {
          id: 'honda-lg-jv',
          source: 'L-H Battery Company (LG Energy Solution + Honda JV) Jeffersonville OH',
          confidence: 'public',
          detail: '~$3.5B build, 2,200 jobs, pouch-type lithium-ion battery production began on schedule in late 2025 to feed the Marysville IPU sub-assembly that supplies both Ohio assembly plants. In February 2026, LG Energy Solution sold the building to Honda for ~₩4.2 trillion (~$2.9B) with LG continuing to operate the facility under a lease — no announced change to production or operational plans.',
          url: 'https://lgeshonda.com/',
        },
        {
          id: 'honda-ev-reversal',
          source: 'Honda all-EV roadmap reversal and AFEELA-1 production cancellation (March 2026)',
          confidence: 'public',
          detail: 'Honda cancelled its all-EV roadmap and the 0 Series rollout in March 2026, taking estimated ¥2.5 trillion (~$15.7B) in losses and pivoting Marysville and East Liberty back to ICE-and-hybrid volume on the existing flex-line architecture. Sony Honda Mobility cancelled AFEELA 1 production on March 25, 2026, with the East Liberty trial-build line redirected. The flex-line capex stays capitalized; the variant mix the lines now arbitrate is the post-reversal mix, not the all-EV mix the retool was sized against.',
          url: 'https://eu.detroitnews.com/story/business/autos/2026/03/26/honda-put-the-brakes-on-its-all-ev-future-heres-why/89227692007/',
        },
        {
          id: 'honda-trading-logistics',
          source: 'Honda Trading Group North America logistics disclosures',
          confidence: 'public',
          detail: 'Coordinates a meaningful share of inbound parts logistics for the Honda assembly network in North America, including imported material from Japan into the Marysville RLC. The lane-planning-to-receiving-yard handoff at the Ohio assembly plants is one of the seams the operating model runs through; specifics on which lanes Honda Trading owns versus contract carriers are not fully public.',
          url: 'https://www.hondatrading.com/en/casestudy/parts.html',
        },
        {
          id: 'honda-supply-chain-leadership',
          source: 'Honda Logistics North America senior leadership — public tenure record',
          confidence: 'public',
          detail: 'Jim Small serves as Senior Vice President of Honda Logistics North America with public LinkedIn-disclosed tenure on the operating seam between Honda Trading Group lane planning, the Marysville Regional Logistics Centre, and the receiving yards at the Ohio assembly plants. Derek Johansen sits as senior executive over inbound supply, warehousing, and outbound automotive-parts distribution. David Van Brimmer is Senior Operations Manager. Ed Allison is CFO of Honda Logistics North America. The four-person operating-leader stack is the routing surface this brief is sized against; specifics on internal portfolio splits between the Ohio assembly network, Honda Manufacturing of Alabama, and Honda Manufacturing of Indiana are not fully public.',
          url: 'https://www.linkedin.com/in/jim-small-b94760b0',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + automotive-industry yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, detention-cost ranges, and JIT-window adherence at multi-site assembly networks. These describe the conditions most North American assembly yards operate under, not Honda specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether the post-March-2026 flex-line variant mix at Marysville and East Liberty has already shown up as dock-door arbitration cost — or whether the JIT-discipline absorbing margin still has slack at this volume',
        'How the L-H Battery cell inbound from Jeffersonville OH into the Marysville IPU sub-assembly is being staged today (segregated lanes, dedicated dock, or co-mingled with conventional parts inbound) — and whether the cell receiving cadence is treated as a separate kanban tier or folded into the existing milkrun pattern',
        'How the AFEELA-1 production cancellation is reshaping the East Liberty trial-build operating pattern through the rest of 2026 — and whether the redirected line has hardened into a new variant cadence yet or still sits in the fresh-paint window where a new yard-layer standard could be authored before the cadence sets',
        'Where the Marysville Regional Logistics Centre handoff into the assembly-plant receiving yards lives in current operating practice — what is owned by the RLC versus the plant gate, and whether the RLC operating cadence runs to the same standardized-work threshold the assembly side runs to',
        'How much of the inbound-lane planning falls inside Honda Trading Group versus the receiving plants — and how the milkrun cascade between Japan-import flow and domestic-supplier flow is arbitrated at the gate',
        'Which Honda assembly plant has already started feeling the flex-line inbound-mix expansion at the dock first — Marysville, East Liberty, or one of the multi-product plants (Lincoln AL Odyssey/Pilot/Passport/Ridgeline mix, Greensburg IN Civic/CR-V Hybrid mix)',
        'Whether the post-reversal flex-line cadence has been carried back into the standardized-work scope at the Ohio campus as an explicit yard-layer problem, or is still being treated as a plant-by-plant local adjustment under the existing JIT discipline',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        "Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Honda is distinctive in this round because the analytical wedge sits in a narrow operating window: the Ohio EV Hub flex-line is the operating-system thread that runs through everything the March 2026 reversal did and did not touch. The retool is complete, the L-H Battery cell inbound from Jeffersonville is live, the all-EV reversal redirected the flex lines back to ICE-and-hybrid volume, and the AFEELA-1 cancellation reshaped the East Liberty trial-build cadence. The flex-line architecture and the JIT discipline that runs the inside of the plant are intact through all of that. The yard layer between the 700-supplier inbound network and the assembly dock is the operating layer the reversal didn't touch — and the period where the post-reversal pattern is still settling is when standardizing that layer costs least.",
      authorEmail: 'casey@freightroll.com',
      signOff:
        "Jim — you live at the operating seam between Honda Trading Group lane planning, the Marysville RLC, and the receiving yards at the Ohio assembly plants. The part most worth pushing back on is whether the flex-line variant mix is already showing up as dock arbitration cost at Marysville and East Liberty, how the Jeffersonville cell inbound is being staged at Marysville today, where the AFEELA-1 redirect leaves the East Liberty operating pattern, or how the RLC-to-receiving-yard handoff actually works in current practice. Those answers reshape the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.",
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-051',
      name: 'Jim Small',
      firstName: 'Jim',
      lastName: 'Small',
      title: 'Senior Vice President, Honda Logistics North America',
      company: 'Honda',
      email: 'jim.small@honda.com',
      linkedinUrl: 'https://www.linkedin.com/in/jim-small-b94760b0',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Supply Chain / Logistics',
      currentMandate: 'Senior logistics leadership inside Honda Logistics North America — the operating seam between Honda Trading Group lane planning, the Marysville Regional Logistics Centre, and the receiving yards at the Ohio assembly plants.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-052',
      name: 'Brian Beard',
      firstName: 'Brian',
      lastName: 'Beard',
      title: 'Honda Logistics North America',
      company: 'Honda',
      email: 'brian.beard@bn.com',
      linkedinUrl: 'https://www.linkedin.com/in/brian-beard-5b7429a0',
      roleInDeal: 'influencer',
      seniority: 'Manager',
      function: 'Logistics',
      currentMandate: 'Logistics leader inside Honda Logistics North America. Operating-tier visibility into the inbound-lane to receiving-yard handoff at the Ohio assembly plants.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-053',
      name: 'Derek Johansen',
      firstName: 'Derek',
      lastName: 'Johansen',
      title: 'Senior executive for inbound supply, warehousing, and outbound distribution of automotive parts',
      company: 'Honda',
      email: 'derek.johansen@honda.com',
      linkedinUrl: 'https://www.linkedin.com/in/derek-johansen-751b0223',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Operations / Distribution',
      currentMandate: 'Senior operator across inbound supply, warehousing, and outbound parts distribution — directly on the seam where Marysville RLC inbound, Honda Trading Group lanes, and receiving-yard execution intersect.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-054',
      name: 'David Van Brimmer',
      firstName: 'David',
      lastName: 'Van Brimmer',
      title: 'Senior Operations Manager, Honda Logistics North America',
      company: 'Honda',
      email: 'david.brimmer@honda.com',
      linkedinUrl: 'https://www.linkedin.com/in/david-van-brimmer-21a8189a',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Operations',
      currentMandate: 'Senior operations manager inside Honda Logistics North America. Operating-tier ownership of the dock-side execution that absorbs flex-line variant-mix variance.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-055',
      name: 'Ed Allison',
      firstName: 'Ed',
      lastName: 'Allison',
      title: 'Chief Financial Officer, Honda Logistics North America',
      company: 'Honda',
      email: 'ed.allison@honda.com',
      linkedinUrl: 'https://www.linkedin.com/in/edallisoncpa',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Finance / Strategy',
      currentMandate: 'CFO of Honda Logistics North America. Operating visibility into the cost stack the yard layer drives — detention, dock-office headcount, dwell-time variance — across the Ohio assembly network through the post-March-2026 reversal.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-051',
        name: 'Jim Small',
        firstName: 'Jim',
        lastName: 'Small',
        title: 'Senior Vice President, Honda Logistics North America',
        company: 'Honda',
        email: 'jim.small@honda.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Supply Chain / Logistics',
      },
      fallbackLane: 'logistics',
      label: 'Jim Small — Senior Vice President, Honda Logistics North America',
      variantSlug: 'jim-small',

      framingNarrative:
        "Jim, you sit at the operating seam between Honda Trading Group lane planning, the Marysville Regional Logistics Centre, and the receiving yards at the Ohio assembly plants — exactly where this analysis lives. The Honda JIT discipline runs deep at the plant level: andon-cord authority, line-side rack discipline, kaizen-iterated standardized work. The piece this brief works through is the one layer that discipline hasn't yet been pushed into a measurable standard — the yard between the supplier truck arriving at the gate and the trailer being live at the right dock. The Ohio EV Hub flex-line is the operating-system thread that runs through everything the March 2026 reversal did and did not touch: the retool is complete, the L-H Battery cell inbound from Jeffersonville is live, the AFEELA-1 cancellation redirected the East Liberty trial-build line, and the flex-line architecture is the thing that absorbed all of it. The yard layer above the dock is the seam the same operating system hasn't yet extended into.",
      openingHook:
        "JIT works inside the plant because the part is there when the line pulls for it. The kanban-pull signal cannot pull a part that hasn't reached the dock. Every minute of yard variance between the supplier truck and the assembly dock is, by definition, a JIT violation — the line was ready and the part wasn't. The line-side discipline that took decades to build inside Honda's plants is the same shape of discipline the yard layer above the dock has not yet been standardized to. The wedge is extension, not alternative.",
      stakeStatement:
        "The Ohio EV Hub flex-line architecture survived the March 2026 reversal — the capex stays capitalized, the lines stay flexible, the IPU sub-assembly stays at Marysville. What changed is the variant mix the lines now arbitrate across: ICE plus hybrid plus a smaller BEV slice, on the same line, fed by the same 700-supplier inbound network. The L-H Battery cell inbound from Jeffersonville is a single-source, weight-heavy, hazmat-classified lane that didn't exist in the operating model two years ago and is now load-bearing for the BEV slice of every flex line it feeds. The AFEELA-1 cancellation on March 25, 2026 redirected the East Liberty trial-build line into a fresh-paint operating pattern that has not yet hardened. The variance budget per supplier shrinks as the supplier mix widens — and every minute the yard layer doesn't standardize is a minute that has to be absorbed somewhere else in the JIT chain. The period where the post-reversal pattern is still settling is when standardizing that layer costs least.",

      heroOverride: {
        headline: "Jim, the yard between Honda's 700 inbound suppliers and the assembly dock is the one layer the Ohio EV Hub flex-line didn't extend into.",
        subheadline:
          "The flex-line architecture is the operating-system thread that survived the March 2026 reversal — Marysville and East Liberty running flex-line ICE, hybrid, and BEV on the same lines, with live cell inbound from the L-H Battery JV in Jeffersonville. The yard layer above the receiving plants is still on plant-by-plant local routine, and the period when the post-reversal pattern is still settling is when standardizing it costs least.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator. Jim lives in the operational seam between Honda Trading Group lane planning, the Marysville RLC, and the receiving yards. He does not need a glossary on JIT, kanban, or flex-line architecture; he has lived the Ohio EV Hub buildout, the L-H Battery JV cell-inbound start, the AFEELA cancellation, and the post-March-2026 settling period from the seat that owns the handoff between inbound lane planning and receiving-yard execution. Position the wedge as an extension of the Honda JIT discipline, not as replacement of any installed plant-level practice. Acknowledge the JIT-at-scale inheritance as the inheritance it is. Name the kanban-pull contradiction precisely (the signal cannot pull a part that hasn't arrived) and treat the yard as the piece of the operating system that has been running below the production system's visibility threshold, not outside its philosophy.",
      kpiLanguage: [
        'gate-to-dock cycle time',
        'milkrun cascade delay',
        'kanban-pull integrity at the dock',
        'inbound-parts variance per shift',
        'L-H Battery cell-inbound staging',
        'flex-line variant-mix dock arbitration',
        'RLC-to-receiving-yard handoff',
        'standardized work at the yard layer',
      ],
      proofEmphasis: "Primo is the public comparable to cite — different vertical, same structural shape: multi-site, multi-input, mature in-plant operating discipline already in place, network-level yard discipline above the sites as the unsolved layer. Primo's hard-freight discipline translates down to the JIT-assembly cadence; if a bottled-water network can dock-turn in 24 minutes, the line-side delivery window is the same physics. The directly-shaped comparable (the un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.",
    },
    {
      person: {
        personaId: 'P-053',
        name: 'Derek Johansen',
        firstName: 'Derek',
        lastName: 'Johansen',
        title: 'Senior executive for inbound supply, warehousing, and outbound distribution of automotive parts',
        company: 'Honda',
        email: 'derek.johansen@honda.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Operations / Distribution',
      },
      fallbackLane: 'ops',
      label: 'Derek Johansen - Senior executive for inbound supply',
      variantSlug: 'derek-johansen',

      framingNarrative:
        "Derek, your seat sits exactly where the analysis lives — inbound supply, warehousing, and outbound parts distribution is the operating tier the yard layer runs through. Honda's plant-level JIT discipline is mature; the layer above the dock isn't standardized to the same threshold. The post-March-2026 flex-line mix at Marysville and East Liberty plus the live cell inbound from Jeffersonville mean the variance budget the yard absorbs is wider than the operating pattern was designed for.",
      openingHook:
        "The Marysville RLC handles ~2,500 part numbers of imported material into the Ohio assembly network. The same plants now run flex-line ICE, hybrid, and BEV on the same lines and take cell inbound from the L-H Battery JV in Jeffersonville. The inside of the plant absorbs that variance on JIT discipline. The yard between the supplier truck and the dock is where that discipline hasn't yet extended — and the cost of waiting compounds across every shift the flex line runs.",
      stakeStatement:
        "Inbound supply is the seam that pays for yard-layer variance first. Every milkrun cascade delay, every dock-door arbitration miss, every cell-inbound staging conflict at Marysville feeds back through warehousing and outbound parts distribution before it shows up anywhere else in the cost stack. Standardizing the operating layer above the sites during the post-reversal settling period costs less than standardizing it after the flex-line cadence hardens.",

      heroOverride: {
        headline: "Derek, the yard layer is the seam your inbound-supply remit pays for first.",
        subheadline:
          "Marysville RLC handles ~2,500 Japan-import part numbers into the Ohio assembly network. The same plants now run flex-line ICE, hybrid, and BEV with live cell inbound from Jeffersonville OH. The yard between the supplier truck and the assembly dock is the one operating layer the March 2026 reversal didn't touch.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift: "Operator-to-operator. Derek owns the inbound-supply seam directly. Frame the yard layer as the piece of the operating system that has been operating below the visibility threshold the rest of the inbound-supply discipline runs to.",
      kpiLanguage: [
        'inbound-supply variance',
        'RLC-to-plant handoff cycle time',
        'milkrun cascade delay',
        'cell-inbound staging at Marysville',
        'flex-line dock arbitration',
        'warehousing carry cost on yard-induced delay',
        'outbound parts distribution sequencing',
      ],
      proofEmphasis: "Primo is the public comparable — different vertical, same structural shape: multi-site, multi-input, mature in-plant operating discipline already in place, network-level yard discipline above the sites as the unsolved layer. Primo's hard-freight discipline translates down to the JIT-assembly cadence.",
    },
    {
      person: {
        personaId: 'P-054',
        name: 'David Van Brimmer',
        firstName: 'David',
        lastName: 'Van Brimmer',
        title: 'Senior Operations Manager, Honda Logistics North America',
        company: 'Honda',
        email: 'david.brimmer@honda.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'David Van Brimmer - Senior Operations Manager',
      variantSlug: 'david-van-brimmer',

      framingNarrative:
        "David, your operations seat is the one that absorbs the yard-layer variance directly — radios, dock-priority calls, gate-to-dock cycle time, the dock-office shift-by-shift arbitration that the rest of the operating system depends on. The plant-level JIT discipline at Honda is mature; the yard layer above the dock is the one piece of the production system that has been operating below the visibility threshold the rest of the discipline runs to. The post-March-2026 flex-line mix at Marysville and East Liberty plus the live L-H Battery cell inbound widens the variance budget the yard absorbs.",
      openingHook:
        "Inside the plant, Honda's JIT discipline is mature and the dock-priority cadence holds. Outside the gate, the same minutes still run on radios and tribal habit. The kanban-pull signal cannot pull a part that hasn't reached the dock — every minute of yard variance is a JIT violation paid for somewhere else in the line.",
      stakeStatement:
        "The post-reversal flex-line mix is broader than the lines were retooled for; the L-H Battery cell inbound from Jeffersonville is a single-source weight-heavy lane that didn't exist two years ago. Standardized work at the yard layer is the operating-system extension that absorbs that variance budget before it shows up at the line.",

      heroOverride: {
        headline: "David, the yard layer is where the JIT discipline still runs on radios.",
        subheadline:
          "Plant-level production discipline at Honda is mature. The yard between the supplier truck and the assembly dock is the one operating layer the JIT discipline hasn't yet been standardized to — and the post-March-2026 flex-line variant mix is wider than the lines were retooled for.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift: "Operator-to-operator. David owns the dock-side execution directly. The conversation is about the operating-system extension that absorbs the variance budget the yard is currently absorbing on radios.",
      kpiLanguage: [
        'gate-to-dock cycle time',
        'dock-priority arbitration',
        'dock-office shift coverage',
        'milkrun cascade delay',
        'yard-truck choreography',
        'flex-line variant-mix dock arbitration',
        'cell-inbound staging discipline',
      ],
      proofEmphasis: "Primo is the public comparable — different vertical, same structural shape. The hard-freight discipline translates down to the JIT-assembly cadence; if a bottled-water network can dock-turn in 24 minutes, the line-side delivery window is the same physics.",
    },
    {
      person: {
        personaId: 'P-055',
        name: 'Ed Allison',
        firstName: 'Ed',
        lastName: 'Allison',
        title: 'Chief Financial Officer, Honda Logistics North America',
        company: 'Honda',
        email: 'ed.allison@honda.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Finance / Strategy',
      },
      fallbackLane: 'cfo',
      label: 'Ed Allison - Chief Financial Officer',
      variantSlug: 'ed-allison',

      framingNarrative:
        "Ed, the operating-cost shape this analysis points at is the one that survives the March 2026 reversal — yard-layer variance is paid for whether the flex line is mostly ICE, mostly hybrid, or mostly BEV. The variance budget shifts with the variant mix; the cost stack the yard drives (detention, dock-office headcount, dwell-time variance, milkrun cascade delay) stays. The window where the post-reversal flex-line cadence is still settling is when the cost of standardizing the yard layer is lowest and the cost of waiting compounds fastest.",
      openingHook:
        "Honda took an estimated ¥2.5 trillion in losses in the March 2026 reversal. The flex-line architecture survives; the variant mix the lines now arbitrate is different than the one they were retooled for. The yard layer above the dock is the one operating layer the reversal didn't touch — and the cost stack the yard drives is paid for through every shift the flex line runs, regardless of the variant mix.",
      stakeStatement:
        "Yard-layer variance feeds detention spend, dock-office labor, and dwell-induced rework before it shows up anywhere else on the P&L. The post-March-2026 flex-line mix widens the variance budget; standardizing the operating layer above the sites during the settling period costs less than standardizing it after the cadence hardens — and the cost stack accumulates against the same plant assets the $1B Ohio EV Hub retool already capitalized.",

      heroOverride: {
        headline: "Ed, the yard layer is the cost stack the March 2026 reversal didn't fix.",
        subheadline:
          "Whether the flex line at Marysville is mostly ICE, mostly hybrid, or mostly BEV, the yard between the supplier truck and the assembly dock pays the variance budget first. Detention, dock-office headcount, dwell-induced rework — the cost stack the yard drives is paid for through every shift the flex line runs.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift: "Peer-to-peer CFO framing. The yard layer is the operating-cost shape that survives the strategy reshuffle. Acknowledge the $1B Ohio EV Hub retool as the capitalized inheritance it is; the yard layer is the part the capex didn't cover.",
      kpiLanguage: [
        'cost per inbound load',
        'detention spend exposure',
        'dock-office labor cost',
        'dwell-induced rework cost',
        'milkrun cascade delay cost',
        'cell-inbound staging exposure',
        'total cost of ownership at the yard layer',
      ],
      proofEmphasis: "Primo is the public comparable — same multi-site, multi-input network shape, harder freight. The per-site profit impact ($1M+ measured) and the network-rollout cadence (24 live, >200 contracted) are the CFO-relevant proof points. The directly-shaped reference (the 237-facility CPG anchor) is available for peer calls when the conversation gets to who else has done this at our scale.",
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured across live deployments' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at manufacturing facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'Primo Brands operates more than 200 contracted facilities on the same production-and-distribution model. YardFlow cut their gate-to-dock time on drop-and-hook trailers from 48 to 24 minutes.',
        role: 'Operations Director',
        company: 'National Beverage Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '13 North American plants — flagship Ohio campus (Marysville Auto Plant, East Liberty Auto Plant, Anna Engine Plant), plus Honda Manufacturing of Alabama (Lincoln AL), Honda Manufacturing of Indiana (Greensburg IN), and the L-H Battery JV in Jeffersonville OH',
    facilityTypes: ['Vehicle Assembly Plants', 'Engine & Powertrain Plants', 'Battery-Cell Manufacturing (L-H Battery JV)', 'Regional Logistics Centre (Marysville RLC)'],
    geographicSpread:
      'North America (HQ: Marysville OH; assembly plants in Marysville OH, East Liberty OH, Lincoln AL, Greensburg IN; engine and powertrain plants in Anna OH plus regional powertrain footprint; L-H Battery cell plant in Jeffersonville OH live since late 2025)',
    dailyTrailerMoves: 'High-volume — inbound parts from ~700 OEM suppliers feeding 13 plants, plus Japan-import flow through the Marysville Regional Logistics Centre (200,000 sq ft, ~2,500 part numbers) and cell inbound from L-H Battery in Jeffersonville to the Marysville IPU sub-assembly',
    fleet: 'Honda Trading Group coordinated lanes plus contract carriers across the inbound supplier base; Marysville RLC operates as the Japan-import anchor for the Ohio assembly network',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal/Rail'],
    avgLoadsPerDay: 'High-volume — inbound parts from a ~700-supplier base on milkrun and direct lanes (~$35B in 2025 North American parts purchases); Japan-import flow through the Marysville RLC; cell inbound from L-H Battery in Jeffersonville to the Marysville IPU sub-assembly; outbound finished-vehicle lanes from each assembly plant',
    peakSeason: 'Model-year changeover windows and the current post-March-2026 flex-line cadence reshuffle drive the largest variance — not a calendar season',
  },

  signals: {
    eventAttendance: 'Automotive Logistics and supply-chain industry conference circuit',
    recentNews: [
      'March 2026 — Honda cancelled its all-EV roadmap and the 0 Series rollout, taking estimated ¥2.5 trillion (~$15.7B) in losses; Marysville and East Liberty pivoted back to ICE-and-hybrid volume on the existing flex-line architecture.',
      'March 25, 2026 — Sony Honda Mobility cancelled AFEELA 1 production; the East Liberty trial-build line redirected.',
      'February 2026 — LG Energy Solution sold the building of the L-H Battery JV in Jeffersonville OH to Honda for ~₩4.2 trillion (~$2.9B), with LG continuing to operate the facility under a lease.',
      'Late 2025 — L-H Battery Company (LG-Honda JV) began mass production of pouch-type lithium-ion batteries in Jeffersonville OH; cells feed the Marysville IPU sub-assembly that supplies both Ohio assembly plants.',
      'Ohio EV Hub — ~$1B retooling investment across Marysville Auto Plant, East Liberty Auto Plant, and Anna Engine Plant complete through 2024-2025; flex-line architecture intact through the March 2026 reversal.',
      '2025 — ~$35B in North American parts purchases from ~700 OEM suppliers; "Flexibility for Tomorrow" was the NA supplier-conference theme.',
    ],
    supplyChainInitiatives: [
      'Ohio EV Hub flex-line architecture — capable of building ICE, hybrid, and BEV on the same line; now reabsorbing the post-March-2026 variant mix.',
      'L-H Battery cell inbound from Jeffersonville OH into the Marysville IPU sub-assembly that feeds Marysville and East Liberty assembly.',
      '"Flexibility for Tomorrow" — the 2025 supplier-conference theme; flex-line production and resilient inbound networks are the operational expression.',
    ],
    urgencyDriver:
      'The post-March-2026 settling period is the urgency driver. The flex-line variant mix at Marysville and East Liberty is wider than the lines were retooled for; the L-H Battery cell inbound is live and load-bearing for the BEV slice; and the operating pattern at the yard layer above the sites is still moving. Standardizing the yard layer during the settling period costs less than standardizing it after the post-reversal cadence hardens.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Ohio EV Hub', body: '~$1B retooled across Marysville · East Liberty · Anna · flex-line ICE + hybrid + BEV on the same line · architecture intact through the March 2026 reversal.' },
    { mark: 'March 2026 reversal', body: 'Honda cancelled the all-EV roadmap · ~¥2.5T / ~$15.7B in losses · flex lines pivoted back to ICE-and-hybrid volume · the flex line absorbed the strategy reshuffle the way it absorbs a model-year changeover.' },
    { mark: 'L-H Battery JV', body: 'Jeffersonville OH · ~$3.5B build · cell production live since late 2025 · Feb 2026 sale-and-leaseback to Honda for ~$2.9B · single-source weight-heavy hazmat lane into Marysville IPU sub-assembly.' },
    { mark: 'AFEELA cancellation', body: 'Sony Honda Mobility cancelled AFEELA 1 production March 25, 2026 · East Liberty trial-build line redirected · fresh-paint operating pattern not yet hardened.' },
    { mark: 'Coverage map', body: '5 Ohio EV Hub plant tiles covered · 1 unfilled · the yard layer above the dock.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same network shape, harder freight, single-customer-type.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      "This brief is for Jim Small. You sit at the operating seam between Honda Trading Group lane planning, the Marysville Regional Logistics Centre, and the receiving yards at the Ohio assembly plants. The Ohio EV Hub flex-line is the operating-system thread that ran through everything the March 2026 reversal did and did not touch — the retool stayed capitalized, the cell inbound from Jeffersonville stayed live, the AFEELA-1 cancellation redirected the East Liberty trial-build line, and the flex-line architecture absorbed all of it. The five minutes that follow are about the one layer the same operating system hasn't yet been pushed into — the yard between the supplier truck and the assembly dock — and why the post-reversal settling window is when standardizing it costs least.",
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#CC0000',
    backgroundVariant: 'dark',
  },
};
