/**
 * THE WORK DAY'S READS (GAP OS execution recovery, R41 / R45, 2026-10-06). Server only. What Work needs beyond the
 * cockpit's cached lanes, read on every render (never cached with the lanes, so a write shows on the next load):
 *
 *   commitments   every commitment (work/commitments.ts), after the bounded follow-up sweep over the send ledger
 *   meetings      the calendar's meetings in the next two days (the Meeting table), the time of day read in New
 *                 York when the row carries one; R51: a canceled one is returned apart (Work says it was canceled
 *                 and stops asking to prepare it), and each upcoming one carries its prepared starting point
 *
 * Soft: an unreadable store reads as nothing and never fails the page (the send gates fail closed on their own).
 */
import { loadCommitments, syncFollowUpsFromLedger, syncReturnRemindersFromReplies } from './commitments';
import { COMMITMENT_EVENT, type Commitment } from './commitment-model';
import { addDays, dayLabel, nyDay, nyDayAt } from './dates';
import type { DoneItem } from './today';
import { DIRECT_SENT, DRAFT_SENT, DRAFT_SUBJECT_TYPE, MANUAL_SENT, REPLY_SENT } from '../execution/draft-ledger';
import { WORK_OUTCOME } from './outcome';
import { isCanceled, meetingDeal, meetingInstant, parseTimeOfDay, prepareMeeting } from '../deals/meeting-prep';
import { openQuestionsFor, unknownSectionsOfTypes } from '../deals/deal-brief';
import { selectConfirmedBids } from '../bid/select';
import { accountHref } from '../account-intel/href';

export { parseTimeOfDay };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** The follow-up sweep writes at most this often per instance (a burst of Work loads costs one sweep). */
export const SWEEP_MIN_INTERVAL_MS = 60_000;
let lastSweep = 0;

export async function loadWorkCommitments(prisma: PrismaLike, now: Date, opts: { sweep?: boolean; replies?: Parameters<typeof syncReturnRemindersFromReplies>[1] } = {}): Promise<Commitment[]> {
  if (opts.sweep !== false && now.getTime() - lastSweep >= SWEEP_MIN_INTERVAL_MS) {
    lastSweep = now.getTime();
    await syncFollowUpsFromLedger(prisma, now).catch(() => null);
    // R42: an out-of-office return day moves the follow-up (after the sweep, so a fresh follow-up is moved too).
    if (opts.replies?.length) await syncReturnRemindersFromReplies(prisma, opts.replies, now).catch(() => null);
  }
  return loadCommitments(prisma).catch(() => []);
}

/** Test seam. */
export function resetWorkSweep(): void {
  lastSweep = 0;
}

export interface MeetingOnRecord {
  meetingId: number;
  accountName: string;
  at: string;
  what: string;
  canceled: boolean;
  dealId: string | null;
  attendees: string | null;
  objective: string | null;
  updatedAt: string;
  createdAt: string;
  /** Batch item 8: where the deal came from: the row's own deal id, or the deal its attendees name. */
  dealBasis?: 'row' | 'attendees' | null;
}

/** Every meeting row in the window (yesterday to the horizon), canceled ones included and marked. Soft. */
export async function loadMeetingRows(prisma: PrismaLike, now: Date, horizonMs = 48 * 3_600_000): Promise<MeetingOnRecord[]> {
  if (typeof prisma?.meeting?.findMany !== 'function') return [];
  const rows: Array<{ id: number; account_name: string; meeting_date: Date | null; meeting_time: string | null; meeting_status: string; objective: string | null; persona: string | null; hubspot_deal_id: string | null; created_at: Date; updated_at: Date }> = await prisma.meeting
    // Batch item 8: a date-only row is stored at UTC midnight of its own day, so the window opens at yesterday's UTC
    // midnight (New York calendar), never `now - 24h` (which dropped today's evening meetings after 8 pm New York).
    .findMany({ where: { meeting_date: { gte: new Date(`${addDays(nyDay(now), -1)}T00:00:00.000Z`), lte: new Date(now.getTime() + horizonMs) } }, select: { id: true, account_name: true, meeting_date: true, meeting_time: true, meeting_status: true, objective: true, persona: true, hubspot_deal_id: true, created_at: true, updated_at: true } })
    .catch(() => []);
  const out: MeetingOnRecord[] = [];
  for (const r of rows) {
    if (/no meeting/i.test(r.meeting_status)) continue;
    // A date-only row is stored at UTC midnight: its calendar day is the UTC date, never the New York evening before.
    const at = meetingInstant(r.meeting_date, r.meeting_time);
    if (!at) continue;
    out.push({ meetingId: r.id, accountName: r.account_name, at: at.toISOString(), what: r.objective?.trim() || r.meeting_status, canceled: isCanceled(r.meeting_status), dealId: r.hubspot_deal_id ?? null, dealBasis: r.hubspot_deal_id ? 'row' : null, attendees: r.persona ?? null, objective: r.objective ?? null, updatedAt: new Date(r.updated_at ?? r.created_at ?? now).toISOString(), createdAt: new Date(r.created_at ?? now).toISOString() });
  }
  return out;
}

