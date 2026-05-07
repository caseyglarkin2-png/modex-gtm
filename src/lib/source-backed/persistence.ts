import type { PrismaClient } from '@prisma/client';
import type { SourceBackedContractV1 } from '@/lib/source-backed/attribution';

export async function persistSourceAttributionLinks(
  prisma: PrismaClient,
  input: {
    accountName: string;
    campaignId?: number | null;
    generatedContentId: number;
    attribution: SourceBackedContractV1 | null;
  },
) {
  if (!input.attribution) return;

  await Promise.all(
    input.attribution.evidence_refs.map(async (ref) => {
      await prisma.signalContentLink.upsert({
        where: {
          source_kind_source_id: {
            source_kind: 'source_evidence',
            source_id: `gc_${input.generatedContentId}:${ref.id}`,
          },
        },
        update: {
          account_name: input.accountName,
          campaign_id: input.campaignId ?? null,
          generated_content_id: input.generatedContentId,
          signal_kind: 'source_attribution',
          signal_context: ref.claim,
        },
        create: {
          account_name: input.accountName,
          campaign_id: input.campaignId ?? null,
          generated_content_id: input.generatedContentId,
          source_kind: 'source_evidence',
          source_id: `gc_${input.generatedContentId}:${ref.id}`,
          signal_kind: 'source_attribution',
          signal_context: ref.claim,
        },
      }).catch(() => undefined);
    }),
  );
}
