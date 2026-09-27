/**
 * EXECUTION LEARNING (red team T10, 2026-09-27).
 *
 * The primary Learning metrics, measured against what was actually SENT:
 *
 *   denominator   people actually sent to (person-level send history: the
 *                 GAP send ledger's MANUAL_SENT, DIRECT_SENT and DRAFT_SENT
 *                 rows, one person per recipient address, internal
 *                 recipients excluded). Never replied conversations, never
 *                 routing decisions, never cards Casey clicked.
 *   reply / send          people with a human reply after their first send
 *   meeting / send        people with a confirmed meeting after their first send
 *   truth yield           people whose sent hypothesis reached a human verdict
 *                         (confirmed, partially confirmed or rejected)
 *   problem ack / send    people who confirmed the problem (fully or partly)
 *   root cause / send     people whose sent hypothesis has a confirmed root cause
 *
 * Attribution is the person's FIRST send, read from the sent execution
 * record itself: sequence version, copy version (the content hash of what
 * went out), sender, execution engine and the evidence tier stamped at send
 * time. A person reached through several routing cards is one person,
 * attributed once, and every outcome is joined by person, not by card: no
 * rate moves because a card expired, was superseded or was never clicked.
 *
 * Every rate is an HonestRate (stats.ts): suppressed below RELIABLE_N, with a
 * Wilson interval above it.
 */
import { DIRECT_SENT, DRAFT_SENT, DRAFT_SUBJECT_TYPE, DRAFTED, MANUAL_SENT } from '../execution/draft-ledger';
import { isInternalRecipient } from '../sequence/internal-recipient';
import { selectConfirmedBids } from '../bid/select';
import { AUTO_REPLY_SUBJECT } from '../replies/domains';
import { honestRate, type HonestRate } from './stats';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** What an old ledger row that predates the stamp reads as. */
export const UNRECORDED = 'unrecorded';

export interface SendRecord {
  decisionId: string;
  personaId: number | null;
  /** Lowercased recipient address: the person. */
  recipient: string;
  hypothesisId: string | null;
  stepIndex: number;
  sentAt: Date;
  engine: string;
  sender: string;
  sequenceVersionId: string;
  copyVersion: string;
  evidenceTier: string;
}

const lower = (s: unknown) => String(s ?? '').trim().toLowerCase();
const str = (v: unknown, fallback = UNRECORDED) => (typeof v === 'string' && v.trim() ? v.trim() : fallback);

/** Every GAP send from the ledger (the same rows person-level send history reads). */
export async function loadSendRecords(prisma: PrismaLike): Promise<SendRecord[]> {
  const rows: Array<{ subject_id: string; kind: string; payload: unknown; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, kind: { in: [MANUAL_SENT, DIRECT_SENT, DRAFTED, DRAFT_SENT] } },
    select: { subject_id: true, kind: true, payload: true, created_at: true },
  });
  const drafts = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    if (r.kind === DRAFTED && typeof p.gmailDraftId === 'string') drafts.set(p.gmailDraftId, p);
  }
  const out: SendRecord[] = [];
  for (const r of rows) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    let base: Record<string, unknown> | null = null;
    let engine = '';
    if (r.kind === MANUAL_SENT || r.kind === DIRECT_SENT) {
      base = p;
      engine = str(p.engine, r.kind === MANUAL_SENT ? 'manual' : 'gmail_direct');
    } else if (r.kind === DRAFT_SENT && typeof p.gmailDraftId === 'string') {
      base = drafts.get(p.gmailDraftId) ?? null;
      engine = 'gmail_draft';
    }
    if (!base) continue;
    const recipient = lower(base.recipient);
    if (!recipient.includes('@') || isInternalRecipient(recipient)) continue;
    const sentAt = typeof p.sentAt === 'string' ? new Date(p.sentAt) : r.created_at;
    out.push({
      decisionId: r.subject_id,
      personaId: typeof base.personaId === 'number' ? base.personaId : null,
      recipient,
      hypothesisId: typeof base.hypothesisId === 'string' ? base.hypothesisId : null,
      stepIndex: typeof base.stepIndex === 'number' ? base.stepIndex : 0,
      sentAt,
      engine,
      sender: str(base.senderIdentity),
      sequenceVersionId: str(base.sequenceVersionId),
      copyVersion: typeof base.contentHash === 'string' && base.contentHash ? base.contentHash.slice(0, 12) : UNRECORDED,
      evidenceTier: str(base.evidenceTier),
    });
  }
  return out;
}

export interface PersonOutcome {
  replied: boolean;
  meeting: boolean;
  problemAck: boolean;
  rootCause: boolean;
  truth: boolean;
}

export interface ContactedPerson {
  recipient: string;
  /** The person's first send: the attribution record. */
  first: SendRecord;
  sends: number;
  hypothesisIds: string[];
  outcome: PersonOutcome;
}

