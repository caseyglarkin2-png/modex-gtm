'use server';

import { randomUUID } from 'node:crypto';
import { Prisma, type DraftQueueItem } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { threadExistsWith } from '@/lib/email/gmail-inbox';
import { wrapHtml } from '@/lib/email/templates';
import { resolveSenderIdentity } from '@/lib/email/sender-identity';
import { dedupDecision } from '@/lib/queue/dedup';
import { STATUS } from '@/lib/queue/types';
import { sendQueueItem } from '@/lib/queue/send';
import { prodSendDeps } from '@/lib/queue/send-deps';
import { onSendOutcome } from '@/lib/queue/sequence-runtime';
import { staggerTimes, clampToWindow, selectDue, DEFAULT_WINDOW } from '@/lib/queue/schedule';
import { assignVariants } from '@/lib/queue/variant';
import { QueueAddSchema, type QueueAddInput } from '@/lib/validations';

/** Optional A/B experiment attached to an approveBatch call. */
interface ApproveExperiment {
  name: string;
  variants: Array<{
    variantKey: string;
    subject?: string;
    opening?: string;
    cta?: string;
    split: number;
    isControl?: boolean;
  }>;
}

/** Minimal session shape we read off `auth()` (it has a `role` we attach). */
type SessionLike = { user?: { email?: string | null; role?: string } } | null;

/** Owner-scoped where clause. Admins bypass the owner predicate. */
function ownerWhere(id: number, session: SessionLike, statuses?: string[]) {
  const email = session?.user?.email ?? undefined;
  const role = session?.user?.role;
  return {
    id,
    ...(role !== 'admin' ? { owner: email } : {}),
    ...(statuses ? { status: { in: statuses } } : {}),
  };
}

/**
 * Core add, shared by the UI action and the Clawd API route. Runs the dedup
 * waterfall (unsubscribe / prior email / already-queued / Gmail thread) then
 * inserts, with the Postgres partial unique index as the atomic concurrent-add
 * backstop (P2002 -> already_queued).
 */
export async function addOne(
  input: QueueAddInput,
  owner: string,
): Promise<{ ok: true; id: number } | { ok: false; reason: string }> {
  const toEmail = input.toEmail.toLowerCase();

  const [unsubscribed, emailLogHit, queuedHit, gmailThread] = await Promise.all([
    prisma.unsubscribedEmail.findUnique({ where: { email: toEmail } }).then((r) => !!r),
    prisma.emailLog
      .findFirst({ where: { to_email: { equals: toEmail, mode: 'insensitive' } }, select: { id: true } })
      .then((r) => !!r),
    prisma.draftQueueItem
      .findFirst({
        where: { to_email: toEmail, status: { notIn: [STATUS.sent, STATUS.skipped, STATUS.failed] } },
        select: { id: true },
      })
      .then((r) => !!r),
    threadExistsWith(toEmail).then((r) => r.exists),
  ]);

  const d = dedupDecision({ unsubscribed, emailLogHit, queuedHit, gmailThread });
  if (!d.allow) return { ok: false, reason: d.reason! };

  try {
    const row = await prisma.draftQueueItem.create({
      data: {
        to_email: toEmail,
        account_name: input.accountName,
        persona_name: input.personaName ?? null,
        persona_id: input.personaId ?? null,
        subject: input.subject,
        body: input.body,
        image_url: input.imageUrl ?? null,
        campaign_tag: input.campaignTag ?? null,
        source: input.source ?? 'casey',
        owner,
        created_by: owner,
        idempotency_key: randomUUID(),
      },
      select: { id: true },
    });
    return { ok: true, id: row.id };
  } catch (e: unknown) {
    // partial unique index draft_queue_active_recipient (atomic concurrent-add backstop)
    if ((e as { code?: string })?.code === 'P2002') return { ok: false, reason: 'already_queued' };
    throw e;
  }
}

/** Session wrapper around addOne for the UI add path (source: 'casey'). */
export async function addToQueue(
  input: QueueAddInput,
): Promise<{ ok: true; id: number } | { ok: false; reason: string }> {
  const parsed = QueueAddSchema.parse(input);
  const session = (await auth()) as SessionLike;
  const owner = session?.user?.email;
  if (!owner) return { ok: false, reason: 'unauthenticated' };
  return addOne({ ...parsed, source: 'casey' }, parsed.owner ?? owner);
}

