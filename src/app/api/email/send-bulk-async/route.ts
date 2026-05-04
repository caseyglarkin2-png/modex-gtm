import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { BulkSendAsyncSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { allocateRecipientsDeterministic } from '@/lib/experiments/split';
import { getStrategyPreset, validateSendStrategy } from '@/lib/revops/send-strategy';
import { buildInfographicEvent, parseInfographicMetadata } from '@/lib/revops/infographic-journey';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function applyVariantBody(baseHtml: string, opening?: string, cta?: string): string {
  const openingHtml = opening?.trim() ? `<p>${escapeHtml(opening.trim())}</p>` : '';
  const ctaHtml = cta?.trim() ? `<p><strong>${escapeHtml(cta.trim())}</strong></p>` : '';
  if (!openingHtml && !ctaHtml) return baseHtml;
  return `${openingHtml}${baseHtml}${ctaHtml}`;
}

function resolveVariantSubject(subject: string, accountName: string): string {
  return subject.replaceAll('{{account}}', accountName);
}

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
  const strategy = payload.strategy ?? getStrategyPreset('balanced');
  const strategyValidation = validateSendStrategy(strategy);
  if (!strategyValidation.ok) {
    return NextResponse.json({ error: strategyValidation.errors.join(' ') }, { status: 400 });
  }

  const { prisma } = await import('@/lib/prisma');
  const personaIds = Array.from(new Set(
    payload.items.flatMap((item) => item.recipients.map((recipient) => recipient.personaId).filter((value): value is number => Boolean(value))),
  ));
  const personaRows = personaIds.length > 0
    ? await prisma.persona.findMany({
        where: { id: { in: personaIds } },
        select: { id: true, name: true, email: true, account_name: true },
      })
    : [];
  const personaById = new Map(personaRows.map((persona) => [persona.id, persona]));

  const generatedContentIds = Array.from(new Set(payload.items.map((item) => item.generatedContentId)));
  const generatedContentRows = await prisma.generatedContent.findMany({
    where: { id: { in: generatedContentIds } },
    select: {
      id: true,
      campaign_id: true,
      account_name: true,
      content: true,
      version_metadata: true,
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
      const persona = recipient.personaId ? personaById.get(recipient.personaId) : null;
      const toEmail = (persona?.email ?? recipient.to).toLowerCase();
      const accountName = persona?.account_name ?? recipient.accountName ?? item.accountName ?? generated?.account_name ?? '';
      return {
        generated_content_id: item.generatedContentId,
        campaign_id: generated?.campaign_id ?? null,
        account_name: accountName,
        bundle_id: item.bundleId ?? null,
        sequence_position: item.sequencePosition ?? null,
        persona_name: persona?.name ?? recipient.personaName ?? null,
        to_email: toEmail,
        subject: item.subject,
        body_html: item.bodyHtml,
        readiness_score: recipient.readinessScore ?? null,
        readiness_tier: recipient.readinessTier ?? null,
        stale: recipient.stale ?? null,
        canonical_error: null,
        idempotency_seed: `${item.generatedContentId}:${toEmail}:${item.subject}`,
      };
    });
  });

  const uniqueRecipientRows = Array.from(new Map(
    recipientRows.map((row) => [`${row.generated_content_id}:${row.to_email}`, row]),
  ).values())
    .sort((left, right) => {
      const leftSeq = left.sequence_position ?? 999;
      const rightSeq = right.sequence_position ?? 999;
      if (leftSeq !== rightSeq) return leftSeq - rightSeq;
      return left.account_name.localeCompare(right.account_name);
    });

  if (uniqueRecipientRows.length === 0) {
    return NextResponse.json({ error: 'No recipients to enqueue' }, { status: 400 });
  }

  let experimentRow: {
    id: string;
    primary_metric: string;
    variants: Array<{ id: string; variant_key: string; subject: string; opening: string | null; cta: string | null }>;
  } | null = null;

  if (payload.experiment) {
    const variantsWithControl = payload.experiment.variants.filter((variant) => variant.isControl);
    if (variantsWithControl.length !== 1) {
      return NextResponse.json({ error: 'Experiment requires exactly one control variant.' }, { status: 400 });
    }

    experimentRow = await prisma.experiment.create({
      data: {
        name: payload.experiment.name,
        primary_metric: payload.experiment.primaryMetric,
        split: payload.experiment.split,
        status: 'active',
        variants: {
          create: payload.experiment.variants.map((variant) => ({
            variant_key: variant.variantKey,
            subject: variant.subject,
            opening: variant.opening?.trim() ? variant.opening : null,
            cta: variant.cta?.trim() ? variant.cta : null,
            split_percent: variant.split,
            is_control: variant.isControl,
          })),
        },
      },
      select: {
        id: true,
        primary_metric: true,
        variants: {
          select: {
            id: true,
            variant_key: true,
            subject: true,
            opening: true,
            cta: true,
          },
        },
      },
    });
  }

  const recipientVariantByEmail = new Map<string, { variantId: string; variantKey: string }>();
  if (experimentRow) {
    const uniqueEmails = Array.from(new Set(uniqueRecipientRows.map((row) => row.to_email)));
    const assignments = allocateRecipientsDeterministic(
      uniqueEmails,
      experimentRow.variants.map((variant) => ({
        variantId: variant.id,
        variantKey: variant.variant_key,
        split: Number(payload.experiment?.split?.[variant.variant_key] ?? 0),
      })),
      experimentRow.id,
    );
    assignments.forEach((assignment) => {
      recipientVariantByEmail.set(assignment.recipientEmail, {
        variantId: assignment.variantId,
        variantKey: assignment.variantKey,
      });
    });
  }
  const variantById = new Map((experimentRow?.variants ?? []).map((variant) => [variant.id, variant]));

  const sendJob = await prisma.sendJob.create({
    data: {
      status: 'pending',
      requested_by: payload.requestedBy ?? null,
      experiment_id: experimentRow?.id ?? null,
      primary_metric: experimentRow?.primary_metric ?? null,
      send_strategy: strategy,
      total_recipients: uniqueRecipientRows.length,
      recipients: {
        createMany: {
          data: uniqueRecipientRows.map((row) => ({
            ...(() => {
              const assignment = recipientVariantByEmail.get(row.to_email);
              const variant = assignment ? variantById.get(assignment.variantId) : null;
              const variantSubject = variant?.subject ? resolveVariantSubject(variant.subject, row.account_name) : null;
              const variantBody = variant ? applyVariantBody(row.body_html, variant.opening ?? undefined, variant.cta ?? undefined) : row.body_html;
              return {
                experiment_id: experimentRow?.id ?? null,
                variant_id: assignment?.variantId ?? null,
                variant_key: assignment?.variantKey ?? null,
                subject: variantSubject ?? row.subject,
                body_html: variantBody,
              };
            })(),
            generated_content_id: row.generated_content_id,
            campaign_id: row.campaign_id,
            account_name: row.account_name,
            persona_name: row.persona_name,
            to_email: row.to_email,
            status: 'pending',
            idempotency_key: `${randomUUID()}:${row.idempotency_seed}`,
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

  const bundleGroups = uniqueRecipientRows.reduce<Record<string, {
    accountName: string;
    campaignId: number | null;
    generatedContentId: number;
    sequencePosition: number | null;
    recipientCount: number;
  }>>((acc, row) => {
    const key = row.bundle_id ?? `single_${row.generated_content_id}`;
    if (!acc[key]) {
      acc[key] = {
        accountName: row.account_name,
        campaignId: row.campaign_id ?? null,
        generatedContentId: row.generated_content_id,
        sequencePosition: row.sequence_position ?? null,
        recipientCount: 0,
      };
    }
    acc[key].recipientCount += 1;
    return acc;
  }, {});

  await Promise.all(
    Object.entries(bundleGroups).map(async ([bundleId, group]) => {
      const generated = generatedById.get(group.generatedContentId);
      const metadata = parseInfographicMetadata(generated?.version_metadata);
      await prisma.activity.create({
        data: {
          account_name: group.accountName,
          campaign_id: group.campaignId,
          activity_type: 'Infographic Bundle',
          owner: payload.requestedBy ?? 'Casey',
          outcome: `Bundle sent (${bundleId})`,
          notes: JSON.stringify({
            ...buildInfographicEvent('bundle_sent', {
              accountName: group.accountName,
              campaignId: group.campaignId,
              infographic_type: metadata.infographicType,
              stage_intent: metadata.stageIntent,
              bundle_id: bundleId.startsWith('single_') ? null : bundleId,
              sequence_position: group.sequencePosition,
            }),
            send_job_id: sendJob.id,
            recipient_count: group.recipientCount,
          }),
          activity_date: new Date(),
        },
      }).catch(() => undefined);
    }),
  );

  return NextResponse.json({
    success: true,
    job: sendJob,
    generatedContentIds,
  });
}
