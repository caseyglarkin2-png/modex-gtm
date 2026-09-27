/**
 * /gap: the operator cockpit (Sprint 2 S2-T11; one surface since 2026-09-26).
 *
 * Casey does essentially all normal GAP work here. Five lanes, each rendered
 * in place, never a link out:
 *
 *   ?lane=review     account theses (<ThesisGroupReview>) and one-off
 *                    hypotheses (<HypothesisList>) waiting for his judgment
 *   ?lane=research   theses not ready for outreach (FIND VERIFIED EVIDENCE),
 *                    then cards missing evidence or contact data
 *   ?lane=ready      people to contact now; `&open=<decisionId>` renders that
 *                    card's action pack inline (<ActionPackView>)
 *   ?lane=follow_up  sent sequences whose next touch is due, same inline pack
 *   ?lane=replies    buyer replies waiting for a disposition (<RepliesTriage>)
 *
 * Monday readiness (2026-09-27): a thesis is REVIEW work only when a decision
 * on it can succeed (server-derived actionability, hypothesis/actionability.ts).
 * A thesis the evidence gate rates not ready is RESEARCH work, and NEXT UP
 * never points at an approval the server will refuse.
 *
 * No lane: NEXT UP, the single best next minute. The Run routing panel is
 * diagnostic now (APPROVE + USE routes on its own); it is promoted only when
 * people are in use with no current card (activated before this pass).
 *
 * Behind GAP_OS_ENABLED + GAP_ROUTING_ENABLED: a flag that is off means 404.
 * The session is enforced by middleware; auth() here is a second lock.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listReplies } from '@/lib/gap/replies/list';
import { listAllCurrent, type QueueItem } from '@/lib/gap/routing/queue';
import { cockpitOpenHref, sellerLaneOf, type ReviewWaiting } from '@/lib/gap/routing/card-readiness';
import { loadThesisGroups, splitThesisWork, orderGroupsForReview, toThesisCard, withRecordedNotes, type LoadedGroup } from '@/lib/gap/hypothesis/thesis-groups';
import { resolveRoutableHypothesisScope } from '@/lib/gap/routing/run';
import { Breadcrumb } from '@/components/breadcrumb';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { GapCockpit, NextUp, pickNextUp, type CockpitLane } from '@/components/gap/gap-cockpit';
import { ThesisGroupReview } from '@/components/gap/thesis-group-review';
import { ActionPackView } from '@/components/gap/action-pack-view';
import { RunRoutingPanel } from '@/components/gap/run-routing-panel';
import { HypothesisList } from './hypotheses/hypothesis-list';
import { RepliesTriage } from './replies/replies-triage';
import { WorkQueue } from './work-queue';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP' };

const REPLY_TILE_LIMIT = 50;
const LANES: ReadonlySet<string> = new Set(['review', 'research', 'ready', 'follow_up', 'replies']);

const LANE_TITLE: Record<CockpitLane, string> = {
  review: 'Review: do I believe this?',
  research: 'Research: find evidence or contact data',
  ready: 'Ready: contact now',
  follow_up: 'Follow up: next touch due',
  replies: 'Replies: what did the buyer tell you?',
};

const nameOf = (i: QueueItem) => i.persona.displayName ?? i.persona.email ?? 'someone';

async function loadCockpit() {
  const [routableScope, queue, repliesPage, rawGroups, active] = await Promise.all([
    resolveRoutableHypothesisScope(prisma),
    listAllCurrent(prisma),
    listReplies(prisma, { state: 'undispositioned', limit: REPLY_TILE_LIMIT }),
    // Every current thesis, one-person ones included, with server-derived actionability.
    loadThesisGroups(prisma, {}, { singletons: true }).catch((): LoadedGroup[] => []),
    prisma.prospectingHypothesis.findMany({ where: { status: 'active', primary_persona_id: { not: null } }, select: { primary_persona_id: true } }),
  ]);
  const groups = orderGroupsForReview(rawGroups);
  const lanes = queue.items.map((item) => ({ item, lane: sellerLaneOf(item) }));
  const inLane = (lane: string) => lanes.filter((l) => l.lane === lane).map((l) => l.item);

  // REVIEW counts decisions that can succeed, not rows: a shared thesis is ONE review however many
  // people it covers. A thesis the evidence gate rates not ready is RESEARCH, never fake review work.
  const { reviewGroups, readyOneOffIds, researchGroups } = splitThesisWork(groups);
  // Last mile: exactly what the REVIEW lane renders, so a card's "missing thesis" fix links there only
  // when its own thesis is waiting (never to an empty lane).
  const oneOffIds = new Set(readyOneOffIds);
  const reviewMembers = groups.flatMap((g) => (reviewGroups.includes(g) ? g.members : g.members.filter((m) => oneOffIds.has(m.id))));
  const reviewWaiting: ReviewWaiting = {
    hypothesisIds: reviewMembers.map((m) => m.id),
    personaIds: reviewMembers.map((m) => m.primary_persona_id).filter((p): p is number => typeof p === 'number'),
  };

  // People in use with no current card, or a card from before they were in use.
  // Rows activated before APPROVE + USE routed on its own, or whose account's routing failed.
  const cardFor = new Map(queue.items.map((i) => [i.persona.id, i]));
  const unrouted = [...new Set(active.map((a) => a.primary_persona_id as number))].filter((pid) => {
    const card = cardFor.get(pid);
    return !card || card.action === 'approve_hypothesis' || card.ruleId === 'no_hypothesis';
  }).length;

  const ready = inLane('ready');
  const followUp = inLane('follow_up');
  const research = inLane('research');
  const reply = repliesPage.items[0];
  const thesis = reviewGroups[0];
  const researchThesis = researchGroups[0];
  const approvedOf = (g: LoadedGroup) => g.members.filter((m) => m.status === 'approved').length;
  const next = pickNextUp({
    replies: reply ? { title: `${reply.contactEmail} replied`, detail: `${reply.accountName}: ${reply.subject ?? reply.snippet.slice(0, 80)}`, href: '/gap?lane=replies' } : null,
    follow_up: followUp[0] ? { title: `Follow up with ${nameOf(followUp[0])}`, detail: `${followUp[0].account.name}. The next touch is due.`, href: cockpitOpenHref('follow_up', followUp[0].id) } : null,
    ready: ready[0] ? { title: `Contact ${nameOf(ready[0])}`, detail: `${ready[0].account.name}${ready[0].persona.title ? `, ${ready[0].persona.title}` : ''}.`, href: cockpitOpenHref('ready', ready[0].id) } : null,
    review: thesis
      ? { title: `Decide the ${thesis.accountName} thesis`, detail: `${thesis.members.length} people, ready for outreach.`, href: '/gap?lane=review' }
      : readyOneOffIds.length > 0
        ? { title: 'Decide a hypothesis', detail: `${readyOneOffIds.length} waiting.`, href: '/gap?lane=review' }
        : null,
    research: researchThesis
      ? {
          title: `Find verified evidence for the ${researchThesis.accountName} thesis`,
          detail: `${researchThesis.members.length === 1 ? '1 person' : `${researchThesis.members.length} people`}${approvedOf(researchThesis) ? `, ${approvedOf(researchThesis)} approved` : ''}, 0 in use. Not ready for outreach yet.`,
          href: '/gap?lane=research',
        }
      : research[0]
        ? { title: `Research ${research[0].account.name}`, detail: `${research.length} card${research.length === 1 ? '' : 's'} missing evidence or contact data.`, href: '/gap?lane=research' }
        : null,
  });

  const routableHypotheses = 'tooLarge' in routableScope ? 0 : routableScope.hypothesesCount;
  const routableAccounts = 'tooLarge' in routableScope ? routableScope.accountCount : routableScope.accountNames.length;
  return {
    counts: {
      review: reviewGroups.length + readyOneOffIds.length,
      research: research.length + researchGroups.length,
      ready: ready.length,
      followUp: followUp.length,
      replies: { count: repliesPage.items.length, atLeast: repliesPage.nextCursor !== null },
    },
    next,
    groups: reviewGroups,
    readyOneOffIds,
    researchGroups,
    reviewWaiting,
    queueAsOf: queue.asOf,
    unrouted,
    routing: { canRun: routableHypotheses > 0 || queue.items.length > 0, routableHypotheses, routableAccounts },
  };
}

async function ReviewLane({ groups, readyOneOffIds }: { groups: LoadedGroup[]; readyOneOffIds: string[] }) {
  const cards = await withRecordedNotes(prisma, groups.map(toThesisCard));
  // One-off hypotheses (not part of a shared thesis) whose decision can succeed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw rows, the shape HypothesisList renders
  const oneOffs: any[] = readyOneOffIds.length
    ? await prisma.prospectingHypothesis.findMany({ where: { id: { in: readyOneOffIds } }, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: 50 })
    : [];
  // ThesisGroupReview stays mounted even when nothing is left: it holds the outcome of the
  // approval that just emptied the lane (success must never make the result disappear).
  return (
    <div className="space-y-6">
      {cards.length === 0 && oneOffs.length === 0 ? (
        <p className="text-sm italic text-[var(--muted-foreground)]">Nothing waiting for your judgment.</p>
      ) : null}
      <ThesisGroupReview cards={cards} intro={false} />
      {/* Always mounted: approving the last one-off must not unmount the drawer holding its outcome. */}
      <section className="space-y-2">
        {oneOffs.length ? <h3 className="text-sm font-semibold">One-off hypotheses</h3> : null}
        <HypothesisList items={oneOffs} showFilter={false} emptyNote={null} />
      </section>
    </div>
  );
}

