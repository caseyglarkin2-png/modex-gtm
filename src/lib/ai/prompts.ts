import { getYardFlowPromptContext } from './yardflow-context';

export interface PromptContext {
  accountName: string;
  personaName?: string;
  personaTitle?: string;
  bandLabel?: string;
  score?: number;
  previousMeeting?: string;
  notes?: string;
  tone: 'professional' | 'casual' | 'bold';
  length: 'short' | 'medium' | 'long';
}

export interface OnePagerContext {
  accountName: string;
  parentBrand: string;
  vertical: string;
  whyNow: string;
  primoAngle: string;
  bestIntroPath: string;
  likelyPainPoints: string;
  primoRelevance: string;
  suggestedAttendees: string;
  score: number;
  tier: string;
  band: string;
}

const TONE_DESCRIPTIONS = {
  professional: 'formal, polished, executive-level language',
  casual: 'conversational, warm, and approachable',
  bold: 'direct, confident, and outcome-focused with a strong hook',
};

const LENGTH_RANGES = {
  short: '50–80 words',
  medium: '100–150 words',
  long: '200–300 words',
};

export function buildEmailPrompt(ctx: PromptContext): string {
  return `Write a cold outreach email for a B2B trade-show sales context.

${getYardFlowPromptContext()}

Sender: Casey Larkin, GTM Lead at YardFlow by FreightRoll
- Target company: ${ctx.accountName}
- Target contact: ${ctx.personaName ?? 'decision maker'}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
- Account priority band: ${ctx.bandLabel ?? 'Tier 1'}
- Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
- Length: ${LENGTH_RANGES[ctx.length]}
${ctx.notes ? `- Additional context: ${ctx.notes}` : ''}

Goal: Book a 30-minute Network Audit call to map their facilities and build a board-ready rollout plan.
Secondary hook: MODEX 2026 in Atlanta (March 16–19, 2026) as an in-person meeting opportunity.

Output: Only the email body (no subject line, no sign-off label). Start with a compelling first sentence.`;
}

export function buildFollowUpEmailPrompt(ctx: PromptContext): string {
  return `Write a follow-up email after a meeting at MODEX 2026.

${getYardFlowPromptContext()}

Sender: Casey Larkin, GTM Lead at YardFlow by FreightRoll
- Target company: ${ctx.accountName}
- Contact: ${ctx.personaName ?? 'decision maker'}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
- Previous interaction: ${ctx.previousMeeting ?? 'brief booth conversation at MODEX 2026'}
- Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
- Length: ${LENGTH_RANGES[ctx.length]}
${ctx.notes ? `- Key talking points from meeting: ${ctx.notes}` : ''}

Goal: Move the deal forward — schedule a Network Audit call to map facilities and build rollout plan.

Output: Only the email body. Start with a reference to your last interaction.`;
}

export function buildDMPrompt(ctx: PromptContext): string {
  return `Write a LinkedIn direct message for B2B sales outreach.

${getYardFlowPromptContext()}

Sender: Casey Larkin, GTM Lead at YardFlow by FreightRoll
- Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? `, ${ctx.personaTitle}` : ''}
- Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
- Length: ${LENGTH_RANGES[ctx.length]} (LinkedIn DMs must be concise — prefer the short end)
${ctx.notes ? `- Context: ${ctx.notes}` : ''}

Goal: Start a conversation and mention MODEX 2026 or a Network Audit as a meeting opportunity.

Output: Only the message text, no salutation label, no signature.`;
}

export function buildCallScriptPrompt(ctx: PromptContext): string {
  return `Write a cold call script for B2B outreach.

${getYardFlowPromptContext()}

Caller: Casey Larkin, GTM Lead at YardFlow by FreightRoll
- Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? `, ${ctx.personaTitle}` : ''}
- Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
- Length: ${LENGTH_RANGES[ctx.length]}
${ctx.notes ? `- Additional context: ${ctx.notes}` : ''}

Goal: Secure a 30-minute Network Audit call. Use MODEX 2026 (Atlanta, March 16–19) as secondary hook.

Structure:
1. Quick opener (10 sec)
2. Value hook — lead with their specific throughput/yard constraint, connect to YardFlow proof (20 sec)
3. Qualifying question about their yard operations
4. Network Audit ask — "30 minutes to map your facilities and build a board-ready ROI"
5. Objection handling notes (2–3 common objections)

Output: Formatted script with section labels.`;
}

export function buildMeetingPrepPrompt(ctx: PromptContext): string {
  return `Create a meeting prep brief for a B2B sales meeting.

${getYardFlowPromptContext()}

Account: ${ctx.accountName} (${ctx.bandLabel ?? 'Tier 1'} priority, score: ${ctx.score ?? 'N/A'})
- Key contact: ${ctx.personaName ?? 'TBD'}${ctx.personaTitle ? ` — ${ctx.personaTitle}` : ''}
- Meeting type: MODEX 2026 trade-show meeting or Network Audit call
${ctx.notes ? `- Context: ${ctx.notes}` : ''}

Create a structured brief with:
1. Company snapshot (2–3 sentences about their yard/logistics/throughput challenges)
2. YardFlow value props for this account (3 bullet points — connect their operations to YardFlow modules)
3. Recommended opening questions (3 questions about their yard operations, variance, and throughput)
4. Potential objections + counters (2–3)
5. Ideal next step — Network Audit or pilot site identification

Output: Structured markdown with headers.`;
}

