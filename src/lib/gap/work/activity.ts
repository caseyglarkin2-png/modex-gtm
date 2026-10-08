/**
 * ACTIVITY SEMANTICS (X20b, GAP OS sales execution engine, 2026-10-08; the mandate's section 10). Server only.
 *
 * One projection over the existing ledger: every row that is selling activity becomes an ActivityEvent of one kind
 * with a BASIS: `provider` when a system of record proves it (Gmail message ids, HubSpot results, GAP's own ledger
 * for what GAP itself did), `self_reported` when the seller said so and nothing proves it (a copy, a dial link, a
 * recorded conversation, a manual send without its Gmail id, a set-aside). Delivered is never claimed: there is no
 * delivery receipt in the ledger, so `message_delivered` is not a kind here. A copied email is not a sent email; a
 * dial link is not a call; a recorded disposition is a conversation the seller reports.
 *
 * The accountability view (/gap/activity) reads: what I intended (the day's plan), what was completed (today's
 * activity against the plan's items), what needs attention (plan items still open, and work blocked today), what
 * the agents are handling (the agent tasks). No new table, no new row kind.
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
  'meeting_booked',
  'deal_advanced',
  'task_deferred',
  'work_blocked',
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export type ActivityBasis = 'provider' | 'self_reported';

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
  meeting_booked: 'Meeting booked',
  deal_advanced: 'Deal advanced',
  task_deferred: 'Task deferred',
  work_blocked: 'Work blocked',
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
  /** The plan item keys this event can complete (the object, or the account and kind). */
  completes: string[];
}

export type LedgerRow = { kind: string; subject_type: string; subject_id: string; actor?: string | null; payload: unknown; created_at: Date | string };

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
  'crm.sync_result',
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

