/**
 * COMMITMENTS, the store (GAP OS execution recovery, R40, 2026-10-06). Server only. The model, the statuses and the
 * phase read are in ./commitment-model.ts.
 *
 * Storage decision: the existing append-only ledger (`gapAuditEvent`), kind `account.commitment`, subject the
 * account (`subject_type 'account'`, `subject_id <account name>`), each row a FULL snapshot of one commitment keyed
 * by `payload.commitmentId`; the newest row per id is its state. Reads are one indexed query by kind (Work: every
 * open obligation) or by subject (one account). At the seller's volume (tens a week) that stays small; if it passes
 * about ten thousand rows, an additive indexed projection on (status, due_at) is the rebuildable next step (debt in
 * the ledger). Owner: this module. Rebuild: the rows themselves (nothing derived is stored).
 *
 * Invariants (pinned by tests/unit/gap/commitments.test.ts):
 *   - the commitment id is derived from its SOURCE (`<kind>:<id>`: the disposition, the send's person + step key,
 *     the snooze row, the capture candidate, the reply), and a create is ONE-SHOT under an advisory lock: a
 *     duplicate event, a retry, a refresh or another instance finds the existing record and writes nothing
 *   - done and skipped are terminal: no transition, no source re-firing and no reload ever reopens them
 *   - done needs proof (a ledger row, a disposition, a capture, a mailbox message, an outcome, or the seller's own
 *     recorded note); waiting and blocked need the dependency in words; a snooze needs a future date within 90 days
 *   - every obligation on one account is its own record (two due commitments at one account stay two)
 *
 * Sources that CREATE commitments: a disposition (request_information -> answer the request; meeting_accepted ->
 * prepare the meeting; timing with a date -> a reminder snoozed until then; referral -> decide how to approach the
 * named person, no cold action), a proven send (-> a waiting follow-up, due when the next touch is), a snooze (-> a
 * reminder that returns on its date), a confirmed capture commitment (R44) and an out-of-office return date (R42).
 * Nothing here sends, drafts, enrolls, writes HubSpot or changes a thesis, a person or a suppression.
 */
import { addBusinessDays } from '../sequence/business-days';
import { parseSteps } from '../sequence/steps';
import { SEED_DELAYS_BUSINESS_DAYS } from '../sequences/families';
import { DIRECT_SENT, DRAFT_SENT, DRAFT_SUBJECT_TYPE, DRAFTED, MANUAL_SENT } from '../execution/draft-ledger';
import { personStepKey } from '../execution/person-history';
import { addDays, dayLabel, nyDay, nyDayAt, parseReturnDate } from './dates';
import { classifyReply } from '../replies/classify';
import {
  COMMITMENT_EVENT,
  COMMITMENT_KINDS,
  COMMITMENT_STATUSES,
  PROOF_KINDS,
  TERMINAL_STATUSES,
  commitmentPhase,
  type BuyerMoveSince,
  type Commitment,
  type CommitmentKind,
  type CommitmentPerson,
  type CommitmentProof,
  type CommitmentSourceKind,
  type CommitmentStatus,
  type ProofKind,
} from './commitment-model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const TITLE_MAX = 200;
export const BASIS_MAX = 600;
export const NOTE_MAX = 240;
export const SNOOZE_MAX_DAYS = 90;
/** Sends older than this make no follow-up (the same window the account motion reads first touches in). */
export const FOLLOW_UP_LOOKBACK_DAYS = 30;
const DAY_MS = 86_400_000;

export const commitmentIdFor = (source: { kind: CommitmentSourceKind; id: string }): string => `${source.kind}:${source.id}`;

export interface NewCommitment {
  accountName: string;
  kind: CommitmentKind;
  title: string;
  basis?: string | null;
  owner?: string | null;
  dueAt?: string | Date | null;
  person?: CommitmentPerson | null;
  dealId?: string | null;
  /** R50: a division or site the obligation belongs to. */
  scope?: { division?: string | null; site?: string | null } | null;
  threadId?: string | null;
  status?: Exclude<CommitmentStatus, 'done' | 'skipped'>;
  snoozeUntil?: string | Date | null;
  dependency?: string | null;
  source: { kind: CommitmentSourceKind; id: string };
  detail?: Commitment['detail'];
}

export type CommitmentRefusal =
  | 'account_not_found'
  | 'bad_kind'
  | 'bad_status'
  | 'title_required'
  | 'title_too_long'
  | 'bad_due'
  | 'source_required'
  | 'not_found'
  | 'terminal'
  | 'proof_required'
  | 'bad_proof'
  | 'until_required'
  | 'until_in_past'
  | 'until_too_far'
  | 'dependency_required'
  | 'note_too_long';

