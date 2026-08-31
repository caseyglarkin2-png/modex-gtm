/**
 * YardFlow brand context — sourced from yardflow.ai, the Order-of-Operations
 * launch paper, and docs/canonical-product-suite.md (post-pivot canon).
 * Used by AI prompts to generate contextually accurate, on-brand content.
 */

export const YARDFLOW_BRAND = {
  name: 'YardFlow',
  parent: 'FreightRoll',
  fullName: 'YardFlow by FreightRoll',
  tagline: 'The First Yard Network System',
  subtag: 'One yard network, one protocol.',
  positioning: 'A role-first, system-first operating layer for the yard. One protocol took 24 Primo Brands sites from 48 to 24 minutes gate to gate, worth $1M+ per site modeled. The full 260-site network is committed.',
  url: 'https://yardflow.ai',
  ctaLabel: 'Book a Network Audit',
  ctaMeeting: '30-minute Network Audit: facility mapping + board-ready ROI',
  sender: {
    name: 'Casey Larkin',
    title: 'GTM Lead',
    company: 'YardFlow by FreightRoll',
    email: 'casey@freightroll.com',
  },
} as const;

export const YARDFLOW_PRODUCT = {
  what: 'YardFlow is a role-first, system-first operating layer for the yard. It standardizes the driver journey first, then layers flowYMS as the execution brain that turns that standard into scheduled, sequenced yard execution across a network.',
  coreInsight: 'The yard is where production capacity leaks back out. Manual check-in. Radio dispatching. Tribal knowledge at the gate. The yard consumes margin that never comes back.',
  fix: 'YardFlow standardizes one driver journey across every facility. Same steps. Same sequence. Same evidence. Variance dies. Production capacity becomes calculable, then flowYMS orchestrates it.',
  protocolIsProduct: 'Driver journey first, automate last. Standardize the five yard roles, prove production capacity, then let flowYMS and flowAI orchestrate it network-wide.',

  modules: [
    {
      id: 'flowDRIVER',
      name: 'flowDRIVER',
      shortName: 'Driver Journey',
      verb: 'Verify',
      description: 'Digital driver journey from check-in to check-out powered by FreightRoll ID and a standardized gate protocol. This is the first thing deployed and where production-capacity gains show up before any automation.',
      bullets: ['QR + wallet identity verification', 'Algorithmic lane and dock direction', 'Check-in to check-out chain of custody'],
    },
    {
      id: 'flowGATE',
      name: 'flowGATE',
      shortName: 'Gate Control',
      verb: 'Admit',
      description: 'Automated gate and access control. Appointment matching and self-service admit remove the staffed-lane bottleneck so check-in volume is no longer tied to a person at the gate.',
      bullets: ['Self-service, appointment-matched admit', 'Access control and exception routing', 'Gate volume decoupled from staffing'],
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
      id: 'flowVISION',
      name: 'flowVISION',
      shortName: 'Digital Twin + Moves',
      verb: 'Map',
      description: 'Machine vision and GPS-enabled digital twin of the yard for real-time location, dwell, and lane state, with spotter move execution and task queues built in (the former flowSPOTTER is folded into flowVISION).',
      bullets: ['Live yard topology', 'Trailer and lane state awareness', 'In-app spotter move queue and completion'],
    },
    {
      id: 'flowNETWORK',
      name: 'flowNETWORK',
      shortName: 'Network Command',
      verb: 'Scale',
      description: 'Yard network-wide command view with alerting, simulation, and cross-site performance intelligence.',
      bullets: ['Network-wide alerting', 'Scenario and rollout simulation', 'Cross-site pattern detection'],
    },
    {
      id: 'flowAI',
      name: 'flowAI',
      shortName: 'AI Copilot',
      verb: 'Recommend',
      description: 'AI agent that reads flowVISION and operational data to recommend the next move, route exceptions, and continuously tune the standard. It rides on top of flowYMS, it does not replace it.',
      bullets: ['Action recommendations by state', 'Escalation and exception routing', 'Continuous standard optimization'],
    },
    {
      id: 'flowYMS',
      name: 'flowYMS',
      shortName: 'Execution Brain',
      verb: 'Orchestrate',
      description: 'The YMS execution brain. Appointment, dock, and move orchestration that turns the standardized driver journey into scheduled, sequenced execution across the yard and the network. A great YMS is the execution brain, and flowYMS is YardFlow\'s.',
      bullets: ['Appointment and dock scheduling', 'Move planning and sequencing', 'Standard turned into orchestrated execution'],
    },
  ],

  /** The 4-step driver journey used in one-pagers (the role-first spine deployed first) */
  driverJourney: [
    { step: 1, title: 'Gate Check-in', description: 'Verified driver ID and a standard intake sequence every time' },
    { step: 2, title: 'Yard Routing', description: 'Automated lane and move logic replaces manual radio dispatching' },
    { step: 3, title: 'Dock Assignment', description: 'Seamless dock handoff with timestamped direction and clear accountability' },
    { step: 4, title: 'BOL Proof', description: 'Touchless BOL capture with a defensible chain of custody from arrival to release' },
  ],
} as const;

export const YARDFLOW_PROOF = {
  facilitiesLive: '24',
  contractedNetwork: '260',
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
    { value: '260', label: 'Sites Committed (100% of network)', icon: 'network' },
    { value: 'NEUTRAL', label: 'Headcount Impact', icon: 'headcount' },
    { value: '48→24', label: 'Avg. Drop & Hook (min)', icon: 'clock' },
    { value: '$1M+', label: 'Per-site Profit Lift', icon: 'money' },
  ],

  keyOutcomes: [
    'Headcount neutral. Capture more freight during demand spikes without adding a single person',
    '$1M+ incremental profit per site from recovered dock capacity',
    'Drop & hook time cut from 48 to 24 minutes. Trucks turn faster, freeing docks',
    'Path to paperless. $100K savings, 1K+ trees saved',
  ],
} as const;

