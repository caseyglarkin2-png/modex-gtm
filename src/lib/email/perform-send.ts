import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email/client';
import { evaluateRecipientEligibility } from '@/lib/email/recipient-guard';
import { fetchImageAsAttachment } from '@/lib/email/inline-image';
import { wrapHtml } from '@/lib/email/templates';
import { resolveSenderIdentity } from '@/lib/email/sender-identity';
import { sanitizeEmailHtml } from '@/lib/email/sanitize';
import { advancePipelineStage, derivePipelineStage } from '@/lib/pipeline';
import { markAgentActionCacheStale } from '@/lib/agent-actions/cache';
import { enforceOneAccountInvariant } from '@/lib/revops/one-account-invariant';
import { buildCandidateTraceLookup, resolveCandidateTrace } from '@/lib/revops/candidate-trace';
import { recordSourceBackedMetric } from '@/lib/source-backed/metrics';
import {
  ineligibleRecipientSendBlocker,
  mixedAccountPayloadSendBlocker,
  unsubscribedSendBlocker,
  type SendBlocker,
} from '@/lib/email/send-blockers';

/**
 * Structural Prisma type. Kept as `PrismaClient` so the downstream RevOps
 * helpers (one-account invariant, candidate-trace, recipient-guard) type-check
 * against the same client the route passes in.
 */
export type PrismaClientLike = PrismaClient;

export interface PerformSendInput {
  to: string;
  cc?: string[];
  subject: string;
  bodyHtml: string;
  imageUrl?: string;
  /** Recipient's resolved account name (route's `resolvedRecipient.accountName`). */
  accountName: string | null;
  /**
   * Account name for the one-account invariant only. Preserves the route's
   * fuller fallback chain (`resolvedRecipient.accountName ?? generatedAccountName
   * ?? accountName`). Falls back to `accountName` when unset.
   */
  invariantAccountName?: string | null;
  personaName: string | null;
  personaId?: number;
  generatedContentId?: number;
  /**
   * Free-form campaign cohort label (e.g. 'allentown-tour') carried from the
   * originating DraftQueueItem. Stamped onto the EmailLog at creation so
   * engagement rolls up per campaign. Optional; unset for non-campaign sends.
   */
  campaignTag?: string | null;
  workflowMetadata?: unknown;
  /**
   * Extra transport headers passed straight to `sendEmail` (e.g. the Draft
   * Queue's idempotency header). The route passes none.
   */
  headers?: Record<string, string>;
  /**
   * Optional per-identity sender, forwarded to `sendEmail`. When set the
   * message sends as this user (their Gmail refresh token + From). The route
   * passes none → unchanged env/Casey behavior.
   */
  sender?: { refreshToken: string; userEmail: string };
}

export type PerformSendResult =
  | { ok: false; block: SendBlocker }
  | {
      ok: true;
      emailLogId: number | null;
      providerMessageId: string | null;
      threadId: string | null;
      hubspotEngagementId: string | null;
      provider: string | null;
      hubspotError: string | null;
    };

/** Candidate-trace metadata computed in the guard phase, threaded into side-effects. */
type CandidateTraceContext = {
  recipientCandidateTrace: unknown;
  ccCandidateTraces: { email: string; trace: unknown }[];
};

const ENDPOINT = '/api/email/send';

function allowBypass(email: string): boolean {
  const lower = email.toLowerCase();
  const fromEmail = process.env.FROM_EMAIL?.toLowerCase() ?? '';
  const internalDomains = ['freightroll.com', 'yardflow.ai'];
  return (
    lower === 'casey@freightroll.com' ||
    (!!fromEmail && lower === fromEmail) ||
    internalDomains.some((dom) => lower.endsWith(`@${dom}`))
  );
}

/**
 * Phase 1 — guards. In the SAME order as the legacy `performSend`:
 * one-account invariant (+ metric), candidate-trace lookup, CC sanitization
 * (+ drop metric), unsubscribe check (with internal-domain bypass + auto-delete),
 * recipient-eligibility guard. On any block returns `{ ok:false, block }`,
 * otherwise `{ ok:true, sanitizedCc, traceContext }`.
 */
export async function evaluateSendGuards(
  prisma: PrismaClientLike,
  input: PerformSendInput,
): Promise<
  | { ok: true; sanitizedCc: string[]; traceContext: CandidateTraceContext }
  | { ok: false; block: SendBlocker }
