import type { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email/client';
import { evaluateRecipientEligibility } from '@/lib/email/recipient-guard';
import { wrapHtml } from '@/lib/email/templates';
import { sanitizeEmailHtml } from '@/lib/email/sanitize';
import { ensureLocalMeetingDealLink } from '@/lib/hubspot/deals';
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
  personaName: string | null;
  generatedContentId?: number;
  workflowMetadata?: unknown;
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

/**
 * Shared send pipeline used by both the /api/email/send route and the Draft
 * Queue. Performs (in order): the one-account invariant, candidate-trace
 * resolution, CC sanitization + its drop metric, unsubscribe check (with
 * internal-domain bypass + auto-delete), recipient-eligibility guard,
 * HTML sanitize + wrap-vs-passthrough, the actual send, and the best-effort
 * DB side-effects (EmailLog, generated-content send-count, pipeline
 * auto-advance, Activity row + cache invalidation, local meeting deal link).
 *
 * Guard failures return `{ ok: false, block }` (a SendBlocker, NOT an HTTP
 * response) so callers map them to their own transport.
 */
export async function performSend(
  prisma: PrismaClientLike,
  input: PerformSendInput,
): Promise<PerformSendResult> {
  const {
    to,
    cc,
    subject,
    bodyHtml,
    imageUrl,
    accountName,
    personaName,
    generatedContentId,
    workflowMetadata,
  } = input;

  // Recipient identity resolved by the caller.
  const resolvedRecipient = {
    to,
    accountName: accountName ?? null,
    personaName: personaName ?? null,
  };

  const allowBypass = (email: string) => {
    const lower = email.toLowerCase();
    const fromEmail = process.env.FROM_EMAIL?.toLowerCase() ?? '';
    const internalDomains = ['freightroll.com', 'yardflow.ai'];
    return (
      lower === 'casey@freightroll.com' ||
      (fromEmail && lower === fromEmail) ||
      internalDomains.some((dom) => lower.endsWith(`@${dom}`))
    );
  };

  const accountInvariant = await enforceOneAccountInvariant(prisma, {
    accountName: resolvedRecipient.accountName ?? null,
    recipients: [{
      to: resolvedRecipient.to,
      accountName: resolvedRecipient.accountName ?? null,
    }],
    cc,
  });
  if (!accountInvariant.ok) {
    await recordSourceBackedMetric({
      metric: 'one_account_invariant_violations',
      endpoint: '/api/email/send',
      accountName: resolvedRecipient.accountName ?? null,
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
      endpoint: '/api/email/send',
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

  // Lightweight sanitization to keep email-safe HTML without pulling jsdom into the runtime.
  const sanitizedBody = sanitizeEmailHtml(bodyHtml);

  // Wrap plain text or already-composed HTML into branded template
  const isPlainText = !sanitizedBody.trim().startsWith('<');
  const html = isPlainText
    ? wrapHtml(sanitizedBody, resolvedRecipient.accountName ?? 'the team', resolvedRecipient.to, undefined, imageUrl)
    : sanitizedBody;

  const response = await sendEmail({ to: resolvedRecipient.to, cc: sanitizedCc, subject, html });

  let emailLogId: number | null = null;

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
            personaId: null,
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
        body_html: html,
        status: 'sent',
        provider_message_id: (response.headers?.['x-message-id'] as string) ?? null,
        thread_id: response.threadId ?? null,
        hubspot_engagement_id: response.hubspotEngagementId ?? null,
        metadata: logMetadata,
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

      await ensureLocalMeetingDealLink(resolvedRecipient.accountName, nextStage).catch(() => {});
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

  return {
    ok: true,
    emailLogId,
    providerMessageId: (response.headers?.['x-message-id'] as string) ?? null,
    threadId: response.threadId ?? null,
    hubspotEngagementId: response.hubspotEngagementId ?? null,
    provider: response.provider ?? null,
    hubspotError: response.hubspotError ?? null,
  };
}