export function buildOnePagerPrompt(ctx: OnePagerContext): string {
  return `You are generating content for a YardFlow by FreightRoll sales infographic one-pager.

${getYardFlowPromptContext()}

Target Account:
- Company: ${ctx.accountName} (parent: ${ctx.parentBrand})
- Vertical: ${ctx.vertical}
- Priority: ${ctx.tier} (Band ${ctx.band}, Score ${ctx.score}/100)
- Why now: ${ctx.whyNow}
- Primo angle: ${ctx.primoAngle}
- Likely pain points: ${ctx.likelyPainPoints}
- Primo relevance: ${ctx.primoRelevance}

INSTRUCTIONS:
The output is a JSON that populates a branded infographic one-pager. The visual layout has:
1. A header: "FOR [ACCOUNT NAME]" above "YardFlow by FreightRoll"
2. A bold headline about the throughput constraint this account faces
3. A subheadline connecting their business to YardFlow (2-3 sentences)
4. A 3-column comparison: Typical Reality (red) → Standardized Operating Protocol (blue, 4-step flow) → YardFlow Effect (green)
5. A "Proof from Live Deployment" stats bar
6. A customer quote (use the verified quote, marked illustrative only if modified)
7. Best fit + Public source context

CRITICAL: Pain points and outcomes MUST be customized to this specific account's vertical and operations.
- Pain points should reference their industry (e.g., "yogurt production surges" for Dannon, "seasonal volume spikes" for retail)
- Outcomes should connect YardFlow to their specific throughput needs
- Solution steps should be tailored descriptions of how each step helps THIS account

Generate ONLY valid JSON matching this schema — no markdown, no commentary:

{
  "headline": "string — 6-10 word power headline about the throughput constraint (e.g., 'WHEN DEMAND SPIKES, THROUGHPUT BECOMES THE CONSTRAINT')",
  "subheadline": "string — 2-3 sentences connecting their specific business reality to YardFlow's standardized protocol",
  "painPoints": [
    "string — pain customized to this account's operations (include industry-specific language)",
    "string — second pain point",
    "string — third pain point",
    "string — fourth pain point"
  ],
  "solutionSteps": [
    {"step": 1, "title": "Gate Check-in", "description": "string — 1 sentence tailored to this account (e.g., 'Verified driver ID and a standard intake sequence every time')"},
    {"step": 2, "title": "Yard Routing", "description": "string — tailored (e.g., 'Automated lane and move logic replaces manual radio dispatching')"},
    {"step": 3, "title": "Dock Assignment", "description": "string — tailored (e.g., 'Seamless dock handoff with timestamped direction and clear accountability')"},
    {"step": 4, "title": "BOL Proof", "description": "string — tailored (e.g., 'Touchless BOL capture with a defensible chain of custody from arrival to release')"}
  ],
  "outcomes": [
    "string — YardFlow effect customized to this account",
    "string — second outcome",
    "string — third outcome",
    "string — fourth outcome"
  ],
  "proofStats": [
    {"value": "24", "label": "Facilities Live"},
    {"value": ">200", "label": "Contracted Network"},
    {"value": "NEUTRAL", "label": "Headcount Impact"},
    {"value": "48→24", "label": "Avg. Drop & Hook (min)"},
    {"value": "$1M+", "label": "Per-site Profit Lift"}
  ],
  "customerQuote": "string — use the verified quote: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.' OR create an illustrative variation relevant to this vertical (prefix with '(Illustrative)')",
  "bestFit": "string — 1-2 sentences about why this account is an ideal fit referencing their specific operations",
  "publicContext": "string — reference any public sources, signals, or intel that support the outreach (investor transcripts, MODEX attendance, facility expansions, etc.)"
}`;
}

export function buildOutreachSequencePrompt(ctx: PromptContext, step: 'initial_email' | 'follow_up_1' | 'follow_up_2' | 'breakup'): string {
  const stepInstructions: Record<string, string> = {
    initial_email: `Write the FIRST outreach email in a 4-touch sequence. This is cold — the prospect has never heard from us.
Hook with their specific throughput/yard constraint, connect it to YardFlow's proof (24 sites, $1M+ per-site), and ask for a 30-minute Network Audit.
Subject line + body. Subject must be < 60 chars, personalized, no spam words.`,
    follow_up_1: `Write follow-up #1 (sent 3 days after initial email with no reply).
Shorter than the first. Add ONE new proof point or insight they haven't seen — use a stat, module name, or customer quote.
Reference the first email indirectly ("circling back" is banned — find a better hook).
Subject line + body.`,
    follow_up_2: `Write follow-up #2 (sent 5 days after follow-up #1 with no reply).
Switch angle entirely — lead with the variance tax concept, a different proof point, or a micro-case-study (e.g., "48→24 min drop & hook" or "headcount neutral while adding volume").
This is your last real shot before the breakup. Make it count.
Subject line + body.`,
    breakup: `Write a breakup email (sent 7 days after follow-up #2 with no reply).
Short, gracious, zero pressure. Plant a seed for future conversation.
Mention the Network Audit is always available when timing is right.
Subject line + body.`,
  };

  return `You are writing outreach for YardFlow by FreightRoll.

${getYardFlowPromptContext()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
Account priority: ${ctx.bandLabel ?? 'Tier 1'}
Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
${ctx.notes ? `Account context: ${ctx.notes}` : ''}

${stepInstructions[step]}

Output format:
SUBJECT: <subject line>
---
<email body — no sign-off label, just the text>`;
}
