import { STATUS } from './types';
import {
  evaluateSendGuards,
  wrapAndSend,
  recordSendSideEffects,
  type PerformSendInput,
} from '@/lib/email/perform-send';
import type { SendDeps } from './send';

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
      return { ok: true };
    },
    send: async (item) => {
      const r = await wrapAndSend(toInput(item), ctx?.sanitizedCc ?? []);
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
  };
}
