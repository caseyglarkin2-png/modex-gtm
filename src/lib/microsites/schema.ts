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
export type SectionType =
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
export interface HeroSection {
  type: 'hero';
  headline: string;
  subheadline: string;
  accountCallout?: string;
  backgroundTheme?: 'dark' | 'gradient' | 'industrial';
  cta: CTABlock;
}

export interface ProblemSection {
  type: 'problem';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  painPoints: PainPoint[];
}

export interface StakesSection {
  type: 'stakes';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  annualCost?: string;
  costBreakdown?: { label: string; value: string }[];
  urgencyDriver?: string;
}

export interface SolutionSection {
  type: 'solution';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  modules: SolutionModule[];
  accountFit?: string;
}

export interface ProofSection {
  type: 'proof';
  sectionLabel?: string;
  headline: string;
  blocks: ProofBlock[];
}

export interface NetworkMapSection {
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

export interface ROISection {
  type: 'roi';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  roiLines: ROILine[];
  totalAnnualSavings?: string;
  paybackPeriod?: string;
  methodology?: string;
}

export interface TestimonialSection {
  type: 'testimonial';
  sectionLabel?: string;
  quote: string;
  attribution?: string;
  role?: string;
  company?: string;
  context?: string;
}

export interface ModulesSection {
  type: 'modules';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  modules: SolutionModule[];
}

export interface TimelineSection {
  type: 'timeline';
  sectionLabel?: string;
  headline: string;
  steps: { week: string; title: string; description: string }[];
}

export interface ComparisonSection {
  type: 'comparison';
  sectionLabel?: string;
  headline: string;
  rows: { dimension: string; before: string; after: string }[];
}

export interface CaseStudySection {
  type: 'case-study';
  sectionLabel?: string;
  headline: string;
  narrative: string;
  results: ProofStat[];
}

export interface CTASection {
  type: 'cta';
  sectionLabel?: string;
  cta: CTABlock;
  closingLine?: string;
}

export type MicrositeSection =
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