> {
  const { to, cc, accountName } = input;

  const resolvedRecipient = {
    to,
    accountName: accountName ?? null,
    personaName: input.personaName ?? null,
  };

  // The one-account invariant uses the route's fuller account fallback chain
  // (recipient → generated-content → request-body account), distinct from the
  // recipient-only account used for EmailLog + pipeline advance below.
  const invariantAccountName = input.invariantAccountName ?? input.accountName ?? null;

  const accountInvariant = await enforceOneAccountInvariant(prisma, {
    accountName: invariantAccountName,
    recipients: [{
      to: resolvedRecipient.to,
      accountName: invariantAccountName,
    }],
    cc,
  });
  if (!accountInvariant.ok) {
    await recordSourceBackedMetric({
      metric: 'one_account_invariant_violations',
      endpoint: ENDPOINT,
      accountName: invariantAccountName,
      details: accountInvariant.details,
    });
    const block = mixedAccountPayloadSendBlocker(accountInvariant.details);
    return { ok: false, block };
  }

  const traceLookup = await buildCandidateTraceLookup(prisma, {
    accountNames: accountInvariant.scopedAccountNames,
    emails: [resolvedRecipient.to, ...accountInvariant.normalizedCc],
  });
  const recipientCandidateTrace = resolveCandidateTrace(traceLookup, {
    email: resolvedRecipient.to,
    accountName: resolvedRecipient.accountName ?? accountInvariant.canonicalAccountName,
  });
  const ccCandidateTraces = accountInvariant.normalizedCc
    .map((email) => ({
      email,
      trace: resolveCandidateTrace(traceLookup, {
        email,
        accountName: resolvedRecipient.accountName ?? accountInvariant.canonicalAccountName,
      }),
    }))
    .filter((entry) => entry.trace)
    .map((entry) => ({
      email: entry.email,
      trace: entry.trace,
    }));
  const sanitizedCc = accountInvariant.normalizedCc.filter((email) => email !== resolvedRecipient.to);
  const ccSanitizationDrops = accountInvariant.normalizedCc.length - sanitizedCc.length;
  if (ccSanitizationDrops > 0) {
    await recordSourceBackedMetric({
      metric: 'cc_sanitization_drops',
      endpoint: ENDPOINT,
      accountName: resolvedRecipient.accountName ?? accountInvariant.canonicalAccountName ?? null,
      value: ccSanitizationDrops,
      details: { to: resolvedRecipient.to },
    });
  }

  const outboundRecipients = [resolvedRecipient.to, ...accountInvariant.normalizedCc];
  const unsubscribedRows = await prisma.unsubscribedEmail.findMany({
    where: { email: { in: outboundRecipients } },
    select: { email: true },
  });
  const unsubscribedSet = new Set(unsubscribedRows.map((row) => row.email.toLowerCase()));
  for (const email of outboundRecipients) {
    if (!unsubscribedSet.has(email.toLowerCase())) continue;
    if (allowBypass(email)) {
      await prisma.unsubscribedEmail.delete({ where: { email } }).catch(() => {});
      continue;
    }
    const block = unsubscribedSendBlocker(email);
    return { ok: false, block };
  }

  for (const email of outboundRecipients) {
    const guard = await evaluateRecipientEligibility(prisma, email);
    if (!guard.ok) {
      const block = ineligibleRecipientSendBlocker(guard.reason ?? 'Recipient is not sendable.');
      return { ok: false, block };
    }
  }

  return {
    ok: true,
    sanitizedCc,
    traceContext: { recipientCandidateTrace, ccCandidateTraces },
  };
}

/**
 * Phase 2 — HTML sanitize + wrap-vs-passthrough, then the actual (irreversible)
 * `sendEmail`. Returns the provider ids, the HubSpot engagement id, AND the
 * final HTML (the side-effects need it for the EmailLog body).
 */
