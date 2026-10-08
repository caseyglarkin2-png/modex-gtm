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
import { nyDay } from './dates';
import { outcomeLine, SNOOZE_MAX_DAYS, OUTCOME_REASON_MAX, WORK_OUTCOME, type WorkOutcome, type WorkOutcomeKind } from './outcome-model';

// The client-safe model lives in ./outcome-model (the Work list reads only that); re-exported for the server callers.
export { outcomeLine, SNOOZE_MAX_DAYS, OUTCOME_REASON_MAX, WORK_OUTCOME, type WorkOutcome, type WorkOutcomeKind } from './outcome-model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** A skip and a logged-elsewhere hold the card out of today's list until the next day (New York). */
const DAY_MS = 86_400_000;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

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
    // R63-A S11: a meeting marked prepared is about that meeting, never the account's own outcome.
    if (isObj(r.payload) && r.payload.kind === 'prepared') continue;
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

/** R63-A S11: the meetings marked prepared at these accounts that have not run yet, by their key on Work. */
export async function loadPreparedMeetings(prisma: PrismaLike, accountNames: readonly string[], now: Date = new Date()): Promise<Set<string>> {
  const out = new Set<string>();
  if (accountNames.length === 0 || typeof prisma?.gapAuditEvent?.findMany !== 'function') return out;
  const rows: Array<{ payload: unknown }> = await prisma.gapAuditEvent.findMany({ where: { kind: WORK_OUTCOME, subject_type: 'account', subject_id: { in: [...accountNames] } }, select: { payload: true } });
  for (const r of rows) {
    const p = isObj(r.payload) ? r.payload : null;
    if (!p || p.kind !== 'prepared' || typeof p.meetingKey !== 'string' || typeof p.until !== 'string') continue;
    if (new Date(p.until).getTime() > now.getTime()) out.add(p.meetingKey);
  }
  return out;
}

/** Midnight New York after `now` plus `days - 1` days, as an ISO instant: "tomorrow" for a skip. */
export function nextDayBoundary(now: Date, days = 1): Date {
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const localMidnight = new Date(ny.getFullYear(), ny.getMonth(), ny.getDate() + days);
  // Convert the New York wall-clock midnight back to an instant via the offset at `now`. R63-B S3: an offset is whole
  // minutes (the wall-clock string drops the milliseconds, which made "midnight" carry the press's milliseconds, so two
  // skips a second apart had two different ends).
  const offsetMs = Math.round((now.getTime() - ny.getTime()) / 60_000) * 60_000;
  return new Date(localMidnight.getTime() + offsetMs);
}

export type RecordOutcomeInput = { accountName: string; kind: WorkOutcomeKind | 'clear' | 'prepared'; reason?: string | null; until?: string | null; /** R63-A S11: the meeting marked prepared (its key on Work, its time, what it is). */ meeting?: { key: string; at: string; what?: string | null } | null; actor: string; now?: Date };
export type RecordOutcomeResult = { ok: true; outcome: WorkOutcome | null; line: string | null; slug: string; /** R63-B S3: the same outcome was already recorded today; nothing was written. */ existing?: boolean } | { ok: false; reason: 'account_not_found' | 'reason_too_long' | 'invalid_until' | 'until_in_past' | 'until_too_far' | 'until_required' };

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
  } else if (input.kind === 'prepared') {
    // R63-A S11: prepared holds until the meeting has run (its time plus two hours).
    const at = input.meeting?.at ? new Date(input.meeting.at) : null;
    if (!input.meeting?.key?.trim() || !at || Number.isNaN(at.getTime())) return { ok: false, reason: 'until_required' };
    until = new Date(at.getTime() + 2 * 3_600_000);
  }
  const payload = input.kind === 'clear' ? { kind: 'clear', reason } : input.kind === 'prepared' ? { kind: 'prepared', reason, until: until!.toISOString(), meetingKey: input.meeting!.key.trim().slice(0, 200), meetingAt: new Date(input.meeting!.at).toISOString(), what: (input.meeting!.what ?? '').trim().slice(0, 200) || null } : { kind: input.kind, reason, until: until!.toISOString() };
  // R63-B S3: idempotent per account per day. A stale tab's second "Skip today" wrote a second row and Work said "Set
  // aside for today." twice. The same outcome already recorded today (the newest row: same kind, reason and until) is
  // answered with that row and nothing is written; a different outcome (a new snooze date, a clear) is written. Read
  // and written under one account lock when the client has transactions, so two tabs at once write one row.
  const write = async (tx: PrismaLike): Promise<{ row: { id?: unknown; actor?: string; created_at?: Date } | null; existing: boolean }> => {
    if (typeof tx.$executeRaw === 'function') await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gap_work_outcome:${account.name}`}))`;
    const newest: Array<{ id?: unknown; actor: string; payload: unknown; created_at: Date }> = await tx.gapAuditEvent.findMany({ where: { kind: WORK_OUTCOME, subject_type: 'account', subject_id: { in: [account.name] } }, select: { id: true, actor: true, payload: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 1 });
    const have = newest[0];
    const p = have && isObj(have.payload) ? have.payload : null;
    if (have && p && nyDay(new Date(have.created_at).toISOString()) === nyDay(now.toISOString()) && p.kind === payload.kind && (p.reason ?? null) === reason && (p.until ?? null) === ('until' in payload ? payload.until : null)) return { row: have, existing: true };
    return { row: await tx.gapAuditEvent.create({ data: { kind: WORK_OUTCOME, actor: input.actor, subject_type: 'account', subject_id: account.name, payload } }), existing: false };
  };
  const { row, existing } = typeof prisma.$transaction === 'function' ? await prisma.$transaction((tx: PrismaLike) => write(tx)) : await write(prisma);
  if (existing) {
    const outcome: WorkOutcome | null = input.kind === 'clear' || input.kind === 'prepared' ? null : { accountName: account.name, kind: input.kind, reason, until: until!.toISOString(), by: row?.actor ?? input.actor, at: row?.created_at ? new Date(row.created_at).toISOString() : now.toISOString() };
    return { ok: true, outcome, line: outcome ? outcomeLine(outcome, now) : null, slug: accountSlug(account.name), existing: true };
  }
  // R40: a snooze is a durable reminder that returns on its date; a newer outcome settles the older ones. Fail-open.
  // Loaded on demand: this module is reachable from the Work list's client component, the commitment store is not.
  if (row?.id && input.kind !== 'prepared') {
    try {
      const { commitmentsFromOutcome } = await import('./commitments');
      await commitmentsFromOutcome(prisma, { outcomeId: String(row.id), accountName: account.name, kind: input.kind as 'skipped' | 'snoozed' | 'logged' | 'clear', until: until ? until.toISOString() : null, reason, actor: input.actor, now });
    } catch {
      // The reminder never gates the outcome.
    }
  }
  const outcome: WorkOutcome | null = input.kind === 'clear' || input.kind === 'prepared' ? null : { accountName: account.name, kind: input.kind, reason, until: until!.toISOString(), by: input.actor, at: now.toISOString() };
  return { ok: true, outcome, line: outcome ? outcomeLine(outcome, now) : null, slug: accountSlug(account.name) };
}
