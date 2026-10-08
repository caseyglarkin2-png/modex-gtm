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
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { AccountLink } from '@/components/gap/account-link';
import { toThesisCard, withRecordedNotes, type LoadedGroup } from '@/lib/gap/hypothesis/thesis-groups';
import { Breadcrumb } from '@/components/breadcrumb';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { GapCockpit, type CockpitLane } from '@/components/gap/gap-cockpit';
import Link from 'next/link';
import { WorkToday } from '@/components/gap/work-today';
import { loadWorkDay } from '@/lib/gap/work/load-day';
import { warmPursuitSummaries } from '@/lib/gap/pursuit/summary';
import { agoText as readAgo } from '@/lib/gap/work/cache';
import { todayListenText } from '@/lib/gap/voice/today';
import { WorkList } from '@/components/gap/work-list';
import { ThesisGroupReview } from '@/components/gap/thesis-group-review';
import { ActionPackView } from '@/components/gap/action-pack-view';
import { RunRoutingPanel } from '@/components/gap/run-routing-panel';
import { HypothesisList } from './hypotheses/hypothesis-list';
import { RepliesTriage } from './replies/replies-triage';
import { WorkQueue } from './work-queue';
import { HealthStrip } from '@/components/gap/health-strip';
import { EvidenceAccount } from '@/components/gap/evidence-inbox';
import { researchSections, type InboxAccount } from '@/lib/gap/research/inbox';
import { type InDealsSummary } from '@/lib/gap/deals/in-deals';
import { loadDealBrief } from '@/lib/gap/deals/deal-brief';
import { DealBriefView } from '@/components/gap/deal-brief';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP' };

const LANES: ReadonlySet<string> = new Set(['review', 'research', 'ready', 'follow_up', 'replies', 'deals']);

const LANE_TITLE: Record<CockpitLane, string> = {
  review: 'Review: do I believe this?',
  research: 'Research: find evidence or contact data',
  ready: 'Ready: contact now',
  follow_up: 'Follow up: next touch due',
  replies: 'Replies: what did the buyer tell you?',
  deals: 'In deals: learn, do not prospect',
};


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
  if (!session?.user?.email) redirect(loginHref('/gap/'));

  const params = (await searchParams) ?? {};
  const lane = (params.lane && LANES.has(params.lane) ? params.lane : null) as CockpitLane | null;
  const openId = params.open?.trim() || null;
  // UX-14: the cockpit read is remembered for two minutes per instance (Refresh bypasses); the Work cards are built
  // now over the live pursuit summaries, so a workspace visit shows on the next Work load without a re-read.
  // Work may serve a two-minute-old read; an open lane (the analyst's decisions) always reads fresh.
  const fresh = params.fresh === '1' || !!lane;
  const preview = params.day === 'tomorrow' && !lane;
  // X01: the one day builder (the briefing cron reads the same function); the page only renders what it returns.
  const { read, data, realNow, day, cards: work, today } = await loadWorkDay(prisma, { lane: !!lane, preview, fresh });
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
        <p className="mt-1 text-sm text-[var(--muted-foreground)]" data-testid="work-subtitle">{lane ? 'An analyst view: every account in one list. Work holds your day.' : preview ? 'The accounts that will need you tomorrow, in order: a preview.' : 'The accounts that need you today, in order. Open one, do the move, record it, then go to the next.'}</p>
      </div>
      <GapSubnav />
      {/* Phase 2 A3: can the cockpit be trusted right now (mailbox, HubSpot, suppression, sender, routing). */}
      <HealthStrip />
      {/* UX-10: the six lane tiles are the analyst's lanes; on Work the chips carry the counts, so the tiles show only inside a lane. */}
      {lane ? <GapCockpit data={{ ...data.counts, active: lane }} /> : null}

      {/* R60: the routing repair is the system's, never the top of the seller's day: it lives in System at the foot. */}
      {lane && data.unrouted > 0 ? (
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
          <WorkList when={preview ? 'tomorrow' : 'today'} cards={work} snoozed={day.snoozed} waiting={day.waiting} counts={day.counts} focus={/^[a-z0-9-]{1,120}$/.test(params.focus ?? '') ? (params.focus as string) : null} listenText={todayListenText(work)} readAt={{ at: read.at, label: read.fromCache ? `Read ${readAgo(read.at, realNow)}` : 'Read just now' }} />
        </>
      )}

      {!lane || data.unrouted === 0 ? (
        <details className="rounded-md border border-[var(--border)] p-3 text-xs" data-testid="system-details">
          <summary className="cursor-pointer text-[var(--muted-foreground)]">{data.unrouted > 0 ? `System: ${data.unrouted} ${data.unrouted === 1 ? 'person needs' : 'people need'} a recommendation` : 'System'}</summary>
          <div className="mt-3 space-y-2">
            {data.unrouted > 0 ? (
              <p data-testid="unrouted-notice">
                {data.unrouted} {data.unrouted === 1 ? 'person is' : 'people are'} in use without a current recommendation. One routing pass fixes it; it creates cards only and contacts no one.
              </p>
            ) : null}
            {routingPanel}
          </div>
        </details>
      ) : null}
    </div>
  );
}
