/**
 * EXECUTION LEARNING (red team T10, 2026-09-27).
 *
 * The primary Learning metrics, measured against what was actually SENT:
 *
 *   denominator   people actually sent to: the GAP send ledger's MANUAL_SENT,
 *                 DIRECT_SENT and DRAFT_SENT rows plus the modex queue's sent
 *                 items for a live, non-test GAP enrollment; one person per
 *                 recipient address; one send per Gmail message; internal
 *                 recipients excluded.
 *
 * Every outcome must be tied to GAP's own send (Release D review B1, S1-S3),
 * belong to THIS person, and happen within OUTCOME_WINDOW_DAYS after their
 * first send (review S4). Rates are over people whose window has CLOSED, so
 * an old cohort never out-scores a new one just by having had more time:
 *
 *   reply / send       a human reply IN a GAP thread of the person, or a GAP
 *                      mailbox verdict that attributed a reply to them by
 *                      thread or exact address (never by account domain), or
 *                      their own confirmed substantive email disposition on a
 *                      hypothesis they were sent
 *   meeting / send     their own confirmed meeting_accepted on a sent hypothesis
 *   problem ack / send their own confirmed problem_confirmed / partially on a sent hypothesis
 *   truth yield        their own confirmed disposition that resolved a sent
 *                      hypothesis (confirmed, partially confirmed or rejected by
 *                      the BUYER; a withdrawal is never truth)
 *   root cause / send  their own confirmed root-cause BID on a sent hypothesis
 *   opt-out / send     unsubscribed or asked not to be contacted (a ceiling
 *                      for automation gates, never a success)
 *
 * Attribution is the person's FIRST send record: sequence version, copy
 * version (content hash of what went out), sender, execution engine and the
 * evidence tier stamped at send time. A person reached through several
 * routing cards is one person; nothing here reads a routing decision, so no
 * rate moves because cards expired, were superseded or were never clicked.
 *
 * Every rate is an HonestRate (stats.ts): suppressed below RELIABLE_N, with a
 * Wilson interval above it.
 */
import { createHash } from 'node:crypto';
import { DIRECT_SENT, DRAFT_SENT, DRAFT_SUBJECT_TYPE, DRAFTED, MANUAL_SENT } from '../execution/draft-ledger';
import { isInternalRecipient } from '../sequence/internal-recipient';
import { selectConfirmedBids } from '../bid/select';
import { AUTO_REPLY_SUBJECT } from '../replies/domains';
import { honestRate, type HonestRate } from './stats';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** What an old ledger row that predates the stamp reads as. */
export const UNRECORDED = 'unrecorded';
/** An outcome counts only within this many days of the person's first send; rates use closed windows only. */
export const OUTCOME_WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;
/** Recipient lists are read in chunks (bind-parameter limits, plan size). */
const CHUNK = 500;

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
  /** The Gmail thread the send went out in, when recorded. */
  threadId: string | null;
  /** The Gmail message id, when recorded: one send is one message, however often it was filed. */
  gmailSentMessageId: string | null;
}

const lower = (s: unknown) => String(s ?? '').trim().toLowerCase();
const str = (v: unknown, fallback = UNRECORDED) => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
const optStr = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

function chunks<T>(xs: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += CHUNK) out.push(xs.slice(i, i + CHUNK));
  return out;
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/** Every GAP send (the same rows person-level send history reads, plus GAP queue sends). */
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
  const seenMessages = new Set<string>();
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
    // Review S5: the same Gmail message filed under two cards is ONE send.
    const messageId = optStr(p.gmailSentMessageId);
    if (messageId) {
      if (seenMessages.has(messageId)) continue;
      seenMessages.add(messageId);
    }
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
      threadId: optStr(p.gmailThreadId) ?? optStr(base.gmailThreadId),
      gmailSentMessageId: messageId,
    });
  }
  // Sends the modex queue made for a GAP enrollment (a live, non-test
  // SequenceEnrollment): real GAP sends that never pass through the ledger.
  if (prisma.draftQueueItem?.findMany && prisma.sequenceEnrollment?.findMany) {
    const items: Array<{ to_email: string; persona_id: number | null; owner: string; sequence_run_id: string; sequence_version_id: string; step_index: number | null; sent_at: Date | null; subject: string; body: string; thread_id: string | null }> =
      await prisma.draftQueueItem.findMany({
        where: { status: 'sent', sequence_run_id: { not: null }, sequence_version_id: { not: null } },
        select: { to_email: true, persona_id: true, owner: true, sequence_run_id: true, sequence_version_id: true, step_index: true, sent_at: true, subject: true, body: true, thread_id: true },
      });
    const runIds = [...new Set(items.map((i) => i.sequence_run_id))];
    const runs: Array<{ id: string; hypothesis_id: string | null; is_test: boolean; sender: string }> = [];
    for (const part of chunks(runIds)) runs.push(...(await prisma.sequenceEnrollment.findMany({ where: { id: { in: part } }, select: { id: true, hypothesis_id: true, is_test: true, sender: true } })));
    const runById = new Map(runs.map((r) => [r.id, r]));
    for (const i of items) {
      const run = runById.get(i.sequence_run_id);
      const recipient = lower(i.to_email);
      if (!run || run.is_test || !i.sent_at || !recipient.includes('@') || isInternalRecipient(recipient)) continue;
      out.push({
        decisionId: `enrollment:${run.id}`,
        personaId: i.persona_id,
        recipient,
        hypothesisId: run.hypothesis_id,
        stepIndex: i.step_index ?? 0,
        sentAt: new Date(i.sent_at),
        engine: 'modex_queue',
        sender: str(run.sender || i.owner),
        sequenceVersionId: i.sequence_version_id,
        copyVersion: createHash('sha256').update(`${i.subject}\n${i.body}`).digest('hex').slice(0, 12),
        evidenceTier: UNRECORDED,
        threadId: optStr(i.thread_id),
        gmailSentMessageId: null,
      });
    }
  }
  return out;
}

