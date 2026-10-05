/**
 * GET  /api/gap/personas/[id]/suppression-review   WHY this person is blocked and WHAT WOULD HAVE TO BE TRUE to
 *                                                   clear it: every source with its verdict, read live (read-only)
 * POST /api/gap/personas/[id]/suppression-review   `{ confirmed: true, expectedEmail }`: Casey's explicit, confirmed
 *                                                   CLEAR LEGACY LOCAL FLAG. Re-reads every authority live, refuses
 *                                                   unless the only block is the stale local Modex flag, writes the
 *                                                   one raw update and one audit row. Never an unsubscribe, a HubSpot
 *                                                   opt-out, a hard bounce or clawd (WHO truth, 2026-10-05).
 * Session only; the actor is the session email. 200 the review / the clear; 404 unknown person; 409 with the
 * refusal (reason, detail, review) when the clear is refused; 400 a bad body.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { clearLegacyLocalFlag, loadSuppressionReview } from '@/lib/gap/suppression/legacy-review';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

const Body = z
  .object({
    confirmed: z.boolean(),
    expectedEmail: z.string().trim().min(3).max(320),
  })
  .strict();

function personaId(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const id = personaId((await params).id);
  if (id === null) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const review = await loadSuppressionReview(prisma, id, { now: new Date() });
  if (!review) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(review);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const id = personaId((await params).id);
  if (id === null) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  // `confirmed` is typed `true` on the service so a caller cannot forget it; a false here is handed through so the
  // service refuses it on the record (not_confirmed, audited) instead of this route answering silently.
  const r = await clearLegacyLocalFlag(prisma, { personaId: id, actor: g.email, now: new Date(), confirmed: parsed.data.confirmed as true, expectedEmail: parsed.data.expectedEmail });
  if (!r.ok) return NextResponse.json(r, { status: r.reason === 'persona_not_found' ? 404 : 409 });
  return NextResponse.json(r, { status: 200 });
}