export type EnsureResult = { ok: true; created: boolean; commitment: Commitment } | { ok: false; reason: CommitmentRefusal };
export type TransitionResult = { ok: true; commitment: Commitment } | { ok: false; reason: CommitmentRefusal; status?: CommitmentStatus };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const iso = (v: string | Date | null | undefined): string | null => {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const clip = (s: string | null | undefined, max: number): string | null => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, max) : null;
};

type Row = { id?: string; payload: unknown; created_at: Date };

/** Fold ledger rows (any order) into the newest snapshot per commitment id. */
export function foldCommitments(rows: readonly Row[]): Map<string, Commitment> {
  const sorted = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || String(a.id ?? '').localeCompare(String(b.id ?? '')));
  const out = new Map<string, Commitment>();
  for (const r of sorted) {
    if (!isObj(r.payload) || typeof r.payload.commitmentId !== 'string' || !isObj(r.payload.commitment)) continue;
    const c = r.payload.commitment as unknown as Commitment;
    if (typeof c.accountName !== 'string' || !(COMMITMENT_STATUSES as readonly string[]).includes(c.status)) continue;
    const prior = out.get(r.payload.commitmentId);
    // A terminal record never reopens, whatever a later row says (defense in depth: the writer refuses it too).
    if (prior && TERMINAL_STATUSES.includes(prior.status)) continue;
    out.set(r.payload.commitmentId, c);
  }
  return out;
}

/** Every commitment (or those at the given accounts), newest snapshot each. An unreadable ledger reads as none. */
export async function loadCommitments(prisma: PrismaLike, opts: { accountNames?: readonly string[] } = {}): Promise<Commitment[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  if (opts.accountNames && opts.accountNames.length === 0) return [];
  const rows: Row[] = await prisma.gapAuditEvent.findMany({
    where: { kind: COMMITMENT_EVENT, ...(opts.accountNames ? { subject_type: 'account', subject_id: { in: [...opts.accountNames] } } : {}) },
    select: { id: true, payload: true, created_at: true },
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
  });
  return [...foldCommitments(rows).values()];
}

async function rowsOf(prisma: PrismaLike, commitmentId: string): Promise<Row[]> {
  return prisma.gapAuditEvent.findMany({
    where: { kind: COMMITMENT_EVENT, payload: { path: ['commitmentId'], equals: commitmentId } },
    select: { id: true, payload: true, created_at: true },
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
  });
}

/** Serialize every write to one commitment (a double click, two tabs, two instances, a source re-firing). */
async function locked<T>(prisma: PrismaLike, commitmentId: string, fn: (tx: PrismaLike) => Promise<T>): Promise<T> {
  if (typeof prisma.$transaction !== 'function' || typeof prisma.$executeRaw !== 'function') return fn(prisma);
  return prisma.$transaction(async (tx: PrismaLike) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gap_commitment:${commitmentId}`}))`;
    return fn(tx);
  });
}

async function write(tx: PrismaLike, actor: string, c: Commitment, op: 'create' | 'status'): Promise<void> {
  await tx.gapAuditEvent.create({ data: { kind: COMMITMENT_EVENT, actor, subject_type: 'account', subject_id: c.accountName, payload: JSON.parse(JSON.stringify({ commitmentId: c.commitmentId, op, commitment: c })) } });
}

/**
 * Create a commitment ONCE for its source. A second call for the same source (a duplicate event, a retry, another
 * instance) returns the existing record, whatever its status, and writes nothing: a done item is never resurrected.
 */
