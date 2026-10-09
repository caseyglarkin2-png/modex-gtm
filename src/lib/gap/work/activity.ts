/**
 * ACTIVITY SEMANTICS (X20b, GAP OS sales execution engine, 2026-10-08; the mandate's section 10; C36-C38c of the
 * commercial context and execution audit). Server only.
 *
 * One projection over the existing ledger: every row that is selling activity becomes an ActivityEvent of one kind
 * with a BASIS: `provider` when a system of record proves it (Gmail message ids, HubSpot results, GAP's own ledger
 * for what GAP itself did), `self_reported` when the seller said so and nothing proves it (a copy, a dial link, a
 * recorded conversation, a manual send without its Gmail id, a set-aside). Delivered is never claimed: there is no
 * delivery receipt in the ledger, so `message_delivered` is not a kind here. A copied email is not a sent email; a
 * dial link is not a call; a recorded disposition is a conversation the seller reports.
 *
 * Every kind belongs to one CLASS, and the classes are what the accountability view and its counts keep apart:
 *   preparation   research, a proposal, a draft, an approval: work on the seller's side of the line. A preparation
 *                 event PREPARES a plan item (`prepares`); it never COMPLETES an outreach item (C36: a draft-only
 *                 first touch stays awaiting send; only a provider send or an explicit seller-reported send completes it)
 *   contact       a message sent, a reply received, a call attempted, a conversation completed, a meeting accepted
 *   commercial    a meeting booked (a calendar or provider proof), a meeting outcome captured, a deal advanced (an
 *                 explicit stage transition, or a defined milestone confirmed on one deal id: C38c). An outcome
 *                 captured never counts as booked (C37); accepted, booked and outcome captured stay three kinds
 *   maintenance   CRM updated: a note, a task, a task completed or a next step written to HubSpot (C38a). Never deal
 *                 advanced. A recovered write is an update, not a failure (C38b); off, conflict and failed each say so
 *   other         an obligation done without a deal milestone, a task deferred, work blocked
 *
 * The accountability view (/gap/activity) reads: what I intended (the day's plan), what was completed or only
 * prepared (today's activity against the plan's items), what needs attention (plan items still open or awaiting
 * send, and work blocked today), what the agents are handling (the agent tasks). No new table, no new row kind.
 */
import { WORK_OUTCOME } from './outcome-model';
import { DAY_PLANNED, loadDayPlan, type DayPlan, type PlanItem } from './plan';
import { nyDay, nyDayAt } from './dates';
import { COPY_RELEASED, DIRECT_REFUSED, DIRECT_SENT, DRAFT_REFUSED, DRAFT_SENT, DRAFTED, MANUAL_SENT, REPLY_COPIED, REPLY_DRAFTED, REPLY_SENT, COPY_REFUSED } from '../execution/draft-ledger';
import { COPY_REVISION_APPROVED, COPY_REVISION_PROPOSED } from '../execution/copy-revision';
import { CALL_ATTEMPT_STARTED } from '../execution/call-attempt';
import { COMMAND_APPLIED, COMMAND_REFUSED } from '../replies/commands-apply';
import { ARTIFACT_SENT, ARTIFACT_USED } from '../deals/artifacts';
import { TASK_SUCCEEDED, listAgentTasks, type AgentTask } from '../agents/tasks';
import { COMMITMENT_EVENT, type Commitment } from './commitment-model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const ACTIVITY_KINDS = [
  'research_generated',
  'proposal_prepared',
  'draft_created',
  'message_approved',
  'content_copied',
  'message_sent',
  'reply_received',
  'call_attempted',
  'conversation_completed',
  'meeting_accepted',
  'meeting_booked',
  'meeting_outcome_captured',
  'crm_updated',
  'deal_advanced',
  'obligation_done',
  'task_deferred',
  'work_blocked',
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export type ActivityBasis = 'provider' | 'self_reported';
export type ActivityClass = 'preparation' | 'contact' | 'commercial' | 'maintenance' | 'other';

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  research_generated: 'Research generated',
  proposal_prepared: 'Proposal prepared',
  draft_created: 'Draft created',
  message_approved: 'Message approved',
  content_copied: 'Content copied',
  message_sent: 'Message sent',
  reply_received: 'Reply received',
  call_attempted: 'Call attempted',
  conversation_completed: 'Conversation completed',
  meeting_accepted: 'Meeting accepted',
  meeting_booked: 'Meeting booked',
  meeting_outcome_captured: 'Meeting outcome captured',
  crm_updated: 'CRM updated',
  deal_advanced: 'Deal advanced',
  obligation_done: 'Obligation done',
  task_deferred: 'Task deferred',
  work_blocked: 'Work blocked',
};

