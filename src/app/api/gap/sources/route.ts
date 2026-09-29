/**
 * GET  /api/gap/sources   every active work source with its real counts
 * POST /api/gap/sources   `{ name, sourceType, sourceRef?, intent?, relationshipContext?, notes? }`
 *
 * A WORK SOURCE is where people or accounts came from (a newsletter's
 * subscribers, a conference, a CRM list, referrals, a target list). Its
 * relationship context is Casey's context, never evidence or consent.
 * Session only. Writes gap_work_sources + audit; nothing else.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createWorkSource, INTENTS, SOURCE_TYPES } from '@/lib/gap/intake/service';
import { listSources } from '@/lib/gap/intake/views';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    name: z.string().min(1).max(200),
    sourceType: z.enum(SOURCE_TYPES),
    sourceRef: z.string().max(500).nullable().optional(),
    intent: z.enum(INTENTS).optional(),
    relationshipContext: z.string().max(200).nullable().optional(),
    notes: z.string().max(2_000).nullable().optional(),
  })
  .strict();

export async function GET() {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  return NextResponse.json({ items: await listSources(prisma) });
}

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const r = await createWorkSource(prisma, { ...parsed.data, actor: g.email });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json({ id: r.id }, { status: 201 });
}
