/**
 * ABM Microsite Factory — Content Data Schema
 *
 * This schema treats ACCOUNT DATA and CONTACT DATA as co-equal inputs.
 * Every microsite is built around the real people we're targeting, not
 * generic persona lanes. We have career histories, operational mandates,
 * strategic priorities, and personal decision-making patterns for 100+
 * named decision-makers across our target accounts.
 *
 * The "persona lane" concept exists only as a fallback for accounts where
 * we haven't yet done the person-level research. For first-wave accounts,
 * every page variant is built for a specific human being.
 */

// ── Section Module Types ──────────────────────────────────────────────
//
// The 5 memo-era section types ('yns-thesis', 'observation', 'comparable',
// 'methodology', 'about') drive the new light-memo template introduced by
// the YNS Microsite Redesign roadmap (Sprint M2+). The remaining legacy
// types ('hero' through 'case-study') are kept here so that pre-migration
// account .ts files still type-check; Sprint M3 migrates each account onto
// the memo types via a compat adapter, and Sprint M7 deletes the legacy
// section types entirely.
export type SectionType =
  // Memo-era section types (post-M2)
  | 'yns-thesis'
  | 'observation'
  | 'comparable'
  | 'methodology'
  | 'about'
  // Legacy section types (pre-M3 migration; deleted in M7)
  | 'hero'
  | 'problem'
  | 'stakes'
  | 'solution'
  | 'proof'
  | 'network-map'
  | 'roi'
  | 'testimonial'
  | 'modules'
  | 'timeline'
  | 'cta'
  | 'comparison'
  | 'case-study';

export type MemoSectionType =
  | 'yns-thesis'
  | 'observation'
  | 'comparable'
  | 'methodology'
  | 'about';

/**
 * PersonaLane is ONLY used as a fallback category when we don't have
 * person-level research. For researched contacts, use PersonProfile instead.
 */
export type PersonaLane =
  | 'cfo'
  | 'ops'
  | 'logistics'
  | 'it'
  | 'executive';

export type Vertical =
  | 'cpg'
  | 'beverage'
  | 'automotive'
  | 'heavy-equipment'
  | 'retail'
  | 'building-materials'
  | 'industrial'
  | 'grocery'
  | 'pharma'
  | 'logistics-3pl';

export type CTAType =
  | 'meeting'
  | 'audit'
  | 'roi-review'
  | 'demo'
  | 'modex-meeting'
  | 'warm-intro';

export type LayoutPreset =
  | 'executive'     // generous spacing, proof-first emphasis, large hero
  | 'industrial'    // tighter grid, comparison tables prominent, data-dense
  | 'retail'        // network-map emphasis, high stat density, speed framing
  | 'partnership'   // relationship CTA, intro routing, ecosystem framing
  | 'default';      // standard layout

export type NarrativeRole =
  | 'opener'
  | 'context'
  | 'problem'
  | 'analysis'
  | 'proof'
  | 'plan'
  | 'close'
  | 'cta';

interface BaseMicrositeSection {
  sectionId?: string;
  narrativeRole?: NarrativeRole;
}

// ── Real Person Profile ───────────────────────────────────────────────
// This is the core differentiator. Not a "persona lane" but a real human
// with a career, priorities, language preferences, and strategic context.

export interface PersonProfile {
  // Identity
  personaId: string;              // matches persona DB record, e.g. "P-001"
  name: string;                   // "Dan Poland"
  firstName: string;
  lastName: string;
  title: string;                  // "EVP & Chief Enterprise Transformation Officer"
  company: string;                // "The Campbell's Company"
  email?: string;
  linkedinUrl?: string;
  phone?: string;

  // Role in the deal
  roleInDeal: 'decision-maker' | 'influencer' | 'routing-contact' | 'operator-buyer' | 'champion';
  seniority: 'C-level' | 'SVP/EVP' | 'VP' | 'Director' | 'Manager';
  function: string;               // "Operations / Supply Chain", "Finance", etc.
  reportsTo?: string;             // "CEO Mick Beekhuizen"
  directReports?: string;         // "Cassandra Green (SVP, Head of Supply Chain)"

  // Career intelligence — what makes THIS person tick
  careerHistory?: CareerEntry[];
  yearsInRole?: string;
  yearsAtCompany?: string;
  previousCompanies?: string[];   // ["Heinz", "WhiteWave Foods", "Pinnacle Foods"]
  educationHighlight?: string;    // "Michigan State University" — potential connection point
  boardRoles?: string[];          // industry affiliations, speaking gigs
  knownForPhrase?: string;        // "transformation-oriented operator who optimizes supply chains at scale"

