/**
 * GAP OPERATIONS (GAP OS execution recovery, R65, 2026-10-07): what the operator must repair and what Casey must
 * decide, counted from the ledgers GAP already keeps. No new table, no model call, no write.
 *
 *   broken handoffs     drafts stranded (an older path left them in draft with no story key: recovery/stranded-drafts.ts),
 *                       proposals incomplete (the R11 service made the draft but it was never submitted), dead-letter
 *                       signals (research failed past its last attempt)
 *   queue               signals queued for background research, and the oldest one's age; runs stuck researching
 *   research            freshness (the last run and the last grounded turn) and cost over the window: runs, grounded
 *                       turns, signals queued, facts verified, failures
 *   preparation         how old the remembered pursuit summaries are (what Work and the account shell show first)
 *   seller corrections  over the window: buyer words corrected, capture lines rejected, stories set aside, obligations
 *                       the seller skipped, HubSpot changes discarded
 *   outcomes            over the window: obligations done and skipped (and overdue now), replies received and recorded
 *                       (and waiting now), meetings booked, held and canceled
 *   CRM sync            changes waiting for Casey's approval, approved but not written, and failed or in conflict, each
 *                       with its owner and the place to retry or decide
 *
 * Audiences: the operator sees FAILURES (`failures`, with the state); Casey sees DECISIONS (`decisions`) and the
 * outcomes. A count GAP could not read is said as unreadable (null), never as zero, and makes the state DEGRADED.
 */
import { CRM_KINDS, CRM_SUBJECT, foldCrmSync, type CrmRow, type CrmSyncItem } from '../deals/crm-model';
import { accountHref } from '../account-intel/href';
import { loadCommitments } from '../work/commitments';
import type { Commitment } from '../work/commitment-model';
import { GROUNDED_DISCOVERY_AUDIT } from '../signals/grounded-discovery';
import { SUMMARY_KEY_PREFIX } from '../pursuit/summary';
import { STRANDED_WHERE } from '../recovery/stranded-drafts';
import { RESEARCH_DEAD_LETTER } from '../signals/research';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type OpsState = 'HEALTHY' | 'DEGRADED' | 'BLOCKED';
/** A count, or null when it could not be read (never reported as zero). */
export type Count = number | null;

export const OPS_WINDOW_DAYS = 7;
/** A proposal the service made but never submitted is a broken handoff once it is this old. */
export const INCOMPLETE_AFTER_MS = 24 * 3_600_000;
/** The research queue drains every two hours; a signal queued longer than this means the queue is not draining. */
export const QUEUE_DEGRADED_MS = 24 * 3_600_000;
export const QUEUE_BLOCKED_MS = 72 * 3_600_000;
/** A run still researching after this long never finished (signals/process.ts reclaims it as a failed attempt). */
export const RESEARCHING_STUCK_MS = 30 * 60_000;
/** Work reads a remembered summary within 15 minutes; one older than a day is not serving anyone. */
export const SUMMARY_STALE_MS = 24 * 3_600_000;

export interface CrmLine {
  proposalId: string;
  accountName: string;
  dealName: string | null;
  kind: string;
  state: string;
  /** Who it waits on: the seller who proposed it (an approval) or who approved it (a write). */
  owner: string;
  since: string;
  detail: string | null;
  /** Where it is decided or retried. */
  href: string;
  action: string;
}

