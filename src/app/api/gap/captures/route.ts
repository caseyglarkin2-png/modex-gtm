/**
 * POST /api/gap/captures   `{ accountName?, accountHint?, personaId?, context, rawText }`   (Phase 2 D1)
 * GET  /api/gap/captures   recent notes (unlinked first)
 *
 * Save a raw buyer note from a phone or desktop; GAP proposes candidate BIDs
 * (verbatim sentences) that stay candidates until Casey confirms each one.
 * Nothing here creates buyer truth. Session only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { CAPTURE_CONTEXTS, CAPTURE_SOURCE_KINDS, RAW_TEXT_MAX, createCapture, listRecentCaptures } from '@/lib/gap/capture/store';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    accountName: z.string().max(200).nullable().optional(),
    accountHint: z.string().max(200).nullable().optional(),
    personaId: z.number().int().positive().nullable().optional(),
    // R44: the deal and the action that opened Capture (a Work card, a reply, an obligation, the account page).
    dealId: z.string().trim().max(200).nullable().optional(),
    // R50: the deal's name for the note's label (the id is what binds the note's words and obligations to the deal).
    dealName: z.string().trim().max(200).nullable().optional(),
    source: z.object({ kind: z.enum(CAPTURE_SOURCE_KINDS), id: z.string().trim().min(1).max(200) }).strict().nullable().optional(),
    context: z.enum(CAPTURE_CONTEXTS),
    rawText: z.string().max(RAW_TEXT_MAX),
  })
  .strict();

async function sessionEmail(): Promise<string | null> {
  const email = (await auth())?.user?.email;
  return typeof email === 'string' && email.includes('@') ? email : null;
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await createCapture(prisma, { ...parsed.data, actor: email, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'account_not_found' ? 404 : 422 });
  // R60: a reply's capture already exists: that one note is the answer (200), never a second capture.
  return r.existing ? NextResponse.json({ ...r.capture, existing: true }, { status: 200 }) : NextResponse.json(r.capture, { status: 201 });
}

export async function GET() {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  if (!(await sessionEmail())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  return NextResponse.json({ items: await listRecentCaptures(prisma, 10) });
}