  // Personal strategic context
  currentMandate?: string;        // "Enterprise-wide transformation, $230M supply chain overhaul"
  strategicPriorities?: string[]; // ["Cost reduction", "Sovos integration", "Network consolidation"]
  operationalPhilosophy?: string; // "Run, Improve, Transform" (Paul Gallagher)
  knownPainPoints?: string[];     // ["Facility consolidation = yard congestion", "Multi-temp complexity"]
  publicQuotes?: PublicQuote[];
  speakingTopics?: string[];      // ["AI transformation", "People-centric approach to AI"]

  // Communication & framing preferences (inferred from research)
  communicationStyle?: string;    // "Data-driven, cost-conscious, people-first"
  languagePreferences?: string[]; // KPI terms this person actually uses
  kpiLanguage?: string[];         // Specific KPI terms from their domain
  avoidTopics?: string[];         // things that would turn them off
  connectionHooks?: string[];     // "MSU alumni", "Diageo background", "plant manager at heart"

  // Approach strategy
  bestIntroPath?: string;         // "Mark Shaughnessy warm intro" or "Direct email"
  introRoute?: string;            // detailed routing
  doNotContact?: boolean;
  contactConstraints?: string;    // "Email suppressed — phone only"
  modexProximity?: string;        // "Atlanta HQ — local" or "Cartersville, GA brewery 90 min from MODEX"
}

export interface CareerEntry {
  period: string;                 // "2022-present"
  role: string;
  company: string;
  relevance?: string;             // why this matters for YardFlow pitch
}

export interface PublicQuote {
  text: string;
  source: string;                 // "Supply Chain Dive, March 2024"
  context?: string;               // what they were talking about
  relevanceToYardFlow?: string;   // why we can use this
}

// ── Person-Specific Page Variant ──────────────────────────────────────
// This replaces the generic "PersonaVariant" for researched contacts.
// Every section override is written FOR this specific person.

export interface PersonVariant {
  // The real person this page is built for
  person: PersonProfile;

  // Fallback lane (for section ordering defaults)
  fallbackLane: PersonaLane;

  // Page identity
  label: string;                  // "Dan Poland — Enterprise Transformation"
  variantSlug: string;            // "dan-poland" → /for/campbells/dan-poland

  // Framing — how we talk to THIS person specifically
  framingNarrative: string;       // 2-3 sentences: why this conversation is urgent for them personally
  openingHook: string;            // The first thing they read, tailored to their known priorities
  stakeStatement: string;         // What's at risk if they don't act, in THEIR language

  // Section overrides written for this person
  heroOverride?: Partial<HeroSection>;
  sectionOverrides?: {
    sectionType: SectionType;
    override: Partial<MicrositeSection>;
  }[];
  sectionOrder?: SectionType[];
  hideSections?: SectionType[];
  addSections?: MicrositeSection[];
  ctaOverride?: CTABlock;

  // Voice & language tuning for this person
  toneShift: string;              // "Operator-to-operator. Reference his plant management background."
  kpiLanguage: string[];          // Terms THIS person uses, from their public quotes
  proofEmphasis?: string;         // Which proof points matter most to them
  avoidPhrases?: string[];        // Things that would feel generic to this person
}

// ── Proof & Evidence ──────────────────────────────────────────────────
export interface ProofStat {
  value: string;
  label: string;
  context?: string;
  icon?: string;
}

export interface ROILine {
  label: string;
  before: string;
  after: string;
  delta: string;
  unit?: string;
}

export type ROIFacilityArchetype =
  | 'with-yms'
  | 'drops-no-yms'
  | 'without-drops';

export type ROISourceConfidence =
  | 'measured'
  | 'public'
  | 'estimated'
  | 'inferred';

export type ROIValueCategory =
  | 'hard-savings'
  | 'throughput'
  | 'standardization'
  | 'subscription-cost'
  | 'legacy-yms'
  | 'paper'
  | 'spotter'
  | 'detention'
  | 'dc-labor'
  | 'drop-trailer'
  | 'driver-journey'
  | 'systemwide-optimization'
  | 'cost-of-inaction';

export interface ROISourceNote {
  id: string;
  label: string;
  detail: string;
  confidence: ROISourceConfidence;
  citation?: string;
}

export interface ROIHeadlineStat {
  id:
    | 'payback-hard-savings'
    | 'payback-all-savings'
    | 'net-year-1-gain'
    | 'cost-of-inaction'
    | 'year-one-roi'
    | 'value-multiple';
  label: string;
  value: string;
  footnote?: string;
}

export interface ROIArchetypeMix {
  archetype: ROIFacilityArchetype;
  facilityCount: number;
}

