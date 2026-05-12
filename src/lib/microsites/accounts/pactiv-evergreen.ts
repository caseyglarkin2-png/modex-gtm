/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Pactiv Evergreen is a confirmed PINC customer per the October 2019 PINC
 * case study documenting a coast-to-coast deployment at 12 Pactiv
 * facilities. PINC was acquired by Kaleris in 2022. Specifics:
 *   - Documented use: GPS-based trailer location, spotter loop check-in
 *     model, 200–300 trailers in yard at named sites, 15–20 minute spotter
 *     search time pre-deployment
 *   - Aberdeen NC site has a public job posting referencing PINC — current
 *     active operating signal at the working-operator level
 *   - Novolex legacy yard stack post-April 2025 combination is unconfirmed
 *     publicly (may be PINC, may be different vendor, may be manual)
 *
 * Persona context: Chuck Whittington is the legacy Pactiv Evergreen
 * executive named CTO of the combined Novolex entity at the April 1, 2025
 * deal close. 30+ year company insider (joined 1992 as Sales Rep). Ran the
 * PMO and IMO for the combination as SVP Business Transformation before
 * being named CTO. Army War College credential. Combined entity: ~95+
 * facilities, ~250+ brands, ~39,000+ SKUs, 20,000+ employees. Apollo Global
 * + CPP Investments synergy pressure cadence = April 2025–April 2027
 * window.
 *
 * Customer base: McDonald's, Starbucks, Sysco, US Foods, Performance Food
 * Group, retail grocery (Kroger, Walmart, Albertsons). Foodservice JIT
 * inbound = zero tolerance for yard-induced service-level misses.
 *
 * Pitch shape: COEXISTENCE WEDGE — network-tier orchestration layer that
 * INGESTS from the existing site-level yard tools at Pactiv-legacy sites,
 * INGESTS from whatever Novolex-legacy sites run, and presents a single
 * combined-network view to the integration team. This is option (c) in the
 * post-merger yard math: not replacing PINC at every site, but rendering
 * site-level records into one network operating layer.
 *
 * This intel powers cold-email coexistence framing (see
 * docs/research/chuck-whittington-pactiv-evergreen-dossier.md). It must not
 * appear in any prospect-facing surface. The memo references "the
 * site-level yard tools you operate at the Pactiv-legacy sites" / "the
 * yard stacks the combined network inherited from both sides" — never
 * PINC/Kaleris specifically.
 */

