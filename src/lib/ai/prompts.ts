import { getYardFlowPromptContext } from './yardflow-context';
import { getVoiceGuardrails } from './voice-guardrails';

export interface PromptContext {
  accountName: string;
  personaName?: string;
  personaTitle?: string;
  bandLabel?: string;
  score?: number;
  previousMeeting?: string;
  notes?: string;
  vertical?: string;
  primoAngle?: string;
  parentBrand?: string;
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

export function buildEmailPrompt(ctx: PromptContext): string {
  return `Write a cold outreach email.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
Priority: ${ctx.bandLabel ?? 'Tier 1'}
${ctx.vertical ? `Vertical: ${ctx.vertical}` : ''}
${ctx.primoAngle ? `What makes this account specific: ${ctx.primoAngle}` : ''}
${ctx.notes ? `Context: ${ctx.notes}` : ''}

MODEX: April 13-16, Atlanta. YardFlow will be on-site with live users from the network. Prospects can sit with operators running YardFlow across 24 facilities and ask them anything. Suggest meeting windows: Tuesday April 14 at 10am, 1pm, or 3pm. Offer flexibility for other show days. No calendar link. Get them to reply with a time.

Goal: Book a 30-minute meeting at MODEX to walk their yard network and build a board-ready rollout plan.

Max 100 words. Open on a truth about THEIR specific operation, not a generic supply chain statement. Do not start with "The yard is where." End with a direct question. No sign-off.

Output: Only the email body.`;
}

export function buildFollowUpEmailPrompt(ctx: PromptContext): string {
  return `Write a follow-up email. The first outreach got no reply.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
Previous: ${ctx.previousMeeting ?? 'cold email sent about yard network standardization ahead of MODEX'}
${ctx.vertical ? `Vertical: ${ctx.vertical}` : ''}
${ctx.primoAngle ? `What makes this account specific: ${ctx.primoAngle}` : ''}
${ctx.notes ? `Context: ${ctx.notes}` : ''}

Do not reference the first email directly. Come in from a different angle. Add one new proof point (a stat, a module, the customer quote). Make the current state feel more expensive than before.

MODEX: April 13-16, Atlanta. Live YardFlow users will be on-site. Suggest Tuesday April 14. No calendar link.

Max 70 words. Tighter and harder than the first touch. End with a direct question. No sign-off.

Output: Only the email body.`;
}

export function buildDMPrompt(ctx: PromptContext): string {
  return `Write a LinkedIn direct message.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? `, ${ctx.personaTitle}` : ''}
${ctx.notes ? `Context: ${ctx.notes}` : ''}

LinkedIn DMs must be 40-60 words max. One thought. One ask. No small talk.
Reference MODEX (April 13-16, Atlanta) only if it sharpens the ask. Lead with the yard as the constraint. End with a question.

Output: Only the message text. No greeting label, no signature.`;
}

export function buildCallScriptPrompt(ctx: PromptContext): string {
  return `Write a cold call script.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? `, ${ctx.personaTitle}` : ''}
${ctx.notes ? `Context: ${ctx.notes}` : ''}

MODEX: April 13-16, Atlanta. Live YardFlow users on-site. Suggest Tuesday April 14.

Structure:
1. Opener (10 sec): Name, company, one sentence about the yard constraint
2. Hook (15 sec): Their specific throughput problem, what 24 facilities proved
3. Qualifying question: How their yards run today
4. Ask: 30 minutes at MODEX to map facilities and build board-ready ROI
5. Objection handling (2-3 common objections with counters)

Output: Formatted script with section labels.`;
}

export function buildMeetingPrepPrompt(ctx: PromptContext): string {
  return `Create a meeting prep brief.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Account: ${ctx.accountName} (${ctx.bandLabel ?? 'Tier 1'}, score: ${ctx.score ?? 'N/A'})
Contact: ${ctx.personaName ?? 'TBD'}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
Meeting: In-person at MODEX 2026 (Atlanta, April 13-16) or Network Audit call
${ctx.notes ? `Context: ${ctx.notes}` : ''}

Create a structured brief:
1. Company snapshot (2-3 sentences about their yard/logistics/throughput reality)
2. The yard constraint for this account (the specific version of the black hole they are living with)
3. YardFlow value props (3 bullets connecting their operations to YNS modules)
4. Opening questions (3 questions that surface the variance tax in their words)
5. Objections + counters (2-3)
6. Ideal next step

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
  // Rotate opening strategy based on account name hash to force variation across accounts
  const hash = ctx.accountName.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const strategies = ['OBSERVATION', 'UNCOMFORTABLE QUESTION', 'COST NOBODY COUNTED', 'PEER GAP', 'REFRAME', 'SPECIFICITY'];
  const primaryStrategy = strategies[Math.abs(hash) % strategies.length];
  const secondaryStrategy = strategies[(Math.abs(hash) + 3) % strategies.length];

  const accountContext = [
    ctx.vertical ? `Vertical: ${ctx.vertical}` : '',
    ctx.parentBrand && ctx.parentBrand !== ctx.accountName ? `Parent brand: ${ctx.parentBrand}` : '',
    ctx.primoAngle ? `What makes this account specific: ${ctx.primoAngle}` : '',
  ].filter(Boolean).join('\n');

  const stepInstructions: Record<string, string> = {
    initial_email: `STEP 1 of 4. First touch. Cold. They have never heard from you.

MANDATORY OPENING STRATEGY for this email: Use the "${primaryStrategy}" approach from the variation taxonomy. Do NOT use any other approach. Make the opening feel specific to ${ctx.accountName}'s operational reality using the account context below.

Write about their specific operational world, not generic supply chain. If they are food manufacturing, write about plant throughput and production surges. If they are retail, write about DC velocity and replenishment windows. If they are industrial, write about trailer scheduling complexity. Make the reader think you have walked their yard.

The yard thesis should emerge from THEIR reality, not from a canned framing. Do not start with "The yard is where." Find a different path into the same truth.

Mention the product (YardFlow / Yard Network System) only once, briefly, in the second half. Do not explain what it is in pitch language. Let proof carry the weight.

MODEX 2026 is April 13-16 in Atlanta. YardFlow will have live users from the network on-site. Suggest meeting windows: Tuesday April 14 at 10am, 1pm, or 3pm. Offer flexibility. No calendar link. Get them to reply.

Max 100 words. Subject under 6 words, lowercase, no company name. End with a direct question.`,

    follow_up_1: `STEP 2 of 4. Sent 3 days after Step 1.

MANDATORY OPENING STRATEGY for this email: Use the "${secondaryStrategy}" approach. Completely different angle from Step 1.

Do NOT reference the first email. Come in from a new direction. Add one proof point they have not seen: a specific stat (48 to 24 min drop and hook), a module name (flowSPOTTER, flowTWIN), or the customer quote about headcount neutrality. Pick whichever feels most relevant to ${ctx.accountName}'s vertical.

Make the yard problem feel more expensive than before. Tighter. Harder.

MODEX is close. Live users on-site April 13-16. Suggest Tuesday April 14. No calendar link.

Max 70 words. Subject under 6 words, lowercase.`,

    follow_up_2: `STEP 3 of 4. Sent 6 days after Step 2.

Switch angle entirely. Pick ONE specific symptom that would be vivid for ${ctx.accountName}'s operations and make it the centerpiece. Not a list of symptoms. One concrete image of what their yard costs them.

Create urgency through consequence, not fake scarcity. Make inaction feel compounding.

MODEX schedule is filling. Suggest one slot on Tuesday April 14.

Max 70 words. Subject under 6 words, lowercase.`,

    breakup: `STEP 4 of 4. Breakup.

Short. Clean. No guilt, no pressure. Plant one seed about the yard constraint. Leave the door open for a walk-up at MODEX if timing does not work now.

Max 40 words. Subject under 6 words, lowercase.`,
  };

  return `You are writing outreach as Casey Larkin for YardFlow by FreightRoll.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
Priority: ${ctx.bandLabel ?? 'Tier 1'}
${accountContext}
${ctx.notes ? `Account context: ${ctx.notes}` : ''}

${stepInstructions[step]}

CRITICAL OUTPUT RULES:
- No sign-off (no Best, Sincerely, Regards, [Your Name], Casey, Casey Larkin)
- No greeting (no Hi, Hey, Hello, Dear)
- No em dashes (use periods or commas instead)
- No exclamation marks
- Do not open with "I"
- Do not open with "The yard is where"
- Do not mention YardFlow in the first sentence
- End with a question or a single declarative ask, then stop

Output format:
SUBJECT: <subject line>
---
<email body>`;
}
