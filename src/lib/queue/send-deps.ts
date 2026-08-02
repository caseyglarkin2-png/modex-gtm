import { STATUS } from './types';
import {
  evaluateSendGuards,
  wrapAndSend,
  recordSendSideEffects,
  type PerformSendInput,
} from '@/lib/email/perform-send';
import type { SendDeps } from './send';
import { RateLimitedError } from './errors';
import { DailyCapExceededError } from '@/lib/email/daily-cap';
import { replyPauseDecision } from './sequence';
import { newestInboundFrom } from '@/lib/email/gmail-inbox';
import { applyVariant } from './variant';
import { getRefreshTokenFor } from '@/lib/email/gmail-token-store';

/**
 * Map a DraftQueueItem row to the shared PerformSendInput.
 *
 * `toInput` is sync, so it can't load the experiment variant — that LOAD +
 * apply happens in the async `send` closure. Here we only attach the variant's
 * workflowMetadata so the variant is recorded in EmailLog.metadata via the
 * existing performSend side-effects path. Optionally override subject/body with
 * an already-applied variant (computed in `send`).
 */
function toInput(
  item: Record<string, unknown>,
  applied?: { subject: string; body: string },
  sender?: { refreshToken: string; userEmail: string },
): PerformSendInput {
  const variantKey = (item.variant_key as string | null) ?? null;
  return {
    ...(sender ? { sender } : {}),
    to: item.to_email as string,
    cc: [],
    subject: applied ? applied.subject : (item.subject as string),
    bodyHtml: applied ? applied.body : (item.body as string),
    imageUrl: (item.image_url as string | null) ?? undefined,
    accountName: (item.account_name as string | null) ?? null,
    invariantAccountName: (item.account_name as string | null) ?? null,
    personaName: (item.persona_name as string | null) ?? null,
    personaId: (item.persona_id as number | null) ?? undefined,
    campaignTag: (item.campaign_tag as string | null) ?? null,
    headers: { 'X-Queue-Idempotency': item.idempotency_key as string },
    ...(variantKey
      ? {
          workflowMetadata: {
            queue: { variantKey, experimentId: (item.experiment_id as string | null) ?? null },
          },
        }
      : {}),
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
  let ctx: { html: string; hubspotEngagementId: string | null; sanitizedCc: string[]; trackingId: string | null } | null = null;
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
      ctx = { html: '', hubspotEngagementId: null, sanitizedCc: g.sanitizedCc, trackingId: null };
      // Reply-pause: don't send if the recipient has replied since this item was queued.
      // (Inbound-only — a sequence follow-up's own outbound thread must NOT trip this.)
      const inboundAt = await newestInboundFrom(item.to_email as string);
      if (
        replyPauseDecision({
          inboundSince: inboundAt,
          queuedAt: (item.created_at as Date | undefined) ?? new Date(0),
        }).pause
      ) {
        return { ok: false, reason: 'replied' };
      }
      return { ok: true };
    },
    send: async (item) => {
      // A/B: if this item belongs to an experiment, load its assigned variant
      // and apply subject/opening/cta to the base draft before wrapAndSend.
      let applied: { subject: string; body: string } | undefined;
      if (item.experiment_id && item.variant_key) {
        const v = await prisma.experimentVariant.findFirst({
          where: { experiment_id: item.experiment_id, variant_key: item.variant_key },
        });
        applied = applyVariant(
          {
            subject: item.subject as string,
            body: item.body as string,
            accountName: (item.account_name as string | null) ?? null,
          },
          v
            ? {
                variantKey: v.variant_key,
                subject: v.subject ?? undefined,
                opening: v.opening ?? undefined,
                cta: v.cta ?? undefined,
                isControl: v.is_control,
              }
            : null,
        );
      }
      // Per-identity send: resolve the owner's stored Gmail refresh token. When
      // present, the message sends AS the owner (e.g. jake@freightroll.com).
      // When null (no per-user token / store not configured), `sender` is
      // undefined → falls back to the Casey env token, exactly as today.
      const rt = await getRefreshTokenFor(prisma, item.owner as string);
      const sender = rt ? { refreshToken: rt, userEmail: item.owner as string } : undefined;

      let r: Awaited<ReturnType<typeof wrapAndSend>>;
      try {
        r = await wrapAndSend(toInput(item, applied, sender), ctx?.sanitizedCc ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // A daily-ceiling refusal is BACKPRESSURE, not a bad draft. send.ts
        // finalizes anything that is not a RateLimitedError as permanently
        // failed, and nothing re-queues failed items - so 250 approved drafts
        // against a cap of 200 used to mark items 201-250 dead forever with
        // "Daily send ceiling reached", and they would not go out the next day
        // either. The same applied to a single transient Prisma timeout, via
        // the fail-closed conversion in daily-cap.
        if (err instanceof DailyCapExceededError) {
          throw new RateLimitedError(msg);
        }
        if (/\b429\b|rate.?limit|userRateLimitExceeded|quotaExceeded/i.test(msg)) {
          throw new RateLimitedError(msg);
        }
        throw err;
      }
      ctx = {
        html: r.html,
        hubspotEngagementId: r.hubspotEngagementId,
        sanitizedCc: ctx?.sanitizedCc ?? [],
        trackingId: r.trackingId,
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
        trackingId: ctx?.trackingId ?? null,
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
