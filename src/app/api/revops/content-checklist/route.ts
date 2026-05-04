import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  computeChecklistCompleteness,
  getChecklistTemplate,
  type ChecklistItemId,
} from '@/lib/revops/content-qa-checklist';

const ChecklistUpdateSchema = z.object({
  generatedContentId: z.number().int().positive(),
  completedItemIds: z.array(z.enum([
    'clear_value_prop',
    'account_specific_proof',
    'cta_specific',
    'compliance_checked',
    'deliverability_checked',
  ])).default([]),
});

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ChecklistUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const generated = await prisma.generatedContent.findUnique({
    where: { id: payload.generatedContentId },
    select: {
      id: true,
      campaign: {
        select: {
          campaign_type: true,
        },
      },
    },
  });
  if (!generated) {
    return NextResponse.json({ error: 'Generated content not found' }, { status: 404 });
  }

  const campaignType = generated.campaign?.campaign_type ?? 'default';
  const template = getChecklistTemplate(campaignType);
  const completeness = computeChecklistCompleteness(template, payload.completedItemIds as ChecklistItemId[]);

  const updated = await prisma.contentChecklistState.upsert({
    where: { generated_content_id: payload.generatedContentId },
    update: {
      campaign_type: campaignType,
      completed_item_ids: payload.completedItemIds,
    },
    create: {
      generated_content_id: payload.generatedContentId,
      campaign_type: campaignType,
      completed_item_ids: payload.completedItemIds,
    },
    select: {
      id: true,
      generated_content_id: true,
      completed_item_ids: true,
      campaign_type: true,
      updated_at: true,
    },
  });

  return NextResponse.json({
    success: true,
    checklist: updated,
    completeness,
  });
}