/**
 * Live, non-test GAP enrollments per persona (when each started): execution
 * evidence for "enrolled". A HubSpot-attributed enrollment whose start date
 * is a sync-time placeholder (external_state.enrolled_at_unknown) is not
 * evidence of when anything happened (review S7).
 */
export async function loadEnrollmentStarts(prisma: PrismaLike): Promise<Map<number, number[]>> {
  const out = new Map<number, number[]>();
  if (!prisma.sequenceEnrollment?.findMany) return out;
  const rows: Array<{ persona_id: number | null; enrolled_at: Date; external_state?: unknown }> = await prisma.sequenceEnrollment.findMany({
    where: { is_test: false, persona_id: { not: null } },
    select: { persona_id: true, enrolled_at: true, external_state: true },
  });
  for (const r of rows) {
    const ext = (r.external_state ?? null) as { enrolled_at_unknown?: unknown } | null;
    if (r.persona_id === null || (ext && ext.enrolled_at_unknown === true)) continue;
    push(out, r.persona_id, new Date(r.enrolled_at).getTime());
  }
  return out;
}

export interface PersonOutcome {
  replied: boolean;
  meeting: boolean;
  problemAck: boolean;
  rootCause: boolean;
  truth: boolean;
  optOut: boolean;
}

export interface ContactedPerson {
  recipient: string;
  /** The person's first send: the attribution record. */
  first: SendRecord;
  sends: number;
  hypothesisIds: string[];
  /** The outcome window has closed: the person is in the rate denominators. */
  matured: boolean;
  outcome: PersonOutcome;
}

interface PersonSends {
  first: SendRecord;
  sends: SendRecord[];
}

