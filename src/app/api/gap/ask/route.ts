/**
 * POST /api/gap/ask   `{ accountName, question }`   (UX-13 Ask GAP)
 *
 * Read-only: a bounded prompt over the derived account context (lib/gap/ask/context.ts) through the existing AI
 * provider abstraction (lib/ai/client.ts: the AI gateway, then Gemini, then OpenAI, then the control plane, as
 * configured). A request to act is answered by naming the control, without a model call. Nothing is written, sent,
 * enrolled or looked up. Session only; 404 unknown account; 400 a bad body; 503 when no provider answered.
 *
 * R35: a request to PREPARE something ("help me approach this person", "draft an angle from the job posting",
 * "research their footprint deeper") answers with a typed `proposal` built from the page's own controls
 * (lib/gap/ask/proposal.ts): the exact payload for an existing route (the opening story's draft, the research
 * plan's deepen) or a link to the control. No model call; the seller's press runs that route's own gates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { gapGenerate } from '@/lib/gap/ai/spend';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { buildAskContext } from '@/lib/gap/ask/context';
import { actionRequest, ASK_QUESTION_MAX, askPrompt, guardBuyerSaid, recallAskContext, rememberAskContext, tidyAnswer } from '@/lib/gap/ask/grounding';
import { proposalFor, proposalIntent } from '@/lib/gap/ask/proposal';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const Body = z.object({ accountName: z.string().trim().min(1).max(200), question: z.string().trim().min(2).max(ASK_QUESTION_MAX) }).strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const { accountName, question } = parsed.data;
  // R35: a request to prepare is read first (it needs the page's controls); a request to act names its control.
  const intent = proposalIntent(question);
  const control = intent ? null : actionRequest(question);
  if (control) return NextResponse.json({ answer: control, grounded: false, provider: null, acted: false });
  // The page remembered its context when it rendered (the common case); else the full read, remembered for next time.
  const now = new Date();
  let ctx = recallAskContext(accountName, now);
  if (!ctx) {
    ctx = await buildAskContext(prisma, accountName, now).catch(() => null);
    if (ctx) rememberAskContext(ctx, now);
  }
  if (!ctx) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (intent && ctx.controls) {
    const r = proposalFor(intent, ctx.accountName, ctx.controls);
    return NextResponse.json({ answer: r.answer, grounded: false, provider: null, acted: false, proposal: r.proposal });
  }
  try {
    // A04: metered and budgeted like every GAP call (the ledger, the ceiling, no control-plane fallback).
    const r = await gapGenerate(prisma, { prompt: askPrompt(ctx, question), maxTokens: 600, tier: 'routine', task: { id: `ask_${now.getTime().toString(36)}`, kind: 'ask', itemKey: `account:${ctx.accountName}` }, now });
    return NextResponse.json({ answer: guardBuyerSaid(tidyAnswer(r.text), ctx), grounded: true, provider: r.provider, acted: false });
  } catch (e) {
    return NextResponse.json({ error: 'no_provider', detail: e instanceof Error ? e.message.slice(0, 200) : 'no provider answered' }, { status: 503 });
  }
}
