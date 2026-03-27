import { NextRequest, NextResponse } from 'next/server';
import { BulkSendEmailSchema } from '@/lib/validations';
import { sendBulk } from '@/lib/email/client';
import { wrapHtml } from '@/lib/email/templates';
import { rateLimit } from '@/lib/rate-limit';

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

  const payloads = recipients.map((r) => ({ to: r.to, subject, html }));
  const results = await sendBulk(payloads);

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  // Best-effort DB logging for each send
  try {
    const { prisma } = await import('@/lib/prisma');
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const recipient = recipients[i];
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
    }
  } catch {
    // DB offline — skip logging
  }

  return NextResponse.json({ success: true, sent, failed, total: recipients.length });
}