export async function wrapAndSend(
  input: PerformSendInput,
  sanitizedCc: string[],
): Promise<{
  providerMessageId: string | null;
  threadId: string | null;
  hubspotEngagementId: string | null;
  html: string;
  trackingId: string | null;
  provider: string | null;
  hubspotError: string | null;
}> {
  const { to, subject, bodyHtml, imageUrl, accountName } = input;

  // Mint an opaque open-tracking handle for this send. It is HMAC-signed into
  // the pixel URL and persisted on the EmailLog (we never expose the raw row
  // id). Generated here so the pixel can be embedded BEFORE the (irreversible)
  // send, and threaded into the side-effects so the row stores the same handle.
  const trackingId = randomUUID();

  // Lightweight sanitization to keep email-safe HTML without pulling jsdom into the runtime.
  const sanitizedBody = sanitizeEmailHtml(bodyHtml);

  // If a proof image is requested, try to fetch it as an inline (cid:) attachment
  // so it renders even when remote images are blocked. On ANY failure (fetch
  // error / not allowlisted) `fetchImageAsAttachment` returns null and we fall
  // back to the hosted <img> URL — current behavior, nothing breaks.
  const inline = imageUrl ? await fetchImageAsAttachment(imageUrl) : null;

  // Wrap plain text or already-composed HTML into branded template. The
  // signature is owner-correct: a per-identity sender (e.g. Jake) gets their own
  // name/role; no sender resolves to Casey (unchanged default behavior).
  const identity = resolveSenderIdentity(input.sender?.userEmail ?? null);
  const isPlainText = !sanitizedBody.trim().startsWith('<');
  // The open pixel is injected by wrapHtml (the single outbound-HTML builder), so
  // it only rides on the plain-text wrap path. Pre-composed HTML bodies pass
  // through untouched and carry no pixel; trackingId is still persisted so the row
  // is consistent (just never opened-tracked).
  const html = isPlainText
    ? wrapHtml(sanitizedBody, accountName ?? 'the team', to, undefined, imageUrl, inline?.contentId, identity, trackingId)
    : sanitizedBody;

  const response = await sendEmail({
    to,
    cc: sanitizedCc,
    subject,
    html,
    headers: input.headers,
    ...(input.sender ? { sender: input.sender } : {}),
    ...(inline ? { inlineImage: inline } : {}),
  });

  return {
    providerMessageId: (response.headers?.['x-message-id'] as string) ?? null,
    threadId: response.threadId ?? null,
    hubspotEngagementId: response.hubspotEngagementId ?? null,
    html,
    trackingId,
    provider: response.provider ?? null,
    hubspotError: response.hubspotError ?? null,
  };
}

/**
 * Phase 3 — post-send DB side-effects, best-effort (skipped if no DB):
 * EmailLog row, generated-content send-count increment, pipeline auto-advance,
 * Activity row + agent-action cache invalidation, local meeting deal link.
 *
 * `traceContext` carries the candidate-trace metadata computed in
 * `evaluateSendGuards` so the EmailLog metadata is byte-identical to the legacy
 * monolith. When unavailable (callers that don't thread it) it is recomputed.
 */
