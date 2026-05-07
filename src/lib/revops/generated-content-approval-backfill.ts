import type { PrismaClient } from '@prisma/client';

export type GeneratedContentApprovalBackfillResult = {
  scanned: number;
  created: number;
  skipped: number;
  dryRun: boolean;
  sampleGeneratedContentIds: number[];
};

export async function backfillGeneratedContentApprovals(
  prisma: PrismaClient,
  input?: {
    dryRun?: boolean;
    limit?: number;
    actor?: string;
  },
): Promise<GeneratedContentApprovalBackfillResult> {
  const dryRun = input?.dryRun ?? true;
  const limit = input?.limit ?? 500;
  const actor = input?.actor?.trim() || 'system-backfill';

  const candidates = await prisma.generatedContent.findMany({
    where: {
      message_evolution_current: {
        none: {},
      },
    },
    orderBy: [{ id: 'asc' }],
    take: limit,
    select: {
      id: true,
      account_name: true,
      campaign_id: true,
      content_type: true,
      created_at: true,
    },
  });

  if (dryRun) {
    return {
      scanned: candidates.length,
      created: 0,
      skipped: candidates.length,
      dryRun: true,
      sampleGeneratedContentIds: candidates.slice(0, 25).map((row) => row.id),
    };
  }

  let created = 0;
  for (const row of candidates) {
    await prisma.messageEvolutionRegistry.create({
      data: {
        account_name: row.account_name,
        campaign_id: row.campaign_id ?? null,
        generated_content_id: row.id,
        status: 'approved',
        owner: actor,
        reviewed_by: actor,
        reviewed_at: row.created_at ?? new Date(),
        rationale: `Legacy generated content backfill default approval (${row.content_type}).`,
        evidence_snapshot: {
          source: 'generated_content_approval_backfill',
          generated_content_id: row.id,
          content_type: row.content_type,
          actor,
        },
      },
      select: { id: true },
    });
    created += 1;
  }

  return {
    scanned: candidates.length,
    created,
    skipped: candidates.length - created,
    dryRun: false,
    sampleGeneratedContentIds: candidates.slice(0, 25).map((row) => row.id),
  };
}
