/**
 * POST /api/gap/sources/members/:memberId   `{ status: 'active' | 'ignored' | 'not_now' | 'research_requested' }`
 * Casey's decision on one member (IGNORE, NOT NOW, RESEARCH MORE). Audited; nothing else moves.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { MEMBER_STATUSES, setMemberStatus } from '@/lib/gap/intake/service';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';

const Body = z.object({ status: z.enum(MEMBER_STATUSES) }).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const { memberId } = await params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const r = await setMemberStatus(prisma, { memberId, status: parsed.data.status, actor: g.email });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'member_not_found' ? 404 : 400 });
  return NextResponse.json({ ok: true });
}
