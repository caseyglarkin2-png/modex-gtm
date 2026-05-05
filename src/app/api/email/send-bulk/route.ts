import { NextRequest, NextResponse } from 'next/server';
import { BulkSendEmailSchema } from '@/lib/validations';
import { sendBulk } from '@/lib/email/client';
import { evaluateRecipientEligibility, getEmailDomain } from '@/lib/email/recipient-guard';
import { wrapHtml } from '@/lib/email/templates';
import { rateLimit } from '@/lib/rate-limit';
import { ensureLocalMeetingDealLink } from '@/lib/hubspot/deals';
import { advancePipelineStage, derivePipelineStage } from '@/lib/pipeline';
import { markAgentActionCacheStale } from '@/lib/agent-actions/cache';
import {
  generatedContentMissingSendBlocker,
  invalidJsonSendBlocker,
  invalidPayloadSendBlocker,
  noSendableRecipientsSendBlocker,
  serializeSendBlocker,
} from '@/lib/email/send-blockers';

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

  const { recipients, subject, bodyHtml, accountName, generatedContentId } = parsed.data;

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
  }
  const unsubscribedRows = await prisma.unsubscribedEmail.findMany({
    where: { email: { in: resolvedRecipients.map((recipient) => recipient.to) } },
    select: { email: true },
  });
  const unsubscribedSet = new Set(unsubscribedRows.map((row) => row.email));

  const eligibility = await Promise.all(
    resolvedRecipients.map(async (recipient) => {
      if ('recipientError' in recipient && recipient.recipientError) {
        return {
          recipient,
          guard: { ok: false, reason: recipient.recipientError, domain: getEmailDomain(recipient.to) },
        };
      }
      if (unsubscribedSet.has(recipient.to)) {
        return {
          recipient,
          guard: { ok: false, reason: 'Recipient explicitly unsubscribed', domain: getEmailDomain(recipient.to) },
        };
      }

      return {
        recipient,
        guard: await evaluateRecipientEligibility(prisma, recipient.to),
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

  const payloads = eligibleRecipients.map((r) => ({ to: r.to, subject, html }));
  const results = await sendBulk(payloads);

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
