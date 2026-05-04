import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  buildBundleStageSequence,
  buildInfographicEvent,
  INFOGRAPHIC_TYPES,
  JOURNEY_STAGE_INTENTS,
  mapStageSequenceToAssets,
  parseInfographicMetadata,
  type BundlePresetPathId,
} from '@/lib/revops/infographic-journey';

const BundleRequestSchema = z.object({
  accountName: z.string().min(1),
  campaignId: z.number().int().positive().optional().nullable(),
  personaName: z.string().optional().nullable(),
  preset: z.enum(['cold_to_meeting', 'meeting_to_proposal', 'proposal_to_close', 'custom']).default('cold_to_meeting'),
  customStages: z.array(z.enum(JOURNEY_STAGE_INTENTS)).optional(),
});

export async function GET(req: NextRequest) {
  const accountName = req.nextUrl.searchParams.get('accountName');
  if (!accountName) {
    return NextResponse.json({ bundles: [] });
  }
  const rows = await prisma.generatedContent.findMany({
    where: {
      account_name: accountName,
      content_type: 'one_pager',
    },
    orderBy: [{ created_at: 'desc' }],
    take: 120,
    select: {
      id: true,
      account_name: true,
      persona_name: true,
      campaign_id: true,
      version: true,
      is_published: true,
      version_metadata: true,
      created_at: true,
      content: true,
    },
  });

  const grouped = new Map<string, {
    bundleId: string;
    accountName: string;
    campaignId: number | null;
    assets: Array<{
      id: number;
      version: number;
      stageIntent: string;
      infographicType: string;
      sequencePosition: number | null;
      isPublished: boolean;
      createdAt: string;
      qualityScore: number;
    }>;
  }>();
  rows.forEach((row) => {
    const meta = parseInfographicMetadata(row.version_metadata);
    if (!meta.bundleId) return;
    if (!grouped.has(meta.bundleId)) {
      grouped.set(meta.bundleId, {
        bundleId: meta.bundleId,
        accountName: row.account_name,
        campaignId: row.campaign_id ?? null,
        assets: [],
      });
    }
    const entry = grouped.get(meta.bundleId);
    if (!entry) return;
    entry.assets.push({
      id: row.id,
      version: row.version,
      stageIntent: meta.stageIntent,
      infographicType: meta.infographicType,
      sequencePosition: meta.sequencePosition,
      isPublished: row.is_published,
      createdAt: row.created_at.toISOString(),
      qualityScore: Math.max(50, Math.min(95, 55 + (row.content.length % 35))),
    });
  });

  const bundles = [...grouped.values()]
    .map((bundle) => ({
      ...bundle,
      assets: bundle.assets.sort((left, right) => (left.sequencePosition ?? 999) - (right.sequencePosition ?? 999)),
    }))
    .sort((left, right) => right.assets[0]?.createdAt.localeCompare(left.assets[0]?.createdAt ?? '') ?? 0);

  return NextResponse.json({ bundles });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BundleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const stages = buildBundleStageSequence(
    payload.preset === 'custom' ? 'custom' : (payload.preset as BundlePresetPathId),
    payload.customStages as Array<'cold' | 'engaged' | 'discovery' | 'evaluation' | 'proposal' | 'customer'> | undefined,
  );
  const assets = mapStageSequenceToAssets(stages);
  const bundleId = `bundle_${payload.accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${Date.now()}`;

  const latestVersion = await prisma.generatedContent.findFirst({
    where: {
      account_name: payload.accountName,
      content_type: 'one_pager',
    },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  let nextVersion = (latestVersion?.version ?? 0) + 1;

  const created = [];
  for (const asset of assets) {
    const content = {
      title: `${asset.stageIntent.toUpperCase()} | ${asset.infographicType.replaceAll('_', ' ')}`,
      narrative: `Generated bundle asset for ${payload.accountName} at ${asset.stageIntent} stage.`,
      proof_block: 'Attach current operating proof, benchmark deltas, and target next-step.',
      cta: 'Confirm next meeting milestone and operator owner.',
      stage_intent: asset.stageIntent,
      infographic_type: asset.infographicType,
    };

    const row = await prisma.generatedContent.create({
      data: {
        account_name: payload.accountName,
        campaign_id: payload.campaignId ?? null,
        persona_name: payload.personaName ?? null,
        content_type: 'one_pager',
        tone: 'professional',
        provider_used: 'bundle_builder',
        version: nextVersion++,
        version_metadata: {
          source: 'bundle_builder',
          infographic: {
            infographic_type: asset.infographicType,
            stage_intent: asset.stageIntent,
            bundle_id: bundleId,
            sequence_position: asset.sequencePosition,
          },
          template_registry: {
            taxonomy_version: 'v1',
            valid_type: INFOGRAPHIC_TYPES.includes(asset.infographicType),
          },
        },
        content: JSON.stringify(content),
      },
      select: {
        id: true,
        version: true,
        created_at: true,
      },
    });
    created.push({ ...asset, ...row });
  }

  await prisma.activity.create({
    data: {
      account_name: payload.accountName,
      campaign_id: payload.campaignId ?? null,
      activity_type: 'Infographic Bundle',
      owner: 'Casey',
      outcome: `Bundle created (${assets.length} assets)`,
      notes: JSON.stringify(buildInfographicEvent('bundle_created', {
        accountName: payload.accountName,
        campaignId: payload.campaignId,
        infographic_type: created[0]?.infographicType ?? 'cold_hook',
        stage_intent: created[0]?.stageIntent ?? 'cold',
        bundle_id: bundleId,
        sequence_position: 1,
      })),
      activity_date: new Date(),
    },
  }).catch(() => undefined);

  return NextResponse.json({
    success: true,
    bundleId,
    assets: created,
  });
}