/** Group sends into people (first send = earliest sentAt; ties by step). Pure. */
export function peopleFromSends(sends: readonly SendRecord[]): Map<string, PersonSends> {
  const people = new Map<string, PersonSends>();
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
/** A buyer verdict on the hypothesis itself. */
const RESOLVING = new Set(['problem_confirmed', 'problem_partially_confirmed', 'problem_rejected']);
const RESOLVED_STATUSES = new Set(['confirmed', 'partially_confirmed', 'rejected']);
/** Not a reply: a machine or nobody answered (metrics.ts NON_SUBSTANTIVE). */
const NOT_A_REPLY = new Set(['no_answer', 'voicemail', 'gatekeeper', 'out_of_office', 'bounce', 'no_signal']);
/** The mailbox verdicts that tie a reply to a GAP send (never account_domain). */
const TIED_ATTRIBUTIONS = new Set(['gap_thread', 'gap_recipient']);

/** Outcomes per person: tied to GAP's send, the person's own, inside [first send, first send + window]. */
export async function loadOutcomes(prisma: PrismaLike, people: Map<string, PersonSends>, now: Date = new Date()): Promise<Map<string, PersonOutcome>> {
  const recipients = [...people.keys()];
  const out = new Map<string, PersonOutcome>(recipients.map((r) => [r, { replied: false, meeting: false, problemAck: false, rootCause: false, truth: false, optOut: false }]));
  if (recipients.length === 0) return out;
  const firstAt = (r: string) => people.get(r)!.first.sentAt.getTime();
  const inWindow = (r: string, t: number) => t > firstAt(r) && t <= Math.min(firstAt(r) + OUTCOME_WINDOW_DAYS * DAY_MS, now.getTime());
  const threadsOf = new Map<string, Set<string>>();
  const hypsOf = new Map<string, Set<string>>();
  for (const [r, p] of people) {
    threadsOf.set(r, new Set(p.sends.map((s) => s.threadId).filter((t): t is string => !!t)));
    hypsOf.set(r, new Set(p.sends.map((s) => s.hypothesisId).filter((h): h is string => !!h)));
  }

  // 1. Replies IN a GAP thread of this person (review S1: a reply to anything else is not a GAP reply).
  for (const part of chunks(recipients)) {
    const inbound: Array<{ from_email: string; received_at: Date; subject: string | null; thread_id: string | null }> = await prisma.inboundMessage.findMany({
      where: { from_email: { in: part, mode: 'insensitive' } },
      select: { from_email: true, received_at: true, subject: true, thread_id: true },
    });
    for (const m of inbound) {
      const r = lower(m.from_email);
      if (!out.has(r) || !m.thread_id || !threadsOf.get(r)!.has(m.thread_id)) continue;
      if (inWindow(r, new Date(m.received_at).getTime()) && !AUTO_REPLY_SUBJECT.test(m.subject ?? '')) out.get(r)!.replied = true;
    }
  }
  // 2. The GAP mailbox tied a reply to this person by thread or exact address (review B1: never by account domain).
  const attributed: Array<{ payload: unknown }> = await prisma.gapAuditEvent.findMany({
    where: { kind: 'mailbox.reply', created_at: { gte: new Date(Math.min(...recipients.map(firstAt))) } },
    select: { payload: true },
  });
  for (const a of attributed) {
    const p = (a.payload ?? {}) as { recipients?: unknown; receivedAt?: unknown; attribution?: unknown };
    if (!TIED_ATTRIBUTIONS.has(String(p.attribution))) continue;
    const at = typeof p.receivedAt === 'string' ? new Date(p.receivedAt).getTime() : NaN;
    for (const r of Array.isArray(p.recipients) ? p.recipients : []) {
      const key = lower(r);
      if (out.has(key) && inWindow(key, at)) out.get(key)!.replied = true;
    }
  }

  // 3. This person's own confirmed dispositions, on a hypothesis they were sent (review S1-S3).
  const hypothesisIds = [...new Set([...hypsOf.values()].flatMap((s) => [...s]))];
  const resolvedBy = new Map<string, string[]>();
  for (const part of chunks(recipients)) {
    const dispositions: Array<{ contact_email: string; hypothesis_id: string; response_class: string; channel: string; created_at: Date }> = await prisma.conversationDisposition.findMany({
      where: { human_confirmed: true, contact_email: { in: part } },
      select: { contact_email: true, hypothesis_id: true, response_class: true, channel: true, created_at: true },
    });
    for (const d of dispositions) {
      const r = lower(d.contact_email);
      if (!out.has(r) || !inWindow(r, new Date(d.created_at).getTime())) continue;
      const o = out.get(r)!;
      if (d.response_class === 'do_not_contact') o.optOut = true;
      if (!hypsOf.get(r)!.has(d.hypothesis_id)) continue;
      if (d.channel === 'email' && !NOT_A_REPLY.has(d.response_class)) o.replied = true;
      if (d.response_class === 'meeting_accepted') o.meeting = true;
      if (PROBLEM_ACK.has(d.response_class)) o.problemAck = true;
      if (RESOLVING.has(d.response_class)) push(resolvedBy, r, d.hypothesis_id);
    }
    if (prisma.unsubscribedEmail?.findMany) {
      const unsubs: Array<{ email: string; unsubscribed_at: Date }> = await prisma.unsubscribedEmail.findMany({ where: { email: { in: part } }, select: { email: true, unsubscribed_at: true } });
      for (const u of unsubs) {
        const r = lower(u.email);
        if (out.has(r) && inWindow(r, new Date(u.unsubscribed_at).getTime())) out.get(r)!.optOut = true;
      }
    }
  }

  if (hypothesisIds.length) {
    const statuses = new Map<string, string>();
    for (const part of chunks(hypothesisIds)) {
      const hyps: Array<{ id: string; status: string }> = await prisma.prospectingHypothesis.findMany({ where: { id: { in: part } }, select: { id: true, status: true } });
      for (const h of hyps) statuses.set(h.id, h.status);
    }
    // Truth: this person's own verdict resolved the hypothesis (a withdrawal or another person's verdict never counts).
    for (const [r, hs] of resolvedBy) if (hs.some((h) => RESOLVED_STATUSES.has(statuses.get(h) ?? ''))) out.get(r)!.truth = true;

    const bids: Array<{ id: string; hypothesis_id: string; contact_email: string | null; type: string; human_confirmed: boolean; supersedes_id: string | null; created_at: Date }> = [];
    for (const part of chunks(hypothesisIds)) {
      bids.push(
        ...(await prisma.buyerInputData.findMany({
          where: { hypothesis_id: { in: part } },
          select: { id: true, hypothesis_id: true, contact_email: true, type: true, human_confirmed: true, supersedes_id: true, created_at: true },
        })),
      );
    }
    const confirmed = new Set(selectConfirmedBids(bids.map((b) => ({ id: b.id, humanConfirmed: b.human_confirmed === true, supersedesId: b.supersedes_id ?? null }))).map((b) => b.id));
    for (const b of bids) {
      const r = lower(b.contact_email);
      if (b.type !== 'root_cause' || !confirmed.has(b.id) || !out.has(r) || !hypsOf.get(r)!.has(b.hypothesis_id)) continue;
      if (inWindow(r, new Date(b.created_at).getTime())) out.get(r)!.rootCause = true;
    }
  }
  return out;
}

export interface ExecutionMetrics {
  /** People actually sent to (all of them). */
  peopleContacted: number;
  /** People whose outcome window has closed: THE rate denominator. */
  peopleMatured: number;
  /** Individual sends (all steps), for context only; never a rate denominator. */
  sends: number;
  replyPerSend: HonestRate;
  meetingPerSend: HonestRate;
  truthYield: HonestRate;
  problemAckPerSend: HonestRate;
  rootCausePerSend: HonestRate;
  /** Unsubscribed or asked not to be contacted. A ceiling for automation, never a success. */
  optOutPerSend: HonestRate;
  /** A positive buyer outcome (meeting or problem acknowledged): the G1 outcome floor, not a display tile. */
  positivePerSend: HonestRate;
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
  windowDays: number;
}

function metricsOf(people: readonly ContactedPerson[]): ExecutionMetrics {
  const matured = people.filter((p) => p.matured);
  const n = matured.length;
  const count = (f: (o: PersonOutcome) => boolean) => matured.filter((p) => f(p.outcome)).length;
  return {
    peopleContacted: people.length,
    peopleMatured: n,
    sends: people.reduce((a, p) => a + p.sends, 0),
    replyPerSend: honestRate(count((o) => o.replied), n),
    meetingPerSend: honestRate(count((o) => o.meeting), n),
    truthYield: honestRate(count((o) => o.truth), n),
    problemAckPerSend: honestRate(count((o) => o.problemAck), n),
    rootCausePerSend: honestRate(count((o) => o.rootCause), n),
    optOutPerSend: honestRate(count((o) => o.optOut), n),
    positivePerSend: honestRate(count((o) => o.meeting || o.problemAck), n),
  };
}

function breakdown(people: readonly ContactedPerson[], keyOf: (first: SendRecord) => string): ExecutionBreakdownRow[] {
  const groups = new Map<string, ContactedPerson[]>();
  for (const p of people) push(groups, keyOf(p.first), p);
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
    windowDays: OUTCOME_WINDOW_DAYS,
  };
}

