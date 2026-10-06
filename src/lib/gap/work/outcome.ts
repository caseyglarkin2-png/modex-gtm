/**
 * WORK OUTCOMES (GAP OS execution recovery, R14, 2026-10-06): what the seller DID with a Work item, recorded, not
 * navigated. Navigation (Done, next) changes nothing; these do, as append-only `account.work_outcome` audit rows
 * (the existing ledger), so a refresh, another device or another server instance sees the same outcome.
 *
 *   skipped    "not today": the card drops to the end of Work until the next business day or a material change
 *   snoozed    "come back on <date>": the card leaves Work until then (the date is the seller's; never silently moved)
 *   logged     "done outside GAP" (a call, a hallway conversation, an email from another mailbox): the card drops for
 *              the stated window and the note says what happened; it never claims a send GAP did not prove
 *
 * Sent, drafted, failed or unknown sends are NOT recorded here: the execution ledger owns them (execution/draft-
 * ledger.ts) and the pursuit state already reads them (in motion, a draft outstanding, outcome unknown). A reply
 * disposition owns replies. The newest row per account wins; `clear` ends it. Nothing here sends, enrolls, writes
 * HubSpot or changes any thesis, person or suppression.
 */
import { accountSlug } from '../account-intel/href';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const WORK_OUTCOME = 'account.work_outcome' as const;
export type WorkOutcomeKind = 'skipped' | 'snoozed' | 'logged';
export const OUTCOME_REASON_MAX = 240;
/** A snooze may not run past this. */
export const SNOOZE_MAX_DAYS = 90;
/** A skip and a logged-elsewhere hold the card out of today's list until the next day (New York). */
const DAY_MS = 86_400_000;

export interface WorkOutcome {
  accountName: string;
  kind: WorkOutcomeKind;
  reason: string | null;
  /** When the card returns (ISO). */
  until: string;
  by: string;
  at: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** The seller line: "Snoozed until Oct 9 (travel), you, Oct 6." */
export function outcomeLine(o: WorkOutcome, now: Date = new Date()): string {
  const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  const who = /^casey@/i.test(o.by) ? 'you' : o.by;
  const head = o.kind === 'snoozed' ? `Snoozed until ${day(o.until)}` : o.kind === 'skipped' ? 'Skipped for today' : `Logged outside GAP${o.reason ? '' : ', back tomorrow'}`;
  const reason = o.reason ? ` (${o.reason})` : '';
  const when = new Date(o.at).toDateString() === now.toDateString() ? 'today' : day(o.at);
  return `${head}${reason}, ${who}, ${when}.`;
}

/** The active outcome per account (newest row wins; a lapsed one or a clear reads as none). */
export async function loadWorkOutcomes(prisma: PrismaLike, accountNames: readonly string[], now: Date = new Date()): Promise<Map<string, WorkOutcome>> {
  const out = new Map<string, WorkOutcome>();
  if (accountNames.length === 0 || typeof prisma?.gapAuditEvent?.findMany !== 'function') return out;
  const rows: Array<{ subject_id: string; actor: string; payload: unknown; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: WORK_OUTCOME, subject_type: 'account', subject_id: { in: [...accountNames] } },
    select: { subject_id: true, actor: true, payload: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.subject_id)) continue;
    seen.add(r.subject_id);
    const p = isObj(r.payload) ? r.payload : {};
    if (p.kind === 'clear') continue;
    const kind = p.kind;
    if (kind !== 'skipped' && kind !== 'snoozed' && kind !== 'logged') continue;
    const until = typeof p.until === 'string' ? p.until : null;
    if (!until || Number.isNaN(new Date(until).getTime()) || new Date(until).getTime() <= now.getTime()) continue;
    out.set(r.subject_id, { accountName: r.subject_id, kind, reason: typeof p.reason === 'string' ? p.reason : null, until, by: r.actor, at: new Date(r.created_at).toISOString() });
  }
  return out;
}

/** Midnight New York after `now` plus `days - 1` days, as an ISO instant: "tomorrow" for a skip. */
export function nextDayBoundary(now: Date, days = 1): Date {
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const localMidnight = new Date(ny.getFullYear(), ny.getMonth(), ny.getDate() + days);
  // Convert the New York wall-clock midnight back to an instant via the offset at `now`.
  const offsetMs = now.getTime() - ny.getTime();
  return new Date(localMidnight.getTime() + offsetMs);
}

export type RecordOutcomeInput = { accountName: string; kind: WorkOutcomeKind | 'clear'; reason?: string | null; until?: string | null; actor: string; now?: Date };
export type RecordOutcomeResult = { ok: true; outcome: WorkOutcome | null; line: string | null; slug: string } | { ok: false; reason: 'account_not_found' | 'reason_too_long' | 'invalid_until' | 'until_in_past' | 'until_too_far' | 'until_required' };

export async function recordWorkOutcome(prisma: PrismaLike, input: RecordOutcomeInput): Promise<RecordOutcomeResult> {
  const now = input.now ?? new Date();
  const account = await prisma.account.findUnique({ where: { name: input.accountName }, select: { name: true } });
  if (!account) return { ok: false, reason: 'account_not_found' };
  const reason = (input.reason ?? '').trim() || null;
  if (reason && reason.length > OUTCOME_REASON_MAX) return { ok: false, reason: 'reason_too_long' };
  let until: Date | null = null;
  if (input.kind === 'snoozed') {
    if (!input.until) return { ok: false, reason: 'until_required' };
    until = new Date(input.until);
    if (Number.isNaN(until.getTime())) return { ok: false, reason: 'invalid_until' };
    if (until.getTime() <= now.getTime()) return { ok: false, reason: 'until_in_past' };
    if (until.getTime() > now.getTime() + SNOOZE_MAX_DAYS * DAY_MS) return { ok: false, reason: 'until_too_far' };
  } else if (input.kind === 'skipped' || input.kind === 'logged') {
    until = nextDayBoundary(now, 1);
  }
  const payload = input.kind === 'clear' ? { kind: 'clear', reason } : { kind: input.kind, reason, until: until!.toISOString() };
  const row = await prisma.gapAuditEvent.create({ data: { kind: WORK_OUTCOME, actor: input.actor, subject_type: 'account', subject_id: account.name, payload } });
  // R40: a snooze is a durable reminder that returns on its date; a newer outcome settles the older ones. Fail-open.
  // Loaded on demand: this module is reachable from the Work list's client component, the commitment store is not.
  if (row?.id) {
    try {
      const { commitmentsFromOutcome } = await import('./commitments');
      await commitmentsFromOutcome(prisma, { outcomeId: String(row.id), accountName: account.name, kind: input.kind, until: until ? until.toISOString() : null, reason, actor: input.actor, now });
    } catch {
      // The reminder never gates the outcome.
    }
  }
  const outcome: WorkOutcome | null = input.kind === 'clear' ? null : { accountName: account.name, kind: input.kind, reason, until: until!.toISOString(), by: input.actor, at: now.toISOString() };
  return { ok: true, outcome, line: outcome ? outcomeLine(outcome, now) : null, slug: accountSlug(account.name) };
}
