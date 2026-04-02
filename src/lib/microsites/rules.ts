/**
 * ABM Microsite Factory — Personalization Rules Engine
 *
 * This engine resolves microsites for REAL PEOPLE first, generic lanes second.
 *
 * Priority order:
 * 1. PersonVariant — a full page configuration built for a specific named human
 * 2. GenericPersonaVariant — fallback for accounts without person-level research
 * 3. Default section ordering by functional lane — last resort
 *
 * The key insight: when you have a dossier that says Dan Poland is a
 * "transformation-oriented operator" who spent 15 years at Heinz and
 * whose personal mandate is a $230M supply chain overhaul, you don't
 * show him a "CFO view." You show him a page that references HIS
 * transformation, HIS facility consolidation, and HIS language.
 */

import type {
  PersonaLane,
  Vertical,
  SectionType,
  CTABlock,
  PainPoint,
  AccountMicrositeData,
  MicrositeSection,
  PersonVariant,
  PersonProfile,
  GenericPersonaVariant,
  HeroSection,
} from './schema';

const BOOKING_LINK =
  'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

// ── Default Section Ordering by Function ──────────────────────────────
// Used ONLY when a PersonVariant doesn't specify its own order.
const DEFAULT_SECTION_ORDER: Record<PersonaLane, SectionType[]> = {
  executive: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'testimonial', 'cta'],
  cfo: ['hero', 'stakes', 'roi', 'proof', 'comparison', 'testimonial', 'cta'],
  ops: ['hero', 'problem', 'solution', 'modules', 'proof', 'network-map', 'timeline', 'cta'],
  logistics: ['hero', 'problem', 'solution', 'proof', 'comparison', 'network-map', 'cta'],
  it: ['hero', 'solution', 'modules', 'timeline', 'proof', 'cta'],
};

// ── Vertical Framing ──────────────────────────────────────────────────
const VERTICAL_FRAMING: Record<Vertical, { stakesPrefix: string; problemFrame: string }> = {
  cpg: {
    stakesPrefix: 'In CPG, every hour a trailer sits in the yard is a retailer shelf going empty.',
    problemFrame: 'Your distribution network was built for last decade\'s volume. The yard was never designed to flex.',
  },
  beverage: {
    stakesPrefix: 'Beverage distribution runs on razor-thin windows. A 15-minute delay at the dock cascades through the entire chain.',
    problemFrame: 'Peak season volume spikes expose what steady-state hides: your yard is the bottleneck.',
  },
  automotive: {
    stakesPrefix: 'In automotive, a line-down event costs $22,000 per minute. The yard is where parts staging either works or fails.',
    problemFrame: 'Just-in-sequence delivery dies in the yard. Manual staging, radio dispatch, and tribal knowledge at the gate.',
  },
  'heavy-equipment': {
    stakesPrefix: 'Heavy equipment moves on long lead times and tight windows. One missed dock appointment cascades through the production schedule.',
    problemFrame: 'Your facilities move the most complex loads in industry. The yard protocol should match that complexity.',
  },
  retail: {
    stakesPrefix: 'In retail distribution, dock-to-stock speed defines competitive advantage. The yard controls the clock.',
    problemFrame: 'Your DCs handle hundreds of inbound trailers daily. The yard determines whether merchandise reaches shelves or sits.',
  },
  'building-materials': {
    stakesPrefix: 'Building materials move heavy, move slow, and move on project timelines that do not flex.',
    problemFrame: 'Oversized loads, weather-sensitive staging, and contractor pickup windows. Your yard handles more complexity than most.',
  },
  industrial: {
    stakesPrefix: 'Industrial supply chains run on precision. The yard is where precision breaks down.',
    problemFrame: 'Multi-facility networks with diverse product lines create yard complexity that manual processes cannot manage.',
  },
  grocery: {
    stakesPrefix: 'Grocery runs on freshness windows. Every hour in the yard is shelf life burned.',
    problemFrame: 'Multi-temp, cross-dock, and DSD operations all converge in your yard. The scheduling alone requires standardization.',
  },
  pharma: {
    stakesPrefix: 'Pharmaceutical logistics demands chain of custody, temperature control, and regulatory compliance at every handoff.',
    problemFrame: 'Your yard is a compliance surface. Every unstructured handoff is a documentation gap regulators can see.',
  },
  'logistics-3pl': {
    stakesPrefix: 'As a 3PL, your yard is your product. Every minute of dwell time is margin you will never recover.',
    problemFrame: 'Multi-client yard operations with different SLAs, different carriers, and different scheduling demands. You need one protocol.',
  },
};

