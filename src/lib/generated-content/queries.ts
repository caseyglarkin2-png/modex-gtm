import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/data';
import type { QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';
import { evaluateContentQuality } from '@/lib/content-quality';
import { computeChecklistCompleteness, getChecklistTemplate, type ChecklistItemId } from '@/lib/revops/content-qa-checklist';
import { computeRecipientReadiness } from '@/lib/revops/recipient-readiness';
import { parseInfographicMetadata } from '@/lib/revops/infographic-journey';

export type GenerationJobRecord = {
  account_name: string;
  status: string;
};

export type GeneratedContentRecord = {
  id: number;
  account_name: string;
  version: number;
  provider_used: string | null;
  external_send_count: number;
  is_published: boolean;
  content: string;
  version_metadata?: unknown;
  created_at: Date;
  campaign_id: number | null;
  campaign: {
    name: string;
    campaign_type: string;
    generation_contract?: {
      is_complete: boolean;
      quality_score: number;
    } | null;
  } | null;
  checklist_state?: {
    completed_item_ids: string[];
  } | null;
};

export type PersonaRecord = {
  id: number;
  account_name: string;
  name: string;
  email: string | null;
  title: string | null;
  role_in_deal: string | null;
  email_confidence: number;
  quality_score: number;
  last_enriched_at: Date | null;
};

export type WorkspaceRecipient = {
  id: number;
  name: string;
  email: string;
  title?: string;
  readiness: ReturnType<typeof computeRecipientReadiness>;
  role_in_deal?: string;
};

export type GeneratedContentWorkspaceData = {
  cards: QueueGeneratedAccountCard[];
  recipientsByAccount: Record<string, WorkspaceRecipient[]>;
};

export function buildGeneratedContentWorkspaceData(
  generatedRows: GeneratedContentRecord[],
  jobs: GenerationJobRecord[],
  recipients: PersonaRecord[],
): GeneratedContentWorkspaceData {
  const recipientsByAccount = recipients.reduce<Record<string, WorkspaceRecipient[]>>((acc, persona) => {
    if (!persona.email) return acc;
    if (!acc[persona.account_name]) acc[persona.account_name] = [];
    acc[persona.account_name].push({
      id: persona.id,
      name: persona.name,
      email: persona.email,
      title: persona.title ?? undefined,
      role_in_deal: persona.role_in_deal ?? undefined,
      readiness: computeRecipientReadiness({
        email_confidence: persona.email_confidence,
        quality_score: persona.quality_score,
        title: persona.title,
        role_in_deal: persona.role_in_deal,
        last_enriched_at: persona.last_enriched_at,
      }),
    });
    return acc;
  }, {});

  const queueCountsByAccount = jobs.reduce<Record<string, { pending: number; processing: number }>>((acc, job) => {
    if (!acc[job.account_name]) acc[job.account_name] = { pending: 0, processing: 0 };
    if (job.status === 'pending') acc[job.account_name].pending += 1;
    if (job.status === 'processing') acc[job.account_name].processing += 1;
    return acc;
  }, {});

  const cardMap = generatedRows.reduce<Record<string, QueueGeneratedAccountCard>>((acc, row) => {
    if (!acc[row.account_name]) {
      const counts = queueCountsByAccount[row.account_name] ?? { pending: 0, processing: 0 };
      acc[row.account_name] = {
        account_name: row.account_name,
        account_slug: slugify(row.account_name),
        latest_version: row.version,
        pending_jobs: counts.pending,
        processing_jobs: counts.processing,
        campaign_names: [],
        versions: [],
      };
    }

    const card = acc[row.account_name];
    const infographic = parseInfographicMetadata(row.version_metadata);
    const version = {
      id: row.id,
      version: row.version,
      provider_used: row.provider_used,
      external_send_count: row.external_send_count,
      is_published: row.is_published,
      content: row.content,
      created_at: row.created_at.toISOString(),
      campaign_id: row.campaign_id ?? undefined,
      campaign_name: row.campaign?.name ?? undefined,
      campaign_type: row.campaign?.campaign_type ?? undefined,
      contract: row.campaign?.generation_contract
        ? {
          complete: row.campaign.generation_contract.is_complete,
          qualityScore: row.campaign.generation_contract.quality_score,
        }
        : undefined,
      quality: evaluateContentQuality(row.content, row.account_name),
      checklist: computeChecklistCompleteness(
        getChecklistTemplate(row.campaign?.campaign_type),
        ((row.checklist_state?.completed_item_ids ?? []) as ChecklistItemId[]),
      ),
      checklist_completed_item_ids: row.checklist_state?.completed_item_ids ?? [],
      infographic_type: infographic.infographicType,
      stage_intent: infographic.stageIntent,
      bundle_id: infographic.bundleId,
      sequence_position: infographic.sequencePosition,
    };
    card.versions.push(version);

    if (version.campaign_name && !card.campaign_names.includes(version.campaign_name)) {
      card.campaign_names.push(version.campaign_name);
    }
    return acc;
  }, {});

  const cards = Object.values(cardMap)
    .map((card) => ({
      ...card,
      campaign_names: [...card.campaign_names].sort((left, right) => left.localeCompare(right)),
      versions: [...card.versions].sort((left, right) => right.version - left.version),
    }))
    .sort((left, right) => left.account_name.localeCompare(right.account_name));

  return { cards, recipientsByAccount };
}

export async function fetchGeneratedContentWorkspaceData(): Promise<GeneratedContentWorkspaceData> {
  const [jobs, generatedRows] = await Promise.all([
    prisma.generationJob.findMany({
      orderBy: { created_at: 'desc' },
      take: 150,
      select: { account_name: true, status: true },
    }),
    prisma.generatedContent.findMany({
      where: { content_type: 'one_pager' },
      orderBy: [{ account_name: 'asc' }, { version: 'desc' }],
      take: 500,
      select: {
        id: true,
        account_name: true,
        version: true,
        provider_used: true,
        external_send_count: true,
        is_published: true,
        content: true,
        created_at: true,
        version_metadata: true,
        campaign_id: true,
        campaign: {
          select: {
            name: true,
            campaign_type: true,
            generation_contract: {
              select: {
                is_complete: true,
                quality_score: true,
              },
            },
          },
        },
        checklist_state: {
          select: {
            completed_item_ids: true,
          },
        },
      },
    }),
  ]);

  const accountsWithGenerated = Array.from(new Set(generatedRows.map((row) => row.account_name)));
  const recipients = accountsWithGenerated.length > 0
    ? await prisma.persona.findMany({
        where: {
          account_name: { in: accountsWithGenerated },
          email: { not: null },
          do_not_contact: false,
        },
        select: {
          id: true,
          account_name: true,
          name: true,
          email: true,
          title: true,
          role_in_deal: true,
          email_confidence: true,
          quality_score: true,
          last_enriched_at: true,
        },
        orderBy: [{ account_name: 'asc' }, { name: 'asc' }],
      })
    : [];

  return buildGeneratedContentWorkspaceData(
    generatedRows as GeneratedContentRecord[],
    jobs as GenerationJobRecord[],
    recipients as PersonaRecord[],
  );
}

export function computeGenerationQueueStats(jobs: Array<{ status: string }>) {
  return {
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };
}
