/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Boston Beer Company is named in the HID/RFID.com PINC/Kaleris passive
 * RFID yard-management case-study customer list ("Daimler Trucks, Boston
 * Brewing, Supervalu, DHL and others"). PINC was acquired by Kaleris in
 * 2022. Specifics:
 *   - The case-study reference says "Boston Brewing" with no site count or
 *     site list. Most likely candidates: the Breinigsville/Fogelsville PA
 *     brewery (largest plant) and Cincinnati (highest-velocity canning).
 *   - Likely 2017–2021 vintage install, predating the Kaleris acquisition.
 *   - Whether the deployment is still active or has aged out is unverified.
 *
 * Persona context: Phil Savastano was promoted to CSCO October 20, 2025
 * after 18 months running the Sam Adams Pennsylvania Brewery (Breinigsville/
 * Fogelsville, PA). Pre-Boston Beer: Tesla + Molson Coors. The plant-floor
 * operator who just got the CSCO seat. Mental model: "what works at one
 * plant should work at every plant." Q1 2026: 95% internal production (up
 * from 85%), +100 bps gross margin attributed to brewery efficiency.
 *
 * Pitch shape: COEXISTENCE WEDGE (in-yard execution + dock-cycle measurement
 * layer above the existing site-level RFID gate-and-locate system). The
 * gate-and-locate layer is doing what it was bought to do; the network
 * operating model above it is the gap. Savastano is new in seat (~7 months
 * as of May 2026); risk-managed pilot at PA brewery (his home for 18
 * months), then Cincinnati, then Milton DE.
 *
 * This intel powers the cold-email coexistence framing (see
 * docs/research/phil-savastano-boston-beer-company-dossier.md). It must
 * not appear in any prospect-facing surface. The memo references "the
 * gate-and-locate layer you already operate" / "your existing site-level
 * yard automation" — never PINC/Kaleris.
 */

/**
 * Boston Beer Company — ABM Microsite Data
 * Quality Tier: B (probable Kaleris customer — Boston Brewing named in
 *                  HID/RFID.com PINC passive RFID case study; deployment
 *                  vintage and current-active status not publicly confirmed)
 * Pitch shape: coexistence wedge — in-yard execution + dock-cycle measurement
 *              layer above the gate-and-locate records layer
 * Angle: YARD MANAGEMENT (dock-cycle measurement, in-yard execution, SKU
 *        mix shift from peak-Truly to 2026 portfolio, Hard MTN Dew
 *        appointment-window arbitration, aluminum + glass inbound dock
 *        contention) — NOT driver experience
 * Stakeholder vocabulary: brewery-floor + Tesla-MES register
 *        (Savastano's plant-operator promotion to CSCO; Tesla AGV/MES
 *        baseline; Molson Coors brewery operations) — event-driven APIs,
 *        exception alerts, dwell-measurement granularity, trailer-state
 *        machine logic
 */

import type { AccountMicrositeData } from '../schema';

