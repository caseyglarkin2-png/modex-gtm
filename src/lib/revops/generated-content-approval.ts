import type { PrismaClient } from '@prisma/client';

export type GeneratedContentApprovalDecision = {
  generatedContentId: number;
  required: boolean;
  approved: boolean;
  status: 'missing' | 'proposed' | 'in-review' | 'approved' | 'rejected' | 'deployed' | 'rolled-back';
  reviewId: string | null;
};

export async function requiresApprovalForSend(
  prisma: PrismaClient,
  generatedContentId: number,
): Promise<GeneratedContentApprovalDecision> {
  const latestReview = await prisma.messageEvolutionRegistry.findFirst({
    where: { generated_content_id: generatedContentId },
    orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
    select: {
      id: true,
      status: true,
    },
  });

  if (!latestReview) {
    return {
      generatedContentId,
      required: true,
      approved: false,
      status: 'missing',
      reviewId: null,
    };
  }

  const normalizedStatus = (
    latestReview.status === 'proposed'
    || latestReview.status === 'in-review'
    || latestReview.status === 'approved'
    || latestReview.status === 'rejected'
    || latestReview.status === 'deployed'
    || latestReview.status === 'rolled-back'
  ) ? latestReview.status : 'proposed';

  return {
    generatedContentId,
    required: true,
    approved: normalizedStatus === 'approved' || normalizedStatus === 'deployed',
    status: normalizedStatus,
    reviewId: latestReview.id,
  };
}