export interface ROIArchetypeAssumptions {
  archetype: ROIFacilityArchetype;
  dcFteCount?: number;
  dcShifts?: number;
  spotterFteCount?: number;
  spotterShifts?: number;
  shipmentsPerDay?: number;
  avgCycleTimeMinutes?: number;
  annualFteCost?: number;
}

export interface ROIAccountAssumption {
  label: string;
  value: number | string;
  unit?: string;
  sourceNoteId?: string;
}

export interface ROIValueBreakdownLine {
  label: string;
  value: string;
  category: ROIValueCategory;
  notes?: string;
}

export interface ROIArchetypeBreakdown {
  archetype: ROIFacilityArchetype;
  facilityCount: number;
  headline?: string;
  yardflowCostPerYear?: string;
  yardflowSavingsPerYear?: string;
  legacyYmsCostPerYear?: string;
  legacyYmsSavingsPerYear?: string;
  returnMultiple?: string;
  hardSavingsLines?: ROIValueBreakdownLine[];
  throughputLines?: ROIValueBreakdownLine[];
}

export interface ROITotalValueComparison {
  yardflowAnnualValue?: string;
  legacyYmsAnnualValue?: string;
  valueMultiple?: string;
}

export interface AccountROIModel {
  calculatorVersion?: string;
  sourceOfTruth: 'public-calculator-contract' | 'shared-engine';
  scenarioLabel?: string;
  averageMarginPerShipment?: number;
  facilityMix: ROIArchetypeMix[];
  archetypeAssumptions?: ROIArchetypeAssumptions[];
  accountAssumptions?: ROIAccountAssumption[];
  sourceNotes?: ROISourceNote[];
}

export interface ProofBlock {
  type: 'metric' | 'quote' | 'comparison' | 'roi-calc' | 'timeline' | 'case-result';
  headline?: string;
  stats?: ProofStat[];
  quote?: {
    text: string;
    attribution?: string;
    role?: string;
    company?: string;
  };
  roiLines?: ROILine[];
  beforeAfter?: {
    before: { label: string; description: string };
    after: { label: string; description: string };
  };
  comparisonLabel?: string;
  comparisonData?: { metric: string; competitor: string; yardflow: string }[];
}

export interface ProofVisual {
  type: 'metric-grid' | 'before-after' | 'comparison';
  headline?: string;
  narrative?: string;
  stats?: ProofStat[];
  beforeAfter?: {
    before: { label: string; description: string };
    after: { label: string; description: string };
  };
  comparisonLabel?: string;
  comparisonData?: { metric: string; competitor: string; yardflow: string }[];
}

export interface LiveDeploymentCallout {
  headline: string;
  summary: string;
  badges?: string[];
}

// ── Pain Points & Stakes ──────────────────────────────────────────────
export interface PainPoint {
  headline: string;
  description: string;
  kpiImpact?: string;
  source?: string;
  // Which NAMED PEOPLE care about this pain point (not lanes — people)
  relevantPeople?: string[];      // persona IDs: ["P-041", "P-042"]
  personaRelevance?: PersonaLane[];  // fallback for accounts without person-level research
}

// ── Solution Modules ──────────────────────────────────────────────────
export interface SolutionModule {
  id: string;
  name: string;
  verb: string;
  shortDescription: string;
  relevanceToAccount?: string;
}

// ── CTA Definitions ───────────────────────────────────────────────────
export interface CTABlock {
  type: CTAType;
  headline: string;
  subtext: string;
  buttonLabel: string;
  calendarLink?: string;
  // Person-specific CTA context
  personName?: string;            // "Dan" — for personalized CTA copy
  personContext?: string;         // "your $230M transformation" — their language
}

// ── Section Definitions ───────────────────────────────────────────────
export interface HeroSection extends BaseMicrositeSection {
  type: 'hero';
  headline: string;
  subheadline: string;
  accountCallout?: string;
  backgroundTheme?: 'dark' | 'gradient' | 'industrial';
  cta: CTABlock;
}

export interface ProblemSection extends BaseMicrositeSection {
  type: 'problem';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  painPoints: PainPoint[];
}

export interface StakesSection extends BaseMicrositeSection {
  type: 'stakes';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  annualCost?: string;
  costBreakdown?: { label: string; value: string }[];
  urgencyDriver?: string;
}

export interface SolutionSection extends BaseMicrositeSection {
  type: 'solution';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  modules: SolutionModule[];
  accountFit?: string;
}

export interface ProofSection extends BaseMicrositeSection {
  type: 'proof';
  sectionLabel?: string;
  headline: string;
  blocks: ProofBlock[];
  proofVisual?: ProofVisual;
  methodology?: string;
  liveDeployment?: LiveDeploymentCallout;
}

