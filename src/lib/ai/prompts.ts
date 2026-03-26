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

Context:
- Sender: Casey or Jake from FreightRoll (AI-powered logistics software for CPG companies)
- Target company: ${ctx.accountName}
- Target contact: ${ctx.personaName ?? 'decision maker'}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
- Account priority band: ${ctx.bandLabel ?? 'Tier 1'}
- Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
- Length: ${LENGTH_RANGES[ctx.length]}
${ctx.notes ? `- Additional context: ${ctx.notes}` : ''}

Goal: Book a 20-minute meeting at MODEX 2026 in Atlanta (March 16–19, 2026).
Value prop: FreightRoll reduces CPG freight costs 12–18% with real-time carrier intelligence and automated routing.

Output: Only the email body (no subject line, no sign-off label). Start with a compelling first sentence.`;
}

export function buildFollowUpEmailPrompt(ctx: PromptContext): string {
  return `Write a follow-up email after a meeting at MODEX 2026.

Context:
- Sender: Casey or Jake from FreightRoll
- Target company: ${ctx.accountName}
- Contact: ${ctx.personaName ?? 'decision maker'}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
- Previous interaction: ${ctx.previousMeeting ?? 'brief booth conversation at MODEX 2026'}
- Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
- Length: ${LENGTH_RANGES[ctx.length]}
${ctx.notes ? `- Key talking points from meeting: ${ctx.notes}` : ''}

Goal: Move the deal forward — schedule a product demo or discovery call.

Output: Only the email body. Start with a reference to your last interaction.`;
}

export function buildDMPrompt(ctx: PromptContext): string {
  return `Write a LinkedIn direct message for B2B sales outreach.

Context:
- Sender: Jake from FreightRoll (logistics SaaS)
- Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? `, ${ctx.personaTitle}` : ''}
- Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
- Length: ${LENGTH_RANGES[ctx.length]} (LinkedIn DMs must be concise — prefer the short end)
${ctx.notes ? `- Context: ${ctx.notes}` : ''}

Goal: Start a conversation and mention MODEX 2026 as a meeting opportunity.

Output: Only the message text, no salutation label, no signature.`;
}

export function buildCallScriptPrompt(ctx: PromptContext): string {
  return `Write a cold call script for B2B outreach.

Context:
- Caller: Casey or Jake from FreightRoll (freight cost reduction SaaS for CPG)
- Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? `, ${ctx.personaTitle}` : ''}
- Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
- Length: ${LENGTH_RANGES[ctx.length]}
${ctx.notes ? `- Additional context: ${ctx.notes}` : ''}

Goal: Secure a 20-min meeting at MODEX 2026 (Atlanta, March 16–19).

Structure:
1. Quick opener (10 sec)
2. Value hook (20 sec)
3. Qualifying question
4. Meeting ask with MODEX hook
5. Objection handling notes (2–3 common objections)

Output: Formatted script with section labels.`;
}

export function buildMeetingPrepPrompt(ctx: PromptContext): string {
  return `Create a meeting prep brief for a B2B sales meeting.

Context:
- Our team: FreightRoll (AI-powered freight cost reduction for CPG companies)
- Account: ${ctx.accountName} (${ctx.bandLabel ?? 'Tier 1'} priority, score: ${ctx.score ?? 'N/A'})
- Key contact: ${ctx.personaName ?? 'TBD'}${ctx.personaTitle ? ` — ${ctx.personaTitle}` : ''}
- Meeting type: MODEX 2026 trade-show meeting
${ctx.notes ? `- Context: ${ctx.notes}` : ''}

Create a structured brief with:
1. Company snapshot (2–3 sentences about their freight/logistics challenges as a CPG company)
2. Our best value props for this account (3 bullet points)
3. Recommended opening questions (3 questions)
4. Potential objections + counters (2–3)
5. Ideal next step after the meeting

Output: Structured markdown with headers.`;
}

export function buildOnePagerPrompt(ctx: OnePagerContext): string {
  return `You are a B2B sales collateral writer for FreightRoll / YardFlow, a logistics SaaS company.

Generate a structured one-pager / infographic brief for the target account below. This will be rendered as a branded HTML document — not an image. Output ONLY valid JSON matching the schema below, no markdown fences or commentary.