export interface OperationsInputs {
  windowDays: number;
  handoffs: { stranded: Count; strandedOldestAt: string | null; incomplete: Count; incompleteOldestAt: string | null; deadLetters: Count; deadLetterOldestAt: string | null };
  queue: { queued: Count; oldestQueuedAt: string | null; researchingStuck: Count };
  research: { runs: Count; runsFailed: Count; turns: Count; turnsFailed: Count; queuedByTurns: Count; verified: Count; lastRunAt: string | null; lastTurnAt: string | null };
  preparation: { summaries: Count; medianAgeMs: number | null; oldestAgeMs: number | null; stale: Count };
  corrections: { bidsCorrected: Count; captureRejected: Count; storiesSetAside: Count; obligationsSkippedBySeller: Count; crmDiscarded: Count };
  outcomes: { obligationsDone: Count; obligationsSkipped: Count; obligationsOverdue: Count; repliesReceived: Count; repliesRecorded: Count; meetingsBooked: Count; meetingsHeld: Count; meetingsCanceled: Count };
  decisions: { thesesWaitingReview: Count };
  crm: { readable: boolean; pendingApproval: CrmLine[]; approvedNotWritten: CrmLine[]; failed: CrmLine[] };
}

export interface OpsLine {
  key: string;
  state: OpsState;
  /** One plain line. */
  label: string;
  count: Count;
  /** Where to act, when there is a place. */
  href: string | null;
  /** R65, failures only: who repairs it, and how (the retry path in words). */
  owner?: string | null;
  retry?: string | null;
}

/** R65: who repairs each failure and how. The operator sees these; Casey's view carries decisions only. */
export const FAILURE_OWNERSHIP: Readonly<Record<string, { owner: string; retry: string }>> = {
  drafts_stranded: { owner: 'operator', retry: 'Run scripts/gap/recovery/repair-stranded-drafts.ts --dry-run; each ADOPT completes when the seller drafts from its fact on the account page (the R11 service)' },
  proposals_incomplete: { owner: 'the seller who drafted it', retry: 'Open the draft thesis: its account page asks for the one missing field, then submit it for review' },
  dead_letter_signals: { owner: 'operator', retry: 'Signals: retry the research or dismiss the signal' },
  queue_age: { owner: 'operator', retry: 'Coverage: check the background research runs (every two hours); a failed run is retried on the next pass' },
  research_stuck: { owner: 'operator', retry: 'Nothing by hand: the next pass reclaims it as a failed attempt' },
  research_runs_failed: { owner: 'operator', retry: 'Coverage: the failed runs; the rotation retries them' },
  grounded_turns_failed: { owner: 'operator', retry: 'Retried on the next run after the backoff; Coverage shows each account' },
  summaries_stale: { owner: 'operator', retry: 'Open the account (a visit rebuilds it) or let the warmer run' },
  crm_failed: { owner: 'the seller who approved it', retry: 'The deal brief: Retry (a retry never writes twice) or decide the conflict' },
};

export interface OperationsReport {
  state: OpsState;
  headline: string;
  /** The operator: what is broken or stuck, worst first. */
  failures: OpsLine[];
  /** Casey: what waits on a decision. */
  decisions: OpsLine[];
  /** Casey: what happened over the window. */
  outcomes: OpsLine[];
  /** Research freshness and cost over the window. */
  research: OpsLine[];
  crm: OperationsInputs['crm'];
  inputs: OperationsInputs;
  checkedAt: string;
}

const RANK: Record<OpsState, number> = { HEALTHY: 0, DEGRADED: 1, BLOCKED: 2 };
const n = (c: Count) => (c === null ? 'could not be read' : String(c));
const ageWords = (ms: number) => (ms < 3_600_000 ? `${Math.max(1, Math.round(ms / 60_000))} minutes` : ms < 172_800_000 ? `${Math.round(ms / 3_600_000)} hours` : `${Math.round(ms / 86_400_000)} days`);
const since = (iso: string | null, now: Date) => (iso ? now.getTime() - new Date(iso).getTime() : null);

/** A failure line: DEGRADED when the count is positive or unreadable, HEALTHY at zero. */
function failure(key: string, count: Count, words: (c: number) => string, href: string | null, worse?: OpsState): OpsLine {
  if (count === null) return { key, state: 'DEGRADED', label: `${words(0).replace(/^0 /, '').replace(/^No /, '')}: could not be read`, count, href };
  return { key, state: count > 0 ? (worse ?? 'DEGRADED') : 'HEALTHY', label: words(count), count, href };
}