export const ACTIVITY_CLASS: Record<ActivityKind, ActivityClass> = {
  research_generated: 'preparation',
  proposal_prepared: 'preparation',
  draft_created: 'preparation',
  message_approved: 'preparation',
  content_copied: 'preparation',
  message_sent: 'contact',
  reply_received: 'contact',
  call_attempted: 'contact',
  conversation_completed: 'contact',
  meeting_accepted: 'contact',
  meeting_booked: 'commercial',
  meeting_outcome_captured: 'commercial',
  deal_advanced: 'commercial',
  crm_updated: 'maintenance',
  obligation_done: 'other',
  task_deferred: 'other',
  work_blocked: 'other',
};

export const ACTIVITY_CLASS_LABEL: Record<ActivityClass, string> = {
  preparation: 'Preparation',
  contact: 'Contact',
  commercial: 'Commercial progress',
  maintenance: 'CRM maintenance',
  other: 'Set aside, blocked and done',
};

export interface ActivityEvent {
  kind: ActivityKind;
  basis: ActivityBasis;
  at: string;
  accountName: string | null;
  /** The person the event concerns (an address or a name), when the row names one. */
  who: string | null;
  /** One seller line. */
  line: string;
  /** The ledger row it came from. */
  ref: { kind: string; subjectType: string; subjectId: string };
  /** The plan item keys this event COMPLETES (the object, or the account and kind). */
  completes: string[];
  /** C36: the plan item keys this event only PREPARES (a draft, an approval): the item stays awaiting its send. */
  prepares: string[];
  /** C38c: the HubSpot deal a commercial event is scoped to; null when it names none. */
  dealId: string | null;
  /** C49: the provider's own id for the evidence (a Gmail message id, a HubSpot record id, a calendar event id): the same evidence recorded twice counts once. */
  evidence: string | null;
}

export type LedgerRow = { kind: string; subject_type: string; subject_id: string; actor?: string | null; payload: unknown; created_at: Date | string };

/**
 * C38c: an explicit deal stage transition, as a ledger row (payload: dealId, from, to, basis 'provider' when HubSpot
 * reported it, else self_reported). Nothing in this repo writes it yet (docs/gap/CRM_STAGE_AUTHORITY.md names every
 * writer of a stage); the projection accepts it so that advancement has exactly one evidence shape.
 */
export const DEAL_STAGE_CHANGED = 'deal.stage_changed' as const;
/** C37: a meeting BOOKED by a calendar or provider proof (payload: calendarEventId or providerRef, contactEmail, at). Nothing writes it yet. */
export const MEETING_BOOKED = 'meeting.booked' as const;

const RESEARCH_KINDS = ['research.background_run', 'signal.grounded_discovery', 'research.manual_fact', 'signal.discovery'];
const PROPOSAL_KINDS = ['research.proposal_prepared', COPY_REVISION_PROPOSED, TASK_SUCCEEDED];
const DRAFT_KINDS: readonly string[] = [DRAFTED, REPLY_DRAFTED];
const APPROVED_KINDS: readonly string[] = [COPY_REVISION_APPROVED, 'hypothesis.approved'];
const COPIED_KINDS: readonly string[] = [COPY_RELEASED, REPLY_COPIED];
const SENT_KINDS: readonly string[] = [DIRECT_SENT, DRAFT_SENT, REPLY_SENT, MANUAL_SENT];
const BLOCKED_KINDS = [DIRECT_REFUSED, DRAFT_REFUSED, COPY_REFUSED, 'enroll.refused', 'flag.refused', COMMAND_REFUSED];