Target Account:
- Company: ${ctx.accountName} (parent: ${ctx.parentBrand})
- Vertical: ${ctx.vertical}
- Priority: ${ctx.tier} (Band ${ctx.band}, Score ${ctx.score}/100)
- Why now: ${ctx.whyNow}
- Primo angle: ${ctx.primoAngle}
- Likely pain points: ${ctx.likelyPainPoints}
- Primo relevance: ${ctx.primoRelevance}

YardFlow Product Context:
- YardFlow by FreightRoll standardizes the gate-to-dock operating protocol
- 4-step flow: Gate Check-in → Yard Routing → Dock Assignment → BOL Proof
- Typical Reality (before): manual gate check-in, radio dispatching, tribal knowledge, dock-office friction, local workarounds
- Standardized Operating Protocol: verified driver ID, automated lane/move logic, timestamped dock handoff, touchless BOL capture
- YardFlow Effect (after): standardized driver journey, system-driven tasking, defensible chain of custody, cleaner dock flow
- Proof from live deployment: 24 facilities live, >200 contracted network, headcount neutral, 48→24 min avg drop & hook, $1M+ per-site profit lift

JSON Schema (output EXACTLY this structure):
{
  "headline": "string — 8-12 word power headline about the constraint this account faces",
  "subheadline": "string — 2-3 sentences connecting their business reality to YardFlow",
  "painPoints": ["string", "string", "string"] — 3 specific pain points customized to this account's vertical/operations,
  "solutionSteps": [
    {"step": 1, "title": "Gate Check-in", "description": "string — 1 sentence tailored to this account"},
    {"step": 2, "title": "Yard Routing", "description": "string"},
    {"step": 3, "title": "Dock Assignment", "description": "string"},
    {"step": 4, "title": "BOL Proof", "description": "string"}
  ],
  "outcomes": ["string", "string", "string"] — 3 YardFlow outcomes written for this account's context,
  "proofStats": [
    {"value": "24", "label": "Facilities Live"},
    {"value": ">200", "label": "Contracted Network"},
    {"value": "NEUTRAL", "label": "Headcount Impact"},
    {"value": "48→24", "label": "Avg. Drop & Hook (min)"},
    {"value": "$1M+", "label": "Per-site Profit Lift"}
  ],
  "customerQuote": "string — a plausible executive-voice testimonial quote relevant to this vertical (mark as illustrative)",
  "bestFit": "string — 1-2 sentences about why this account is an ideal fit",
  "publicContext": "string — reference any public sources or signals that support the outreach"
}`;
}

export function buildOutreachSequencePrompt(ctx: PromptContext, step: 'initial_email' | 'follow_up_1' | 'follow_up_2' | 'breakup'): string {
  const stepInstructions: Record<string, string> = {
    initial_email: `Write the FIRST outreach email in a 4-touch sequence. This is cold — the prospect has never heard from us.
Hook with their specific business challenge, connect it to YardFlow's proof point, and ask for 20 minutes at MODEX 2026.
Subject line + body. Subject must be < 60 chars, personalized, no spam words.`,
    follow_up_1: `Write follow-up #1 (sent 3 days after initial email with no reply).
Shorter than the first. Add ONE new proof point or insight they haven't seen.
Reference the first email indirectly ("circling back" is banned — find a better hook).
Subject line + body.`,
    follow_up_2: `Write follow-up #2 (sent 5 days after follow-up #1 with no reply).
Switch angle entirely — lead with a question, a stat, or a micro-case-study.
This is your last real shot before the breakup. Make it count.
Subject line + body.`,
    breakup: `Write a breakup email (sent 7 days after follow-up #2 with no reply).
Short, gracious, zero pressure. Plant a seed for future conversation.
Mention you'll be at MODEX if they change their mind.
Subject line + body.`,
  };

  return `You are writing outreach for FreightRoll / YardFlow, a logistics SaaS company targeting ${ctx.accountName}.

Context:
- Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
- Account priority: ${ctx.bandLabel ?? 'Tier 1'}
- Tone: ${TONE_DESCRIPTIONS[ctx.tone]}
${ctx.notes ? `- Account context: ${ctx.notes}` : ''}

${stepInstructions[step]}

Output format:
SUBJECT: <subject line>
---
<email body — no sign-off label, just the text>`;
}
