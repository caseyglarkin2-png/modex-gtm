/**
 * GET  /api/gap/crm-sync?account=<name>    every proposed HubSpot change at the account, with its state (R54)
 * POST /api/gap/crm-sync
 *   `{ op: 'approve', accountName, dealId, dealName?, change, origin }`   the seller's explicit approval of the EXACT
 *        change shown on the page: `crm.sync_proposed` (once) then `crm.sync_approved`; the write runs only when
 *        GAP_HUBSPOT_MIRROR_ENABLED is on (OFF in production: the state is then "approved, not written")
 *   `{ op: 'propose', ... }`             record the proposal only (nothing approved)
 *   `{ op: 'retry', proposalId }`         retry an approved change (idempotent: it never writes twice)
 *   `{ op: 'discard', proposalId, reason? }`
 *
 * GAP OS execution recovery, R54 (2026-10-06). Session only. A change targets one HubSpot deal by id: a note, a task
 * or the deal's next step, nothing else; its origin must be a record GAP holds for that deal (an obligation, a plan
 * milestone, the recap). lib/gap/deals/crm-sync.ts owns the states. 200 answered; 404 unknown; 409 refused; 400 bad.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { approveCrmChange, discardCrmChange, loadCrmSync, proposeCrmChange } from '@/lib/gap/deals/crm-sync';
import { CRM_DEAL_PROPERTIES } from '@/lib/gap/deals/crm-model';
import { loadCommitment } from '@/lib/gap/work/commitments';

export const dynamic = 'force-dynamic';

const dealId = z.string().trim().regex(/^\d{1,24}$/);
const Change = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('note'), objectType: z.literal('deal'), objectId: dealId, body: z.string().min(1).max(5_000) }).strict(),
  z.object({ kind: z.literal('task'), objectType: z.literal('deal'), objectId: dealId, subject: z.string().trim().min(1).max(200), body: z.string().max(5_000), dueAt: z.string().max(40).nullable() }).strict(),
  z.object({ kind: z.literal('deal_property'), objectType: z.literal('deal'), objectId: dealId, property: z.enum(CRM_DEAL_PROPERTIES), from: z.string().max(250).nullable(), to: z.string().trim().min(1).max(250) }).strict(),
]);
const Origin = z.object({ kind: z.enum(['recap', 'commitment', 'plan', 'capture']), id: z.string().trim().min(1).max(300), label: z.string().trim().min(1).max(200) }).strict();
const Proposal = { accountName: z.string().trim().min(1).max(200), dealId, dealName: z.string().trim().max(200).nullable().optional(), change: Change, origin: Origin };

const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('approve'), ...Proposal }).strict(),
  z.object({ op: z.literal('propose'), ...Proposal }).strict(),
  z.object({ op: z.literal('retry'), proposalId: z.string().trim().min(1).max(80) }).strict(),
  z.object({ op: z.literal('discard'), proposalId: z.string().trim().min(1).max(80), reason: z.string().trim().max(240).nullable().optional() }).strict(),
]);

const STATUS: Record<string, number> = { account_not_found: 404, not_found: 404, bad_change: 400, bad_origin: 400, discarded: 409, already_written: 409, in_progress: 409, not_approved: 409 };

export async function GET(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const account = request.nextUrl.searchParams.get('account')?.trim();
  if (!account) return NextResponse.json({ error: 'invalid_body', field: 'account' }, { status: 400 });
  return NextResponse.json({ items: await loadCrmSync(prisma, account) });
}

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const b = parsed.data;
  const now = new Date();
  if (b.op === 'retry') {
    const r = await approveCrmChange(prisma, { proposalId: b.proposalId, actor: g.email, now, retry: true });
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.reason, item: r.item ?? null }, { status: STATUS[r.reason] ?? 409 });
  }
  if (b.op === 'discard') {
    const r = await discardCrmChange(prisma, { proposalId: b.proposalId, reason: b.reason ?? null, actor: g.email, now });
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.reason }, { status: STATUS[r.reason] ?? 409 });
  }
  // The origin must be a record GAP holds for this deal (origin tracking is never free text).
  if (b.origin.kind === 'commitment' || b.origin.kind === 'plan') {
    const c = await loadCommitment(prisma, b.origin.id);
    if (!c || c.accountName !== b.accountName || (c.dealId && c.dealId !== b.dealId)) return NextResponse.json({ error: 'bad_origin' }, { status: 400 });
  } else if (b.origin.kind === 'recap' && !b.origin.id.startsWith(`${b.dealId}:`)) {
    return NextResponse.json({ error: 'bad_origin' }, { status: 400 });
  }
  const p = await proposeCrmChange(prisma, { accountName: b.accountName, dealId: b.dealId, dealName: b.dealName ?? null, change: b.change, origin: b.origin, actor: g.email, now });
  if (!p.ok) return NextResponse.json({ error: p.reason, detail: p.detail ?? null }, { status: STATUS[p.reason] ?? 400 });
  if (b.op === 'propose') return NextResponse.json({ ok: true, created: p.created, item: p.item });
  const r = await approveCrmChange(prisma, { proposalId: p.item.proposalId, actor: g.email, now });
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.reason, item: r.item ?? null }, { status: STATUS[r.reason] ?? 409 });
}
