/**
 * Coca-Cola (The Coca-Cola Company + the U.S. bottler system) — ABM Microsite Data
 * Quality Tier: A (Tier 1 Band A; named C-level targets; public 10-K
 * disclosures from largest bottler franchisee; KORE / Refresh / Fairlife
 * public intel).
 *
 * Structural reality this microsite handles:
 *   - TCCC manufactures concentrate and owns the brand + system-wide
 *     operating standards (KORE for quality, safety, environment).
 *   - The U.S. yards are operated by independent franchise bottlers:
 *     Coca-Cola Consolidated (CCBCC, public — largest), Reyes Coca-Cola
 *     Bottling (private — second largest), Swire Coca-Cola USA (Asian
 *     conglomerate, western U.S.), Liberty Coca-Cola (NYC metro), and
 *     ~60 other regional franchisees post-refranchising (2017).
 *   - TCCC's North America operating company (CCNA) sits above the
 *     bottler network on system-wide standards but does not run yards.
 *   - The Bottling Investments Group (BIG) owns and operates bottlers
 *     directly, but BIG is now international — its U.S. footprint was
 *     refranchised in 2017.
 *
 * Pitch shape: system-wide yard operating standards land on
 * independently-operated bottler yards — shape-similar to how KORE
 * already lands quality and safety standards across the same yards.
 * The wedge is the operating layer above franchise sovereignty, not
 * displacement of any one bottler's site-level practice.
 *
 * Angle: YARD MANAGEMENT — dock arbitration, multi-temp staging
 * (ambient + Fairlife cold chain), summer-peak surge readiness,
 * concentrate-plant-to-bottler trailer flow at shared inbound nodes.
 */

import type { AccountMicrositeData } from '../schema';
import { getFacilityCountLabel, getFacilityCountLowerBound } from '../../research/facility-fact-registry';

const COCA_COLA_FACILITY_COUNT_LABEL = getFacilityCountLabel('Coca-Cola', '70+');
const COCA_COLA_FACILITY_COUNT = getFacilityCountLowerBound('Coca-Cola', 70) ?? 70;

