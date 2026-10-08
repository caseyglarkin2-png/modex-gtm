/**
 * ONE DAY BUILDER (X01, GAP OS sales execution engine, 2026-10-08). The Work page and the briefing cron call this
 * same function, so a briefing can never describe a second, inconsistent list (the mandate's section 5). The body is
 * the page's second wave moved out verbatim (R15, R41, R45, R51, R55, R60, R63 comments kept where they were). The
 * day is built over the cockpit read (`./cockpit-read.ts`, remembered two minutes per instance unless `fresh`), the
 * live pursuit summaries, the outcomes, the obligations (after the bounded follow-up sweep), the meetings, the
 * priorities, the follow-up plans and the closures. A preview (`?day=tomorrow`) reads tomorrow 8 am New York for
 * everything time-dependent while every write (the sweeps, the closure reconcile) stays at the real time, and under a
 * lane or a preview nothing is swept. Server only; nothing here renders.
 */
import { addDays, nyDay, nyDayAt } from './dates';
import { workDay, type WorkCard, type WorkDay } from './list';
import { todaySummary, type TodaySummary } from './today';
import { buyerMoves } from './commitment-model';
import { loadCompletedToday, loadMeetingRows, loadMeetingStartingPoints, loadWorkCommitments, resolveMeetingDeals } from './day-load';
import { loadAccountPriorities } from './priority';
import { loadFollowUpPlans } from '../execution/follow-up-load';
import { loadWorkOutcomes, loadPreparedMeetings } from './outcome';
import { loadPursuitSummaries } from '../pursuit/summary';
import { loadRecordedClosures, sweepClosedDeals } from '../deals/closure';
import { loadRecordedReplyIds, withoutRecordedReplies, loadAnswersOwed } from './recorded-replies';
import { resolveAccountOpportunity } from '../opportunity/active-opportunity';
import { cachedRead, type CachedRead } from './cache';
import { loadCockpit, type CockpitData } from './cockpit-read';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface LoadWorkDayOptions {
  /** An analyst lane is open: the lanes are read fresh and nothing is swept or counted as the day. */
  lane: boolean;
  /** `?day=tomorrow`: the day as it will stand tomorrow at 8 am New York, read only. */
  preview: boolean;
  /** Bypass the two-minute cockpit cache (Refresh). */
  fresh: boolean;
  /** The real time (tests and crons pass it; the page lets it default). */
  now?: Date;
}

export interface WorkDayLoad {
  read: CachedRead<CockpitData>;
  data: CockpitData;
  /** The clock everything time-dependent read (the preview's tomorrow 8 am, else the real time). */
  now: Date;
  realNow: Date;
  preview: boolean;
  day: WorkDay;
  cards: WorkCard[];
  commitments: Awaited<ReturnType<typeof loadWorkCommitments>>;
  meetings: Array<{ accountName: string; at: string; what: string; meetingId: number | null; dealId: string | null }>;
  today: TodaySummary;
}

