/**
 * YardFlow brand context — sourced from yardflow.ai and approved collateral.
 * Used by AI prompts to generate contextually accurate, on-brand content.
 */

export const YARDFLOW_BRAND = {
  name: 'YardFlow',
  parent: 'FreightRoll',
  fullName: 'YardFlow by FreightRoll',
  tagline: 'The First Yard Network System',
  subtag: 'Industrial Fluidity.',
  positioning: 'A standardized operating protocol — not a YMS — that made each of over 20 sites at least $1M+ more profitable. Now rolling out to over 200 more.',
  url: 'https://yardflow.ai',
  ctaLabel: 'Book a Network Audit',
  ctaMeeting: '30-minute Network Audit — facility mapping + board-ready ROI',
  sender: {
    name: 'Casey Larkin',
    title: 'GTM Lead',
    company: 'YardFlow by FreightRoll',
    email: 'casey@yardflow.ai',
  },
} as const;

export const YARDFLOW_PRODUCT = {
  what: 'YardFlow is a Yard Network System (YNS) — not a YMS. It is a standardized operating protocol for deterministic throughput.',
  coreInsight: 'The yard is where throughput dies. Manual check-in. Radio dispatching. Tribal knowledge at the gate. The yard consumes margin that never comes back.',
  fix: 'YardFlow enforces one driver journey across every facility. Same steps. Same sequence. Same evidence. Variance dies. Throughput becomes calculable.',
  protocolIsProduct: 'The protocol is the product. Six modules, one driver journey, network-wide control.',

  modules: [
    {
      id: 'flowDRIVER',
      name: 'flowDRIVER',
      shortName: 'Gate Check-in',
      verb: 'Verify',
      description: 'Digital driver journey from check-in to check-out powered by FreightRoll ID and a standardized gate protocol.',
      bullets: ['QR + wallet identity verification', 'Algorithmic lane and dock direction', 'Check-in to check-out chain of custody'],
    },
    {
      id: 'flowBOL',
      name: 'flowBOL',
      shortName: 'BOL Proof',
      verb: 'Document',
      description: 'BOL creation and repository with timestamped handoffs and defensible proof for every move.',
      bullets: ['Touchless BOL creation', 'Single source repository', 'Immutable timestamp trail'],
    },
    {
      id: 'flowSPOTTER',
      name: 'flowSPOTTER',
      shortName: 'Yard Routing',
      verb: 'Execute',
      description: 'Spotter app for move execution, task queues, and rapid trailer repositioning without radio chaos.',
      bullets: ['Move queue visibility', 'In-app dispatch and completion', 'Lower deadhead and wait time'],
    },
    {
      id: 'flowTWIN',
      name: 'flowTWIN',
      shortName: 'Dock Assignment',
      verb: 'Map',
      description: 'Machine vision and GPS-enabled digital twin of the yard for real-time location, dwell, and lane state.',
      bullets: ['Live yard topology', 'Trailer and lane state awareness', 'Exception detection in real time'],
    },
    {
      id: 'flowAI',
      name: 'flowAI',
      shortName: 'Orchestration',
      verb: 'Orchestrate',
      description: 'AI agent that uses flowTWIN and operational data to orchestrate flowDRIVER, flowSPOTTER, and flowBOL.',
      bullets: ['Action recommendations by state', 'Escalation and exception routing', 'Continuous protocol optimization'],
    },
    {
      id: 'flowNETWORK',
      name: 'flowNETWORK',
      shortName: 'Network Command',
      verb: 'Scale',
      description: 'Yard network-wide command view with alerting, simulation, and cross-site performance intelligence.',
      bullets: ['Network-wide alerting', 'Scenario and rollout simulation', 'Cross-site pattern detection'],
    },
  ],

  /** The 4-step driver journey used in one-pagers (subset of 6 modules) */
  driverJourney: [
    { step: 1, title: 'Gate Check-in', description: 'Verified driver ID and a standard intake sequence every time' },
    { step: 2, title: 'Yard Routing', description: 'Automated lane and move logic replaces manual radio dispatching' },
    { step: 3, title: 'Dock Assignment', description: 'Seamless dock handoff with timestamped direction and clear accountability' },
    { step: 4, title: 'BOL Proof', description: 'Touchless BOL capture with a defensible chain of custody from arrival to release' },
  ],
} as const;

export const YARDFLOW_PROOF = {
  facilitiesLive: '24',
  contractedNetwork: '>200',
  headcountImpact: 'NEUTRAL',
  avgDropHook: '48→24',
  dropHookUnit: 'min',
  perSiteProfit: '$1M+',
  deployTime: '30 min remote deployment',

  customerQuote: {
    text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office. That was an integral part of our strategy and has been proven. We believe system driven dock door assignment will be a valuable next step for dock office optimization.',
    attribution: 'Dock Operations Leadership',
    company: 'Top CPG Shipper',
    verified: true,
  },

  stats: [
    { value: '24', label: 'Facilities Live', icon: 'facility' },
    { value: '>200', label: 'Contracted Network', icon: 'network' },
    { value: 'NEUTRAL', label: 'Headcount Impact', icon: 'headcount' },
    { value: '48→24', label: 'Avg. Drop & Hook (min)', icon: 'clock' },
    { value: '$1M+', label: 'Per-site Profit Lift', icon: 'money' },
  ],

  keyOutcomes: [
    'More volume, same headcount — additional volume shipped while remaining headcount neutral',
    '$1M+ incremental profit per site from recovered capacity',
    '50% faster drop & hook — average cut from 48 to 24 minutes',
    'Path to paperless — $100K savings, 1K+ trees saved',
  ],
} as const;