export async function ensureCommitment(prisma: PrismaLike, input: NewCommitment, ctx: { actor: string; now: Date }): Promise<EnsureResult> {
  if (!(COMMITMENT_KINDS as readonly string[]).includes(input.kind)) return { ok: false, reason: 'bad_kind' };
  const status = input.status ?? 'open';
  if (!['open', 'waiting', 'blocked', 'snoozed'].includes(status)) return { ok: false, reason: 'bad_status' };
  const title = clip(input.title, 10_000);
  if (!title) return { ok: false, reason: 'title_required' };
  if (title.length > TITLE_MAX) return { ok: false, reason: 'title_too_long' };
  if (!input.source?.kind || !input.source.id?.trim()) return { ok: false, reason: 'source_required' };
  const dueAt = iso(input.dueAt);
  if (input.dueAt && !dueAt) return { ok: false, reason: 'bad_due' };
  const snoozeUntil = status === 'snoozed' ? iso(input.snoozeUntil ?? input.dueAt) : null;
  if (status === 'snoozed' && !snoozeUntil) return { ok: false, reason: 'until_required' };
  const dependency = clip(input.dependency, NOTE_MAX);
  if ((status === 'waiting' || status === 'blocked') && !dependency) return { ok: false, reason: 'dependency_required' };
  const commitmentId = commitmentIdFor(input.source);
  return locked(prisma, commitmentId, async (tx) => {
    const existing = foldCommitments(await rowsOf(tx, commitmentId)).get(commitmentId);
    if (existing) return { ok: true as const, created: false, commitment: existing };
    const account = await tx.account.findUnique({ where: { name: input.accountName }, select: { name: true } });
    if (!account) return { ok: false as const, reason: 'account_not_found' as const };
    const at = ctx.now.toISOString();
    const c: Commitment = {
      commitmentId,
      accountName: account.name,
      kind: input.kind,
      title,
      basis: clip(input.basis, BASIS_MAX),
      owner: clip(input.owner, 200) ?? ctx.actor,
      dueAt,
      person: input.person ? { personaId: input.person.personaId ?? null, name: clip(input.person.name, 120), email: input.person.email ? input.person.email.trim().toLowerCase() : null } : null,
      dealId: clip(input.dealId, 64),
      ...(input.scope && (clip(input.scope.division, 120) || clip(input.scope.site, 120)) ? { scope: { division: clip(input.scope.division, 120), site: clip(input.scope.site, 120) } } : {}),
      threadId: clip(input.threadId, 200),
      status,
      snoozeUntil,
      dependency,
      proof: null,
      reason: null,
      source: { kind: input.source.kind, id: input.source.id.trim() },
      detail: input.detail ?? null,
      createdAt: at,
      createdBy: ctx.actor,
      updatedAt: at,
      updatedBy: ctx.actor,
    };
    await write(tx, ctx.actor, c, 'create');
    return { ok: true as const, created: true, commitment: c };
  });
}

export interface TransitionInput {
  commitmentId: string;
  to: CommitmentStatus;
  /** snoozed: when it returns. */
  until?: string | Date | null;
  /** waiting / blocked: on what. */
  dependency?: string | null;
  /** done: what proves it. A seller's own Done is `{ kind: 'seller', note }` (the row itself is the record). */
  proof?: { kind: ProofKind; id?: string | null; note?: string | null } | null;
  /** skipped: why. */
  reason?: string | null;
  /** A corrected due time (the seller fixes an ambiguous date). */
  dueAt?: string | Date | null;
  actor: string;
  now: Date;
}

/** Move a commitment to a new status. Terminal records refuse every transition. */
export async function transitionCommitment(prisma: PrismaLike, input: TransitionInput): Promise<TransitionResult> {
  if (!(COMMITMENT_STATUSES as readonly string[]).includes(input.to)) return { ok: false, reason: 'bad_status' };
  let proof: CommitmentProof | null = null;
  if (input.to === 'done') {
    if (!input.proof) return { ok: false, reason: 'proof_required' };
    if (!(PROOF_KINDS as readonly string[]).includes(input.proof.kind)) return { ok: false, reason: 'bad_proof' };
    if (input.proof.kind !== 'seller' && !input.proof.id) return { ok: false, reason: 'proof_required' };
    const note = clip(input.proof.note, 10_000);
    // Batch item 8: the seller's own Done is proved by its words (what happened, or a milestone's own proof); a bare
    // click proves nothing.
    if (input.proof.kind === 'seller' && !note) return { ok: false, reason: 'proof_required' };
    if (note && note.length > NOTE_MAX) return { ok: false, reason: 'note_too_long' };
    proof = { kind: input.proof.kind, id: input.proof.id ?? null, note, at: input.now.toISOString(), by: input.actor };
  }
  let until: string | null = null;
  if (input.to === 'snoozed') {
    until = iso(input.until);
    if (!until) return { ok: false, reason: 'until_required' };
    if (new Date(until).getTime() <= input.now.getTime()) return { ok: false, reason: 'until_in_past' };
    if (new Date(until).getTime() > input.now.getTime() + SNOOZE_MAX_DAYS * DAY_MS) return { ok: false, reason: 'until_too_far' };
  }
  const dependency = clip(input.dependency, 10_000);
  if ((input.to === 'waiting' || input.to === 'blocked') && !dependency) return { ok: false, reason: 'dependency_required' };
  if (dependency && dependency.length > NOTE_MAX) return { ok: false, reason: 'note_too_long' };
  const reason = clip(input.reason, 10_000);
  if (reason && reason.length > NOTE_MAX) return { ok: false, reason: 'note_too_long' };
  const dueAt = input.dueAt === undefined ? undefined : iso(input.dueAt);
  if (input.dueAt && !dueAt) return { ok: false, reason: 'bad_due' };
  return locked(prisma, input.commitmentId, async (tx) => {
    const c = foldCommitments(await rowsOf(tx, input.commitmentId)).get(input.commitmentId);
    if (!c) return { ok: false as const, reason: 'not_found' as const };
    if (TERMINAL_STATUSES.includes(c.status)) return { ok: false as const, reason: 'terminal' as const, status: c.status };
    const at = input.now.toISOString();
    const next: Commitment = {
      ...c,
      status: input.to,
      snoozeUntil: input.to === 'snoozed' ? until : c.snoozeUntil,
      dependency: input.to === 'waiting' || input.to === 'blocked' ? dependency : c.dependency,
      proof: input.to === 'done' ? proof : c.proof,
      reason: input.to === 'skipped' ? reason : c.reason,
      dueAt: dueAt === undefined ? c.dueAt : dueAt,
      updatedAt: at,
      updatedBy: input.actor,
    };
    await write(tx, input.actor, next, 'status');
    return { ok: true as const, commitment: next };
  });
}

