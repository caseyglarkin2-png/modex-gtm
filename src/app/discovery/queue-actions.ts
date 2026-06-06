'use server';

import { randomUUID } from 'node:crypto';
import type { DraftQueueItem } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { threadExistsWith } from '@/lib/email/gmail-inbox';
import { dedupDecision } from '@/lib/queue/dedup';
import { STATUS } from '@/lib/queue/types';
import { sendQueueItem } from '@/lib/queue/send';
import { prodSendDeps } from '@/lib/queue/send-deps';
import { staggerTimes, clampToWindow, selectDue, DEFAULT_WINDOW } from '@/lib/queue/schedule';
import { QueueAddSchema, type QueueAddInput } from '@/lib/validations';

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
  return sendQueueItem(id, { deps: prodSendDeps(prisma) });
}

/**
 * Owner-scoped bulk approve. Without `scheduledFor` it just flips draft/approved
 * rows to approved (still requiring an explicit later send). With `scheduledFor`
 * it staggers the rows across a shared batch, clamped into business hours, so a
 * later send-due pass dispatches them.
 */
export async function approveBatch(
  ids: number[],
  opts?: { scheduledFor?: Date; staggerMinutes?: number },
): Promise<{ ok: true; approved: number } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;

  if (!opts?.scheduledFor) {
    let total = 0;
    for (const id of ids) {
      const r = await prisma.draftQueueItem.updateMany({
        where: ownerWhere(id, session, [STATUS.draft, STATUS.approved]),
        data: { status: STATUS.approved, approved_at: new Date() },
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
  }
  return { ok: true, sent, failed, skipped };
}
