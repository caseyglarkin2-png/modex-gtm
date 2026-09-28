/**
 * POST /api/gap/signal-intake   `{ url?, account?, note?, kind? }`   (GAP Signal Intelligence)
 * GET  /api/gap/signal-intake   the Signal Inbox (one row per event)
 *
 * SHARE TO GAP: a link (or, for kind "conference", a note with no link) that
 * may matter. Only the URL is needed; GAP fetches the page title and date,
 * resolves the account conservatively, and follows it up. Casey's note is
 * stored verbatim as HIS context, never evidence. Nothing here writes a
 * trigger, evidence, HubSpot or Slack. Session only (no token path).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { HINT_MAX, NOTE_MAX, captureSignal } from '@/lib/gap/signals/intake';
import { listSignals, loadSignal } from '@/lib/gap/signals/ops';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    url: z.string().max(2_000).nullable().optional(),
    account: z.string().max(HINT_MAX).nullable().optional(),
    note: z.string().max(NOTE_MAX).nullable().optional(),
    kind: z.enum(['link', 'conference']).optional(),
  })
  .strict();

async function sessionEmail(): Promise<string | null> {
  const email = (await auth())?.user?.email;
  return typeof email === 'string' && email.includes('@') ? email : null;
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const { url, account, note, kind } = parsed.data;
  const conference = kind === 'conference' || (!url?.trim() && !!note?.trim());
  const r = await captureSignal(prisma, { url: conference ? null : url, note, accountHint: account, origin: conference ? 'conference_note' : 'casey_share', actor: email, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json({ created: r.signal.created, signal: await loadSignal(prisma, r.signal.id) }, { status: r.signal.created ? 201 : 200 });
}

export async function GET(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 60, 1), 200);
  return NextResponse.json({ items: await listSignals(prisma, { limit }) });
}
