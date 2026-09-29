/**
 * POST /api/gap/sources/members/:memberId
 *   `{ status: 'active' | 'ignored' | 'not_now' | 'research_requested' }`   IGNORE, NOT NOW, RESEARCH MORE
 *   `{ resolve: 'existing', personaId }`            THIS IS EXISTING PERSON (no merge, no new Persona)
 *   `{ resolve: 'new_at_account', accountName }`    NEW PERSON AT THIS ACCOUNT (a staged candidate)
 *   `{ resolve: 'wrong_company' | 'leave' }`        WRONG COMPANY, LEAVE UNRESOLVED
 * Casey's decision on one member. Audited; nothing else moves, nothing is sent.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { MEMBER_STATUSES, setMemberStatus } from '@/lib/gap/intake/service';
import { resolvePersonMember } from '@/lib/gap/entity/people';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';

const Body = z.union([
  z.object({ status: z.enum(MEMBER_STATUSES) }).strict(),
  z.object({ resolve: z.literal('existing'), personaId: z.number().int().positive() }).strict(),
  z.object({ resolve: z.literal('new_at_account'), accountName: z.string().trim().min(1).max(300) }).strict(),
  z.object({ resolve: z.enum(['wrong_company', 'leave']) }).strict(),
]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const { memberId } = await params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const b = parsed.data;
  if ('resolve' in b) {
    const r = await resolvePersonMember(prisma, { memberId, choice: b.resolve, personaId: 'personaId' in b ? b.personaId : undefined, accountName: 'accountName' in b ? b.accountName : undefined, actor: g.email, now: new Date() });
    if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'member_not_found' ? 404 : r.reason.endsWith('_not_found') ? 404 : 400 });
    return NextResponse.json(r);
  }
  const r = await setMemberStatus(prisma, { memberId, status: b.status, actor: g.email });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'member_not_found' ? 404 : 400 });
  return NextResponse.json({ ok: true });
}