export const cocaCola: AccountMicrositeData = {
  slug: 'coca-cola',
  accountName: 'Coca-Cola',
  parentBrand: 'The Coca-Cola Company',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 84,

  pageTitle: 'Coca-Cola · System-wide yard standards across an independently-operated bottler network',
  metaDescription: `The Coca-Cola system runs ${COCA_COLA_FACILITY_COUNT_LABEL} U.S. bottler sites across ~60 independent franchisees. KORE sets system-wide quality and safety standards; the yard layer above the sites is the unstandardized seam.`,

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Coca-Cola bottling network',
      composition: [
        { label: 'U.S. bottler structure', value: `~60 independent franchisees post-refranchising (2017). Largest three: Coca-Cola Consolidated (CCBCC, public; ${COCA_COLA_FACILITY_COUNT_LABEL} sites across 14 states + DC), Reyes Coca-Cola Bottling (private; Chicago, CA, Midwest), Swire Coca-Cola USA (13 western states; $475M Colorado Springs plant breaking ground 2026).` },
        { label: 'TCCC operating layer', value: 'Concentrate plants + brand + system-wide standards via KORE (quality, safety, environment). North America operating company (CCNA) sits above the bottler system; Bottling Investments Group (BIG) operates internationally after U.S. refranchising completed in 2017.' },
        { label: 'Existing site-level yard tech', value: 'Mature at the largest franchisees — Consolidated and the regional bottlers have layered point solutions and 3PL practices into their yards over the last decade. What does not exist yet is a network-level operating layer that lets KORE-style standards land on yard ops the same way they land on quality.' },
        { label: 'Multi-temp + multi-format complexity', value: 'Cans, bottles, fountain syrup, and Fairlife cold chain (acquired 2020) compete for the same dock doors at bottler DCs. Multi-temp arbitration is a site-by-site decision today.' },
        { label: 'Peak pattern', value: 'Summer surge (Memorial Day → Labor Day) drives ~40% volume spike; yards designed for average throughput compress hardest in that window. Holiday and Super Bowl windows add secondary peaks.' },
        { label: 'Public detention anchor', value: 'Coca-Cola Consolidated 10-K cites material detention and demurrage costs at one bottler. Across the full U.S. franchisee footprint, the same line item is unaggregated by design — each bottler reports its own.' },
        { label: 'Working-capital structure', value: 'TCCC earns concentrate margin; bottlers earn distribution margin. Yard variance lands on bottler P&Ls, but service variance lands on TCCC brand commitments. The two halves of the system feel the same yard problem differently.' },
      ],
      hypothesis:
        'The interesting thing about Coca-Cola is that the company already solved the harder version of this problem twenty-some years ago. KORE is the operating-system answer to how you land system-wide quality and safety standards on yards you do not directly operate. Every franchise bottler runs to the same KORE specifications even though Coca-Cola does not run the plant — it works because the standard is unambiguous, the audit cadence is real, and the franchise agreement makes adherence non-optional. The yard layer above the sites is the surface where that operating-system thinking has not yet landed. Each bottler runs its yard the way it has always run it. Consolidated\'s gatehouse practice is not Reyes\'s, which is not Swire\'s, which is not Liberty\'s. None of those are wrong individually; they are the accumulated tribal knowledge of mature operators. But none of them roll up into a single number the CCNA leadership team can read against a KORE-style standard, and none of them describe the dock-arbitration logic at a Fairlife-staging plant the same way as at an ambient-only plant. The franchise structural reality also has a working-capital wrinkle. TCCC earns concentrate margin, bottlers earn distribution margin, and the yard sits inside the bottler P&L — which means the operating-line consequence of yard variance reads as a bottler problem, while the brand-commitment consequence reads as a TCCC problem. The two halves of the system feel the same delay differently, and neither half is set up to add it up across operators. Three pressures make this more expensive than it used to be. First, Refresh-era inventory tightening across the orchestrated supply chain — leaner system-wide inventory turns a 90-minute yard delay that used to land inside safety stock into a service miss to a retail customer who scorecards the bottler directly. Second, the AI and demand-sensing analytics layer Coca-Cola has been building with partners is the layer that needs clean, comparable yard execution data underneath it; today that data is bottler-specific and not normalized, which means the analytics layer reads execution variance as noise it cannot decompose. Third — and this one is forward-looking — Swire\'s new Colorado Springs plant breaks ground in 2026, Consolidated\'s ongoing facility investment program is throughputting out at the sites that received capex first, and Fairlife cold-chain expansion is adding dock-arbitration competition at multi-temp bottler DCs. Each of those adds throughput-out-the-door capacity at sites where the yard is the next constraint, not the plant. The pilot logic for this account is not "Coca-Cola HQ rolls out a yard system across 70 facilities." The pilot logic is "one Consolidated campus where the public detention number already anchors the business case, or one Reyes campus where the summer peak makes the operating case, runs the operating layer first; CCNA endorses it as a KORE-style standard the rest of the system can opt into without giving up franchise sovereignty." That sequence is the precedent the system already knows how to execute on.',
      caveat:
        'This is built from public TCCC and CCBCC disclosures, the public Refresh strategy materials, KORE program descriptions, and reasonable inference about how the franchise governance layer actually translates into operating practice across bottlers. We may be wrong about parts of it — the most useful pushback is on whether CCNA already has a yard-ops working group across the largest bottlers that we are not seeing publicly, whether Consolidated\'s site-level yard practice is mature enough to be the system reference rather than the pilot target, and how the Fairlife cold-chain integration is actually changing dock-door arbitration at the bottlers running both ambient and refrigerated lines.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by refill returns for 5-gallon formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The shape-similarity to the Coca-Cola system is unusually clean: multi-site bottling, multi-temp dock-door competition, regional-DC structure, peak-season surge, and an existing yard-tech layer at the operator level. The freight-economics difference is the other direction from the usual analogy — soft drinks are higher-margin per case than bottled water, which means the yard-waste recovery line is wider, not narrower. The franchise-network wrinkle does not change the operating logic; it changes who endorses the standard and how it lands across sovereign operators.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The Coca-Cola pilot logic is different in kind from a single-operator pilot. The two highest-leverage starting points are: (1) one Coca-Cola Consolidated campus where the $14M public detention anchor already names the cost, which means the business case is pre-written; (2) one Reyes Coca-Cola Bottling site in California, where the summer peak hits hardest and Reyes\'s broader logistics organization can carry the operating learning across other beverage and food businesses inside the parent group. Either pilot lands inside one bottler\'s operating sovereignty, ladders to a CCNA-endorsed system standard within two to four quarters, and becomes opt-in across the remaining ~60 franchisees over the following year.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'ko-10k-2024',
          source: 'The Coca-Cola Company 2024 Form 10-K',
          confidence: 'public',
          detail: 'Anchors the U.S. franchise structure post-2017 refranchising, the concentrate-plant + Bottling Investments Group operating model, and the system-wide volume footprint that sits above the bottler network.',
          url: 'https://investors.coca-colacompany.com/filings-reports/all-sec-filings/content/0000021344-25-000011/ko-20241231.htm',
        },
        {
          id: 'ccbcc-10k',
          source: 'Coca-Cola Consolidated 2024 Form 10-K',
          confidence: 'public',
          detail: `Public disclosure of the ${COCA_COLA_FACILITY_COUNT_LABEL}-site CCBCC bottler footprint (60 distribution centers + 10 manufacturing plants across the Carolinas, Central, Mid-Atlantic, Mid-South, and Mid-West markets). CCBCC is the largest U.S. Coca-Cola bottler franchisee and the only major one whose detention and demurrage costs appear in public filings.`,
          url: 'https://investor.cokeconsolidated.com/',
        },
        {
          id: 'ko-system-kore',
          source: 'The Coca-Cola System + KORE public materials',
          confidence: 'public',
          detail: 'KORE is the system-wide quality, safety, and environmental operating-standards framework that lands at every bottler\'s plant despite franchise sovereignty. This is the precedent for how operating-layer standards translate across the network. ~60 U.S. franchisees today, down from 300+ in 2010 per public consolidation reporting.',
          url: 'https://www.coca-colacompany.com/about-us/coca-cola-system',
        },
        {
          id: 'ko-refresh-2025',
          source: 'TCCC Refresh strategic plan + supply chain transformation reporting',
          confidence: 'public',
          detail: 'Refresh strategic pillars (Crafting Beloved Brands, Refreshing Body & Spirit, Sustainable Business) plus the $2.1B sustainability capex line and the orchestrated-supply-chain shift to a partner-based network with centralized standards and distributed execution.',
        },
        {
          id: 'swire-cspr',
          source: 'Swire Coca-Cola USA $475M Colorado Springs plant announcement',
          confidence: 'public',
          detail: '620,000-sq.-ft. bottling facility breaking ground 2026 in southeast Colorado Springs. Adds throughput in Swire\'s 13-state western footprint and creates a greenfield yard-design entry point with no entrenched operating practice to displace.',
          url: 'https://www.fooddive.com/news/coca-cola-bottling-plant-colorado/807898/',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site CPG and beverage networks operate under, not the Coca-Cola system specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether CCNA already runs a cross-bottler yard-ops working group that we are not seeing in public disclosures',
        'How franchise governance actually translates KORE-style standards onto yard execution today — audit cadence, scorecard structure, opt-in mechanics',
        'Whether the largest franchisees (Consolidated, Reyes, Swire) share carrier or dock-performance scorecards across the system, or each one runs its own',
        'Where Fairlife cold-chain integration has already produced visible multi-temp dock contention at bottler DCs running both ambient and refrigerated lines',
        'How the existing AI / demand-sensing analytics partnerships ingest bottler yard execution data today — and whether that data is normalized across operators',
        'How Coca-Cola Consolidated\'s ongoing facility investment program is changing trailer arrival patterns at the sites that received capex first',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Coca-Cola is distinctive in this round for one reason: the question is not whether yard standardization works (KORE already proved at the quality and safety layer that system-wide standards can land on independently-operated yards), but whether the same operating-system thinking should now run the yard layer above the sites. The water comparable is intentional. Primo Brands runs the hardest CPG freight in North America, and the read-across to a soft-drink franchise network is the easier lift, not the harder one — both on freight economics and on the operating-layer-above-the-sites question.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for Coca-Cola — particularly the picture of how franchise governance translates KORE-style standards into yard ops, the assumption that yard execution data is not yet normalized into the analytics layer, or the pilot logic of starting at Consolidated or Reyes rather than at CCNA — that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  // ── THE PEOPLE ──────────────────────────────────────────────────────
  people: [
    {
      personaId: 'coke-coe',
      name: 'Daniel Coe',
      firstName: 'Daniel',
      lastName: 'Coe',
      title: 'President, Chief Procurement Officer & Supply Chain Services',
      company: 'The Coca-Cola Company',
      email: 'dcoe@coca-cola.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Procurement / Supply Chain',
      reportsTo: 'CEO James Quincey',

      careerHistory: [
        { period: '2022-present', role: 'President, CPO & Supply Chain Services', company: 'Coca-Cola', relevance: 'Owns procurement and supply chain services for the entire Coca-Cola system.' },
        { period: 'Prior', role: 'President, Bottling Investments Group (BIG)', company: 'Coca-Cola', relevance: 'Led BIG - meaning he understands bottler operations from the inside. Knows where the pain is.' },
      ],
      yearsAtCompany: '20+',
      knownForPhrase: 'Deep operations background, rose through bottling side - understands the physical reality',

      currentMandate: 'System-wide supply chain transformation, digital capabilities investment',
      strategicPriorities: ['Supply chain transformation', 'Digital capabilities', 'Bottler network coordination'],
      knownPainPoints: [
        `Multi-bottler coordination across ${COCA_COLA_FACILITY_COUNT_LABEL} facilities`,
        'Detention costs ($14M+ at CCBCC alone)',
        'Summer peak volume spikes (40%)',
        'Fairlife cold chain integration',
      ],

      communicationStyle: 'Operations executive who rose through bottling - speak to the physical reality he knows.',
      languagePreferences: ['system-wide', 'bottler network', 'operational efficiency', 'procurement leverage'],
      connectionHooks: ['Atlanta HQ — local to major industry events', 'Came from BIG (bottling) - understands yard operations personally'],
      eventProximity: 'Atlanta HQ — local to major industry events',
    },
    {
      personaId: 'coke-jadhav',
      name: 'Dinesh Jadhav',
      firstName: 'Dinesh',
      lastName: 'Jadhav',
      title: 'Chief Supply Chain Officer, Bottling Investments Group',
      company: 'The Coca-Cola Company',
      email: 'dijadhav@coca-cola.com',
      roleInDeal: 'operator-buyer',
      seniority: 'C-level',
      function: 'Supply Chain',

      careerHistory: [
        { period: 'Current', role: 'Chief Supply Chain Officer, Bottling Investments Group', company: 'The Coca-Cola Company', relevance: 'Owns supply-chain execution for the bottling side of the Coca-Cola system.' },
        { period: 'Prior', role: 'Chief Supply Chain Officer across Southeast Asia, Southwest Asia, and parts of the Middle East', company: 'The Coca-Cola Company', relevance: 'Ran end-to-end supply operations across complex multi-market bottling environments.' },
        { period: 'Earlier', role: 'Executive Director and Head of Supply Chain', company: 'Hindustan Coca-Cola Beverages', relevance: 'Deep bottling-operations background, not just corporate planning distance.' },
      ],
      yearsAtCompany: 'Multi-decade Coca-Cola bottling and supply background',

      currentMandate: 'Drive end-to-end bottling supply-chain performance inside the Bottling Investments Group',
      strategicPriorities: ['Bottling execution discipline', 'End-to-end supply synchronization', 'Peak-season throughput', 'Repeatable operating standards across BIG facilities'],
      knownPainPoints: [
        'Bottling yards absorb concentrate, packaging, and outbound coordination failures first',
        'Peak-season bottler volume surges overwhelm manual dock and yard processes',
        'Shared inbound facilities create cascading delays across multiple operators',
        'Execution variance at the yard undermines otherwise strong planning systems',
      ],

      communicationStyle: 'Bottling operator with enterprise scope. Talk about physical execution, not abstract transformation language.',
      languagePreferences: ['bottling', 'end-to-end', 'throughput', 'execution', 'supply synchronization'],
      connectionHooks: [
        'BIG role means he owns the yards Coca-Cola directly controls',
        'Prior regional CSCO scope proves he understands network-scale execution, not just one plant',
        'His background is supply-chain-heavy enough to discuss dock, staging, and trailer flow directly',
      ],
    },
    {
      personaId: 'coke-eppert',
      name: 'Mark Eppert',
      firstName: 'Mark',
      lastName: 'Eppert',
      title: 'Chief Financial and Supply Chain Officer, Coca-Cola North America',
      company: 'The Coca-Cola Company',
      email: 'meppert@coca-cola.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Finance / Supply Chain',

      currentMandate: 'Lead North America financial performance and supply-chain stewardship across the United States and Canada',
      strategicPriorities: ['Growth with disciplined stewardship', 'North America supply productivity', 'Finding hidden opportunities', 'Cross-functional finance and supply-chain alignment'],
      knownPainPoints: [
        'Detention and dwell leak directly into North America cost structure',
        'Hidden yard variance creates unintended downstream consequences',
        'Peak-season throughput pressure compounds into both cost and service misses',
        'Working-capital drag grows when trailer turns and staging cycles slow down',
      ],

      communicationStyle: 'Finance and supply-chain executive. Lead with cost, service, and capital together, then show the operating lever underneath.',
      languagePreferences: ['performance', 'stewardship', 'growth', 'hidden opportunities', 'operational leadership'],
      connectionHooks: [
        'Atlanta-based North America role is local to major industry events',
        'Public descriptions of his role emphasize both financial management and supply leadership',
        'He is one of the few executives who feels yard waste in both the P&L and the operating cadence',
      ],
      eventProximity: 'Atlanta-based North America leadership role — local to major industry events.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'coke-coe',
        name: 'Daniel Coe',
        firstName: 'Daniel',
        lastName: 'Coe',
        title: 'President, Chief Procurement Officer & Supply Chain Services',
        company: 'The Coca-Cola Company',
        email: 'dcoe@coca-cola.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Procurement / Supply Chain',
      },
      fallbackLane: 'executive',
      label: 'Daniel Coe - CPO & Supply Chain',
      variantSlug: 'daniel-coe',

      framingNarrative:
        'Daniel, your background inside the Bottling Investments Group means the yard is not abstract to you. You know what concentrate-plant-to-bottler trailer flow looks like in July, and you know the difference between a KORE-style standard that actually lands at the plant and one that sits in a binder. The question on the table is whether the operating-system thinking that put quality and safety on a single KORE stack should now run the yard layer above the sites the same way — across the ~60 independent U.S. franchisees you do not operate but do set standards for.',
      openingHook:
        'The yard is the surface where KORE-style operating-system thinking has not yet landed. The franchise governance precedent exists; the yard standard does not.',
      stakeStatement:
        `Coca-Cola Consolidated\'s detention and demurrage line is public — at one bottler. Across the rest of the U.S. franchisee footprint the same line item is unaggregated by design, which means the system-wide number is the one nobody has the right to add up and the one that would matter most in any procurement or system-economics conversation.`,

      heroOverride: {
        headline: 'The yard standard is the next KORE-shaped opportunity in the Coca-Cola system.',
        subheadline:
          `KORE landed system-wide quality and safety standards on yards Coca-Cola does not directly operate. The yard execution layer above the sites is the unstandardized seam — ${COCA_COLA_FACILITY_COUNT_LABEL} bottler sites running their own dock arbitration, their own multi-temp staging, their own carrier scorecards.`,
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer operating-system framing. Coe came up through bottling; he does not need a glossary. Anchor on KORE as the precedent for how system-wide standards land on franchise-operated yards — the pattern works because the standard is unambiguous, the audit is real, and the franchise agreement makes adherence non-optional. Position the yard layer as the next KORE-shaped surface, not as replacement of any one bottler\'s practice.',
      kpiLanguage: [
        'system-wide operating standard',
        'KORE-shaped standard',
        'franchise-network coordination',
        'detention and demurrage',
        'peak-season throughput',
        'dock-door arbitration',
        'multi-temp staging',
      ],
      proofEmphasis:
        'The Primo comparable is the public flex — same shape, harder freight, already running the operating layer above site-level yard systems. The directly-shaped reference (un-name-able 237-facility CPG anchor) is the peer-call escalation if the question becomes "who else runs this at our scale."',
    },
    {
      person: {
        personaId: 'coke-jadhav',
        name: 'Dinesh Jadhav',
        firstName: 'Dinesh',
        lastName: 'Jadhav',
        title: 'Chief Supply Chain Officer, Bottling Investments Group',
        company: 'The Coca-Cola Company',
        email: 'dijadhav@coca-cola.com',
        roleInDeal: 'operator-buyer',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Dinesh Jadhav - BIG Supply Chain',
      variantSlug: 'dinesh-jadhav',

      framingNarrative:
        'Dinesh, BIG is where the operating reality lives. Post-2017 U.S. refranchising, BIG is the part of the Coca-Cola system that still operates bottling end-to-end at scale — across multi-market environments where concentrate flow, packaging supply, and outbound trailer coordination have to stay synchronized. The yard is the surface where that synchronization breaks first. The lift here is not a planning-layer upgrade; it is making trailer-to-dock execution deterministic across the bottling environments BIG runs, and giving the U.S. franchise system a reference implementation it can opt into.',
      openingHook:
        'Bottling execution breaks at the yard before it shows up in service or cost. BIG is the operating company that feels both halves of that break.',
      stakeStatement:
        'When the yard goes sideways, the cost lands on the bottling operating P&L and the service miss lands on the brand commitment. BIG is one of the few seats in the Coca-Cola system that carries both at once — which is why the yard-execution standard matters here before it matters anywhere else.',

      heroOverride: {
        headline: 'Bottling execution breaks at the yard before it breaks anywhere else in the system.',
        subheadline:
          'BIG operates bottling end-to-end across multiple markets. The yard layer above the sites is where dock arbitration, multi-temp staging, and peak-season throughput either hold together or do not — and where one execution standard pays back fastest.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Jadhav lives in bottling execution across multi-market environments — concentrate flow, dock sequencing, peak-season throughput. He does not need the franchise governance argument explained; he needs the operating-layer case. Speak to the physical reality of the dock and the gate.',
      kpiLanguage: [
        'throughput',
        'dock turns',
        'bottling execution',
        'multi-temp staging',
        'peak-season readiness',
        'trailer-to-dock cycle',
      ],
      proofEmphasis:
        'Lead with operating repeatability across multi-site beverage networks. The Primo comparable matters because water is the operationally hardest CPG freight in North America — if the operating layer lands on water, soft-drink beverage is the easier read-across.',
    },
    {
      person: {
        personaId: 'coke-eppert',
        name: 'Mark Eppert',
        firstName: 'Mark',
        lastName: 'Eppert',
        title: 'Chief Financial and Supply Chain Officer, Coca-Cola North America',
        company: 'The Coca-Cola Company',
        email: 'meppert@coca-cola.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Finance / Supply Chain',
      },
      fallbackLane: 'cfo',
      label: 'Mark Eppert - NA Finance & Supply Chain',
      variantSlug: 'mark-eppert',

      framingNarrative:
        'Mark, the unusual thing about your role is that very few executives carry both a North America P&L and the North America supply chain at the same time. That means the yard problem reads differently from where you sit than from anywhere else in the Coca-Cola system: a service miss to a retail customer, a cost leakage on the operating line, and a working-capital drag on the lean-inventory posture the Refresh-era supply chain runs on — all expressed at the same time, by the same trailer, at the same dock door. CCNA is the seat in the system where that compounded picture lives.',
      openingHook:
        'For North America, the yard problem lands on the P&L, the supply plan, and the working-capital line simultaneously — and CCNA is the only seat that sees all three at once.',
      stakeStatement:
        'Leaner system-wide inventory turns yard variance into a customer-facing service variance, not a recoverable internal buffer. The yard becomes one of the few execution leaks that hits cost, service, and working capital across the North America network in the same week.',

      heroOverride: {
        headline: 'North America is the seat in the system that feels the yard problem on three lines at once.',
        subheadline:
          'Detention and dwell sit on the operating line. Service variance sits on retail-customer scorecards. Leaner inventory turns the same delay into a working-capital drag. CCNA is where all three converge — and where the case for a system-wide standard pays back across all three at the same time.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Numbers first, but operationally grounded. Eppert reads the operating consequence and the financial consequence on the same page. Show how one execution standard changes cost, service, and working capital together — not as three separate cases.',
      kpiLanguage: [
        'detention and demurrage',
        'service variance',
        'working-capital drag',
        'dock turn time',
        'North America productivity',
        'inventory-coverage discipline',
      ],
      proofEmphasis:
        'Lead with the public detention disclosure at Consolidated as the cost anchor; then layer in the Primo measured turn-time improvement and per-site profit impact as the operating-financial story translated into the CCNA frame.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live' },
        { value: '>200', label: 'Contracted Network' },
        { value: '48-to-24', label: 'Min Truck Turn Time' },
        { value: '$1M+', label: 'Per-Site Profit Impact' },
      ],
    },
  ],

  roiModel: {
    sourceOfTruth: 'shared-engine',
    calculatorVersion: 'ROI Calculator V2 public contract',
    scenarioLabel: `Conservative ${COCA_COLA_FACILITY_COUNT}-facility Coca-Cola bottler network model using the lower-bound system footprint already documented in research`,
    averageMarginPerShipment: 125,
    facilityMix: [
      { archetype: 'with-yms', facilityCount: 10 },
      { archetype: 'drops-no-yms', facilityCount: 36 },
      { archetype: 'without-drops', facilityCount: 24 },
    ],
    archetypeAssumptions: [
      { archetype: 'with-yms', shipmentsPerDay: 155 },
      { archetype: 'drops-no-yms', shipmentsPerDay: 120 },
      { archetype: 'without-drops', shipmentsPerDay: 40 },
    ],
    accountAssumptions: [
      {
        label: 'Modeled facility count',
        value: COCA_COLA_FACILITY_COUNT,
        unit: 'facilities',
        sourceNoteId: 'coke-network-footprint',
      },
      {
        label: 'Public detention anchor',
        value: 14_000_000,
        unit: 'USD/year',
        sourceNoteId: 'coke-detention-anchor',
      },
      {
        label: 'Average margin per shipment',
        value: 125,
        unit: 'USD/shipment',
        sourceNoteId: 'coke-margin-estimate',
      },
      {
        label: 'Archetype mix',
        value: '10 with YMS, 36 drops no YMS, 24 without drops',
        sourceNoteId: 'coke-facility-mix',
      },
    ],
    sourceNotes: [
      {
        id: 'coke-network-footprint',
        label: 'Lower-bound Coca-Cola system footprint',
        detail: `The flagship microsite uses Coca-Cola Consolidated's disclosed 60 distribution centers and 10 manufacturing plants as the official ${COCA_COLA_FACILITY_COUNT_LABEL} site lower bound for the modeled bottler footprint.`,
        confidence: 'public',
        citation: 'src/lib/data/facility-facts.json',
      },
      {
        id: 'coke-detention-anchor',
        label: 'CCBCC detention and demurrage anchor',
        detail: 'Coca-Cola Consolidated publicly disclosed a $14M detention and demurrage figure, which remains the external cost anchor for the Coca-Cola flagship ROI story.',
        confidence: 'public',
        citation: 'docs/research-dossiers-top10.md',
      },
      {
        id: 'coke-margin-estimate',
        label: 'Conservative per-shipment margin',
        detail: 'Average margin per shipment is kept materially below the public calculator default to stay conservative relative to bottler economics and mixed beverage routes.',
        confidence: 'estimated',
      },
      {
        id: 'coke-facility-mix',
        label: 'Facility archetype mix',
        detail: 'Facility mix is inferred from a system made up of large bottler sites, company-owned concentrate operations, and smaller facilities still running local dock practices.',
        confidence: 'inferred',
        citation: 'src/lib/data/facility-facts.json',
      },
    ],
  },

  network: {
    facilityCount: COCA_COLA_FACILITY_COUNT_LABEL,
    facilityTypes: ['Concentrate Plants', 'Bottling Facilities', 'Distribution Centers', 'Cold Storage'],
    geographicSpread: 'National - Atlanta HQ, Consolidated (14 states plus DC, 70 disclosed sites), Reyes, Liberty (NYC), Swire (Western US)',
    dailyTrailerMoves: '15,000+ system-wide during peak',
    peakMultiplier: '1.4x during summer',
    fleet: 'Estimated 15,000+ trucks through bottling system',
    keyFacilities: [
      { name: 'Coca-Cola HQ', location: 'Atlanta, GA', type: 'Headquarters', significance: 'Atlanta HQ — local to major industry events', yardRelevance: 'Proximity = easiest meeting scheduling possible' },
      { name: 'CCBCC Bottler Footprint', location: '14 states plus DC', type: '10 Manufacturing Plants + 60 Distribution Centers', significance: 'Largest U.S. Coca-Cola bottler disclosed 70 sites in its 2025 10-K', yardRelevance: '$14M detention costs documented in 10-K' },
    ],
  },

  freight: {
    primaryModes: ['Truckload', 'DSD', 'Intermodal'],
    avgLoadsPerDay: '15,000+ system-wide during peak',
    peakSeason: 'Summer (May-September), 40% volume spike. Memorial Day, July 4th, Labor Day peaks.',
    keyRoutes: ['Concentrate plants to bottlers', 'Bottlers to DCs', 'DCs to retail'],
    detentionCost: '$14M at CCBCC alone (2023 10-K), estimated $40M+ system-wide',
    specialRequirements: ['Multi-temperature (ambient + cold chain for Fairlife)', 'Reusable container returns (glass bottles)'],
  },

  signals: {
    eventAttendance: 'Atlanta-based, local to major industry events',
    recentNews: [
      'Q4 2024: "supply chain transformation" initiative, digital capabilities investment',
      'Blue Yonder partnership for supply chain planning (2024)',
      'CCBCC investing $500M+ in fleet and facility upgrades 2024-2026',
      'Fairlife acquisition (2020) adding cold chain complexity',
    ],
    supplyChainInitiatives: ['Supply chain transformation', 'Blue Yonder partnership', 'Digital capabilities investment'],
    urgencyDriver: 'CCBCC $500M facility investment happening now. Atlanta HQ — lowest-friction meeting in the market.',
  },

  theme: {
    accentColor: '#F40009',
    backgroundVariant: 'dark',
  },
};