export const YARDFLOW_MESSAGING = {
  painFramework: {
    header: 'Typical Reality',
    defaultPains: [
      'Manual gate check-in & radio dispatching under peak pressure',
      'Dwell depends on tribal knowledge, not a standard operating sequence',
      'Each facility runs its own yard playbook — variance compounds network-wide',
      'Dock-office friction, detention, & local workarounds hide lost throughput',
    ],
  },

  solutionFramework: {
    header: 'Standardized Operating Protocol',
    description: 'The 4-step driver journey that replaces manual chaos with deterministic flow.',
  },

  outcomeFramework: {
    header: 'YardFlow Effect',
    defaultOutcomes: [
      'One standardized driver journey across facilities',
      'System-driven tasking, lane & dock direction, and timestamped handoffs',
      'Defensible chain of custody from check-in to BOL',
      'Cleaner dock flow and more volume shipped without adding headcount',
    ],
  },

  varianceTax: 'Your yard is where trucking market swings become P&L events. Detention spikes. Labor scrambles. Missed cutoffs. Carrier penalties. Every manual process is a variance generator.',

  networkEffect: 'Yards are a network, not snowflakes. Every facility adds proof points. Every driver journey tightens variance bands. Standards compound. Adoption accelerates. Data patterns emerge.',

  bestFitProfile: 'Constrained plants and DCs where production is there, but outbound flow is still leaking margin.',
} as const;

/**
 * Build the full brand context block for AI prompts
 */
export function getYardFlowPromptContext(): string {
  return `
YARDFLOW BRAND CONTEXT (use this for all generated content):

Company: ${YARDFLOW_BRAND.fullName}
Positioning: ${YARDFLOW_BRAND.tagline} — ${YARDFLOW_BRAND.positioning}
Core insight: ${YARDFLOW_PRODUCT.coreInsight}
The fix: ${YARDFLOW_PRODUCT.fix}
Protocol: ${YARDFLOW_PRODUCT.protocolIsProduct}

The 4-Step Driver Journey (standardized operating protocol):
1. Gate Check-in — Verified driver ID and a standard intake sequence every time
2. Yard Routing — Automated lane and move logic replaces manual radio dispatching
3. Dock Assignment — Seamless dock handoff with timestamped direction and clear accountability
4. BOL Proof — Touchless BOL capture with a defensible chain of custody from arrival to release

Six Modules: flowDRIVER (verify), flowBOL (document), flowSPOTTER (execute), flowTWIN (map), flowAI (orchestrate), flowNETWORK (scale)

Proof from Live Deployment:
- 24 facilities live
- >200 contracted network
- Headcount neutral — additional volume shipped without adding headcount
- Drop & hook cut from 48 to 24 minutes (50% faster)
- $1M+ per-site profit lift
- 30-minute remote deployment per facility

Verified Customer Quote: "${YARDFLOW_PROOF.customerQuote.text}" — ${YARDFLOW_PROOF.customerQuote.attribution}, ${YARDFLOW_PROOF.customerQuote.company}

Typical Reality (pain points to customize per account):
- Manual gate check-in & radio dispatching under peak pressure
- Dwell depends on tribal knowledge, not a standard operating sequence
- Each facility runs its own yard playbook — variance compounds network-wide
- Dock-office friction, detention, & local workarounds hide lost throughput

YardFlow Effect (outcomes to customize per account):
- One standardized driver journey across facilities
- System-driven tasking, lane & dock direction, and timestamped handoffs
- Defensible chain of custody from check-in to BOL
- Cleaner dock flow and more volume shipped without adding headcount

Best fit: ${YARDFLOW_MESSAGING.bestFitProfile}
CTA: ${YARDFLOW_BRAND.ctaMeeting}

IMPORTANT LANGUAGE RULES:
- Always say "YardFlow by FreightRoll" on first mention, then "YardFlow" thereafter
- YardFlow is a "Yard Network System (YNS)" — NEVER call it a "YMS" or "yard management system"
- It is a "standardized operating protocol" — use this language, not "software" or "platform"
- The protocol IS the product — emphasize standards, not features
- "Deterministic throughput" and "variance" are core vocabulary
- Use "Ground Source Truth" when referencing evidence/proof capabilities
- Reference the pipe/flow metaphor — tangled pipe (before) → straight pipe (after) → expanding funnel (YardFlow effect)
`.trim();
}
