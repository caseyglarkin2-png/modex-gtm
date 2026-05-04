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
  micrositeUrl?: string;
  campaignName?: string;
  campaignType?: string;
  campaignAngle?: string;
  campaignKeyDates?: string;
  facilityCountLabel?: string;
  facilityScope?: string;
  researchTags?: string[];
  playbookHints?: string;
  agentContextSummary?: string;
  agentNextActions?: string[];
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
  agentContextSummary?: string;
  agentNextActions?: string[];
}

function buildCampaignContextBlock(ctx: PromptContext): string {
  const lines = [
    ctx.campaignName ? `Active campaign: ${ctx.campaignName}` : '',
    ctx.campaignType ? `Campaign type: ${ctx.campaignType.replace(/_/g, ' ')}` : '',
    ctx.campaignAngle ? `Campaign angle: ${ctx.campaignAngle}` : '',
    ctx.campaignKeyDates ? `Campaign timing/context: ${ctx.campaignKeyDates}` : '',
  ].filter(Boolean);

  if (ctx.campaignType === 'trade_show') {
    lines.push('This is a trade show follow-up. Event context can be used lightly if it helps, but it should not dominate the note.');
  } else if (ctx.campaignType) {
    lines.push('Do not mention MODEX or trade shows unless the campaign context above explicitly calls for it.');
  }

  return lines.join('\n');
}

function buildCampaignAskGuidance(ctx: PromptContext): string {
  if (ctx.campaignType === 'trade_show') {
    return 'MODEX 2026 is April 13-16 in Atlanta. If you mention the event, keep it secondary and natural.';
  }
  return 'This is not a trade show motion. Ask for a reaction or a short call, not a booth meet-up.';
}

function buildPlaybookHintsBlock(ctx: PromptContext): string {
  if (!ctx.playbookHints?.trim()) return '';
  return `Winning playbook blocks (use when relevant, avoid copy-paste):
${ctx.playbookHints}`;
}

