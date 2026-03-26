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