/** List queue items: admins see all, reps see only their own. */
export async function listQueue(): Promise<DraftQueueItem[]> {
  const session = (await auth()) as SessionLike;
  const email = session?.user?.email;
  const role = session?.user?.role;
  if (!email) return [];
  return prisma.draftQueueItem.findMany({
    where: role === 'admin' ? {} : { owner: email },
    orderBy: { created_at: 'desc' },
    take: 200,
  });
}

/**
 * Owner-scoped count of ACTIONABLE Outbox items (draft / approved / failed).
 * Admins count across all owners; reps are scoped to their own. Powers an
 * accurate Outbox tab badge (the list view caps at 200 and includes sent rows).
 */
export async function countActionableQueue(): Promise<number> {
  const session = (await auth()) as SessionLike;
  const email = session?.user?.email ?? undefined;
  const role = session?.user?.role;
  if (!email && role !== 'admin') return 0;
  return prisma.draftQueueItem.count({
    where: {
      ...(role === 'admin' ? {} : { owner: email }),
      status: { in: [STATUS.draft, STATUS.approved, STATUS.failed] },
    },
  });
}

/** Owner-scoped edit. Only allowed while the item is draft/approved. */
export async function updateDraft(
  id: number,
  patch: { subject?: string; body?: string; imageUrl?: string },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;
  const data: Record<string, unknown> = { updated_at: new Date() };
  if (patch.subject !== undefined) data.subject = patch.subject;
  if (patch.body !== undefined) data.body = patch.body;
  if (patch.imageUrl !== undefined) data.image_url = patch.imageUrl;

  const r = await prisma.draftQueueItem.updateMany({
    where: { ...ownerWhere(id, session, [STATUS.draft, STATUS.approved]) },
    data,
  });
  if (r.count === 0) return { ok: false, reason: 'not_found_or_forbidden' };
  return { ok: true };
}

/**
 * Owner-scoped render of the real branded email HTML (signature + inline image)
 * for an Outbox preview. Never throws: a missing UNSUBSCRIBE_SECRET or any other
 * render failure resolves to a soft error instead of a 500.
 */
export async function renderDraftPreview(
  id: number,
): Promise<{ ok: true; html: string } | { ok: false; reason: string }> {
  try {
    const session = (await auth()) as SessionLike;
    const item = await prisma.draftQueueItem.findFirst({ where: ownerWhere(id, session) });
    if (!item) return { ok: false, reason: 'not_found_or_forbidden' };
    const html = wrapHtml(
      item.body,
      item.account_name || 'the team',
      item.to_email,
      undefined,
      item.image_url || undefined,
      undefined,
      resolveSenderIdentity(item.owner),
    );
    return { ok: true, html };
  } catch {
    return { ok: false, reason: 'render_failed' };
  }
}

/** Owner-scoped delete. Refuses to delete an already-sent item. */
export async function removeDraft(
  id: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;
  const r = await prisma.draftQueueItem.deleteMany({
    where: { ...ownerWhere(id, session), status: { not: STATUS.sent } },
  });
  if (r.count === 0) return { ok: false, reason: 'not_found_or_forbidden' };
  return { ok: true };
}

/** Owner-scoped approve-then-send. */
export async function sendNow(id: number) {
  const session = (await auth()) as SessionLike;
  const r = await prisma.draftQueueItem.updateMany({
    where: ownerWhere(id, session, [STATUS.draft, STATUS.approved]),
    data: { status: STATUS.approved, approved_at: new Date() },
  });
  if (r.count === 0) return { ok: false as const, reason: 'not_found_or_forbidden' };
  const result = await sendQueueItem(id, { deps: prodSendDeps(prisma) });
  // Sequence follow-through: schedule next step on sent, cancel run on reply/opt-out.
  const item = await prisma.draftQueueItem.findUnique({ where: { id } });
  if (item) await onSendOutcome(prisma, item, result);
  return result;
}

/**
 * Owner-scoped bulk approve. Without `scheduledFor` it just flips draft/approved
 * rows to approved (still requiring an explicit later send). With `scheduledFor`
 * it staggers the rows across a shared batch, clamped into business hours, so a
 * later send-due pass dispatches them.
 */
