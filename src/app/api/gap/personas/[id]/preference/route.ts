/**
 * POST /api/gap/personas/[id]/preference   `{ kind: 'not_a_fit' | 'not_now' | 'clear', reason?, until? }`   (UX-07, contract 5.6)
 *
 * The seller's own priority at ONE account: set a person aside (not a fit), park them until a date (not now), or
 * undo (clear). Append-only `person.seller_preference` audit row; stricter never looser (it never clears a safety
 * set-aside and never writes do_not_contact); the stack reads it, no send path does. Session only.
 * 201 recorded; 404 unknown person; 400 a bad body or date.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { PREFERENCE_REASON_MAX, setSellerPreference } from '@/lib/gap/people/seller-preference';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const Body = z
  .object({
    kind: z.enum(['not_a_fit', 'not_now', 'clear']),
    reason: z.string().trim().max(PREFERENCE_REASON_MAX).nullable().optional(),
    until: z.string().trim().max(40).nullable().optional(),
  })
  .strict();

export async function POST(request: NextRequest, { params }: RouteContext) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const raw = (await params).id;
  if (!/^\d+$/.test(raw)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const r = await setSellerPreference(prisma, { personaId: Number(raw), actor: g.email, ...parsed.data });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'persona_not_found' ? 404 : 400 });
  return NextResponse.json(r, { status: 201 });
}