/**
 * R52: amend what a commitment carries (its title, due time or detail) without changing its status: a new snapshot row
 * under the same lock. Terminal records refuse it, as every transition does.
 */
export async function amendCommitment(
  prisma: PrismaLike,
  input: { commitmentId: string; title?: string | null; dueAt?: string | Date | null; detail?: Partial<NonNullable<Commitment['detail']>>; actor: string; now: Date },
): Promise<TransitionResult> {
  const title = input.title === undefined || input.title === null ? undefined : clip(input.title, 10_000);
  if (title !== undefined && !title) return { ok: false, reason: 'title_required' };
  if (title && title.length > TITLE_MAX) return { ok: false, reason: 'title_too_long' };
  const dueAt = input.dueAt === undefined ? undefined : iso(input.dueAt);
  if (input.dueAt && !dueAt) return { ok: false, reason: 'bad_due' };
  return locked(prisma, input.commitmentId, async (tx) => {
    const c = foldCommitments(await rowsOf(tx, input.commitmentId)).get(input.commitmentId);
    if (!c) return { ok: false as const, reason: 'not_found' as const };
    if (TERMINAL_STATUSES.includes(c.status)) return { ok: false as const, reason: 'terminal' as const, status: c.status };
    const next: Commitment = { ...c, ...(title ? { title } : {}), ...(dueAt !== undefined ? { dueAt } : {}), detail: input.detail ? { ...(c.detail ?? {}), ...input.detail } : c.detail, updatedAt: input.now.toISOString(), updatedBy: input.actor };
    await write(tx, input.actor, next, 'status');
    return { ok: true as const, commitment: next };
  });
}

/** One commitment by id (its newest snapshot), or null. */
export async function loadCommitment(prisma: PrismaLike, commitmentId: string): Promise<Commitment | null> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return null;
  return foldCommitments(await rowsOf(prisma, commitmentId)).get(commitmentId) ?? null;
}

// ---------------------------------------------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------------------------------------------

const ledgerReadable = (prisma: PrismaLike) => typeof prisma?.gapAuditEvent?.findMany === 'function' && typeof prisma?.gapAuditEvent?.create === 'function';
const first = (name: string | null | undefined) => (name ?? '').split(' ')[0] || null;

/**
 * A human-confirmed disposition's obligations (R40 / R42). request_information: answer it (due now);
 * meeting_accepted: prepare the meeting (due now; the time is added when known); timing with a date: a reminder
 * snoozed until that date; referral: decide how to approach the named person (no cold action until the seller
 * chooses; the referral implies no consent and no relationship with them). Any confirmed answer from a person also
 * closes that person's waiting follow-ups and return reminders at the account, with the disposition as the proof.
 * Fail-open: the disposition is already recorded; a failure here is swallowed by the caller.
 */
