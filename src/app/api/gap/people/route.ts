/**
 * POST /api/gap/people   `{ name, company?, title?, email?, linkedinUrl?, note?, workSourceId? }`
 *
 * ADD A PERSON (conference mode, phone first): one person into the current
 * work source (or the one given; "People I met" when none is current). The
 * note is Casey's context; when it sounds like a buyer's own words the
 * response says so and the UI offers Buyer Truth Capture. Never a Persona,
 * never an email: identity is resolved conservatively, research comes later.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { addPerson } from '@/lib/gap/intake/service';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    name: z.string().min(1).max(200),
    company: z.string().max(200).nullable().optional(),
    title: z.string().max(200).nullable().optional(),
    email: z.string().max(320).nullable().optional(),
    linkedinUrl: z.string().max(500).nullable().optional(),
    note: z.string().max(1_000).nullable().optional(),
    workSourceId: z.string().max(64).nullable().optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const r = await addPerson(prisma, { ...parsed.data, actor: g.email, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'source_not_found' ? 404 : 400 });
  return NextResponse.json(r, { status: 201 });
}
