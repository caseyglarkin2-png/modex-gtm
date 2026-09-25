/**
 * POST /api/gap/decisions/[id]/gmail-draft   create ONE Gmail draft for this card (`{ checkOnly: true }` compiles and gates the copy only)
 * GET  /api/gap/decisions/[id]/gmail-draft   the drafts GAP made for this card, with their fates
 *
 * Seller Action Center, final pass (2026-09-25). The POST is Casey's click:
 * session only (no agent token, no cron secret, no query secret), behind
 * GAP_ROUTING_ENABLED (the card) and GAP_MESSAGE_COMPILER_ENABLED (the copy
 * must be compiler-cleared). It creates a DRAFT and nothing else; every
 * guard lives in src/lib/gap/execution/seller-draft.ts. It never sends and
 * never records a human action.
 *
 * Status: 201 drafted, 200 already drafted (same copy, still a draft),
 * 409 refused with `{ error: <reason>, ... }` (copy review, blocked card,
 * suppression refusal), 404 unknown decision or flag off, 401 no session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { listDraftRecords } from '@/lib/gap/execution/draft-ledger';

export const dynamic = 'force-dynamic';

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

function gate(): NextResponse | null {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED');
  return skip ? NextResponse.json(skip, { status: 404 }) : null;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const off = gate();
  if (off) return off;
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ error: 'decision_not_found' }, { status: 404 });

  // Optional body `{ checkOnly: true }`: compile and gate the copy, draft nothing.
  let checkOnly = false;
  try {
    const raw = (await request.json()) as unknown;
    checkOnly = typeof raw === 'object' && raw !== null && (raw as { checkOnly?: unknown }).checkOnly === true;
  } catch {
    checkOnly = false;
  }

  const result = await createSellerGmailDraft(prisma, { decisionId: id.trim(), actor: email, now: new Date(), checkOnly });
  if (!result.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ok: _ok, reason, ...rest } = result;
    return NextResponse.json({ error: reason, ...rest }, { status: reason === 'decision_not_found' ? 404 : 409 });
  }
  if ('checked' in result) return NextResponse.json(result, { status: 200 });
  return NextResponse.json(result, { status: result.alreadyDrafted ? 200 : 201 });
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const off = gate();
  if (off) return off;
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  return NextResponse.json({ drafts: await listDraftRecords(prisma, id.trim()) });
}
