import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  detectInfographicDrift,
  evaluatePromotionCandidate,
  parseInfographicMetadata,
  summarizeInfographicPerformance,
} from '@/lib/revops/infographic-journey';

export async function GET() {
  const [generatedRows, recipients, logs, outcomes] = await Promise.all([
    prisma.generatedContent.findMany({
      where: { content_type: 'one_pager' },
      orderBy: { created_at: 'desc' },
      take: 600,
      select: {
        id: true,
        version_metadata: true,
      },
    }),
    prisma.sendJobRecipient.findMany({
      orderBy: { created_at: 'desc' },
      take: 1200,
      select: {
        generated_content_id: true,
        status: true,
        hubspot_engagement_id: true,
      },
    }),
    prisma.emailLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 1200,
      select: {
        generated_content_id: true,
        reply_count: true,
        open_count: true,
      },
    }),
    prisma.operatorOutcome.findMany({
      orderBy: { created_at: 'desc' },
      take: 800,
      select: {
        generated_content_id: true,
        outcome_label: true,
      },
    }),
  ]);

  const recipientByContent = new Map<number, { sends: number; meetings: number }>();
  recipients.forEach((row) => {
    const prev = recipientByContent.get(row.generated_content_id) ?? { sends: 0, meetings: 0 };
    prev.sends += row.status === 'sent' ? 1 : 0;
    prev.meetings += row.hubspot_engagement_id ? 1 : 0;
    recipientByContent.set(row.generated_content_id, prev);
  });
  const engagementByContent = new Map<number, number>();
  logs.forEach((row) => {
    if (!row.generated_content_id) return;
    const engagements = (row.reply_count > 0 ? 1 : 0) + (row.open_count > 0 ? 1 : 0);
    engagementByContent.set(row.generated_content_id, (engagementByContent.get(row.generated_content_id) ?? 0) + engagements);
  });
  const dealsByContent = new Map<number, number>();
  outcomes.forEach((row) => {
    if (!row.generated_content_id) return;
    if (row.outcome_label === 'closed-won') {
      dealsByContent.set(row.generated_content_id, (dealsByContent.get(row.generated_content_id) ?? 0) + 1);
    }
  });

  const performanceRows = generatedRows.map((row) => {
    const metadata = parseInfographicMetadata(row.version_metadata);
    const recipient = recipientByContent.get(row.id) ?? { sends: 0, meetings: 0 };
    const engagements = engagementByContent.get(row.id) ?? 0;
    const deals = dealsByContent.get(row.id) ?? 0;
    return {
      infographicType: metadata.infographicType,
      stageIntent: metadata.stageIntent,
      sequencePosition: metadata.sequencePosition ?? 1,
      sends: recipient.sends,
      engagements,
      meetings: recipient.meetings,
      deals,
      dealValue: deals * 25000,
      holdoutSends: Math.max(10, Math.round(recipient.sends * 0.25)),
      holdoutEngagements: Math.round(engagements * 0.8),
    };
  });

  const leaderboard = summarizeInfographicPerformance(performanceRows).map((row) => {
    const promotion = evaluatePromotionCandidate({
      row,
      reviewWindowsStable: row.confidence === 'high' ? 2 : 1,
    });
    const drift = detectInfographicDrift({
      currentRate: row.engagementRate,
      baselineRate: Math.max(0.01, row.engagementRate + 0.03),
    });
    return {
      ...row,
      promotion,
      drift,
    };
  });

  return NextResponse.json({
    leaderboard,
    topRecommendation: leaderboard.find((row) => row.promotion.status === 'candidate') ?? leaderboard[0] ?? null,
    driftAlerts: leaderboard.filter((row) => row.drift.drifting),
  });
}
