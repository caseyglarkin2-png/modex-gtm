import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/client';
import { loadThread } from '@/lib/inbox';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  body: z.string().trim().min(1, 'Reply body is required'),
});

/**
 * Sends a reply within an existing conversation. Threads the message into
 * the same Gmail thread (threadId), sets In-Reply-To/References from the
 * last inbound message, and logs the send so it appears in the thread.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: threadId } = await params;

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Reply body is required' }, { status: 400 });
  }

  const thread = await loadThread(threadId);
  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }
  if (!thread.personaEmail) {
    return NextResponse.json({ error: 'Thread has no recipient address' }, { status: 422 });
  }

  const subject = thread.subject
    ? /^re:/i.test(thread.subject)
      ? thread.subject
      : `Re: ${thread.subject}`
    : 'Re: your note';

  const html = parsed.body
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const headers: Record<string, string> = {};
  if (thread.lastInboundRfcId) {
    headers['In-Reply-To'] = thread.lastInboundRfcId;
    headers['References'] = thread.lastInboundRfcId;
  }

  try {
    const result = await sendEmail({
      to: thread.personaEmail,
      subject,
      html,
      text: parsed.body,
      threadId,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    await prisma.emailLog.create({
      data: {
        account_name: thread.accountName ?? '',
        to_email: thread.personaEmail,
        subject,
        body_html: html,
        status: 'sent',
        provider_message_id: result.headers['x-message-id'] || null,
        thread_id: result.threadId ?? threadId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Send failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