export async function recordSendSideEffects(
  prisma: PrismaClientLike,
  input: PerformSendInput,
  sent: {
    providerMessageId: string | null;
    threadId: string | null;
    hubspotEngagementId: string | null;
    html: string;
    trackingId?: string | null;
  },
  traceContext?: CandidateTraceContext,
): Promise<{ emailLogId: number | null }> {
  const { to, subject, accountName, generatedContentId, workflowMetadata } = input;

  const resolvedRecipient = {
    to,
    accountName: accountName ?? null,
    personaName: input.personaName ?? null,
  };

  let emailLogId: number | null = null;

  // Recompute candidate traces only if the guard phase didn't thread them in.
  let recipientCandidateTrace: unknown = traceContext?.recipientCandidateTrace;
  let ccCandidateTraces: { email: string; trace: unknown }[] = traceContext?.ccCandidateTraces ?? [];
  if (!traceContext) {
    const cc = input.cc ?? [];
    const traceLookup = await buildCandidateTraceLookup(prisma, {
      accountNames: resolvedRecipient.accountName ? [resolvedRecipient.accountName] : [],
      emails: [resolvedRecipient.to, ...cc],
    });
    recipientCandidateTrace = resolveCandidateTrace(traceLookup, {
      email: resolvedRecipient.to,
      accountName: resolvedRecipient.accountName,
    });
    ccCandidateTraces = cc
      .map((email) => ({
        email,
        trace: resolveCandidateTrace(traceLookup, {
          email,
          accountName: resolvedRecipient.accountName,
        }),
      }))
      .filter((entry) => entry.trace)
      .map((entry) => ({ email: entry.email, trace: entry.trace }));
  }

  const sanitizedCc = (input.cc ?? []).filter((email) => email !== resolvedRecipient.to);

  // Best-effort DB log — skip if no DB available
  try {
    const accountExists = resolvedRecipient.accountName
      ? await prisma.account.findUnique({
          where: { name: resolvedRecipient.accountName },
          select: { name: true, pipeline_stage: true, outreach_status: true, meeting_status: true },
        })
      : null;

    const wf = workflowMetadata as { details?: Record<string, unknown> } | undefined;
    const logMetadata = wf
      ? JSON.parse(JSON.stringify({
          workflow: {
            ...wf,
            details: {
              ...(wf.details ?? {}),
              candidateTrace: {
                recipient: recipientCandidateTrace,
                cc: ccCandidateTraces,
              },
            },
          },
          recipient: {
            personaId: input.personaId ?? null,
            personaName: resolvedRecipient.personaName ?? null,
            cc: sanitizedCc,
            candidateTrace: recipientCandidateTrace,
            ccCandidateTraces,
          },
        }))
      : undefined;

    const createdLog = await prisma.emailLog.create({
      data: {
        account_name: resolvedRecipient.accountName ?? '',
        persona_name: resolvedRecipient.personaName ?? null,
        to_email: resolvedRecipient.to.toLowerCase(),
        subject,
        body_html: sent.html,
        status: 'sent',
        provider_message_id: sent.providerMessageId,
        thread_id: sent.threadId,
        hubspot_engagement_id: sent.hubspotEngagementId,
        metadata: logMetadata,
        // Campaign cohort label + open-tracking handle ride from the draft/send
        // path onto the row so engagement rolls up per campaign and an open
        // pixel can resolve back to this row.
        ...(input.campaignTag ? { campaign_tag: input.campaignTag } : {}),
        ...(sent.trackingId ? { tracking_id: sent.trackingId } : {}),
        ...(generatedContentId ? { generated_content_id: generatedContentId } : {}),
      },
    });
    emailLogId = (createdLog as { id?: number } | null)?.id ?? null;

    if (generatedContentId) {
      await prisma.generatedContent.update({
        where: { id: generatedContentId },
        data: { external_send_count: { increment: 1 } },
      }).catch(() => {});
    }

    // Auto-update outreach_status to "Contacted" if currently "Not started"
    if (resolvedRecipient.accountName && accountExists) {
      const nextStage = advancePipelineStage(
        derivePipelineStage(accountExists),
        'contacted',
      );

      await prisma.account.updateMany({
        where: { name: resolvedRecipient.accountName },
        data: {
          outreach_status: 'Contacted',
          pipeline_stage: nextStage,
          current_motion: `Pipeline stage: ${nextStage}`,
        },
      }).catch(() => {});

      // No HubSpot deal on a cold outbound. A deal opens only once there's a
      // real conversation: the inbound-reply path (cron/check-inbox) creates +
      // advances it, and manual pipeline/meeting actions create it deliberately.
      // Sending an invite tracks outreach_status='Contacted' locally, nothing more.
    }

    // Auto-log activity for the send
    if (resolvedRecipient.accountName && accountExists) {
      await prisma.activity.create({
        data: {
          account_name: resolvedRecipient.accountName,
          persona: resolvedRecipient.personaName ?? null,
          activity_type: 'Email',
          outcome: `Email sent: "${subject}" to ${resolvedRecipient.to}`,
          next_step: 'Monitor for open/reply — follow up in 3 days if no response',
          next_step_due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          owner: 'Casey',
          activity_date: new Date(),
        },
      }).catch(() => {});
      await markAgentActionCacheStale(resolvedRecipient.accountName).catch(() => undefined);
    }
  } catch {
    // DB offline — log skipped
  }

  return { emailLogId };
}

/**
 * Shared send pipeline used by both the /api/email/send route and the Draft
 * Queue. Composed from `evaluateSendGuards` → `wrapAndSend` →
 * `recordSendSideEffects`. Behaviour is identical to the legacy monolith.
 *
 * Guard failures return `{ ok: false, block }` (a SendBlocker, NOT an HTTP
 * response) so callers map them to their own transport.
 *
 * `opts.sentResult` lets a caller (e.g. a queue worker that already performed
 * the irreversible send) skip `wrapAndSend` and only run the side-effects.
 */
export async function performSend(
  prisma: PrismaClientLike,
  input: PerformSendInput,
  opts?: {
    sentResult?: {
      providerMessageId: string | null;
      threadId: string | null;
      hubspotEngagementId: string | null;
      html: string;
      trackingId?: string | null;
      provider?: string | null;
      hubspotError?: string | null;
    };
  },
): Promise<PerformSendResult> {
  const guards = await evaluateSendGuards(prisma, input);
  if (!guards.ok) {
    return { ok: false, block: guards.block };
  }

  const sent = opts?.sentResult ?? (await wrapAndSend(input, guards.sanitizedCc));

  const { emailLogId } = await recordSendSideEffects(prisma, input, sent, guards.traceContext);

  return {
    ok: true,
    emailLogId,
    providerMessageId: sent.providerMessageId,
    threadId: sent.threadId,
    hubspotEngagementId: sent.hubspotEngagementId,
    provider: ('provider' in sent ? sent.provider : undefined) ?? null,
    hubspotError: ('hubspotError' in sent ? sent.hubspotError : undefined) ?? null,
  };
}