/** Every ledger kind the projection reads (the loader's `in` filter). */
export const ACTIVITY_LEDGER_KINDS: readonly string[] = [
  ...RESEARCH_KINDS,
  ...PROPOSAL_KINDS,
  ...DRAFT_KINDS,
  ...APPROVED_KINDS,
  ...COPIED_KINDS,
  ...SENT_KINDS,
  'reply.ingested',
  CALL_ATTEMPT_STARTED,
  'disposition.recorded',
  'capture.meeting',
  MEETING_BOOKED,
  'crm.sync_result',
  DEAL_STAGE_CHANGED,
  ARTIFACT_USED,
  ARTIFACT_SENT,
  COMMITMENT_EVENT,
  WORK_OUTCOME,
  COMMAND_APPLIED,
  ...BLOCKED_KINDS,
];

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const words = (v: unknown) => String(v ?? '').replace(/_/g, ' ');
const accountOf = (r: LedgerRow, p: Record<string, unknown>): string | null => str(p.accountName) ?? (r.subject_type === 'account' ? r.subject_id : null);
const dayOf = (at: string) => nyDay(new Date(at));

/** The CRM proposal's change kind in words, when the result row carries it (crm-sync records outcome, objectRef, detail). */
const crmChangeWords = (p: Record<string, unknown>): string => {
  const k = str(p.changeKind) ?? (isObj(p.change) ? str(p.change.kind) : null);
  if (k === 'note') return 'a note';
  if (k === 'task') return 'a task';
  if (k === 'task_complete') return 'a task completed';
  if (k === 'deal_property') return 'a next step';
  return 'a note, task or next step';
};