export async function loadWorkDay(prisma: PrismaLike, opts: LoadWorkDayOptions): Promise<WorkDayLoad> {
  const { fresh } = opts;
  const read = await cachedRead('cockpit', () => loadCockpit(prisma), { fresh });
  const data = read.value;
  const realNow = opts.now ?? new Date();
  // R45: `?day=tomorrow` previews Work as it will stand tomorrow at 8 am New York (read only: every write still happens
  // at the real time, every gate re-runs at the click). Everything time-dependent below reads `now`.
  const { lane, preview } = opts;
  const now = preview ? nyDayAt(addDays(nyDay(realNow), 1), 8) : realNow;
  // R55: work scoped to a deal that left the portal's open deals is reconciled with HubSpot's closure (bounded: five
  // accounts at most, every five minutes per instance; never when the open-deal read is unavailable; real time only).
  if (!lane && !preview) {
    const openDealIds = data.workInput.inDeals.status === 'complete' ? new Set(data.workInput.inDeals.accounts.flatMap((a) => a.deals.map((d) => d.id).filter((x): x is string => !!x))) : null;
    const openDealNames = data.workInput.inDeals.status === 'complete' ? new Set(data.workInput.inDeals.accounts.flatMap((a) => a.deals.map((d) => (d.name ?? '').trim().toLowerCase()).filter(Boolean))) : null;
    await sweepClosedDeals(prisma, { now: realNow, openDealIds, openDealNames, resolve: (a) => resolveAccountOpportunity(prisma, a, {}, { timeoutMs: 8_000 }) }).catch(() => null);
  }
  // R15: the summaries come from this instance's memory, then the durable rows (one read), so a cold instance says
  // what the last workspace read said instead of falling back to the lanes.
  // R41: the obligations (after the bounded follow-up sweep), the next day's meetings and the seller's priorities are
  // read on every render, never cached with the lanes, so a write shows on the next load.
  // R60 capture once: which remembered replies were recorded since the read (one live read, in this same wave).
  const [summariesRead, outcomes, commitments, meetingRowsRaw, recordedReplies, answersOwed, preparedMeetings] = await Promise.all([
    // R63-A B3: the preview starts from what the workspace says NOW (a summary read at tomorrow's time aged out and the
    // preview fell back to cards that knew nothing of a reply, a do not contact or a hold).
    loadPursuitSummaries(prisma, data.workAccounts, realNow),
    loadWorkOutcomes(prisma, data.workAccounts, now).catch(() => new Map()),
    // The sweep writes at the real time only; the phases are read at `now`.
    lane ? Promise.resolve([]) : loadWorkCommitments(prisma, realNow, { replies: data.workInput.replies }).catch(() => []),
    // R51: every meeting row in the window, canceled ones included (Work says so and stops asking to prepare them).
    lane ? Promise.resolve([]) : loadMeetingRows(prisma, now).catch(() => []),
    loadRecordedReplyIds(prisma, data.workInput.replies.map((r) => r.id ?? '')).catch(() => new Set<string>()),
    // R63-A S4: the recorded replies still owed an answer (never forgotten the moment they are recorded).
    lane ? Promise.resolve([]) : loadAnswersOwed(prisma, realNow).catch(() => []),
    // R63-A S11: the meetings marked prepared (they leave what needs you).
    loadPreparedMeetings(prisma, data.workAccounts, realNow).catch(() => new Set<string>()),
  ]);
  // R63-A S1: the list is complete when the reply read had no further page (then a remembered "replied" with no reply
  // waiting is stale, recorded since).
  const liveRead = withoutRecordedReplies(data.workInput.replies, summariesRead, recordedReplies, { complete: !data.counts.replies.atLeast });
  const live = { ...liveRead, replies: [...liveRead.replies, ...answersOwed.filter((a) => !liveRead.replies.some((r) => r.id === a.id))] };
  const summaries = live.summaries ?? summariesRead;
  // Batch item 8: an untagged meeting belongs to the deal whose contacts it names (the brief's own rule), so its
  // preparation and its rebooking never read another deal's work.
  const meetingRows = await resolveMeetingDeals(prisma, meetingRowsRaw, data.workInput.inDeals).catch(() => meetingRowsRaw);
  const mailbox = process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || null;
  const meetings = meetingRows.filter((m) => !m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId }));
  const canceledMeetings = meetingRows.filter((m) => m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId }));
  // Sprint 5 review: a meeting or an obligation on a deal that is not open here is named from GAP's own closure record
  // (its name, outcome and date), read in this same wave and only for the accounts that hold one.
  const openIds = data.workInput.inDeals.status === 'complete' ? new Set(data.workInput.inDeals.accounts.flatMap((a) => a.deals.map((d) => d.id).filter((x): x is string => !!x))) : null;
  const closureAccounts = [...new Set([...meetingRows, ...commitments].filter((x) => !!x.dealId && /^\d+$/.test(x.dealId) && !openIds?.has(x.dealId)).map((x) => x.accountName))];
  const [priorities, followUpPlans, meetingPreps, closedDeals] = await Promise.all([
    loadAccountPriorities(prisma, [...new Set([...data.workAccounts, ...commitments.map((c) => c.accountName)])]).catch(() => new Map()),
    // R43: each follow-up due today, read off the person's own history (prepare, by hand, a saved draft, unknown, held).
    loadFollowUpPlans(prisma, commitments, { now, mailbox, held: data.workInput.held, dealAccounts: new Set(data.workInput.inDeals.status === 'complete' ? data.workInput.inDeals.accounts.map((a) => a.accountName) : []) }).catch(() => new Map()),
    // R51: each meeting's prepared starting point (objective, first thing to learn, last commitment).
    loadMeetingStartingPoints(prisma, meetingRows.filter((m) => new Date(m.at).getTime() <= now.getTime() + 24 * 3_600_000), commitments, now).catch(() => new Map()),
    closureAccounts.length ? loadRecordedClosures(prisma, closureAccounts).catch(() => new Map()) : Promise.resolve(new Map()),
  ]);
  const day = workDay({ ...data.workInput, replies: live.replies, now, summaries, outcomes, commitments, meetings, canceledMeetings, meetingPreps, priorities, followUpPlans, closedDeals, preparedMeetings });
  // R45: close the day and keep tomorrow, derived from actual state (no new storage).
  const doneToday = lane || preview ? [] : await loadCompletedToday(prisma, now).catch(() => []);
  const today = todaySummary({ now, commitments, done: doneToday, waiting: day.waiting, meetings, moved: buyerMoves(data.workInput.replies) });
  return { read, data, now, realNow, preview, day, cards: day.cards, commitments, meetings, today };
}