export function getVerticalFraming(vertical: Vertical) {
  return VERTICAL_FRAMING[vertical];
}

// ── Resolve Microsite for a REAL PERSON ───────────────────────────────
// This is the primary resolution path. Given an account and a person,
// return the fully resolved page — sections, CTA, tone, everything.

export function resolveMicrositeForPerson(
  data: AccountMicrositeData,
  personId: string
): {
  variant: PersonVariant;
  sections: MicrositeSection[];
  cta: CTABlock;
  tone: string;
  kpiLanguage: string[];
  person: PersonProfile;
} | null {
  const variant = data.personVariants.find(
    (v) => v.person.personaId === personId || v.variantSlug === personId
  );
  if (!variant) return null;

  const order = variant.sectionOrder ?? DEFAULT_SECTION_ORDER[variant.fallbackLane];

  // Start with base sections
  let sections = [...data.sections];

  // Add person-specific sections
  if (variant.addSections) {
    sections = [...sections, ...variant.addSections];
  }

  // Remove hidden sections
  if (variant.hideSections) {
    sections = sections.filter((s) => !variant.hideSections!.includes(s.type));
  }

  // Apply section overrides
  if (variant.sectionOverrides) {
    sections = sections.map((section) => {
      const override = variant.sectionOverrides!.find((o) => o.sectionType === section.type);
      if (override) {
        return { ...section, ...override.override } as MicrositeSection;
      }
      return section;
    });
  }

  // Apply hero override
  if (variant.heroOverride) {
    sections = sections.map((section) => {
      if (section.type === 'hero') {
        return { ...section, ...variant.heroOverride } as MicrositeSection;
      }
      return section;
    });
  }

  // Apply CTA override to CTA sections
  if (variant.ctaOverride) {
    sections = sections.map((section) => {
      if (section.type === 'cta') {
        return { ...section, cta: variant.ctaOverride } as MicrositeSection;
      }
      return section;
    });
  }

  // Reorder
  sections = applySectionOrder(sections, order);

  return {
    variant,
    sections,
    cta: variant.ctaOverride ?? buildPersonCTA(variant.person, data.accountName),
    tone: variant.toneShift,
    kpiLanguage: variant.kpiLanguage,
    person: variant.person,
  };
}

// ── Resolve by Variant Slug ───────────────────────────────────────────
// Route: /for/[account]/[person-slug]
export function resolveMicrositeBySlug(
  data: AccountMicrositeData,
  personSlug: string
): ReturnType<typeof resolveMicrositeForPerson> {
  const variant = data.personVariants.find((v) => v.variantSlug === personSlug);
  if (!variant) return null;
  return resolveMicrositeForPerson(data, variant.person.personaId);
}

// ── Fallback: Resolve by Generic Lane ─────────────────────────────────
// Used ONLY for accounts without person-level research.
export function resolveMicrositeForLane(
  data: AccountMicrositeData,
  lane: PersonaLane
): {
  sections: MicrositeSection[];
  cta: CTABlock;
  tone: string;
  kpiLanguage: string[];
} {
  const variant = data.genericVariants?.find((v) => v.lane === lane);
  const order = variant?.sectionOrder ?? DEFAULT_SECTION_ORDER[lane];

  let sections = [...data.sections];

  if (variant?.addSections) {
    sections = [...sections, ...variant.addSections];
  }
  if (variant?.hideSections) {
    sections = sections.filter((s) => !variant.hideSections!.includes(s.type));
  }
  if (variant?.sectionOverrides) {
    sections = sections.map((section) => {
      const override = variant.sectionOverrides!.find((o) => o.sectionType === section.type);
      if (override) return { ...section, ...override.override } as MicrositeSection;
      return section;
    });
  }
  if (variant?.heroOverride) {
    sections = sections.map((section) => {
      if (section.type === 'hero') return { ...section, ...variant.heroOverride } as MicrositeSection;
      return section;
    });
  }

  sections = applySectionOrder(sections, order);

  return {
    sections,
    cta: variant?.ctaOverride ?? getDefaultCTAForLane(lane, data.accountName),
    tone: variant?.toneShift ?? DEFAULT_TONE[lane],
    kpiLanguage: variant?.kpiLanguage ?? DEFAULT_KPI_LANGUAGE[lane],
  };
}

