/**
 * POST /api/gap/accounts/alias-review   `{ accountName, alias, decision: 'confirm' | 'reject', evidence?, note? }`
 * Casey answered a POSSIBLE ACCOUNT ALIAS proposal (enterprise graph, 2026-10-05). Confirm registers the alias
 * (source 'manual', created_by the session) and audits it once: 201. Reject records one audit row so the proposal
 * stays away: 200. Session only; the same flag gate as the sibling account routes. Never writes HubSpot, never calls
 * Apollo, never creates an account.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { confirmAlias, rejectAlias } from '@/lib/gap/people/alias-review';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    accountName: z.string().trim().min(1).max(200),
    alias: z.string().trim().min(1).max(200),
    decision: z.enum(['confirm', 'reject']),
    evidence: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

const STATUS: Record<'account_not_found' | 'alias_conflict' | 'alias_is_account' | 'invalid_alias', number> = { account_not_found: 404, alias_conflict: 409, alias_is_account: 409, invalid_alias: 400 };

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const { accountName, alias, decision } = parsed.data;
  const now = new Date();
  if (decision === 'confirm') {
    const r = await confirmAlias(prisma, { accountName, alias, actor: g.email, now, evidence: parsed.data.evidence ?? [] });
    if (!r.ok) return NextResponse.json({ error: r.reason, detail: r.detail ?? null }, { status: STATUS[r.reason] });
    return NextResponse.json({ ok: true, status: r.status, id: r.id, auditId: r.auditId }, { status: 201 });
  }
  const account = await prisma.account.findUnique({ where: { name: accountName }, select: { name: true } });
  if (!account) return NextResponse.json({ error: 'account_not_found' }, { status: 404 });
  const r = await rejectAlias(prisma, { accountName: account.name, alias, actor: g.email, now, note: parsed.data.note ?? null });
  return NextResponse.json({ ok: true, auditId: r.auditId }, { status: 200 });
}
