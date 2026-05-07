import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BulkSendEmailSchema } from '@/lib/validations';
import { sendBulk } from '@/lib/email/client';
import { evaluateRecipientEligibility, getEmailDomain } from '@/lib/email/recipient-guard';
import { wrapHtml } from '@/lib/email/templates';
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
  invalidJsonSendBlocker,
  invalidPayloadSendBlocker,
  mixedAccountPayloadSendBlocker,
  noSendableRecipientsSendBlocker,
  serializeSendBlocker,
} from '@/lib/email/send-blockers';

const recipientEmailSchema = z.string().trim().email();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`bulk-email:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded. Max 10 requests per minute.' }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const block = invalidJsonSendBlocker();
    return NextResponse.json(serializeSendBlocker(block), { status: block.status });
  }

  const parsed = BulkSendEmailSchema.safeParse(body);
  if (!parsed.success) {
    const block = invalidPayloadSendBlocker(parsed.error.flatten());
    return NextResponse.json(serializeSendBlocker(block), { status: block.status });
  }

  const { recipients, subject, bodyHtml, cc, accountName, generatedContentId, workflowMetadata } = parsed.data;

  const isPlainText = !bodyHtml.trim().startsWith('<');
  const html = isPlainText ? wrapHtml(bodyHtml, accountName ?? 'the team') : bodyHtml;

  const { prisma } = await import('@/lib/prisma');
  const personaIds = Array.from(new Set(recipients.map((recipient) => recipient.personaId).filter((value): value is number => Boolean(value))));
  const personaRows = personaIds.length > 0
    ? await prisma.persona.findMany({
        where: { id: { in: personaIds } },
        select: { id: true, name: true, email: true, account_name: true },
      })
    : [];
  const personaById = new Map(personaRows.map((persona) => [persona.id, persona]));
  const resolvedRecipients = recipients.map((recipient) => {
    if (!recipient.personaId) return recipient;
    const persona = personaById.get(recipient.personaId);
    if (!persona || !persona.email) {
      return { ...recipient, recipientError: 'Recipient record not found' };
    }
    return {
      ...recipient,
      to: persona.email,
      personaName: persona.name,
      accountName: persona.account_name,
    };
  });
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
          endpoint: '/api/email/send-bulk',
          accountName: generatedAccountName ?? accountName ?? null,
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
    accountName: accountName ?? generatedAccountName ?? null,
    recipients: resolvedRecipients.map((recipient) => ({
      to: recipient.to,
      accountName: recipient.accountName ?? accountName ?? generatedAccountName ?? null,
    })),
    cc,
  });
  if (!accountInvariant.ok) {
    await recordSourceBackedMetric({
      metric: 'one_account_invariant_violations',
      endpoint: '/api/email/send-bulk',
      accountName: accountName ?? generatedAccountName ?? null,
      details: accountInvariant.details,
    });
    const block = mixedAccountPayloadSendBlocker(accountInvariant.details);
    return NextResponse.json(serializeSendBlocker(block), { status: block.status });
  }
  const traceLookup = await buildCandidateTraceLookup(prisma, {
    accountNames: accountInvariant.scopedAccountNames,
    emails: [...resolvedRecipients.map((recipient) => recipient.to), ...accountInvariant.normalizedCc],
  });
  const unsubscribedRows = await prisma.unsubscribedEmail.findMany({
    where: { email: { in: [...resolvedRecipients.map((recipient) => recipient.to), ...accountInvariant.normalizedCc] } },
    select: { email: true },
  });
  const unsubscribedSet = new Set(unsubscribedRows.map((row) => row.email));
  const ccEligibility = await Promise.all(
    accountInvariant.normalizedCc.map(async (email) => ({
      email,
      guard: await evaluateRecipientEligibility(prisma, email),
    })),
  );
  const blockedCc = ccEligibility.find((entry) => !entry.guard.ok || unsubscribedSet.has(entry.email));
  if (blockedCc) {
    return NextResponse.json(
      serializeSendBlocker(noSendableRecipientsSendBlocker({
        skipped: [{ to: blockedCc.email, reason: blockedCc.guard.reason ?? 'CC recipient is not sendable.' }],
      })),
      { status: 400 },
    );
  }

  const eligibility = await Promise.all(
    resolvedRecipients.map(async (recipient) => {
      const normalizedTo = recipient.to.trim().toLowerCase();
      if ('recipientError' in recipient && recipient.recipientError) {
        return {
          recipient: { ...recipient, to: normalizedTo },
          guard: { ok: false, reason: recipient.recipientError, domain: getEmailDomain(normalizedTo) },
        };
      }
      if (!recipientEmailSchema.safeParse(normalizedTo).success) {
        return {
          recipient: { ...recipient, to: normalizedTo },
          guard: { ok: false, reason: 'Invalid recipient email address', domain: getEmailDomain(normalizedTo) },
        };
      }
      if (unsubscribedSet.has(normalizedTo)) {
        return {
          recipient: { ...recipient, to: normalizedTo },
          guard: { ok: false, reason: 'Recipient explicitly unsubscribed', domain: getEmailDomain(normalizedTo) },
        };
      }

      return {
        recipient: { ...recipient, to: normalizedTo },
        guard: await evaluateRecipientEligibility(prisma, normalizedTo),
      };
    })
  );

  const eligibleRecipients = eligibility.filter((item) => item.guard.ok).map((item) => item.recipient);
  const skipped = eligibility
    .filter((item) => !item.guard.ok)
    .map((item) => ({ to: item.recipient.to, reason: item.guard.reason ?? 'Ineligible recipient' }));

  if (eligibleRecipients.length === 0) {
    const block = noSendableRecipientsSendBlocker({ skipped });
    return NextResponse.json(serializeSendBlocker(block, { success: false, sent: 0, failed: resolvedRecipients.length, skipped }), { status: block.status });
  }

  const payloads = eligibleRecipients.map((r) => ({
    to: r.to,
    cc: accountInvariant.normalizedCc.filter((email) => email !== r.to),
    subject,
    html,
  }));
  const results = await sendBulk(payloads);
  const ccSanitizationDrops = eligibleRecipients.reduce((sum, recipient) => (
    sum + (accountInvariant.normalizedCc.length - accountInvariant.normalizedCc.filter((email) => email !== recipient.to).length)
  ), 0);
  if (ccSanitizationDrops > 0) {
    await recordSourceBackedMetric({
      metric: 'cc_sanitization_drops',
      endpoint: '/api/email/send-bulk',
      accountName: accountName ?? generatedAccountName ?? accountInvariant.canonicalAccountName ?? null,
      value: ccSanitizationDrops,
      details: { recipientCount: eligibleRecipients.length },
    });
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  // Best-effort DB logging for each send
  try {
    const defaultAccountExists = accountName
      ? await prisma.account.findUnique({
          where: { name: accountName },
          select: { name: true, pipeline_stage: true, outreach_status: true, meeting_status: true },
        })
      : null;
    const accountsContacted = new Set<string>();

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const recipient = eligibleRecipients[i];
      const providerMessageId = r.status === 'fulfilled' ? (r.value as { headers?: Record<string, string> })?.headers?.['x-message-id'] ?? null : null;
      const hubspotResult = r.status === 'fulfilled'
        ? (r.value as { hubspotEngagementId?: string | null; hubspotError?: string | null })
        : null;
      const resolvedAccountName = recipient.accountName ?? accountName ?? '';
      const resolvedAccountExists = !resolvedAccountName
        ? null
        : resolvedAccountName === accountName
          ? defaultAccountExists
          : await prisma.account.findUnique({
              where: { name: resolvedAccountName },
              select: { name: true, pipeline_stage: true, outreach_status: true, meeting_status: true },
            }).catch(() => null);

      const recipientCandidateTrace = resolveCandidateTrace(traceLookup, {
        email: recipient.to,
        accountName: resolvedAccountName || accountInvariant.canonicalAccountName,
      });
      const ccCandidateTraces = accountInvariant.normalizedCc
        .map((email) => ({
          email,
          trace: resolveCandidateTrace(traceLookup, {
            email,
            accountName: resolvedAccountName || accountInvariant.canonicalAccountName,
          }),
        }))
        .filter((entry) => entry.trace)
        .map((entry) => ({
          email: entry.email,
          trace: entry.trace,
        }));

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
              personaId: recipient.personaId ?? null,
              personaName: recipient.personaName ?? null,
              readinessScore: recipient.readinessScore ?? null,
              readinessTier: recipient.readinessTier ?? null,
              stale: recipient.stale ?? null,
              cc: accountInvariant.normalizedCc.filter((email) => email !== recipient.to),
              candidateTrace: recipientCandidateTrace,
              ccCandidateTraces,
            },
          }))
        : undefined;

      await prisma.emailLog.create({
        data: {
          account_name: resolvedAccountName,
          persona_name: recipient.personaName ?? null,
          to_email: recipient.to,
          subject,
          body_html: html,
          status: r.status === 'fulfilled' ? 'sent' : 'failed',
          provider_message_id: providerMessageId,
          hubspot_engagement_id: hubspotResult?.hubspotEngagementId ?? null,
          metadata: logMetadata,
          ...(generatedContentId ? { generated_content_id: generatedContentId } : {}),
        },
      }).catch(() => { /* individual log failure is non-blocking */ });

      // Auto-log activity for each successful send
      if (r.status === 'fulfilled' && resolvedAccountName && resolvedAccountExists) {
        await prisma.activity.create({
          data: {
            account_name: resolvedAccountName,
            persona: recipient.personaName ?? null,
            activity_type: 'Email',
            outcome: `Bulk email sent: "${subject}" to ${recipient.to}`,
            next_step: 'Monitor for open/reply — follow up in 3 days',
            next_step_due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            owner: 'Casey',
            activity_date: new Date(),
          },
        }).catch(() => {});
        accountsContacted.add(resolvedAccountName);
      }
    }

    // Auto-update outreach_status for all accounts that were contacted
    for (const acctName of accountsContacted) {
      const existing = await prisma.account.findUnique({
        where: { name: acctName },
        select: { pipeline_stage: true, outreach_status: true, meeting_status: true },
      }).catch(() => null);
      const nextStage = advancePipelineStage(
        derivePipelineStage(existing ?? {}),
        'contacted',
      );

      await prisma.account.updateMany({
        where: { name: acctName },
        data: {
          outreach_status: 'Contacted',
          pipeline_stage: nextStage,
          current_motion: `Pipeline stage: ${nextStage}`,
        },
      }).catch(() => {});

      await ensureLocalMeetingDealLink(acctName, nextStage).catch(() => {});
      await markAgentActionCacheStale(acctName).catch(() => undefined);
    }

    if (generatedContentId && sent > 0) {
      await prisma.generatedContent.update({
        where: { id: generatedContentId },
        data: { external_send_count: { increment: sent } },
      }).catch(() => {});
    }
  } catch {
    // DB offline — skip logging
  }

  return NextResponse.json({ success: true, sent, failed, total: resolvedRecipients.length, skipped });
}
