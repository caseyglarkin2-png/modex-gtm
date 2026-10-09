/**
 * /gap/item?t=<signed action token>   (X06, GAP OS sales execution engine, 2026-10-08)
 *
 * A link from the briefing or an assignment email: verifies the token (work/action-token.ts), finds the plan item it
 * names (work/plan.ts, within the lookback) and redirects, signed in, to where that work runs. A link never executes
 * anything by itself. An expired, forged or unknown token lands on Work with the reason said in words.
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { EXECUTING_OPS, actionSecret, executionAllowed, verifyActionToken } from '@/lib/gap/work/action-token';
import { findPlanItemByToken } from '@/lib/gap/work/plan';

export const dynamic = 'force-dynamic';

export default async function ItemPage({ searchParams }: { searchParams?: Promise<{ t?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  const q = (await searchParams) ?? {};
  if (!session?.user?.email) redirect(loginHref(`/gap/item/?t=${encodeURIComponent(q.t ?? '')}`));
  const now = new Date();
  const v = q.t ? verifyActionToken(q.t, { secret: actionSecret(), now }) : null;
  if (!v || !v.ok) redirect(`/gap/?link=${v ? v.reason : 'missing'}`);
  // C43 / C57 F-C2: an executing op never runs from here. Start and decide go to their own page, which asks for one
  // click before anything is applied; `open` (and any other op) is navigation only.
  if (v.payload.op === 'start') redirect(`/gap/start?t=${encodeURIComponent(q.t as string)}`);
  if (v.payload.op === 'decide') redirect(`/gap/decide?t=${encodeURIComponent(q.t as string)}`);
  if (EXECUTING_OPS.has(v.payload.op) && !executionAllowed({ op: v.payload.op, method: 'GET' }).ok && !v.payload.item) redirect('/gap/?link=needs_confirmation');
  const found = v.payload.item ? await findPlanItemByToken(prisma, v.payload.item, { now }) : null;
  if (!found) redirect('/gap/?link=unknown_item');
  redirect(found.item.href);
}
