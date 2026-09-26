/**
 * GET  /api/gap/theses                     account thesis groups in review order
 * POST /api/gap/theses  `{op, fingerprint, ...}`
 *
 *   op approve      `{hypothesisIds, use?, signalIds?}`  APPROVE (+ USE) SELECTED
 *                   SIBLINGS: optional chosen evidence linked to the selected
 *                   editable rows first, then the normal submit/approve[/activate]
 *                   transitions per row, each audited with the group action and
 *                   the operator; per-row results. Ids outside the group are
 *                   refused (409). With `use`, the people now in use are routed
 *                   at once (routeAfterUse: shadow recommendations only, never a
 *                   draft, enrollment or send) and `routing` carries where each
 *                   one landed, or the reason routing failed.
 *   op corroborate  `{force?}`         FIND CORROBORATING EVIDENCE: one research
 *                   run for the whole thesis (reused 24h); corroborated,
 *                   no_second_source or contradicts. Links nothing.
 *   op attach       `{signalIds}`      link chosen verified facts to every
 *                   editable sibling; frozen siblings are reported, not changed.
 *
 * Session only; gated like every hypothesis route (GAP_HYPOTHESIS_ENABLED).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { routeAfterUse } from '@/lib/gap/routing/interactive';
import { approveSelectedSiblings, attachEvidenceToThesis, corroborateThesis, loadThesisGroups, orderGroupsForReview } from '@/lib/gap/hypothesis/thesis-groups';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const Fp = z.string().regex(/^[0-9a-f]{64}$/);
const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('approve'), fingerprint: Fp, hypothesisIds: z.array(z.string().min(1)).min(1).max(50), use: z.boolean().optional(), signalIds: z.array(z.string().min(1)).min(1).max(20).optional() }).strict(),
  z.object({ op: z.literal('corroborate'), fingerprint: Fp, force: z.boolean().optional() }).strict(),
  z.object({ op: z.literal('attach'), fingerprint: Fp, signalIds: z.array(z.string().min(1)).min(1).max(20) }).strict(),
]);

async function sessionEmail(): Promise<string | null> {
  const email = (await auth())?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

export async function GET() {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  if (!(await sessionEmail())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  return NextResponse.json({ groups: orderGroupsForReview(await loadThesisGroups(prisma)) });
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const actor = await sessionEmail();
  if (!actor) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const b = parsed.data;
  const now = new Date();

  if (b.op === 'approve') {
    const r = await approveSelectedSiblings(prisma, { fingerprint: b.fingerprint, hypothesisIds: b.hypothesisIds, actor, now, use: b.use === true, signalIds: b.signalIds });
    if (r.reason === 'group_not_found') return NextResponse.json(r, { status: 404 });
    if (r.reason?.startsWith('not_in_group')) return NextResponse.json(r, { status: 409 });
    const routing = b.use === true && r.inUse && r.inUse.length > 0 ? await routeAfterUse(prisma, { actor, now, people: r.inUse }) : null;
    return NextResponse.json({ ...r, routing });
  }
  if (b.op === 'corroborate') {
    const r = await corroborateThesis(prisma, { fingerprint: b.fingerprint, actor, now, force: b.force });
    return NextResponse.json(r, { status: r.ok ? 200 : 404 });
  }
  const r = await attachEvidenceToThesis(prisma, { fingerprint: b.fingerprint, signalIds: b.signalIds, actor });
  return NextResponse.json(r, { status: r.reason === 'group_not_found' ? 404 : 200 });
}
