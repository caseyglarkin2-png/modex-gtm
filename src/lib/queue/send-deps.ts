import { STATUS } from './types';
import {
  evaluateSendGuards,
  wrapAndSend,
  recordSendSideEffects,
  type PerformSendInput,
} from '@/lib/email/perform-send';
import type { SendDeps } from './send';
import { RateLimitedError } from './errors';
import { recipientCommsStatus, type CommsDeps } from './comms-status';
import { threadExistsWith } from '@/lib/email/gmail-inbox';
import { hubspotLastContacted } from '@/lib/hubspot/contacts';

/** Real comms-awareness signals for the QUEUE-ONLY pre-send guard. */
function prodCommsDeps(prisma: any): CommsDeps {
  return {
    isUnsubscribed: async (email) =>
      !!(await prisma.unsubscribedEmail.findUnique({ where: { email: email.toLowerCase() } })),
    gmailThread: async (email) => (await threadExistsWith(email)).exists,
    emailLogHit: async (email) =>
      !!(await prisma.emailLog.findFirst({
        where: { to_email: { equals: email.toLowerCase(), mode: 'insensitive' } },
        select: { id: true },
      })),
    hubspot: (email) => hubspotLastContacted(email),
  };
}

/** Map a DraftQueueItem row to the shared PerformSendInput. */
function toInput(item: Record<string, unknown>): PerformSendInput {
  return {
    to: item.to_email as string,
    cc: [],
    subject: item.subject as string,
    bodyHtml: item.body as string,
    imageUrl: (item.image_url as string | null) ?? undefined,
    accountName: (item.account_name as string | null) ?? null,
    invariantAccountName: (item.account_name as string | null) ?? null,
    personaName: (item.persona_name as string | null) ?? null,
    personaId: (item.persona_id as number | null) ?? undefined,
    headers: { 'X-Queue-Idempotency': item.idempotency_key as string },
  };
}

/**
 * Production `SendDeps` for the Draft Queue. Reuses the split `performSend`
 * phases (guards / send / side-effects) so queue sends and route sends stay
 * byte-identical. A closure carries the sanitized CC, final HTML, and HubSpot
 * engagement id from `guard`/`send` into `runSideEffects` (the generic
 * `SendDeps.send` signature stays `{ providerMessageId, threadId }`).
 */
export function prodSendDeps(prisma: any): SendDeps {
  let ctx: { html: string; hubspotEngagementId: string | null; sanitizedCc: string[] } | null = null;
  return {
    claim: (id) =>
      prisma.draftQueueItem
        .updateMany({
          where: { id, status: STATUS.approved },
          data: { status: STATUS.sending, claimed_at: new Date() },
        })
        .then((r: any) => r.count),
    loadItem: (id) => prisma.draftQueueItem.findUniqueOrThrow({ where: { id } }),
    guard: async (item) => {
      const g = await evaluateSendGuards(prisma, toInput(item));
      if (!g.ok) return { ok: false, reason: g.block.code ?? 'blocked' };
      ctx = { html: '', hubspotEngagementId: null, sanitizedCc: g.sanitizedCc };
      // QUEUE-ONLY comms guard: don't send to someone now unsubscribed or mid-thread.
      const comms = await recipientCommsStatus(item.to_email as string, prodCommsDeps(prisma));
      if (comms.state === 'unsubscribed' || comms.state === 'in_thread') {
        return { ok: false, reason: comms.state };
      }
      return { ok: true };
    },
    send: async (item) => {
      let r: Awaited<ReturnType<typeof wrapAndSend>>;
      try {
        r = await wrapAndSend(toInput(item), ctx?.sanitizedCc ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/\b429\b|rate.?limit|userRateLimitExceeded|quotaExceeded/i.test(msg)) {
          throw new RateLimitedError(msg);
        }
        throw err;
      }
      ctx = {
        html: r.html,
        hubspotEngagementId: r.hubspotEngagementId,
        sanitizedCc: ctx?.sanitizedCc ?? [],
      };
      return { providerMessageId: r.providerMessageId, threadId: r.threadId };
    },
    persistProviderIds: (id, data) =>
      prisma.draftQueueItem.update({ where: { id }, data }).then(() => undefined),
    runSideEffects: async (item, sent) => {
      const r = await recordSendSideEffects(prisma, toInput(item), {
        ...sent,
        html: ctx?.html ?? '',
        hubspotEngagementId: ctx?.hubspotEngagementId ?? null,
      });
      return { emailLogId: r.emailLogId };
    },
    finalize: (id, data) =>
      prisma.draftQueueItem.update({ where: { id }, data }).then(() => undefined),
    reschedule: (id, retryAt) =>
      prisma.draftQueueItem
        .update({
          where: { id },
          data: { status: STATUS.approved, scheduled_for: retryAt, claimed_at: null },
        })
        .then(() => undefined),
  };
}
