import type { OnePagerContext } from '@/lib/ai/prompts';

export interface VerticalTemplate {
  vertical: string;
  defaultScoringRules: {
    icp_fit: number;
    event_signal: number;
    primo_story_fit: number;
    strategic_value: number;
  };
  sampleOnePagerContext: OnePagerContext;
  sampleWhyNow: string;
  samplePrimoAngle: string;
  description: string;
}

const MANUFACTURING_CONTEXT: OnePagerContext = {
  accountName: 'Manufacturing Company',
  parentBrand: 'Manufacturing Company',
  vertical: 'Manufacturing',
  whyNow: 'Multi-site standardization requires coordinated yard operations. Peak seasons drive 30-40% volume spikes that standard dock procedures cannot absorb.',
  primoAngle: 'The yard is where production schedules meet logistics reality. One standard protocol across all sites reduces execution variability.',
  bestIntroPath: 'Operations or Supply Chain leadership overseeing multi-facility networks.',
  likelyPainPoints: 'Dock congestion during seasonal peaks, inconsistent trailer staging across sites, driver delays due to yard confusion.',
  primoRelevance: 'YardFlow enables real-time trailer prioritization per production schedule, not FIFO queue. Reduces dock bottlenecks and detention time.',
  suggestedAttendees: 'VP Operations, Facility Managers (2-3 sites), Yard Supervisor.',
  score: 75,
  tier: 'Tier 2',
  band: 'A',
};

const THREE_PL_CONTEXT: OnePagerContext = {
  accountName: '3PL Provider',
  parentBrand: '3PL Provider',
  vertical: '3PL',
  whyNow: 'Margin pressure is forcing efficiency gains. Client networks are growing and detention time is eating into SLA performance.',
  primoAngle: 'Client satisfaction depends on dock speed. One protocol across all customer sites improves your competitive position.',
  bestIntroPath: 'Operations or Network Management.',
  likelyPainPoints: 'Inconsistent dock procedures across customer locations, high detention costs, client complaints about yard wait times.',
  primoRelevance: 'YardFlow standardizes your yard protocol across all client sites, improving SLA compliance and reducing detention penalties.',
  suggestedAttendees: 'Chief Operations Officer, Network Manager, Yard Operations Lead.',
  score: 80,
  tier: 'Tier 1',
  band: 'A',
};

const RETAIL_CONTEXT: OnePagerContext = {
  accountName: 'Retail Distribution',
  parentBrand: 'Retail Distribution',
  vertical: 'Retail',
  whyNow: 'Seasonal peaks (holiday, back-to-school) drive 50%+ volume swings. Yard gridlock during these windows costs millions in missed deliveries.',
  primoAngle: 'DC throughput depends on dock choreography. One protocol scales with volume without adding headcount.',
  bestIntroPath: 'Distribution Center Manager or VP Supply Chain.',
  likelyPainPoints: 'Unloading bottlenecks during peak seasons, inconsistent trailer sequencing, detention charges, overtime costs.',
  primoRelevance: 'YardFlow prioritizes trailers by SKU velocity and DC sequencing rules, not random arrival order. Reduces peak-season detention by 30%.',
  suggestedAttendees: 'DC Manager, Yard Supervisor, Receiving Lead.',
  score: 78,
  tier: 'Tier 2',
  band: 'A',
};

const PHARMA_CONTEXT: OnePagerContext = {
  accountName: 'Pharmaceutical Distribution',
  parentBrand: 'Pharmaceutical Distribution',
  vertical: 'Pharma',
  whyNow: 'Cold chain compliance drives audit risk. Trailer queue delays cause temperature excursions and product loss.',
  primoAngle: 'Yard efficiency is part of cold chain control. One protocol keeps high-value trailers moving and temperatures stable.',
  bestIntroPath: 'Supply Chain, Compliance, or Logistics Leadership.',
  likelyPainPoints: 'Cold trailers waiting in yard queues, temperature excursion incidents, regulatory audit findings, product spoilage.',
  primoRelevance: 'YardFlow enforces temperature-zone sequencing and reduces dock wait time, keeping cold-chain compliance tight.',
  suggestedAttendees: 'VP Logistics, Compliance Officer, DC Manager.',
  score: 82,
  tier: 'Tier 1',
  band: 'A',
};

const FOOD_BEVERAGE_CONTEXT: OnePagerContext = {
  accountName: 'Food & Beverage Company',
  parentBrand: 'Food & Beverage Company',
  vertical: 'Food & Beverage',
  whyNow: 'Freshness windows are non-negotiable. Yard delays push product out of acceptable freshness ranges, creating waste and lost revenue.',
  primoAngle: 'Freshness is a supply chain asset. Yard protocol speeds determine product shelf-life at retail.',
  bestIntroPath: 'Supply Chain, Logistics, or Quality/Food Safety Leadership.',
  likelyPainPoints: 'Dock delays reducing product freshness, spoilage during yard staging, temperature zone compliance failures.',
  primoRelevance: 'YardFlow prioritizes temperature zones and reduces dock queue time, keeping perishables within freshness windows.',
  suggestedAttendees: 'VP Supply Chain, DC Manager, Quality/Food Safety Lead.',
  score: 80,
  tier: 'Tier 1',
  band: 'A',
};

