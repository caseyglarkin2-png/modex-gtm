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
import { actionSecret, verifyActionToken } from '@/lib/gap/work/action-token';
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
  if (v.payload.op === 'start') redirect(`/gap/start?t=${encodeURIComponent(q.t as string)}`);
  const found = v.payload.item ? await findPlanItemByToken(prisma, v.payload.item, { now }) : null;
  if (!found) redirect('/gap/?link=unknown_item');
  redirect(found.item.href);
}