/** Pure: one ledger row to zero or one activity event. */
export function projectActivity(r: LedgerRow): ActivityEvent | null {
  const p = isObj(r.payload) ? r.payload : {};
  const at = new Date(r.created_at).toISOString();
  const accountName = accountOf(r, p);
  const ref = { kind: r.kind, subjectType: r.subject_type, subjectId: r.subject_id };
  const ev = (kind: ActivityKind, basis: ActivityBasis, line: string, who: string | null = null, completes: string[] = [], extra: Partial<Pick<ActivityEvent, 'prepares' | 'dealId' | 'evidence'>> = {}): ActivityEvent => ({ kind, basis, at, accountName, who, line, ref, completes, prepares: extra.prepares ?? [], dealId: extra.dealId ?? null, evidence: extra.evidence ?? null });
  const accountKey = (tier: string) => (accountName ? [`${tier}:${accountName}:${dayOf(at)}`] : []);

  if (RESEARCH_KINDS.includes(r.kind)) return ev('research_generated', 'provider', accountName ? `Research ran on ${accountName}.` : 'Background research ran.');
  if (r.kind === 'research.proposal_prepared') return ev('proposal_prepared', 'provider', `A proposal was prepared${accountName ? ` for ${accountName}` : ''} (${words(p.status) || 'prepared'}).`);
  if (r.kind === COPY_REVISION_PROPOSED) return ev('proposal_prepared', 'provider', 'A revised email was proposed by the agent.', null, [], { prepares: str(p.decisionId) ? [`first_touch:${str(p.decisionId)}`] : [] });
  if (r.kind === TASK_SUCCEEDED) {
    const result = isObj(p.result) ? p.result : {};
    return { ...ev('proposal_prepared', 'provider', str(result.objection) ? `A talking point was prepared for an objection: "${String(result.objection).slice(0, 80)}".` : 'An agent task finished.'), accountName: str(result.accountName) ?? accountName };
  }
  // C36: a draft or an approval PREPARES the outreach item; it never completes it.
  if (r.kind === DRAFTED) return ev('draft_created', 'provider', `A Gmail draft was created${str(p.recipient) ? ` to ${str(p.recipient)}` : ''}; not a send until Sent shows it.`, str(p.recipient), [], { prepares: [`first_touch:${r.subject_id}`], evidence: str(p.gmailDraftId) });
  if (r.kind === REPLY_DRAFTED) return ev('draft_created', 'provider', 'A reply draft was created in Gmail; not an answer until Sent shows it.', str(p.recipient), [], { prepares: [`reply:${r.subject_id}`], evidence: str(p.gmailDraftId) });
  if (r.kind === COPY_REVISION_APPROVED) return ev('message_approved', 'provider', 'A revised email was approved.', null, [], { prepares: str(p.decisionId) ? [`first_touch:${str(p.decisionId)}`] : [] });
  if (r.kind === 'hypothesis.approved') return ev('message_approved', 'provider', `A thesis was approved${accountName ? ` at ${accountName}` : ''}.`, null, accountKey('review'));
  if (r.kind === COMMAND_APPLIED) {
    const command = String(p.command ?? '').toUpperCase();
    // The command rows carry the item key (START/NEXT), the commitment id (SKIP/DEFER) or the decision id (APPROVE).
    const key = str(p.itemKey) ?? (str(p.commitmentId) ? `commitment:${str(p.commitmentId)}` : null) ?? (str(p.decisionId) ? `first_touch:${str(p.decisionId)}` : null);
    if (command === 'APPROVE') return ev('message_approved', 'provider', 'Approved by email: the Gmail draft was created; not a send until Sent shows it.', null, [], { prepares: key ? [key] : [] });
    if (command === 'DEFER' || command === 'SKIP') return ev('task_deferred', 'self_reported', `${command === 'DEFER' ? 'Deferred' : 'Skipped'} by email${str(p.reason) ? `: ${str(p.reason)}` : ''}.`, null, key ? [key] : []);
    return null;
  }
  if (r.kind === COPY_RELEASED) return ev('content_copied', 'self_reported', `Email copy was copied for ${str(p.recipient) ?? 'a recipient'}; not a send until Sent shows it.`, str(p.recipient));
  if (r.kind === REPLY_COPIED) return ev('content_copied', 'self_reported', 'A reply was copied; not an answer until Sent shows it.');
  if (SENT_KINDS.includes(r.kind)) {
    const gmailId = str(p.gmailSentMessageId) ?? str(p.gmailMessageId);
    const basis: ActivityBasis = r.kind === MANUAL_SENT && !gmailId ? 'self_reported' : 'provider';
    const recipient = str(p.recipient);
    const completes = r.kind === REPLY_SENT ? [`reply:${r.subject_id}`] : [`first_touch:${r.subject_id}`, ...accountKey('follow_up')];
    return ev('message_sent', basis, r.kind === REPLY_SENT ? `Answered ${recipient ?? 'them'} in their thread${p.reconciledFromSent ? ' (found in Sent)' : ''}.` : `Sent touch ${Number(p.stepIndex ?? 0) + 1}${recipient ? ` to ${recipient}` : ''}${basis === 'self_reported' ? ' (said by hand, no Gmail id)' : ''}.`, recipient, completes, { evidence: gmailId });
  }
  if (r.kind === 'reply.ingested') return ev('reply_received', 'provider', `A reply arrived${str(p.toEmail) ? ` at ${str(p.toEmail)}` : ''}.`, null, [], { evidence: str(p.gmailMessageId) ?? r.subject_id });
  if (r.kind === CALL_ATTEMPT_STARTED) return ev('call_attempted', 'self_reported', 'The dial link was opened; not a call until its outcome is recorded.', typeof p.personaId === 'number' ? `persona ${p.personaId}` : null);
  if (r.kind === 'disposition.recorded') {
    if (p.humanConfirmed !== true) return null;
    const who = str(p.contactEmail);
    const cls = words(p.responseClass);
    // C37: accepted is the buyer's word as the seller recorded it; booked needs a calendar or provider proof (MEETING_BOOKED).
    if (p.responseClass === 'meeting_accepted') return ev('meeting_accepted', 'self_reported', `${who ?? 'They'} accepted a meeting; booked when the calendar shows it.`, who, [], { dealId: str(p.dealId) });
    return ev('conversation_completed', 'self_reported', `Recorded ${who ? `${who}'s` : 'their'} answer (${cls})${p.channel === 'call' ? ', by phone' : ''}.`, who, [...(str(p.inboundMessageId) ? [`reply:${str(p.inboundMessageId)}`] : []), ...accountKey('reply')]);
  }
  if (r.kind === MEETING_BOOKED) {
    const proof = str(p.calendarEventId) ?? str(p.providerRef);
    return ev('meeting_booked', proof ? 'provider' : 'self_reported', `A meeting is booked${str(p.contactEmail) ? ` with ${str(p.contactEmail)}` : ''}${proof ? ' (calendar)' : ' (said, no calendar proof)'}.`, str(p.contactEmail), [], { dealId: str(p.dealId), evidence: proof });
  }
  // C37: an outcome captured is a meeting that HAPPENED and what it yielded; never a booking.
  if (r.kind === 'capture.meeting') return ev('meeting_outcome_captured', 'self_reported', `A meeting outcome was captured (${words(p.outcome)})${p.outcome === 'next_meeting' ? '; the next meeting is booked when the calendar shows it' : ''}.`, str(p.contactEmail), [], { dealId: str(p.dealId) });
  // X14b: a deal artifact copied is content copied; found in Sent after the copy it is a message sent (provider-proven).
  if (r.kind === ARTIFACT_USED) return ev('content_copied', 'self_reported', `The ${words(p.kind) || 'artifact'} was copied${str(p.recipient) ? ` for ${str(p.recipient)}` : ''}; not sent until Sent shows it.`, str(p.recipient));
  if (r.kind === ARTIFACT_SENT) return ev('message_sent', 'provider', `The ${words(p.kind) || 'artifact'} went to ${str(p.recipient) ?? 'them'} (found in Sent).`, str(p.recipient), accountKey('deal'), { dealId: str(p.dealId), evidence: str(p.gmailSentMessageId) ?? str(p.gmailMessageId) });
  // C38a / C38b: a HubSpot note, task or next step is CRM maintenance, never advancement; each outcome maps apart.
  if (r.kind === 'crm.sync_result') {
    const outcome = String(p.outcome ?? '');
    const dealId = str(p.dealId);
    const forAccount = accountName ? ` for ${accountName}` : '';
    const objectRef = str(p.objectRef);
    if (outcome === 'written' || outcome === 'ok') return ev('crm_updated', 'provider', `HubSpot was updated${forAccount}: ${crmChangeWords(p)} (CRM maintenance, not a stage change).`, null, [], { dealId, evidence: objectRef });
    if (outcome === 'recovered') return ev('crm_updated', 'provider', `HubSpot already held ${crmChangeWords(p)}${forAccount}: a write whose answer was lost was recovered, not repeated.`, null, [], { dealId, evidence: objectRef });
    if (outcome === 'off') return ev('work_blocked', 'provider', `HubSpot writes are off here: the approved change${forAccount} is standing, not written${str(p.detail) ? ` (${str(p.detail)})` : ''}.`, null, [], { dealId });
    if (outcome === 'conflict') return ev('work_blocked', 'provider', `HubSpot holds a newer value than the one you saw${forAccount}; nothing was overwritten.`, null, [], { dealId });
    return ev('work_blocked', 'provider', `A HubSpot change failed${forAccount}${str(p.detail) ? `: ${str(p.detail)}` : ''}.`, null, [], { dealId });
  }
  // C38c: an explicit stage transition on one deal is advancement, with its basis.
  if (r.kind === DEAL_STAGE_CHANGED) {
    const dealId = str(p.dealId);
    if (!dealId) return null;
    const basis: ActivityBasis = p.basis === 'provider' || p.source === 'hubspot' ? 'provider' : 'self_reported';
    return ev('deal_advanced', basis, `Deal ${str(p.dealName) ?? dealId} moved${str(p.from) ? ` from ${words(p.from)}` : ''} to ${words(p.to) || 'a new stage'}${basis === 'provider' ? ' (HubSpot)' : ' (said; HubSpot not read)'}.`, null, [...(str(p.commitmentId) ? [`commitment:${str(p.commitmentId)}`] : []), ...accountKey('deal')], { dealId, evidence: basis === 'provider' ? `${dealId}:${str(p.to) ?? ''}` : null });
  }
  if (r.kind === COMMITMENT_EVENT) {
    if (p.op !== 'status' || !isObj(p.commitment)) return null;
    const c = p.commitment as unknown as Commitment;
    const key = `commitment:${c.commitmentId}`;
    if (c.status === 'done') {
      const confirmed = !!c.proof && c.proof.kind !== 'seller';
      const basis: ActivityBasis = confirmed ? 'provider' : 'self_reported';
      // C38c: advancement is a DEFINED milestone (deals/action-plan.ts) done on ONE deal id; a done to-do is an obligation done.
      if (c.kind === 'deal_step' && c.dealId && c.detail?.milestone) return ev('deal_advanced', basis, `Milestone reached on the deal: ${c.title}${confirmed ? ` (${words(c.proof!.kind)})` : ' (your word)'}.`, null, [key, ...accountKey('deal')], { dealId: c.dealId });
      return ev('obligation_done', basis, `Done: ${c.title}${c.kind === 'deal_step' && !c.dealId ? ' (a deal step with no deal named: not advancement)' : ''}.`, null, [key, ...(c.kind === 'deal_step' ? accountKey('deal') : [])], { dealId: c.dealId ?? null });
    }
    if (c.status === 'snoozed' || c.status === 'skipped') return ev('task_deferred', 'self_reported', `${c.status === 'snoozed' ? 'Snoozed' : 'Skipped'}: ${c.title}${c.reason ? ` (${c.reason})` : ''}.`, null, [key]);
    return null;
  }
  if (r.kind === WORK_OUTCOME) {
    if (p.kind === 'snoozed' || p.kind === 'skipped') return ev('task_deferred', 'self_reported', `${p.kind === 'snoozed' ? 'Snoozed' : 'Set aside'}${accountName ? ` ${accountName}` : ''}${str(p.reason) ? ` (${str(p.reason)})` : ''}.`, null, accountName ? ['follow_up', 'deal', 'review', 'ready', 'admin'].map((t) => `${t}:${accountName}:${dayOf(at)}`) : []);
    return null;
  }
  if (BLOCKED_KINDS.includes(r.kind)) return ev('work_blocked', 'provider', `${r.kind === COMMAND_REFUSED ? 'An email command was refused' : 'An action was refused'}${str(p.reason) ? `: ${words(p.reason)}` : ''}.`);
  return null;
}

/** C49: how much of the window the read covered. `unavailable` is never a zero-activity day. */
export type ActivityCoverage = 'complete' | 'partial' | 'unavailable';

export interface ActivityRead {
  events: ActivityEvent[];
  coverage: ActivityCoverage;
  /** Why the coverage is not complete, in words; null when complete. */
  detail: string | null;
  /** Ledger rows read (before projection and dedup). */
  rows: number;
  /** Events dropped as the same provider evidence recorded twice. */
  deduped: number;
}

/** One page of the ledger read (the Postgres default is 1,000; a window holding more is paged by a (created_at, id) cursor). */
export const ACTIVITY_PAGE = 1000;
/** The most pages one read makes before it says partial (20,000 rows: no seller day is that long; a runaway writer is). */
export const ACTIVITY_MAX_PAGES = 20;

type PagedRow = LedgerRow & { id?: string };

/**
 * The activity in a window, newest first, with its COVERAGE (C49): complete when every row of the window was read,
 * partial when the page cap stopped the read (the events are the newest ones), unavailable when the ledger threw or
 * no ledger client was given. A thrown read never reads as a zero-activity day. The same provider evidence recorded
 * twice (a reconcile that wrote the same Gmail id again) counts once.
 */
export async function loadActivity(prisma: PrismaLike, opts: { since: Date; until: Date; pageSize?: number; maxPages?: number }): Promise<ActivityRead> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return { events: [], coverage: 'unavailable', detail: 'no ledger client', rows: 0, deduped: 0 };
  const pageSize = Math.max(1, opts.pageSize ?? ACTIVITY_PAGE);
  const maxPages = Math.max(1, opts.maxPages ?? ACTIVITY_MAX_PAGES);
  const rows: PagedRow[] = [];
  let coverage: ActivityCoverage = 'complete';
  let detail: string | null = null;
  let cursor: { at: Date; id: string | null } | null = null;
  try {
    for (let page = 0; page < maxPages; page += 1) {
      const window = { created_at: { gte: opts.since, lte: opts.until }, kind: { in: [...ACTIVITY_LEDGER_KINDS] } };
      const where = cursor
        ? { AND: [window, cursor.id ? { OR: [{ created_at: { lt: cursor.at } }, { created_at: cursor.at, id: { lt: cursor.id } }] } : { created_at: { lt: cursor.at } }] }
        : window;
      const batch: PagedRow[] = await prisma.gapAuditEvent.findMany({ where, select: { id: true, kind: true, subject_type: true, subject_id: true, actor: true, payload: true, created_at: true }, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: pageSize });
      rows.push(...batch);
      if (batch.length < pageSize) break;
      const last = batch[batch.length - 1];
      cursor = { at: new Date(last.created_at), id: typeof last.id === 'string' ? last.id : null };
      if (page === maxPages - 1) {
        coverage = 'partial';
        detail = `the window holds more than ${rows.length} rows; the newest ${rows.length} were read`;
      }
    }
  } catch (err) {
    return { events: [], coverage: 'unavailable', detail: err instanceof Error ? err.message : String(err), rows: rows.length, deduped: 0 };
  }
  const seen = new Set<string>();
  let deduped = 0;
  const events: ActivityEvent[] = [];
  for (const e of rows.map(projectActivity)) {
    if (!e) continue;
    if (e.basis === 'provider' && e.evidence) {
      const key = `${e.kind}:${e.evidence}`;
      if (seen.has(key)) {
        deduped += 1;
        continue;
      }
      seen.add(key);
    }
    events.push(e);
  }
  return { events, coverage, detail, rows: rows.length, deduped };
}

