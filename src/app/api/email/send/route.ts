import { NextRequest, NextResponse } from 'next/server';
import { SendEmailSchema } from '@/lib/validations';
import { SOURCE_APPROVAL_GATE_ENABLED } from '@/lib/feature-flags';
import { requiresApprovalForSend } from '@/lib/revops/generated-content-approval';
import { recordSourceBackedMetric } from '@/lib/source-backed/metrics';
import { rateLimit } from '@/lib/rate-limit';
import { performSend } from '@/lib/email/perform-send';
import {
  approvalRequiredSendBlocker,
  generatedContentMissingSendBlocker,
  invalidJsonSendBlocker,
  invalidPayloadSendBlocker,
  noEmailSendBlocker,
  providerConfigSendBlocker,
  recipientNotFoundSendBlocker,
  runtimeSendBlocker,
  serializeSendBlocker,
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

  const { to, cc, subject, bodyHtml, imageUrl, accountName, personaName, personaId, generatedContentId, workflowMetadata } = parsed.data;

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

    const invariantAccountName = resolvedRecipient.accountName ?? generatedAccountName ?? accountName ?? null;

    const r = await performSend(prisma, {
      to: resolvedRecipient.to,
      cc,
      subject,
      bodyHtml,
      imageUrl,
      accountName: resolvedRecipient.accountName,
      invariantAccountName,
      personaName: resolvedRecipient.personaName,
      personaId: personaId ?? undefined,
      generatedContentId,
      workflowMetadata,
    });
    if (!r.ok) {
      return NextResponse.json(serializeSendBlocker(r.block, { remaining }), { status: r.block.status });
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${resolvedRecipient.to}`,
      provider: r.provider ?? 'unknown',
      hubspotEngagementId: r.hubspotEngagementId ?? null,
      hubspotError: r.hubspotError ?? null,
      remaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email send failed';
    const block = runtimeSendBlocker(message);
    return NextResponse.json(serializeSendBlocker(block), { status: block.status });
  }
}
