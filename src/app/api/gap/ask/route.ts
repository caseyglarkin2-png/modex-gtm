/**
 * POST /api/gap/ask   `{ accountName, question }`   (UX-13 Ask GAP)
 *
 * Read-only: a bounded prompt over the derived account context (lib/gap/ask/context.ts) through the existing AI
 * provider abstraction (lib/ai/client.ts: the AI gateway, then Gemini, then OpenAI, then the control plane, as
 * configured). A request to act is answered by naming the control, without a model call. Nothing is written, sent,
 * enrolled or looked up. Session only; 404 unknown account; 400 a bad body; 503 when no provider answered.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateTextWithMetadata } from '@/lib/ai/client';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { buildAskContext } from '@/lib/gap/ask/context';
import { actionRequest, ASK_QUESTION_MAX, askPrompt, tidyAnswer } from '@/lib/gap/ask/grounding';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const Body = z.object({ accountName: z.string().trim().min(1).max(200), question: z.string().trim().min(2).max(ASK_QUESTION_MAX) }).strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const { accountName, question } = parsed.data;
  const control = actionRequest(question);
  if (control) return NextResponse.json({ answer: control, grounded: false, provider: null, acted: false });
  const ctx = await buildAskContext(prisma, accountName, new Date()).catch(() => null);
  if (!ctx) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  try {
    const r = await generateTextWithMetadata(askPrompt(ctx, question), 600);
    return NextResponse.json({ answer: tidyAnswer(r.text), grounded: true, provider: r.provider, acted: false });
  } catch (e) {
    return NextResponse.json({ error: 'no_provider', detail: e instanceof Error ? e.message.slice(0, 200) : 'no provider answered' }, { status: 503 });
  }
}
