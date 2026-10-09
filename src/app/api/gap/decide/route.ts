/**
 * POST /api/gap/decide   `{ key, decision, note? }`   (I02, GAP OS prospecting first, 2026-10-08)
 *
 * Casey's decision on an intelligence item from Work or the Signals page: pursue | explore | save | skip | dismiss |
 * more, over `signal:<id>`, `trigger:<id>` or `person:<email>` (work/intel.ts). The service (work/decide.ts) records
 * it and, for pursue and more, queues the angle task and the existing research. Nothing here contacts anyone.
 * Session only. 200 with the result; 400 bad body; 404 unknown item.
 */
import { NextRequest, NextResponse } from 'next/server';
import { hubspotContactByEmail } from '@/lib/gap/opportunity/contact-reads';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { DECISIONS } from '@/lib/gap/work/intel';
import { applyDecision, decisionLine } from '@/lib/gap/work/decide';

export const dynamic = 'force-dynamic';

const Body = z.object({ key: z.string().trim().min(3).max(400), decision: z.enum(DECISIONS), note: z.string().trim().max(500).optional() }).strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const r = await applyDecision(prisma, { key: parsed.data.key, decision: parsed.data.decision, note: parsed.data.note ?? null, actor: g.email, now: new Date(), via: 'app' }, { contactLookup: hubspotContactByEmail });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'not_found' ? 404 : 400 });
  // C44: the state the action came to. Pursue and More queue background work (the angle, the research); the rest are recorded now.
  const state = r.decision === 'pursue' || r.decision === 'more' ? 'queued' : 'accepted';
  return NextResponse.json({ ...r, state, line: decisionLine(r) });
}
