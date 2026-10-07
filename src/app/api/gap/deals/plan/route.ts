/**
 * GET  /api/gap/deals/plan?account=<name>&deal=<HubSpot deal id>   the deal's mutual action plan now (R52)
 * POST /api/gap/deals/plan
 *   `{ op: 'review', accountName, dealId, items: [{ step, decision: 'agree' | 'decline', title?, dueDay?, responsible?,
 *      proof?, buyerAgreed?: { by, on }, reason? }] }`   ONE review of the proposed milestones: each agreed (a deal-scoped
 *      commitment, one-shot) or declined (recorded), each answered on its own
 *   `{ op: 'buyer_agreed', commitmentId, by, on }`        the seller records who on the buyer's side agreed, and when
 *
 * GAP OS execution recovery, R52 (2026-10-06). Session only. Agreed milestones are R40 commitments; declines are
 * append-only `deal.plan_decision` rows (lib/gap/deals/action-plan-store.ts). Nothing here sends, writes HubSpot or
 * records a buyer's agreement the seller did not state. 200 answered (per item); 404 unknown account or milestone;
 * 409 terminal; 400 bad.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { loadPlan, recordBuyerAgreement, reviewPlan } from '@/lib/gap/deals/action-plan-store';
import { PLAN_STEPS } from '@/lib/gap/deals/action-plan';

export const dynamic = 'force-dynamic';

const Item = z
  .object({
    step: z.enum(PLAN_STEPS),
    decision: z.enum(['agree', 'decline']),
    title: z.string().trim().max(200).nullable().optional(),
    dueDay: z.string().trim().max(10).nullable().optional(),
    responsible: z.object({ side: z.enum(['buyer', 'seller']), name: z.string().trim().max(120).nullable().optional() }).strict().nullable().optional(),
    proof: z.string().trim().max(240).nullable().optional(),
    buyerAgreed: z.object({ by: z.string().trim().min(1).max(120), on: z.string().trim().max(10) }).strict().nullable().optional(),
    reason: z.string().trim().max(240).nullable().optional(),
  })
  .strict();

const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('review'), accountName: z.string().trim().min(1).max(200), dealId: z.string().trim().regex(/^\d{1,24}$/), items: z.array(Item).min(1).max(10) }).strict(),
  z.object({ op: z.literal('buyer_agreed'), commitmentId: z.string().trim().min(1).max(300), by: z.string().trim().min(1).max(120), on: z.string().trim().max(10) }).strict(),
]);

export async function GET(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const account = request.nextUrl.searchParams.get('account')?.trim();
  const deal = request.nextUrl.searchParams.get('deal')?.trim();
  if (!account || !deal || !/^\d{1,24}$/.test(deal)) return NextResponse.json({ error: 'invalid_body', field: !account ? 'account' : 'deal' }, { status: 400 });
  return NextResponse.json({ plan: await loadPlan(prisma, account, deal, new Date()) });
}

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const b = parsed.data;
  const now = new Date();
  if (b.op === 'review') {
    const r = await reviewPlan(prisma, { accountName: b.accountName, dealId: b.dealId, items: b.items, actor: g.email, now });
    if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'account_not_found' ? 404 : 400 });
    return NextResponse.json(r, { status: 200 });
  }
  const r = await recordBuyerAgreement(prisma, { commitmentId: b.commitmentId, by: b.by, on: b.on, actor: g.email, now });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'not_found' ? 404 : r.reason === 'terminal' ? 409 : 400 });
  return NextResponse.json(r, { status: 200 });
}