export async function commitmentsFromDisposition(
  prisma: PrismaLike,
  d: {
    dispositionId: string;
    accountName: string;
    responseClass: string;
    contactEmail: string;
    personaId: number | null;
    personName?: string | null;
    resumeAt?: string | Date | null;
    referral?: { name?: string; title?: string; email?: string } | null;
    nextBestAction?: string | null;
    buyerLanguage?: string | null;
    stopsRun: boolean;
    actor: string;
    now: Date;
  },
): Promise<void> {
  if (!ledgerReadable(prisma)) return;
  const personName = d.personName ?? (d.personaId !== null && typeof prisma.persona?.findUnique === 'function' ? ((await prisma.persona.findUnique({ where: { id: d.personaId }, select: { name: true } }).catch(() => null))?.name ?? null) : null);
  const who = personName ?? d.contactEmail;
  const person: CommitmentPerson = { personaId: d.personaId, name: personName, email: d.contactEmail };
  const source = { kind: 'disposition' as const, id: d.dispositionId };
  const ctx = { actor: d.actor, now: d.now };
  const basis = d.buyerLanguage ? `${who}: "${d.buyerLanguage}"` : null;
  if (d.responseClass === 'request_information') {
    await ensureCommitment(prisma, { accountName: d.accountName, kind: 'answer_request', title: `Answer ${first(who) ?? who}'s request${d.nextBestAction ? `: ${d.nextBestAction}` : ''}`.slice(0, TITLE_MAX), basis, dueAt: d.now, person, source }, ctx);
  } else if (d.responseClass === 'meeting_accepted') {
    await ensureCommitment(prisma, { accountName: d.accountName, kind: 'prepare_meeting', title: `Prepare the meeting with ${who}`.slice(0, TITLE_MAX), basis, dueAt: d.now, person, source }, ctx);
  } else if (d.responseClass === 'timing' && d.resumeAt && iso(d.resumeAt) && new Date(d.resumeAt).getTime() > d.now.getTime()) {
    await ensureCommitment(prisma, { accountName: d.accountName, kind: 'reminder', status: 'snoozed', snoozeUntil: d.resumeAt, dueAt: d.resumeAt, title: `Come back to ${who}: they said not now`.slice(0, TITLE_MAX), basis, person, source }, ctx);
  } else if (d.responseClass === 'referral') {
    const named = d.referral?.name?.trim() || d.referral?.email?.trim() || 'the person they named';
    await ensureCommitment(
      prisma,
      {
        accountName: d.accountName,
        kind: 'referral',
        title: `${first(who) ?? who} named ${named}${d.referral?.title ? ` (${d.referral.title})` : ''}: decide how to approach them`.slice(0, TITLE_MAX),
        basis,
        dueAt: d.now,
        // The referred person, never the referrer: no consent and no relationship is implied with them.
        person: { personaId: null, name: d.referral?.name?.trim() || null, email: d.referral?.email?.trim().toLowerCase() || null },
        dependency: null,
        source,
        detail: null,
      },
      ctx,
    );
  }
  if (!d.stopsRun) return;
  // Their answer closes the follow-ups and return reminders waiting on them at this account.
  const open = (await loadCommitments(prisma, { accountNames: [d.accountName] })).filter(
    (c) => !TERMINAL_STATUSES.includes(c.status) && (c.kind === 'follow_up' || (c.kind === 'reminder' && c.source.kind === 'reply')) && c.person?.email === d.contactEmail.toLowerCase(),
  );
  for (const c of open) await transitionCommitment(prisma, { commitmentId: c.commitmentId, to: 'done', proof: { kind: 'disposition', id: d.dispositionId, note: `${who} answered (${d.responseClass.replace(/_/g, ' ')}).` }, actor: d.actor, now: d.now });
}

/**
 * A snooze returns on its date (R40): the snooze outcome row becomes a reminder snoozed until then. A newer outcome at
 * the account settles an older reminder still away (skipped: replaced or cleared). Batch item 8: a reminder that has
 * come back is never completed by an account outcome (nothing proves it done): a skip ("not today") brings it back
 * tomorrow morning, a newer snooze replaces it, and a clear or a log leaves it due.
 */