const AUTOMOTIVE_CONTEXT: OnePagerContext = {
  accountName: 'Automotive Supplier',
  parentBrand: 'Automotive Supplier',
  vertical: 'Automotive',
  whyNow: 'Just-in-time delivery demands are increasing. Yard delays cascade into production line stoppages.',
  primoAngle: 'JIT works only if the yard is choreographed. One protocol ensures parts arrive exactly when needed.',
  bestIntroPath: 'Logistics, Supply Chain, or Operations Leadership.',
  likelyPainPoints: 'Trailers arriving out of sequence, yard delays disrupting JIT feeds, excessive detention, expedite freight costs.',
  primoRelevance: 'YardFlow sequences inbound trailers by production schedules, not arrival time. Reduces detention and expedite costs.',
  suggestedAttendees: 'VP Logistics, Plant Manager, Yard Operations Lead.',
  score: 85,
  tier: 'Tier 1',
  band: 'A',
};

export const VERTICAL_TEMPLATES: Record<string, VerticalTemplate> = {
  manufacturing: {
    vertical: 'Manufacturing',
    description: 'Multi-site production with seasonal peaks driving 30-40% volume spikes.',
    defaultScoringRules: { icp_fit: 4, event_signal: 3, primo_story_fit: 4, strategic_value: 3 },
    sampleOnePagerContext: MANUFACTURING_CONTEXT,
    sampleWhyNow: 'Multi-site standardization requires coordinated yard operations across facilities.',
    samplePrimoAngle: 'One standard yard protocol reduces execution variability and dock bottlenecks.',
  },
  '3pl': {
    vertical: '3PL',
    description: 'Network of client sites with margin pressure and SLA compliance challenges.',
    defaultScoringRules: { icp_fit: 5, event_signal: 4, primo_story_fit: 5, strategic_value: 4 },
    sampleOnePagerContext: THREE_PL_CONTEXT,
    sampleWhyNow: 'Margin pressure forces efficiency gains. Detention costs are eating into SLA performance.',
    samplePrimoAngle: 'Client satisfaction depends on dock speed. One protocol improves competitive position.',
  },
  retail: {
    vertical: 'Retail',
    description: 'Distribution centers managing seasonal peaks and high-velocity SKU throughput.',
    defaultScoringRules: { icp_fit: 4, event_signal: 3, primo_story_fit: 4, strategic_value: 3 },
    sampleOnePagerContext: RETAIL_CONTEXT,
    sampleWhyNow: 'Seasonal peaks (holiday, back-to-school) drive 50%+ volume swings.',
    samplePrimoAngle: 'DC throughput depends on dock choreography. One protocol scales with volume.',
  },
  pharma: {
    vertical: 'Pharma',
    description: 'Cold-chain distribution with regulatory compliance and temperature control requirements.',
    defaultScoringRules: { icp_fit: 5, event_signal: 4, primo_story_fit: 5, strategic_value: 5 },
    sampleOnePagerContext: PHARMA_CONTEXT,
    sampleWhyNow: 'Cold-chain compliance drives audit risk. Trailer queue delays cause temperature excursions.',
    samplePrimoAngle: 'Yard efficiency is part of cold-chain control. One protocol keeps high-value trailers moving.',
  },
  'food-beverage': {
    vertical: 'Food & Beverage',
    description: 'Perishable goods with narrow freshness windows and spoilage risk.',
    defaultScoringRules: { icp_fit: 4, event_signal: 3, primo_story_fit: 5, strategic_value: 4 },
    sampleOnePagerContext: FOOD_BEVERAGE_CONTEXT,
    sampleWhyNow: 'Freshness windows are non-negotiable. Yard delays push product out of acceptable ranges.',
    samplePrimoAngle: 'Freshness is a supply chain asset. Yard protocol speeds determine shelf-life at retail.',
  },
  automotive: {
    vertical: 'Automotive',
    description: 'Just-in-time suppliers with production-line sequencing requirements.',
    defaultScoringRules: { icp_fit: 5, event_signal: 4, primo_story_fit: 5, strategic_value: 5 },
    sampleOnePagerContext: AUTOMOTIVE_CONTEXT,
    sampleWhyNow: 'JIT delivery demands are increasing. Yard delays cascade into production line stoppages.',
    samplePrimoAngle: 'JIT works only if the yard is choreographed. One protocol ensures exact timing.',
  },
};

export function getVerticalTemplate(vertical: string): VerticalTemplate | undefined {
  const key = vertical.toLowerCase().replace(/\s+/g, '-');
  return VERTICAL_TEMPLATES[key];
}

export function getVerticalsList(): Array<{ value: string; label: string; description: string }> {
  return Object.entries(VERTICAL_TEMPLATES).map(([, template]) => ({
    value: template.vertical,
    label: template.vertical,
    description: template.description,
  }));
}
