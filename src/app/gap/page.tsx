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
import { after } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { AccountLink } from '@/components/gap/account-link';
import { listReplies } from '@/lib/gap/replies/list';
import { listAllCurrent } from '@/lib/gap/routing/queue';
import { cockpitOpenHref, type ReviewWaiting } from '@/lib/gap/routing/card-readiness';
import { loadThesisGroups, splitThesisWork, orderGroupsForReview, toThesisCard, withRecordedNotes, type LoadedGroup } from '@/lib/gap/hypothesis/thesis-groups';
import { resolveRoutableHypothesisScope } from '@/lib/gap/routing/run';
import { Breadcrumb } from '@/components/breadcrumb';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { GapCockpit, type CockpitLane } from '@/components/gap/gap-cockpit';
import Link from 'next/link';
import { WorkToday } from '@/components/gap/work-today';
import { todaySummary } from '@/lib/gap/work/today';
import { buyerMoves } from '@/lib/gap/work/commitment-model';
import { addDays, nyDay, nyDayAt } from '@/lib/gap/work/dates';
import { buildNextUpCandidates } from '@/lib/gap/routing/next-up';
import { workDay, type WorkCard, type WorkInput } from '@/lib/gap/work/list';
import { loadCompletedToday, loadMeetingRows, loadMeetingStartingPoints, loadWorkCommitments } from '@/lib/gap/work/day-load';
import { loadAccountPriorities } from '@/lib/gap/work/priority';
import { loadFollowUpPlans } from '@/lib/gap/execution/follow-up-load';
import { loadWorkOutcomes } from '@/lib/gap/work/outcome';
import { loadPursuitSummaries, warmPursuitSummaries } from '@/lib/gap/pursuit/summary';
import { loadSendableTheses } from '@/lib/gap/pursuit/load';
import { loadMotionChoices, loadRecentFirstTouchAccounts } from '@/lib/gap/motion/load';
import { agoText as readAgo, cachedRead } from '@/lib/gap/work/cache';
import { todayListenText } from '@/lib/gap/voice/today';
import { WorkList } from '@/components/gap/work-list';
import { laneWithMotion, loadCockpitMotions, type CockpitMotions } from '@/lib/gap/motion/cockpit';
import { ThesisGroupReview } from '@/components/gap/thesis-group-review';
import { ActionPackView } from '@/components/gap/action-pack-view';
import { RunRoutingPanel } from '@/components/gap/run-routing-panel';
import { HypothesisList } from './hypotheses/hypothesis-list';
import { RepliesTriage } from './replies/replies-triage';
import { WorkQueue } from './work-queue';
import { HealthStrip } from '@/components/gap/health-strip';
import { EvidenceAccount } from '@/components/gap/evidence-inbox';
import { loadEvidenceInbox, researchSections, type InboxAccount } from '@/lib/gap/research/inbox';
import { loadInDealsSummary, type InDealsSummary } from '@/lib/gap/deals/in-deals';
import { loadDealBrief } from '@/lib/gap/deals/deal-brief';
import { DealBriefView } from '@/components/gap/deal-brief';
import { sweepClosedDeals } from '@/lib/gap/deals/closure';
import { resolveAccountOpportunity } from '@/lib/gap/opportunity/active-opportunity';

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
  const [routableScope, queue, repliesPage, rawGroups, active, inDeals] = await Promise.all([
    resolveRoutableHypothesisScope(prisma),
    listAllCurrent(prisma),
    listReplies(prisma, { state: 'undispositioned', limit: REPLY_TILE_LIMIT }),
    // Every current thesis, one-person ones included, with server-derived actionability.
    loadThesisGroups(prisma, {}, { singletons: true }).catch((): LoadedGroup[] => []),
    prisma.prospectingHypothesis.findMany({ where: { status: 'active', primary_persona_id: { not: null } }, select: { primary_persona_id: true } }),
    // The ONE In Deals answer (tile and lane): open HubSpot deals mapped to GAP accounts, cached minutes, timestamped.
    loadInDealsSummary(prisma).catch((e): InDealsSummary => ({ status: 'unavailable', count: null, accounts: [], unresolved: [], checkedAt: new Date().toISOString(), openDeals: 0, error: e instanceof Error ? e.message : String(e) })),
  ]);
  const groups = orderGroupsForReview(rawGroups);
  const now = new Date();
  // Phase 2 C: one cold email motion per account. A held email card is never READY; it waits as NEXT.
  // A failed motion read shows every card (every send gate still enforces one motion per account).
  // A failed read holds every READY card (fail closed): nothing presents as READY that the click would refuse.
  const motion: CockpitMotions = await loadCockpitMotions(prisma, queue.items, now).catch(() => ({ motions: [], heldCardIds: [], thesisHeldCardIds: queue.items.filter((i) => i.hypothesis?.id).map((i) => i.id) }));
  const held = new Set(motion.heldCardIds);
  const thesisHeld = new Set(motion.thesisHeldCardIds ?? []);
  const lanes = queue.items.map((item) => ({ item, lane: laneWithMotion(item, held, thesisHeld) }));
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
  const candidates = buildNextUpCandidates({
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
    });
  // UX-08: WORK, one card per account in the same order, over the same reads (never a second state engine).
  const heldWhy = new Map<string, 'active_opportunity' | 'opportunity_unknown'>();
  for (const it of queue.items) {
    if (it.ruleId === 'opportunity_unknown') heldWhy.set(it.account.name, 'opportunity_unknown');
    else if (it.ruleId === 'active_opportunity' && !heldWhy.has(it.account.name)) heldWhy.set(it.account.name, 'active_opportunity');
  }
  // R14: an account GAP touched (a proven send, an outstanding draft) is Work even when the lanes hold no card for it.
  const recentTouches = await loadRecentFirstTouchAccounts(prisma, now).catch(() => new Map());
  const workAccounts = [...new Set([...candidates.map((c) => c.accountName).filter((x): x is string => !!x), ...repliesPage.items.map((r) => r.accountName), ...inDeals.accounts.map((a) => a.accountName), ...recentTouches.keys()])];
  // What the database alone says per Work account, on every load (no HubSpot): a usable thesis exists; the recorded
  // chosen person. A cold instance then still agrees with the workspace on READY and on research (Pass A blocker).
  const choicesAll = await loadMotionChoices(prisma, workAccounts).catch(() => new Map());
  const chosenIds = [...new Set([...[...choicesAll.values()].map((c) => c.primaryPersonaId), ...[...recentTouches.values()].map((t) => t.personaId).filter((x): x is number => typeof x === 'number')])];
  const personaRows = chosenIds.length ? ((await prisma.persona.findMany({ where: { id: { in: chosenIds } }, select: { id: true, name: true, title: true } }).catch(() => [])) as Array<{ id: number; name: string | null; title: string | null }>) : [];
  const personaById = new Map(personaRows.map((p) => [p.id, p]));
  const dbState = new Map<string, { sendable: boolean; chosen: { name: string; title: string | null } | null }>();
  for (const name of workAccounts) {
    const sendable = await loadSendableTheses(prisma, name, now).catch(() => null);
    if (sendable === null) continue;
    const choice = choicesAll.get(name);
    const p = choice ? personaById.get(choice.primaryPersonaId) : undefined;
    dbState.set(name, { sendable: sendable.size > 0, chosen: p?.name ? { name: p.name, title: p.title } : null });
  }
  // The pieces the Work cards are built from; the cards themselves are built at render over the live pursuit summaries.
  const inMotion = new Map<string, { state: 'sent' | 'drafted'; at: string; person: { name: string; title: string | null } | null }>();
  for (const [name, t] of recentTouches) {
    const p = t.personaId != null ? personaById.get(t.personaId) : undefined;
    inMotion.set(name, { state: t.state, at: t.at, person: p?.name ? { name: p.name, title: p.title } : t.recipient ? { name: t.recipient, title: null } : null });
  }
  const workInput: Omit<WorkInput, 'summaries'> = {
    now,
    candidates,
    dbState,
    inMotion,
    replies: repliesPage.items.map((r) => ({ accountName: r.accountName, contactEmail: r.contactEmail, subject: r.subject, snippet: r.snippet, receivedAt: r.receivedAt, id: r.id, threadId: r.threadId ?? null, fromName: r.fromName ?? null, personaId: r.personaId })),
    mailbox: process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || null,
    motions: motion.motions.map((m) => ({ accountName: m.accountName, state: m.state, primary: m.primary ? { name: m.primary.name, title: m.primary.title } : null, next: m.next ? { name: m.next.name, title: m.next.title, unlock: m.next.unlock } : null })),
    // R50: each deal keeps its HubSpot id (an obligation names its deal; Capture binds a note to it by id).
    inDeals: { status: inDeals.status, accounts: inDeals.accounts.map((a) => ({ accountName: a.accountName, deals: a.deals.map((d) => ({ ...(d.id ? { id: d.id } : {}), name: d.name, stage: d.stage, lastActivityAt: d.lastActivityAt ?? null, closeDate: d.closeDate ?? null })) })) },
    held: heldWhy,
  };

  const routableHypotheses = 'tooLarge' in routableScope ? 0 : routableScope.hypothesesCount;
  const routableAccounts = 'tooLarge' in routableScope ? routableScope.accountCount : routableScope.accountNames.length;
  return {
    counts: {
      review: reviewGroups.length + readyOneOffIds.length,
      research: research.length + researchGroups.length,
      ready: ready.length,
      followUp: followUp.length,
      replies: { count: repliesPage.items.length, atLeast: repliesPage.nextCursor !== null },
      deals: { count: inDeals.count, unresolved: inDeals.unresolved.length, checkedAt: inDeals.checkedAt },
    },
    inDeals,
    workInput,
    workAccounts,
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

/**
 * RESEARCH, account-centric (2026-09-28): ONE section per account holding that account's verified evidence,
 * its next step, and the theses at that account that need verified evidence. Nothing from one account is
 * rendered inside another's section (a General Mills fact never sits above a PepsiCo thesis). Accounts with
 * evidence come first (the inbox order), then accounts that only have theses waiting.
 */
async function ResearchByAccount({ inbox, groups, now }: { inbox: InboxAccount[]; groups: LoadedGroup[]; now: Date }) {
  const cards = await withRecordedNotes(prisma, groups.map(toThesisCard));
  const sections = researchSections(inbox, cards);
  return (
    <section data-testid="research-accounts" className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Research, by account</h3>
        <p className="text-xs text-[var(--muted-foreground)]">Verified at the source before you got here, one account at a time. You decide what it means; nothing is approved for you.</p>
      </div>
      {sections.length === 0 ? <p className="text-sm italic text-[var(--muted-foreground)]">Nothing new from research.</p> : null}
      {sections.map(({ account: a, cards: own }) => {
        return (
          <EvidenceAccount key={a.accountName} a={a} now={now} thesesNeedingEvidence={own.length}>
            {/* Always mounted per account (like ReviewLane): using evidence on this account's last research thesis
                empties this list, and the outcome with its review link must survive the refresh. */}
            <div className="space-y-2" data-testid="research-theses" data-account={a.accountName}>
              {own.length ? <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{a.accountName} theses that need verified evidence</p> : null}
              <ThesisGroupReview cards={own} intro={false} />
            </div>
          </EvidenceAccount>
        );
      })}
    </section>
  );
}

const agoText = (iso: string, now: Date) => {
  const m = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
};

/**
 * Phase 2 F1, one authoritative read (2026-10-01): every GAP account HubSpot says is in an open deal, from the
 * same summary the tile counts. An open deal no GAP account maps to is listed apart (identity work); a read
 * that could not complete says so instead of showing nothing.
 */
async function InDealsLane({ summary, open }: { summary: InDealsSummary; open: string | null }) {
  const now = new Date();
  const inDeals = summary.accounts;
  const opened = open ? inDeals.find((a) => a.accountName === open || a.alsoRecordedAs.includes(open)) ?? null : null;
  const brief = opened ? await loadDealBrief(prisma, opened.accountName, { now, dealContacts: opened.dealContacts }) : null;
  return (
    <div className="space-y-4" data-testid="in-deals">
      <p className="text-sm text-[var(--muted-foreground)]" data-testid="in-deals-freshness">
        {summary.status === 'complete'
          ? `${summary.count} ${summary.count === 1 ? 'account' : 'accounts'} in deals · ${summary.openDeals} open HubSpot ${summary.openDeals === 1 ? 'deal' : 'deals'} · checked ${agoText(summary.checkedAt, now)}.`
          : `Could not verify HubSpot (checked ${agoText(summary.checkedAt, now)}). Check HubSpot directly before contacting anyone; every send re-checks at the click.`}{' '}
        No cold first touch goes to these accounts; work them from the deal and learn what is still unknown.
      </p>
      {open && !opened ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          {summary.status !== 'complete'
            ? `HubSpot could not be checked just now, so there is no Deal Brief to show for ${open}. Check HubSpot directly.`
            : `HubSpot shows no open deal for ${open} right now, so there is no Deal Brief to show.`}
        </p>
      ) : null}
      {summary.status === 'complete' && inDeals.length === 0 ? <p className="text-sm italic text-[var(--muted-foreground)]">No GAP account has an open HubSpot deal right now.</p> : null}
      <ul className="space-y-3">
        {inDeals.map((a) => (
          <li key={a.accountName} className="space-y-2 rounded-md border border-[var(--border)] p-3" data-testid={`in-deal-${a.accountName}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                <AccountLink name={a.accountName} />
                {a.alsoRecordedAs.length ? <span className="ml-1 text-xs font-normal text-[var(--muted-foreground)]">(also recorded as {a.alsoRecordedAs.join(', ')})</span> : null}
              </p>
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
      {summary.unresolved.length ? (
        <section data-testid="in-deals-unresolved" className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-semibold">Open deals not matched to a GAP account ({summary.unresolved.length})</p>
          <p className="text-xs">HubSpot has these open deals, but no GAP account carries their company or contacts. This is identity work (map or add the account), not an absence of a deal.</p>
          <ul className="text-xs">
            {summary.unresolved.map((u, i) => (
              <li key={i} className="break-words">
                {u.dealName ? `"${u.dealName}"` : 'Unnamed deal'} · {u.stage}
                {u.companies.length ? <span className="text-[var(--muted-foreground)]"> · {u.companies.join(', ')}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default async function GapCockpitPage({ searchParams }: { searchParams?: Promise<{ lane?: string; open?: string; account?: string; filter?: string; q?: string; focus?: string; fresh?: string; day?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const params = (await searchParams) ?? {};
  const lane = (params.lane && LANES.has(params.lane) ? params.lane : null) as CockpitLane | null;
  const openId = params.open?.trim() || null;
  // UX-14: the cockpit read is remembered for two minutes per instance (Refresh bypasses); the Work cards are built
  // now over the live pursuit summaries, so a workspace visit shows on the next Work load without a re-read.
  // Work may serve a two-minute-old read; an open lane (the analyst's decisions) always reads fresh.
  const fresh = params.fresh === '1' || !!lane;
  const read = await cachedRead('cockpit', loadCockpit, { fresh });
  const data = read.value;
  const realNow = new Date();
  // R45: `?day=tomorrow` previews Work as it will stand tomorrow at 8 am New York (read only: every write still happens
  // at the real time, every gate re-runs at the click). Everything time-dependent below reads `now`.
  const preview = params.day === 'tomorrow' && !lane;
  const now = preview ? nyDayAt(addDays(nyDay(realNow), 1), 8) : realNow;
  // R55: work scoped to a deal that left the portal's open deals is reconciled with HubSpot's closure (bounded: five
  // accounts at most, every five minutes per instance; never when the open-deal read is unavailable; real time only).
  if (!lane && !preview) {
    const openDealIds = data.workInput.inDeals.status === 'complete' ? new Set(data.workInput.inDeals.accounts.flatMap((a) => a.deals.map((d) => d.id).filter((x): x is string => !!x))) : null;
    await sweepClosedDeals(prisma, { now: realNow, openDealIds, resolve: (a) => resolveAccountOpportunity(prisma, a, {}, { timeoutMs: 8_000 }) }).catch(() => null);
  }
  // R15: the summaries come from this instance's memory, then the durable rows (one read), so a cold instance says
  // what the last workspace read said instead of falling back to the lanes.
  // R41: the obligations (after the bounded follow-up sweep), the next day's meetings and the seller's priorities are
  // read on every render, never cached with the lanes, so a write shows on the next load.
  const [summaries, outcomes, commitments, meetingRows] = await Promise.all([
    loadPursuitSummaries(prisma, data.workAccounts, now),
    loadWorkOutcomes(prisma, data.workAccounts, now).catch(() => new Map()),
    // The sweep writes at the real time only; the phases are read at `now`.
    lane ? Promise.resolve([]) : loadWorkCommitments(prisma, realNow, { replies: data.workInput.replies }).catch(() => []),
    // R51: every meeting row in the window, canceled ones included (Work says so and stops asking to prepare them).
    lane ? Promise.resolve([]) : loadMeetingRows(prisma, now).catch(() => []),
  ]);
  const mailbox = process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || null;
  const meetings = meetingRows.filter((m) => !m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId }));
  const canceledMeetings = meetingRows.filter((m) => m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId }));
  const [priorities, followUpPlans, meetingPreps] = await Promise.all([
    loadAccountPriorities(prisma, [...new Set([...data.workAccounts, ...commitments.map((c) => c.accountName)])]).catch(() => new Map()),
    // R43: each follow-up due today, read off the person's own history (prepare, by hand, a saved draft, unknown, held).
    loadFollowUpPlans(prisma, commitments, { now, mailbox, held: data.workInput.held, dealAccounts: new Set(data.workInput.inDeals.status === 'complete' ? data.workInput.inDeals.accounts.map((a) => a.accountName) : []) }).catch(() => new Map()),
    // R51: each meeting's prepared starting point (objective, first thing to learn, last commitment).
    loadMeetingStartingPoints(prisma, meetingRows.filter((m) => new Date(m.at).getTime() <= now.getTime() + 24 * 3_600_000), commitments, now).catch(() => new Map()),
  ]);
  const day = workDay({ ...data.workInput, now, summaries, outcomes, commitments, meetings, canceledMeetings, meetingPreps, priorities, followUpPlans });
  const work: WorkCard[] = day.cards;
  // R45: close the day and keep tomorrow, derived from actual state (no new storage).
  const doneToday = lane || preview ? [] : await loadCompletedToday(prisma, now).catch(() => []);
  const today = todaySummary({ now, commitments, done: doneToday, waiting: day.waiting, meetings, moved: buyerMoves(data.workInput.replies) });
  // UX-08 parity: after the response is sent, read the canonical pursuit state for the first few Work accounts
  // that have none remembered (serial, bounded, never blocking a render), so the next Work load says what the
  // workspace says.
  if (!lane && !preview) after(() => warmPursuitSummaries(prisma, work.filter((c) => c.source === 'cockpit').map((c) => c.accountName)).catch(() => []));

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
      {/* UX-10: the six lane tiles are the analyst's lanes; on Work the chips carry the counts, so the tiles show only inside a lane. */}
      {lane ? <GapCockpit data={{ ...data.counts, active: lane }} /> : null}

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
            <InDealsLane summary={data.inDeals} open={params.account?.trim() || null} />
          ) : (
            <>
            {lane === 'research' ? <ResearchByAccount inbox={data.inbox} groups={data.researchGroups} now={new Date()} /> : null}
            <WorkQueue reloadKey={data.queueAsOf ?? undefined} sellerLane={lane} openId={openId} openPanel={openPanel} closeHref={`/gap?lane=${lane}`} reviewWaiting={data.reviewWaiting} motion={data.motion} />
            </>
          )}
        </section>
      ) : (
        <>
          {/* UX-08: WORK is the landing: the accounts that need the seller, one card each, the lanes as filters. */}
          {preview ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm" data-testid="work-preview">
              Tomorrow at 8:00 AM New York, as Work will hold it then: a preview. Nothing here happens until then, and every action still runs its checks when you press it. <Link href="/gap" className="underline">Back to today</Link>
            </p>
          ) : null}
          <WorkToday today={today} preview={preview} />
          {!preview ? <Link href="/gap?day=tomorrow" className="inline-flex min-h-11 items-center text-xs underline" data-testid="work-tomorrow-link">See tomorrow</Link> : null}
          {/* R45: Work is the one list. The legacy NEXT UP fallback no longer competes with it when it is empty. */}
          <WorkList cards={work} snoozed={day.snoozed} waiting={day.waiting} counts={day.counts} focus={/^[a-z0-9-]{1,120}$/.test(params.focus ?? '') ? (params.focus as string) : null} listenText={todayListenText(work)} readAt={{ at: read.at, label: read.fromCache ? `Read ${readAgo(read.at, realNow)}` : 'Read just now' }} />
        </>
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
