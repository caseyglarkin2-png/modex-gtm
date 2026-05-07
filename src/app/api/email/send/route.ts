import { NextRequest, NextResponse } from 'next/server';
import { SendEmailSchema } from '@/lib/validations';
import { sendEmail } from '@/lib/email/client';
import { evaluateRecipientEligibility } from '@/lib/email/recipient-guard';
import { wrapHtml } from '@/lib/email/templates';
import { sanitizeEmailHtml } from '@/lib/email/sanitize';
import { rateLimit } from '@/lib/rate-limit';
import { ensureLocalMeetingDealLink } from '@/lib/hubspot/deals';
import { advancePipelineStage, derivePipelineStage } from '@/lib/pipeline';
import { markAgentActionCacheStale } from '@/lib/agent-actions/cache';
import { SOURCE_APPROVAL_GATE_ENABLED } from '@/lib/feature-flags';
import { requiresApprovalForSend } from '@/lib/revops/generated-content-approval';
import { enforceOneAccountInvariant } from '@/lib/revops/one-account-invariant';
import { buildCandidateTraceLookup, resolveCandidateTrace } from '@/lib/revops/candidate-trace';
import { recordSourceBackedMetric } from '@/lib/source-backed/metrics';
import {
  approvalRequiredSendBlocker,
  generatedContentMissingSendBlocker,
  ineligibleRecipientSendBlocker,
  invalidJsonSendBlocker,
  invalidPayloadSendBlocker,
  mixedAccountPayloadSendBlocker,
  noEmailSendBlocker,
  providerConfigSendBlocker,
  recipientNotFoundSendBlocker,
  runtimeSendBlocker,
  serializeSendBlocker,
  unsubscribedSendBlocker,
} from '@/lib/email/send-blockers';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok, remaining } = rateLimit(`email:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded. Max 10 emails per minute.', remaining: 0 }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const block = invalidJsonSendBlocker();
    return NextResponse.json(serializeSendBlocker(block), { status: block.status });
  }

  const parsed = SendEmailSchema.safeParse(body);
  if (!parsed.success) {
    const block = invalidPayloadSendBlocker(parsed.error.flatten());
    return NextResponse.json(serializeSendBlocker(block), { status: block.status });
  }

  if (!process.env.UNSUBSCRIBE_SECRET) {
    const block = providerConfigSendBlocker('Set UNSUBSCRIBE_SECRET in Vercel env (Prod/Preview/Dev) before sending.');
    return NextResponse.json(serializeSendBlocker(block), { status: block.status });
  }

  const { to, cc, subject, bodyHtml, accountName, personaName, personaId, generatedContentId, workflowMetadata } = parsed.data;

  if (!to || to.trim() === '') {
    const block = noEmailSendBlocker();
    return NextResponse.json(serializeSendBlocker(block), { status: block.status });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    let resolvedRecipient = {
      to,
      accountName: accountName ?? null,
      personaName: personaName ?? null,
    };

    if (personaId) {
      const persona = await prisma.persona.findUnique({
        where: { id: personaId },
        select: {
          id: true,
          name: true,
          email: true,
          account_name: true,
        },
      });
      if (!persona || !persona.email) {
        const block = recipientNotFoundSendBlocker();
        return NextResponse.json(serializeSendBlocker(block), { status: block.status });
      }
      resolvedRecipient = {
        to: persona.email,
        accountName: persona.account_name,
        personaName: persona.name,
      };
    }
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
    let generatedAccountName: string | null = null;
    if (generatedContentId) {
      const generated = await prisma.generatedContent.findUnique({
        where: { id: generatedContentId },
        select: {
          id: true,
          content: true,
          account_name: true,
          campaign: {
            select: {
              campaign_type: true,
            },
          },
          checklist_state: {
            select: {
              completed_item_ids: true,
            },
          },
        },
      });
      if (!generated) {
        const block = generatedContentMissingSendBlocker(generatedContentId);
        return NextResponse.json(serializeSendBlocker(block), { status: block.status });
      }
      generatedAccountName = generated.account_name ?? null;
      if (SOURCE_APPROVAL_GATE_ENABLED) {
        const approvalDecision = await requiresApprovalForSend(prisma, generatedContentId);
        if (!approvalDecision.approved) {
          await recordSourceBackedMetric({
            metric: 'approval_blocks',
            endpoint: '/api/email/send',
            accountName: resolvedRecipient.accountName ?? generatedAccountName ?? accountName ?? null,
            details: {
              generatedContentId,
              status: approvalDecision.status,
            },
          });
          const block = approvalRequiredSendBlocker({
            generatedContentId,
            status: approvalDecision.status,
            reviewId: approvalDecision.reviewId,
          });
          return NextResponse.json(serializeSendBlocker(block), { status: block.status });
        }
      }
    }

    const accountInvariant = await enforceOneAccountInvariant(prisma, {
      accountName: resolvedRecipient.accountName ?? generatedAccountName ?? accountName ?? null,
      recipients: [{
        to: resolvedRecipient.to,
        accountName: resolvedRecipient.accountName ?? generatedAccountName ?? accountName ?? null,
      }],
      cc,
    });
    if (!accountInvariant.ok) {
      await recordSourceBackedMetric({
        metric: 'one_account_invariant_violations',
        endpoint: '/api/email/send',
        accountName: resolvedRecipient.accountName ?? generatedAccountName ?? accountName ?? null,
        details: accountInvariant.details,
      });
      const block = mixedAccountPayloadSendBlocker(accountInvariant.details);
      return NextResponse.json(serializeSendBlocker(block), { status: block.status });
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
        accountName: resolvedRecipient.accountName ?? accountInvariant.canonicalAccountName ?? accountName ?? null,
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
      return NextResponse.json(serializeSendBlocker(block, { remaining }), { status: block.status });
    }

    for (const email of outboundRecipients) {
      const guard = await evaluateRecipientEligibility(prisma, email);
      if (!guard.ok) {
        const block = ineligibleRecipientSendBlocker(guard.reason ?? 'Recipient is not sendable.');
        return NextResponse.json(serializeSendBlocker(block), { status: block.status });
      }
    }

    // Lightweight sanitization to keep email-safe HTML without pulling jsdom into the runtime.
    const sanitizedBody = sanitizeEmailHtml(bodyHtml);

    // Wrap plain text or already-composed HTML into branded template
    const isPlainText = !sanitizedBody.trim().startsWith('<');
    const html = isPlainText ? wrapHtml(sanitizedBody, resolvedRecipient.accountName ?? accountName ?? 'the team', resolvedRecipient.to) : sanitizedBody;

    const response = await sendEmail({ to: resolvedRecipient.to, cc: sanitizedCc, subject, html });

    // Best-effort DB log — skip if no DB available
    try {
      const accountExists = resolvedRecipient.accountName
        ? await prisma.account.findUnique({
            where: { name: resolvedRecipient.accountName },
            select: { name: true, pipeline_stage: true, outreach_status: true, meeting_status: true },
          })
        : null;

      const logMetadata = workflowMetadata
        ? JSON.parse(JSON.stringify({
            workflow: {
              ...workflowMetadata,
              details: {
                ...(workflowMetadata.details ?? {}),
                candidateTrace: {
                  recipient: recipientCandidateTrace,
                  cc: ccCandidateTraces,
                },
              },
            },
            recipient: {
              personaId: personaId ?? null,
              personaName: resolvedRecipient.personaName ?? null,
              cc: sanitizedCc,
              candidateTrace: recipientCandidateTrace,
              ccCandidateTraces,
            },
          }))
        : undefined;

      await prisma.emailLog.create({
        data: {
          account_name: resolvedRecipient.accountName ?? '',
          persona_name: resolvedRecipient.personaName ?? null,
          to_email: resolvedRecipient.to,
          subject,
          body_html: html,
          status: 'sent',
          provider_message_id: (response.headers?.['x-message-id'] as string) ?? null,
          hubspot_engagement_id: response.hubspotEngagementId ?? null,
          metadata: logMetadata,
          ...(generatedContentId ? { generated_content_id: generatedContentId } : {}),
        },
      });

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

    return NextResponse.json({
      success: true,
      message: `Email sent to ${resolvedRecipient.to}`,
      provider: response.provider ?? 'unknown',
      hubspotEngagementId: response.hubspotEngagementId ?? null,
      hubspotError: response.hubspotError ?? null,
      remaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email send failed';
    const block = runtimeSendBlocker(message);
    return NextResponse.json(serializeSendBlocker(block), { status: block.status });
  }
}