/**
 * Pactiv Evergreen (now Novolex) — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris/PINC customer — 2019 case study at
 *                  12 Pactiv sites; Aberdeen NC current operating signal)
 * Pitch shape: coexistence wedge — network-tier orchestration layer above
 *              the two parallel site-level yard stacks (Pactiv-legacy +
 *              Novolex-legacy) the combined entity inherited
 * Angle: YARD MANAGEMENT (combined-network view across ~95 yards; hub-and-
 *        spoke mixing-center orchestration at Temple TX and equivalents;
 *        foodservice JIT service-level reliability for McDonald's and
 *        Starbucks; multi-channel dock contention) — NOT driver experience
 * Stakeholder vocabulary: PMO/IMO / Army-War-College structured-program
 *        register (Whittington's 30-year Pactiv tenure, Business
 *        Transformation seat, named CTO at the April 1, 2025 deal close) —
 *        synergy capture, integration plan milestones, Apollo + CPP capital
 *        timing, costed assumptions, structured proof points
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const pactivEvergreen: AccountMicrositeData = {
  slug: 'pactiv-evergreen',
  accountName: 'Pactiv Evergreen',
  coverHeadline: 'The yard layer above the Combined Network',
  titleEmphasis: 'above the Combined Network',
  coverFootprint: '~95 sites · two yard stacks',
  parentBrand: 'Novolex (post-April 2025 combination)',
  vertical: 'industrial',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 76,

  pageTitle: 'YardFlow for Pactiv Evergreen / Novolex - The Combined-Network Operating Layer After the Integration',
  metaDescription:
    'How a network-tier yard orchestration layer ingests from the existing site-level yard tools at the Pactiv-legacy sites, ingests from the Novolex-legacy stack, and presents a single combined-network view to the integration team across ~95 yards, 39,000 SKUs, and the McDonald\'s / Starbucks service-level surface.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Pactiv Evergreen / Novolex combined network',
      composition: [
        { label: 'Combined footprint (post-April 1, 2025 close)', value: '~95+ combined manufacturing, warehousing, and distribution sites; 20,000+ employees; 250+ brands; 39,000+ SKUs across US, Canada, Mexico, and Europe. Pactiv Evergreen legacy: 50+ manufacturing facilities + 42 DCs on a hub-and-spoke model with regional mixing centers (Temple TX publicly cited). Novolex legacy: complementary US/Canada/Europe footprint in plastic and paper bags, packaging films, converted paper products' },
        { label: 'Combined-network deal math', value: '$6.7B transaction value. Apollo Global Management (controlling) + CPP Investments (minority, from the Pactiv side) underwrote the combination on combined-network synergy capture. The capital-markets thesis is not two parallel networks operating in parallel — it is one combined operating model running across ~95 sites, 250 brands, 39,000 SKUs. Site-level wins do not retire that thesis; only a single combined-network operating layer does' },
        { label: 'Customer base', value: 'McDonald\'s, Starbucks, Sysco, US Foods, Performance Food Group on the foodservice side; retail grocery (Kroger, Walmart, Albertsons archetype) and club channels; packaging-converter customers. Foodservice JIT inbound = zero tolerance for yard-induced service-level misses' },
        { label: 'Existing yard-tech layer', value: 'Site-level yard tools are in production at the Pactiv-legacy sites (12-facility coast-to-coast deployment documented from 2019; Aberdeen NC currently hiring at the working-operator level signals an active site). The Novolex-legacy yard stack is not publicly disclosed. The combined-network view across both sides is unsolved — two parallel operating models on the same integration cadence' },
        { label: 'Footprint optimization in motion', value: 'Pactiv Feb 2024 Footprint Optimization plan ($40M–$45M capex, $50M–$65M cash restructuring, $20M–$40M non-cash charges, savings beginning 2025) plus the Novolex integration plan are now converging into a unified optimization wave. Site rationalization continues — Canton NC (2023), Olmsted Falls OH (2023), Pine Bluff AR + Waynesville NC to Suzano (Oct 2024, $110M), Kalamazoo MI (April–June 2025). Volume re-concentrates at surviving sites' },
        { label: 'Synergy-window timing', value: 'April 2025 close → April 2027 24-month synergy-capture window is the standard PE integration cadence Apollo and CPP underwrote against. May 2026 is month 13 of 24 — past the halfway mark, with site rationalization still compressing trailers through surviving yards on the same dock count and the McDonald\'s / Starbucks service-level surface downstream of every gate-to-dock decision. The cleanest moment for a new combined-network operating layer to enter the standard at integration speed is now, not after the window closes' },
        { label: 'Apollo / CPP synergy cadence', value: 'Apollo Global Management controls; CPP Investments holds minority equity from the Pactiv side. The $6.7B transaction was justified to capital markets on combined-network synergies. The cleanest moment for a new operating layer to enter the standard at integration speed is the April 2025–April 2027 window — month 13 of 24 as of May 2026' },
        { label: 'Hub-and-spoke mixing-center model', value: 'Regional mixing centers (Temple TX cited publicly) blend formulations from upstream manufacturing and distribute to downstream warehouses. The same trailer often serves multiple downstream nodes — yard misroutes compound non-linearly when the SKU count grows from Pactiv-only to Pactiv + Novolex combined' },
      ],
      hypothesis:
        'The interesting thing about the Pactiv Evergreen / Novolex yard math is what site-level success has not done. The 12-site coast-to-coast yard automation deployment from 2019 worked — site-level GPS trailer location, spotter loop check-in, the 15–20 minute trailer search time eliminated. Those are real wins; the case study is public; the operating sponsor is a 30-year company insider now named CTO of the combined entity at the April 1, 2025 close. At the standalone-Pactiv network as it existed in 2019, that part of the conversation was closed. What is unsolved is the layer that did not exist when the deployment was specified: a combined-network view across ~95 yards, ingesting from the site-level tools at the Pactiv-legacy sites, ingesting from whatever Novolex-legacy sites run, and presenting a single operating view to the integration team that Apollo and CPP underwrote $6.7B against.\n\nThree pressures compound that gap in the April 2025–April 2027 integration window, and they are the standard PE-integration pressures running at their standard PE cadence. First, synergy delivery to Apollo Global Management and CPP Investments is the explicit operating mandate over a 24-month window that started at deal close — May 2026 is month 13 of 24, past the halfway mark, and running two parallel yard stacks indefinitely is the structural opposite of synergy capture against a fiduciary scorecard. Second, the foodservice JIT customer base — McDonald\'s and Starbucks at the top of the revenue book, Sysco and US Foods and Performance Food Group behind them — operates on appointment-and-chargeback discipline that is the choke-point for service-level reliability, and a yard-induced miss in this category is a customer-relationship event, not a soft cost. Third, the hub-and-spoke mixing-center model (Temple TX publicly named) is the highest-leverage yard surface in the combined network — multi-destination outbound trailers, multi-SKU blending, and orchestration math that scales non-linearly with the SKU count expansion from Pactiv-only to Pactiv + Novolex combined. Site-level tools at a mixing center can identify where a trailer is; they cannot orchestrate which trailer should leave next across a unified combined-network plan.\n\nThe cleanest pitch shape is the additive one, and it is shaped to the operator who built the integration plan before he owned it. Ingest from the existing Pactiv-side site tools — which have an active operating sponsor with 30 years of institutional memory at the new CTO seat. Ingest from the Novolex-side stack — whatever it is. Present a single combined-network view to the integration team running PMO and IMO discipline against the Apollo / CPP synergy scorecard. That is the only path that does not waste the existing investment on the Pactiv side, does not require a vendor-replacement event at the Pactiv-legacy sites mid-integration, and still delivers the combined-network view the $6.7B underwriting requires. It is the PE-rational integration shape — additive at the layer above two parallel stacks, not displacement-driven at either one — and the window for landing it at integration speed rather than after has roughly 11 months left.',
      pullQuote: 'What is unsolved is the layer that did not exist when the deployment was specified.',
      caveat:
        'This is built from Pactiv Evergreen / Novolex public disclosures, the published yard-automation case record at the 12 Pactiv sites, the post-merger announcements, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: which Novolex-legacy sites run what yard stack, where the Pactiv Footprint Optimization volume re-concentration is biting hardest at surviving sites, and how the Temple TX mixing-center workflow is currently handling the post-combination SKU expansion.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the combined-network operating layer',
      artifact: {
        imageSrc: '/artifacts/pactiv-evergreen-coverage-map.svg',
        imageAlt: 'Combined-network operating-layer coverage map. Six tiles representing the operating layers in place after the April 2025 Novolex+Pactiv combination. The Legacy Pactiv yard stack, Legacy Novolex yard stack, Apollo PE governance, CPP PE governance, and 95-site combined footprint are covered. The Integrated Yard Ops tile is unfilled, marked with a Pactiv green hairline outline.',
        caption: 'Combined-network operating-layer coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public Novolex + Pactiv Evergreen + Apollo Global Management + CPP Investments disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. They are years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network and have layered a network-level operating model on top of their existing site-level yard systems. The Pactiv Evergreen / Novolex operating profile is shape-similar in the network-orchestration dimension — multi-site, multi-customer, multi-channel, hub-and-spoke mixing centers, mature site-level yard tools at parts of the network — but at packaging-products freight economics with a JIT-customer service-level surface (McDonald\'s, Starbucks) rather than retail-DC cadence. If a network operating model can run on water — the hardest CPG freight in the country — the read-across to a ~95-yard combined packaging network running on the foodservice JIT service-level math is the easier lift. The PE-rational integration shape lands in one line: the additive layer above two parallel site-level stacks delivers the combined-network view Apollo and CPP underwrote against, without triggering a vendor-replacement event at the Pactiv-legacy sites mid-integration or forcing a Novolex-side rebuild before the integration team has the data to scope it.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The highest-leverage pilot at Pactiv Evergreen / Novolex is the Temple TX mixing center or an equivalent regional mixing-center node — the orchestration math at a multi-destination outbound site is richer than at single-purpose manufacturing yards, and the proof point lands cleanly inside the synergy-capture scorecard. The follow-on is one Novolex-legacy site where the yard stack today is the least documented — that pair (one Pactiv-legacy mixing center + one Novolex-legacy site) makes the combined-network operating-layer case visible in one read.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'novolex-merger-close',
          source: 'Novolex + Pactiv Evergreen $6.7B combination close (April 1, 2025)',
          confidence: 'public',
          detail: 'Combined entity: ~95+ facilities, 20,000+ employees, 250+ brands, 39,000+ SKUs. CEO Stan Bikulege (Novolex); CFO Dennis Norman (Novolex); COO Tamer Abuaita (July 2025, succeeding Doug Owenby who served as Interim COO from Pactiv); CTO Chuck Whittington (legacy Pactiv Evergreen). Apollo Global Management controls; CPP Investments minority equity from the Pactiv side. Combined HQ: Charlotte NC; Lake Forest IL remains a major operating site.',
        },
        {
          id: 'pactiv-yard-automation-case-2019',
          source: 'Published yard-automation case record at 12 Pactiv facilities (October 2019)',
          confidence: 'public',
          detail: 'Pre-acquisition coast-to-coast Pactiv Evergreen yard automation deployment documented across 12 named facilities. Use cases: GPS-based trailer location, RFID gate-and-locate, spotter loop check-in model, 200–300 trailers in yard at named sites, 15–20 minute pre-deployment spotter search time. Public NC job posting at Aberdeen references the yard system in 2026 — current operating signal at the working-operator level.',
        },
        {
          id: 'pactiv-footprint-optimization',
          source: 'Pactiv Evergreen Footprint Optimization plan (February 29, 2024)',
          confidence: 'public',
          detail: '$40M–$45M capex through 2024–2025; $50M–$65M total cash restructuring; $20M–$40M non-cash charges; cost savings beginning 2025. Pre-announcement of Novolex combination; the Pactiv plan and the Novolex integration plan now converge into a unified optimization wave under Whittington\'s CTO seat.',
        },
        {
          id: 'pactiv-site-rationalizations',
          source: 'Pactiv Evergreen site rationalizations (2023–2025)',
          confidence: 'public',
          detail: 'Canton NC pulp and paper mill closed Q2 2023; Olmsted Falls OH converting facility closed Q2 2023; Pine Bluff AR mill + Waynesville NC extrusion sold to Suzano for $110M (announced July 2024, completed October 2024); Kalamazoo MI permanent closure (153 jobs eliminated, April–June 2025). Volume re-allocates to surviving facilities at the same dock count.',
        },
        {
          id: 'novolex-leadership-shifts',
          source: 'Novolex post-close executive moves',
          confidence: 'public',
          detail: 'Tamer Abuaita named COO July 2025 (legacy Novolex influence at the operating chain of command); Doug Owenby continues in advisory capacity. JT Jones joined as CPO August 2025 from NOVA Chemicals. Bikulege → Abuaita for day-to-day operations; Bikulege → Whittington for transformation and integration.',
        },
        {
          id: 'whittington-tenure-record',
          source: 'Chuck Whittington tenure record — Pactiv Evergreen → Novolex (LinkedIn + Pactiv Evergreen executive disclosures + US Army War College alumni records + USM alumni records)',
          confidence: 'public',
          detail: '30+ year tenure inside the Pactiv organization, joining 1992 as Sales Representative and progressing through multiple commercial and operational roles before being named SVP Business Transformation. Ran the PMO and the Integration Management Office (IMO) for the Novolex combination from inside the Business Transformation seat — built the integration plan before he owned it. Named Chief Transformation Officer at the April 1, 2025 deal close. Education: BS USM, MS US Army War College. The Army War College credential matters because it explains the structured-program register Whittington reads in — governance, milestones, costed assumptions, structured proof points — and why PMO/IMO discipline runs at the cadence it does inside this integration. The 30-year tenure matters because it means the 2019 Pactiv yard-automation deployment, the 2024 Footprint Optimization plan, and the specific plant closures (Canton, Olmsted Falls, Pine Bluff, Waynesville, Kalamazoo) are not briefing-book facts — they are operating decisions he was in the room for.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges. These describe the conditions most multi-site packaging networks operate under, not Pactiv Evergreen specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Which Novolex-legacy sites run what yard stack (vendor, vintage, integration depth) — not publicly disclosed; central discovery question for any combined-network operating-layer scoping',
        'Where the Pactiv Footprint Optimization volume re-concentration is biting hardest at surviving sites — and which mixing centers are running closest to dock-cycle saturation in 2026',
        'How the Temple TX mixing-center workflow is currently handling the post-combination SKU expansion from Pactiv-only to Pactiv + Novolex combined brands',
        'How McDonald\'s and Starbucks JIT inbound service-level reliability is being measured at the gate-to-dock layer today, and which yards drive the worst chargeback exposure',
        'How JT Jones (CPO, joined August 2025) is positioning vendor consolidation across the combined operating model — particularly whether yard-tech consolidation is on the procurement scorecard',
        'How synergy attribution to specific operating changes is tracked into the Apollo / CPP integration scorecard — and which yard-layer changes are eligible for direct synergy credit',
        'What threshold the PMO/IMO governance applies to combined-network operating-layer investments in the back half of the 24-month synergy window (April 2025–April 2027), and whether month-13-of-24 is treated inside the integration plan as "still inside the window for new operating layer entry" or as "outside the window, defer to post-integration capex cycle"',
        'How the IT integration architecture is sequencing the two parallel ERP / MES / WMS estates the combined network inherited — and whether a combined-network operating layer at the yard tier is being scoped as part of the same data-integration wave, or scheduled separately after the ERP convergence work lands',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a combined-network engagement. Pactiv Evergreen / Novolex is distinctive in this round because the case for site-level yard automation at the Pactiv-legacy sites is not in dispute — it was won in 2019 and the case study is public, the operating sponsor is a 30-year company insider now named CTO of the combined entity. Chuck, the memo is shaped to the PMO/IMO discipline you carried into the Business Transformation seat and to the structured-execution register the Army War College credential trains for — governance, milestones, costed assumptions, structured proof points — because that is the discipline the layer above two parallel yard stacks needs to land at integration speed inside the Apollo / CPP 24-month window. The unsolved problem is the combined-network operating layer above two parallel yard stacks, on a synergy-capture cadence Apollo and CPP have a fiduciary obligation to deliver against — and you are the operator who built the integration plan before you owned it. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and the network-orchestration read-across to a multi-channel, multi-customer, hub-and-spoke packaging network with foodservice-JIT service-level pressure is the easier lift.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Chuck — the part most worth pushing back on is whether the PMO/IMO discipline you ran for the combination is currently treating the combined-network yard layer as inside the synergy-window operating-model scope, or as a post-integration capex line that defers to the back half of 2027. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts — a structured scoping conversation against the Apollo / CPP synergy scorecard, a 30–60 day Temple TX mixing-center proof against the existing Pactiv-side site tooling, or an integration architecture review with the data team holding the two-ERP convergence problem — not necessarily a vendor demo.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'pactiv-evergreen-001',
      name: 'Chuck Whittington',
      firstName: 'Chuck',
      lastName: 'Whittington',
      title: 'Chief Transformation Officer',
      company: 'Novolex (legacy Pactiv Evergreen)',
      email: 'chuck.whittington@novolex.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Operations',
      currentMandate:
        'Chief Transformation Officer at Novolex since April 1, 2025 (the deal close date). 30+ year Pactiv tenure (joined 1992 as Sales Representative). Pre-CTO: SVP Business Transformation at Pactiv Evergreen, running the PMO and the Integration Management Office (IMO) for the Novolex combination before the deal closed — he built the integration plan before he owned it. Charter: synergy capture, technology stack consolidation, site standardization across 250 brands / 39,000 SKUs / ~95 facilities, cost takeout cadence ramping through 2026–2027. Education: BS USM, MS US Army War College.',
      bestIntroPath:
        'Direct outreach to the CTO seat, framed as combined-network operating-layer (not vendor-replacement). Whittington built the integration plan and is the operator with the most institutional memory on both sides of the integration line. Going around him to JT Jones (CPO) or to Stan Bikulege (CEO) without his awareness ends the conversation. Alternates if he delegates: Tamer Abuaita (COO, July 2025) for operating-side scoping; the named Pactiv-side operations VPs at specific sites (Lake Forest IL legacy HQ, Canandaigua NY) for site-pilot conversations.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'pactiv-evergreen-001',
        name: 'Chuck Whittington',
        firstName: 'Chuck',
        lastName: 'Whittington',
        title: 'Chief Transformation Officer',
        company: 'Novolex (legacy Pactiv Evergreen)',
        email: 'chuck.whittington@novolex.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Chuck Whittington - Chief Transformation Officer',
      variantSlug: 'chuck-whittington',

      framingNarrative:
        'Chuck, you built the integration plan before you owned it. The PMO and IMO discipline you ran from the SVP Business Transformation seat is now the CTO seat — and the structured-execution register the Army War College trained for (governance, milestones, costed assumptions, structured proof points under uncertainty) is exactly the register the combined-network operating layer above two parallel yard stacks reads in. The site-level case was closed at the 12 Pactiv yards in 2019; the work is real, the case study is public, Aberdeen NC is still hiring against it in 2026. The unsolved layer is the network-tier orchestration view across ~95 combined yards — and the Apollo + CPP 24-month synergy window is the dialect that recognizes the timing.',
      openingHook:
        'You ran the PMO/IMO for the combination before you owned the CTO seat. The site-level yard tools at the Pactiv-legacy sites were the right answer to the 2019 problem — and they still are. The combined Novolex+Pactiv network is a different shape: ~95 yards across two parallel operating models, 250 brands, 39,000 SKUs, hub-and-spoke mixing centers like Temple TX serving downstream nodes that did not exist on the same playbook a year ago. The next move is not more instances of the existing stack at acquired Novolex sites — it is a network-tier orchestration layer above both, presenting a single combined-network view to the integration team Apollo and CPP underwrote against.',
      stakeStatement:
        'Apollo Global Management and CPP Investments underwrote $6.7B on combined-network synergy capture over a 24-month standard PE integration window. May 2026 is month 13 of 24 — past the halfway mark, with roughly 11 months left in the window before the integration plan transitions from "operating model land" to "post-integration steady state." Running two parallel yard stacks across the back half of that window is the structural opposite of synergy capture against the fiduciary scorecard. Site rationalization (Kalamazoo April–June 2025, Pactiv Footprint Optimization) continues to compress trailers through surviving yards on the same dock count. The McDonald\'s and Starbucks service-level surface — appointment-and-chargeback discipline at the foodservice JIT customers — is downstream of every gate-to-dock decision in the combined network.',

      heroOverride: {
        headline: 'One combined-network operating layer. Two existing yard stacks ingested.',
        subheadline:
          'Site-level yard automation is proven at the Pactiv-legacy sites — the case study is public, the operating sponsor is the 30-year company insider now named CTO. The network-tier orchestration above two parallel stacks — ingesting from both, presenting a single integration-team view across ~95 combined yards — is the unsolved tier, and the synergy cadence makes the timing now.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'PMO/IMO + Army War College structured-program register. Whittington reads governance, milestones, costed assumptions, and structured proof points faster than vendor enthusiasm. Acknowledge the 30-year company tenure respectfully — he knows the site-level yard deployment history personally, knows the Footprint Optimization plan personally, knows why specific plants closed not from a briefing book but from the room. Position the wedge as the layer above (combined-network operating layer that ingests from both sides), not as displacement. Preserve the Pactiv-side investment — the existing site-level yard deployment is sunk capital with active operator familiarity at sites like Aberdeen NC. Synergy-capture language, integration-scorecard math, structured milestones.',
      kpiLanguage: [
        'combined-network operating view',
        'synergy capture attribution',
        'two-stack ingestion (Pactiv-legacy + Novolex-legacy)',
        'hub-and-spoke mixing-center orchestration',
        'foodservice JIT service-level reliability',
        'McDonald\'s / Starbucks chargeback exposure',
        'site-rationalization throughput per surviving dock',
        'Apollo / CPP synergy scorecard',
        'integration-window operating-model embed',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same multi-site, multi-customer, hub-and-spoke network shape, harder freight (water), already running the network-tier operating model above existing site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic — multi-OpCo network with the same shape of two-parallel-stack integration math.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '~95+ combined manufacturing, warehousing, and distribution sites post-April 2025 Novolex+Pactiv combination (Pactiv Evergreen contributed 50+ manufacturing facilities + 42 DCs on a hub-and-spoke model with regional mixing centers; Novolex contributed complementary US/Canada/Europe footprint)',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers', 'Regional Mixing Centers (Temple TX cited publicly)', 'Converted Paper / Plastic Bag Plants (Novolex legacy)'],
    geographicSpread: 'North America + Europe (combined HQ: Charlotte NC; Lake Forest IL legacy Pactiv major operating site; plants include Canandaigua NY, Aberdeen NC, Temple TX, Abilene TX, Bakersfield CA)',
    dailyTrailerMoves: 'High-volume — hub-and-spoke distribution with regional mixing centers feeding downstream warehouses across ~95 combined sites; foodservice JIT inbound to McDonald\'s, Starbucks, Sysco, US Foods, Performance Food Group is zero-tolerance for yard-induced service-level misses',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal', 'Hub-and-Spoke Mixing-Center Outbound'],
    avgLoadsPerDay: 'High-volume — foodservice packaging (trays, containers, cups, cutlery, plastic + paper bags, packaging films, converted paper products) moving from 50+ Pactiv manufacturing plants through 42 DCs and the additional Novolex footprint to restaurant, retail, and converter customers',
    specialRequirements: [
      'Foodservice JIT customer windows (McDonald\'s, Starbucks, Sysco, US Foods, Performance Food Group)',
      'Multi-channel dock contention (foodservice + retail grocery + club + packaging converters)',
      'Hub-and-spoke mixing-center orchestration (same trailer often serves multiple downstream nodes)',
      'Two parallel yard stacks across Pactiv-legacy and Novolex-legacy sites (combined-network view is the gap)',
    ],
  },

  signals: {
    recentNews: [
      'Novolex + Pactiv Evergreen $6.7B combination closed April 1, 2025 — combined entity ~95+ sites, 20,000+ employees, 250+ brands, 39,000+ SKUs. Apollo Global Management controls; CPP Investments minority equity from the Pactiv side.',
      'Chuck Whittington named Chief Transformation Officer at deal close (April 1, 2025) — 30-year Pactiv tenure, ran the PMO and IMO for the combination as SVP Business Transformation before being named CTO.',
      'Pactiv Footprint Optimization plan (Feb 2024): $40M–$45M capex, $50M–$65M cash restructuring, savings beginning 2025 — now converging into the unified combined-network optimization wave.',
      'Site rationalizations through April–June 2025 (Kalamazoo MI), October 2024 (Pine Bluff AR + Waynesville NC sold to Suzano for $110M), 2023 (Canton NC, Olmsted Falls OH) — volume re-concentrates at surviving facilities at the same dock count.',
      'Tamer Abuaita named COO July 2025; JT Jones named CPO August 2025 (from NOVA Chemicals) — legacy-Novolex operating chain of command formalized.',
      'Apollo / CPP synergy timeline: meaningful operating-cost takeout by 2027. April 2025–April 2027 is the cleanest moment for a new operating layer to enter the standard at integration speed.',
    ],
    urgencyDriver:
      'Apollo Global Management and CPP Investments have a fiduciary obligation to deliver combined-network synergies to the $6.7B transaction underwriting. Running two parallel yard stacks across the combined ~95-yard network is the opposite of synergy capture, and the integration team has roughly 11 more months in the April 2025–April 2027 window to land a combined-network operating layer at integration speed rather than after. The Footprint Optimization volume re-concentration is happening now at surviving sites; the McDonald\'s and Starbucks JIT service-level surface is downstream of every gate-to-dock decision; the Temple TX mixing center and equivalent regional nodes are the highest-leverage yard surfaces in the combined network for an operating-layer pilot that lands inside the synergy scorecard.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Combination close', body: 'Novolex + Pactiv Evergreen · $6.7B · April 1, 2025 · ~95 sites · 250 brands · 39,000 SKUs.' },
    { mark: 'Synergy window', body: 'Apollo + CPP underwriting · April 2025–April 2027 · month 13 of 24 as of May 2026.' },
    { mark: 'Site-level case', body: '12 Pactiv yards · 2019 case study · 15–20 min spotter search eliminated · Aberdeen NC still hiring against it in 2026.' },
    { mark: 'Whittington in his own words', body: 'Built the PMO and IMO before he owned the CTO seat. Knows both sides of the integration line.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Chuck Whittington. The PMO/IMO discipline you carried into the Business Transformation seat — and the structured-execution thinking from the Army War College credential — already runs the Novolex + Pactiv combination. The five minutes that follow are about the one operating layer the integration plan still routes through two parallel yard stacks.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#1B6B3A',
  },
};