export async function commitmentsFromOutcome(
  prisma: PrismaLike,
  o: { outcomeId: string; accountName: string; kind: 'skipped' | 'snoozed' | 'logged' | 'clear'; until: string | null; reason: string | null; actor: string; now: Date },
): Promise<void> {
  if (!ledgerReadable(prisma)) return;
  const older = (await loadCommitments(prisma, { accountNames: [o.accountName] })).filter((c) => c.source.kind === 'snooze' && c.source.id !== o.outcomeId && !TERMINAL_STATUSES.includes(c.status));
  for (const c of older) {
    const came = commitmentPhase(c, o.now).phase === 'due';
    if (!came) {
      await transitionCommitment(prisma, { commitmentId: c.commitmentId, to: 'skipped', reason: o.kind === 'clear' ? 'snooze cleared' : `replaced by a newer ${o.kind}`, actor: o.actor, now: o.now });
    } else if (o.kind === 'skipped') {
      await transitionCommitment(prisma, { commitmentId: c.commitmentId, to: 'snoozed', until: nyDayAt(addDays(nyDay(o.now), 1), 0), actor: o.actor, now: o.now });
    } else if (o.kind === 'snoozed') {
      await transitionCommitment(prisma, { commitmentId: c.commitmentId, to: 'skipped', reason: 'replaced by a newer snoozed', actor: o.actor, now: o.now });
    }
  }
  if (o.kind === 'snoozed' && o.until) {
    await ensureCommitment(prisma, { accountName: o.accountName, kind: 'reminder', status: 'snoozed', snoozeUntil: o.until, dueAt: o.until, title: `Back to ${o.accountName}${o.reason ? `: ${o.reason}` : ''}`.slice(0, TITLE_MAX), source: { kind: 'snooze', id: o.outcomeId } }, { actor: o.actor, now: o.now });
  }
}

interface SendFact {
  eventId: string;
  decisionId: string;
  accountName: string;
  personaId: number | null;
  recipient: string;
  stepIndex: number;
  sentAt: string;
  sequenceVersionId: string | null;
  actor: string;
}

/**
 * The waiting follow-up after every proven send (R40 / R43): for each person's newest send in the window (GAP direct
 * sends, reconciled manual sends, sent drafts), ONE follow-up commitment for the next touch, due when the version's
 * next step is (else the house interval, four business days, flagged as having no follow-up copy: the seller follows
 * up by hand in the thread or waits). A newer send closes the older follow-ups with the ledger row as proof.
 * Idempotent and bounded; run on the Work read. Returns what it changed.
 */
