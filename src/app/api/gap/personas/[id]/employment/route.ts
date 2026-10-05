/**
 * GET  /api/gap/personas/[id]/employment   this person's contact currentness at their account (read-only)
 * POST /api/gap/personas/[id]/employment   `{ status: 'left' | 'role_changed' | 'current', newCompany?, newTitle?, sourceUrl?, note? }`
 *                                           Casey says THIS PERSON LEFT / the role is wrong / they are current:
 *                                           a human-confirmed correction, audited, immediate; never do-not-contact,
 *                                           never the email, never HubSpot (owner resolution, 2026-10-05)
 * Session only. 201 recorded; 404 unknown person; 400 a bad body or URL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { loadPersonaEmployment, recordEmploymentCorrection } from '@/lib/gap/people/employment-store';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const Body = z
  .object({
    status: z.enum(['left', 'role_changed', 'current']),
    newCompany: z.string().trim().max(200).nullable().optional(),
    newTitle: z.string().trim().max(200).nullable().optional(),
    sourceUrl: z.string().trim().max(500).nullable().optional(),
    note: z.string().trim().max(1000).nullable().optional(),
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
  const r = await loadPersonaEmployment(prisma, id, { now: new Date() });
  if (!r) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(r);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const id = personaId((await params).id);
  if (id === null) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const r = await recordEmploymentCorrection(prisma, { personaId: id, actor: g.email, now: new Date(), ...parsed.data });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'persona_not_found' ? 404 : 400 });
  return NextResponse.json(r, { status: 201 });
}