// ── Build Person-Specific CTA ─────────────────────────────────────────
function buildPersonCTA(person: PersonProfile, accountName: string): CTABlock {
  const firstName = person.firstName || person.name.split(' ')[0];

  // If they have a known mandate, reference it
  if (person.currentMandate) {
    return {
      type: 'meeting',
      headline: `${firstName}, let's walk your yard network`,
      subtext: `30-minute conversation about ${person.currentMandate} and where YardFlow fits.`,
      buttonLabel: 'Book a Network Audit',
      calendarLink: BOOKING_LINK,
      personName: firstName,
      personContext: person.currentMandate,
    };
  }

  return {
    type: 'meeting',
    headline: `See what a standardized yard network means for ${accountName}`,
    subtext: '30-minute walk-through of your facility network with board-ready ROI.',
    buttonLabel: 'Book a Network Audit',
    calendarLink: BOOKING_LINK,
    personName: firstName,
  };
}

// ── Section Reordering ────────────────────────────────────────────────
function applySectionOrder(
  sections: MicrositeSection[],
  order: SectionType[]
): MicrositeSection[] {
  const sectionMap = new Map<SectionType, MicrositeSection>();
  for (const section of sections) {
    if (!sectionMap.has(section.type)) {
      sectionMap.set(section.type, section);
    }
  }

  const ordered: MicrositeSection[] = [];
  for (const type of order) {
    const section = sectionMap.get(type);
    if (section) ordered.push(section);
  }
  return ordered;
}

// ── Filter Pain Points for a Person ───────────────────────────────────
export function filterPainPointsForPerson(
  painPoints: PainPoint[],
  personId: string
): PainPoint[] {
  return painPoints.filter(
    (p) =>
      !p.relevantPeople ||
      p.relevantPeople.length === 0 ||
      p.relevantPeople.includes(personId)
  );
}

// ── Get All Variant Routes for an Account ─────────────────────────────
export function getVariantRoutes(data: AccountMicrositeData): {
  slug: string;
  label: string;
  personName: string;
  title: string;
}[] {
  return data.personVariants.map((v) => ({
    slug: v.variantSlug,
    label: v.label,
    personName: v.person.name,
    title: v.person.title,
  }));
}

// ── Defaults (fallback only) ──────────────────────────────────────────
const DEFAULT_TONE: Record<PersonaLane, string> = {
  executive: 'Strategic, concise, outcome-focused.',
  cfo: 'Financial, risk-aware, ROI-driven. Numbers first.',
  ops: 'Operator-to-operator. Concrete, specific, process-focused.',
  logistics: 'Fleet and yard language. Turn times, detention, driver experience.',
  it: 'Technical but business-aware. Deployment speed, integration, data architecture.',
};

const DEFAULT_KPI_LANGUAGE: Record<PersonaLane, string[]> = {
  executive: ['network-wide savings', 'margin expansion', 'operational leverage'],
  cfo: ['payback period', 'cost avoidance', 'ROIC', 'capital efficiency'],
  ops: ['truck turn time', 'dock utilization', 'headcount neutral', 'exception rate'],
  logistics: ['detention cost', 'dwell time', 'fleet utilization', 'on-time performance'],
  it: ['deployment time', 'integration points', 'data latency', 'uptime'],
};

function getDefaultCTAForLane(lane: PersonaLane, accountName: string): CTABlock {
  return {
    type: 'meeting',
    headline: `See what a standardized yard network looks like for ${accountName}`,
    subtext: '30-minute walk-through of your facility network with board-ready ROI.',
    buttonLabel: 'Book a Network Audit',
    calendarLink: BOOKING_LINK,
  };
}
