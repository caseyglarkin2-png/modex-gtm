import { STATUS, type SendOutcome } from './types';
import { RateLimitedError } from './errors';

const RATE_LIMIT_BACKOFF_MS = 15 * 60 * 1000; // 15 min

export interface SendDeps {
  /** approved -> sending guarded updateMany; returns rows affected (1 = we own it, 0 = lost). */
  claim: (id: number) => Promise<number>;
  loadItem: (id: number) => Promise<{ id: number; status: string } & Record<string, unknown>>;
  guard: (item: Record<string, unknown>) => Promise<{ ok: boolean; reason?: string }>;
  /** Irreversible Gmail send. */
  send: (item: Record<string, unknown>) => Promise<{ providerMessageId: string | null; threadId: string | null }>;
  /** Persist provider ids the instant send resolves, BEFORE any further work. */
  persistProviderIds: (id: number, data: { provider_message_id: string | null; thread_id: string | null }) => Promise<void>;
  /** Logging + CRM side-effects (may throw after the email already went out). */
  runSideEffects: (item: Record<string, unknown>, sent: { providerMessageId: string | null; threadId: string | null }) => Promise<{ emailLogId: number | null }>;
  finalize: (id: number, data: Record<string, unknown>) => Promise<void>;
  /** Reschedule a transient failure back to approved for a later retry. */
  reschedule: (id: number, retryAt: Date) => Promise<void>;
}

export async function sendQueueItem(id: number, opts: { deps: SendDeps }): Promise<SendOutcome> {
  const { deps } = opts;
  const claimed = await deps.claim(id);
  if (claimed === 0) return { status: STATUS.skipped, skippedReason: 'already_claimed' };

  const item = await deps.loadItem(id);
  const g = await deps.guard(item);
  if (!g.ok) {
    const reason = g.reason ?? 'blocked';
    await deps.finalize(id, { status: STATUS.skipped, skipped_reason: reason });
    return { status: STATUS.skipped, skippedReason: reason };
  }

  let sent: { providerMessageId: string | null; threadId: string | null } | null = null;
  try {
    sent = await deps.send(item);
    await deps.persistProviderIds(id, { provider_message_id: sent.providerMessageId, thread_id: sent.threadId });
    const { emailLogId } = await deps.runSideEffects(item, sent);
    await deps.finalize(id, { status: STATUS.sent, email_log_id: emailLogId, sideeffects_done: true, sent_at: new Date() });
    return { status: STATUS.sent, emailLogId: emailLogId ?? undefined, providerMessageId: sent.providerMessageId, threadId: sent.threadId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const alreadySent = sent !== null;
    if (err instanceof RateLimitedError && !alreadySent) {
      await deps.reschedule(id, new Date(Date.now() + RATE_LIMIT_BACKOFF_MS));
      return { status: STATUS.skipped, skippedReason: 'rate_limited' };
    }
    await deps.finalize(id, { status: STATUS.failed, error_message: errorMessage, sideeffects_done: false });
    return { status: STATUS.failed, errorMessage, alreadySent };
  }
}
