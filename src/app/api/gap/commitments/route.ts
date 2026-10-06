/**
 * GET  /api/gap/commitments?account=<name>     the account's obligations with their phase now (R40)
 * POST /api/gap/commitments
 *   `{ op: 'create', accountName, kind, title, dueDay?, dueAt?, personaId?, dealId?, basis? }`   the seller's own
 *        obligation (a deliverable they promised, a deal step, something the buyer promised, a reminder, a task)
 *   `{ op: 'status', commitmentId, to, until?, dependency?, reason?, note?, dueDay? }`              done (the seller's
 *        recorded note is the proof), skipped (with the reason), snoozed (until a date), waiting / blocked (on what),
 *        open again (from waiting, blocked or snoozed; never from done or skipped)
 *
 * GAP OS execution recovery, R40 (2026-10-06). Session only. Everything is an append-only `account.commitment` row
 * (lib/gap/work/commitments.ts). Nothing here sends, enrolls, writes HubSpot or changes a thesis, a person or a
 * suppression. 201 created; 200 changed or already there; 404 unknown account or commitment; 409 terminal; 400 bad.
 */
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { ensureCommitment, loadCommitments, NOTE_MAX, TITLE_MAX, transitionCommitment, withPhases } from '@/lib/gap/work/commitments';
import { COMMITMENT_STATUSES } from '@/lib/gap/work/commitment-model';
import { isDay, nyDayAt } from '@/lib/gap/work/dates';

export const dynamic = 'force-dynamic';

const SELLER_KINDS = ['deliverable', 'deal_step', 'buyer_promise', 'reminder', 'task'] as const;
const day = z.string().trim().refine(isDay, 'a YYYY-MM-DD day');

const Body = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('create'),
      accountName: z.string().trim().min(1).max(200),
      kind: z.enum(SELLER_KINDS),
      title: z.string().trim().min(1).max(TITLE_MAX),
      dueDay: day.optional(),
      dueAt: z.string().trim().max(40).optional(),
      personaId: z.number().int().positive().nullable().optional(),
      dealId: z.string().trim().max(64).nullable().optional(),
      basis: z.string().trim().max(600).nullable().optional(),
    })
    .strict(),
  z
    .object({
      op: z.literal('status'),
      commitmentId: z.string().trim().min(1).max(300),
      to: z.enum(COMMITMENT_STATUSES),
      until: z.string().trim().max(40).optional(),
      dependency: z.string().trim().max(NOTE_MAX).optional(),
      reason: z.string().trim().max(NOTE_MAX).optional(),
      note: z.string().trim().max(NOTE_MAX).optional(),
      dueDay: day.optional(),
    })
    .strict(),
]);

const STATUS: Record<string, number> = { account_not_found: 404, not_found: 404, terminal: 409 };

export async function GET(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const account = request.nextUrl.searchParams.get('account')?.trim();
  if (!account) return NextResponse.json({ error: 'invalid_body', field: 'account' }, { status: 400 });
  const now = new Date();
  return NextResponse.json({ items: withPhases(await loadCommitments(prisma, { accountNames: [account] }), now) });
}

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const b = parsed.data;
  const now = new Date();
  if (b.op === 'create') {
    let person = null;
    if (b.personaId != null) {
      const p = await prisma.persona.findUnique({ where: { id: b.personaId }, select: { id: true, name: true, email: true, account_name: true } });
      if (!p || p.account_name !== b.accountName) return NextResponse.json({ error: 'persona_not_at_account' }, { status: 400 });
      person = { personaId: p.id, name: p.name, email: p.email };
    }
    const dueAt = b.dueDay ? nyDayAt(b.dueDay) : b.dueAt ?? null;
    const r = await ensureCommitment(
      prisma,
      { accountName: b.accountName, kind: b.kind, title: b.title, basis: b.basis ?? null, dueAt, person, dealId: b.dealId ?? null, status: b.kind === 'buyer_promise' ? 'waiting' : 'open', dependency: b.kind === 'buyer_promise' ? 'their delivery' : null, source: { kind: 'seller', id: randomUUID() } },
      { actor: g.email, now },
    );
    if (!r.ok) return NextResponse.json({ error: r.reason }, { status: STATUS[r.reason] ?? 400 });
    return NextResponse.json(r, { status: r.created ? 201 : 200 });
  }
  const r = await transitionCommitment(prisma, {
    commitmentId: b.commitmentId,
    to: b.to,
    until: b.until ? (isDay(b.until) ? nyDayAt(b.until) : b.until) : null,
    dependency: b.dependency ?? null,
    reason: b.reason ?? null,
    proof: b.to === 'done' ? { kind: 'seller', id: null, note: b.note ?? null } : null,
    ...(b.dueDay ? { dueAt: nyDayAt(b.dueDay) } : {}),
    actor: g.email,
    now,
  });
  if (!r.ok) return NextResponse.json({ error: r.reason, ...(r.status ? { status: r.status } : {}) }, { status: STATUS[r.reason] ?? 400 });
  return NextResponse.json(r, { status: 200 });
}