/**
 * Batch item 8: an untagged meeting belongs to the deal whose contacts it names (the brief's own rule, deals/meeting-prep
 * `meetingDeal`): one deal only, else it stays account-level. Read once for Work (its preparation, its rebooking and its
 * deal label use the result), from the open deals' HubSpot contacts and the names GAP holds for them. Soft: without a
 * complete open-deal read, or a name read, the rows stay as they are.
 */
export async function resolveMeetingDeals(
  prisma: PrismaLike,
  rows: readonly MeetingOnRecord[],
  inDeals: { status: 'complete' | 'unavailable'; accounts: ReadonlyArray<{ accountName: string; deals: ReadonlyArray<{ id?: string; contactIds?: readonly string[] }> }> },
): Promise<MeetingOnRecord[]> {
  const untagged = rows.filter((r) => !r.dealId && r.attendees);
  if (!untagged.length || inDeals.status !== 'complete' || typeof prisma?.persona?.findMany !== 'function') return [...rows];
  const byAccount = new Map(inDeals.accounts.map((a) => [a.accountName, a.deals.filter((d): d is { id: string; contactIds?: readonly string[] } => !!d.id)]));
  const ids = [...new Set(untagged.flatMap((r) => (byAccount.get(r.accountName) ?? []).flatMap((d) => (d.contactIds ?? []).map(String))))];
  if (!ids.length) return [...rows];
  const people: Array<{ name: string | null; hubspot_contact_id: string | null }> = await prisma.persona.findMany({ where: { hubspot_contact_id: { in: ids } }, select: { name: true, hubspot_contact_id: true } }).catch(() => []);
  const nameOf = new Map(people.filter((p) => p.name && p.hubspot_contact_id).map((p) => [String(p.hubspot_contact_id), String(p.name)]));
  return rows.map((r) => {
    if (r.dealId || !r.attendees) return r;
    const deals = (byAccount.get(r.accountName) ?? []).map((d) => ({ id: d.id, contacts: (d.contactIds ?? []).map((c) => nameOf.get(String(c))).filter((n): n is string => !!n).map((name) => ({ name })) }));
    const own = meetingDeal({ dealId: null, attendees: r.attendees }, deals);
    return own ? { ...r, dealId: own.id, dealBasis: 'attendees' as const } : r;
  });
}

export async function loadUpcomingMeetings(prisma: PrismaLike, now: Date, horizonMs = 48 * 3_600_000): Promise<Array<{ accountName: string; at: string; what: string; meetingId?: number; dealId?: string | null }>> {
  return (await loadMeetingRows(prisma, now, horizonMs)).filter((m) => !m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId }));
}

/**
 * R51: the prepared starting point for each meeting Work shows (objective, the first thing to learn, the last
 * commitment, how much the buyer confirmed), from the meeting row, the account's obligations and its confirmed
 * buyer words. One read of the buyer words for the meeting accounts; soft (a failed read prepares from the rest).
 */
export async function loadMeetingStartingPoints(prisma: PrismaLike, meetings: readonly MeetingOnRecord[], commitments: readonly Commitment[], now: Date): Promise<Map<number, { prep: string; href: string }>> {
  const out = new Map<number, { prep: string; href: string }>();
  const live = meetings.filter((m) => !m.canceled);
  if (live.length === 0) return out;
  const accounts = [...new Set(live.map((m) => m.accountName))];
  type BidRow = { id: string; account_name: string; type: string; raw_buyer_language: string; contact_email: string; human_confirmed: boolean; supersedes_id: string | null; confirmed_at: Date | null; captured_at: Date; metadata: unknown };
  const bids: BidRow[] = typeof prisma?.buyerInputData?.findMany === 'function'
    ? await prisma.buyerInputData.findMany({ where: { account_name: { in: accounts } }, select: { id: true, account_name: true, type: true, raw_buyer_language: true, contact_email: true, human_confirmed: true, supersedes_id: true, confirmed_at: true, captured_at: true, metadata: true } }).catch(() => [])
    : [];
  const confirmed = selectConfirmedBids(bids.map((b) => ({ ...b, humanConfirmed: b.human_confirmed === true, supersedesId: b.supersedes_id })));
  const dealOfBid = (b: BidRow): string | null => {
    const s = b.metadata && typeof b.metadata === 'object' ? (b.metadata as { scope?: { dealId?: unknown } }).scope : undefined;
    return typeof s?.dealId === 'string' ? s.dealId : null;
  };
  for (const m of live) {
    // A meeting on a deal reads that deal's words and the unscoped ones, never another deal's.
    const own = confirmed.filter((b) => b.account_name === m.accountName && (!m.dealId || !dealOfBid(b) || dealOfBid(b) === m.dealId));
    const cs = commitments.filter((c) => c.accountName === m.accountName && (!m.dealId || !c.dealId || c.dealId === m.dealId));
    const p = prepareMeeting({
      meeting: { id: m.meetingId, at: m.at, status: m.canceled ? 'Canceled' : 'Scheduled', objective: m.objective, attendees: m.attendees, dealId: m.dealId, createdAt: m.createdAt, updatedAt: m.updatedAt },
      now,
      deal: null,
      people: [],
      commitments: cs.map((c) => ({ title: c.title, kind: c.kind, status: c.status, line: c.status, createdAt: c.createdAt, updatedAt: c.updatedAt, person: c.person ? { name: c.person.name } : null, scopeLabel: c.dealId ? 'the deal' : 'account-level' })),
      needs: own.map((b) => ({ type: b.type, quote: b.raw_buyer_language, who: b.contact_email, at: new Date(b.confirmed_at ?? b.captured_at).toISOString(), scopeLabel: dealOfBid(b) ? 'the deal' : 'account-level' })),
      unknownQuestions: openQuestionsFor(unknownSectionsOfTypes(own.map((b) => b.type))),
      learningObjective: null,
      guesses: [],
      publicFacts: [],
      materials: [],
    });
    out.set(m.meetingId, { prep: p.startingPoint, href: `${accountHref(m.accountName)}?view=brief#meeting-${m.meetingId}` });
  }
  return out;
}

