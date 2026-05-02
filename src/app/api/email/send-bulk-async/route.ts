import { NextRequest, NextResponse } from 'next/server';
import { BulkSendAsyncSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`bulk-email-async:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded. Max 10 requests per minute.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BulkSendAsyncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  if (!payload.guardWarningsAcknowledged) {
    return NextResponse.json(
      { error: 'Guard warnings must be acknowledged before async bulk send can start.' },
      { status: 409 },
    );
  }

  const { prisma } = await import('@/lib/prisma');

  const generatedContentIds = Array.from(new Set(payload.items.map((item) => item.generatedContentId)));
  const generatedContentRows = await prisma.generatedContent.findMany({
    where: { id: { in: generatedContentIds } },
    select: { id: true, campaign_id: true, account_name: true },
  });
  const generatedById = new Map(generatedContentRows.map((row) => [row.id, row]));
  const missingGeneratedIds = generatedContentIds.filter((id) => !generatedById.has(id));

  if (missingGeneratedIds.length > 0) {
    return NextResponse.json(
      { error: `Missing generated content rows: ${missingGeneratedIds.join(', ')}` },
      { status: 400 },
    );
  }

  const recipientRows = payload.items.flatMap((item) => {
    const generated = generatedById.get(item.generatedContentId);
    return item.recipients.map((recipient) => {
      const toEmail = recipient.to.toLowerCase();
      const accountName = recipient.accountName ?? item.accountName ?? generated?.account_name ?? '';
      return {
        generated_content_id: item.generatedContentId,
        campaign_id: generated?.campaign_id ?? null,
        account_name: accountName,
        persona_name: recipient.personaName ?? null,
        to_email: toEmail,
        subject: item.subject,
        body_html: item.bodyHtml,
        idempotency_seed: `${item.generatedContentId}:${toEmail}:${item.subject}`,
      };
    });
  });

  const uniqueRecipientRows = Array.from(new Map(
    recipientRows.map((row) => [`${row.generated_content_id}:${row.to_email}`, row]),
  ).values());

  if (uniqueRecipientRows.length === 0) {
    return NextResponse.json({ error: 'No recipients to enqueue' }, { status: 400 });
  }

  const sendJob = await prisma.sendJob.create({
    data: {
      status: 'pending',
      requested_by: payload.requestedBy ?? null,
      total_recipients: uniqueRecipientRows.length,
      recipients: {
        createMany: {
          data: uniqueRecipientRows.map((row) => ({
            generated_content_id: row.generated_content_id,
            campaign_id: row.campaign_id,
            account_name: row.account_name,
            persona_name: row.persona_name,
            to_email: row.to_email,
            subject: row.subject,
            body_html: row.body_html,
            status: 'pending',
            idempotency_key: `${Date.now()}:${row.idempotency_seed}`,
          })),
        },
      },
    },
    select: {
      id: true,
      status: true,
      total_recipients: true,
      created_at: true,
    },
  });

  return NextResponse.json({
    success: true,
    job: sendJob,
    generatedContentIds,
  });
}