export function evaluateOperations(i: OperationsInputs, now: Date): OperationsReport {
  const plural = (c: number, one: string, many: string) => `${c} ${c === 1 ? one : many}`;
  const queueAge = since(i.queue.oldestQueuedAt, now);
  const incompleteAge = since(i.handoffs.incompleteOldestAt, now);
  const failures: OpsLine[] = ([
    failure('drafts_stranded', i.handoffs.stranded, (c) => (c ? `${plural(c, 'draft', 'drafts')} stranded (no story key; the R11 service adopts each when its fact is drafted): run the repair dry run` : 'No stranded drafts'), null),
    failure('proposals_incomplete', i.handoffs.incomplete === null ? null : incompleteAge !== null && incompleteAge > INCOMPLETE_AFTER_MS ? i.handoffs.incomplete : 0, (c) => (c ? `${plural(c, 'proposal', 'proposals')} drafted but never submitted (oldest ${ageWords(incompleteAge ?? 0)}): its account page asks for the missing field` : 'No proposal left incomplete'), '/gap/hypotheses?status=draft'),
    failure('dead_letter_signals', i.handoffs.deadLetters, (c) => (c ? `${plural(c, 'signal', 'signals')} in the research dead letter (failed past the last attempt): open Signals to retry or dismiss` : 'No signal in the research dead letter'), '/gap/signals'),
    i.queue.queued === null
      ? { key: 'queue_age', state: 'DEGRADED', label: 'The research queue could not be read', count: null, href: '/gap/coverage' }
      : queueAge !== null && queueAge > QUEUE_DEGRADED_MS
        ? { key: 'queue_age', state: queueAge > QUEUE_BLOCKED_MS ? 'BLOCKED' : 'DEGRADED', label: `The research queue is not draining: ${plural(i.queue.queued, 'signal', 'signals')} queued, the oldest for ${ageWords(queueAge)}`, count: i.queue.queued, href: '/gap/coverage' }
        : { key: 'queue_age', state: 'HEALTHY', label: `${plural(i.queue.queued, 'signal', 'signals')} queued for research${queueAge !== null ? `, the oldest for ${ageWords(queueAge)}` : ''}`, count: i.queue.queued, href: null },
    failure('research_stuck', i.queue.researchingStuck, (c) => (c ? `${plural(c, 'research run', 'research runs')} started and never finished (reclaimed as a failed attempt on the next pass)` : 'No research run stuck'), null),
    failure('research_runs_failed', i.research.runsFailed, (c) => (c ? `${plural(c, 'research run', 'research runs')} failed in ${i.windowDays} days` : `No research run failed in ${i.windowDays} days`), '/gap/coverage'),
    failure('grounded_turns_failed', i.research.turnsFailed, (c) => (c ? `${plural(c, 'grounded discovery turn', 'grounded discovery turns')} failed in ${i.windowDays} days (a provider outage is retried, never read as nothing found)` : `No grounded discovery turn failed in ${i.windowDays} days`), '/gap/coverage'),
    failure('summaries_stale', i.preparation.stale, (c) => (c ? `${plural(c, 'remembered account summary', 'remembered account summaries')} older than a day (the account shell shows them with their age; a visit or the warmer rebuilds them)` : 'No remembered account summary older than a day'), null),
    i.crm.readable
      ? { key: 'crm_failed', state: i.crm.failed.length ? 'DEGRADED' : 'HEALTHY', label: i.crm.failed.length ? `${plural(i.crm.failed.length, 'HubSpot change', 'HubSpot changes')} failed or in conflict: each lists its owner and where to retry` : 'No HubSpot change failed', count: i.crm.failed.length, href: i.crm.failed[0]?.href ?? null }
      : { key: 'crm_failed', state: 'DEGRADED', label: 'HubSpot changes could not be read', count: null, href: null },
  ] as OpsLine[])
    .sort((a, b) => RANK[b.state] - RANK[a.state])
    .map((f) => {
      const own = FAILURE_OWNERSHIP[f.key];
      // A failed HubSpot change is owned by the people who approved it.
      const approvers = f.key === 'crm_failed' && i.crm.failed.length ? [...new Set(i.crm.failed.map((c) => c.owner))].join(', ') : null;
      return { ...f, owner: approvers ?? own?.owner ?? null, retry: own?.retry ?? null };
    });

  const decisions: OpsLine[] = [
    { key: 'theses_waiting_review', state: 'HEALTHY', label: i.decisions.thesesWaitingReview === null ? 'Theses waiting for your review: could not be read' : `${plural(i.decisions.thesesWaitingReview, 'thesis', 'theses')} waiting for your review`, count: i.decisions.thesesWaitingReview, href: '/gap/hypotheses?status=review_required' },
    { key: 'crm_waiting_approval', state: 'HEALTHY', label: `${plural(i.crm.pendingApproval.length, 'HubSpot change', 'HubSpot changes')} waiting for your approval`, count: i.crm.readable ? i.crm.pendingApproval.length : null, href: i.crm.pendingApproval[0]?.href ?? null },
    { key: 'crm_approved_not_written', state: 'HEALTHY', label: `${plural(i.crm.approvedNotWritten.length, 'approved HubSpot change', 'approved HubSpot changes')} not written (approved writes are off or it is waiting): retry each once writes are on`, count: i.crm.readable ? i.crm.approvedNotWritten.length : null, href: '/gap/coverage' },
    { key: 'obligations_overdue', state: 'HEALTHY', label: `Obligations overdue now: ${n(i.outcomes.obligationsOverdue)}`, count: i.outcomes.obligationsOverdue, href: '/gap' },
  ];
  const outcomes: OpsLine[] = [
    { key: 'obligations', state: 'HEALTHY', label: `Obligations in ${i.windowDays} days: ${n(i.outcomes.obligationsDone)} done, ${n(i.outcomes.obligationsSkipped)} skipped`, count: i.outcomes.obligationsDone, href: null },
    { key: 'replies', state: 'HEALTHY', label: `Replies in ${i.windowDays} days: ${n(i.outcomes.repliesReceived)} received, ${n(i.outcomes.repliesRecorded)} recorded`, count: i.outcomes.repliesReceived, href: null },
    { key: 'meetings', state: 'HEALTHY', label: `Meetings in ${i.windowDays} days: ${n(i.outcomes.meetingsBooked)} booked, ${n(i.outcomes.meetingsHeld)} held, ${n(i.outcomes.meetingsCanceled)} canceled`, count: i.outcomes.meetingsBooked, href: null },
    { key: 'corrections', state: 'HEALTHY', label: `Your corrections in ${i.windowDays} days: ${n(i.corrections.bidsCorrected)} buyer statements corrected, ${n(i.corrections.captureRejected)} capture lines rejected, ${n(i.corrections.storiesSetAside)} stories set aside, ${n(i.corrections.obligationsSkippedBySeller)} obligations skipped, ${n(i.corrections.crmDiscarded)} HubSpot changes discarded`, count: null, href: null },
  ];
  const research: OpsLine[] = [
    { key: 'research_freshness', state: 'HEALTHY', label: `Last research run ${i.research.lastRunAt ? `${ageWords(since(i.research.lastRunAt, now)!)} ago` : 'never'}; last grounded turn ${i.research.lastTurnAt ? `${ageWords(since(i.research.lastTurnAt, now)!)} ago` : 'never'}`, count: null, href: '/gap/coverage' },
    { key: 'research_cost', state: 'HEALTHY', label: `Research in ${i.windowDays} days: ${n(i.research.runs)} runs, ${n(i.research.turns)} grounded turns, ${n(i.research.queuedByTurns)} pages queued, ${n(i.research.verified)} facts verified, ${n(i.research.runsFailed)} runs and ${n(i.research.turnsFailed)} turns failed`, count: i.research.runs, href: '/gap/coverage' },
    { key: 'preparation_latency', state: 'HEALTHY', label: i.preparation.summaries === null ? 'Remembered account summaries could not be read' : `${plural(i.preparation.summaries, 'account summary', 'account summaries')} remembered${i.preparation.medianAgeMs !== null ? `, median age ${ageWords(i.preparation.medianAgeMs)}, oldest ${ageWords(i.preparation.oldestAgeMs ?? 0)}` : ''}`, count: i.preparation.summaries, href: null },
  ];
  const state = failures.reduce<OpsState>((w, f) => (RANK[f.state] > RANK[w] ? f.state : w), 'HEALTHY');
  const bad = failures.filter((f) => f.state !== 'HEALTHY');
  const headline = state === 'HEALTHY' ? 'Nothing broken or stuck' : bad.map((f) => f.label).join(' · ');
  return { state, headline, failures, decisions, outcomes, research, crm: i.crm, inputs: i, checkedAt: now.toISOString() };
}

