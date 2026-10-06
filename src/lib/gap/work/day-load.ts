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
import { loadCommitments, syncFollowUpsFromLedger } from './commitments';
import type { Commitment } from './commitment-model';
import { nyDay, nyDayAt } from './dates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** The follow-up sweep writes at most this often per instance (a burst of Work loads costs one sweep). */
export const SWEEP_MIN_INTERVAL_MS = 60_000;
let lastSweep = 0;

export async function loadWorkCommitments(prisma: PrismaLike, now: Date, opts: { sweep?: boolean } = {}): Promise<Commitment[]> {
  if (opts.sweep !== false && now.getTime() - lastSweep >= SWEEP_MIN_INTERVAL_MS) {
    lastSweep = now.getTime();
    await syncFollowUpsFromLedger(prisma, now).catch(() => null);
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