export interface ActivityCounts {
  kind: ActivityKind;
  label: string;
  cls: ActivityClass;
  provider: number;
  selfReported: number;
}

/** C36: `prepared` is an outreach item with a draft or an approval and no send: awaiting its send, not done. */
export type IntendedStatus = 'done' | 'prepared' | 'set_aside' | 'open';

export interface Accountability {
  day: string;
  /** What I intended: the day's plan, each item with what happened to it. */
  intended: Array<{ item: PlanItem; status: IntendedStatus; by: ActivityEvent | null }>;
  /** What was completed today, by kind, provider-proven apart from self-reported, in class order. */
  completed: ActivityCounts[];
  /** Today's events, newest first. */
  events: ActivityEvent[];
  /** What needs attention: plan items still open, those prepared but not sent, and the work blocked today. */
  attention: { open: PlanItem[]; prepared: PlanItem[]; blocked: ActivityEvent[] };
  /** What the agents are handling. */
  agents: { queued: AgentTask[]; running: AgentTask[]; succeeded: AgentTask[]; failed: AgentTask[] };
  planned: boolean;
  /** C49: how much of the day the ledger read covered; `unavailable` means the counts are not counts of zero. */
  coverage: ActivityCoverage;
  coverageDetail: string | null;
}

const CLASS_ORDER: readonly ActivityClass[] = ['preparation', 'contact', 'commercial', 'maintenance', 'other'];

