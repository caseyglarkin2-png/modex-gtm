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
 *   ?lane=deals      accounts with an open HubSpot deal (live truth, UNKNOWN listed
 *                    apart); `&account=<name>` opens its read-only Deal Brief (Phase 2 F)
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
import { listAllCurrent } from '@/lib/gap/routing/queue';
import { cockpitOpenHref, type ReviewWaiting } from '@/lib/gap/routing/card-readiness';
import { loadThesisGroups, splitThesisWork, orderGroupsForReview, toThesisCard, withRecordedNotes, type LoadedGroup } from '@/lib/gap/hypothesis/thesis-groups';
import { resolveRoutableHypothesisScope } from '@/lib/gap/routing/run';
import { Breadcrumb } from '@/components/breadcrumb';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { GapCockpit, NextUp, type CockpitLane } from '@/components/gap/gap-cockpit';
import { buildNextUpCandidates, heldAccountsOf, pickNextUpV2 } from '@/lib/gap/routing/next-up';
import { laneWithMotion, loadCockpitMotions, type CockpitMotions } from '@/lib/gap/motion/cockpit';
import { ThesisGroupReview } from '@/components/gap/thesis-group-review';
import { ActionPackView } from '@/components/gap/action-pack-view';
import { RunRoutingPanel } from '@/components/gap/run-routing-panel';
import { HypothesisList } from './hypotheses/hypothesis-list';
import { RepliesTriage } from './replies/replies-triage';
import { WorkQueue } from './work-queue';
import { HealthStrip } from '@/components/gap/health-strip';
import { EvidenceInbox } from '@/components/gap/evidence-inbox';
import { loadEvidenceInbox } from '@/lib/gap/research/inbox';
import { heldDealAccounts, loadInDeals } from '@/lib/gap/deals/in-deals';
import { loadDealBrief } from '@/lib/gap/deals/deal-brief';
import { DealBriefView } from '@/components/gap/deal-brief';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP' };

const REPLY_TILE_LIMIT = 50;
const LANES: ReadonlySet<string> = new Set(['review', 'research', 'ready', 'follow_up', 'replies', 'deals']);

