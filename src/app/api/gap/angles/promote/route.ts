/**
 * POST /api/gap/angles/promote   `{ taskId, personaId?, action?, body?, choice?, problemFamily? }`   (C24 + C25 of the
 * commercial-context audit, 2026-10-08)
 *
 * The seller accepts a prepared angle for one offered person and one action; the service (agents/promote-angle.ts)
 * reads the competing drafts first, then hands the work to the existing reply-draft or proposal path. Nothing here
 * sends. Session only. 200 with the result; 409 with `competing`, `line` and `offers` when existing work needs the
 * seller's choice; 400 bad body or a refusal in words; 404 unknown task.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { mailboxThreadDeps, promoteAngle } from '@/lib/gap/agents/promote-angle';

export const dynamic = 'force-dynamic';

const Body = z.object({
  taskId: z.string().trim().min(3).max(80),
  personaId: z.number().int().positive().nullable().optional(),
  action: z.enum(['email', 'call', 'research']).optional(),
  body: z.string().max(8_000).nullable().optional(),
  choice: z.enum(['reuse', 'revise', 'fresh']).nullable().optional(),
  problemFamily: z.string().trim().max(80).nullable().optional(),
}).strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const d = parsed.data;
  // C57 P2-1: the GAP mailbox's Sent and Drafts are read for the competing-work check (Casey's own hand-written drafts count); none configured reads nothing and the service says so.
  const thread = await mailboxThreadDeps();
  const r = await promoteAngle(prisma, { taskId: d.taskId, actor: g.email, now: new Date(), personaId: d.personaId ?? null, action: d.action, body: d.body ?? null, choice: d.choice ?? null, problemFamily: d.problemFamily ?? null }, thread ? { thread } : {});
  if (!r.ok) {
    if ('competing' in r) return NextResponse.json({ ok: false, reason: r.reason, line: r.detail, competing: r.competing, offers: r.offers }, { status: 409 });
    return NextResponse.json({ ok: false, error: r.reason, detail: r.detail ?? null }, { status: r.reason === 'task_not_found' ? 404 : 400 });
  }
  return NextResponse.json(r);
}
