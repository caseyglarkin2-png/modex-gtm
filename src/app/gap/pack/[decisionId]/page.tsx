/**
 * /gap/pack/:decisionId (R60): a first touch or a follow-up by its card, on the dedicated pack page (the email, the
 * call, Send from YardFlow and its checks), never the cockpit lane that lists every account's cards. A card with no
 * thesis has no pack: the account page says what is missing. The seller's place in Work rides along.
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { actionPackHref } from '@/lib/gap/routing/card-readiness';
import { accountHref, withWorkContext } from '@/lib/gap/account-intel/href';

export const dynamic = 'force-dynamic';

export default async function PackPage({ params, searchParams }: { params: Promise<{ decisionId: string }>; searchParams?: Promise<{ from?: string; i?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const { decisionId } = await params;
  const q = (await searchParams) ?? {};
  const decision = (await prisma.routingDecision
    .findUnique({ where: { id: decisionId }, select: { hypothesis_id: true, persona_id: true, account_name: true } })
    .catch(() => null)) as { hypothesis_id: string | null; persona_id: number | null; account_name: string } | null;
  if (!decision) notFound();
  const index = q.from === 'work' && /^\d+$/.test(q.i ?? '') ? Number(q.i) : null;
  if (!decision.hypothesis_id) redirect(withWorkContext(accountHref(decision.account_name), decision.account_name, index));
  const href = actionPackHref(decision.hypothesis_id, decision.persona_id, decisionId);
  redirect(index === null ? href : `${href}&from=work&i=${index}`);
}
