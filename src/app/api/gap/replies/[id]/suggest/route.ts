/**
 * POST /api/gap/replies/[id]/suggest   ask the model what one reply meant
 *
 * GAP Prospecting OS, Sprint 4, S4-T3. Behind BOTH GAP_OS_ENABLED and
 * GAP_REPLY_CLASSIFICATION_ENABLED: either off answers 404 with the typed
 * skip payload naming the flag. Auth: a session or a header token; `?secret=`
 * is never accepted. The work is `src/lib/gap/replies/suggest.ts` with the
 * production AI client (`generateText`) injected here, so the service stays
 * testable with a stub.
 *
 * Contract: `{ suggestion: { id, responseClass, bids: [{ type, quote, why }],
 * why } | null }`. `null` means the model's answer was unusable (audited);
 * the human dispositions by hand. 404 `{ error: 'not_found' }` for an
 * unknown inbound id; 409 `{ error: reason }` for `unknown_address`,
 * `no_hypothesis` and `already_dispositioned`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { generateText } from '@/lib/ai/client';
import { assertGapEnabled } from '@/lib/gap/flags';
import { suggestReply } from '@/lib/gap/replies/suggest';

export const dynamic = 'force-dynamic';

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

/** Header tokens only. The `?secret=` query form is deliberately not honoured. */
function isGapAgentRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('x-gap-token') === secret) return true;
    if (request.headers.get('authorization') === `Bearer ${secret}`) return true;
    if (request.headers.get('x-cron-secret') === secret) return true;
  }
  return isAuthorizedQueueAgent(request);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_REPLY_CLASSIFICATION_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  if (!email && !isGapAgentRequest(request)) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await context.params;
  const inboundId = decodeURIComponent(id ?? '').trim();
  if (inboundId.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const result = await suggestReply(prisma, generateText, inboundId);
  if (!result.ok) {
    if (result.reason === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (result.reason === 'classification_disabled') {
      return NextResponse.json({ skipped: true, reason: 'GAP_REPLY_CLASSIFICATION_ENABLED=false' }, { status: 404 });
    }
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }
  return NextResponse.json({ suggestion: result.suggestion, ...('rejected' in result ? { rejected: result.rejected } : {}) });
}