export const YARDFLOW_MESSAGING = {
  painFramework: {
    header: 'Typical Reality',
    defaultPains: [
      'Manual gate check-in & radio dispatching under peak pressure',
      'Dwell depends on tribal knowledge, not a standard operating sequence',
      'Each facility runs its own yard playbook. Variance compounds network-wide',
      'Dock-office friction, detention, & local workarounds hide lost production capacity',
    ],
  },

  solutionFramework: {
    header: 'Standardized Driver Journey',
    description: 'The 4-step driver journey that replaces manual chaos with deterministic flow, before any automation.',
  },

  outcomeFramework: {
    header: 'YardFlow Effect',
    defaultOutcomes: [
      'One standardized driver journey across facilities',
      'System-driven tasking, lane & dock direction, and timestamped handoffs',
      'Defensible chain of custody from check-in to BOL',
      'Cleaner dock flow. Capture more freight when demand spikes without adding headcount',
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
Positioning: ${YARDFLOW_BRAND.tagline}. ${YARDFLOW_BRAND.positioning}
Core insight: ${YARDFLOW_PRODUCT.coreInsight}
The fix: ${YARDFLOW_PRODUCT.fix}
Operating philosophy: ${YARDFLOW_PRODUCT.protocolIsProduct}

The 4-Step Driver Journey (deployed first, role-first spine):
1. Gate Check-in: Verified driver ID and a standard intake sequence every time
2. Yard Routing: Automated lane and move logic replaces manual radio dispatching
3. Dock Assignment: Seamless dock handoff with timestamped direction and clear accountability
4. BOL Proof: Touchless BOL capture with a defensible chain of custody from arrival to release

The Suite: flowDRIVER (verify), flowGATE (admit), flowBOL (document), flowVISION (map, with spotter moves folded in), flowNETWORK (scale), flowAI (recommend), and flowYMS (orchestrate — the execution brain). There is no standalone flowSPOTTER anymore; move execution lives inside flowVISION.

Product frame (post-pivot canon — do not contradict):
- YardFlow is role-first and system-first. Standardize the yard roles and the driver journey first, prove production capacity, then automate.
- YardFlow is PRO-YMS. A great YMS is the execution brain, and flowYMS is YardFlow's. Never say "not a YMS" or position against a YMS.
- The driver-journey layer alone lifted production capacity at live sites before the YMS automation went in. Driver journey first, automate last.

Proof from Live Deployment:
- 24 facilities live; the full 260-site network committed (100% under contract)
- Headcount neutral. Captured additional volume without adding a single person
- Drop & hook time cut from 48 to 24 minutes. Trucks turn faster, freeing dock capacity
- $1M+ per-site incremental profit (modeled, conservative floor)
- 30-minute remote deployment per facility

CRITICAL CLAIM ACCURACY RULES (never violate these):
- The 50% improvement is DROP & HOOK TIME (truck turn speed), NOT freight volume. Never say "ship 50% more" or "50% more volume."
- YardFlow lets facilities capture more of the demand spike when it happens, without adding headcount. Even 5% more freight captured is massive at scale.
- Do NOT invent volume percentages. The volume benefit is: same headcount handles more freight when demand spikes.
- Do NOT say "ship twice as much" or any volume multiplier. The math is: faster turns = more dock availability = ability to absorb demand surges.
- Approved phrasing: "capture more freight without adding headcount", "absorb demand spikes", "recover dock capacity", "faster truck turns", "grow production capacity", "$1M+ per site"
- NEVER make up statistics that are not listed here. If you do not have a number, describe the outcome qualitatively.

Verified Customer Quote: "${YARDFLOW_PROOF.customerQuote.text}" - ${YARDFLOW_PROOF.customerQuote.attribution}, ${YARDFLOW_PROOF.customerQuote.company}

Typical Reality (pain points to customize per account):
- Manual gate check-in & radio dispatching under peak pressure
- Dwell depends on tribal knowledge, not a standard operating sequence
- Each facility runs its own yard playbook. Variance compounds network-wide
- Dock-office friction, detention, & local workarounds hide lost production capacity

YardFlow Effect (outcomes to customize per account):
- One standardized driver journey across facilities
- System-driven tasking, lane & dock direction, and timestamped handoffs
- Defensible chain of custody from check-in to BOL
- Cleaner dock flow. Capture more freight when demand spikes without adding headcount

Best fit: ${YARDFLOW_MESSAGING.bestFitProfile}
CTA: ${YARDFLOW_BRAND.ctaMeeting}

IMPORTANT LANGUAGE RULES:
- Always say "YardFlow by FreightRoll" on first mention, then "YardFlow" thereafter
- YardFlow is role-first and system-first. It standardizes the yard, then orchestrates it with flowYMS. It is PRO-YMS: never say "not a YMS" or "yard management system" as a foil
- flowYMS is the product name for the YMS / execution-brain layer. Approve and use it
- Emphasize the standard and the driver journey first, then the automation
- The metric word is "production capacity" or "volume". NEVER use "throughput"
- "production capacity", "variance", and "driver journey" are core vocabulary
- Use "Ground Source Truth" when referencing evidence/proof capabilities
- Reference the pipe/flow metaphor — tangled pipe (before) → straight pipe (after) → expanding funnel (YardFlow effect)
`.trim();
}
