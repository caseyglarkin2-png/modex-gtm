import { NextRequest, NextResponse } from 'next/server';
import { SendEmailSchema } from '@/lib/validations';
import { sendEmail } from '@/lib/email/client';
import { evaluateRecipientEligibility } from '@/lib/email/recipient-guard';
import { wrapHtml } from '@/lib/email/templates';
import { sanitizeEmailHtml } from '@/lib/email/sanitize';
import { rateLimit } from '@/lib/rate-limit';
import { ensureLocalMeetingDealLink } from '@/lib/hubspot/deals';
import { advancePipelineStage, derivePipelineStage } from '@/lib/pipeline';
import { resolveContentQaChecklist } from '@/lib/revops/content-qa-checklist';
import { enforceSendApprovalGate } from '@/lib/revops/send-approvals';
import { resolveCanonicalSendTargets } from '@/lib/revops/canonical-sync';

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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SendEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.UNSUBSCRIBE_SECRET) {
    return NextResponse.json({
      error: 'UNSUBSCRIBE_SECRET is not set',
      message: 'Set UNSUBSCRIBE_SECRET in Vercel env (Prod/Preview/Dev) before sending.',
    }, { status: 500 });
  }

  const { to, cc, subject, bodyHtml, accountName, personaName, personaId, generatedContentId } = parsed.data;

  if (!to || to.trim() === '') {
    return NextResponse.json({ error: 'NO_EMAIL', message: 'Recipient has no email address. Add one to the persona first.' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    let resolvedRecipient = {
      to,
      accountName: accountName ?? null,
      personaName: personaName ?? null,
    };

    if (personaId) {
      const [persona, canonicalTargets] = await Promise.all([
        prisma.persona.findUnique({
          where: { id: personaId },
          select: {
            id: true,
            name: true,
            email: true,
            email_valid: true,
            do_not_contact: true,
            account_name: true,
          },
        }),
        resolveCanonicalSendTargets([personaId]),
      ]);
      if (!persona || !persona.email) {
        return NextResponse.json({ error: 'Recipient record not found.' }, { status: 404 });
      }
      const canonical = canonicalTargets.get(personaId);
      if (!canonical || canonical.sendBlocked) {
        return NextResponse.json(
          { error: canonical?.sendBlockReason ?? 'Recipient is missing canonical identity resolution.' },
          { status: 409 },
        );
      }
      if (persona.email.toLowerCase() !== to.toLowerCase()) {
        return NextResponse.json({ error: 'Recipient email does not match canonical contact record.' }, { status: 409 });
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

    // Check if recipient has unsubscribed
    const unsubscribed = await prisma.unsubscribedEmail.findUnique({
      where: { email: resolvedRecipient.to },
    });

    if (unsubscribed) {
      if (allowBypass(resolvedRecipient.to)) {
        await prisma.unsubscribedEmail.delete({ where: { email: resolvedRecipient.to } }).catch(() => {});
      } else {
        // Return a structured error with remaining rate-limit for UI clarity
        return NextResponse.json({
          error: 'UNSUBSCRIBED',
          message: `Cannot send to ${resolvedRecipient.to} - recipient has unsubscribed.`,
          remaining,
        }, { status: 400 });
      }
    }

    const guard = await evaluateRecipientEligibility(prisma, resolvedRecipient.to);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: 400 });
    }
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
        return NextResponse.json({ error: 'Generated content not found.' }, { status: 404 });
      }
      const checklist = resolveContentQaChecklist({
        campaignType: generated.campaign?.campaign_type,
        completedItemIds: generated.checklist_state?.completed_item_ids ?? [],
        content: generated.content,
        accountName: generated.account_name,
      });
      if (!checklist.complete) {
        return NextResponse.json(
          { error: `Content QA checklist incomplete for generated content ${generatedContentId}.` },
          { status: 409 },
        );
      }
    }
    const domain = resolvedRecipient.to.split('@')[1] ?? 'unknown';
    const [knownDomainRows, recentOutcomes] = await Promise.all([
      prisma.emailLog.findMany({
        where: { to_email: { contains: '@' } },
        orderBy: { created_at: 'desc' },
        take: 250,
        select: { to_email: true },
      }),
      prisma.sendJobRecipient.findMany({
        orderBy: { created_at: 'desc' },
        take: 300,
        select: { status: true },
      }),
    ]);
    const knownDomains = Array.from(new Set(
      knownDomainRows
        .map((row) => row.to_email.split('@')[1]?.toLowerCase())
        .filter((value): value is string => Boolean(value)),
    ));
    const bounceRate = recentOutcomes.length > 0
      ? recentOutcomes.filter((row) => row.status === 'failed').length / recentOutcomes.length
      : 0;
    const approvalGate = await enforceSendApprovalGate(prisma, {
      channel: 'single',
      accountName: accountName ?? null,
      recipientCount: 1,
      domains: [domain],
      knownDomains,
      recentBounceRate: bounceRate,
      requestedBy: 'Casey',
    });
    if (!approvalGate.allowed) {
      return NextResponse.json({
        error: 'Approval required before send can proceed.',
        approval: approvalGate.approval,
        policy: approvalGate.policy,
      }, { status: 409 });
    }

    // Lightweight sanitization to keep email-safe HTML without pulling jsdom into the runtime.
    const sanitizedBody = sanitizeEmailHtml(bodyHtml);

    // Wrap plain text or already-composed HTML into branded template
    const isPlainText = !sanitizedBody.trim().startsWith('<');
    const html = isPlainText ? wrapHtml(sanitizedBody, resolvedRecipient.accountName ?? accountName ?? 'the team', resolvedRecipient.to) : sanitizedBody;

    const response = await sendEmail({ to: resolvedRecipient.to, cc, subject, html });

    // Best-effort DB log — skip if no DB available
    try {
      const accountExists = resolvedRecipient.accountName
        ? await prisma.account.findUnique({
            where: { name: resolvedRecipient.accountName },
            select: { name: true, pipeline_stage: true, outreach_status: true, meeting_status: true },
          })
        : null;

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