function buildAgentContextBlock(ctx: Pick<PromptContext, 'agentContextSummary' | 'agentNextActions'>): string {
  if (!ctx.agentContextSummary?.trim() && (!ctx.agentNextActions || ctx.agentNextActions.length === 0)) return '';
  const lines = [
    ctx.agentContextSummary?.trim() ? `Live operator intelligence: ${ctx.agentContextSummary.trim()}` : '',
    ctx.agentNextActions?.length ? `Recommended next actions: ${ctx.agentNextActions.join(' | ')}` : '',
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildEmailPrompt(ctx: PromptContext): string {
  return `Write a first-touch cold outreach email that reads like a typed Gmail note from a thoughtful operator. Careful. Specific. Humble. No consultant voice.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
Priority: ${ctx.bandLabel ?? 'Tier 1'}
${ctx.vertical ? `Vertical: ${ctx.vertical}` : ''}
${ctx.primoAngle ? `What makes this account specific: ${ctx.primoAngle}` : ''}
${ctx.facilityCountLabel ? `Facility footprint: ${ctx.facilityCountLabel}${ctx.facilityScope ? ` (${ctx.facilityScope})` : ''}` : ''}
${ctx.researchTags && ctx.researchTags.length ? `Research tags: ${ctx.researchTags.join(' • ')}` : ''}
${ctx.notes ? `Context: ${ctx.notes}` : ''}
${buildCampaignContextBlock(ctx)}
${buildPlaybookHintsBlock(ctx)}
${buildAgentContextBlock(ctx)}
${ctx.micrositeUrl ? `Microsite link available: ${ctx.micrositeUrl}` : 'No microsite link available. Do not invent one.'}

Primary goal: get a reply or a light reaction. Not a meeting ask on touch one.
Secondary goal: if it fits naturally, make the microsite feel like a useful artifact, not a pitch deck.

STRUCTURE (3 short paragraphs, 70-110 words total):
1. OPENER (1-2 sentences): Start with a careful observation or hypothesis about THIS account. Use language like "I may be off" or "from the outside" when useful. Sound curious, not certain.
2. BRIDGE (2-4 sentences): Tie that observation to the yard and dock handoff. Use one proof point only. If a microsite link exists, include one standalone line introducing it plainly: "I put together a short page for [account] here:" then the URL on the next line.
3. CTA (1 sentence): Ask for a reaction, not a meeting. Examples: "Worth sending the 90-second version?" "Curious if this is even directionally relevant." "If this sits with someone else, who would you point me to?"

${buildCampaignAskGuidance(ctx)}

CRITICAL RULES:
- Short declarative sentences. No semicolons.
- No hard calendar ask in the first touch.
- No "synergies", "unlock", "transform", or similar startup language.
- No theatrical metaphors like "black hole", "visibility goes to die", or "commercially dangerous" in first-touch email.
- Do not sound like you have diagnosed their operation from a distance.
- One proof point max. Never stack stats.
- NEVER say "ship 50% more" or any volume multiplier. The 48→24 stat is truck turn time.
- If you include the microsite, do it once and keep the surrounding language understated.
- Favor language like "I may be off," "from the outside," and "curious if this is relevant" over certainty.
- If you mention Primo, keep it to one clause and tie it to headcount-neutral throughput, not hype.
- Avoid sounding urgent for urgency's sake. The note should feel useful and observational.

Output: Only the email body. No subject line. No sign-off.`;
}

export function buildFollowUpEmailPrompt(ctx: PromptContext): string {
  return `Write a follow-up email for a first touch that got no reply. New angle. Same humility. No pressure.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? ` (${ctx.personaTitle})` : ''}
Previous: ${ctx.previousMeeting ?? 'cold email sent about yard network standardization'}
${ctx.vertical ? `Vertical: ${ctx.vertical}` : ''}
${ctx.primoAngle ? `What makes this account specific: ${ctx.primoAngle}` : ''}
${ctx.facilityCountLabel ? `Facility footprint: ${ctx.facilityCountLabel}${ctx.facilityScope ? ` (${ctx.facilityScope})` : ''}` : ''}
${ctx.researchTags && ctx.researchTags.length ? `Research tags: ${ctx.researchTags.join(' • ')}` : ''}
${ctx.notes ? `Context: ${ctx.notes}` : ''}
${buildCampaignContextBlock(ctx)}
${buildPlaybookHintsBlock(ctx)}
${buildAgentContextBlock(ctx)}
${ctx.micrositeUrl ? `Microsite link available: ${ctx.micrositeUrl}` : 'No microsite link available. Do not invent one.'}

STRUCTURE (2-3 short paragraphs, 50-90 words total):
1. NEW ANGLE (2-3 sentences): Come in from a different operational angle than the first note. Use one fresh symptom or one proof point. Keep the tone helpful, not aggressive.
2. OPTIONAL ARTIFACT (1-2 sentences): If a microsite link exists and helps, introduce it simply as something you put together for them.
3. ASK (1 sentence): Soft reaction CTA. No meeting ask unless they have already engaged.

Do NOT say "following up" or "circling back". This should feel like a separate note.

${buildCampaignAskGuidance(ctx)}

If the recipient previously engaged, it is acceptable to ask whether they want the short scorecard version or a quick reaction to the microsite. Do not jump straight to calendar times.

Avoid loaded metaphors or dramatic language. This should sound like a considerate operator making one more relevant point, not pressing for attention.

Output: Only the email body. No subject line. No sign-off.`;
}

export function buildDMPrompt(ctx: PromptContext): string {
  return `Write a LinkedIn direct message.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? `, ${ctx.personaTitle}` : ''}
${ctx.notes ? `Context: ${ctx.notes}` : ''}
${buildCampaignContextBlock(ctx)}
${buildPlaybookHintsBlock(ctx)}
${buildAgentContextBlock(ctx)}

LinkedIn DMs must be 40-60 words max. One thought. One ask. No small talk.
${buildCampaignAskGuidance(ctx)} Lead with the yard as the constraint. End with a question.

Output: Only the message text. No greeting label, no signature.`;
}

export function buildCallScriptPrompt(ctx: PromptContext): string {
  return `Write a cold call script.

${getYardFlowPromptContext()}

${getVoiceGuardrails()}

Target: ${ctx.personaName ?? 'decision maker'} at ${ctx.accountName}${ctx.personaTitle ? `, ${ctx.personaTitle}` : ''}
${ctx.notes ? `Context: ${ctx.notes}` : ''}
${buildCampaignContextBlock(ctx)}
${buildPlaybookHintsBlock(ctx)}
${buildAgentContextBlock(ctx)}

${ctx.campaignType === 'trade_show' ? 'Trade show context: live users will be on-site. Suggest a specific event window only if that helps.' : 'This is not a trade show call. Keep the ask focused on a short working session.'}

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
Meeting: ${ctx.campaignType === 'trade_show' ? 'In-person at MODEX 2026 (Atlanta, April 13-16) or a short follow-up call' : 'Short discovery call or network audit review'}
${ctx.notes ? `Context: ${ctx.notes}` : ''}
${buildCampaignContextBlock(ctx)}
${buildPlaybookHintsBlock(ctx)}
${buildAgentContextBlock(ctx)}

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
  const verticalUnknown = !ctx.vertical || ctx.vertical.toLowerCase() === 'unknown';
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
${ctx.agentContextSummary ? `- Live operator intelligence: ${ctx.agentContextSummary}` : ''}
${ctx.agentNextActions?.length ? `- Recommended next actions: ${ctx.agentNextActions.join(' | ')}` : ''}

INSTRUCTIONS:
The output is a JSON that populates a branded infographic one-pager. The visual layout has:
1. A header: "FOR [ACCOUNT NAME]" above "YardFlow by FreightRoll"
2. A bold headline about the throughput constraint this account faces
3. A subheadline connecting their business to YardFlow (2-3 sentences)
4. A 3-column comparison: Typical Reality (red) → Standardized Operating Protocol (blue, 4-step flow) → YardFlow Effect (green)
5. A "Proof from Live Deployment" stats bar
6. A customer quote (use the verified quote, marked illustrative only if modified)
7. Best fit + Public source context

The one-pager must sell to both operations and executive stakeholders:
- Operations buyer: emphasize queue variance reduction, gate/dock consistency, and labor neutrality.
- Executive buyer: emphasize margin protection, SLA confidence, and board-ready proof.
- Language should be direct, concrete, and financially legible.

CRITICAL: Pain points and outcomes MUST be customized to this specific account's vertical and operations.
- Pain points should reference their industry (e.g., "yogurt production surges" for Dannon, "seasonal volume spikes" for retail)
- Outcomes should connect YardFlow to their specific throughput needs
- Solution steps should be tailored descriptions of how each step helps THIS account
- Headline must feel board-room strong, not generic (constraint + consequence + urgency).
- Subheadline must include one explicit business consequence (margin, service reliability, or growth capacity).
- Outcomes must avoid fluff. Each should imply a measurable operational or commercial effect.
${verticalUnknown ? "- Vertical is currently unknown. Use neutral, non-speculative operational language and avoid niche industry assumptions. Include a gentle note in bestFit that operator validation of vertical-specific assumptions is required." : ''}

Generate ONLY valid JSON matching this schema — no markdown, no commentary:

{
  "headline": "string — 6-10 word board-level headline about the throughput constraint and business consequence (e.g., 'WHEN DEMAND SPIKES, MARGIN LEAKS IN THE YARD')",
  "subheadline": "string — 2-3 sentences connecting their specific business reality to YardFlow's standardized protocol and one explicit business consequence",
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
    "string — YardFlow effect customized to this account with commercial impact",
    "string — second outcome with measurable operational implication",
    "string — third outcome with executive reporting implication",
    "string — fourth outcome with service or growth implication"
  ],
  "proofStats": [
    {"value": "24", "label": "Facilities Live"},
    {"value": ">200", "label": "Contracted Network"},
    {"value": "NEUTRAL", "label": "Headcount Impact"},
    {"value": "48→24", "label": "Avg. Drop & Hook (min)"},
    {"value": "$1M+", "label": "Per-site Profit Lift"}
  ],
  "customerQuote": "string — use the verified quote: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.' OR create an illustrative variation relevant to this vertical (prefix with '(Illustrative)')",
  "bestFit": "string — 1-2 sentences about why this account is an ideal fit referencing specific operations and commercial stakes",
  "publicContext": "string — optional; include only verifiable public sources/signals (earnings call comments, press releases, facility changes, hiring trends). Never use speculative event-attendance assumptions."
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
    buildCampaignContextBlock(ctx),
    buildAgentContextBlock(ctx),
  ].filter(Boolean).join('\n');

  const eventAsk = ctx.campaignType === 'trade_show'
    ? 'MODEX 2026 is April 13-16 in Atlanta. YardFlow will have live users from the network on-site. Suggest meeting windows like Tuesday April 14 at 10am, 1pm, or 3pm.'
    : 'This is not a trade show sequence. Ask for a quick reaction or a short call. Do not mention booth times or event meet-ups.';

  const followUpAsk = ctx.campaignType === 'trade_show'
    ? 'The event is close. If useful, suggest one specific window.'
    : 'Keep the CTA soft. Ask if they want the short scorecard version or a quick reaction.';

  const stepInstructions: Record<string, string> = {
    initial_email: `STEP 1 of 4. First touch. Cold. They have never heard from you.

MANDATORY OPENING STRATEGY for this email: Use the "${primaryStrategy}" approach from the variation taxonomy. Do NOT use any other approach. Make the opening feel specific to ${ctx.accountName}'s operational reality using the account context below.

Write like someone who has personally stood in their yard and seen the problem. If they are food manufacturing, write about trailer staging during production surges and the detention that compounds. If they are retail, write about DC velocity and the gap between the WMS and the physical yard. If they are industrial, write about scheduling complexity at scale. Use their language, not supply chain consultant language.

The yard thesis should emerge from THEIR reality, not from a canned framing.

STRUCTURE (3 short paragraphs, max 90 words total):
1. OPENER: 1-2 concrete sentences about THIS company's yard reality. Specific, observed, not researched-sounding.
2. BRIDGE: 2-3 sentences connecting to the constraint + one proof point woven naturally.
3. ASK: 1 sentence. Direct question. Specific MODEX times.

Every sentence under 20 words. No abstract nouns. No compound sentences with semicolons.

Mention YardFlow only once, in paragraph 2, briefly. Let proof carry the weight.

${eventAsk} Offer flexibility. No calendar link. Get them to reply.

Subject: under 6 words, lowercase, no company name, no "re:" tricks. Make it sound like an internal memo subject, not a sales email.`,

    follow_up_1: `STEP 2 of 4. Sent 3 days after Step 1.

MANDATORY OPENING STRATEGY for this email: Use the "${secondaryStrategy}" approach. Completely different angle from Step 1.

Do NOT reference the first email. Come in from a new direction. Add one proof point they have not seen: drop & hook time cut from 48 to 24 minutes (truck turn speed, NOT volume), a module name (flowSPOTTER, flowTWIN), or the customer quote about capturing additional volume headcount neutral. Pick whichever feels most relevant to ${ctx.accountName}'s vertical.

Make the yard problem feel more expensive than before. Tighter. Harder.

${followUpAsk} No calendar link.

Max 70 words. Subject under 6 words, lowercase.`,

    follow_up_2: `STEP 3 of 4. Sent 6 days after Step 2.

Switch angle entirely. Pick ONE specific symptom that would be vivid for ${ctx.accountName}'s operations and make it the centerpiece. Not a list of symptoms. One concrete image of what their yard costs them.

Create urgency through consequence, not fake scarcity. Make inaction feel compounding.

${followUpAsk}

Max 70 words. Subject under 6 words, lowercase.`,

    breakup: `STEP 4 of 4. Breakup.

Short. Clean. No guilt, no pressure. Plant one seed about the yard constraint. ${ctx.campaignType === 'trade_show' ? 'Leave the door open for an event walk-up if timing does not work now.' : 'Leave the door open for a later reply if timing is off right now.'}

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