/** Pure: the accountability view from the plan, the day's events and the tasks. */
export function accountability(i: { day: string; plan: DayPlan | null; events: readonly ActivityEvent[]; tasks: readonly AgentTask[]; coverage?: ActivityCoverage; coverageDetail?: string | null }): Accountability {
  const byKey = new Map<string, ActivityEvent>();
  const preparedByKey = new Map<string, ActivityEvent>();
  for (const e of [...i.events].sort((a, b) => a.at.localeCompare(b.at))) {
    for (const k of e.completes) byKey.set(k, e);
    for (const k of e.prepares) preparedByKey.set(k, e);
  }
  const intended = (i.plan?.items ?? []).map((item) => {
    const by = byKey.get(item.key) ?? null;
    if (by) return { item, status: (by.kind === 'task_deferred' ? 'set_aside' : 'done') as IntendedStatus, by };
    const prepared = preparedByKey.get(item.key) ?? null;
    return { item, status: (prepared ? 'prepared' : 'open') as IntendedStatus, by: prepared };
  });
  const completed: ActivityCounts[] = [...ACTIVITY_KINDS]
    .sort((a, b) => CLASS_ORDER.indexOf(ACTIVITY_CLASS[a]) - CLASS_ORDER.indexOf(ACTIVITY_CLASS[b]))
    .map((kind) => ({
      kind,
      label: ACTIVITY_LABEL[kind],
      cls: ACTIVITY_CLASS[kind],
      provider: i.events.filter((e) => e.kind === kind && e.basis === 'provider').length,
      selfReported: i.events.filter((e) => e.kind === kind && e.basis === 'self_reported').length,
    }))
    .filter((c) => c.provider + c.selfReported > 0);
  const todays = (t: AgentTask) => nyDay(new Date(t.queuedAt)) === i.day;
  return {
    day: i.day,
    intended,
    completed,
    events: [...i.events].sort((a, b) => b.at.localeCompare(a.at)),
    attention: {
      open: intended.filter((x) => x.status === 'open').map((x) => x.item),
      prepared: intended.filter((x) => x.status === 'prepared').map((x) => x.item),
      blocked: i.events.filter((e) => e.kind === 'work_blocked'),
    },
    agents: {
      queued: i.tasks.filter((t) => t.status === 'queued'),
      running: i.tasks.filter((t) => t.status === 'running'),
      succeeded: i.tasks.filter((t) => t.status === 'succeeded' && todays(t)),
      failed: i.tasks.filter((t) => t.status === 'failed' && todays(t)),
    },
    planned: !!i.plan,
    coverage: i.coverage ?? 'complete',
    coverageDetail: i.coverageDetail ?? null,
  };
}

/** The view for a New York day. */
export async function loadAccountability(prisma: PrismaLike, now: Date, day = nyDay(now)): Promise<Accountability> {
  const start = nyDayAt(day, 0);
  const end = new Date(Math.min(now.getTime(), nyDayAt(day, 0).getTime() + 86_400_000 - 1));
  const [plan, read, tasks] = await Promise.all([loadDayPlan(prisma, day).catch(() => null), loadActivity(prisma, { since: start, until: end }), listAgentTasks(prisma, { now }).catch(() => [] as AgentTask[])]);
  return accountability({ day, plan, events: read.events, tasks, coverage: read.coverage, coverageDetail: read.detail });
}

export { DAY_PLANNED };