export interface NetworkMapSection extends BaseMicrositeSection {
  type: 'network-map';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  facilityCount: string;
  facilityTypes?: string[];
  geographicSpread?: string;
  dailyTrailerMoves?: string;
  peakMultiplier?: string;
}

export interface ROISection extends BaseMicrositeSection {
  type: 'roi';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  roiLines: ROILine[];
  modelingMode?: 'static' | 'engine';
  headlineStats?: ROIHeadlineStat[];
  archetypeBreakdowns?: ROIArchetypeBreakdown[];
  totalValueComparison?: ROITotalValueComparison;
  assumptionNotes?: ROISourceNote[];
  sourceNotes?: ROISourceNote[];
  totalAnnualSavings?: string;
  paybackPeriod?: string;
  methodology?: string;
}

export interface TestimonialSection extends BaseMicrositeSection {
  type: 'testimonial';
  sectionLabel?: string;
  quote: string;
  attribution?: string;
  role?: string;
  company?: string;
  context?: string;
}

export interface ModulesSection extends BaseMicrositeSection {
  type: 'modules';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  modules: SolutionModule[];
}

export interface TimelineSection extends BaseMicrositeSection {
  type: 'timeline';
  sectionLabel?: string;
  headline: string;
  steps: { week: string; title: string; description: string }[];
}

export interface ComparisonSection extends BaseMicrositeSection {
  type: 'comparison';
  sectionLabel?: string;
  headline: string;
  rows: { dimension: string; before: string; after: string }[];
}

export interface CaseStudySection extends BaseMicrositeSection {
  type: 'case-study';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  results: ProofStat[];
}

export interface CTASection extends BaseMicrositeSection {
  type: 'cta';
  sectionLabel?: string;
  cta: CTABlock;
  closingLine?: string;
}

// ── Memo-era section types (Sprint M2+) ────────────────────────────────
//
// These five types drive the light-memo template introduced by the YNS
// Microsite Redesign. Each section is data-only — the renderer applies
// the memo voice + footnote treatment + accent line.

export interface FootnoteData {
  id: string;                         // stable id for the inline marker, e.g. 'ata-2024'
  source: string;                     // full citation: 'ATA 2024 Yard Ops Survey'
  confidence: ROISourceConfidence;    // measured / public / estimated / inferred
  detail?: string;                    // optional 1-line detail shown inline with the footnote
  url?: string;                       // external link when available
}

/**
 * The universal YNS thesis (75% of yards run on radios + clipboards;
 * WMS/TMS doesn't see the gate-to-dock; YNS is the missing layer).
 * Content is owned by `src/lib/microsites/yns-thesis.ts` so it stays
 * universal across accounts; only the headline override is per-account.
 */
export interface YnsThesisSection extends BaseMicrositeSection {
  type: 'yns-thesis';
  headlineOverride?: string;
}

/**
 * "What we observed about your network." Public-data composition + a
 * bottleneck hypothesis written as observation, not claim.
 */
export interface ObservationSection extends BaseMicrositeSection {
  type: 'observation';
  headline: string;                                  // e.g. 'What we observed about your network'
  composition: { label: string; value: string }[];   // facility count, archetype mix
  hypothesis: string;                                // bottleneck hypothesis paragraph
  caveat?: string;                                   // 'we may be wrong about parts of this'
  footnotes?: FootnoteData[];
}

/**
 * "What a similar network did." Peer/customer case study, archetype-matched.
 * Reference availability is noted softly (no booking CTA).
 */
export interface ComparableSection extends BaseMicrositeSection {
  type: 'comparable';
  headline: string;                                  // e.g. 'What a similar network did'
  comparableName: string;                            // e.g. 'Primo Brands'
  comparableProfile: string;                         // 'nine sites, similar archetype mix'
  metrics: { label: string; before: string; after: string; delta: string }[];
  timeline: string;                                  // '30 days to first impact'
  referenceAvailable?: boolean;                      // soft 'their CFO is open to a peer call'
  footnotes?: FootnoteData[];
}

/**
 * "How this analysis was built." Sources, confidence levels, and explicit
 * intellectual-honesty list of what we don't know.
 */
export interface MethodologySection extends BaseMicrositeSection {
  type: 'methodology';
  headline: string;                                  // e.g. 'How this analysis was built'
  sources: FootnoteData[];                           // every claim's underlying source
  unknowns: string[];                                // 'we can't see your TMS data'
}