/** Group sends into people (first send = earliest sentAt; ties by step). Pure. */
export function peopleFromSends(sends: readonly SendRecord[]): Map<string, { first: SendRecord; sends: SendRecord[] }> {
  const people = new Map<string, { first: SendRecord; sends: SendRecord[] }>();
  for (const s of sends) {
    const p = people.get(s.recipient);
    if (!p) people.set(s.recipient, { first: s, sends: [s] });
    else {
      p.sends.push(s);
      if (s.sentAt.getTime() < p.first.sentAt.getTime() || (s.sentAt.getTime() === p.first.sentAt.getTime() && s.stepIndex < p.first.stepIndex)) p.first = s;
    }
  }
  return people;
}

const PROBLEM_ACK = new Set(['problem_confirmed', 'problem_partially_confirmed']);
const TRUTH_STATUSES = new Set(['confirmed', 'partially_confirmed', 'rejected']);
/** Not a reply: a machine or nobody answered (metrics.ts NON_SUBSTANTIVE). */
const NOT_A_REPLY = new Set(['no_answer', 'voicemail', 'gatekeeper', 'out_of_office', 'bounce', 'no_signal']);

/** Outcomes per person, each strictly AFTER that person's first send. */
export async function loadOutcomes(prisma: PrismaLike, people: Map<string, { first: SendRecord; sends: SendRecord[] }>): Promise<Map<string, PersonOutcome>> {
  const recipients = [...people.keys()];
  const out = new Map<string, PersonOutcome>(recipients.map((r) => [r, { replied: false, meeting: false, problemAck: false, rootCause: false, truth: false }]));
  if (recipients.length === 0) return out;
  const firstAt = (r: string) => people.get(r)!.first.sentAt.getTime();

  const inbound: Array<{ from_email: string; received_at: Date; subject: string | null }> = await prisma.inboundMessage.findMany({
    where: { OR: recipients.map((r) => ({ from_email: { equals: r, mode: 'insensitive' } })) },
    select: { from_email: true, received_at: true, subject: true },
  });
  for (const m of inbound) {
    const r = lower(m.from_email);
    if (out.has(r) && new Date(m.received_at).getTime() > firstAt(r) && !AUTO_REPLY_SUBJECT.test(m.subject ?? '')) out.get(r)!.replied = true;
  }
  // A colleague answering FOR the person (the GAP mailbox attributes it to the emailed recipient).
  const attributed: Array<{ payload: unknown }> = await prisma.gapAuditEvent.findMany({ where: { kind: 'mailbox.reply' }, select: { payload: true } });
  for (const a of attributed) {
    const p = (a.payload ?? {}) as { recipients?: unknown; receivedAt?: unknown };
    const at = typeof p.receivedAt === 'string' ? new Date(p.receivedAt).getTime() : NaN;
    for (const r of Array.isArray(p.recipients) ? p.recipients : []) {
      const key = lower(r);
      if (out.has(key) && at > firstAt(key)) out.get(key)!.replied = true;
    }
  }

  const dispositions: Array<{ contact_email: string | null; response_class: string; channel: string; created_at: Date }> = await prisma.conversationDisposition.findMany({
    where: { human_confirmed: true, OR: recipients.map((r) => ({ contact_email: { equals: r, mode: 'insensitive' } })) },
    select: { contact_email: true, response_class: true, channel: true, created_at: true },
  });
  for (const d of dispositions) {
    const r = lower(d.contact_email);
    if (!out.has(r) || new Date(d.created_at).getTime() <= firstAt(r)) continue;
    const o = out.get(r)!;
    if (d.channel === 'email' && !NOT_A_REPLY.has(d.response_class)) o.replied = true;
    if (d.response_class === 'meeting_accepted' || d.channel === 'meeting') o.meeting = true;
    if (PROBLEM_ACK.has(d.response_class)) o.problemAck = true;
  }

  const hypothesisIds = [...new Set([...people.values()].flatMap((p) => p.sends.map((s) => s.hypothesisId).filter((h): h is string => !!h)))];
  if (hypothesisIds.length) {
    const hyps: Array<{ id: string; status: string }> = await prisma.prospectingHypothesis.findMany({ where: { id: { in: hypothesisIds } }, select: { id: true, status: true } });
    const truthHyps = new Set(hyps.filter((h) => TRUTH_STATUSES.has(h.status)).map((h) => h.id));
    const bids: Array<{ id: string; hypothesis_id: string; type: string; human_confirmed: boolean; supersedes_id: string | null }> = await prisma.buyerInputData.findMany({
      where: { hypothesis_id: { in: hypothesisIds } },
      select: { id: true, hypothesis_id: true, type: true, human_confirmed: true, supersedes_id: true },
    });
    const confirmed = new Set(selectConfirmedBids(bids.map((b) => ({ id: b.id, humanConfirmed: b.human_confirmed === true, supersedesId: b.supersedes_id ?? null }))).map((b) => b.id));
    const rootCauseHyps = new Set(bids.filter((b) => confirmed.has(b.id) && b.type === 'root_cause').map((b) => b.hypothesis_id));
    for (const [r, p] of people) {
      const hs = p.sends.map((s) => s.hypothesisId).filter((h): h is string => !!h);
      const o = out.get(r)!;
      if (hs.some((h) => truthHyps.has(h))) o.truth = true;
      if (hs.some((h) => rootCauseHyps.has(h))) o.rootCause = true;
    }
  }
  return out;
}