const LANE_TITLE: Record<CockpitLane, string> = {
  review: 'Review: do I believe this?',
  research: 'Research: find evidence or contact data',
  ready: 'Ready: contact now',
  follow_up: 'Follow up: next touch due',
  replies: 'Replies: what did the buyer tell you?',
  deals: 'In deals: learn, do not prospect',
};

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
  const now = new Date();
  // Phase 2 C: one cold email motion per account. A held email card is never READY; it waits as NEXT.
  // A failed motion read shows every card (every send gate still enforces one motion per account).
  const motion: CockpitMotions = await loadCockpitMotions(prisma, queue.items, now).catch(() => ({ motions: [], heldCardIds: [] }));
  const held = new Set(motion.heldCardIds);
  const lanes = queue.items.map((item) => ({ item, lane: laneWithMotion(item, held) }));
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

  // Phase 2 C5: NEXT UP v2, deterministic rules (lib/gap/routing/next-up.ts), one item per account,
  // never an account held by an open deal or unknown opportunity truth.
  const inbox = await loadEvidenceInbox(prisma, now).catch(() => []);
  const accountsSeen = [...new Set([...queue.items.map((i) => i.account.name), ...groups.map((g) => g.accountName), ...inbox.map((a) => a.accountName)])];
  const [tierRows, expiryRows] = await Promise.all([
    accountsSeen.length ? prisma.account.findMany({ where: { name: { in: accountsSeen } }, select: { name: true, tier: true } }).catch(() => []) : [],
    ready.length
      ? prisma.hypothesisSignal
          .findMany({ where: { hypothesis_id: { in: ready.map((r) => r.hypothesis?.id).filter((x): x is string => !!x) }, role: 'primary' }, select: { hypothesis_id: true, signal: { select: { freshness_expires_at: true } } } })
          .catch(() => [])
      : [],
  ]);
  const tiers = new Map((tierRows as Array<{ name: string; tier: string | null }>).map((t) => [t.name, t.tier]));
  const primaryExpiry = new Map(
    (expiryRows as Array<{ hypothesis_id: string; signal: { freshness_expires_at: Date | null } | null }>).map((r) => [r.hypothesis_id, r.signal?.freshness_expires_at ? new Date(r.signal.freshness_expires_at).toISOString() : null]),
  );
  const oneOffAccount = new Map(groups.flatMap((g) => g.members.map((m) => [m.id, g.accountName] as const)));
  const next = pickNextUpV2(
    buildNextUpCandidates({
      replies: repliesPage.items,
      followUps: followUp,
      ready,
      primaryExpiry,
      reviewGroups: reviewGroups.map((g) => ({ accountName: g.accountName, people: g.members.length })),
      readyOneOffs: readyOneOffIds.map((id) => ({ accountName: oneOffAccount.get(id) ?? '' })),
      researchGroups: researchGroups.map((g) => ({ accountName: g.accountName, people: g.members.filter((m) => m.next === 'find_evidence' || m.next === 'revise').length })),
      researchCards: research,
      inbox: inbox.map((a) => ({ accountName: a.accountName, ready: a.ready.length, people: Math.max(0, ...a.theses.map((t) => t.people)) })),
      tiers,
      openHref: cockpitOpenHref,
    }),
    heldAccountsOf(queue.items),
  );

  const heldDeals = heldDealAccounts(queue.items);
  const routableHypotheses = 'tooLarge' in routableScope ? 0 : routableScope.hypothesesCount;
  const routableAccounts = 'tooLarge' in routableScope ? routableScope.accountCount : routableScope.accountNames.length;
  return {
    counts: {
      review: reviewGroups.length + readyOneOffIds.length,
      research: research.length + researchGroups.length,
      ready: ready.length,
      followUp: followUp.length,
      replies: { count: repliesPage.items.length, atLeast: repliesPage.nextCursor !== null },
      deals: heldDeals.length,
    },
    // Held accounts first, so the lane's account cap never drops one routing already holds.
    gapAccounts: [...heldDeals, ...accountsSeen.filter((a) => !heldDeals.includes(a))],
    next,
    groups: reviewGroups,
    readyOneOffIds,
    researchGroups,
    reviewWaiting,
    motion,
    inbox,
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

/**
 * Phase 2 F1: accounts HubSpot says are in an open deal, read live (bounded). GAP stops cold outreach
 * there; this is where it stays useful. An account whose truth cannot be read is listed apart.
 */
async function InDealsLane({ accounts, open }: { accounts: string[]; open: string | null }) {
  const now = new Date();
  const { inDeals, couldNotVerify } = await loadInDeals(prisma, accounts);
  const opened = open ? inDeals.find((a) => a.accountName === open) ?? null : null;
  const brief = opened ? await loadDealBrief(prisma, opened.accountName, { now, dealContacts: opened.dealContacts }) : null;
  return (
    <div className="space-y-4" data-testid="in-deals">
      <p className="text-sm text-[var(--muted-foreground)]">
        Read from HubSpot just now. No cold first touch goes to these accounts; work them from the deal and learn what is still unknown.
      </p>
      {open && !opened ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">No open deal was verified for {open} just now, so there is no Deal Brief to show.</p>
      ) : null}
      {inDeals.length === 0 ? <p className="text-sm italic text-[var(--muted-foreground)]">No GAP account has an open HubSpot deal right now.</p> : null}
      <ul className="space-y-3">
        {inDeals.map((a) => (
          <li key={a.accountName} className="space-y-2 rounded-md border border-[var(--border)] p-3" data-testid={`in-deal-${a.accountName}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{a.accountName}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{a.known} of 6 known</p>
            </div>
            <ul className="text-sm">
              {a.deals.map((d, i) => (
                <li key={i} className="break-words">
                  {d.name ? `"${d.name}"` : 'Unnamed deal'} · {d.stage}
                  {d.lastActivityAt ? ` · last activity ${new Date(d.lastActivityAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}` : ''}
                </li>
              ))}
            </ul>
            <p className="text-xs text-[var(--muted-foreground)]">
              {a.people.length ? `GAP knows ${a.people.slice(0, 3).map((p) => p.name).join(', ')}${a.people.length > 3 ? ` and ${a.people.length - 3} more` : ''}` : 'GAP holds no one here'}
              {a.dealContacts ? ` · ${a.dealContacts} on the deal` : ''}
            </p>
            {opened?.accountName === a.accountName && brief ? (
              <>
                <DealBriefView brief={brief} deals={a.deals} editable />
                <a href="/gap?lane=deals" className="text-xs underline">Close the brief</a>
              </>
            ) : (
              <a href={`/gap?lane=deals&account=${encodeURIComponent(a.accountName)}`} data-testid="open-deal-brief" className="inline-flex rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]">
                Deal brief
              </a>
            )}
          </li>
        ))}
      </ul>
      {couldNotVerify.length ? (
        <section data-testid="in-deals-unknown" className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-semibold">Could not verify ({couldNotVerify.length})</p>
          <p className="text-xs">HubSpot did not answer for these accounts. Check HubSpot before contacting them; every send re-checks at the click.</p>
          <ul className="text-xs">
            {couldNotVerify.map((u) => (
              <li key={u.accountName}>
                {u.accountName} <span className="text-[var(--muted-foreground)]">({u.reason.replace(/_/g, ' ')})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default async function GapCockpitPage({ searchParams }: { searchParams?: Promise<{ lane?: string; open?: string; account?: string }> }) {
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
      {/* Phase 2 A3: can the cockpit be trusted right now (mailbox, HubSpot, suppression, sender, routing). */}
      <HealthStrip />
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
          ) : lane === 'deals' ? (
            <InDealsLane accounts={data.gapAccounts} open={params.account?.trim() || null} />
          ) : (
            <>
            {lane === 'research' ? <EvidenceInbox accounts={data.inbox} now={new Date()} /> : null}
            {lane === 'research' ? <ResearchTheses groups={data.researchGroups} /> : null}
            <WorkQueue reloadKey={data.queueAsOf ?? undefined} sellerLane={lane} openId={openId} openPanel={openPanel} closeHref={`/gap?lane=${lane}`} reviewWaiting={data.reviewWaiting} motion={data.motion} />
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
