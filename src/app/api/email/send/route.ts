import { NextRequest, NextResponse } from 'next/server';
import { SendEmailSchema } from '@/lib/validations';
import { sendEmail } from '@/lib/email/client';
import { mirrorEmailToGmailSent } from '@/lib/email/gmail-mirror';
import { wrapHtml } from '@/lib/email/templates';
import { rateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`email:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded. Max 10 emails per minute.' }, { status: 429 });
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

  const { to, cc, subject, bodyHtml, accountName, personaName } = parsed.data;

  // Wrap plain text or already-composed HTML into branded template
  const isPlainText = !bodyHtml.trim().startsWith('<');
  const html = isPlainText ? wrapHtml(bodyHtml, accountName ?? 'the team') : bodyHtml;

  try {
    const response = await sendEmail({ to, cc, subject, html });
    const session = await auth();
    const sessionLike = session as unknown as { user?: { email?: string }; googleAccessToken?: string };

    // Best-effort Gmail Sent mirror (non-blocking)
    mirrorEmailToGmailSent({
      to,
      cc,
      subject,
      html,
      accessToken: sessionLike.googleAccessToken,
      gmailUserEmail: sessionLike.user?.email,
    }).catch((err) => {
      console.warn('Gmail sent mirror failed:', err);
    });

    // Best-effort DB log — skip if no DB available
    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.emailLog.create({
        data: {
          account_name: accountName ?? '',
          persona_name: personaName ?? null,
          to_email: to,
          subject,
          body_html: html,
          status: 'sent',
          provider_message_id: (response.headers?.['x-message-id'] as string) ?? null,
        },
      });
    } catch {
      // DB offline — log skipped
    }

    return NextResponse.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email send failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
