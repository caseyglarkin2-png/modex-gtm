import { NextRequest, NextResponse } from 'next/server';
import { SendEmailSchema } from '@/lib/validations';
import { sendEmail } from '@/lib/email/client';
import { evaluateRecipientEligibility } from '@/lib/email/recipient-guard';
import { wrapHtml } from '@/lib/email/templates';
import { sanitizeEmailHtml } from '@/lib/email/sanitize';
import { rateLimit } from '@/lib/rate-limit';
import { ensureLocalMeetingDealLink } from '@/lib/hubspot/deals';
import { advancePipelineStage, derivePipelineStage } from '@/lib/pipeline';

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

  const { to, cc, subject, bodyHtml, accountName, personaName, generatedContentId } = parsed.data;

  if (!to || to.trim() === '') {
    return NextResponse.json({ error: 'NO_EMAIL', message: 'Recipient has no email address. Add one to the persona first.' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    // Check if recipient has unsubscribed
    const unsubscribed = await prisma.unsubscribedEmail.findUnique({
      where: { email: to },
    });

    if (unsubscribed) {
      return NextResponse.json({
        error: 'UNSUBSCRIBED',
        message: `Cannot send to ${to} - recipient has unsubscribed.`,
      }, { status: 400 });
    }

    const guard = await evaluateRecipientEligibility(prisma, to);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: 400 });
    }

    // Lightweight sanitization to keep email-safe HTML without pulling jsdom into the runtime.
    const sanitizedBody = sanitizeEmailHtml(bodyHtml);

    // Wrap plain text or already-composed HTML into branded template
    const isPlainText = !sanitizedBody.trim().startsWith('<');
    const html = isPlainText ? wrapHtml(sanitizedBody, accountName ?? 'the team', to) : sanitizedBody;

    const response = await sendEmail({ to, cc, subject, html });

    // Best-effort DB log — skip if no DB available
    try {
      const accountExists = accountName
        ? await prisma.account.findUnique({
            where: { name: accountName },
            select: { name: true, pipeline_stage: true, outreach_status: true, meeting_status: true },
          })
        : null;

      await prisma.emailLog.create({
        data: {
          account_name: accountName ?? '',
          persona_name: personaName ?? null,
          to_email: to,
          subject,
          body_html: html,
          status: 'sent',
          provider_message_id: (response.headers?.['x-message-id'] as string) ?? null,
          ...(generatedContentId ? { generated_content_id: generatedContentId } : {}),
        },
      });

      // Auto-update outreach_status to "Contacted" if currently "Not started"
      if (accountName && accountExists) {
        const nextStage = advancePipelineStage(
          derivePipelineStage(accountExists),
          'contacted',
        );

        await prisma.account.updateMany({
          where: { name: accountName },
          data: {
            outreach_status: 'Contacted',
            pipeline_stage: nextStage,
            current_motion: `Pipeline stage: ${nextStage}`,
          },
        }).catch(() => {});

        await ensureLocalMeetingDealLink(accountName, nextStage).catch(() => {});
      }

      // Auto-log activity for the send
      if (accountName && accountExists) {
        await prisma.activity.create({
          data: {
            account_name: accountName,
            persona: personaName ?? null,
            activity_type: 'Email',
            outcome: `Email sent: "${subject}" to ${to}`,
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

    return NextResponse.json({ success: true, message: `Email sent to ${to}`, provider: response.provider ?? 'unknown', remaining });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email send failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
