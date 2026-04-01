import { NextRequest, NextResponse } from 'next/server';
import { BulkSendEmailSchema } from '@/lib/validations';
import { sendBulk } from '@/lib/email/client';
import { mirrorEmailToGmailSent } from '@/lib/email/gmail-mirror';
import { evaluateRecipientEligibility } from '@/lib/email/recipient-guard';
import { wrapHtml } from '@/lib/email/templates';
import { rateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';

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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BulkSendEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { recipients, subject, bodyHtml, accountName } = parsed.data;

  const isPlainText = !bodyHtml.trim().startsWith('<');
  const html = isPlainText ? wrapHtml(bodyHtml, accountName ?? 'the team') : bodyHtml;

  const { prisma } = await import('@/lib/prisma');
  const eligibility = await Promise.all(
    recipients.map(async (recipient) => ({
      recipient,
      guard: await evaluateRecipientEligibility(prisma, recipient.to),
    }))
  );

  const eligibleRecipients = eligibility.filter(item => item.guard.ok).map(item => item.recipient);
  const skipped = eligibility
    .filter(item => !item.guard.ok)
    .map(item => ({ to: item.recipient.to, reason: item.guard.reason ?? 'Ineligible recipient' }));

  if (eligibleRecipients.length === 0) {
    return NextResponse.json({ success: false, sent: 0, failed: recipients.length, skipped }, { status: 400 });
  }

  const payloads = eligibleRecipients.map((r) => ({ to: r.to, subject, html }));
  const results = await sendBulk(payloads);
  const session = await auth();
  const sessionLike = (session ?? {}) as { user?: { email?: string }; googleAccessToken?: string };

  // Gmail send auto-mirrors to Sent folder — only mirror for SendGrid/Resend fallback sends
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status !== 'fulfilled') continue;
    const resultValue = result.value as { provider?: string };
    if (resultValue.provider === 'gmail') continue; // already in Sent
    const recipient = eligibleRecipients[i];
    mirrorEmailToGmailSent({
      to: recipient.to,
      subject,
      html,
      accessToken: sessionLike.googleAccessToken,
      gmailUserEmail: sessionLike.user?.email,
    }).catch((err) => {
      console.warn('Gmail sent mirror failed for bulk recipient:', recipient.to, err);
    });
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  // Best-effort DB logging for each send
  try {
    const accountExists = accountName
      ? await prisma.account.findUnique({ where: { name: accountName }, select: { name: true } })
      : null;
    const accountsContacted = new Set<string>();

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const recipient = eligibleRecipients[i];
      const providerMessageId = r.status === 'fulfilled' ? (r.value as { headers?: Record<string, string> })?.headers?.['x-message-id'] ?? null : null;
      await prisma.emailLog.create({
        data: {
          account_name: accountName ?? '',
          persona_name: recipient.personaName ?? null,
          to_email: recipient.to,
          subject,
          body_html: html,
          status: r.status === 'fulfilled' ? 'sent' : 'failed',
          provider_message_id: providerMessageId,
        },
      }).catch(() => { /* individual log failure is non-blocking */ });

      // Auto-log activity for each successful send
      if (r.status === 'fulfilled' && accountName && accountExists) {
        await prisma.activity.create({
          data: {
            account_name: accountName,
            persona: recipient.personaName ?? null,
            activity_type: 'Email',
            outcome: `Bulk email sent: "${subject}" to ${recipient.to}`,
            next_step: 'Monitor for open/reply — follow up in 3 days',
            next_step_due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            owner: 'Casey',
            activity_date: new Date(),
          },
        }).catch(() => {});
        if (accountName) accountsContacted.add(accountName);
      }
    }

    // Auto-update outreach_status for all accounts that were contacted
    for (const acctName of accountsContacted) {
      await prisma.account.updateMany({
        where: { name: acctName, outreach_status: 'Not started' },
        data: { outreach_status: 'Contacted' },
      }).catch(() => {});
    }
  } catch {
    // DB offline — skip logging
  }

  return NextResponse.json({ success: true, sent, failed, total: recipients.length, skipped });
}