// ------------------------------------------------------------------------------------------------------------ load

/** One read, on its own: a missing table or a failed query is that count unreadable, never every count. */
const soft = async <T>(read: () => Promise<T>): Promise<T | null> => {
  try {
    return await read();
  } catch {
    return null;
  }
};
const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);

function crmLines(items: readonly CrmSyncItem[]): OperationsInputs['crm'] {
  const line = (it: CrmSyncItem, owner: string, sinceAt: string, action: string): CrmLine => ({ proposalId: it.proposalId, accountName: it.accountName, dealName: it.dealName, kind: it.change.kind, state: it.state, owner, since: sinceAt, detail: it.detail, href: `${accountHref(it.accountName)}?view=brief#deal-workspace`, action });
  return {
    readable: true,
    pendingApproval: items.filter((it) => it.state === 'proposed').map((it) => line(it, it.proposedBy, it.proposedAt, 'Approve or discard it on the deal')),
    approvedNotWritten: items.filter((it) => it.state === 'off' || it.state === 'approved').map((it) => line(it, it.approvedBy ?? it.proposedBy, it.approvedAt ?? it.proposedAt, 'Retry it once approved writes are on (Coverage lists every one)')),
    failed: items.filter((it) => it.state === 'failed' || it.state === 'conflict').map((it) => line(it, it.approvedBy ?? it.proposedBy, it.lastAttemptAt ?? it.approvedAt ?? it.proposedAt, it.state === 'conflict' ? 'HubSpot holds a newer value: decide on the deal' : 'Retry it on the deal (the text is kept; a retry never writes twice)')),
  };
}

