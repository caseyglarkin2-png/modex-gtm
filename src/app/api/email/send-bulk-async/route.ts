import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { BulkSendAsyncSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { allocateRecipientsDeterministic } from '@/lib/experiments/split';
import { getRecipientReadinessFloor } from '@/lib/revops/recipient-readiness';
import { resolveContentQaChecklist } from '@/lib/revops/content-qa-checklist';
import { getStrategyPreset, isWithinTimezoneWindow, validateSendStrategy } from '@/lib/revops/send-strategy';
import { enforceSendApprovalGate } from '@/lib/revops/send-approvals';
import { evaluateContentQuality } from '@/lib/content-quality';
import { buildInfographicEvent, parseInfographicMetadata } from '@/lib/revops/infographic-journey';
import { resolveCanonicalSendTargets } from '@/lib/revops/canonical-sync';

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
  if (payload.strategy && !isWithinTimezoneWindow(strategy.timezone_window)) {
    return NextResponse.json({ error: 'Current time is outside configured timezone send window.' }, { status: 409 });
  }
  if (!payload.guardWarningsAcknowledged) {
    return NextResponse.json(
      { error: 'Guard warnings must be acknowledged before async bulk send can start.' },
      { status: 409 },
    );
  }

  const { prisma } = await import('@/lib/prisma');
  const personaIds = Array.from(new Set(
    payload.items.flatMap((item) => item.recipients.map((recipient) => recipient.personaId).filter((value): value is number => Boolean(value))),
  ));
  const canonicalTargets = personaIds.length > 0
    ? await resolveCanonicalSendTargets(personaIds)
    : new Map();
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
      const canonical = recipient.personaId ? canonicalTargets.get(recipient.personaId) : null;
      const canonicalError = recipient.personaId
        ? !persona || !persona.email
          ? 'Recipient record not found.'
          : !canonical || canonical.sendBlocked
            ? canonical?.sendBlockReason ?? 'Recipient missing canonical identity resolution.'
            : persona.email.toLowerCase() !== recipient.to.toLowerCase()
              ? 'Recipient email does not match canonical contact record.'
              : null
        : null;
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
        canonical_error: canonicalError,
        idempotency_seed: `${item.generatedContentId}:${toEmail}:${item.subject}`,
      };
    });
  });

  const readinessViolations: string[] = [];
  const checklistViolations: string[] = [];
  const canonicalViolations = recipientRows.filter((row) => row.canonical_error).map((row) => `${row.account_name}:${row.to_email}`);
  for (const row of recipientRows) {
    const generated = generatedById.get(row.generated_content_id);
    if (!generated) continue;
    const floor = getRecipientReadinessFloor(generated.campaign?.campaign_type);
    if ((row.readiness_score ?? 0) < floor) {
      readinessViolations.push(`${row.account_name}:${row.to_email}`);
    }
  }
  for (const generated of generatedContentRows) {
    const checklist = resolveContentQaChecklist({
      campaignType: generated.campaign?.campaign_type,
      completedItemIds: generated.checklist_state?.completed_item_ids ?? [],
      content: generated.content,
      accountName: generated.account_name,
    });
    if (!checklist.complete) checklistViolations.push(String(generated.id));
  }
  if (readinessViolations.length > 0) {
    return NextResponse.json(
      { error: `Readiness floor policy violated for ${readinessViolations.length} recipient(s).` },
      { status: 409 },
    );
  }
  if (canonicalViolations.length > 0) {
    return NextResponse.json(
      { error: `Canonical identity policy violated for ${canonicalViolations.length} recipient(s).` },
      { status: 409 },
    );
  }
  if (checklistViolations.length > 0) {
    return NextResponse.json(
      { error: `Checklist policy incomplete for generated content: ${checklistViolations.join(', ')}` },
      { status: 409 },
    );
  }

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
  if (uniqueRecipientRows.length > strategy.daily_cap) {
    return NextResponse.json(
      { error: `Daily cap exceeded (${uniqueRecipientRows.length}/${strategy.daily_cap}).` },
      { status: 409 },
    );
  }
  const domainCounts = uniqueRecipientRows.reduce<Record<string, number>>((acc, row) => {
    const domain = row.to_email.split('@')[1] ?? 'unknown';
    acc[domain] = (acc[domain] ?? 0) + 1;
    return acc;
  }, {});
  const domainViolations = Object.entries(domainCounts).filter(([, count]) => count > strategy.domain_cap);
  if (domainViolations.length > 0) {
    return NextResponse.json(
      { error: `Domain cap exceeded for ${domainViolations.map(([domain]) => domain).join(', ')}.` },
      { status: 409 },
    );
  }
  const [knownDomainRows, recentOutcomes] = await Promise.all([
    prisma.emailLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 600,
      select: { to_email: true },
    }),
    prisma.sendJobRecipient.findMany({
      orderBy: { created_at: 'desc' },
      take: 900,
      select: { status: true },
    }),
  ]);
  const knownDomains = Array.from(new Set(
    knownDomainRows
      .map((row) => row.to_email.split('@')[1]?.toLowerCase())
      .filter((value): value is string => Boolean(value)),
  ));
  const qualityScores = payload.items.map((item) => evaluateContentQuality(item.bodyHtml, item.accountName).score);
  const avgQualityScore = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
    : null;
  const bounceRate = recentOutcomes.length > 0
    ? recentOutcomes.filter((row) => row.status === 'failed').length / recentOutcomes.length
    : 0;
  const approvalGate = await enforceSendApprovalGate(prisma, {
    channel: 'bulk-async',
    accountName: payload.items[0]?.accountName ?? null,
    recipientCount: uniqueRecipientRows.length,
    qualityScore: avgQualityScore,
    domains: Object.keys(domainCounts),
    knownDomains,
    recentBounceRate: bounceRate,
    requestedBy: payload.requestedBy ?? 'Casey',
  });
  if (!approvalGate.allowed) {
    return NextResponse.json({
      error: 'Approval required before async send can proceed.',
      approval: approvalGate.approval,
      policy: approvalGate.policy,
    }, { status: 409 });
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