/**
 * "About this analysis." Author bio + soft sign-off. The deep link to /roi/
 * is rendered automatically by the section renderer (built from the
 * account's archetype mix); not stored in section data.
 */
export interface AboutSection extends BaseMicrositeSection {
  type: 'about';
  headline?: string;                                 // defaults to 'About this analysis'
  authorBio: string;
  authorEmail: string;
  signOff?: string;                                  // optional universal sign-off paragraph
}

export type MemoMicrositeSection =
  | YnsThesisSection
  | ObservationSection
  | ComparableSection
  | MethodologySection
  | AboutSection;

export type MicrositeSection =
  | MemoMicrositeSection
  | HeroSection
  | ProblemSection
  | StakesSection
  | SolutionSection
  | ProofSection
  | NetworkMapSection
  | ROISection
  | TestimonialSection
  | ModulesSection
  | TimelineSection
  | ComparisonSection
  | CaseStudySection
  | CTASection;

// ── Full Account Microsite Data ───────────────────────────────────────
export interface AccountMicrositeData {
  // Identity
  slug: string;
  accountName: string;
  parentBrand?: string;
  vertical: Vertical;
  tier: string;
  band: string;
  priorityScore: number;

  // Page metadata
  pageTitle: string;
  metaDescription: string;

  // Sections (in default display order — the "executive overview" version)
  sections: MicrositeSection[];

  // ── THE PEOPLE ──────────────────────────────────────────────────────
  // Real people with real research. This is the primary personalization input.
  // Person variants are full page configurations built for specific humans.
  people: PersonProfile[];
  personVariants: PersonVariant[];

  // Legacy fallback for accounts without deep person research
  genericVariants?: GenericPersonaVariant[];

  // Account-specific proof
  proofBlocks: ProofBlock[];

  // Engine-backed ROI inputs. Optional until accounts migrate away from static ROI sections.
  roiModel?: AccountROIModel;

  // Facility & network data
  network: {
    facilityCount: string;
    facilityTypes: string[];
    geographicSpread: string;
    dailyTrailerMoves: string;
    peakMultiplier?: string;
    fleet?: string;
    keyFacilities?: KeyFacility[];
  };

  // Freight profile
  freight: {
    primaryModes: string[];
    avgLoadsPerDay: string;
    peakSeason?: string;
    keyRoutes?: string[];
    detentionCost?: string;
    specialRequirements?: string[];
  };

  // Signals & timing
  signals: {
    modexAttendance?: string;
    recentNews?: string[];
    supplyChainInitiatives?: string[];
    competitivePressure?: string;
    urgencyDriver?: string;
  };

  // Theme
  theme?: {
    accentColor?: string;           // primary accent (CTA buttons, highlights, badges)
    secondaryColor?: string;        // secondary accent (borders, subtle highlights)
    badgeColor?: string;            // stat/KPI badge background
    backgroundVariant?: 'dark' | 'gradient' | 'industrial' | 'clean';
  };

  // Showcase & layout
  showcase?: boolean;               // flagged for DWTB marketplace demo
  showcaseOrder?: number;           // display order in showcase gallery (1 = first)
  layoutPreset?: LayoutPreset;      // controls section rhythm, spacing, emphasis
}

// Named facility for network map sections
export interface KeyFacility {
  name: string;                   // "Nava Brewery"
  location: string;               // "Nava, Coahuila, Mexico"
  type: string;                   // "Brewery"
  significance?: string;          // "$5.5B investment, 35M+ hectoliters/yr"
  yardRelevance?: string;         // "3,000 loads/week cross-border"
}

// ── Generic Persona Variant (FALLBACK ONLY) ───────────────────────────
// Used when we don't have person-level research for an account.
// For researched accounts, PersonVariant is always preferred.
export interface GenericPersonaVariant {
  lane: PersonaLane;
  label: string;
  heroOverride?: Partial<HeroSection>;
  sectionOverrides?: {
    sectionType: SectionType;
    override: Partial<MicrositeSection>;
  }[];
  sectionOrder?: SectionType[];
  hideSections?: SectionType[];
  addSections?: MicrositeSection[];
  ctaOverride?: CTABlock;
  toneShift?: string;
  kpiLanguage?: string[];
}

// ── Generation Config ─────────────────────────────────────────────────
export interface MicrositeGenerationConfig {
  accountSlug: string;
  // Generate for specific people (preferred) or fallback to lanes
  targetPeople?: string[];        // persona IDs
  fallbackLanes?: PersonaLane[];
  includeROI: boolean;
  includeNetworkMap: boolean;
  includeCaseStudy: boolean;
  demoReady: boolean;
  aiProvider?: 'gemini' | 'openai';
}
