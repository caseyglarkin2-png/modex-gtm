import type { PrismaClient } from '@prisma/client';
import { applyOutcomeWeightToPlaybookScore } from '@/lib/revops/operator-outcomes';

export type PlaybookPerformanceInput = {
  usageCount: number;
  replyRate: number;
  meetingRate: number;
  sampleSize: number;
  outcomeWeight: number;
};

export function computePlaybookConfidence(sampleSize: number): number {
  if (sampleSize >= 80) return 1;
  if (sampleSize <= 0) return 0;
  return Number((sampleSize / 80).toFixed(4));
}

export function computePlaybookScore(input: PlaybookPerformanceInput): number {
  const base =
    (input.replyRate * 0.5) +
    (input.meetingRate * 0.35) +
    Math.min(0.15, input.usageCount / 1000);
  return Number((base * input.outcomeWeight * (0.6 + input.sampleSize / Math.max(40, input.sampleSize))).toFixed(4));
}

export function buildPlaybookTags(args: {
  industry?: string | null;
  persona?: string | null;
  stage?: string | null;
  motion?: string | null;
}): string[] {
  return [args.industry, args.persona, args.stage, args.motion]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));
}

export async function rankPlaybookBlocks(prisma: PrismaClient, limit = 30) {
  const [blocks, outcomes, attributionRows] = await Promise.all([
    prisma.playbookBlock.findMany({
      orderBy: { created_at: 'desc' },
      take: 250,
    }),
    prisma.operatorOutcome.findMany({
      orderBy: { created_at: 'desc' },
      take: 500,
      select: {
        outcome_label: true,
        generated_content_id: true,
      },
    }),
    prisma.sendJobRecipient.findMany({
      where: { status: 'sent' },
      orderBy: { created_at: 'desc' },
      take: 1200,
      select: {
        generated_content_id: true,
        status: true,
        hubspot_engagement_id: true,
        email_log: {
          select: {
            reply_count: true,
          },
        },
      },
    }),
  ]);

  const groupedAttribution = attributionRows.reduce<Record<number, { sends: number; replies: number; meetings: number }>>((acc, row) => {
    const id = row.generated_content_id;
    if (!acc[id]) acc[id] = { sends: 0, replies: 0, meetings: 0 };
    acc[id].sends += 1;
    if ((row.email_log?.reply_count ?? 0) > 0) acc[id].replies += 1;
    if (row.hubspot_engagement_id) acc[id].meetings += 1;
    return acc;
  }, {});

  const outcomesByContent = outcomes.reduce<Record<number, typeof outcomes>>((acc, row) => {
    if (!row.generated_content_id) return acc;
    if (!acc[row.generated_content_id]) acc[row.generated_content_id] = [];
    acc[row.generated_content_id].push(row);
    return acc;
  }, {});

  return blocks
    .map((block) => {
      const attributed = block.generated_content_id ? groupedAttribution[block.generated_content_id] : undefined;
      const sends = attributed?.sends ?? 0;
      const replies = attributed?.replies ?? 0;
      const meetings = attributed?.meetings ?? 0;
      const sampleSize = sends;
      const replyRate = sends > 0 ? replies / sends : 0;
      const meetingRate = sends > 0 ? meetings / sends : 0;
      const outcomeWeight = applyOutcomeWeightToPlaybookScore(
        1,
        block.generated_content_id ? (outcomesByContent[block.generated_content_id] ?? []) : [],
      );
      const confidence = computePlaybookConfidence(sampleSize);
      const score = computePlaybookScore({
        usageCount: block.usage_count,
        replyRate,
        meetingRate,
        sampleSize,
        outcomeWeight,
      });
      return {
        ...block,
        performance: {
          sends,
          replies,
          meetings,
          replyRate,
          meetingRate,
          sampleSize,
          outcomeWeight,
          confidence,
          score,
        },
      };
    })
    .sort((left, right) => right.performance.score - left.performance.score)
    .slice(0, limit);
}