/** Theses the evidence gate rates not ready: FIND VERIFIED EVIDENCE comes first in Research. */
async function ResearchTheses({ groups }: { groups: LoadedGroup[] }) {
  const cards = await withRecordedNotes(prisma, groups.map(toThesisCard));
  // Always mounted (like ReviewLane): using evidence on the last research thesis empties this list,
  // and the outcome with its "Review the revised thesis" link must survive the refresh.
  return (
    <section className="space-y-2" data-testid="research-theses">
      {cards.length ? <h3 className="text-sm font-semibold">Theses that need verified evidence</h3> : null}
      <ThesisGroupReview cards={cards} intro={false} />
    </section>
  );
}

export default async function GapCockpitPage({ searchParams }: { searchParams?: Promise<{ lane?: string; open?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const params = (await searchParams) ?? {};
  const lane = (params.lane && LANES.has(params.lane) ? params.lane : null) as CockpitLane | null;
  const openId = params.open?.trim() || null;
  const data = await loadCockpit();

  // The opened card's action pack, built on the server from the same component as the deep link.
  let openPanel: React.ReactNode = null;
  if (openId && (lane === 'ready' || lane === 'follow_up' || lane === 'research')) {
    const decision = await prisma.routingDecision.findUnique({ where: { id: openId }, select: { hypothesis_id: true, persona_id: true } });
    openPanel = decision?.hypothesis_id ? (
      <ActionPackView target={{ hypothesisId: decision.hypothesis_id, personaId: decision.persona_id, decisionId: openId }} embedded />
    ) : (
      <p className="text-sm text-[var(--muted-foreground)]">This card has no thesis, so there is nothing to prepare.</p>
    );
  }

  const routingPanel = (
    <RunRoutingPanel canRun={data.routing.canRun} routableHypotheses={data.routing.routableHypotheses} routableAccounts={data.routing.routableAccounts} />
  );

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP' }]} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GAP</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Decide what you believe, contact who GAP marks ready, log what buyers tell you.</p>
      </div>
      <GapSubnav />
      <GapCockpit data={{ ...data.counts, active: lane }} />

      {data.unrouted > 0 ? (
        <section data-testid="unrouted-notice" className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p>
            {data.unrouted} {data.unrouted === 1 ? 'person is' : 'people are'} in use without a current recommendation (routing did not
            finish for them). One routing pass fixes it; it creates cards only and contacts no one.
          </p>
          {routingPanel}
        </section>
      ) : null}

      {lane ? (
        <section className="space-y-3" aria-label={LANE_TITLE[lane]}>
          <h2 className="text-lg font-semibold">{LANE_TITLE[lane]}</h2>
          {lane === 'review' ? (
            <ReviewLane groups={data.groups} readyOneOffIds={data.readyOneOffIds} />
          ) : lane === 'replies' ? (
            <RepliesTriage inCockpit />
          ) : (
            <>
            {lane === 'research' ? <ResearchTheses groups={data.researchGroups} /> : null}
            <WorkQueue reloadKey={data.queueAsOf ?? undefined} sellerLane={lane} openId={openId} openPanel={openPanel} closeHref={`/gap?lane=${lane}`} reviewWaiting={data.reviewWaiting} />
            </>
          )}
        </section>
      ) : (
        <NextUp items={data.next} />
      )}

      {data.unrouted === 0 ? (
        <details className="rounded-md border border-[var(--border)] p-3 text-xs" data-testid="system-details">
          <summary className="cursor-pointer text-[var(--muted-foreground)]">System: routing</summary>
          <div className="mt-3">{routingPanel}</div>
        </details>
      ) : null}
    </div>
  );
}