export async function syncFollowUpsFromLedger(prisma: PrismaLike, now: Date, opts: { lookbackDays?: number } = {}): Promise<{ created: number; closed: number }> {
  const out = { created: 0, closed: 0 };
  if (!ledgerReadable(prisma)) return out;
  const since = new Date(now.getTime() - (opts.lookbackDays ?? FOLLOW_UP_LOOKBACK_DAYS) * DAY_MS);
  const rows: Array<{ id: string; kind: string; actor: string; subject_id: string; payload: Record<string, unknown> | null; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, kind: { in: [DIRECT_SENT, MANUAL_SENT, DRAFT_SENT] }, created_at: { gte: since } },
    select: { id: true, kind: true, actor: true, subject_id: true, payload: true, created_at: true },
    orderBy: { created_at: 'asc' },
  });
  if (rows.length === 0) return out;
  // A sent draft's facts live on its DRAFTED row (same draft id).
  const sentDrafts = rows.filter((r) => r.kind === DRAFT_SENT && typeof r.payload?.gmailDraftId === 'string');
  const draftIds = new Set(sentDrafts.map((r) => String(r.payload!.gmailDraftId)));
  const drafted = new Map<string, Record<string, unknown>>();
  if (sentDrafts.length) {
    // The DRAFTED rows live under the same routing decision as their DRAFT_SENT fate (one indexed read by subject).
    const dr: Array<{ payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent
      .findMany({ where: { subject_type: DRAFT_SUBJECT_TYPE, subject_id: { in: [...new Set(sentDrafts.map((r) => r.subject_id))] }, kind: DRAFTED }, select: { payload: true } })
      .catch(() => []);
    for (const r of dr) if (r.payload && typeof r.payload.gmailDraftId === 'string' && draftIds.has(r.payload.gmailDraftId)) drafted.set(r.payload.gmailDraftId, r.payload);
  }
  const sends: SendFact[] = [];
  for (const r of rows) {
    const p = r.kind === DRAFT_SENT ? { ...(drafted.get(String(r.payload?.gmailDraftId)) ?? {}), ...(r.payload ?? {}) } : (r.payload ?? {});
    const accountName = typeof p.accountName === 'string' ? p.accountName : '';
    const recipient = typeof p.recipient === 'string' ? p.recipient.toLowerCase() : '';
    if (!accountName || !recipient.includes('@')) continue;
    sends.push({
      eventId: r.id,
      decisionId: r.subject_id,
      accountName,
      personaId: typeof p.personaId === 'number' ? p.personaId : null,
      recipient,
      stepIndex: typeof p.stepIndex === 'number' ? p.stepIndex : 0,
      sentAt: typeof p.sentAt === 'string' ? p.sentAt : r.created_at.toISOString(),
      sequenceVersionId: typeof p.sequenceVersionId === 'string' ? p.sequenceVersionId : null,
      actor: typeof p.confirmedBy === 'string' ? p.confirmedBy : r.actor,
    });
  }
  // The newest send per person (persona, else address).
  const newest = new Map<string, SendFact>();
  for (const s of sends) {
    const key = s.personaId !== null ? `p:${s.personaId}` : `e:${s.recipient}`;
    const have = newest.get(key);
    if (!have || s.stepIndex > have.stepIndex || (s.stepIndex === have.stepIndex && s.sentAt > have.sentAt)) newest.set(key, s);
  }
  const versionIds = [...new Set([...newest.values()].map((s) => s.sequenceVersionId).filter((x): x is string => !!x))];
  const versions: Array<{ id: string; steps: unknown }> = versionIds.length && typeof prisma.sequenceVersion?.findMany === 'function' ? await prisma.sequenceVersion.findMany({ where: { id: { in: versionIds } }, select: { id: true, steps: true } }).catch(() => []) : [];
  const stepsOf = new Map(versions.map((v) => { const parsed = parseSteps(v.steps); return [v.id, parsed.ok ? parsed.steps.steps : []] as const; }));
  const personaIds = [...new Set([...newest.values()].map((s) => s.personaId).filter((x): x is number => x !== null))];
  const people: Array<{ id: number; name: string | null }> = personaIds.length && typeof prisma.persona?.findMany === 'function' ? await prisma.persona.findMany({ where: { id: { in: personaIds } }, select: { id: true, name: true } }).catch(() => []) : [];
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  const accounts = [...new Set([...newest.values()].map((s) => s.accountName))];
  const existing = await loadCommitments(prisma, { accountNames: accounts });
  for (const s of newest.values()) {
    const steps = s.sequenceVersionId ? stepsOf.get(s.sequenceVersionId) ?? [] : [];
    const next = steps[s.stepIndex + 1] as { delay?: { value: number; unit: string } } | undefined;
    const sentAt = new Date(s.sentAt);
    const due = next?.delay ? (next.delay.unit === 'calendar_days' ? new Date(sentAt.getTime() + next.delay.value * DAY_MS) : addBusinessDays(sentAt, next.delay.value)) : addBusinessDays(sentAt, SEED_DELAYS_BUSINESS_DAYS[1]);
    const name = s.personaId !== null ? nameOf.get(s.personaId) ?? null : null;
    const who = name ?? s.recipient;
    const r = await ensureCommitment(
      prisma,
      {
        accountName: s.accountName,
        kind: 'follow_up',
        status: 'waiting',
        title: `Follow up with ${who}`,
        dueAt: nyDayAt(nyDay(due)),
        dependency: `${first(who) ?? who}'s reply`,
        person: { personaId: s.personaId, name, email: s.recipient },
        source: { kind: 'send', id: personStepKey(s.personaId, s.recipient, s.stepIndex) },
        detail: { stepIndex: s.stepIndex + 1, decisionId: s.decisionId, sentAt: s.sentAt, ...(next ? {} : { noFollowUpCopy: true }) },
        owner: s.actor,
      },
      { actor: 'gap:work', now },
    ).catch(() => null);
    if (r?.ok && r.created) out.created += 1;
    // The older follow-ups to this person are answered by this send.
    for (const c of existing) {
      if (c.kind !== 'follow_up' || TERMINAL_STATUSES.includes(c.status) || c.person?.email !== s.recipient) continue;
      if ((c.detail?.stepIndex ?? 0) > s.stepIndex) continue;
      const t = await transitionCommitment(prisma, { commitmentId: c.commitmentId, to: 'done', proof: { kind: 'ledger', id: s.eventId, note: `Touch ${s.stepIndex + 1} went out ${nyDay(s.sentAt)}.` }, actor: 'gap:work', now }).catch(() => null);
      if (t?.ok) out.closed += 1;
    }
  }
  return out;
}

/**
 * An out-of-office notice that names a return day adjusts the proposed reminder (R42): the waiting follow-up for that
 * person moves to the day they are back (never earlier than it was); with no follow-up waiting, ONE reminder is
 * created, snoozed until that day. Keyed by the person and the day, so the same notice imported twice (the mailbox
 * and HubSpot) or read on every Work load makes one record. A notice with no return day changes nothing.
 */
