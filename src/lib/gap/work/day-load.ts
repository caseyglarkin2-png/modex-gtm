/**
 * THE WORK DAY'S READS (GAP OS execution recovery, R41 / R45, 2026-10-06). Server only. What Work needs beyond the
 * cockpit's cached lanes, read on every render (never cached with the lanes, so a write shows on the next load):
 *
 *   commitments   every commitment (work/commitments.ts), after the bounded follow-up sweep over the send ledger
 *   meetings      the calendar's meetings in the next two days (the Meeting table), cancelled ones dropped, the
 *                 time of day read in New York when the row carries one
 *
 * Soft: an unreadable store reads as nothing and never fails the page (the send gates fail closed on their own).
 */
import { loadCommitments, syncFollowUpsFromLedger, syncReturnRemindersFromReplies } from './commitments';
import { COMMITMENT_EVENT, type Commitment } from './commitment-model';
import { dayLabel, nyDay, nyDayAt } from './dates';
import type { DoneItem } from './today';
import { DIRECT_SENT, DRAFT_SENT, DRAFT_SUBJECT_TYPE, MANUAL_SENT } from '../execution/draft-ledger';
import { WORK_OUTCOME } from './outcome';

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

/** "10:00 AM", "10am", "14:30" -> [hour, minute]; null when the text names no time. */
export function parseTimeOfDay(text: string | null | undefined): [number, number] | null {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*/i.exec(text ?? '');
  if (!m) return null;
  let h = Number(m[1]);
  const mi = Number(m[2] ?? 0);
  const ap = (m[3] ?? '').toLowerCase().replace(/\./g, '');
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || mi > 59 || (!m[2] && !ap)) return null;
  return [h, mi];
}

export async function loadUpcomingMeetings(prisma: PrismaLike, now: Date, horizonMs = 48 * 3_600_000): Promise<Array<{ accountName: string; at: string; what: string }>> {
  if (typeof prisma?.meeting?.findMany !== 'function') return [];
  const rows: Array<{ account_name: string; meeting_date: Date | null; meeting_time: string | null; meeting_status: string; objective: string | null }> = await prisma.meeting
    .findMany({ where: { meeting_date: { gte: new Date(now.getTime() - 24 * 3_600_000), lte: new Date(now.getTime() + horizonMs) } }, select: { account_name: true, meeting_date: true, meeting_time: true, meeting_status: true, objective: true } })
    .catch(() => []);
  const out: Array<{ accountName: string; at: string; what: string }> = [];
  for (const r of rows) {
    if (!r.meeting_date || /cancel|no meeting/i.test(r.meeting_status)) continue;
    const t = parseTimeOfDay(r.meeting_time);
    // A date-only row is stored at UTC midnight: its calendar day is the UTC date, never the New York evening before.
    const d = new Date(r.meeting_date);
    const calendarDay = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 ? d.toISOString().slice(0, 10) : nyDay(d);
    const at = t ? nyDayAt(calendarDay, t[0], t[1]) : d.getUTCHours() === 0 && d.getUTCMinutes() === 0 ? nyDayAt(calendarDay, 9) : d;
    out.push({ accountName: r.account_name, at: at.toISOString(), what: r.objective?.trim() || r.meeting_status });
  }
  return out;
}

const words = (s: unknown) => String(s ?? '').replace(/_/g, ' ');
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * R45: what was completed TODAY (the New York day of `now`), read from the ledger and the dispositions, never from a
 * screen: sends GAP proved (direct, manual, a sent draft), answers recorded by a person, obligations done or skipped,
 * notes saved, the seller's own outcomes. Nothing is stored for it; tomorrow it reads as yesterday's, never as done
 * again. Soft: an unreadable ledger reads as nothing done (and says so nowhere as success).
 */
export async function loadCompletedToday(prisma: PrismaLike, now: Date): Promise<DoneItem[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const start = nyDayAt(nyDay(now), 0);
  const rows: Array<{ kind: string; subject_type: string; subject_id: string; payload: unknown; created_at: Date }> = await prisma.gapAuditEvent
    .findMany({
      where: { created_at: { gte: start, lte: now }, kind: { in: [DIRECT_SENT, MANUAL_SENT, DRAFT_SENT, 'disposition.recorded', COMMITMENT_EVENT, 'capture.note', WORK_OUTCOME] } },
      select: { kind: true, subject_type: true, subject_id: true, payload: true, created_at: true },
      orderBy: { created_at: 'asc' },
      take: 500,
    })
    .catch(() => []);
  const out: DoneItem[] = [];
  for (const r of rows) {
    const p = isObj(r.payload) ? r.payload : {};
    const at = new Date(r.created_at).toISOString();
    if ((r.kind === DIRECT_SENT || r.kind === MANUAL_SENT) && r.subject_type === DRAFT_SUBJECT_TYPE) {
      out.push({ at, accountName: typeof p.accountName === 'string' ? p.accountName : null, line: `Sent touch ${Number(p.stepIndex ?? 0) + 1} to ${String(p.recipient ?? 'them')}${p.reconciledFromSent ? ' (found in Sent)' : ''}.` });
    } else if (r.kind === DRAFT_SENT) {
      out.push({ at, accountName: null, line: 'A GAP draft was sent from Gmail.' });
    } else if (r.kind === 'disposition.recorded' && p.humanConfirmed === true) {
      out.push({ at, accountName: typeof p.accountName === 'string' ? p.accountName : null, line: `Recorded ${String(p.contactEmail ?? 'their')}'s answer (${words(p.responseClass)}).` });
    } else if (r.kind === COMMITMENT_EVENT && p.op === 'status' && isObj(p.commitment)) {
      const c = p.commitment as unknown as Commitment;
      if (c.status === 'done') out.push({ at, accountName: c.accountName, line: `Done: ${c.title}.` });
      else if (c.status === 'skipped') out.push({ at, accountName: c.accountName, line: `Skipped: ${c.title}${c.reason ? ` (${c.reason})` : ''}.` });
    } else if (r.kind === 'capture.note') {
      out.push({ at, accountName: typeof p.accountName === 'string' ? p.accountName : null, line: `Saved a note (${words(p.context)}).` });
    } else if (r.kind === WORK_OUTCOME) {
      const kind = p.kind;
      const line = kind === 'skipped' ? 'Set aside for today.' : kind === 'snoozed' && typeof p.until === 'string' ? `Snoozed until ${dayLabel(nyDay(p.until), now)}.` : kind === 'logged' ? `Logged outside GAP${p.reason ? ` (${String(p.reason)})` : ''}.` : null;
      if (line) out.push({ at, accountName: r.subject_id, line });
    }
  }
  return out;
}
