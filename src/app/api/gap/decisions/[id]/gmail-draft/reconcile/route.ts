/**
 * POST /api/gap/decisions/[id]/gmail-draft/reconcile   body `{ gmailDraftId }`
 *
 * "Check if sent": reads Gmail (drafts.get, threads.get) and records whether a
 * GAP-created draft was sent (a NEW message id), discarded, or is still a
 * draft. Read-only toward Gmail; append-only toward the ledger; never writes a
 * human action. Session only, same gates as creating the draft.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { reconcileDraft } from '@/lib/gap/execution/draft-reconcile';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({ gmailDraftId: z.string().min(1) }).strict();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body', field: 'body' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: 'gmailDraftId' }, { status: 400 });
  const { id } = await context.params;
  const result = await reconcileDraft(prisma, { decisionId: id.trim(), gmailDraftId: parsed.data.gmailDraftId, actor: email, now: new Date() });
  if (!result.ok) return NextResponse.json({ error: result.reason, detail: result.detail }, { status: result.reason === 'draft_not_found' ? 404 : 503 });
  return NextResponse.json(result);
}