/** Pure: one ledger row to zero or one activity event. */
export function projectActivity(r: LedgerRow): ActivityEvent | null {
  const p = isObj(r.payload) ? r.payload : {};
  const at = new Date(r.created_at).toISOString();
  const accountName = accountOf(r, p);
  const ref = { kind: r.kind, subjectType: r.subject_type, subjectId: r.subject_id };
  const ev = (kind: ActivityKind, basis: ActivityBasis, line: string, who: string | null = null, completes: string[] = []): ActivityEvent => ({ kind, basis, at, accountName, who, line, ref, completes });
  const accountKey = (tier: string) => (accountName ? [`${tier}:${accountName}:${dayOf(at)}`] : []);

  if (RESEARCH_KINDS.includes(r.kind)) return ev('research_generated', 'provider', accountName ? `Research ran on ${accountName}.` : 'Background research ran.');
  if (r.kind === 'research.proposal_prepared') return ev('proposal_prepared', 'provider', `A proposal was prepared${accountName ? ` for ${accountName}` : ''} (${words(p.status) || 'prepared'}).`);
  if (r.kind === COPY_REVISION_PROPOSED) return ev('proposal_prepared', 'provider', 'A revised email was proposed by the agent.', null, str(p.decisionId) ? [`first_touch:${str(p.decisionId)}`] : []);
  if (r.kind === TASK_SUCCEEDED) {
    const result = isObj(p.result) ? p.result : {};
    return { ...ev('proposal_prepared', 'provider', str(result.objection) ? `A talking point was prepared for an objection: "${String(result.objection).slice(0, 80)}".` : 'An agent task finished.'), accountName: str(result.accountName) ?? accountName };
  }
  if (r.kind === DRAFTED) return ev('draft_created', 'provider', `A Gmail draft was created${str(p.recipient) ? ` to ${str(p.recipient)}` : ''}.`, str(p.recipient), [`first_touch:${r.subject_id}`]);
  if (r.kind === REPLY_DRAFTED) return ev('draft_created', 'provider', 'A reply draft was created in Gmail.', str(p.recipient), [`reply:${r.subject_id}`]);
  if (r.kind === COPY_REVISION_APPROVED) return ev('message_approved', 'provider', 'A revised email was approved.', null, str(p.decisionId) ? [`first_touch:${str(p.decisionId)}`] : []);
  if (r.kind === 'hypothesis.approved') return ev('message_approved', 'provider', `A thesis was approved${accountName ? ` at ${accountName}` : ''}.`, null, accountKey('review'));
  if (r.kind === COMMAND_APPLIED) {
    const command = String(p.command ?? '').toUpperCase();
    // The command rows carry the item key (START/NEXT), the commitment id (SKIP/DEFER) or the decision id (APPROVE).
    const key = str(p.itemKey) ?? (str(p.commitmentId) ? `commitment:${str(p.commitmentId)}` : null) ?? (str(p.decisionId) ? `first_touch:${str(p.decisionId)}` : null);
    if (command === 'APPROVE') return ev('message_approved', 'provider', 'Approved by email: the Gmail draft was created.', null, key ? [key] : []);
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
    return ev('message_sent', basis, r.kind === REPLY_SENT ? `Answered ${recipient ?? 'them'} in their thread${p.reconciledFromSent ? ' (found in Sent)' : ''}.` : `Sent touch ${Number(p.stepIndex ?? 0) + 1}${recipient ? ` to ${recipient}` : ''}${basis === 'self_reported' ? ' (said by hand, no Gmail id)' : ''}.`, recipient, completes);
  }
  if (r.kind === 'reply.ingested') return ev('reply_received', 'provider', `A reply arrived${str(p.toEmail) ? ` at ${str(p.toEmail)}` : ''}.`, null);
  if (r.kind === CALL_ATTEMPT_STARTED) return ev('call_attempted', 'self_reported', 'The dial link was opened; not a call until its outcome is recorded.', typeof p.personaId === 'number' ? `persona ${p.personaId}` : null);
  if (r.kind === 'disposition.recorded') {
    if (p.humanConfirmed !== true) return null;
    const who = str(p.contactEmail);
    const cls = words(p.responseClass);
    if (p.responseClass === 'meeting_accepted') return ev('meeting_booked', 'self_reported', `${who ?? 'They'} accepted a meeting.`, who, who ? [] : []);
    return ev('conversation_completed', 'self_reported', `Recorded ${who ? `${who}'s` : 'their'} answer (${cls})${p.channel === 'call' ? ', by phone' : ''}.`, who, [...(str(p.inboundMessageId) ? [`reply:${str(p.inboundMessageId)}`] : []), ...accountKey('reply')]);
  }
  if (r.kind === 'capture.meeting') return ev('meeting_booked', 'self_reported', `A meeting outcome was captured (${words(p.outcome)}).`);
  // X14b: a deal artifact copied is content copied; found in Sent after the copy it is a message sent (provider-proven).
  if (r.kind === ARTIFACT_USED) return ev('content_copied', 'self_reported', `The ${words(p.kind) || 'artifact'} was copied${str(p.recipient) ? ` for ${str(p.recipient)}` : ''}; not sent until Sent shows it.`, str(p.recipient));
  if (r.kind === ARTIFACT_SENT) return ev('message_sent', 'provider', `The ${words(p.kind) || 'artifact'} went to ${str(p.recipient) ?? 'them'} (found in Sent).`, str(p.recipient), accountKey('deal'));
  if (r.kind === 'crm.sync_result') return p.outcome === 'ok' || p.outcome === 'written' ? ev('deal_advanced', 'provider', `HubSpot was updated${accountName ? ` for ${accountName}` : ''}.`) : ev('work_blocked', 'provider', `A HubSpot change failed${str(p.detail) ? `: ${str(p.detail)}` : ''}.`);
  if (r.kind === COMMITMENT_EVENT) {
    if (p.op !== 'status' || !isObj(p.commitment)) return null;
    const c = p.commitment as unknown as Commitment;
    const key = `commitment:${c.commitmentId}`;
    if (c.status === 'done') return c.kind === 'deal_step' ? ev('deal_advanced', c.proof?.kind === 'ledger' || c.proof?.kind === 'disposition' ? 'provider' : 'self_reported', `Deal step done: ${c.title}.`, null, [key, ...accountKey('deal')]) : null;
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

/** The activity in a window, newest first. Soft: an unreadable ledger reads as nothing (never as success). */
export async function loadActivity(prisma: PrismaLike, opts: { since: Date; until: Date; take?: number }): Promise<ActivityEvent[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const rows: LedgerRow[] = await prisma.gapAuditEvent
    .findMany({ where: { created_at: { gte: opts.since, lte: opts.until }, kind: { in: [...ACTIVITY_LEDGER_KINDS] } }, select: { kind: true, subject_type: true, subject_id: true, actor: true, payload: true, created_at: true }, orderBy: { created_at: 'desc' }, take: opts.take ?? 1000 })
    .catch(() => []);
  return rows.map(projectActivity).filter((e): e is ActivityEvent => e !== null);
}

export interface ActivityCounts {
  kind: ActivityKind;
  label: string;
  provider: number;
  selfReported: number;
}

export type IntendedStatus = 'done' | 'set_aside' | 'open';

export interface Accountability {
  day: string;
  /** What I intended: the day's plan, each item with what happened to it. */
  intended: Array<{ item: PlanItem; status: IntendedStatus; by: ActivityEvent | null }>;
  /** What was completed today, by kind, provider-proven apart from self-reported. */
  completed: ActivityCounts[];
  /** Today's events, newest first. */
  events: ActivityEvent[];
  /** What needs attention: plan items still open, and the work blocked today. */
  attention: { open: PlanItem[]; blocked: ActivityEvent[] };
  /** What the agents are handling. */
  agents: { queued: AgentTask[]; running: AgentTask[]; succeeded: AgentTask[]; failed: AgentTask[] };
  planned: boolean;
}

/** Pure: the accountability view from the plan, the day's events and the tasks. */
export function accountability(i: { day: string; plan: DayPlan | null; events: readonly ActivityEvent[]; tasks: readonly AgentTask[] }): Accountability {
  const byKey = new Map<string, ActivityEvent>();
  for (const e of [...i.events].sort((a, b) => a.at.localeCompare(b.at))) for (const k of e.completes) byKey.set(k, e);
  const intended = (i.plan?.items ?? []).map((item) => {
    const by = byKey.get(item.key) ?? null;
    const status: IntendedStatus = !by ? 'open' : by.kind === 'task_deferred' ? 'set_aside' : 'done';
    return { item, status, by };
  });
  const completed: ActivityCounts[] = ACTIVITY_KINDS.map((kind) => ({
    kind,
    label: ACTIVITY_LABEL[kind],
    provider: i.events.filter((e) => e.kind === kind && e.basis === 'provider').length,
    selfReported: i.events.filter((e) => e.kind === kind && e.basis === 'self_reported').length,
  })).filter((c) => c.provider + c.selfReported > 0);
  const todays = (t: AgentTask) => nyDay(new Date(t.queuedAt)) === i.day;
  return {
    day: i.day,
    intended,
    completed,
    events: [...i.events].sort((a, b) => b.at.localeCompare(a.at)),
    attention: { open: intended.filter((x) => x.status === 'open').map((x) => x.item), blocked: i.events.filter((e) => e.kind === 'work_blocked') },
    agents: {
      queued: i.tasks.filter((t) => t.status === 'queued'),
      running: i.tasks.filter((t) => t.status === 'running'),
      succeeded: i.tasks.filter((t) => t.status === 'succeeded' && todays(t)),
      failed: i.tasks.filter((t) => t.status === 'failed' && todays(t)),
    },
    planned: !!i.plan,
  };
}

/** The view for a New York day. */
export async function loadAccountability(prisma: PrismaLike, now: Date, day = nyDay(now)): Promise<Accountability> {
  const start = nyDayAt(day, 0);
  const end = new Date(Math.min(now.getTime(), nyDayAt(day, 0).getTime() + 86_400_000 - 1));
  const [plan, events, tasks] = await Promise.all([loadDayPlan(prisma, day).catch(() => null), loadActivity(prisma, { since: start, until: end }), listAgentTasks(prisma, { now }).catch(() => [] as AgentTask[])]);
  return accountability({ day, plan, events, tasks });
}

export { DAY_PLANNED };
