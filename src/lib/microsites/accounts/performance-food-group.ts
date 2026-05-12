/**
 * Performance Food Group — ABM Microsite Data
 * Quality Tier: Tier 2 Band B (foodservice distribution; ~$60B revenue scale)
 * Pitch shape: network-level yard operating model laddering across PFG's
 * three-segment distribution network. Foodservice broadline DCs run the
 * most operationally complex multi-temp dock arbitration in CPG-adjacent
 * distribution — refrigerated + frozen + ambient inbound from hundreds of
 * CPG suppliers, then DSD route-truck loading for AM delivery to ~300,000
 * customer stops daily. Cheney Brothers (closed Oct 8, 2024 for $2.1B,
 * five DCs in FL+NC, ~$3.2B revenue) added regional foodservice DCs with
 * pre-acquisition yard operating habits. The seam is where two different
 * DC operating philosophies converge at the dock layer.
 * Angle: YARD MANAGEMENT — multi-temp dock arbitration at broadline
 * foodservice DCs, DSD route-load sequencing, and the Cheney-integration
 * yard handoff between legacy PFG and Cheney-network operating norms.
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const performanceFoodGroup: AccountMicrositeData = {
  slug: 'performance-food-group',
  accountName: 'Performance Food Group',
  coverHeadline: 'The yard layer above the Cheney integration',
  titleEmphasis: 'above the Cheney integration',
  coverFootprint: '~155 DCs · Cheney integrating',
  vertical: 'grocery',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: 'Performance Food Group · Broadline foodservice DCs and the multi-temp dock at the gate',
  metaDescription:
    "PFG runs ~155 distribution centers across Foodservice, Specialty, and Convenience (Core-Mark), feeding ~300,000 customer stops daily on DSD route trucks. The Cheney Brothers acquisition added five Southeast foodservice DCs with their own operating practice. The yard layer above the network is where two DC operating philosophies converge at the dock.",

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the PFG US distribution network',
      composition: [
        {
          label: 'US distribution footprint',
          value: '~155 distribution centers across the United States and Canada, organized into three reportable segments — Foodservice, Specialty (formerly Vistar), and Convenience (Core-Mark)',
        },
        {
          label: 'Segment mix at the dock',
          value: 'Foodservice ~53% of FY25 revenue (broadline distribution to restaurants, schools, healthcare, hospitality) · Convenience ~39% (Core-Mark to c-stores) · Specialty ~8% (vending, theater, hospitality, travel concessions)',
        },
        {
          label: 'Segment operating-day shapes',
          value: 'Foodservice runs a near-daily DSD cadence into restaurants with overnight route-load completing by 4 AM — three temperature zones, hundreds of inbound suppliers per DC, AM customer windows non-negotiable. Convenience (Core-Mark) runs weekly-to-twice-weekly c-store deliveries on a different carrier profile and a different inbound peak. Specialty/Vistar runs vending, theater, and concession pickup windows that do not match either of the other two. Three segments, three operating-day shapes, one corporate parent — and the yard layer is where they either coordinate or quietly cost',
        },
        {
          label: 'Cheney Brothers integration',
          value: 'Acquisition closed October 8, 2024 for $2.1B — five broadline foodservice DCs in Florida and North Carolina, ~$3.2B annual revenue, ~3,600 employees. $50M of run-rate cost synergies targeted across procurement, operations, and logistics over the first three full fiscal years; $42.5M South Carolina DC expansion announced post-close',
        },
        {
          label: 'Cheney integration scoreboard',
          value: 'Synergy target $50M run-rate by end of FY3 post-close (so by end of FY27 against an Oct 2024 close). Procurement contribution integrates on systems and contract consolidation — that is the share that lands earliest and most cleanly. Operations and logistics contribution integrates on operating habit at the dock — that is the share most exposed to whether the legacy-PFG yard SOPs propagate to Cheney sites or whether each Cheney DC keeps running pre-acquisition routines through the synergy window. The scoreboard is whether operations-and-logistics share of $50M is inside the yard-layer operating standard or sitting outside it',
        },
        {
          label: 'Southeast build-out posture',
          value: 'Cheney SC DC $42.5M expansion in progress · Hanover County VA regional sales-and-distribution center under construction ($80.2M, 325,000 sq ft, 125 new jobs) · Miami Empire DC 66,000 sq ft expansion completed · St. Louis Ferguson/Berkeley relocation completed March 2025. Capacity additions concentrated in FL/NC/SC/VA — the same geography where the Cheney integration seam is most operationally exposed and where new throughput compounds before the dock-layer operating standard has been unified',
        },
        {
          label: 'Multi-temp DC reality',
          value: 'A broadline foodservice DC handles refrigerated, frozen, and ambient inbound from hundreds of CPG suppliers, then loads DSD route trucks across the same three temperature zones for overnight delivery. Multi-temp dock arbitration is the daily reality at every broadline site, not the exception',
        },
        {
          label: 'Customer-delivery cadence',
          value: 'PFG DSD route trucks deliver to ~300,000+ customer stop locations across the network on a near-daily cadence — restaurants, hotels, schools, healthcare facilities, c-stores. Every restaurant opening Tuesday morning depends on Monday night\'s route-load completing on the planned dock window',
        },
        {
          label: 'CEO transition window',
          value: 'Scott McPherson became CEO January 1, 2026 after joining PFG in 2024 as Chief Field Operations Officer and becoming President & COO in January 2025 — supply chain and divisional operations is the resume, not the second-language. George Holm (CEO 2008–2025) stays Executive Chair working with McPherson on M&A, customer relationships, and strategic direction. The transition lands cleanly inside the Cheney synergy window and the Southeast build-out — the cleanest 12-month window in a decade for a yard-layer operating-standard addition that does not relitigate the existing network architecture',
        },
      ],
      hypothesis:
        "The interesting thing about the PFG yard math is what happens at a broadline foodservice DC every single morning. The site is arbitrating refrigerated, frozen, and ambient inbound from hundreds of CPG suppliers — Tyson reefers, Conagra ambient pallets, frozen-protein inbound from a co-packer, produce from a regional grower — against outbound DSD route loading that has to be on the truck by 8 PM so the driver can hit forty-plus restaurant stops between 4 AM and noon the next day. Three temperature zones competing for dock priority at the same gate, the inbound side coming from a long-tail of carriers PFG does not control and the outbound side gated on a fixed route schedule the customer side depends on. Site-level operating discipline at a foodservice DC is mature in the sense that the people inside the building have done this for decades; what is less mature, across 155 DCs, is a unified standard for how that arbitration is decided. Each site runs against its own dock-policy reflex, its own appointment-versus-walk-in mix, its own DSD route-load sequencing logic, its own carrier-detention practice. The network does not yet agree with itself on what good looks like at the gate.\n\nThat gap got more expensive in the last eighteen months for three reasons that stack on top of each other. First, Cheney Brothers closed in October 2024 with five broadline DCs in Florida and the Carolinas and their own pre-acquisition operating practice — Cheney was the largest independent foodservice distributor in the Southeast for a reason, and integration friction shows up at the dock layer before it shows up at the procurement layer because procurement integrates on a system and operations integrates on a habit. The $50M of run-rate synergies the deal underwrote sits across procurement, operations, and logistics; the operations-and-logistics share is the share that depends on the yard layer above the sites agreeing with itself across legacy PFG and Cheney DCs by the end of FY27. Second, the capacity build-out is concentrated in the Southeast — Cheney SC $42.5M, Hanover County VA $80.2M, Miami Empire — the same geography where the integration seam is most operationally exposed, and new DCs going into a network whose operating standard is not yet unified bake legacy variance into the next decade of throughput. Third, the segment mix is structurally unforgiving. Foodservice at 53% of revenue is the highest dock-arbitration complexity per site; Convenience at 39% runs c-store deliveries on a weekly/twice-weekly cadence and a different freight profile; Specialty at 8% runs vending/theater/concession pickup windows that match neither of the other two. Three operating-day shapes, one parent, and a yard layer that either coordinates them into one operating standard or quietly costs the synergy number to make up the difference somewhere else.\n\nWhich brings the forward-looking piece to the seat the analysis actually lands on. Scott McPherson became CEO January 1, 2026, fourteen months into the Cheney integration and inside the cleanest 12-month window in a decade for an operating-layer addition that does not relitigate the network architecture. McPherson joined PFG in 2024 as Chief Field Operations Officer and became President & COO in January 2025 — supply chain and divisional operations is the resume, not the second-language. George Holm stays Executive Chair working with McPherson on M&A, customer relationships, and strategic direction, which keeps the deal-side integration close to the seat that owns it. As the Cheney synergy window runs through FY27 and the Southeast capacity adds come online, trailer-into-the-yard pressure rises at exactly the DCs where the legacy-versus-Cheney handoff is happening. The yard layer above the sites is the operating surface where that pressure either becomes a unified standard McPherson authors in his first full year — or quietly stays 155 different routines under one corporate logo.",
      pullQuote:
        'Procurement integrates on a system. Operations integrates on a habit. The yard is where the habit either becomes the standard or quietly costs the synergy number.',
      caveat:
        "This is built from PFG’s public segment disclosures, the Cheney Brothers acquisition record, public facility-expansion press, and reasonable network inference on the broadline foodservice operating model. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don't match what your team is seeing: whether multi-temp dock arbitration at the broadline DCs is decided by site policy, system logic, or operator judgment today; whether the legacy PFG yard SOPs have already been propagated to the Cheney-acquired DCs or whether each Cheney site still runs against pre-acquisition habits; how DSD route-truck loading interacts with inbound dock priority at the same gate during the 4 PM–8 PM peak load window; and where the Southeast capacity build-out has already put visible pressure on the dock layer at the integrating sites.",
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the PFG operating model',
      artifact: {
        imageSrc: '/artifacts/performance-food-group-coverage-map.svg',
        imageAlt: 'PFG network coverage map. Six tiles representing the Performance Food Group distribution surfaces touched by the legacy network, the Cheney Brothers integration, and the three reportable segments. Legacy PFG DCs, Cheney-Acquired DCs, Foodservice Segment, Convenience Segment, and Vistar Segment are covered. The Integrated Yard Ops tile is unfilled, marked with a PFG navy hairline outline.',
        caption: 'PFG network coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public PFG segment disclosures, the Cheney Brothers acquisition record, and Southeast capacity build-out press. Site-level yard vendors redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        "Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point that can't be recovered with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be — and they run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, with a network-level yard operating model layered on top of their existing site-level systems. The shape similarities to PFG are direct: multi-site network operating across multiple temperature zones, drop-trailer dock arbitration, and a customer-delivery cadence that gates everything downstream. The shape differences are where the framing earns its keep. Primo runs hard freight against three or four product profiles at a bottling-and-distribution plant; a PFG broadline foodservice DC runs against ten thousand-plus SKUs at three temperature regimes from hundreds of inbound suppliers, then loads route trucks across the same temperature spread for daily DSD delivery to thousands of restaurants. The multi-temp dimension that is the premium-SKU edge case at Primo is the operating baseline at every PFG broadline site. The customer count Primo coordinates against — regional DCs and retailers — is dwarfed by the ~300,000 stop locations PFG delivers to daily. The framing line: if a network operating model lands on water — the hardest CPG freight in the country — the read-across to foodservice broadline isn't easier because the freight is gentler, it's easier because the operating-model surface area is the same shape, just with more SKUs, more channels, and more temperature zones to arbitrate. Same shape, different freight, more of it. The translation that matters for PFG is integration shape, not category: Primo is the proof that a network operating model lands cleanly on top of existing site-level yard systems without disrupting them — which is precisely the move the Cheney integration needs as the operations-and-logistics share of the $50M synergy number comes due against the dock layer that has to absorb it.",
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        "30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot candidates at PFG are different in kind: (1) a flagship legacy Performance Foodservice broadline DC — the cleanest test of whether a unified yard operating model can land on a site where the in-building operating discipline is already mature and the dock-arbitration problem is the most concentrated; (2) a Cheney-acquired DC inside the three-year synergy window — the cleanest test of whether the operating standard can ride on top of a recently-integrated site where the pre-acquisition yard habits are still the dominant reflex. We would expect the network to make sense of itself within two to four quarters of the pilot.",
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'pfg-10k',
          source: 'Performance Food Group public segment disclosures and 10-K reporting',
          confidence: 'public',
          detail: 'Anchors the ~155 DC network figure, the three-segment structure (Foodservice ~53%, Convenience/Core-Mark ~39%, Specialty/formerly Vistar ~8% of FY25 revenue), and the broadline foodservice operating model.',
          url: 'https://www.pfgc.com/',
        },
        {
          id: 'pfg-cheney',
          source: 'Cheney Brothers acquisition disclosures (announced Aug 2024, closed Oct 8, 2024)',
          confidence: 'public',
          detail: 'Acquisition closed October 8, 2024 for $2.1B in cash at 9.9x Adjusted EBITDA including $50M run-rate synergies. Cheney brought ~$3.2B annual revenue, ~3,600 employees, and five broadline foodservice DCs in Florida and North Carolina. Synergies targeted in procurement, operations, and logistics over the first three full fiscal years post-close.',
          url: 'https://investors.pfgc.com/press-releases/press-release-details/2024/Performance-Food-Group-Company-Completes-the-Acquisition-of-Cheney-Bros-Inc/default.aspx',
        },
        {
          id: 'pfg-capacity',
          source: 'PFG facility-expansion press (FY25–FY26)',
          confidence: 'public',
          detail: 'Hanover County VA regional sales-and-distribution center ($80.2M, 325,000 sq ft, 125 new jobs); Miami Empire DC 66,000 sq ft expansion; St. Louis Ferguson/Berkeley relocation completed March 2025; Cheney South Carolina DC $42.5M expansion in progress. Capacity adds biased toward the Southeast where the Cheney integration is most operationally exposed.',
        },
        {
          id: 'pfg-leadership',
          source: 'PFG leadership succession disclosures (announced December 2025, effective January 1, 2026)',
          confidence: 'public',
          detail: 'Scott McPherson became CEO January 1, 2026; George Holm transitioned to Executive Chair and continues to work with McPherson on M&A activities, customer relationships, and strategic direction. Leadership transition timed against the Cheney synergy window and the Southeast capacity build-out.',
          url: 'https://investors.pfgc.com/press-releases/press-release-details/2025/Performance-Food-Group-Company-Announces-Leadership-Succession/default.aspx',
        },
        {
          id: 'mcpherson-tenure',
          source: 'Scott McPherson — public tenure record (PFG)',
          confidence: 'public',
          detail: 'Joined Performance Food Group in 2024 as Chief Field Operations Officer; named President & COO January 2025; succeeded George Holm as CEO January 1, 2026 and joined the board. Supply chain and divisional operations background; MBA, University of Portland. Holm (CEO 2008–2025) remains Executive Chair partnering with McPherson on M&A, customer relationships, and strategic direction. The combination keeps deal-side integration close to the seat that owns it while putting an operations-native at the top of the operating company.',
          url: 'https://virginiabusiness.com/performance-food-group-scott-mcpherson-ceo-succession/',
        },
        {
          id: 'foodservice-industry',
          source: 'Foodservice distribution industry trade reporting',
          confidence: 'public',
          detail: 'FoodService Director, Modern Distribution Management, and FreightWaves coverage of broadline foodservice distribution, DSD route-load economics, and the failed PFG–US Foods merger discussions in early 2024. Describes the operating environment most multi-DC broadline foodservice distributors run against, not PFG specifically.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site distribution networks operate under, not PFG specifically.',
        },
        {
          id: 'primo-operating-data',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether multi-temp dock-door arbitration at the broadline foodservice DCs is decided by site policy, system logic, or operator judgment today — and whether the answer differs between legacy PFG DCs and Cheney-acquired DCs',
        'Whether the Cheney Brothers DC yards have been migrated onto Performance Foodservice operating SOPs since the October 2024 close, or whether each Cheney site still runs against pre-acquisition habits at the gate',
        'How DSD route-truck loading sequencing interacts with inbound dock priority at the same gate during the 4 PM–8 PM peak load window — and where that arbitration sits today on a system-versus-operator-judgment spectrum',
        'How the operations and logistics share of the $50M Cheney synergy number is being broken out across procurement contribution versus dock-execution contribution — and whether yard-induced cost leakage is inside that number or sitting outside it',
        'Where the Southeast capacity build-out (Cheney SC expansion, Hanover County VA, Miami Empire) has already produced visible trailer congestion at the gatehouse at the DCs absorbing the integration freight',
        'How the operating-day shapes of the three segments (broadline Foodservice, Core-Mark Convenience, Specialty) interact at any shared facilities or shared carrier pools — and whether the yard layer treats them as one network or three',
        'Whether McPherson\'s first-year operating-priority list has the yard-layer operating standard inside it as its own line item, or whether it sits underneath broader Cheney-integration or Southeast-throughput buckets — and which seat (President & COO successor, EVP Supply Chain, Chief Operating Officer of Performance Foodservice) is the operational owner once the standard is authored',
        'How the Holm-McPherson Executive Chair / CEO split is partitioning ownership in practice — specifically whether dock-layer operating-standard authorship sits with the CEO seat as an inside-the-walls operating call, or whether it gets read into the M&A-integration line that Holm continues to lead on as Executive Chair',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        "Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. PFG is distinctive in this round because the broadline foodservice DC is, by most operating measures, one of the most complex distribution sites in the country — multi-temp inbound from hundreds of CPG suppliers, DSD route-load outbound to thousands of restaurants every night, and ten thousand-plus SKUs moving through the same gate. Layer the Cheney Brothers integration on top of that operating reality and the network-coordination problem expands at exactly the moment Scott McPherson is taking the CEO seat — fourteen months into the Cheney integration, with the operations-and-logistics share of $50M run-rate synergies coming due against the dock layer that has to absorb it, and the Southeast capacity build-out (Cheney SC, Hanover County VA, Miami Empire) concentrating new throughput at the integration seam. McPherson's background — Chief Field Operations Officer in 2024, President & COO in 2025, CEO January 1, 2026 — is the operations-native resume that makes the yard-layer operating standard the natural next entry into the corporate operating model. George Holm staying Executive Chair on M&A keeps the deal-side integration close to the seat that owns it. The Primo comparable is the public network we cite — same shape of operating-model problem, harder freight per trailer, fewer SKUs and channels to coordinate across.",
      authorEmail: 'casey@freightroll.com',
      signOff:
        "Scott — the part most worth pushing back on is whether the operations-native lens you carried out of Chief Field Operations Officer into President & COO already treats the yard layer as one of the operating surfaces the CEO seat authors to a single standard, or whether the dock-arbitration variance across 155 DCs and the Cheney handoff is still being absorbed inside site-by-site judgment under the existing operating model. That answer reshapes the rest of this. The next things to push back on are whether the Cheney integration has reached the dock layer at every acquired site, how multi-temp dock arbitration is actually decided at a broadline DC during the 4 PM–8 PM peak load window, and where the Southeast capacity build-out has already put pressure on the yard first. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.",
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'pfg-mcpherson',
      name: 'Scott McPherson',
      firstName: 'Scott',
      lastName: 'McPherson',
      title: 'Chief Executive Officer',
      company: 'Performance Food Group',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Executive / Operations',
      reportsTo: 'Board of Directors (George Holm, Executive Chair)',
      currentMandate:
        'Became CEO January 1, 2026, succeeding George Holm (CEO since 2008). Joined PFG in 2024 as Chief Field Operations Officer; named President & COO January 2025. Supply chain and divisional-operations background; MBA, University of Portland. Inherits the Cheney Brothers integration (closed Oct 2024, $50M run-rate synergies targeted by end of FY3 post-close) and the Southeast capacity build-out. Holm remains Executive Chair working with McPherson on M&A activities, customer relationships, and strategic direction.',
      strategicPriorities: ['Cheney Brothers integration synergy capture', 'Southeast capacity build-out absorption', 'Three-segment operating-model coordination', 'Operational discipline across 155-DC network'],
      operationalPhilosophy: 'Operations-native — Chief Field Operations Officer to President & COO to CEO in 24 months. Supply chain and divisional operations the resume, not the second-language.',
      connectionHooks: ['Operations-native CEO transition', 'Inherits Cheney integration mid-window', 'University of Portland MBA'],
      bestIntroPath: 'Direct outreach to CEO office. If delegated, target EVP Supply Chain, Chief Operating Officer of Performance Foodservice, or the seat that succeeded McPherson as President & COO.',
    },
    {
      personaId: 'pfg-holm',
      name: 'George Holm',
      firstName: 'George',
      lastName: 'Holm',
      title: 'Executive Chair (former CEO 2008–2025)',
      company: 'Performance Food Group',
      roleInDeal: 'influencer',
      seniority: 'C-level',
      function: 'Strategy / M&A',
      currentMandate: 'Transitioned from CEO to Executive Chair effective January 1, 2026. Continues to work with McPherson on M&A activities, customer relationships, and strategic direction. Author of the Cheney Brothers acquisition (closed October 2024, $2.1B) — the deal whose synergy window now overlaps the CEO transition.',
      connectionHooks: ['Author of the Cheney acquisition', 'CEO since 2008 — built the modern PFG', 'Executive Chair on M&A'],
      bestIntroPath: 'Historical-context reference; routing for M&A-adjacent conversations.',
    },
    {
      personaId: 'performance-food-group-001',
      name: 'Dylan Greenbaum',
      firstName: 'Dylan',
      lastName: 'Greenbaum',
      title: 'Director, Logistics',
      company: 'Performance Food Group',
      email: 'dylan.greenbaum@pfgc.com',
      roleInDeal: 'operator-buyer',
      seniority: 'VP',
      function: 'Supply Chain / Operations',
      currentMandate: 'Director-level logistics seat at a foodservice distributor where supply chain is the product. Sits close enough to the network operating layer to see dock-arbitration variance across DCs but far enough above the dock to see the cross-network pattern.',
      bestIntroPath: 'Direct outreach to logistics office',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'pfg-mcpherson',
        name: 'Scott McPherson',
        firstName: 'Scott',
        lastName: 'McPherson',
        title: 'Chief Executive Officer',
        company: 'Performance Food Group',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Executive / Operations',
      },
      fallbackLane: 'executive',
      label: 'Scott McPherson - CEO',
      variantSlug: 'scott-mcpherson',

      framingNarrative:
        "Scott, the seat you took on January 1, 2026 is the cleanest 12-month window in a decade to author one more operating standard into the PFG operating model. The Cheney integration closed fourteen months earlier and is inside its three-year synergy window; the operations-and-logistics share of the $50M run-rate target depends on a dock layer agreeing with itself across legacy PFG DCs and Cheney-acquired DCs by the end of FY27. The Southeast capacity build-out — Cheney SC $42.5M, Hanover County VA $80.2M, Miami Empire — is concentrating new throughput at exactly the geography where that handoff is most operationally exposed. Your operations-native resume — Chief Field Operations Officer in 2024, President & COO in 2025, CEO in 2026 — is the seat where a yard-layer operating standard lands as the next natural entry into the operating model, not as a side project. George staying Executive Chair on M&A keeps the deal-side integration close to the seat that owns it; the inside-the-walls operating call is yours.",
      openingHook:
        "Cheney closed in October 2024 with $50M of run-rate synergies in procurement, operations, and logistics. Procurement integrates on a system; operations and logistics integrate on a habit at the dock. The yard layer above the 155-DC network is the operating surface where the operations-and-logistics share of that number either compounds inside one standard or quietly leaks across 155 routines.",
      stakeStatement:
        "Two pressures meet at the dock at the same time and they are not always open together. The Cheney integration is fourteen months in with the synergy window running through FY27, and the operations-and-logistics share is the part most exposed to whether the legacy-PFG yard SOPs have actually propagated to the acquired sites or whether each Cheney DC still runs on pre-acquisition habits. The Southeast capacity build-out is concentrating new throughput at the same DCs where the integration seam is most exposed — Cheney SC, Hanover County VA, Miami Empire — which means new trailer pressure is arriving at the gate before the operating standard has been authored. Your first full year as CEO is the cleanest window to land the yard-layer entry into the operating model before either pressure compounds further.",

      heroOverride: {
        headline: 'The operating standard you author in year one is the yard layer above the Cheney integration.',
        subheadline:
          "Three segments, 155 DCs, ~300,000 daily customer stops, five Cheney-acquired sites integrating in the Southeast, and an operations-and-logistics share of $50M in run-rate synergies coming due against the dock layer that has to absorb it. The yard above the network is the operating surface where McPherson-era PFG either coordinates as one network or quietly costs 155 routines.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Peer-to-peer operations-native framing. McPherson is fresh from Chief Field Operations Officer and President & COO into the CEO seat — he does not need the broadline foodservice DC explained back to him. Acknowledge the existing operating layer (segment architecture, Cheney synergy plan, Southeast build-out) as the strategy doing its job — it is. Position the wedge as the next operating-standard tile he authors above the existing site-level discipline, not as a critique of what is in place. Field-operations vocabulary is the register; lead with synergy-window math, integration-handoff scoreboard, and operating-standard sequencing rather than driver-experience anecdotes.",
      kpiLanguage: [
        'multi-temp dock arbitration',
        'DSD route-load sequencing',
        'integration-yard SOP alignment',
        'synergy capture at the operations-and-logistics layer',
        'dock-execution variance by site',
        'gate-to-dock cycle time',
        'reefer dwell during peak load window',
        'operating standard across the 155-DC network',
      ],
      proofEmphasis:
        "Primo is the public comparable to cite — same operating-model shape (multi-site, multi-temp, drop-trailer, customer-delivery-cadence gated), harder freight per trailer, fewer SKUs and channels to coordinate. The proof shape that maps cleanest to the Cheney-integration absorption problem is the headcount-neutral-while-absorbing-more-volume quote — exactly the posture PFG needs as the Southeast build-out lands new throughput at the integrating sites. The directly-shaped comparable (the un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.",
      avoidPhrases: ['AI-powered', 'disruptive', 'cutting-edge', 'paradigm shift', 'transformation journey'],
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
    facilityCount: '~155 distribution centers across the US and Canada',
    facilityTypes: ['Broadline Foodservice DCs', 'Convenience DCs (Core-Mark)', 'Specialty DCs (vending/theater/concession)'],
    geographicSpread:
      'North America (HQ: Goochland/Richmond VA; nationwide network across Foodservice, Specialty/formerly Vistar, and Convenience/Core-Mark segments; concentrated Southeast post-Cheney with DCs in FL, NC, SC, VA; capacity build-out at Hanover County VA, Miami Empire, Ferguson/Berkeley MO, and the Cheney SC expansion)',
    dailyTrailerMoves: 'High-volume — multi-thousand daily moves across the broadline foodservice network alone',
    fleet: 'Large private DSD fleet plus contract carriers; daily route deliveries to ~300,000+ customer stop locations',
  },

  freight: {
    primaryModes: ['Truckload', 'DSD Route', 'LTL', 'Intermodal/Rail'],
    avgLoadsPerDay: 'High-volume — multi-temp inbound from hundreds of CPG suppliers; outbound DSD route trucks loading nightly across refrigerated, frozen, and ambient zones for AM restaurant delivery',
  },

  signals: {
    eventAttendance: 'Past attendee list',
    recentNews: [
      'Cheney Brothers acquisition closed October 8, 2024 for $2.1B — five broadline foodservice DCs in FL and NC, ~$3.2B annual revenue, ~3,600 employees, $50M run-rate synergies targeted across procurement, operations, and logistics.',
      'Cheney South Carolina DC $42.5M expansion announced post-close — capacity adds biased toward the Southeast where the integration is most operationally exposed.',
      'Hanover County VA regional sales-and-distribution center under construction ($80.2M, 325,000 sq ft, 125 new jobs).',
      'Miami Empire DC 66,000 sq ft expansion completed; St. Louis Ferguson/Berkeley relocation completed March 2025.',
      'Scott McPherson became CEO January 1, 2026; George Holm transitioned to Executive Chair and continues to lead on M&A, customer relationships, and strategic direction.',
      'Vistar segment renamed Specialty in fiscal 2025 reporting; FY25 segment mix — Foodservice ~53%, Convenience (Core-Mark) ~39%, Specialty ~8% of revenue.',
    ],
    supplyChainInitiatives: [
      'Cheney Brothers integration — three-year synergy window across procurement, operations, and logistics.',
      'Southeast capacity build-out concentrated at the integration seam (Cheney SC, Hanover County VA, Miami Empire).',
      'Three-segment operating-model coordination across Foodservice, Specialty, and Convenience.',
    ],
    urgencyDriver:
      "Cheney Brothers integration is inside its three-year synergy window; the Southeast capacity build-out is concentrating new throughput at exactly the DCs where the integration seam is most operationally exposed; and the operations-and-logistics share of the $50M synergy number depends on a yard layer above the sites that does not yet have a unified standard across legacy PFG DCs and Cheney-acquired DCs.",
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'The integration', body: 'Cheney Brothers · closed Oct 8, 2024 · $2.1B · 5 broadline DCs · ~$3.2B revenue · $50M synergies over 3 years.' },
    { mark: 'Southeast build-out', body: 'Cheney SC $42.5M expansion · Hanover County VA $80.2M, 325K sq ft · Miami Empire expansion.' },
    { mark: 'Segment mix', body: 'Foodservice ~53% · Convenience (Core-Mark) ~39% · Specialty ~8% · three operating-day shapes, one parent.' },
    { mark: 'McPherson in seat', body: 'Scott McPherson · CEO Jan 1, 2026 · Chief Field Operations Officer 2024 → President & COO 2025 → CEO 2026. Operations-native resume.' },
    { mark: 'Holm as Executive Chair', body: 'CEO 2008–2025 · stays close to McPherson on M&A, customer relationships, strategic direction. Author of the Cheney acquisition.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      "This brief is for the PFG operating bench heading into Scott McPherson's first full year as CEO. The Cheney integration is inside its three-year synergy window, the Southeast capacity build-out is landing at exactly the DCs where the integration seam is most exposed, and the operations-and-logistics share of the $50M synergy number depends on a yard layer above 155 sites that does not yet have a unified standard. The five minutes that follow are about that layer.",
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#003E7E',
    backgroundVariant: 'dark',
  },
};