/** Every read bounded and soft: an unreadable source is reported as unreadable, never as zero, never thrown. */
export async function loadOperationsInputs(prisma: PrismaLike, now: Date, windowDays = OPS_WINDOW_DAYS): Promise<OperationsInputs> {
  const from = new Date(now.getTime() - windowDays * 86_400_000);
  const h = prisma.prospectingHypothesis;
  const g = prisma.gapSignal;
  const a = prisma.gapAuditEvent;
  const [stranded, strandedOldest, incomplete, incompleteOldest, dead, deadOldest, queued, queuedOldest, stuck, runs, runsFailed, lastRun, turnRows, lastTurn, verified, summaryRows, bidsCorrected, captureRows, setAside, commitmentRows, repliesReceived, repliesRecorded, meetingRows, review, crmRows] = await Promise.all([
    soft(() => h.count({ where: STRANDED_WHERE })),
    soft(() => h.findFirst({ where: STRANDED_WHERE, orderBy: { created_at: 'asc' }, select: { created_at: true } })),
    soft(() => h.count({ where: { status: 'draft', source_ref: { not: null }, superseded_by: { is: null } } })),
    soft(() => h.findFirst({ where: { status: 'draft', source_ref: { not: null }, superseded_by: { is: null } }, orderBy: { created_at: 'asc' }, select: { created_at: true } })),
    soft(() => g.count({ where: { research_status: RESEARCH_DEAD_LETTER } })),
    soft(() => g.findFirst({ where: { research_status: RESEARCH_DEAD_LETTER }, orderBy: { updated_at: 'asc' }, select: { updated_at: true } })),
    soft(() => g.count({ where: { research_status: 'queued' } })),
    soft(() => g.findFirst({ where: { research_status: 'queued' }, orderBy: { updated_at: 'asc' }, select: { updated_at: true } })),
    soft(() => g.count({ where: { research_status: 'researching', updated_at: { lt: new Date(now.getTime() - RESEARCHING_STUCK_MS) } } })),
    soft(() => prisma.researchRun.count({ where: { run_key: { startsWith: 'gap_research:' }, created_at: { gte: from } } })),
    soft(() => prisma.researchRun.count({ where: { run_key: { startsWith: 'gap_research:' }, created_at: { gte: from }, status: 'failed' } })),
    soft(() => prisma.researchRun.findFirst({ where: { run_key: { startsWith: 'gap_research:' } }, orderBy: { created_at: 'desc' }, select: { created_at: true } })),
    soft(() => a.findMany({ where: { kind: GROUNDED_DISCOVERY_AUDIT, created_at: { gte: from } }, select: { payload: true }, take: 2_000 })),
    soft(() => a.findFirst({ where: { kind: GROUNDED_DISCOVERY_AUDIT }, orderBy: { created_at: 'desc' }, select: { created_at: true } })),
    soft(() => g.count({ where: { research_status: 'fact_found', updated_at: { gte: from } } })),
    soft(() => prisma.systemConfig.findMany({ where: { key: { startsWith: SUMMARY_KEY_PREFIX } }, select: { value: true }, take: 5_000 })),
    soft(() => prisma.buyerInputData.count({ where: { supersedes_id: { not: null }, captured_at: { gte: from } } })),
    soft(() => a.findMany({ where: { kind: 'capture.candidate', created_at: { gte: from } }, select: { payload: true }, take: 5_000 })),
    soft(() => h.count({ where: { status: 'rejected', updated_at: { gte: from } } })),
    soft(() => loadCommitments(prisma)),
    soft(() => prisma.inboundMessage.count({ where: { received_at: { gte: from } } })),
    soft(() => prisma.conversationDisposition.count({ where: { human_confirmed: true, created_at: { gte: from }, source_kind: { in: ['inbound_message', 'hubspot_engagement'] } } })),
    soft(() => prisma.meeting.findMany({ where: { OR: [{ created_at: { gte: from } }, { meeting_date: { gte: from } }] }, select: { meeting_status: true, meeting_date: true, created_at: true }, take: 5_000 })),
    soft(() => h.count({ where: { status: 'review_required' } })),
    soft(() => a.findMany({ where: { kind: { in: [...CRM_KINDS] }, subject_type: CRM_SUBJECT }, select: { kind: true, actor: true, payload: true, created_at: true }, orderBy: { created_at: 'asc' }, take: 10_000 })),
  ]);

  const turns = (turnRows as Array<{ payload: Record<string, unknown> | null }> | null) ?? null;
  const summaryAges = summaryRows === null ? null : (summaryRows as Array<{ value: string }>).map((r) => {
    try {
      const at = (JSON.parse(r.value) as { at?: string }).at;
      return at ? now.getTime() - new Date(at).getTime() : null;
    } catch {
      return null;
    }
  }).filter((x): x is number => x !== null && Number.isFinite(x)).sort((x, y) => x - y);
  // Commitments, folded (work/commitments.ts): done and skipped in the window by their last change; overdue now is an
  // open or waiting obligation past its due time. A seller's skip is one a person made (an email), never GAP's own.
  const cAll = (commitmentRows as Commitment[] | null) ?? null;
  const inWindow = (c: Commitment) => c.updatedAt >= from.toISOString();
  const meetings = (meetingRows as Array<{ meeting_status: string | null; meeting_date: Date | null; created_at: Date }> | null) ?? null;
  const status = (m: { meeting_status: string | null }) => String(m.meeting_status ?? '').toLowerCase();
  const candidates = (captureRows as Array<{ payload: Record<string, unknown> | null }> | null) ?? null;
  const crmItems = crmRows === null ? null : foldCrmSync(crmRows as CrmRow[]);

  return {
    windowDays,
    handoffs: { stranded: stranded as Count, strandedOldestAt: iso((strandedOldest as { created_at: Date } | null)?.created_at), incomplete: incomplete as Count, incompleteOldestAt: iso((incompleteOldest as { created_at: Date } | null)?.created_at), deadLetters: dead as Count, deadLetterOldestAt: iso((deadOldest as { updated_at: Date } | null)?.updated_at) },
    queue: { queued: queued as Count, oldestQueuedAt: iso((queuedOldest as { updated_at: Date } | null)?.updated_at), researchingStuck: stuck as Count },
    research: {
      runs: runs as Count,
      runsFailed: runsFailed as Count,
      turns: turns === null ? null : turns.length,
      turnsFailed: turns === null ? null : turns.filter((t) => !!t.payload && (typeof t.payload.error === 'string' || t.payload.transient === true)).length,
      queuedByTurns: turns === null ? null : turns.reduce((s, t) => s + (typeof t.payload?.queued === 'number' ? t.payload.queued : 0), 0),
      verified: verified as Count,
      lastRunAt: iso((lastRun as { created_at: Date } | null)?.created_at),
      lastTurnAt: iso((lastTurn as { created_at: Date } | null)?.created_at),
    },
    preparation: {
      summaries: summaryAges === null ? null : (summaryRows as unknown[]).length,
      medianAgeMs: summaryAges && summaryAges.length ? summaryAges[Math.floor((summaryAges.length - 1) / 2)] : null,
      oldestAgeMs: summaryAges && summaryAges.length ? summaryAges[summaryAges.length - 1] : null,
      stale: summaryAges === null ? null : summaryAges.filter((x) => x > SUMMARY_STALE_MS).length,
    },
    corrections: {
      bidsCorrected: bidsCorrected as Count,
      captureRejected: candidates === null ? null : candidates.filter((c) => c.payload?.decision === 'rejected').length,
      storiesSetAside: setAside as Count,
      obligationsSkippedBySeller: cAll === null ? null : cAll.filter((c) => c.status === 'skipped' && inWindow(c) && c.updatedBy.includes('@')).length,
      crmDiscarded: crmItems === null ? null : crmItems.filter((it) => it.state === 'discarded' && it.proposedAt >= from.toISOString()).length,
    },
    outcomes: {
      obligationsDone: cAll === null ? null : cAll.filter((c) => c.status === 'done' && inWindow(c)).length,
      obligationsSkipped: cAll === null ? null : cAll.filter((c) => c.status === 'skipped' && inWindow(c)).length,
      obligationsOverdue: cAll === null ? null : cAll.filter((c) => (c.status === 'open' || c.status === 'waiting') && !!c.dueAt && new Date(c.dueAt).getTime() < now.getTime()).length,
      repliesReceived: repliesReceived as Count,
      repliesRecorded: repliesRecorded as Count,
      meetingsBooked: meetings === null ? null : meetings.filter((m) => new Date(m.created_at).getTime() >= from.getTime()).length,
      meetingsHeld: meetings === null ? null : meetings.filter((m) => !!m.meeting_date && new Date(m.meeting_date).getTime() <= now.getTime() && new Date(m.meeting_date).getTime() >= from.getTime() && !/cancel/.test(status(m))).length,
      meetingsCanceled: meetings === null ? null : meetings.filter((m) => /cancel/.test(status(m))).length,
    },
    decisions: { thesesWaitingReview: review as Count },
    crm: crmItems === null ? { readable: false, pendingApproval: [], approvedNotWritten: [], failed: [] } : crmLines(crmItems),
  };
}