export async function syncReturnRemindersFromReplies(
  prisma: PrismaLike,
  replies: ReadonlyArray<{ accountName: string; contactEmail: string; subject: string | null; snippet: string; receivedAt: string; fromName?: string | null }>,
  now: Date,
): Promise<{ adjusted: number; created: number }> {
  const out = { adjusted: 0, created: 0 };
  if (!ledgerReadable(prisma)) return out;
  const notices = replies
    .filter((r) => r.accountName && classifyReply({ snippet: r.snippet, subject: r.subject, from: r.contactEmail }).kind === 'out_of_office')
    // Batch item 8: the day a notice names is read from when it was WRITTEN ("back Monday" is the Monday after it
    // arrived), never from the read: a re-read on any later day moves nothing and keys no second reminder.
    .map((r) => ({ r, back: parseReturnDate(r.snippet, writtenAt(r.receivedAt, now)) }))
    .filter((x): x is { r: (typeof replies)[number]; back: NonNullable<ReturnType<typeof parseReturnDate>> } => !!x.back);
  if (notices.length === 0) return out;
  const existing = await loadCommitments(prisma, { accountNames: [...new Set(notices.map((x) => x.r.accountName))] });
  for (const { r, back } of notices) {
    const email = r.contactEmail.trim().toLowerCase();
    const returnAt = nyDayAt(back.day);
    const who = r.fromName?.trim() || email;
    const fu = existing.find((c) => c.kind === 'follow_up' && !TERMINAL_STATUSES.includes(c.status) && c.accountName === r.accountName && c.person?.email === email);
    if (fu) {
      if (!fu.dueAt || new Date(fu.dueAt).getTime() < returnAt.getTime()) {
        const t = await transitionCommitment(prisma, { commitmentId: fu.commitmentId, to: 'waiting', dependency: `${first(who) ?? who} is out of the office until ${dayLabel(back.day, now)}`, dueAt: returnAt, actor: 'gap:work', now }).catch(() => null);
        if (t?.ok) {
          out.adjusted += 1;
          fu.dueAt = t.commitment.dueAt;
        }
      }
      continue;
    }
    const made = await ensureCommitment(
      prisma,
      { accountName: r.accountName, kind: 'reminder', status: 'snoozed', snoozeUntil: returnAt, dueAt: returnAt, title: `Follow up with ${who} when they are back`.slice(0, TITLE_MAX), basis: `Out of office: "${r.snippet.replace(/\s+/g, ' ').trim().slice(0, 200)}"`, person: { personaId: null, name: r.fromName?.trim() || null, email }, source: { kind: 'reply', id: `ooo:${email}:${back.day}` } },
      { actor: 'gap:work', now },
    ).catch(() => null);
    if (made?.ok && made.created) out.created += 1;
  }
  return out;
}

/**
 * Batch item 8 (finding 3): an answer GAP sent in the person's thread completes the obligations it answered: their
 * request, a follow-up waiting on their reply, a reminder to follow up when they are back. Its proof is the REPLY_SENT
 * ledger row. A referral (no reply is prepared for one) and a meeting to prepare are never closed by a send.
 */
export async function commitmentsAnsweredBySend(
  prisma: PrismaLike,
  a: { accountName: string; email: string; proofId: string; at: string; actor: string; now: Date },
): Promise<number> {
  if (!ledgerReadable(prisma)) return 0;
  const email = a.email.trim().toLowerCase();
  const open = (await loadCommitments(prisma, { accountNames: [a.accountName] })).filter(
    (c) => !TERMINAL_STATUSES.includes(c.status) && (c.person?.email ?? '').trim().toLowerCase() === email && (c.kind === 'answer_request' || c.kind === 'follow_up' || (c.kind === 'reminder' && c.source.kind === 'reply')),
  );
  let done = 0;
  for (const c of open) {
    const t = await transitionCommitment(prisma, { commitmentId: c.commitmentId, to: 'done', proof: { kind: 'ledger', id: a.proofId, note: `Answered ${c.person?.name ?? email} in their thread from GAP on ${dayLabel(nyDay(a.at), a.now)}.` }, actor: a.actor, now: a.now }).catch(() => null);
    if (t?.ok) done += 1;
  }
  return done;
}

/** When a message was written (its received time), else `now` for a row that carries none. */
export function writtenAt(receivedAt: string | Date | null | undefined, now: Date): Date {
  const t = receivedAt ? new Date(receivedAt).getTime() : Number.NaN;
  return Number.isNaN(t) ? now : new Date(t);
}

/** The phase of every commitment at `now` (the surfaces render this). */
export function withPhases(cs: readonly Commitment[], now: Date, moved?: BuyerMoveSince) {
  return cs.map((c) => ({ ...c, ...commitmentPhase(c, now, moved) }));
}