export interface ExecutionMetrics {
  /** People actually sent to: THE denominator. */
  peopleContacted: number;
  /** Individual sends (all steps), for context only; never a rate denominator. */
  sends: number;
  replyPerSend: HonestRate;
  meetingPerSend: HonestRate;
  truthYield: HonestRate;
  problemAckPerSend: HonestRate;
  rootCausePerSend: HonestRate;
}

export interface ExecutionBreakdownRow {
  key: string;
  metrics: ExecutionMetrics;
}

export interface ExecutionLearning {
  overall: ExecutionMetrics;
  /** First-send attribution. */
  bySequenceVersion: ExecutionBreakdownRow[];
  byCopyVersion: ExecutionBreakdownRow[];
  bySender: ExecutionBreakdownRow[];
  byEngine: ExecutionBreakdownRow[];
  byEvidenceTier: ExecutionBreakdownRow[];
}

function metricsOf(people: readonly ContactedPerson[]): ExecutionMetrics {
  const n = people.length;
  const count = (f: (o: PersonOutcome) => boolean) => people.filter((p) => f(p.outcome)).length;
  return {
    peopleContacted: n,
    sends: people.reduce((a, p) => a + p.sends, 0),
    replyPerSend: honestRate(count((o) => o.replied), n),
    meetingPerSend: honestRate(count((o) => o.meeting), n),
    truthYield: honestRate(count((o) => o.truth), n),
    problemAckPerSend: honestRate(count((o) => o.problemAck), n),
    rootCausePerSend: honestRate(count((o) => o.rootCause), n),
  };
}

function breakdown(people: readonly ContactedPerson[], keyOf: (first: SendRecord) => string): ExecutionBreakdownRow[] {
  const groups = new Map<string, ContactedPerson[]>();
  for (const p of people) {
    const k = keyOf(p.first);
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  return [...groups.entries()].map(([key, ps]) => ({ key, metrics: metricsOf(ps) })).sort((a, b) => b.metrics.peopleContacted - a.metrics.peopleContacted || a.key.localeCompare(b.key));
}

/** Pure: people (with outcomes) -> the metrics and first-send attribution. */
export function computeExecutionLearning(people: readonly ContactedPerson[]): ExecutionLearning {
  return {
    overall: metricsOf(people),
    bySequenceVersion: breakdown(people, (f) => f.sequenceVersionId),
    byCopyVersion: breakdown(people, (f) => f.copyVersion),
    bySender: breakdown(people, (f) => f.sender),
    byEngine: breakdown(people, (f) => f.engine),
    byEvidenceTier: breakdown(people, (f) => f.evidenceTier),
  };
}

export interface ExecutionFilters {
  from?: Date | null;
  to?: Date | null;
  /** Campaign filter: only people whose FIRST send used one of these sequence versions. */
  sequenceVersionIds?: ReadonlySet<string> | null;
}

/** The execution learning report: sends from the ledger, outcomes by person. */
export async function buildExecutionLearning(prisma: PrismaLike, filters: ExecutionFilters = {}): Promise<ExecutionLearning> {
  const all = await loadSendRecords(prisma);
  const grouped = peopleFromSends(all);
  // A date window selects PEOPLE by their first send (a cohort), never sends,
  // so a later touch cannot move someone into or out of the window.
  for (const [r, p] of grouped) {
    const t = p.first.sentAt.getTime();
    if ((filters.from && t < filters.from.getTime()) || (filters.to && t > filters.to.getTime())) grouped.delete(r);
    else if (filters.sequenceVersionIds && !filters.sequenceVersionIds.has(p.first.sequenceVersionId)) grouped.delete(r);
  }
  const outcomes = await loadOutcomes(prisma, grouped);
  const people: ContactedPerson[] = [...grouped.entries()].map(([recipient, p]) => ({
    recipient,
    first: p.first,
    sends: p.sends.length,
    hypothesisIds: [...new Set(p.sends.map((s) => s.hypothesisId).filter((h): h is string => !!h))],
    outcome: outcomes.get(recipient)!,
  }));
  return computeExecutionLearning(people);
}
