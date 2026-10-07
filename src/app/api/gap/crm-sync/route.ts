/**
 * GET  /api/gap/crm-sync?account=<name>    every proposed HubSpot change at the account, with its state (R54)
 * POST /api/gap/crm-sync
 *   `{ op: 'approve', accountName, dealId, dealName?, change, origin }`   the seller's explicit approval of the EXACT
 *        change shown on the page: `crm.sync_proposed` (once) then `crm.sync_approved`; the write runs only when
 *        GAP_CRM_APPROVED_WRITES_ENABLED is on (batch item 9; off by default: the state is then "approved, not written")
 *   `{ op: 'propose', ... }`             record the proposal only (nothing approved)
 *   `{ op: 'retry', proposalId }`         retry an approved change (idempotent: it never writes twice)
 *   `{ op: 'discard', proposalId, reason? }`
 *
 * GAP OS execution recovery, R54 (2026-10-06). Session only. A change targets one HubSpot deal by id: a note, a task
 * or the deal's next step, nothing else; its origin must be a record GAP holds for that deal (an obligation, a plan
 * milestone, the recap). lib/gap/crm-sync.ts owns the states; lib/gap/crm-writer.ts makes the approved write. 200 answered; 404 unknown; 409 refused; 400 bad.
 *
 * Batch item 9: the deal must be an open deal of the account (the In Deals read; unreadable answers 409
 * `deal_unverified`, nothing recorded); the origin must be live (crm-sync.ts `originProblem`): 400 `bad_origin`, 409
 * `origin_closed` (an obligation done or skipped, a deal that closed), at approve AND at retry. A refusal carries its
 * `detail` in seller words.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { approveCrmChange, discardCrmChange, loadCrmSync, proposeCrmChange } from '@/lib/gap/crm-sync';
import { CRM_DEAL_PROPERTIES } from '@/lib/gap/deals/crm-model';
import { originProblem } from '@/lib/gap/crm-sync';
import { loadDealStates } from '@/lib/gap/deals/closure';
import { loadInDealsSummary } from '@/lib/gap/deals/in-deals';

export const dynamic = 'force-dynamic';

const dealId = z.string().trim().regex(/^\d{1,24}$/);
const Change = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('note'), objectType: z.literal('deal'), objectId: dealId, body: z.string().min(1).max(5_000) }).strict(),
  z.object({ kind: z.literal('task'), objectType: z.literal('deal'), objectId: dealId, subject: z.string().trim().min(1).max(200), body: z.string().max(5_000), dueAt: z.string().max(40).nullable() }).strict(),
  z.object({ kind: z.literal('task_complete'), objectType: z.literal('deal'), objectId: dealId, subject: z.string().trim().min(1).max(200) }).strict(),
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

const STATUS: Record<string, number> = { account_not_found: 404, not_found: 404, bad_change: 400, bad_origin: 400, origin_closed: 409, deal_unverified: 409, discarded: 409, already_written: 409, in_progress: 409, not_approved: 409 };

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
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.reason, detail: r.detail ?? null, item: r.item ?? null }, { status: STATUS[r.reason] ?? 409 });
  }
  if (b.op === 'discard') {
    const r = await discardCrmChange(prisma, { proposalId: b.proposalId, reason: b.reason ?? null, actor: g.email, now });
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.reason }, { status: STATUS[r.reason] ?? 409 });
  }
  // Batch item 9: the deal is one of the account's open deals (the one In Deals read; a closed one is origin_closed).
  const closed = (await loadDealStates(prisma, b.accountName).catch(() => new Map<string, { state: string; at: string }>())).get(b.dealId);
  if (closed && closed.state !== 'open') return NextResponse.json({ error: 'origin_closed', detail: `the deal closed (${closed.state}) on ${closed.at.slice(0, 10)}: nothing is written to it` }, { status: 409 });
  // The cached read first; a deal it does not hold is read fresh once (a deal opened since), never refused on a stale list.
  type Summary = Awaited<ReturnType<typeof loadInDealsSummary>>;
  const holds = (s: Summary | null) => s?.status === 'complete' && !!s.accounts.find((a) => a.accountName === b.accountName || a.alsoRecordedAs.includes(b.accountName))?.deals.some((d) => d.id === b.dealId);
  let deals = await loadInDealsSummary(prisma).catch(() => null);
  if (!holds(deals)) deals = (await loadInDealsSummary(prisma, { fresh: true }).catch(() => null)) ?? deals;
  if (!deals || deals.status !== 'complete') return NextResponse.json({ error: 'deal_unverified', detail: 'HubSpot could not confirm the open deals just now. Nothing was recorded; try again.' }, { status: 409 });
  if (!holds(deals)) return NextResponse.json({ error: 'bad_origin', detail: `deal ${b.dealId} is not an open deal of ${b.accountName}` }, { status: 400 });
  // The origin must be a live record GAP holds for this deal (origin tracking is never free text).
  const bad = await originProblem(prisma, { accountName: b.accountName, dealId: b.dealId, origin: b.origin, change: b.change });
  if (bad) return NextResponse.json({ error: bad.reason, detail: bad.detail }, { status: STATUS[bad.reason] ?? 400 });
  const p = await proposeCrmChange(prisma, { accountName: b.accountName, dealId: b.dealId, dealName: b.dealName ?? null, change: b.change, origin: b.origin, actor: g.email, now });
  if (!p.ok) return NextResponse.json({ error: p.reason, detail: p.detail ?? null }, { status: STATUS[p.reason] ?? 400 });
  if (b.op === 'propose') return NextResponse.json({ ok: true, created: p.created, item: p.item });
  const r = await approveCrmChange(prisma, { proposalId: p.item.proposalId, actor: g.email, now });
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.reason, detail: r.detail ?? null, item: r.item ?? null }, { status: STATUS[r.reason] ?? 409 });
}