export interface ExecutionFilters {
  from?: Date | null;
  to?: Date | null;
  /** Campaign filter: only people whose FIRST send used one of these sequence versions. */
  sequenceVersionIds?: ReadonlySet<string> | null;
  now?: Date;
}

/** The execution learning report: sends from the ledger and the GAP queue, outcomes by person. */
export async function buildExecutionLearning(prisma: PrismaLike, filters: ExecutionFilters = {}): Promise<ExecutionLearning> {
  const now = filters.now ?? new Date();
  const all = await loadSendRecords(prisma);
  const grouped = peopleFromSends(all);
  // A date window selects PEOPLE by their first send (a cohort), never sends,
  // so a later touch cannot move someone into or out of the window.
  for (const [r, p] of grouped) {
    const t = p.first.sentAt.getTime();
    if ((filters.from && t < filters.from.getTime()) || (filters.to && t > filters.to.getTime())) grouped.delete(r);
    else if (filters.sequenceVersionIds && !filters.sequenceVersionIds.has(p.first.sequenceVersionId)) grouped.delete(r);
  }
  const outcomes = await loadOutcomes(prisma, grouped, now);
  const people: ContactedPerson[] = [...grouped.entries()].map(([recipient, p]) => ({
    recipient,
    first: p.first,
    sends: p.sends.length,
    hypothesisIds: [...new Set(p.sends.map((s) => s.hypothesisId).filter((h): h is string => !!h))],
    matured: p.first.sentAt.getTime() + OUTCOME_WINDOW_DAYS * DAY_MS <= now.getTime(),
    outcome: outcomes.get(recipient)!,
  }));
  return computeExecutionLearning(people);
}
