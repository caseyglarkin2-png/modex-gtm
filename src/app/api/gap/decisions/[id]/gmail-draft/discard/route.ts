/**
 * POST /api/gap/decisions/[id]/gmail-draft/discard   `{ gmailDraftId, recipient, reason, note? }`
 *
 * DISCARD ONE GAP-CREATED DRAFT (owner resolution, 2026-10-05). The server proves GAP created it and that the
 * decision, the ledger row, the recipient and the mailbox agree before that one draft id is deleted; a draft Gmail
 * no longer has is reconciled, never read as discarded. Session only, the same gates as creating the draft.
 * 200 discarded / reconciled / nothing to do; 409 refused with the reason; 404 no such GAP draft.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { DISCARD_REASONS, discardGapDraft } from '@/lib/gap/execution/draft-discard';

export const dynamic = 'force-dynamic';

const Body = z.object({ gmailDraftId: z.string().min(1), recipient: z.string().email(), reason: z.enum(DISCARD_REASONS), note: z.string().max(500).nullable().optional() }).strict();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const { id } = await context.params;
  const r = await discardGapDraft(prisma, { decisionId: id.trim(), ...parsed.data, actor: email, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason, detail: r.detail ?? null }, { status: r.reason === 'draft_not_found' || r.reason === 'decision_not_found' ? 404 : 409 });
  return NextResponse.json(r);
}