export async function approveBatch(
  ids: number[],
  opts?: { scheduledFor?: Date; staggerMinutes?: number; experiment?: ApproveExperiment },
): Promise<{ ok: true; approved: number } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;
  const email = session?.user?.email ?? undefined;
  const role = session?.user?.role;

  // Optional A/B experiment: create the experiment, then deterministically
  // assign one variant per recipient so each item can be stamped below. Mirrors
  // the Experiment + ExperimentVariant creation in send-bulk-async/route.ts.
  let experimentId: string | null = null;
  // Map<itemId, variant_key> for the per-id stamp below.
  const variantByItem = new Map<number, string | null>();
  if (opts?.experiment) {
    const { name, variants } = opts.experiment;
    const exp = await prisma.experiment.create({
      data: {
        name,
        primary_metric: 'reply',
        split: Object.fromEntries(
          variants.map((v) => [v.variantKey, v.split]),
        ) as Prisma.InputJsonValue,
        status: 'active',
        variants: {
          create: variants.map((v) => ({
            variant_key: v.variantKey,
            // ExperimentVariant.subject is a required column; an omitted subject
            // means "use the base draft subject" — stored as '' and treated as
            // no-override by applyVariant at send.
            subject: v.subject ?? '',
            opening: v.opening ?? null,
            cta: v.cta ?? null,
            split_percent: v.split,
            is_control: v.isControl ?? false,
          })),
        },
      },
      select: { id: true },
    });
    experimentId = exp.id;

    const rows = await prisma.draftQueueItem.findMany({
      where: { id: { in: ids }, ...(role !== 'admin' ? { owner: email } : {}) },
      select: { id: true, to_email: true },
    });
    const assignment = assignVariants(
      rows.map((r) => r.to_email),
      variants.map((v) => ({ variantKey: v.variantKey, split: v.split })),
      experimentId,
    );
    for (const r of rows) {
      variantByItem.set(r.id, assignment.get(r.to_email.toLowerCase()) ?? null);
    }
  }

  /** Experiment stamp for a given item id (empty when no experiment). */
  const expData = (id: number): Record<string, unknown> =>
    experimentId
      ? { experiment_id: experimentId, variant_key: variantByItem.get(id) ?? null }
      : {};

  if (!opts?.scheduledFor) {
    let total = 0;
    for (const id of ids) {
      const r = await prisma.draftQueueItem.updateMany({
        where: ownerWhere(id, session, [STATUS.draft, STATUS.approved]),
        data: { status: STATUS.approved, approved_at: new Date(), ...expData(id) },
      });
      total += r.count;
    }
    return { ok: true, approved: total };
  }

  const times = staggerTimes(opts.scheduledFor, ids.length, opts.staggerMinutes ?? 0).map((t) =>
    clampToWindow(t, DEFAULT_WINDOW),
  );
  const batch_id = randomUUID();
  let total = 0;
  for (let i = 0; i < ids.length; i++) {
    const r = await prisma.draftQueueItem.updateMany({
      where: ownerWhere(ids[i], session, [STATUS.draft, STATUS.approved]),
      data: {
        status: STATUS.approved,
        approved_at: new Date(),
        scheduled_for: times[i],
        batch_id,
        ...expData(ids[i]),
      },
    });
    total += r.count;
  }
  return { ok: true, approved: total };
}

/** Retry a failed send. Only items that never reached Gmail (provider_message_id null)
 *  are retryable; a failed-but-already-sent row must be reconciled by hand, not re-sent. */
export async function retryDraft(
  id: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;
  const r = await prisma.draftQueueItem.updateMany({
    where: { ...ownerWhere(id, session), status: STATUS.failed, provider_message_id: null },
    data: { status: STATUS.approved, error_message: null },
  });
  if (r.count === 0) return { ok: false, reason: 'not_retryable' };
  return { ok: true };
}

export interface SequenceStepInput {
  stepIndex: number;
  delayDays: number;
  subjectTemplate?: string;
  bodyTemplate?: string;
}

/**
 * Create a reusable sequence definition. step 0 is the initial send (delayDays ignored);
 * steps 1..N are follow-ups scheduled delayDays after the prior step sends.
 */
