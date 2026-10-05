/**
 * POST /api/gap/people/find-operator   `{ accountName }`   FIND OPERATOR (owner resolution, 2026-10-05)
 *
 * Runs the existing grounded, source-backed contact research for the account and stages new direct-operator finds as
 * AccountContactCandidates for Casey's review. Never a Persona, never a HubSpot write, never an email guess, never an
 * Apollo credit. Session only. 200 with what was found and staged.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { findOperator } from '@/lib/gap/people/find-operator';
import { loadOwnerResolution } from '@/lib/gap/people/owner-resolution-load';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({ accountName: z.string().trim().min(1).max(200) }).strict();

/** "Stan Staged (staged candidate)" is Stan Staged. */
const bareName = (n: string) => n.replace(/\s*\([^)]*\)\s*$/, '');

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const now = new Date();
  // Everyone already on record (GAP, HubSpot, staged, relationships), so research never re-stages a known person.
  const res = await loadOwnerResolution(prisma, { accountName: parsed.data.accountName, purpose: 'COLD_FIRST_TOUCH', now });
  if (!res.ok) return NextResponse.json({ error: res.reason }, { status: 404 });
  const slots = [res.resolution.sponsor, res.resolution.tech, res.resolution.site].filter((x): x is NonNullable<typeof x> => !!x);
  const known = [
    ...res.resolution.eligible.map((c) => c.name),
    ...res.resolution.excluded.map((e) => e.candidate.name),
    ...slots.map((c) => c.name),
    ...res.people.map((p) => p.name),
    ...res.resolution.others.flatMap((o) => o.names.map(bareName)),
  ];
  const r = await findOperator(prisma, { accountName: parsed.data.accountName, known, actor: g.email, now });
  return NextResponse.json(r);
}