const words = (s: unknown) => String(s ?? '').replace(/_/g, ' ');
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * R45: what was completed TODAY (the New York day of `now`), read from the ledger and the dispositions, never from a
 * screen: sends GAP proved (direct, manual, a sent draft), answers recorded by a person, obligations done or skipped,
 * notes saved, the seller's own outcomes, and (R42b) an answer to a reply sent from GAP in their thread. Nothing is
 * stored for it; tomorrow it reads as yesterday's, never as done again. Soft: an unreadable ledger reads as nothing
 * done (and says so nowhere as success). Bounded to the NEWEST 500 rows of the day (read newest first, shown in
 * order): on a busy day the oldest rows drop, never the latest completion.
 */
export async function loadCompletedToday(prisma: PrismaLike, now: Date): Promise<DoneItem[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const start = nyDayAt(nyDay(now), 0);
  const rows: Array<{ kind: string; subject_type: string; subject_id: string; payload: unknown; created_at: Date }> = await prisma.gapAuditEvent
    .findMany({
      where: { created_at: { gte: start, lte: now }, kind: { in: [DIRECT_SENT, MANUAL_SENT, DRAFT_SENT, REPLY_SENT, 'disposition.recorded', COMMITMENT_EVENT, 'capture.note', WORK_OUTCOME] } },
      select: { kind: true, subject_type: true, subject_id: true, payload: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: 500,
    })
    .catch(() => []);
  const out: DoneItem[] = [];
  for (const r of [...rows].reverse()) {
    const p = isObj(r.payload) ? r.payload : {};
    const at = new Date(r.created_at).toISOString();
    if ((r.kind === DIRECT_SENT || r.kind === MANUAL_SENT) && r.subject_type === DRAFT_SUBJECT_TYPE) {
      out.push({ at, accountName: typeof p.accountName === 'string' ? p.accountName : null, line: `Sent touch ${Number(p.stepIndex ?? 0) + 1} to ${String(p.recipient ?? 'them')}${p.reconciledFromSent ? ' (found in Sent)' : ''}.` });
    } else if (r.kind === REPLY_SENT) {
      out.push({ at, accountName: typeof p.accountName === 'string' ? p.accountName : null, line: `Answered ${String(p.recipient ?? 'them')} in their thread.` });
    } else if (r.kind === DRAFT_SENT) {
      out.push({ at, accountName: null, line: 'A GAP draft was sent from Gmail.' });
    } else if (r.kind === 'disposition.recorded' && p.humanConfirmed === true) {
      out.push({ at, accountName: typeof p.accountName === 'string' ? p.accountName : null, line: `Recorded ${String(p.contactEmail ?? 'their')}'s answer (${words(p.responseClass)}).` });
    } else if (r.kind === COMMITMENT_EVENT && p.op === 'status' && isObj(p.commitment)) {
      const c = p.commitment as unknown as Commitment;
      if (c.status === 'done') out.push({ at, accountName: c.accountName, line: `Done: ${c.title}.`, kind: 'done' });
      else if (c.status === 'skipped') out.push({ at, accountName: c.accountName, line: `Skipped: ${c.title}${c.reason ? ` (${c.reason})` : ''}.`, kind: 'set_aside' });
    } else if (r.kind === 'capture.note') {
      out.push({ at, accountName: typeof p.accountName === 'string' ? p.accountName : null, line: `Saved a note (${words(p.context)}).` });
    } else if (r.kind === WORK_OUTCOME) {
      const kind = p.kind;
      const line = kind === 'skipped' ? 'Set aside for today.' : kind === 'snoozed' && typeof p.until === 'string' ? `Snoozed until ${dayLabel(nyDay(p.until), now)}.` : kind === 'logged' ? `Logged outside GAP${p.reason ? ` (${String(p.reason)})` : ''}.` : null;
      // Batch item 8: the seller's own outcomes are set aside, never done (a log outside GAP proves nothing here).
      if (line) out.push({ at, accountName: r.subject_id, line, kind: 'set_aside' });
    }
  }
  return out;
}