export const bostonBeerCompany: AccountMicrositeData = {
  slug: 'boston-beer-company',
  accountName: 'Boston Beer Company',
  parentBrand: 'Boston Beer Company',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 80,

  pageTitle: 'YardFlow for Boston Beer Company - The Dock-Cycle Measurement Layer Above Gate-and-Locate',
  metaDescription:
    'How an in-yard execution and dock-cycle measurement layer lands on top of Boston Beer\'s existing site-level gate-and-locate yard system at the PA brewery and Cincinnati — converting Q1 2026\'s +100 bps brewery-efficiency win into the next pull as 95% internal production lands more volume through the same dock infrastructure.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Boston Beer brewery network',
      composition: [
        { label: 'Company-owned brewery footprint', value: '4 breweries — Samuel Adams PA (Breinigsville/Fogelsville, largest in the network, the former F. & M. Schaefer / Diageo Smirnoff Ice plant acquired in 2007), Cincinnati OH (former Hudepohl-Schoenling, $85M canning expansion 2020 → 4× canning capacity), Jamaica Plain MA (heritage/taproom), and Dogfish Head Milton DE (acquired 2019)' },
        { label: 'Contract brewing network', value: 'City Brewing (LaCrosse WI, Memphis TN, Latrobe PA, Irwindale CA) on the contract side — the contract footprint that absorbed peak-Truly capacity in 2020–2021 and has been receding as internal production climbs' },
        { label: 'Q1 2026 production shift', value: '95% of domestic volume produced internally in Q1 2026, up from 85% YoY — ten points of volume moved from contract brewers to the PA, Cincinnati, and Milton DE yards in a single year, against the same dock infrastructure those yards had at peak Truly' },
        { label: 'Margin posture', value: 'Q1 2026 gross margin +100 bps YoY attributed publicly to procurement savings + brewery efficiencies — the first reported quarter under the new Hodges-as-COO / Savastano-as-CSCO structure. Margin must come from operating efficiency, not from price' },
        { label: 'SKU mix shift (peak-Truly → 2026)', value: 'Yard SOPs from 2020–2021 were designed for high-velocity 12-pack canned hard seltzer. The 2026 mix is Twisted Tea (durable cash flow), Sun Cruiser (top-5 spirits RTD growth brand, different TTB classification), Hard MTN Dew (running through traditional beer wholesalers since February 2024), and the craft tail (Sam Adams, Angry Orchard, Dogfish Head) on glass + aluminum. ~2–3× SKU/wholesaler combination complexity at the same dock count' },
        { label: 'Existing yard-tech layer', value: 'Site-level gate-and-locate yard tracking is in production at the named breweries; the in-yard execution and dock-cycle measurement layer above it is unsolved. The 2018-era architecture answers "where is trailer X?" — it does not answer "why was dock 3 idle for 18 minutes between trailers, and what should have happened differently?"' },
      ],
      hypothesis:
        'The interesting thing about the Boston Beer yard math is the timing collision of three things in one operating year. First, Phil Savastano was promoted from running the Sam Adams PA brewery for 18 months to running the whole supply chain in October 2025 — the kind of CSCO whose mental model is "what works at one plant should work at every plant," because that is literally his career arc. Second, Q1 2026 delivered +100 bps gross margin attributed publicly to procurement savings and brewery efficiencies — the first quarter of his tenure, and the lever he is now being measured on. Third, internal production climbed to 95% in the same quarter (up from 85%), meaning ten points of volume just landed at PA, Cincinnati, and Milton DE — the yards that were sized for a different SKU and brand mix four years ago. The gate-and-locate yard system you already operate gives the site-level system of record. It tells you where trailers are at PA today, the same way it told you in 2020 — and that is the right thing for a 2018-era architecture to do. What it does not give — and what the brewery-efficiency margin number now requires — is the in-yard execution and dock-cycle measurement logic that determines whether the consolidated internal volume lands inside the dock-cycle envelope at the existing brewery yards, or breaks it. Twisted Tea, Sun Cruiser, Hard MTN Dew through traditional beer wholesalers, and the Sam Adams / Angry Orchard / Dogfish Head craft tail all share dock doors with peak-Truly-era SOPs. Hard MTN Dew specifically shifted from Blue Cloud Distribution to traditional beer wholesalers in February 2024 — the same wholesaler appointment windows as Sam Adams, with the "distribution friction with independent Pepsi bottlers" line Q1 2026 called out by name. That friction surfaces at the brewery yard, not at the wholesaler — which trailer goes to which distributor at which dock when. The conversation about the PA brewery yard is the conversation about the next 30–50 bps of margin, not about whether yard tech is worth buying.',
      caveat:
        'This is built from Boston Beer\'s Q1 2026 earnings call commentary, the October 2025 Hodges-to-COO / Savastano-to-CSCO announcement, public brewery acquisition history, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: which breweries are running the existing gate-and-locate system at what depth, where the volume shift from contract brewers is biting hardest, and how Hard MTN Dew appointment-window arbitration is being handled today at the PA and Cincinnati yards.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Boston Beer operating profile is shape-similar — multi-site beverage production, packaging-density yards (Cincinnati canning specifically), three-tier wholesaler distribution, mature site-level yard tech already in place — but with significantly more forgiving freight economics per trailer at the brand-and-margin level (beer and hard seltzer ship in dense aluminum-can packs at meaningful per-case margin). If a network operating model can run on water — the hardest CPG freight in the country — the read-across to a brewery network operating on Q1\'s +100 bps brewery-efficiency math is the easier lift.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The cleanest first pilot at Boston Beer is the Sam Adams PA brewery — the largest in the network and the site Savastano personally ran for 18 months before promotion to CSCO. The follow-on is Cincinnati, where the 2020 $85M canning expansion concentrated 4× canning capacity into the same yard surface and where the packaging-density math compounds turn-time savings hardest. Milton DE (Dogfish Head) and the Jamaica Plain heritage site round out the rollout at network cadence rather than site-by-site reinvention.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'boston-beer-public-network',
          source: 'Boston Beer Company public brewery disclosures and corporate communications',
          confidence: 'public',
          detail: 'Anchors the four-brewery company-owned footprint (Samuel Adams PA, Cincinnati OH, Jamaica Plain MA, Dogfish Head Milton DE), the City Brewing contract relationships, and the historical acquisition lineage at each site.',
          url: 'https://www.bostonbeer.com/',
        },
        {
          id: 'boston-beer-q1-2026',
          source: 'Boston Beer Q1 2026 earnings call transcript (April 30, 2026)',
          confidence: 'public',
          detail: '95% internal domestic production in Q1 2026 (up from 85% YoY); gross margin 49.3% (+100 bps) attributed to procurement savings and brewery efficiencies; revenue −4.4% on lower volume; Hard MTN Dew called out for "distribution friction with independent Pepsi bottlers"; Sun Cruiser as top-5 spirits RTD growth brand.',
        },
        {
          id: 'savastano-promotion',
          source: 'Boston Beer Company executive disclosures (October 20, 2025)',
          confidence: 'public',
          detail: 'Phil Savastano promoted to Chief Supply Chain Officer effective October 20, 2025, after running operations at the Samuel Adams Pennsylvania Brewery from March 2024. Phil Hodges promoted to Chief Operating Officer in the same announcement. Savastano remit: brewery management, procurement, customer service, engineering, safety, quality, planning. Logistics/transportation not explicitly named in the announcement.',
        },
        {
          id: 'hard-mtn-dew-migration',
          source: 'Hard MTN Dew distribution shift (February 2024)',
          confidence: 'public',
          detail: 'Hard MTN Dew migrated from PepsiCo\'s Blue Cloud Distribution to traditional beer wholesalers across all 50 states in February 2024 after Virginia wholesaler litigation. Boston Beer\'s PA and Cincinnati yards now ship Hard MTN Dew through the same wholesaler appointment windows as Sam Adams and Twisted Tea — additional appointment-window arbitration on the same dock surface.',
        },
        {
          id: 'cincinnati-canning-expansion',
          source: 'Cincinnati brewery $85M canning expansion (2020)',
          confidence: 'public',
          detail: '2020 Cincinnati investment quadrupled canning capacity (Sam Adams, Angry Orchard, Twisted Tea, Truly). Made Cincinnati the packaging-density anchor for the network. Aluminum can inbound waves (Ball, Crown, Ardagh) into the same yard surface that handles outbound finished goods — the canonical inbound-outbound contention pattern at canning plants.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges. These describe the conditions most multi-site beverage networks operate under, not Boston Beer specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Which Boston Beer breweries are running the existing gate-and-locate yard system at what depth — Cincinnati, PA, Milton DE all probable; specific site-by-site configuration is not public',
        'Where the 10-point internal-production shift in Q1 2026 is biting hardest — and which yards are running closest to dock-cycle capacity right now',
        'How Hard MTN Dew vs. Sam Adams vs. Sun Cruiser appointment-window arbitration is currently handled at the PA and Cincinnati yards — system logic, operator judgment, or per-wholesaler per-shift policy',
        'How aluminum can inbound waves at Cincinnati interleave with finished-goods outbound on the same yard surface — and where the inbound-outbound contention is currently most visible',
        'Whether the existing site-level yard tech ladders into a brewery-efficiency scorecard the CSCO\'s office can act on, or surfaces only as site-by-site records',
        'How the City Brewing contract sites coordinate with the company-owned yards as internal production climbs — and where the "ship-out / receive-from" pattern has been replaced by direct-to-wholesaler flow',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a brewery-network engagement. Boston Beer is distinctive in this round because the case for site-level gate-and-locate yard tracking is not in dispute and should not be relitigated — what is unsolved is the in-yard execution and dock-cycle measurement logic above it, at the moment Q1 2026\'s +100 bps brewery-efficiency number puts the operating-model question on the CSCO\'s scorecard. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and if a network operating model lands on water, a brewery network running on packaging-density and wholesaler appointment-window math is the easier read-across.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for Boston Beer — particularly which yards are running the existing gate-and-locate stack at what depth, where the 10-point internal-production shift has put the most pressure, or how Hard MTN Dew wholesaler-window arbitration is being handled today at PA and Cincinnati — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'boston-beer-001',
      name: 'Phil Savastano',
      firstName: 'Phil',
      lastName: 'Savastano',
      title: 'Chief Supply Chain Officer',
      company: 'Boston Beer Company',
      email: 'philip.savastano@bostonbeer.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain',
      reportsTo: 'Phil Hodges, COO',
      currentMandate:
        'CSCO since October 20, 2025 covering brewery management, procurement, customer service, engineering, safety, quality, planning. Joined Boston Beer March 2024 to run the Samuel Adams Pennsylvania Brewery (Breinigsville/Fogelsville, PA — the largest plant in the network); promoted after 18 months on the floor. Prior career at Tesla and Molson Coors. Q1 2026 +100 bps gross margin attributed to procurement savings + brewery efficiencies is the first quarterly result under his tenure and the lever he is being measured on.',
      bestIntroPath:
        'Direct outreach to the CSCO seat with a PA-brewery-specific operating opener — not a generic vendor demo. He ran the PA yard for 18 months and knows it personally. Site-visit-at-PA is a stronger ask than a virtual call. If delegated, the VP Logistics / Director Distribution under his org is the right alternate; the Director, PA Brewery Operations (his successor) is the operator-level evaluator at the proving site.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'boston-beer-001',
        name: 'Phil Savastano',
        firstName: 'Phil',
        lastName: 'Savastano',
        title: 'Chief Supply Chain Officer',
        company: 'Boston Beer Company',
        email: 'philip.savastano@bostonbeer.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Phil Savastano - Chief Supply Chain Officer',
      variantSlug: 'phil-savastano',

      framingNarrative:
        'Phil, the operating-floor discipline you carried from Tesla and Molson Coors into the Sam Adams PA brewery — event-driven measurement, exception-routed execution, real-time data as the default not the upgrade — is the discipline that turns the existing site-level gate-and-locate layer into an in-yard execution and dock-cycle measurement layer above it. The PA yard you ran for 18 months is the cleanest possible first pilot, and Q1 2026\'s +100 bps brewery-efficiency number is the lever that puts this conversation on your scorecard, not adjacent to it.',
      openingHook:
        'The site-level gate-and-locate yard tracking at the PA brewery — the one you ran for 18 months — gives you the system of record for trailer position. What it does not give you, and what Q1 2026\'s +100 bps brewery-efficiency number now requires from a CSCO standpoint, is the in-yard execution and dock-cycle measurement logic that determines whether the 10-point internal-production shift lands inside the dock-cycle envelope at PA, Cincinnati, and Milton DE — or breaks it on the same dock count.',
      stakeStatement:
        'You went from 85% to 95% internal production in a single year. Same PA dock infrastructure, more SKU/wholesaler combinations (Twisted Tea, Sun Cruiser top-5 RTD, Hard MTN Dew through traditional beer wholesalers since February 2024, the craft tail on glass + aluminum), all sharing the same dock surface. Brewery efficiency without yard efficiency hits the same dock-cycle wall every plant operator knows. The next 30–50 bps of margin lives in the in-yard execution layer above the existing yard system.',

      heroOverride: {
        headline: 'Q1 2026 brewery efficiency was the first pull. Dock-cycle measurement above gate-and-locate is the next one.',
        subheadline:
          '95% internal production lands ten more points of volume through PA, Cincinnati, and Milton DE — against the same dock infrastructure those yards had at peak Truly. The gate-and-locate layer Boston Beer already operates answers "where is trailer X?" — not "why did dock 3 sit idle for 18 minutes, and what should have happened?" That\'s the layer above.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Brewery-floor + Tesla-MES register. Savastano reads event-driven APIs, exception alerts, and trailer-state machine logic faster than narrative or transformation language. Acknowledge the existing site-level yard tech as the right answer to a 2018-era question — the original selection was correct; the SKU mix and the operating problem have moved. Position the wedge as the layer above (in-yard execution + dock-cycle measurement), not as replacement. Number-dense, sub-100-word per touch — he is new in seat, his inbox is brutal, brevity reads as respect. Site-specific (PA brewery, Cincinnati canning, Milton DE) — generic CPG framing reads as research-thin.',
      kpiLanguage: [
        'dock-cycle envelope',
        'in-yard execution',
        'dock idle time between trailers',
        'gate-in to dock-in measurement',
        'wholesaler appointment-window arbitration',
        'brewery-efficiency margin attribution',
        'event-driven dwell measurement',
        'trailer-state machine logic',
        'aluminum + glass inbound contention at Cincinnati',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same multi-site, multi-temp, packaging-density shape, harder freight (water), already running the network-level layer above existing site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic — multi-site beverage-adjacent network where trailer density and SKU-velocity math is closer to Boston Beer\'s than a Daimler Trucks analog would be.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '4 company-owned breweries (Samuel Adams PA Breinigsville/Fogelsville, Cincinnati OH, Jamaica Plain MA, Dogfish Head Milton DE) + contract brewing via City Brewing (LaCrosse WI, Memphis TN, Latrobe PA, Irwindale CA)',
    facilityTypes: ['Breweries', 'Canning Facilities (Cincinnati packaging-density anchor)', 'Contract Brewing Sites'],
    geographicSpread: 'North America (HQ: Boston MA; largest brewery: Breinigsville/Fogelsville PA; Cincinnati OH; Milton DE; City Brewing contract sites across WI/TN/PA/CA)',
    dailyTrailerMoves: 'High-volume — 95% internal production in Q1 2026 (up from 85%) loads more volume through PA, Cincinnati, and Milton DE yards; three-tier alcoholic beverage distribution mandates wholesaler-to-retailer flow; distributor inventory at 4.5 weeks on hand at end of Q1 2026',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Inbound Aluminum Can Rail/Truck (Cincinnati)', 'Inbound Glass (PA / craft tail)'],
    avgLoadsPerDay: 'High-volume — Sam Adams, Twisted Tea, Truly, Angry Orchard, Dogfish Head, Hard MTN Dew, Sun Cruiser brand mix; 2–3× SKU/wholesaler combination complexity vs. the 2020–2021 peak-Truly mix on the same dock count',
    specialRequirements: [
      'Three-tier distribution (alcoholic beverage law mandate)',
      'Glass + aluminum can SKU mix (PA glass; Cincinnati aluminum density)',
      'Wholesaler appointment cadence (Hard MTN Dew through traditional beer wholesalers since Feb 2024)',
      'Multi-TTB-classification (beer + spirits-based RTD via Sun Cruiser)',
      'Aluminum can inbound rail/truck waves at Cincinnati interleave with outbound finished goods',
    ],
  },

  signals: {
    recentNews: [
      'Phil Savastano promoted to CSCO October 20, 2025 — 18-month tenure running the Samuel Adams PA Brewery before promotion; CSCO remit covers brewery management, procurement, customer service, engineering, safety, quality, planning.',
      'Phil Hodges promoted to COO in the same October 2025 announcement; CEO Jim Koch stated the move would let him focus on innovation, wholesaler relations, and brand strategy.',
      'Q1 2026: 95% internal domestic production (up from 85% YoY); gross margin 49.3% (+100 bps) attributed to procurement savings and brewery efficiencies — the first quarterly result under the new Hodges-as-COO / Savastano-as-CSCO structure.',
      'Hard MTN Dew shifted from Blue Cloud Distribution to traditional beer wholesalers across all 50 states in February 2024 — adds wholesaler appointment-window complexity at the same brewery yards.',
      'Sun Cruiser is now a top-5 spirits RTD and the leading on-premise spirits tea — different TTB classification than malt-based beer; produced in the existing brewery network without adding doors.',
      'Cincinnati $85M canning expansion (2020) quadrupled canning capacity for Sam Adams, Angry Orchard, Twisted Tea, Truly — Cincinnati is the packaging-density anchor for the combined network.',
    ],
    urgencyDriver:
      'Boston Beer shifted ten points of volume from contract brewers to internal production in a single year — Q1 2026 went from 85% to 95% internal. That volume landed at PA, Cincinnati, and Milton DE yards sized for the 2020–2021 peak-Truly SKU and brand mix, against the same dock infrastructure. Q1 2026 delivered +100 bps gross margin attributed publicly to brewery efficiency; Savastano is the CSCO of record on that number and is being measured on whether Q2, Q3, Q4 continue the trajectory. Brewery efficiency without yard efficiency hits the same dock-cycle wall. The in-yard execution and dock-cycle measurement layer above the existing site-level yard tech is the no-capex margin lever that compounds the Q1 win.',
  },

  theme: {
    accentColor: '#8B1A1A',
  },
};