export async function createSequence(
  name: string,
  steps: SequenceStepInput[],
): Promise<{ ok: true; id: number } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;
  const owner = session?.user?.email;
  if (!owner) return { ok: false, reason: 'unauthenticated' };
  if (!name?.trim() || !Array.isArray(steps) || steps.length === 0) {
    return { ok: false, reason: 'invalid' };
  }
  const row = await prisma.sequence.create({
    data: { name: name.trim(), owner, steps: steps as unknown as Prisma.InputJsonValue },
  });
  return { ok: true, id: row.id };
}

/**
 * Enroll existing draft items as step 0 of new runs of `sequenceId`. Each gets a
 * fresh sequence_run_id. Owner-scoped (admins bypass).
 */
export async function enrollInSequence(
  draftIds: number[],
  sequenceId: number,
): Promise<{ ok: true; enrolled: number } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.email && session?.user?.role !== 'admin') {
    return { ok: false, reason: 'unauthenticated' };
  }
  let enrolled = 0;
  for (const id of draftIds) {
    // Each draft starts its OWN run -> a distinct sequence_run_id per draft.
    const r = await prisma.draftQueueItem.updateMany({
      where: ownerWhere(id, session, [STATUS.draft, STATUS.approved]),
      data: { sequence_id: sequenceId, sequence_run_id: randomUUID(), step_index: 0 },
    });
    enrolled += r.count;
  }
  return { ok: true, enrolled };
}

/**
 * Unenroll drafts from any sequence run, clearing the step-0 stamp. Owner-scoped
 * (admins bypass) and gated to draft/approved so an in-flight send isn't disturbed.
 */
export async function unenrollFromSequence(
  draftIds: number[],
): Promise<{ ok: true; unenrolled: number } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.email && session?.user?.role !== 'admin') {
    return { ok: false, reason: 'unauthenticated' };
  }
  let unenrolled = 0;
  for (const id of draftIds) {
    const r = await prisma.draftQueueItem.updateMany({
      where: ownerWhere(id, session, [STATUS.draft, STATUS.approved]),
      data: { sequence_id: null, sequence_run_id: null, step_index: null },
    });
    unenrolled += r.count;
  }
  return { ok: true, unenrolled };
}

/** Owner-scoped delete of a sequence definition (admins bypass the owner predicate). */
export async function deleteSequence(
  id: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;
  const email = session?.user?.email ?? undefined;
  const role = session?.user?.role;
  const r = await prisma.sequence.deleteMany({
    where: { id, ...(role !== 'admin' ? { owner: email } : {}) },
  });
  if (r.count === 0) return { ok: false, reason: 'not_found_or_forbidden' };
  return { ok: true };
}

/** List sequences owned by the caller (admins: all). */
export async function listSequences(): Promise<
  Array<{ id: number; name: string; steps: unknown }>
> {
  const session = (await auth()) as SessionLike;
  const email = session?.user?.email;
  const role = session?.user?.role;
  if (!email && role !== 'admin') return [];
  return prisma.sequence.findMany({
    where: role === 'admin' ? {} : { owner: email ?? undefined },
    orderBy: { created_at: 'desc' },
    select: { id: true, name: true, steps: true },
  });
}

/**
 * Admin-only, operator-triggered send of the currently-due approved items.
 * (A manual admin trigger, not an autonomous cron.)
 */
export async function runDueNow(): Promise<
  { ok: false; reason: string } | { ok: true; sent: number; failed: number; skipped: number }
> {
  const session = (await auth()) as SessionLike;
  if (session?.user?.role !== 'admin') return { ok: false, reason: 'forbidden' };

  const items = selectDue(
    await prisma.draftQueueItem.findMany({
      where: { status: STATUS.approved, scheduled_for: { lte: new Date() } },
      take: 25,
      orderBy: { scheduled_for: 'asc' },
    }),
    new Date(),
  );

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const item of items) {
    const r = await sendQueueItem(item.id, { deps: prodSendDeps(prisma) });
    if (r.status === 'sent') sent++;
    else if (r.status === 'failed') failed++;
    else skipped++;
    // Re-fetch so sent_at / email_log_id are populated, then run follow-through.
    const fresh = await prisma.draftQueueItem.findUnique({ where: { id: item.id } });
    if (fresh) await onSendOutcome(prisma, fresh, r);
  }
  return { ok: true, sent, failed, skipped };
}
